package com.example.find_robot.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.find_robot.entity.RobotData;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface RobotDataMapper extends BaseMapper<RobotData> {

    // 获取最新100条数据
    @Select("SELECT * FROM robot_data ORDER BY timestamp DESC LIMIT 100")
    List<RobotData> findTop100ByOrderByTimestampDesc();

    // 按设备ID获取数据
    @Select("SELECT * FROM robot_data WHERE device_id = #{deviceId} ORDER BY timestamp DESC")
    List<RobotData> findByDeviceIdOrderByTimestampDesc(String deviceId);

    // 获取警报数据
    @Select("SELECT * FROM robot_data WHERE alert_message IS NOT NULL AND alert_message != '' ORDER BY timestamp DESC")
    List<RobotData> findByAlertMessageIsNotNullOrderByTimestampDesc();

    // 按时间范围查询
    @Select("SELECT * FROM robot_data WHERE timestamp BETWEEN #{start} AND #{end} ORDER BY timestamp DESC")
    List<RobotData> findByTimestampBetweenOrderByTimestampDesc(Long start, Long end);

    // 获取最新一条数据
    @Select("SELECT * FROM robot_data ORDER BY timestamp DESC LIMIT 1")
    RobotData findLatestData();
}