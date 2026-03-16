package com.example.find_robot.controller;

import com.example.find_robot.entity.RobotData;
import com.example.find_robot.service.RobotDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}