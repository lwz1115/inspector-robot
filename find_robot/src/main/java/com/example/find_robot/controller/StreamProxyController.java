package com.example.find_robot.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.http.*;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 摄像头流反向代理
 * 前端访问 /api/stream/camera 即可，避免跨域问题
 */
@RestController
@RequestMapping("/api/stream")
@CrossOrigin(origins = "*")
public class StreamProxyController {

    private static final String CAM_URL = "http://10.234.236.100:8081/stream?topic=/image";

    @GetMapping("/camera")
    public ResponseEntity<StreamingResponseBody> proxyStream() {
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(CAM_URL).openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(0); // 流不超时
            conn.connect();

            String contentType = conn.getContentType();
            if (contentType == null) contentType = "multipart/x-mixed-replace;boundary=--boundarydonotcross";

            InputStream in = conn.getInputStream();
            StreamingResponseBody body = out -> {
                byte[] buf = new byte[4096];
                int n;
                try {
                    while ((n = in.read(buf)) != -1) {
                        out.write(buf, 0, n);
                        out.flush();
                    }
                } catch (Exception ignored) {}
                finally { in.close(); conn.disconnect(); }
            };

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .header(HttpHeaders.CONNECTION, "keep-alive")
                    .body(body);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
