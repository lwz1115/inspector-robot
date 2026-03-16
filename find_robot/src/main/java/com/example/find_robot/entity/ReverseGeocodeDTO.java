package com.example.find_robot.entity;

import lombok.Data;

@Data
public class ReverseGeocodeDTO {
    private Double longitude;
    private Double latitude;
    private String poiTypes; // 返回的POI类型
}