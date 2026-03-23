/**
 * 服务器地址配置 - 改这一个文件就够了
 *
 * 场景说明：
 *   本地电脑测试（Spring Boot 跑在本机）：SERVER_IP = 'localhost' 或 '127.0.0.1'
 *   局域网测试（Spring Boot 跑在 192.168.1.103）：SERVER_IP = '192.168.1.103'
 *   学校网络（Spring Boot 跑在 10.234.236.x）：SERVER_IP = '10.234.236.x'
 *
 * H5 内置浏览器调试时：走 manifest.json devServer proxy，BASE 自动为 '/api'
 * 小程序真机/模拟器：直接用完整地址，需要手机和电脑在同一 WiFi
 */

const SERVER_IP = 'localhost'   // ← 只改这里
const SERVER_PORT = '8080'

// H5 调试走 vite devServer proxy，不跨域
// #ifdef H5
export const BASE = '/api'
// #endif
// #ifndef H5
export const BASE = 'http://' + SERVER_IP + ':' + SERVER_PORT + '/api'
// #endif
