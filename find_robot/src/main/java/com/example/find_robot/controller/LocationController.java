package com.example.find_robot.controller;

import com.example.find_robot.entity.AmapResponse;
import com.example.find_robot.entity.LocationSearchDTO;
import com.example.find_robot.entity.ReverseGeocodeDTO;
import com.example.find_robot.service.LocationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/location")
@CrossOrigin(origins = "*") // 允许跨域访问
public class LocationController {

    @Autowired
    private LocationService locationService;

    /**
     * 关键字搜索POI
     */
    @PostMapping("/search")
    public AmapResponse search(@RequestBody LocationSearchDTO searchDTO) {
        log.info("搜索地点: {}", searchDTO);
        return locationService.searchPlaces(searchDTO);
    }

    /**
     * 逆地理编码（根据经纬度获取地址）
     */
    @PostMapping("/reverse-geocode")
    public AmapResponse reverseGeocode(@RequestBody ReverseGeocodeDTO geocodeDTO) {
        log.info("逆地理编码: 经度={}, 纬度={}", geocodeDTO.getLongitude(), geocodeDTO.getLatitude());
        return locationService.reverseGeocode(geocodeDTO);
    }

    /**
     * 周边搜索
     */
    @GetMapping("/around")
    public AmapResponse aroundSearch(
            @RequestParam Double longitude,
            @RequestParam Double latitude,
            @RequestParam(required = false, defaultValue = "3000") Integer radius,
            @RequestParam(required = false) String keyword) {
        log.info("周边搜索: 经度={}, 纬度={}, 半径={}m, 关键词={}", longitude, latitude, radius, keyword);
        return locationService.aroundSearch(longitude, latitude, radius, keyword);
    }

    /**
     * 输入提示（自动完成）
     */
    @GetMapping("/input-tips")
    public AmapResponse inputTips(
            @RequestParam String keywords,
            @RequestParam(required = false) String city) {
        log.info("输入提示: 关键词={}, 城市={}", keywords, city);
        return locationService.inputTips(keywords, city);
    }

    /**
     * 路径规划（可以扩展）
     */
    @GetMapping("/route")
    public String routePlanning(
            @RequestParam String origin, // 起点经纬度
            @RequestParam String destination, // 终点经纬度
            @RequestParam(required = false, defaultValue = "0") Integer strategy) { // 策略：0-最快，1-最短等
        // 这里可以调用高德的路径规划API
        return "路径规划功能待实现";
    }
}