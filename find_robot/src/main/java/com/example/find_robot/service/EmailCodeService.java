package com.example.find_robot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailCodeService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${email.code.expire:5}")
    private int expireMinutes;

    // email -> {code, expireAt}
    private final Map<String, long[]> codeStore = new ConcurrentHashMap<>();

    /** 生成并发送验证码，返回 null 表示成功，否则返回错误信息 */
    public String sendCode(String email) {
        if (email == null || !email.matches("^[\\w.+-]+@[\\w-]+\\.[\\w.]+$")) {
            return "邮箱格式不正确";
        }

        // 60秒内不重复发送
        long[] existing = codeStore.get(email);
        if (existing != null) {
            long secondsLeft = (existing[1] - System.currentTimeMillis()) / 1000;
            long cooldown = expireMinutes * 60L - 60;
            if (secondsLeft > cooldown) {
                return "发送太频繁，请" + (secondsLeft - cooldown) + "秒后重试";
            }
        }

        String code = String.format("%06d", new Random().nextInt(1000000));
        long expireAt = System.currentTimeMillis() + expireMinutes * 60_000L;
        codeStore.put(email, new long[]{Long.parseLong(code), expireAt});

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(email);
            msg.setSubject("【园区巡检系统】邮箱验证码");
            msg.setText("您的验证码为：" + code + "\n有效期 " + expireMinutes + " 分钟，请勿泄露给他人。");
            mailSender.send(msg);
        } catch (MailException e) {
            codeStore.remove(email);
            return "邮件发送失败：" + e.getMessage();
        }
        return null;
    }

    /** 验证验证码，验证后立即删除（一次性） */
    public boolean verify(String email, String code) {
        if (email == null || code == null) return false;
        long[] stored = codeStore.get(email);
        if (stored == null) return false;
        if (System.currentTimeMillis() > stored[1]) {
            codeStore.remove(email);
            return false; // 已过期
        }
        boolean match = String.valueOf((long) stored[0]).equals(code.trim());
        if (match) codeStore.remove(email); // 验证成功后删除
        return match;
    }
}
