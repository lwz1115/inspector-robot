package com.example.find_robot.service;

import com.example.find_robot.entity.RobotData;
import com.example.find_robot.repository.RobotDataMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;

@Service
public class MqttRobotSubscriber {

    private static final Logger logger = LoggerFactory.getLogger(MqttRobotSubscriber.class);

    private final RobotDataMapper robotDataMapper;
    private final ObjectMapper mapper = new ObjectMapper();

    // 阿里云IoT配置
    private static final String PRODUCT_KEY = "j1nzhwCFtTs";
    private static final String DEVICE_NAME = "WeChat_APP";
    private static final String DEVICE_SECRET = "3f66bb8eb00ceac55b2b3552e7ddf951";

    private static final String MQTT_BROKER = "tcp://iot-06z00h6fv9ahqgk.mqtt.iothub.aliyuncs.com:1883";
    private static final String SUB_TOPIC = "/" + PRODUCT_KEY + "/" + DEVICE_NAME + "/user/get";
    // 修改代码中的PUB_TOPIC
    private static final String PUB_TOPIC = "j1nzhwCFtTs/WeChat_APP/user/post";
    // 用于存储当前MQTT连接参数
    private MqttConnectOptions connectOptions;
    private String clientId;
    private String username;

    private MqttClient client;

    public MqttRobotSubscriber(RobotDataMapper robotDataMapper) {
        this.robotDataMapper = robotDataMapper;
    }

    @PostConstruct
    public void subscribe() {
        // 已切换为 Jetson 直接 HTTP POST 方案，不再使用阿里云MQTT
        logger.info("MqttRobotSubscriber: 阿里云MQTT已禁用，使用 /api/robot-data/push 接收数据");
    }

    /**
     * 更新MQTT连接参数（重新生成密码）
     */
    private void updateConnectionParams() {
        long timestamp = System.currentTimeMillis();
        clientId = PRODUCT_KEY + "." + DEVICE_NAME + "|securemode=2,signmethod=hmacsha256,timestamp=" + timestamp + "|";
        username = DEVICE_NAME + "&" + PRODUCT_KEY;

        String contentStr = "clientId" + PRODUCT_KEY + "." + DEVICE_NAME + "deviceName" + DEVICE_NAME + "productKey" + PRODUCT_KEY + "timestamp" + timestamp;
        String password = hmacSha256(DEVICE_SECRET, contentStr);

        logger.info("MQTT连接参数 - ClientId: {}, Username: {}, Password: {}", clientId, username, password);

        connectOptions.setUserName(username);
        connectOptions.setPassword(password.toCharArray());
    }

    /**
     * 尝试重新连接
     */
    private void tryReconnect() {
        try {
            if (client != null && !client.isConnected()) {
                // 更新连接参数
                updateConnectionParams();
                client.connect(connectOptions);
                client.subscribe(SUB_TOPIC);
                logger.info("阿里云MQTT重新连接成功");
            }
        } catch (MqttException e) {
            logger.error("阿里云MQTT重新连接失败: {}", e.getMessage());
        }
    }

    /**
     * 发布目的地坐标到阿里云（供前端调用）
     * @param longitude 目的地经度
     * @param latitude 目的地纬度
     * @return 是否发布成功
     */
    public boolean publishDestination(double longitude, double latitude) {
        return publishDestination(longitude, latitude, null);
    }

