package com.example.find_robot.entity;

import com.alibaba.fastjson2.JSONObject;
import lombok.Data;

import java.util.List;

@Data
public class AmapResponse {
    private Integer status;
    private String info;
    private String infocode;
    private Integer count;
    private List<POI> pois;
    private Regeocode regeocode;

    @Data
    public static class POI {
        private String id;
        private String name;
        private String type;
        private String typecode;
        private String address;
        private String location; // "经度,纬度"
        private String pname; // 省份
        private String cityname; // 城市
        private String adname; // 区域
        private String tel; // 电话
        private String distance; // 距离中心点距离
    }

    @Data
    public static class Regeocode {
        private String formatted_address;
        private AddressComponent addressComponent;
        private List<POI> pois;

        @Data
        public static class AddressComponent {
            private String province;
            private String city;
            private String district;
            private String township;
            private String street;
            private String streetNumber;
        }
    }
}