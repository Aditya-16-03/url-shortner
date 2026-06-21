package com.example.url.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class URLInfo {
    @Id
    private String shortcode;
    private String url;
    private LocalDateTime ArrivedAt;
    private LocalDateTime expiry;

}
