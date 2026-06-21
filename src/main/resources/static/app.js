/* ============================================================
   SnapLink — Frontend Logic
   Served by Spring Boot — same origin, no CORS needed
   ============================================================ */

// Always use the actual origin so fetch works whether served via
// Spring Boot (localhost:8093) or any other host/port
const API_BASE = window.location.origin;

/* ── file:// protocol guard ── */
if (window.location.protocol === 'file:') {
  window.addEventListener('DOMContentLoaded', () => {
    const alert = document.getElementById('errorAlert');
    const msg   = document.getElementById('errorMsg');
    if (alert && msg) {
      msg.textContent = 'This page must be opened via the server. Go to http://localhost:8093 in your browser.';
      alert.hidden = false;
    }
    const form = document.getElementById('shortenForm');
    if (form) {
      const btn = document.getElementById('submitBtn');
      if (btn) btn.disabled = true;
    }
  });
}

/* ── DOM refs ── */
const form          = document.getElementById('shortenForm');
const urlInput      = document.getElementById('urlInput');
const shortcodeInput= document.getElementById('shortcodeInput');
const validityInput = document.getElementById('validityInput');
const submitBtn     = document.getElementById('submitBtn');
const btnSpinner    = document.getElementById('btnSpinner');
const btnArrow      = submitBtn.querySelector('.btn-arrow');
const btnText       = submitBtn.querySelector('.btn-text');
const urlError      = document.getElementById('urlError');
const urlStatus     = document.getElementById('urlStatus');
const errorAlert    = document.getElementById('errorAlert');
const errorMsg      = document.getElementById('errorMsg');
const resultCard    = document.getElementById('resultCard');
const resultUrl     = document.getElementById('resultUrl');
const resultExpiry  = document.getElementById('resultExpiry');
const resultCode    = document.getElementById('resultCode');

/* ── Live URL validation ── */
urlInput.addEventListener('input', () => {
  const val = urlInput.value.trim();
  if (!val) {
    clearUrlStatus();
    return;
  }
  if (isValidUrl(val)) {
    urlInput.classList.remove('is-invalid');
    urlInput.classList.add('is-valid');
    urlStatus.textContent = '✅';
    urlError.textContent = '';
  } else {
    urlInput.classList.remove('is-valid');
    urlInput.classList.add('is-invalid');
    urlStatus.textContent = '❌';
    urlError.textContent = 'Enter a valid http:// or https:// URL';
  }
});

urlInput.addEventListener('blur', () => {
  if (!urlInput.value.trim()) clearUrlStatus();
});

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function clearUrlStatus() {
  urlInput.classList.remove('is-valid', 'is-invalid');
  urlStatus.textContent = '';
  urlError.textContent = '';
}

