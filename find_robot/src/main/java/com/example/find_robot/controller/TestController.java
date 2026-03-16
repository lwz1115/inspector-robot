package com.example.find_robot.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/map")
    public Map<String, Object> testMapApi() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "地图API服务正常运行");
        result.put("data", Map.of(
                "search", "/api/location/search",
                "reverse-geocode", "/api/location/reverse-geocode",
                "around", "/api/location/around",
                "input-tips", "/api/location/input-tips"
        ));
        return result;
    }
}