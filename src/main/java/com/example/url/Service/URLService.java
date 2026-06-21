package com.example.url.Service;

import com.example.url.DTO.PostReqBody;
import com.example.url.DTO.PostResBody;
import com.example.url.ExceptionHandling.InvalidUrlException;
import com.example.url.ExceptionHandling.ShortCodeAlreadyExistsException;
import com.example.url.ExceptionHandling.UrlExpiredException;
import com.example.url.ExceptionHandling.UrlNotFoundException;
import com.example.url.Model.URLInfo;
import com.example.url.Repo.URLRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.Random;

@Service
public class URLService {

    @Autowired
    private URLRepo urlRepo;

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    public PostResBody getShortUrl(PostReqBody postReqBody) {

        if(postReqBody.getUrl() == null ||
                postReqBody.getUrl().isBlank()) {
            throw new InvalidUrlException("url Cannot be empty");
        }

        if(postReqBody.getValidity() != null &&
                postReqBody.getValidity() <= 0){
            throw new UrlExpiredException("Url validity should be greater than 0");
        }

        String code=postReqBody.getShortcode();
        if(postReqBody.getValidity()==null){
            postReqBody.setValidity(30);
        }

        try {
            URI uri = new URI(postReqBody.getUrl());

            if(uri.getScheme() == null || uri.getHost() == null) {
                throw new InvalidUrlException("Invalid URL");
            }

            if(!uri.getScheme().equalsIgnoreCase("http") &&
                    !uri.getScheme().equalsIgnoreCase("https")) {

                throw new InvalidUrlException(
                        "Only HTTP and HTTPS URLs are allowed"
                );
            }

        } catch (java.net.URISyntaxException e) {
            throw new InvalidUrlException("Invalid URL Format");
        }



        if(code !=null && !code.isBlank()){
           if(urlRepo.existsById(code)){
               throw new ShortCodeAlreadyExistsException("Short code already exists");
           }
           URLInfo info = new URLInfo(code,postReqBody.getUrl(),LocalDateTime.now(),LocalDateTime.now().plusMinutes(postReqBody.getValidity()));
           urlRepo.save(info);
           return new PostResBody(code,LocalDateTime.now().plusMinutes(postReqBody.getValidity()));
        }
        String shortCode;
        do{
            shortCode=generateShortCode();
        }while(urlRepo.existsById(shortCode));
        URLInfo info = new URLInfo(shortCode,postReqBody.getUrl(),LocalDateTime.now(),LocalDateTime.now().plusMinutes(postReqBody.getValidity()));
        urlRepo.save(info);
        return new PostResBody(shortCode,LocalDateTime.now().plusMinutes(postReqBody.getValidity()));

    }

    private String generateShortCode() {
        Random random= new Random();
        StringBuilder sb = new StringBuilder();
        for(int i=0;i<6;i++){
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    public String redirect(String shortcode) {

        URLInfo urlInfo = urlRepo.findById(shortcode)
                .orElseThrow(() ->
                        new UrlNotFoundException("URL not found"));
        if(urlInfo.getExpiry().isBefore(LocalDateTime.now())){
            throw new UrlExpiredException("url expired, create the short code and use it");
        }
        return urlInfo.getUrl();
    }
}