/* ── Form submit ── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const url       = urlInput.value.trim();
  const shortcode = shortcodeInput.value.trim();
  const validity  = validityInput.value.trim();

  /* Client-side guard */
  if (!url) {
    showFieldError(urlInput, urlError, 'URL is required');
    return;
  }
  if (!isValidUrl(url)) {
    showFieldError(urlInput, urlError, 'Enter a valid http:// or https:// URL');
    return;
  }
  if (validity && (isNaN(validity) || Number(validity) <= 0)) {
    showError('Validity must be a positive number of minutes.');
    return;
  }

  setLoading(true);

  const payload = { url };
  if (shortcode) payload.shortcode = shortcode;
  if (validity)  payload.validity  = parseInt(validity, 10);

  /* 10-second timeout — prevents infinite spinner if server is unreachable */
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 10000);

  let fetchSucceeded = false;
  try {
    console.log('[SnapLink] POST →', `${API_BASE}/shorturls/`, payload);
    const res = await fetch(`${API_BASE}/shorturls/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);
    fetchSucceeded = true;
    console.log('[SnapLink] Response status:', res.status);

    // Always parse JSON — both success and error bodies are JSON
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('SERVER_PARSE_ERROR');
    }

    console.log('[SnapLink] Parsed data:', data);

    if (!res.ok) {
      // Server returned ErrorResponse { message, timestamp }
      throw new Error(data.message || 'SERVER_ERROR');
    }

    showResult(data);
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[SnapLink] Error:', err.name, err.message, 'fetchSucceeded:', fetchSucceeded);

    if (err.name === 'AbortError') {
      showError('Request timed out. Please try again later.');
    } else if (!fetchSucceeded && err instanceof TypeError) {
      // Network failure — fetch couldn't reach the server at all
      showError('Unable to connect. Please check your connection and try again.');
    } else {
      showError(sanitizeError(err.message));
    }
  } finally {
    setLoading(false);
  }
});

/* ── Show result ── */
function showResult(data) {
  // data.shortLink = the shortcode (e.g. "abc123")
  // Redirect endpoint: GET /shorturls/{shortcode}
  const shortLink = data.shortLink;
  const fullUrl   = `${window.location.origin}/shorturls/${shortLink}`;

  resultUrl.href        = fullUrl;
  resultUrl.textContent = fullUrl;
  resultCode.textContent = shortLink;
  resultExpiry.textContent = data.expiry ? formatExpiry(data.expiry) : '—';

  // Hide form, show result
  form.style.display = 'none';
  resultCard.hidden  = false;

  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Reset ── */
function resetForm() {
  form.reset();
  clearUrlStatus();
  hideAlert();
  resultCard.hidden  = true;
  form.style.display = 'flex';
}

/* ── Copy to clipboard ── */
async function copyToClipboard() {
  const url  = resultUrl.href;
  const icon = document.getElementById('copyIcon');
  try {
    await navigator.clipboard.writeText(url);
    icon.textContent = '✅';
    setTimeout(() => { icon.textContent = '📋'; }, 2000);
  } catch {
    /* Fallback for non-secure contexts */
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    icon.textContent = '✅';
    setTimeout(() => { icon.textContent = '📋'; }, 2000);
  }
}

/* ── Alert helpers ── */
function showError(msg) {
  errorMsg.textContent = msg;
  errorAlert.hidden = false;
  errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAlert() {
  errorAlert.hidden = true;
}
function dismissAlert(id) {
  document.getElementById(id).hidden = true;
}

/**
 * Maps raw server error messages to safe, user-friendly text.
 * Never exposes ports, stack traces, class names, or internal details.
 */
function sanitizeError(raw) {
  if (!raw) return 'Something went wrong. Please try again.';

  const msg = raw.toLowerCase();

  // Specific backend messages from GlobalExceptionHandler
  if (msg === 'server_parse_error' || msg === 'server_error') {
    return 'Something went wrong on our end. Please try again later.';
  }
  if (msg.includes('cannot be empty') || msg.includes('blank')) {
    return 'Please enter a URL.';
  }
  if (msg.includes('invalid url') || msg.includes('url format') || msg.includes('only http')) {
    return 'The URL you entered is not valid. Please enter a full URL starting with http:// or https://';
  }
  if (msg.includes('expired') || msg.includes('expir')) {
    return 'This short link has expired. Please create a new one.';
  }
  if (msg.includes('not found')) {
    return 'This short link does not exist.';
  }
  if (msg.includes('already exists')) {
    return 'That custom code is already taken. Please choose a different one.';
  }
  if (msg.includes('validity') || msg.includes('greater than 0')) {
    return 'Validity must be greater than 0 minutes.';
  }

  // Fallback — never show raw internals
  return 'Something went wrong. Please try again.';
}

/* ── Field error ── */
function showFieldError(input, errorEl, msg) {
  input.classList.add('is-invalid');
  input.classList.remove('is-valid');
  urlStatus.textContent = '❌';
  errorEl.textContent = msg;
  input.focus();
}

/* ── Loading state ── */
function setLoading(on) {
  submitBtn.disabled  = on;
  btnSpinner.hidden   = !on;
  btnArrow.style.display = on ? 'none' : '';
  btnText.textContent = on ? 'Shortening…' : 'Shorten URL';
}

/* ── Format expiry date ── */
function formatExpiry(isoStr) {
  try {
    let date;
    if (Array.isArray(isoStr)) {
      // Fallback: Java LocalDateTime array [year,month,day,hour,min,sec,nano]
      const [yr, mo, day, hr, min] = isoStr;
      date = new Date(yr, mo - 1, day, hr, min);
    } else {
      // ISO string: "2026-06-21T14:30:00" — treat as local time
      date = new Date(isoStr);
    }
    if (isNaN(date.getTime())) return String(isoStr);
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(isoStr);
  }
}
