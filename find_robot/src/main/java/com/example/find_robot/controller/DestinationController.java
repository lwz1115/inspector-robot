package com.example.find_robot.controller;

import com.example.find_robot.service.RobotHttpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/destination")
@CrossOrigin(origins = "*")
public class DestinationController {

    @Autowired
    private RobotHttpService robotHttpService;

    /**
     * 设置目的地坐标，通过 HTTP 推送到 Jetson
     */
    @PostMapping("/set")
    public ResponseEntity<?> setDestination(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(required = false) String name) {

        try {
            boolean success = robotHttpService.publishDestination(longitude, latitude, name);

            if (success) {
                return ResponseEntity.ok().body(new ApiResponse(true,
                        "目的地坐标已发送到机器人",
                        String.format("经度: %.6f, 纬度: %.6f", longitude, latitude)));
            } else {
                return ResponseEntity.status(500).body(new ApiResponse(false,
                        "发送目的地坐标失败，请检查 Jetson 是否在线", null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(false,
                    "服务器内部错误: " + e.getMessage(), null));
        }
    }

    /**
     * 检查连接状态
     */
    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        return ResponseEntity.ok().body(new ApiResponse(true,
                robotHttpService.getConnectionInfo(),
                robotHttpService.isConnected()));
    }

    static class ApiResponse {
        private boolean success;
        private String message;
        private Object data;

        public ApiResponse(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
    }
}
