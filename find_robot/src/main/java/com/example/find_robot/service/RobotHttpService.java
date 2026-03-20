package com.example.find_robot.service;

import com.example.find_robot.entity.RobotData;
import com.example.find_robot.repository.RobotDataMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class RobotHttpService {

    private static final Logger logger = LoggerFactory.getLogger(RobotHttpService.class);

    private final RobotDataMapper robotDataMapper;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // Jetson 目的地接收接口地址，可在 application.properties 中配置
    @Value("${jetson.destination.url:http://10.234.236.100:8082/destination}")
    private String jetsonDestinationUrl;

    public RobotHttpService(RobotDataMapper robotDataMapper) {
        this.robotDataMapper = robotDataMapper;
    }

    /**
     * 通过 HTTP POST 将目的地坐标发送到 Jetson
     */
    public boolean publishDestination(double longitude, double latitude) {
        return publishDestination(longitude, latitude, null);
    }

    /**
     * 通过 HTTP POST 将目的地坐标发送到 Jetson
     */
    public boolean publishDestination(double longitude, double latitude, String locationName) {
        try {
            ObjectNode payload = mapper.createObjectNode();
            payload.put("longitude", longitude);
            payload.put("latitude", latitude);
            payload.put("timestamp", System.currentTimeMillis());
            if (locationName != null && !locationName.trim().isEmpty()) {
                payload.put("name", locationName);
            }

            String body = payload.toString();
            logger.info("HTTP 推送目的地到 Jetson: {} -> {}", jetsonDestinationUrl, body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(jetsonDestinationUrl))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("✅ 目的地发送成功，Jetson 响应: {}", response.body());
                saveDestinationToDatabase(longitude, latitude, locationName);
                return true;
            } else {
                logger.error("Jetson 返回错误状态码: {}", response.statusCode());
                return false;
            }

        } catch (Exception e) {
            logger.error("HTTP 推送目的地失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 保存目的地记录到数据库
     */
    private void saveDestinationToDatabase(double longitude, double latitude, String locationName) {
        try {
            RobotData record = new RobotData();
            record.setDeviceId("DESTINATION_RECORD");
            record.setTimestamp(System.currentTimeMillis());
            record.setLongitude(longitude);
            record.setLatitude(latitude);
            record.setAlertMessage("目的地设置: " + (locationName != null ? locationName : "未知位置"));
            record.setCreatedAt(LocalDateTime.now());
            robotDataMapper.insert(record);
        } catch (Exception e) {
            logger.error("保存目的地记录失败: {}", e.getMessage());
        }
    }

    /**
     * 返回连接状态描述（HTTP 方式始终可用）
     */
    public String getConnectionInfo() {
        return "HTTP 模式，Jetson 地址: " + jetsonDestinationUrl;
    }

    /**
     * HTTP 方式不需要持久连接，始终返回 true
     */
    public boolean isConnected() {
        return true;
    }
}
