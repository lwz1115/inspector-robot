package com.example.find_robot.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("robot_data")
public class RobotData {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("device_id")
    private String deviceId;

    @TableField("timestamp")
    private Long timestamp;

    // GPS数据字段添加@TableField注解
    @TableField("longitude")
    private Double longitude;

    @TableField("latitude")
    private Double latitude;

    @TableField("satellites")
    private Integer satellites;

    @TableField("altitude")
    private Double altitude;

    @TableField("speed")
    private Double speed;

    // 电压字段
    @TableField("voltage")
    private Double voltage;

    // 警报字段
    @TableField("alert_message")
    private String alertMessage;

    // 人员字段
    @TableField("person_count")
    private Integer personCount;

    // 电量字段
    @TableField("battery_level")
    private Integer batteryLevel;

    @TableField("created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // 添加构造方法
    public RobotData() {
        this.createdAt = LocalDateTime.now();
    }

    // 添加toString方法以便调试
    @Override
    public String toString() {
        return "RobotData{" +
                "id=" + id +
                ", deviceId='" + deviceId + '\'' +
                ", timestamp=" + timestamp +
                ", longitude=" + longitude +
                ", latitude=" + latitude +
                ", satellites=" + satellites +
                ", altitude=" + altitude +
                ", speed=" + speed +
                ", voltage=" + voltage +
                ", alertMessage='" + alertMessage + '\'' +
                ", personCount=" + personCount +
                ", batteryLevel=" + batteryLevel +
                ", createdAt=" + createdAt +
                '}';
    }
}