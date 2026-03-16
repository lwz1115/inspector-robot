package com.example.find_robot.controller;

import com.example.find_robot.entity.RobotData;
import com.example.find_robot.service.RobotDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/route")
@CrossOrigin(origins = "*")
public class RouteController {

    @Autowired
    private RobotDataService robotDataService;

    // 获取路径规划（假设你已经集成了高德地图API）
    @PostMapping("/plan")
    public Map<String, Object> planRoute(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 从请求中获取起点和终点
            double startLng = (double) request.get("startLng");
            double startLat = (double) request.get("startLat");
            double endLng = (double) request.get("endLng");
            double endLat = (double) request.get("endLat");

            // 这里调用高德地图的路径规划API
            // 注意：你需要在高德地图开放平台申请Key

            // 模拟返回路径点（实际应该调用高德地图API）
            Map<String, Object> routeData = new HashMap<>();
            routeData.put("distance", 1.5); // 公里
            routeData.put("duration", 18); // 分钟
            routeData.put("points", generateMockRoutePoints(startLng, startLat, endLng, endLat));

            response.put("success", true);
            response.put("data", routeData);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "路径规划失败: " + e.getMessage());
        }

        return response;
    }

    // 模拟生成路径点（实际应该调用高德地图API）
    private Object generateMockRoutePoints(double startLng, double startLat, double endLng, double endLat) {
        // 生成一个简单的曲线路径（实际应用中应该调用地图API）
        return new Object[] {
                new double[]{startLng, startLat},
                new double[]{startLng + (endLng - startLng) * 0.3, startLat + (endLat - startLat) * 0.3},
                new double[]{startLng + (endLng - startLng) * 0.7, startLat + (endLat - startLat) * 0.7},
                new double[]{endLng, endLat}
        };
    }

    // 使用高德地图API的路径规划（如果已经配置了高德地图）
    @PostMapping("/plan-amap")
    public Map<String, Object> planRouteAmap(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String origin = request.get("startLng") + "," + request.get("startLat");
            String destination = request.get("endLng") + "," + request.get("endLat");
            String strategy = (String) request.getOrDefault("strategy", "0"); // 0-速度优先，1-费用优先，2-距离优先

            // 这里应该调用高德地图的路径规划API
            // String url = "https://restapi.amap.com/v5/direction/driving?key=YOUR_KEY&origin=" + origin + "&destination=" + destination + "&strategy=" + strategy;

            // 模拟响应
            response.put("success", true);
            response.put("data", createMockAmapResponse());

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return response;
    }

    private Map<String, Object> createMockAmapResponse() {
        Map<String, Object> mockResponse = new HashMap<>();

        // 模拟高德地图API返回的数据结构
        mockResponse.put("route", new HashMap<String, Object>() {{
            put("paths", new Object[] {
                    new HashMap<String, Object>() {{
                        put("distance", 1520); // 米
                        put("duration", 1080); // 秒
                        put("steps", new Object[] {
                                new HashMap<String, Object>() {{
                                    put("polyline", "118.93069167,32.1230155;118.93089167,32.1232155");
                                }}
                        });
                    }}
            });
        }});

        return mockResponse;
    }
}