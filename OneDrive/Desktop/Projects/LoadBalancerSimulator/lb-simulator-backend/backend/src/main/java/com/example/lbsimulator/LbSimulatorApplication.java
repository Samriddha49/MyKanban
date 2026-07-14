package com.example.lbsimulator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LbSimulatorApplication {
    public static void main(String[] args) {
        SpringApplication.run(LbSimulatorApplication.class, args);
    }
}
