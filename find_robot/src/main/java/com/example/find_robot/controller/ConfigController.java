package com.example.find_robot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    @Value("${jetson.ip:}")
    private String jetsonIpConfig;

    @GetMapping("/jetson-ip")
    public Map<String, Object> getJetsonIp() {
        List<String> ips = Arrays.stream(jetsonIpConfig.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
        return Map.of("ips", ips);
    }
}
