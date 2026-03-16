package com.example.find_robot.service;

import com.example.find_robot.entity.AmapResponse;
import com.example.find_robot.entity.LocationSearchDTO;
import com.example.find_robot.entity.ReverseGeocodeDTO;

public interface LocationService {
    /**
     * 关键字搜索地点
     */
    AmapResponse searchPlaces(LocationSearchDTO searchDTO);

    /**
     * 逆地理编码：根据经纬度获取地址信息
     */
    AmapResponse reverseGeocode(ReverseGeocodeDTO geocodeDTO);

    /**
     * 周边搜索
     */
    AmapResponse aroundSearch(Double longitude, Double latitude, Integer radius, String keyword);

    /**
     * 输入提示（自动完成）
     */
    AmapResponse inputTips(String keywords, String city);
}