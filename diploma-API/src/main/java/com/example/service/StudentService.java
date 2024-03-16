package com.example.service;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class StudentService {

    public String getStudentId() {
        return UUID.randomUUID().toString();
    }
}
