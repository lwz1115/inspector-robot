<template>
  <view class="page" :style="'background:' + theme.bg + ';'">
    <!-- 顶部安全区域 -->
    <view class="safe-area-top"></view>
    
    <view class="header" :style="headerBarStyle">
    </view>

    <!-- 连接状态 -->
    <view class="status-bar" :class="connected ? 'connected' : 'disconnected'">
      <text class="status-dot">●</text>
      <text class="status-text">{{ connected ? '已连接' : '未连接' }}</text>
      <text class="status-time" v-if="lastUpdate.length > 0">更新: {{ lastUpdate }}</text>
    </view>

    <!-- 卫星信号 -->
    <view class="satellite-bar">
      <view class="satellite-info">
        <text class="satellite-icon">🛰️</text>
        <view class="satellite-details">
          <text class="satellite-label">卫星信号</text>
          <text class="satellite-value">{{ satelliteSignal }} ({{ robotData.satellites || 0 }}/14)</text>
        </view>
      </view>
      <view class="satellite-progress">
        <view class="satellite-progress-bar" :style="{ width: satelliteProgress + '%', backgroundColor: satelliteColor }"></view>
      </view>
    </view>

    <!-- 数据卡片区 -->
    <scroll-view class="scroll-area" scroll-y>
      <!-- 网格布局容器 -->
      <view class="card-grid">
        <!-- 纬度数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">📍</text>
            <text class="card-title" :style="valueStyle">纬度</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ latText }}</text>
            </view>
          </view>
        </view>

        <!-- 经度数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">📍</text>
            <text class="card-title" :style="valueStyle">经度</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ lonText }}</text>
            </view>
          </view>
        </view>

        <!-- 海拔数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">🏔️</text>
            <text class="card-title" :style="valueStyle">海拔</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.altitude != null ? robotData.altitude + ' m' : '--' }}</text>
            </view>
          </view>
        </view>

        <!-- 速度数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">🚀</text>
            <text class="card-title" :style="valueStyle">速度</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.speed != null ? robotData.speed + ' km/h' : '--' }}</text>
            </view>
          </view>
        </view>

        <!-- 温度数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">🌡️</text>
            <text class="card-title" :style="valueStyle">温度</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.temperature != null ? robotData.temperature + ' °C' : '--' }}</text>
            </view>
          </view>
        </view>

        <!-- 湿度数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">💧</text>
            <text class="card-title" :style="valueStyle">湿度</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.humidity != null ? robotData.humidity + ' %' : '--' }}</text>
            </view>
          </view>
        </view>

        <!-- 烟雾值数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">🔥</text>
            <text class="card-title" :style="valueStyle">烟雾值</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.smoke != null ? robotData.smoke : '--' }}</text>
            </view>
          </view>
        </view>

        <!-- 人员数数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">👥</text>
            <text class="card-title" :style="valueStyle">人员数</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.person_count != null ? robotData.person_count : '--' }}</text>
            </view>
          </view>
        </view>

        <!-- 电量数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">🔋</text>
            <text class="card-title" :style="valueStyle">电量</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.battery != null ? robotData.battery + ' %' : '--' }}</text>
            </view>
          </view>
        </view>

        <!-- 电压数据 -->
        <view class="card card-half">
          <view class="card-header">
            <text class="card-icon">⚡</text>
            <text class="card-title" :style="valueStyle">电压</text>
          </view>
          <view class="card-body">
            <view class="data-row">
              <text class="data-value large" :style="valueStyle">{{ robotData.voltage != null ? robotData.voltage + ' V' : '--' }}</text>
            </view>
          </view>
        </view>


      </view>

      <!-- 底部安全区域和间距 -->
      <view style="height: 100rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
import { BASE } from '@/config/server.js'
import { getThemeVars } from '@/config/theme.js'
import { emptyRobotData, normalizeRobotData } from '@/config/robot_data.js'
import { parseFloatSafe } from '@/utils/uts_helpers.js'

const POLL_INTERVAL = 3000

