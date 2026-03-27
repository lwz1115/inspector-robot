<template>
  <view class="page">
    <!-- 顶部安全区域 -->
    <view class="safe-area-top"></view>
    
    <!-- 地图容器 -->
    <view class="map-container">
      <map 
        id="myMap"
        class="map"
        :latitude="latitude"
        :longitude="longitude"
        :scale="scale"
        :markers="markers"
        show-location
        show-compass
        enable-zoom
        enable-scroll
        @markertap="onMarkerTap"
        @regionchange="onRegionChange"
        @load="onMapLoad"
        @error="onMapError">
      </map>
      
      <!-- 地图控制按钮 -->
      <view class="map-controls">
        <view class="control-btn" @tap="locateMe">
          <text class="icon">📍</text>
          <text class="text">定位</text>
        </view>
        <view class="control-btn" @tap="zoomIn">
          <text class="icon">➕</text>
          <text class="text">放大</text>
        </view>
        <view class="control-btn" @tap="zoomOut">
          <text class="icon">➖</text>
          <text class="text">缩小</text>
        </view>
      </view>
      
      <!-- 搜索框 -->
      <view class="search-container">
        <input 
          class="search-input" 
          placeholder="搜索地点或地址"
          v-model="searchKeyword"
          @confirm="searchPlace">
        <view class="search-btn" @tap="searchPlace">
          <text class="search-icon">🔍</text>
        </view>
      </view>
    </view>
    
    <!-- 底部坐标信息 -->
    <view class="bottom-info">
      <view class="info-content">
        <text class="coord">纬度: {{latitude.toFixed(6)}}</text>
        <text class="coord">经度: {{longitude.toFixed(6)}}</text>
        <text class="scale-text">缩放: {{scale}}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE } from '@/config/server.js'
import { toStr } from '@/utils/uts_helpers.js'

const AMAP_KEY = '50af93566ee2e3f73192d2735b9b1aab'
const ROBOT_API = BASE

export default {
  data() {
    return {
      latitude: 32.1230155,
      longitude: 118.93069167,
      scale: 16,
      markers: [],
      searchKeyword: '',
      mapContext: null
    }
  },

  onShow() {
    this.initMap()
  },

  onHide() {
    this.mapContext = null
  },

  methods: {
    initMap() {
      this.mapContext = uni.createMapContext('myMap', this)
      this.getCurrentLocation()
    },

    getCurrentLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.latitude = res.latitude
          this.longitude = res.longitude
          if (this.mapContext) this.mapContext.moveToLocation()
        },
        fail: () => {
          uni.showToast({ title: '获取位置失败，请检查权限', icon: 'none' })
        }
      })
    },

    locateMe() {
      this.getCurrentLocation()
    },

    zoomIn() {
      if (this.scale < 20) this.scale++
    },

    zoomOut() {
      if (this.scale > 3) this.scale--
    },

    onMarkerTap(e) {
      const marker = this.markers.find(m => m.id === e.markerId)
      if (marker) {
        uni.showModal({
          title: marker.title || '位置',
          content: '纬度: ' + marker.latitude.toFixed(6) + '\n经度: ' + marker.longitude.toFixed(6),
          showCancel: false,
          confirmText: '知道了'
        })
      }
    },

    onRegionChange(e) {
      if (e.type === 'end' && this.mapContext) {
        this.mapContext.getCenterLocation({
          success: (res) => {
            this.latitude = res.latitude
            this.longitude = res.longitude
          }
        })
      }
    },

    searchPlace() {
      const kw = (this.searchKeyword || '').trim()
      if (!kw) { uni.showToast({ title: '请输入搜索关键词', icon: 'none' }); return }
      uni.showLoading({ title: '搜索中...' })
      uni.request({
        url: 'https://restapi.amap.com/v3/place/text',
        method: 'GET',
        data: { keywords: kw, key: AMAP_KEY, output: 'json', offset: 5 },
        timeout: 8000,
        success: (res) => {
          uni.hideLoading()
          if (res.data && res.data.status === '1' && res.data.pois && res.data.pois.length > 0) {
            const poi = res.data.pois[0]
            const parts = poi.location.split(',')
            const lng = parseFloat(parts[0])
            const lat = parseFloat(parts[1])
            this.latitude = lat
            this.longitude = lng
            this.scale = 16
            uni.showToast({ title: '已定位到: ' + poi.name, icon: 'none', duration: 2000 })
          } else {
            uni.showToast({ title: '未找到相关地点', icon: 'none' })
          }
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '搜索失败，请检查网络', icon: 'none' })
        }
      })
    },

    // 地图加载完成回调
    onMapLoad() {
      console.log('地图加载完成')
      uni.showToast({ title: '地图加载完成', icon: 'success' })
    },
    
    // 页面加载时执行
    onLoad() {
      console.log('导航页面加载')
      console.log('AMAP_KEY:', AMAP_KEY)
      console.log('默认位置:', this.latitude, this.longitude)
    },
    
    // 地图加载错误回调
    onMapError(e) {
      console.error('地图加载错误:', e)
      uni.showToast({ title: '地图加载失败', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  overflow: hidden;
  flex-direction: column;
  position: relative;
}

/* 安全区域适配 */
.safe-area-top {
  height: env(safe-area-inset-top);
  width: 100%;
  background: #ffffff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
}

.map-container {
  flex: 1;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

/* 地图控制按钮 */
.map-controls {
  position: absolute;
  top: 80rpx;
  right: 20rpx;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.control-btn {
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid #e0e0e0;
  border-radius: 25rpx;
  padding: 15rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.control-btn:active {
  background: rgba(240, 240, 240, 0.95);
  transform: scale(0.95);
}

.control-btn .icon {
  font-size: 32rpx;
  margin-bottom: 5rpx;
}

.control-btn .text {
  font-size: 20rpx;
  color: #333;
}

/* 搜索框 */
.search-container {
  position: absolute;
  top: 80rpx;
  left: 20rpx;
  right: 120rpx;
  z-index: 100;
  display: flex;
  gap: 10rpx;
}

.search-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid #e0e0e0;
  border-radius: 25rpx;
  padding: 20rpx 30rpx;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.search-btn {
  background: #008c8c;
  border-radius: 25rpx;
  padding: 20rpx 25rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 140, 140, 0.3);
}

.search-btn:active {
  background: #007a7a;
  transform: scale(0.95);
}

.search-icon {
  font-size: 32rpx;
  color: white;
}

/* 底部信息栏 */
.bottom-info {
  background: rgba(255, 255, 255, 0.95);
  padding: 16rpx 30rpx;
  border-top: 1rpx solid #e0e0e0;
}

.info-content {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.coord, .scale-text {
  font-size: 22rpx;
  color: #666;
}
</style>
