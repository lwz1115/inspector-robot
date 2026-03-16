package com.example.find_robot.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("locations")
public class Location {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String city;
    private String district;
    private String locationType; // 如：餐饮、交通、购物等
    private String createTime;
}