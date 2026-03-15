#include <ros/ros.h>
#include <nav_msgs/Odometry.h>
#include <geometry_msgs/Twist.h>
#include <tf2_ros/transform_broadcaster.h>
#include <geometry_msgs/TransformStamped.h>
#include <cmath>

class OdomNode {
public:
    OdomNode() : x_(0.0), y_(0.0), th_(0.0), vx_(0.0), vth_(0.0) {
        ros::NodeHandle nh;
        odom_pub_ = nh.advertise<nav_msgs::Odometry>("/odom", 50);
        vel_sub_  = nh.subscribe("/sensor/cmd_vel", 10, &OdomNode::velCb, this);
        last_time_ = ros::Time::now();
        ROS_INFO("里程计节点启动 (C++) - 100Hz");
    }

    void velCb(const geometry_msgs::Twist::ConstPtr& msg) {
        vx_  = -msg->linear.x;
        vth_ = -msg->angular.z;
    }

    void update() {
        ros::Time now = ros::Time::now();
        double dt = (now - last_time_).toSec();
        if (dt <= 0.0 || dt > 0.5) {
            last_time_ = now;
            return;
        }

        x_  += vx_ * std::cos(th_) * dt;
        y_  += vx_ * std::sin(th_) * dt;
        th_ += vth_ * dt;

        // 归一化到 [-π, π]
        while (th_ >  M_PI) th_ -= 2.0 * M_PI;
        while (th_ < -M_PI) th_ += 2.0 * M_PI;

        last_time_ = now;

        double qz = std::sin(th_ / 2.0);
        double qw = std::cos(th_ / 2.0);

        // 发布 TF
        geometry_msgs::TransformStamped tf;
        tf.header.stamp    = now;
        tf.header.frame_id = "odom";
        tf.child_frame_id  = "base_link";
        tf.transform.translation.x = x_;
        tf.transform.translation.y = y_;
        tf.transform.translation.z = 0.0;
        tf.transform.rotation.x = 0.0;
        tf.transform.rotation.y = 0.0;
        tf.transform.rotation.z = qz;
        tf.transform.rotation.w = qw;
        tf_broadcaster_.sendTransform(tf);

        // 发布 Odometry
        nav_msgs::Odometry odom;
        odom.header.stamp    = now;
        odom.header.frame_id = "odom";
        odom.child_frame_id  = "base_link";
        odom.pose.pose.position.x  = x_;
        odom.pose.pose.position.y  = y_;
        odom.pose.pose.position.z  = 0.0;
        odom.pose.pose.orientation.x = 0.0;
        odom.pose.pose.orientation.y = 0.0;
        odom.pose.pose.orientation.z = qz;
        odom.pose.pose.orientation.w = qw;
        odom.twist.twist.linear.x  = vx_;
        odom.twist.twist.angular.z = vth_;
        odom_pub_.publish(odom);

        ROS_INFO_THROTTLE(1.0, "Odom: x=%.2f y=%.2f th=%.0f° vx=%.2f vth=%.2f",
                          x_, y_, th_ * 180.0 / M_PI, vx_, vth_);
    }

    void run() {
        ros::Rate rate(100);
        while (ros::ok()) {
            ros::spinOnce();
            update();
            rate.sleep();
        }
    }

private:
    ros::Publisher  odom_pub_;
    ros::Subscriber vel_sub_;
    tf2_ros::TransformBroadcaster tf_broadcaster_;

    double x_, y_, th_;
    double vx_, vth_;
    ros::Time last_time_;
};

int main(int argc, char** argv) {
    ros::init(argc, argv, "odometry_node");
    OdomNode node;
    node.run();
    return 0;
}
