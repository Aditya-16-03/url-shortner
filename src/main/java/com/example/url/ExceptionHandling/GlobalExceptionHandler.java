package com.example.url.ExceptionHandling;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidUrlException.class)
    public ResponseEntity<ErrorResponse> handleInvalidUrlException(InvalidUrlException e){
        ErrorResponse err= new ErrorResponse(e.getMessage(), LocalDateTime.now());
        return new ResponseEntity<>(err,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UrlExpiredException.class)
    public ResponseEntity<ErrorResponse> handleUrlExpiredException(UrlExpiredException e){
        ErrorResponse err = new ErrorResponse(e.getMessage(),LocalDateTime.now());
        return new ResponseEntity<>(err,HttpStatus.GONE);
    }

    @ExceptionHandler(UrlNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUrlNotFoundException(UrlNotFoundException e){
        ErrorResponse err = new ErrorResponse(e.getMessage(),LocalDateTime.now());
        return new ResponseEntity<>(err,HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ShortCodeAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleShortCodeAlreadyExistsException(ShortCodeAlreadyExistsException e){
        ErrorResponse err = new ErrorResponse(e.getMessage(),LocalDateTime.now());
        return new ResponseEntity<>(err,HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e){
        ErrorResponse err = new ErrorResponse("An unexpected error occurred",LocalDateTime.now());
        return new ResponseEntity<>(err,HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
