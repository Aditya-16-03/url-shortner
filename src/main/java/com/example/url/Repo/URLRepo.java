package com.example.url.Repo;

import com.example.url.Model.URLInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface URLRepo extends JpaRepository<URLInfo,String> {
}
