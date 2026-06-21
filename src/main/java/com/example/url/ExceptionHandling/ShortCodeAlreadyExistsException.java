package com.example.url.ExceptionHandling;

public class ShortCodeAlreadyExistsException
        extends RuntimeException {

    public ShortCodeAlreadyExistsException(String message) {
        super(message);
    }
}