export default {
  data() {
    return {
      loading: false,
      connected: false,
      lastUpdate: '',
      pollTimer: null,
      robotData: emptyRobotData(),
      theme: getThemeVars()
    }
  },

  computed: {
    headerBarStyle() {
      const h = this.theme.headerBg
      const useGrad = h.indexOf('linear') === 0
      return useGrad ? ('background:' + h + ';') : ('background:' + this.theme.primary + ';')
    },
    latText() {
      const s = this.robotData.latitude
      return s != null ? s : '--'
    },
    lonText() {
      const s = this.robotData.longitude
      return s != null ? s : '--'
    },
    camResText() {
      const s = this.robotData.cameraResolution
      return s.length > 0 ? s : '--'
    },
    cardStyle()  { return 'background:' + this.theme.card + ';border:1rpx solid ' + this.theme.border + ';' },
    cardHdStyle(){ return 'background:' + this.theme.inputBg + ';border-bottom:1rpx solid ' + this.theme.border + ';' },
    labelStyle() { return 'color:' + this.theme.textSub + ';' },
    valueStyle() { return 'color:' + this.theme.text + ';' },
    satelliteSignal() {
      const satellites = this.robotData.satellites || 0;
      const maxSatellites = 14;
      const signalPercentage = Math.min((satellites / maxSatellites) * 100, 100);
      if (signalPercentage >= 80) return '强';
      if (signalPercentage >= 50) return '中';
      if (signalPercentage >= 20) return '弱';
      return '无';
    },
    satelliteProgress() {
      const satellites = this.robotData.satellites || 0;
      const maxSatellites = 14;
      return Math.min((satellites / maxSatellites) * 100, 100);
    },
    satelliteColor() {
      const satellites = this.robotData.satellites || 0;
      const maxSatellites = 14;
      const signalPercentage = Math.min((satellites / maxSatellites) * 100, 100);
      if (signalPercentage >= 80) return '#52c41a'; // 强 - 绿色
      if (signalPercentage >= 50) return '#faad14'; // 中 - 黄色
      if (signalPercentage >= 20) return '#fa8c16'; // 弱 - 橙色
      return '#f5222d'; // 无 - 红色
    }
  },

  onShow() {
    this.theme = getThemeVars()
    this.fetchData()
    this.startPolling()
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  methods: {
    startPolling() {
      this.stopPolling()
      this.pollTimer = setInterval(() => { this.fetchData() }, POLL_INTERVAL)
    },

    stopPolling() {
      if (this.pollTimer != null) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },

    async fetchData() {
      if (this.loading) return
      this.loading = true
      try {
        // 尝试从多个可能的API接口获取数据
        const apiEndpoints = [
          BASE + '/robot/data',
          BASE + '/robot-data',
          BASE + '/api/robot/data',
          BASE + '/data/robot'
        ]
        
        let success = false
        
        // 尝试每个接口，直到成功
        for (const endpoint of apiEndpoints) {
          try {
            const res = await uni.request({
              url: endpoint,
              method: 'GET',
              timeout: 10000
            })
            
            const code = res.statusCode
            const raw = res.data
            
            console.log('从', endpoint, '获取数据:', code, raw)
            
            if (code === 200 && raw != null) {
              // 处理不同的数据格式
              let data = null
              if (raw.success === true) {
                data = raw.data
              } else {
                data = raw
              }
              
              if (data != null) {
                // 处理数组数据，取第一个元素
                if (Array.isArray(data) && data.length > 0) {
                  data = data[0]
                }
                
                // 确保经纬度字段被正确处理
                if (data.lat) data.latitude = data.lat
                if (data.lng) data.longitude = data.lng
                if (data.lon) data.longitude = data.lon
                
                // 确保温湿度字段被正确处理
                if (data.temp) data.temperature = data.temp
                if (data.hum) data.humidity = data.hum
                
                // 确保烟雾值字段被正确处理
                if (data.smokeValue) data.smoke = data.smokeValue
                
                // 确保人员数字段被正确处理
                if (data.personCount) data.person_count = data.personCount
                if (data.peopleCount) data.person_count = data.peopleCount
                
                // 确保卫星数字段被正确处理
                if (data.sat) data.satellites = data.sat
                if (data.satCount) data.satellites = data.satCount
                
                // 确保电量和电压字段被正确处理
                if (data.batt) data.battery = data.batt
                if (data.volt) data.voltage = data.volt
                
                this.robotData = normalizeRobotData(data)
                this.connected = true
                const now = new Date()
                const mm = now.getMinutes()
                const ss = now.getSeconds()
                const mmStr = mm < 10 ? ('0' + mm) : ('' + mm)
                const ssStr = ss < 10 ? ('0' + ss) : ('' + ss)
                this.lastUpdate = now.getHours() + ':' + mmStr + ':' + ssStr
                success = true
                console.log('成功从', endpoint, '获取数据:', data)
                console.log('处理后的数据:', this.robotData)
                break
              }
            } else {
              console.warn('从', endpoint, '获取数据失败:', code, raw)
            }
          } catch (e) {
            console.warn('从', endpoint, '获取数据失败:', e.message)
          }
        }
        
        if (!success) {
          this.connected = false
          console.error('所有API接口都获取数据失败')
          uni.showToast({ title: '无法获取设备数据', icon: 'none', duration: 2500 })
        }
      } catch (e) {
        console.error('获取数据失败:', e)
        this.connected = false
        uni.showToast({ title: '网络错误', icon: 'none', duration: 2500 })
      } finally {
        this.loading = false
      }
    },

    formatAngle(val) {
      if (val == null) return '--'
      const n = parseFloat('' + val)
      if (isNaN(n)) return '--'
      return n.toFixed(2) + '°'
    }
  }
}
</script>

<style scoped>
.page {
  flex: 1;
  background: #f5f5f5;
  position: relative;
}

/* 安全区域适配 */
.safe-area-top {
  height: env(safe-area-inset-top);
  width: 100%;
  background: #1890ff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
}

/* 顶部标题 */
.header {
  background: #1890ff;
  padding: 30rpx;
  padding-top: calc(30rpx + env(safe-area-inset-top));
}

/* 状态栏 */
.status-bar {
  flex-direction: row;
  align-items: center;
  padding: 16rpx 30rpx;
}

.connected {
  background: #f6ffed;
  border-bottom: 2rpx solid #b7eb8f;
}

.disconnected {
  background: #fff2f0;
  border-bottom: 2rpx solid #ffccc7;
}

.status-dot {
  font-size: 20rpx;
  margin-right: 10rpx;
}

.connected .status-dot { color: #52c41a; }
.disconnected .status-dot { color: #f5222d; }

.status-text {
  font-size: 26rpx;
  font-weight: 400;
  margin-right: 20rpx;
}

.connected .status-text { color: #52c41a; }
.disconnected .status-text { color: #f5222d; }

.status-time {
  font-size: 22rpx;
  color: #999999;
}

/* 卫星信号 */
.satellite-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #e8e8e8;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.satellite-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.satellite-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.satellite-details {
  display: flex;
  flex-direction: column;
}

.satellite-label {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 4rpx;
}

.satellite-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.satellite-progress {
  width: 200rpx;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-left: 30rpx;
}

.satellite-progress-bar {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.3s ease, background-color 0.3s ease;
}

/* 滚动区域 */
.scroll-area {
  flex: 1;
  padding: 20rpx;
}

/* 网格布局 */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

/* 卡片 */
.card {
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 20rpx;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 卡片悬停效果 */
.card:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.04);
}

/* 半宽卡片 */
.card-half {
  width: calc(50% - 10rpx);
  min-height: 220rpx;
}

/* 全宽卡片 */
.card-full {
  width: 100%;
}

.card-header {
  flex-direction: row;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: #fafafa;
}

.card-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

.card-body {
  padding: 10rpx 0;
}

/* 数据行 */
.data-row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 22rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.data-row:last-child {
  border-bottom: none;
}

.data-label {
  font-size: 26rpx;
  color: #666666;
}

.data-value {
  font-size: 26rpx;
  color: #333333;
  font-weight: 400;
}

.data-value.large {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  width: 100%;
}

.online { color: #52c41a; }
.offline { color: #f5222d; }

/* 进度条 */
.progress-wrap {
  flex-direction: row;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
}

.progress-bar {
  width: 160rpx;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
  margin-right: 16rpx;
}

.progress-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 26rpx;
  color: #333333;
  font-weight: 400;
  min-width: 60rpx;
  text-align: right;
}
</style>

