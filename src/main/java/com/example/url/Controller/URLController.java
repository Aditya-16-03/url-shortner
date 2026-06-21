package com.example.url.Controller;

import com.example.url.DTO.PostReqBody;
import com.example.url.DTO.PostResBody;
import com.example.url.Service.URLService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/shorturls")
public class URLController {

    @Autowired
    private URLService urlService;
    @PostMapping("/")
    public PostResBody getShortUrl(@RequestBody PostReqBody postReqBody){
        return urlService.getShortUrl(postReqBody);
    }

    @GetMapping("/{shortcode}")
    public ResponseEntity<Void> redirect(@PathVariable String shortcode){
        String url=urlService.redirect(shortcode);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

}
