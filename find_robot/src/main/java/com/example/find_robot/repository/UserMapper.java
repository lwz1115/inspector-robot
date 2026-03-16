package com.example.find_robot.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.find_robot.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}