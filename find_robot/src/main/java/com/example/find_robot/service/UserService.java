package com.example.find_robot.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.example.find_robot.entity.User;

public interface UserService extends IService<User> {
    User findByUsername(String username);
    User findByPhone(String phone);
    boolean existsByPhone(String phone);
    boolean register(User user);
    /** 登录验证，成功返回 User，失败返回 null */
    User login(String username, String password);
}