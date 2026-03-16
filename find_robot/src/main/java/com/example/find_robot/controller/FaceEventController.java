package com.example.find_robot.controller;

import com.example.find_robot.service.FaceEventBroadcaster;
import com.example.find_robot.service.RosbridgeSubscriber;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/face")
@CrossOrigin(origins = "*")
public class FaceEventController {

    private final FaceEventBroadcaster broadcaster;
    private final RosbridgeSubscriber rosbridge;

    public FaceEventController(FaceEventBroadcaster broadcaster, RosbridgeSubscriber rosbridge) {
        this.broadcaster = broadcaster;
        this.rosbridge   = rosbridge;
    }

    /** 前端订阅事件流（识别结果 + 训练进度都从这里推） */
    @GetMapping(value = "/events", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter events() {
        return broadcaster.subscribe();
    }

    /** 启动人脸识别 */
    @PostMapping("/start")
    public Map<String, Object> startRecognition() {
        boolean ok = rosbridge.sendFaceCmd("start");
        return Map.of("success", ok, "message", ok ? "识别已启动" : "rosbridge 未连接");
    }

    /** 停止人脸识别 */
    @PostMapping("/stop")
    public Map<String, Object> stopRecognition() {
        boolean ok = rosbridge.sendFaceCmd("stop");
        return Map.of("success", ok, "message", ok ? "识别已停止" : "rosbridge 未连接");
    }

    /** 开始人脸训练，body: {"name":"张三"} */
    @PostMapping("/train/start")
    public Map<String, Object> startTraining(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "").trim();
        if (name.isEmpty()) {
            return Map.of("success", false, "message", "name 不能为空");
        }
        boolean ok = rosbridge.sendTrainCmd("start:" + name);
        return Map.of("success", ok, "message", ok ? "开始采集 " + name : "rosbridge 未连接");
    }

    /** 停止人脸训练 */
    @PostMapping("/train/stop")
    public Map<String, Object> stopTraining() {
        boolean ok = rosbridge.sendTrainCmd("stop");
        return Map.of("success", ok, "message", ok ? "训练已中止" : "rosbridge 未连接");
    }

    /** 状态查询 */
    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
            "connections", broadcaster.connectionCount(),
            "rosbridge",   rosbridge.isConnected() ? "connected" : "disconnected"
        );
    }
}
