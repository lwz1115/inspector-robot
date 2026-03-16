package com.example.find_robot.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.find_robot.entity.RobotData;
import com.example.find_robot.repository.RobotDataMapper;
import com.example.find_robot.service.RobotDataService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RobotDataServiceImpl extends ServiceImpl<RobotDataMapper, RobotData> implements RobotDataService {

    private final RobotDataMapper robotDataMapper;

    public RobotDataServiceImpl(RobotDataMapper robotDataMapper) {
        this.robotDataMapper = robotDataMapper;
    }

    @Override
    public List<RobotData> findTop100ByOrderByTimestampDesc() {
        return robotDataMapper.findTop100ByOrderByTimestampDesc();
    }

    @Override
    public List<RobotData> findByDeviceIdOrderByTimestampDesc(String deviceId) {
        return robotDataMapper.findByDeviceIdOrderByTimestampDesc(deviceId);
    }

    @Override
    public List<RobotData> findByAlertMessageIsNotNullOrderByTimestampDesc() {
        return robotDataMapper.findByAlertMessageIsNotNullOrderByTimestampDesc();
    }

    @Override
    public List<RobotData> findByTimestampBetweenOrderByTimestampDesc(Long start, Long end) {
        return robotDataMapper.findByTimestampBetweenOrderByTimestampDesc(start, end);
    }

    @Override
    public RobotData findLatestData() {
        return robotDataMapper.findLatestData();
    }
}