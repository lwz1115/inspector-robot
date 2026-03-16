package com.example.find_robot.service;

import com.example.find_robot.entity.RobotData;
import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;

public interface RobotDataService extends IService<RobotData> {

    List<RobotData> findTop100ByOrderByTimestampDesc();

    List<RobotData> findByDeviceIdOrderByTimestampDesc(String deviceId);

    List<RobotData> findByAlertMessageIsNotNullOrderByTimestampDesc();

    List<RobotData> findByTimestampBetweenOrderByTimestampDesc(Long start, Long end);

    RobotData findLatestData();
}