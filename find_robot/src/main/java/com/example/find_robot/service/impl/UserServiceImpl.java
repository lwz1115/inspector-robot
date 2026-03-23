package com.example.find_robot.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.find_robot.entity.User;
import com.example.find_robot.repository.UserMapper;
import com.example.find_robot.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public User findByUsername(String username) {
        if (!StringUtils.hasText(username)) return null;
        return this.getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username.trim()));
    }

    @Override
    public User findByPhone(String phone) {
        if (!StringUtils.hasText(phone)) return null;
        return this.getOne(new LambdaQueryWrapper<User>().eq(User::getPhone, phone.trim()));
    }

    @Override
    public boolean existsByPhone(String phone) {
        if (!StringUtils.hasText(phone)) return false;
        return this.count(new LambdaQueryWrapper<User>().eq(User::getPhone, phone.trim())) > 0;
    }

    @Override
    public boolean register(User user) {
        // 明文存储密码，不做加密
        user.setCreateTime(java.time.LocalDateTime.now());
        if (!StringUtils.hasText(user.getNickname())) {
            user.setNickname(user.getUsername());
        }
        return this.save(user);
    }

    @Override
    public User login(String username, String password) {
        User user = findByUsername(username);
        if (user == null) return null;
        // 明文直接比对
        return user.getPassword().equals(password) ? user : null;
    }
}