    /**
     * 发布目的地坐标到阿里云（供前端调用）
     * @param longitude 目的地经度
     * @param latitude 目的地纬度
     * @param locationName 目的地名称（可选）
     * @return 是否发布成功
     */
    public boolean publishDestination(double longitude, double latitude, String locationName) {
        try {
            // 检查MQTT连接状态
            if (client == null || !client.isConnected()) {
                logger.error("MQTT客户端未连接，无法发布目的地坐标");
                return false;
            }

            // 构建JSON消息
            ObjectNode payload = mapper.createObjectNode();
            payload.put("device", DEVICE_NAME);
            payload.put("timestamp", System.currentTimeMillis());

            ObjectNode dataNode = mapper.createObjectNode();
            ObjectNode destinationNode = mapper.createObjectNode();

            // 目的地坐标数据
            destinationNode.put("longitude", longitude);
            destinationNode.put("latitude", latitude);
            if (locationName != null && !locationName.trim().isEmpty()) {
                destinationNode.put("name", locationName);
            }

            dataNode.set("destination", destinationNode);
            payload.set("data", dataNode);

            String message = payload.toString();
            logger.info("发布目的地坐标到阿里云: {}", message);

            // 发布MQTT消息
            MqttMessage mqttMessage = new MqttMessage(message.getBytes(StandardCharsets.UTF_8));
            mqttMessage.setQos(1); // QoS 1: 至少发送一次
            mqttMessage.setRetained(false); // 不保留消息

            client.publish(PUB_TOPIC, mqttMessage);

            logger.info("✅ 目的地坐标发布成功 - 经度: {}, 纬度: {}", longitude, latitude);

            // 同时保存到数据库记录
            saveDestinationToDatabase(longitude, latitude, locationName);

            return true;

        } catch (Exception e) {
            logger.error("发布目的地坐标失败: {}", e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 保存目的地坐标到数据库（用于历史记录）
     */
    private void saveDestinationToDatabase(double longitude, double latitude, String locationName) {
        try {
            RobotData destinationRecord = new RobotData();
            destinationRecord.setDeviceId(DEVICE_NAME + "_DESTINATION");
            destinationRecord.setTimestamp(System.currentTimeMillis());
            destinationRecord.setLongitude(longitude);
            destinationRecord.setLatitude(latitude);
            destinationRecord.setAlertMessage("目的地设置: " + (locationName != null ? locationName : "未知位置"));
            destinationRecord.setCreatedAt(LocalDateTime.now());

            robotDataMapper.insert(destinationRecord);
            logger.info("目的地坐标已保存到数据库: ({}, {})", longitude, latitude);
        } catch (Exception e) {
            logger.error("保存目的地坐标到数据库失败: {}", e.getMessage());
        }
    }

    // HMAC-SHA256加密
    private String hmacSha256(String secret, String content) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(content.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                String hex = Integer.toHexString(b & 0xFF);
                if (hex.length() == 1) {
                    sb.append('0');
                }
                sb.append(hex);
            }
            return sb.toString();
        } catch (Exception e) {
            logger.error("HMAC-SHA256加密失败: {}", e.getMessage());
            return "";
        }
    }

    private void processRobotData(String payload) {
        try {
            logger.info("处理机器人数据: {}", payload);

            JsonNode rootNode = mapper.readTree(payload);

            RobotData robotData = new RobotData();

            // 设置设备ID
            robotData.setDeviceId(rootNode.has("device") ? rootNode.get("device").asText() : "find_robot");

            // 设置时间戳
            long timestamp;
            if (rootNode.has("timestamp")) {
                timestamp = rootNode.get("timestamp").asLong();
                if (timestamp < 10000000000L) {
                    timestamp = timestamp * 1000;
                }
                robotData.setTimestamp(timestamp);
            } else {
                robotData.setTimestamp(System.currentTimeMillis());
            }

            // 检查是否有data字段
            if (rootNode.has("data")) {
                JsonNode dataNode = rootNode.get("data");

                // GPS数据
                if (dataNode.has("gps")) {
                    JsonNode gpsNode = dataNode.get("gps");
                    if (gpsNode.has("longitude")) robotData.setLongitude(gpsNode.get("longitude").asDouble());
                    if (gpsNode.has("latitude")) robotData.setLatitude(gpsNode.get("latitude").asDouble());
                    if (gpsNode.has("satellites")) robotData.setSatellites(gpsNode.get("satellites").asInt());
                    if (gpsNode.has("altitude")) robotData.setAltitude(gpsNode.get("altitude").asDouble());
                    if (gpsNode.has("speed_kph")) robotData.setSpeed(gpsNode.get("speed_kph").asDouble());
                }

                // 电池数据
                if (dataNode.has("battery")) {
                    JsonNode batteryNode = dataNode.get("battery");
                    if (batteryNode.has("voltage")) {
                        double voltage = batteryNode.get("voltage").asDouble();
                        robotData.setVoltage(voltage);
                        int batteryLevel = calculateBatteryLevelFromVoltage(voltage);
                        robotData.setBatteryLevel(batteryLevel);
                        logger.info("电池数据 - 电压: {}V, 计算电量: {}%", voltage, batteryLevel);
                    } else {
                        logger.warn("电池数据中没有voltage字段");
                    }
                } else {
                    logger.warn("数据中没有battery字段");
                }

                // 人脸数据
                if (dataNode.has("face")) {
                    JsonNode faceNode = dataNode.get("face");
                    if (faceNode.has("face_count")) {
                        robotData.setPersonCount(faceNode.get("face_count").asInt());
                    }
                }

                // 检查是否有目的地确认消息
                if (dataNode.has("destination_status")) {
                    JsonNode statusNode = dataNode.get("destination_status");
                    String status = statusNode.has("status") ? statusNode.get("status").asText() : "";
                    String message = statusNode.has("message") ? statusNode.get("message").asText() : "";
                    logger.info("收到目的地状态反馈: status={}, message={}", status, message);
                }

            } else {
                logger.warn("数据中没有data字段");
            }

            // 设置其他字段
            robotData.setAlertMessage(null);
            robotData.setCreatedAt(LocalDateTime.now());

            // 保存到数据库
            robotDataMapper.insert(robotData);

            // 打印成功日志
            logger.info("✅ 机器人数据保存成功，设备: {}, 位置: ({}, {}), 卫星: {}, 速度: {}km/h, 电压: {}V, 电量: {}%, 时间: {}",
                    robotData.getDeviceId(),
                    robotData.getLatitude(),
                    robotData.getLongitude(),
                    robotData.getSatellites(),
                    robotData.getSpeed(),
                    robotData.getVoltage(),
                    robotData.getBatteryLevel(),
                    new java.util.Date(robotData.getTimestamp()));

        } catch (Exception e) {
            logger.error("处理机器人数据失败: {}", e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 根据电压计算电量百分比
     */
    private int calculateBatteryLevelFromVoltage(double voltage) {
        double minVoltage = 11.0;
        double maxVoltage = 12.8;

        if (voltage <= minVoltage) return 0;
        if (voltage >= maxVoltage) return 100;

        int batteryLevel = (int) ((voltage - minVoltage) / (maxVoltage - minVoltage) * 100);
        return Math.max(0, Math.min(100, batteryLevel));
    }

    /**
     * 检查MQTT连接状态
     */
    public boolean isConnected() {
        return client != null && client.isConnected();
    }

    /**
     * 获取当前MQTT连接信息
     */
    public String getConnectionInfo() {
        if (!isConnected()) {
            return "MQTT未连接";
        }
        return String.format("已连接到阿里云IoT - 设备: %s, Broker: %s", DEVICE_NAME, MQTT_BROKER);
    }

    @PreDestroy
    public void cleanup() {
        // 阿里云MQTT已禁用，无需清理
    }
}