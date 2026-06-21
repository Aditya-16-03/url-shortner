package com.example.url.ExceptionHandling;

public class UrlExpiredException extends RuntimeException{
    public UrlExpiredException(String message){
        super(message);
    }
}
