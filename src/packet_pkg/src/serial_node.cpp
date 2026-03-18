/**
 * serial_node.cpp
 * STM32 serial communication node (C++)
 * Subscribe: /cmd_vel
 * Publish:   /sensor/cmd_vel, /imu/data, /battery_voltage,
 *            /sensor/temperature, /sensor/humidity, /sensor/smoke
 */
#include <ros/ros.h>
#include <geometry_msgs/Twist.h>
#include <sensor_msgs/Imu.h>
#include <std_msgs/Float32.h>

#include <serial/serial.h>

#include <thread>
#include <mutex>
#include <vector>
#include <cstdint>
#include <cmath>
#include <string>
#include <cstdlib>

static const uint8_t FRAME_HEADER = 0x7B;
static const uint8_t FRAME_TAIL   = 0x7D;
static const int     FRAME_SIZE   = 30;

class SerialNode
{
public:
    SerialNode() : running_(false)
    {
        ros::NodeHandle nh;
        ros::NodeHandle pnh("~");

        last_cmd_time_ = ros::Time::now();

        pnh.param<std::string>("port",          port_,              "/dev/ttyJETBOT");
        pnh.param<int>        ("baudrate",       baudrate_,          115200);
        pnh.param<double>     ("timeout",        cmd_timeout_,       0.5);
        pnh.param<int>        ("rate",           control_rate_,      20);

        cmd_vel_pub_ = nh.advertise<geometry_msgs::Twist>("/sensor/cmd_vel",     10);
        imu_pub_     = nh.advertise<sensor_msgs::Imu>    ("/imu/data",           10);
        voltage_pub_ = nh.advertise<std_msgs::Float32>   ("/battery_voltage",    10);
        temp_pub_    = nh.advertise<std_msgs::Float32>   ("/sensor/temperature", 10);
        humi_pub_    = nh.advertise<std_msgs::Float32>   ("/sensor/humidity",    10);
        smoke_pub_   = nh.advertise<std_msgs::Float32>   ("/sensor/smoke",       10);

        cmd_vel_sub_ = nh.subscribe("/cmd_vel", 10, &SerialNode::cmdVelCallback, this);

        openSerial();

        ROS_INFO("Waiting for robot initialization...");
        ros::Duration(3.0).sleep();
        ROS_INFO("Robot ready.");
    }

    ~SerialNode()
    {
        running_ = false;
        if (ctrl_thread_.joinable()) ctrl_thread_.join();
        if (recv_thread_.joinable()) recv_thread_.join();
        if (ser_.isOpen()) {
            sendControl(0.0, 0.0);
            ser_.close();
        }
    }

    void run()
    {
        running_ = true;
        ctrl_thread_ = std::thread(&SerialNode::controlLoop, this);
        recv_thread_ = std::thread(&SerialNode::receiveLoop, this);
        ROS_INFO("Serial node running. port=%s baudrate=%d", port_.c_str(), baudrate_);
        ros::spin();
        running_ = false;
    }

private:
    // ── serial ────────────────────────────────────────────
    bool openSerial()
    {
        try {
            ser_.setPort(port_);
            ser_.setBaudrate(baudrate_);
            serial::Timeout to = serial::Timeout::simpleTimeout(10);  // 10ms timeout
            ser_.setTimeout(to);
            ser_.open();
            ROS_INFO("Serial opened: %s", port_.c_str());
            return true;
        } catch (const std::exception &e) {
            ROS_ERROR("Serial open failed: %s", e.what());
            return false;
        }
    }

    // ── callback ──────────────────────────────────────────
    void cmdVelCallback(const geometry_msgs::Twist::ConstPtr &msg)
    {
        std::lock_guard<std::mutex> lock(cmd_mutex_);
        current_cmd_   = *msg;
        last_cmd_time_ = ros::Time::now();
    }

    // ── send ──────────────────────────────────────────────
    int16_t toInt16(double v)
    {
        return (int16_t)std::max(-32768.0, std::min(32767.0, v * 1000.0));
    }

    void sendControl(double linear_x, double angular_z)
    {
        if (!ser_.isOpen()) return;
        try {
            int16_t vx = toInt16(linear_x);
            int16_t vz = toInt16(angular_z);

            uint8_t frame[11];
            frame[0] = 0x7B;
            frame[1] = 0x00;
            frame[2] = 0x00;
            frame[3] = (vx >> 8) & 0xFF;
            frame[4] =  vx       & 0xFF;
            frame[5] = 0x00;
            frame[6] = 0x00;
            frame[7] = (vz >> 8) & 0xFF;
            frame[8] =  vz       & 0xFF;
            uint8_t chk = 0;
            for (int i = 0; i < 9; i++) chk ^= frame[i];
            frame[9]  = chk;
            frame[10] = 0x7D;

            ser_.write(frame, 11);
        } catch (const std::exception &e) {
            ROS_ERROR("Send control failed: %s", e.what());
        }
    }

