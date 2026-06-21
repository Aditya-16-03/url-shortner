package com.example.url.DTO;

import lombok.Data;

@Data
public class PostReqBody {
    private String url;
    private Integer validity;
    private String shortcode;
}
