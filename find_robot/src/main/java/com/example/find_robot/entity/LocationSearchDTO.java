package com.example.find_robot.entity;

import lombok.Data;

@Data
public class LocationSearchDTO {
    private String keyword;
    private String city;
    private String types; // 可选的POI类型
    private Double latitude; // 中心点纬度
    private Double longitude; // 中心点经度
    private Integer radius; // 搜索半径（米）
    private Integer page; // 页码
    private Integer size; // 每页大小
}