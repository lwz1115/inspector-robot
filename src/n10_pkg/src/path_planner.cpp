#include <ros/ros.h>
#include <std_msgs/String.h>
#include <nav_msgs/Path.h>
#include <geometry_msgs/PoseStamped.h>
#include <cmath>
#include <vector>
#include <queue>
#include <unordered_map>
#include <array>
#include <sstream>

// ── 网格参数 ──────────────────────────────────────────────
static constexpr int    GRID_SIZE = 100;
static constexpr double GRID_RES  = 10.0;   // 米/格
static constexpr double REF_LAT   = 30.0;
static constexpr double REF_LON   = 120.0;

// ── A* 节点 ───────────────────────────────────────────────
struct ANode {
    int x, y;
    double g, f;
    bool operator>(const ANode& o) const { return f > o.f; }
};

using Pos = std::pair<int,int>;

struct PosHash {
    size_t operator()(const Pos& p) const {
        return std::hash<int>()(p.first) * 10007 + std::hash<int>()(p.second);
    }
};

// ── 路径规划器 ────────────────────────────────────────────
class PathPlanner {
public:
    PathPlanner() {
        ros::NodeHandle nh;
        gps_sub_  = nh.subscribe("/gps_data",               10, &PathPlanner::gpsCb,  this);
        dest_sub_ = nh.subscribe("/navigation/destination",  10, &PathPlanner::destCb, this);
        path_pub_ = nh.advertise<nav_msgs::Path>("/planned_path", 10);

        // 示例障碍物：地图中心矩形区域
        int c = GRID_SIZE / 2;
        for (int i = c-10; i < c+10; ++i)
            for (int j = c-5; j < c+5; ++j)
                obstacle_[i][j] = true;

        has_current_ = has_target_ = false;
        ROS_INFO("路径规划节点启动 (C++)");
    }

    void run() { ros::spin(); }

private:
    // ── 坐标转换 ──────────────────────────────────────────
    Pos latlonToGrid(double lat, double lon) const {
        double lat_km = (lat - REF_LAT) * 111.0;
        double lon_km = (lon - REF_LON) * 111.0 * std::cos(lat * M_PI / 180.0);
        int gx = static_cast<int>(lat_km * 1000.0 / GRID_RES) + GRID_SIZE / 2;
        int gy = static_cast<int>(lon_km * 1000.0 / GRID_RES) + GRID_SIZE / 2;
        gx = std::max(0, std::min(GRID_SIZE - 1, gx));
        gy = std::max(0, std::min(GRID_SIZE - 1, gy));
        return {gx, gy};
    }

    std::pair<double,double> gridToLatlon(int gx, int gy) const {
        double lat_km = (gx - GRID_SIZE / 2) * GRID_RES / 1000.0;
        double lon_km = (gy - GRID_SIZE / 2) * GRID_RES / 1000.0;
        double lat = REF_LAT + lat_km / 111.0;
        double lon = REF_LON + lon_km / (111.0 * std::cos(lat * M_PI / 180.0));
        return {lat, lon};
    }

    // ── 回调 ──────────────────────────────────────────────
    void gpsCb(const std_msgs::String::ConstPtr& msg) {
        const std::string& s = msg->data;
        if (s.substr(0, 4) != "GPS:") return;
        std::istringstream ss(s.substr(4));
        std::string tok;
        std::vector<std::string> parts;
        while (std::getline(ss, tok, ',')) parts.push_back(tok);
        if (parts.size() < 4) return;
        try {
            double lat = std::stod(parts[1]);
            double lon = std::stod(parts[3]);
            current_ = latlonToGrid(lat, lon);
            has_current_ = true;
            ROS_INFO_THROTTLE(30, "GPS: lat=%.6f lon=%.6f", lat, lon);
            if (has_target_) planPath();
        } catch (...) {
            ROS_WARN("GPS数据解析失败");
        }
    }

