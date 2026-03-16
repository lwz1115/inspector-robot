package com.example.find_robot.service.impl;

import com.alibaba.fastjson2.JSONObject;
import com.example.find_robot.config.AmapConfig;
import com.example.find_robot.entity.AmapResponse;
import com.example.find_robot.entity.LocationSearchDTO;
import com.example.find_robot.entity.ReverseGeocodeDTO;
import com.example.find_robot.service.LocationService;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class LocationServiceImpl implements LocationService {

    @Autowired
    private AmapConfig amapConfig;

    @Override
    public AmapResponse searchPlaces(LocationSearchDTO searchDTO) {
        try {
            StringBuilder urlBuilder = new StringBuilder();
            urlBuilder.append(amapConfig.getBaseUrl())
                    .append("/place/text?key=")
                    .append(amapConfig.getKey())
                    .append("&keywords=")
                    .append(URLEncoder.encode(searchDTO.getKeyword(), StandardCharsets.UTF_8.toString()));

            if (searchDTO.getCity() != null) {
                urlBuilder.append("&city=").append(URLEncoder.encode(searchDTO.getCity(), StandardCharsets.UTF_8.toString()));
            }

            if (searchDTO.getTypes() != null) {
                urlBuilder.append("&types=").append(URLEncoder.encode(searchDTO.getTypes(), StandardCharsets.UTF_8.toString()));
            }

            if (searchDTO.getLatitude() != null && searchDTO.getLongitude() != null) {
                urlBuilder.append("&location=").append(searchDTO.getLongitude()).append(",").append(searchDTO.getLatitude());
            }

            if (searchDTO.getRadius() != null) {
                urlBuilder.append("&radius=").append(searchDTO.getRadius());
            }

            if (searchDTO.getPage() != null) {
                urlBuilder.append("&page=").append(searchDTO.getPage());
            }

            if (searchDTO.getSize() != null) {
                urlBuilder.append("&size=").append(searchDTO.getSize());
            }

            urlBuilder.append("&extensions=all");

            return callAmapApi(urlBuilder.toString());
        } catch (Exception e) {
            log.error("搜索地点失败", e);
            return createErrorResponse("搜索失败: " + e.getMessage());
        }
    }

    @Override
    public AmapResponse reverseGeocode(ReverseGeocodeDTO geocodeDTO) {
        try {
            String url = amapConfig.getBaseUrl() + "/geocode/regeo?key=" + amapConfig.getKey() +
                    "&location=" + geocodeDTO.getLongitude() + "," + geocodeDTO.getLatitude() +
                    "&extensions=all";

            if (geocodeDTO.getPoiTypes() != null) {
                url += "&poitype=" + URLEncoder.encode(geocodeDTO.getPoiTypes(), StandardCharsets.UTF_8.toString());
            }

            return callAmapApi(url);
        } catch (Exception e) {
            log.error("逆地理编码失败", e);
            return createErrorResponse("逆地理编码失败: " + e.getMessage());
        }
    }

    @Override
    public AmapResponse aroundSearch(Double longitude, Double latitude, Integer radius, String keyword) {
        try {
            StringBuilder urlBuilder = new StringBuilder();
            urlBuilder.append(amapConfig.getBaseUrl())
                    .append("/place/around?key=")
                    .append(amapConfig.getKey())
                    .append("&location=")
                    .append(longitude)
                    .append(",")
                    .append(latitude);

            if (radius != null) {
                urlBuilder.append("&radius=").append(radius);
            } else {
                urlBuilder.append("&radius=3000"); // 默认3公里
            }

            if (keyword != null && !keyword.isEmpty()) {
                urlBuilder.append("&keywords=").append(URLEncoder.encode(keyword, StandardCharsets.UTF_8.toString()));
            }

            urlBuilder.append("&extensions=all");

            return callAmapApi(urlBuilder.toString());
        } catch (Exception e) {
            log.error("周边搜索失败", e);
            return createErrorResponse("周边搜索失败: " + e.getMessage());
        }
    }

    @Override
    public AmapResponse inputTips(String keywords, String city) {
        try {
            StringBuilder urlBuilder = new StringBuilder();
            urlBuilder.append(amapConfig.getBaseUrl())
                    .append("/assistant/inputtips?key=")
                    .append(amapConfig.getKey())
                    .append("&keywords=")
                    .append(URLEncoder.encode(keywords, StandardCharsets.UTF_8.toString()));

            if (city != null && !city.isEmpty()) {
                urlBuilder.append("&city=").append(URLEncoder.encode(city, StandardCharsets.UTF_8.toString()));
            }

            return callAmapApi(urlBuilder.toString());
        } catch (Exception e) {
            log.error("输入提示失败", e);
            return createErrorResponse("输入提示失败: " + e.getMessage());
        }
    }

    private AmapResponse callAmapApi(String url) throws Exception {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(url);
            try (CloseableHttpResponse response = httpClient.execute(request)) {
                String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                return JSONObject.parseObject(responseBody, AmapResponse.class);
            }
        }
    }

    private AmapResponse createErrorResponse(String errorMessage) {
        AmapResponse response = new AmapResponse();
        response.setStatus(0);
        response.setInfo(errorMessage);
        return response;
    }
}