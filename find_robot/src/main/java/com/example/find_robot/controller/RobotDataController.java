package com.example.find_robot.controller;

import com.example.find_robot.entity.RobotData;
import com.example.find_robot.service.RobotDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/robot-data")
@CrossOrigin(origins = "*")
public class RobotDataController {

    @Autowired
    private RobotDataService robotDataService;

    // 获取所有数据（最新100条）
    @GetMapping
    public List<RobotData> getAllData() {
        return robotDataService.findTop100ByOrderByTimestampDesc();
    }

    // 按设备ID获取数据
    @GetMapping("/device/{deviceId}")
    public List<RobotData> getDataByDevice(@PathVariable String deviceId) {
        return robotDataService.findByDeviceIdOrderByTimestampDesc(deviceId);
    }

    // 获取警报数据
    @GetMapping("/alerts")
    public List<RobotData> getAlertData() {
        return robotDataService.findByAlertMessageIsNotNullOrderByTimestampDesc();
    }

    // 获取最新一条数据
    @GetMapping("/latest")
    public RobotData getLatestData() {
        return robotDataService.findLatestData();
    }

    // 按时间范围查询
    @GetMapping("/time-range")
    public List<RobotData> getDataByTimeRange(@RequestParam Long start, @RequestParam Long end) {
        return robotDataService.findByTimestampBetweenOrderByTimestampDesc(start, end);
    }

    // Jetson HTTP 推送接口
    @PostMapping("/push")
    public Map<String, Object> pushData(@RequestBody Map<String, Object> payload) {
        Map<String, Object> result = new HashMap<>();
        try {
            RobotData data = new RobotData();
            data.setDeviceId(payload.getOrDefault("device_id", "find_robot").toString());

            // 时间戳
            Object ts = payload.get("timestamp");
            data.setTimestamp(ts != null ? Long.parseLong(ts.toString()) : System.currentTimeMillis());

            // GPS
            if (payload.containsKey("longitude")) data.setLongitude(Double.parseDouble(payload.get("longitude").toString()));
            if (payload.containsKey("latitude"))  data.setLatitude(Double.parseDouble(payload.get("latitude").toString()));
            if (payload.containsKey("satellites")) data.setSatellites(Integer.parseInt(payload.get("satellites").toString()));
            if (payload.containsKey("altitude"))  data.setAltitude(Double.parseDouble(payload.get("altitude").toString()));
            if (payload.containsKey("speed"))     data.setSpeed(Double.parseDouble(payload.get("speed").toString()));

            // 电压 & 电量
            if (payload.containsKey("voltage")) {
                double voltage = Double.parseDouble(payload.get("voltage").toString());
                data.setVoltage(voltage);
                // 简单线性映射：6.0V=0%, 8.4V=100%
                int level = (int) Math.min(100, Math.max(0, (voltage - 6.0) / (8.4 - 6.0) * 100));
                data.setBatteryLevel(level);
            }

            // 温湿度
            if (payload.containsKey("temperature")) data.setTemperature(Double.parseDouble(payload.get("temperature").toString()));
            if (payload.containsKey("humidity"))    data.setHumidity(Double.parseDouble(payload.get("humidity").toString()));

            // 烟雾值 & 告警
            if (payload.containsKey("smoke_value")) {
                int smokeValue = Integer.parseInt(payload.get("smoke_value").toString());
                data.setSmokeValue(smokeValue);
                if (smokeValue >= 500) {
                    data.setAlertMessage("⚠️ 明显烟雾/明火！烟雾值: " + smokeValue + "，较多烟雾或靠近火源，请立即处理！");
                } else if (smokeValue >= 200) {
                    data.setAlertMessage("⚠️ 轻微烟雾，烟雾值: " + smokeValue + "，检测到打火机气体或香烟烟雾");
                } else if (payload.containsKey("alert_message")) {
                    data.setAlertMessage(payload.get("alert_message").toString());
                }
            } else if (payload.containsKey("alert_message")) {
                data.setAlertMessage(payload.get("alert_message").toString());
            }

            data.setCreatedAt(LocalDateTime.now());
            robotDataService.save(data);

            result.put("success", true);
            result.put("message", "数据保存成功");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "保存失败: " + e.getMessage());
        }
        return result;
    }
}