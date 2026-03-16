package com.example.find_robot.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Random;

@RestController
public class CaptchaController {

    private static final String CHAR_SET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int WIDTH = 120;
    private static final int HEIGHT = 40;
    private static final int CODE_LENGTH = 4;

    @GetMapping("/api/auth/captcha")
    public void getCaptcha(HttpServletRequest request, HttpServletResponse response) throws IOException {
        try {
            // 设置响应类型
            response.setContentType("image/jpeg");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Cache-Control", "no-cache");
            response.setDateHeader("Expires", 0);

            // 允许跨域
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");

            // 创建验证码图片
            BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = image.createGraphics();

            // 设置背景色
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, WIDTH, HEIGHT);

            // 设置字体
            g.setFont(new Font("Arial", Font.BOLD, 20));

            // 生成随机验证码
            Random random = new Random();
            StringBuilder captcha = new StringBuilder();
            for (int i = 0; i < CODE_LENGTH; i++) {
                char c = CHAR_SET.charAt(random.nextInt(CHAR_SET.length()));
                captcha.append(c);

                // 设置随机颜色
                g.setColor(new Color(random.nextInt(128), random.nextInt(128), random.nextInt(128)));

                // 绘制字符
                int x = 20 * i + 10;
                int y = 25;
                g.drawString(String.valueOf(c), x, y);
            }

            // 添加干扰线
            for (int i = 0; i < 3; i++) {
                g.setColor(new Color(random.nextInt(255), random.nextInt(255), random.nextInt(255)));
                int x1 = random.nextInt(WIDTH);
                int y1 = random.nextInt(HEIGHT);
                int x2 = random.nextInt(WIDTH);
                int y2 = random.nextInt(HEIGHT);
                g.drawLine(x1, y1, x2, y2);
            }

            g.dispose();

            // 保存验证码到session
            HttpSession session = request.getSession();
            session.setAttribute("captcha", captcha.toString());
            session.setMaxInactiveInterval(300);

            System.out.println("生成验证码: " + captcha.toString());

            // 输出图片
            ImageIO.write(image, "JPEG", response.getOutputStream());

        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(500, "验证码生成失败: " + e.getMessage());
        }
    }
}