    void destCb(const std_msgs::String::ConstPtr& msg) {
        // 简单手写JSON解析，避免引入额外依赖
        const std::string& s = msg->data;
        auto extract = [&](const std::string& key) -> double {
            auto pos = s.find("\"" + key + "\"");
            if (pos == std::string::npos) return 0.0;
            pos = s.find(':', pos);
            return std::stod(s.substr(pos + 1));
        };
        try {
            target_ = latlonToGrid(extract("latitude"), extract("longitude"));
            has_target_ = true;
            ROS_INFO("收到目标位置");
            if (has_current_) planPath();
        } catch (...) {
            ROS_WARN("目标位置解析失败");
        }
    }

    // ── A* ────────────────────────────────────────────────
    static double heuristic(const Pos& a, const Pos& b) {
        double dx = a.first  - b.first;
        double dy = a.second - b.second;
        return std::sqrt(dx*dx + dy*dy);
    }

    std::vector<Pos> aStar(const Pos& start, const Pos& goal) {
        if (start == goal) return {start};

        // open set：最小堆
        std::priority_queue<ANode, std::vector<ANode>, std::greater<ANode>> open;
        // g_score 和 came_from 用 unordered_map，O(1) 查找
        unordered_map_t g_score, came_from_x, came_from_y;

        auto encode = [](const Pos& p) -> int { return p.first * GRID_SIZE + p.second; };

        g_score[encode(start)] = 0.0;
        open.push({start.first, start.second, 0.0, heuristic(start, goal)});

        static const int dx[] = {0,1,0,-1, 1, 1,-1,-1};
        static const int dy[] = {1,0,-1, 0, 1,-1, 1,-1};
        static const double cost[] = {1,1,1,1, 1.414,1.414,1.414,1.414};

        while (!open.empty()) {
            ANode cur = open.top(); open.pop();
            Pos cp{cur.x, cur.y};

            if (cp == goal) {
                // 重建路径
                std::vector<Pos> path;
                Pos p = goal;
                while (p != start) {
                    path.push_back(p);
                    int key = encode(p);
                    p = {came_from_x[key], came_from_y[key]};
                }
                path.push_back(start);
                std::reverse(path.begin(), path.end());
                return path;
            }

            double g_cur = g_score.count(encode(cp)) ? g_score[encode(cp)] : 1e9;
            if (cur.g > g_cur + 1e-6) continue;  // 过期节点，跳过

            for (int i = 0; i < 8; ++i) {
                int nx = cur.x + dx[i];
                int ny = cur.y + dy[i];
                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
                if (obstacle_[nx][ny]) continue;

                Pos np{nx, ny};
                int nkey = encode(np);
                double tg = g_cur + cost[i];

                if (!g_score.count(nkey) || tg < g_score[nkey]) {
                    g_score[nkey]    = tg;
                    came_from_x[nkey] = cur.x;
                    came_from_y[nkey] = cur.y;
                    open.push({nx, ny, tg, tg + heuristic(np, goal)});
                }
            }
        }
        ROS_WARN("A*: 无法找到路径");
        return {};
    }

    void planPath() {
        auto grid_path = aStar(current_, target_);
        if (grid_path.empty()) return;

        nav_msgs::Path path_msg;
        path_msg.header.stamp    = ros::Time::now();
        path_msg.header.frame_id = "map";

        for (const auto& gp : grid_path) {
            auto [lat, lon] = gridToLatlon(gp.first, gp.second);
            geometry_msgs::PoseStamped pose;
            pose.header = path_msg.header;
            pose.pose.position.x = lon;
            pose.pose.position.y = lat;
            pose.pose.position.z = 0.0;
            pose.pose.orientation.w = 1.0;
            path_msg.poses.push_back(pose);
        }

        path_pub_.publish(path_msg);
        ROS_INFO("路径规划完成，路径点: %zu", grid_path.size());
    }

    // ── 成员变量 ──────────────────────────────────────────
    ros::Subscriber gps_sub_, dest_sub_;
    ros::Publisher  path_pub_;

    bool obstacle_[GRID_SIZE][GRID_SIZE] = {};
    Pos  current_, target_;
    bool has_current_, has_target_;

    using unordered_map_t = std::unordered_map<int, double>;
};

int main(int argc, char** argv) {
    ros::init(argc, argv, "path_planner");
    PathPlanner planner;
    planner.run();
    return 0;
}