    // ── parse ─────────────────────────────────────────────
    bool parseFrame(const std::vector<uint8_t> &data)
    {
        if ((int)data.size() != FRAME_SIZE)  return false;
        if (data[0]  != FRAME_HEADER)        return false;
        if (data[29] != FRAME_TAIL)          return false;

        uint8_t chk = 0;
        for (int i = 0; i < 26; i++) chk ^= data[i];
        if (chk != data[26]) {
            ROS_WARN_THROTTLE(1.0, "Checksum error: calc=0x%02X recv=0x%02X", chk, data[26]);
            return false;
        }

        auto s16 = [&](int i) -> int16_t  { return (int16_t) ((data[i] << 8) | data[i+1]); };
        auto u16 = [&](int i) -> uint16_t { return (uint16_t)((data[i] << 8) | data[i+1]); };

        double   vx      = s16(2)  / 1000.0;
        double   vy      = s16(4)  / 1000.0;
        double   vz      = s16(6)  / 1000.0;
        double   ax      = s16(8)  / 1000.0;
        double   ay      = s16(10) / 1000.0;
        double   az      = s16(12) / 1000.0;
        double   gx      = s16(14) / 1000.0;
        double   gy      = s16(16) / 1000.0;
        double   gz      = s16(18) / 1000.0;
        double   voltage = u16(20) / 1000.0;
        uint8_t  temp    = data[22];
        uint8_t  humi    = data[23];
        uint16_t smoke   = u16(24);

        // publish velocity
        geometry_msgs::Twist twist;
        twist.linear.x  = vx;
        twist.linear.y  = vy;
        twist.angular.z = vz;
        cmd_vel_pub_.publish(twist);

        // publish IMU
        sensor_msgs::Imu imu;
        imu.header.stamp    = ros::Time::now();
        imu.header.frame_id = "imu_link";
        imu.linear_acceleration.x = ax;
        imu.linear_acceleration.y = ay;
        imu.linear_acceleration.z = az;
        imu.angular_velocity.x    = gx;
        imu.angular_velocity.y    = gy;
        imu.angular_velocity.z    = gz;
        imu_pub_.publish(imu);

        // publish voltage
        std_msgs::Float32 v_msg;
        v_msg.data = (float)voltage;
        voltage_pub_.publish(v_msg);

        // publish temperature / humidity / smoke
        std_msgs::Float32 t_msg, h_msg, s_msg;
        t_msg.data = (float)temp;
        h_msg.data = (float)humi;
        s_msg.data = (float)smoke;
        temp_pub_.publish(t_msg);
        humi_pub_.publish(h_msg);
        smoke_pub_.publish(s_msg);

        ROS_INFO_THROTTLE(0.5,
            "Sensor: vx=%.2fm/s volt=%.2fV temp=%dC humi=%d%% smoke=%d",
            vx, voltage, temp, humi, smoke);

        return true;
    }

    // ── control loop ──────────────────────────────────────
    void controlLoop()
    {
        ros::Rate rate(control_rate_);
        while (running_ && ros::ok()) {
            {
                std::lock_guard<std::mutex> lock(cmd_mutex_);
                double dt = (ros::Time::now() - last_cmd_time_).toSec();
                if (dt > cmd_timeout_)
                    sendControl(0.0, 0.0);
                else
                    sendControl(current_cmd_.linear.x, current_cmd_.angular.z);
            }
            rate.sleep();
        }
    }

    // ── receive loop ──────────────────────────────────────
    void receiveLoop()
    {
        std::vector<uint8_t> buf;
        while (running_ && ros::ok()) {
            try {
                if (!ser_.isOpen()) {
                    ros::Duration(2.0).sleep();
                    openSerial();
                    buf.clear();
                    continue;
                }

                size_t avail = ser_.available();
                if (avail > 0) {
                    std::vector<uint8_t> tmp(avail);
                    ser_.read(tmp, avail);
                    buf.insert(buf.end(), tmp.begin(), tmp.end());
                } else {
                    ros::Duration(0.005).sleep(); // 5ms poll interval
                    continue;
                }

                while ((int)buf.size() >= FRAME_SIZE) {
                    if (buf[0] != FRAME_HEADER) {
                        buf.erase(buf.begin());
                        continue;
                    }
                    std::vector<uint8_t> frame(buf.begin(), buf.begin() + FRAME_SIZE);
                    if (parseFrame(frame))
                        buf.erase(buf.begin(), buf.begin() + FRAME_SIZE);
                    else
                        buf.erase(buf.begin());
                }

                // prevent buffer growing unbounded
                if (buf.size() > 300)
                    buf.clear();

            } catch (const serial::SerialException &e) {
                ROS_WARN("Serial exception, reconnecting: %s", e.what());
                buf.clear();
                try { ser_.close(); } catch (...) {}
                ros::Duration(2.0).sleep();
                openSerial();
            } catch (const std::exception &e) {
                ROS_ERROR("Receive loop error: %s", e.what());
                ros::Duration(0.1).sleep();
            }
        }
    }

    // ── members ───────────────────────────────────────────
    std::string port_;
    int         baudrate_;
    double      cmd_timeout_;
    int         control_rate_;

    serial::Serial ser_;

    ros::Publisher  cmd_vel_pub_, imu_pub_, voltage_pub_;
    ros::Publisher  temp_pub_, humi_pub_, smoke_pub_;
    ros::Subscriber cmd_vel_sub_;

    geometry_msgs::Twist current_cmd_;
    ros::Time            last_cmd_time_;
    std::mutex           cmd_mutex_;

    std::thread ctrl_thread_, recv_thread_;
    bool        running_;
};

int main(int argc, char **argv)
{
    ros::init(argc, argv, "jetbot_serial_control");
    SerialNode node;
    node.run();
    return 0;
}
