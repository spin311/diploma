package com.example.service;

import org.springframework.stereotype.Service;

@Service
public class PythonCodeService {


    public String downloadCode(String id, String code) {
        

        return String.format("Code with id %s and code %s has been downloaded", id, code);

    }
}
