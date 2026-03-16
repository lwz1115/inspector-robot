package com.example.find_robot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletResponse;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/camera")
public class CameraController {

    @Value("${camera.stream.url:http://localhost:8888}")
    private String streamUrl;

    /**
     * 返回摄像头流地址信息（前端用来直接连接或判断是否可用）
     */
    @GetMapping("/info")
    public Map<String, String> info() {
        Map<String, String> info = new HashMap<>();
        // 低带宽参数：quality=25, 320x240, mjpeg
        info.put("mjpeg", streamUrl + "/stream?topic=/image&type=mjpeg&quality=25&width=320&height=240");
        info.put("mjpeg_hd", streamUrl + "/stream?topic=/image&type=mjpeg&quality=50&width=640&height=480");
        info.put("snapshot", streamUrl + "/snapshot?topic=/image");
        return info;
    }

    /**
     * 反向代理 MJPEG 流，解决跨域问题
     */
    @GetMapping("/stream")
    public ResponseEntity<StreamingResponseBody> stream(
            @RequestParam(defaultValue = "25") int quality,
            @RequestParam(defaultValue = "320") int width,
            @RequestParam(defaultValue = "240") int height,
            HttpServletResponse response) {

        String url = streamUrl + "/stream?topic=/image&type=mjpeg"
                + "&quality=" + quality
                + "&width=" + width
                + "&height=" + height;

        StreamingResponseBody body = outputStream -> {
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(30000);
                conn.connect();
                try (InputStream in = conn.getInputStream()) {
                    byte[] buf = new byte[4096];
                    int len;
                    while ((len = in.read(buf)) != -1) {
                        outputStream.write(buf, 0, len);
                        outputStream.flush();
                    }
                }
            } catch (Exception e) {
                // 流断开时静默退出
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("multipart/x-mixed-replace;boundary=--boundarydonotcross"))
                .body(body);
    }
}
