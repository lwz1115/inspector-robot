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
    
    <!-- 地图容器 -->
    <view class="map-container">
      <!-- 使用微信小程序地图组件 -->
      <map 
        id="myMap"
        class="map"
        :latitude="latitude"
        :longitude="longitude"
        :scale="scale"
        :markers="markers"
        :polyline="polyline"
        :controls="controls"
        show-location
        show-compass
        enable-3D
        enable-overlooking
        enable-zoom
        enable-scroll
        enable-rotate
        @markertap="onMarkerTap"
        @controltap="onControlTap"
        @regionchange="onRegionChange">
      </map>
      
      <!-- 地图控制按钮 -->
      <view class="map-controls">
        <view class="control-btn" @tap="locateMe">
          <text class="icon">📍</text>
          <text class="text">我的位置</text>
        </view>
        <view class="control-btn" @tap="toggleMapType">
          <text class="icon">🗺️</text>
          <text class="text">{{mapTypeText}}</text>
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
          @confirm="searchPlace"
          @focus="onSearchFocus"
          @blur="onSearchBlur">
        <view class="search-btn" @tap="searchPlace">
          <text class="search-icon">🔍</text>
        </view>
      </view>
      
      <!-- 目的地设置 -->
      <view class="destination-panel" v-if="showDestinationPanel">
        <view class="panel-header">
          <text class="title">目的地设置</text>
          <text class="close" @tap="closeDestinationPanel">✕</text>
        </view>
        
        <view class="destination-form">
          <view class="form-group">
            <text class="label">起点坐标</text>
            <input 
              class="input" 
              v-model="startPoint"
              placeholder="经度,纬度"
              @blur="parseStartPoint">
          </view>
          
          <view class="form-group">
            <text class="label">终点坐标</text>
            <input 
              class="input" 
              v-model="endPoint"
              placeholder="经度,纬度"
              @blur="parseEndPoint">
          </view>
          
          <view class="button-group">
            <view class="btn use-robot" @tap="useRobotPosition">
              <text class="btn-icon">🤖</text>
              <text class="btn-text">使用机器人位置</text>
            </view>
            <view class="btn select-on-map" @tap="selectOnMap">
              <text class="btn-icon">🗺️</text>
              <text class="btn-text">地图上选择</text>
            </view>
          </view>
          
          <view class="route-info" v-if="routeInfo.distance">
            <text class="info-item">🚶 距离: {{routeInfo.distance}}公里</text>
            <text class="info-item">⏰ 时间: {{routeInfo.duration}}分钟</text>
            <text class="info-item">📍 模式: {{routeInfo.mode}}</text>
          </view>
          
          <view class="action-buttons">
            <view class="action-btn plan-route" @tap="planRoute">
              <text class="action-icon">🚶</text>
              <text class="action-text">规划步行路线</text>
            </view>
            <view class="action-btn send-to-device" @tap="sendToDevice" :class="{disabled: !routeInfo.distance}">
              <text class="action-icon">📤</text>
              <text class="action-text">发送目的地到机器人</text>
            </view>
            <view class="action-btn clear-route" @tap="clearRoute">
              <text class="action-icon">🗑️</text>
              <text class="action-text">清除路线</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部信息栏 -->
    <view class="bottom-info" v-if="showBottomInfo">
      <view class="info-content">
        <view class="location-info">
          <text class="coord">纬度: {{latitude.toFixed(6)}}</text>
          <text class="coord">经度: {{longitude.toFixed(6)}}</text>
        </view>
        <view class="map-info">
          <text class="scale">比例尺: {{scale}}</text>
          <text class="markers">标记数: {{markers.length}}</text>
        </view>
      </view>
      <view class="toggle-info" @tap="toggleBottomInfo">
        <text class="toggle-icon">{{showBottomInfo ? '👇' : '👆'}}</text>
      </view>
    </view>
  </view>
</template>

<script>
import tabSwipe from '@/mixins/tabSwipe.js'
import { BASE } from '@/config/server.js'
import { getThemeVars } from '@/config/theme.js'
import { emptyRobotData, normalizeRobotData } from '@/config/robot_data.js'

// 高德地图API配置（使用您的高德Key）
const AMAP_KEY = '50af93566ee2e3f73192d2735b9b1aab'
const POLL_INTERVAL = 3000

export default {
  mixins: [tabSwipe],
  data() {
    return {
      pagePath: '/pages/navigation/navigation',
      
      // 地图基础设置
      latitude: 32.1230155,
      longitude: 118.93069167,
      scale: 16,
      mapType: 0,
      
      // 坐标点
      startPoint: '',
      endPoint: '',
      startCoord: null,   // { lng, lat }
      endCoord: null,     // { lng, lat }
      
      // 地图标记
      markers: [],
      robotMarkers: [],
      routeMarkers: [],
      
      // 路径规划
      polyline: [],
      routeInfo: {
        distance: 0,
        duration: 0,
        mode: '步行'
      },
      
      // 地图控件
      controls: [
        {
          id: 1,
          iconPath: '',
          position: {
            left: 10,
            top: 10,
            width: 40,
            height: 40
          },
          clickable: true
        }
      ],
      
      // 搜索
      searchKeyword: '',
      searchResults: [],
      showSearchResults: false,
      
      // 目的地设置
      showDestinationPanel: false,
      currentDest: null,
      
      // 机器人数据（从全局获取）
      robotData: {},
      
      // 底部信息
      showBottomInfo: true,
      
      // 设备状态
      loading: false,
      connected: false,
      lastUpdate: '',
      pollTimer: null,
      theme: getThemeVars()
    }
  },
  
  computed: {
    mapTypeText() {
      return this.mapType === 0 ? '标准' : '卫星'
    },
    headerBarStyle() {
      const h = this.theme.headerBg
      const useGrad = h.indexOf('linear') === 0
      return useGrad ? ('background:' + h + ';') : ('background:' + this.theme.primary + ';')
    },
    cardStyle()  { return 'background:' + this.theme.card + ';border:1rpx solid ' + this.theme.border + ';' },
    cardHdStyle(){ return 'background:' + this.theme.inputBg + ';border-bottom:1rpx solid ' + this.theme.border + ';' },
    labelStyle() { return 'color:' + this.theme.textSub + ';' },
    valueStyle() { return 'color:' + this.theme.text + ';' }
  },
  
  onShow() {
    if (this.translateX !== undefined) {
      this.translateX = 0;
    }
    this.syncTabBar();
    this.theme = getThemeVars();
    this.initMap();
    this.loadRobotData();
    this.startPolling();
  },
  
  onHide() {
    if (this.mapContext) {
      this.mapContext = null;
    }
    this.stopPolling();
  },
  
  onUnload() {
    this.stopPolling();
  },
  
  methods: {
    // ========== 滑动切换 ==========
    handleSwipe(diffX) {
      if (diffX > 0) {
        uni.switchTab({
          url: '/pages/device/device',
          success: () => this.setTabBarActive(0),
          fail: (err) => console.warn('切换tab失败:', err)
        })
      } else if (diffX < 0) {
        uni.switchTab({
          url: '/pages/profile/profile',
          success: () => this.setTabBarActive(2),
          fail: (err) => console.warn('切换tab失败:', err)
        })
      }
    },
    
    // ========== 坐标解析（与Web版一致） ==========
    parseCoords(str) {
      if (!str || typeof str !== 'string') return null;
      const parts = str.trim().split(',').map(parseFloat);
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
      return { lng: parts[0], lat: parts[1] };
    },
    
    parseStartPoint() {
      this.startCoord = this.parseCoords(this.startPoint);
      if (this.startCoord) {
        this.addStartMarker(this.startCoord);
      }
    },
    
    parseEndPoint() {
      this.endCoord = this.parseCoords(this.endPoint);
      if (this.endCoord) {
        this.addEndMarker(this.endCoord);
      }
    },
    
    // ========== 地图初始化 ==========
    initMap() {
      this.mapContext = uni.createMapContext('myMap', this);
      // 检查是否有机器人数据
      let hasRobotData = false;
      if (Array.isArray(this.robotData)) {
        hasRobotData = this.robotData.some(r => r.latitude && r.longitude);
      } else if (typeof this.robotData === 'object' && this.robotData !== null) {
        if (this.robotData.latitude && this.robotData.longitude) {
          hasRobotData = true;
        } else {
          const robots = Object.values(this.robotData);
          hasRobotData = robots.some(r => r.latitude && r.longitude);
        }
      }
      
      if (hasRobotData) {
        // 有机器人数据，使用机器人的位置
        this.updateRobotMarkers();
        // 找到第一个有位置的机器人并将地图中心点设置为其位置
        let targetRobot = null;
        if (Array.isArray(this.robotData)) {
          targetRobot = this.robotData.find(r => r.latitude && r.longitude);
        } else if (typeof this.robotData === 'object' && this.robotData !== null) {
          if (this.robotData.latitude && this.robotData.longitude) {
            targetRobot = this.robotData;
          } else {
            const robots = Object.values(this.robotData);
            targetRobot = robots.find(r => r.latitude && r.longitude);
          }
        }
        if (targetRobot) {
          this.latitude = targetRobot.latitude;
          this.longitude = targetRobot.longitude;
          this.mapContext.moveToLocation();
        }
      } else {
        // 没有机器人数据，获取当前位置
        this.getCurrentLocation();
      }
    },
    
    getCurrentLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.latitude = res.latitude;
          this.longitude = res.longitude;
          this.mapContext.moveToLocation();
        },
        fail: (err) => {
          console.log('获取位置失败:', err);
          uni.showToast({ title: '获取位置失败', icon: 'none' });
        }
      });
    },
    
    startPolling() {
      this.stopPolling();
      this.pollTimer = setInterval(() => { this.fetchRobotData() }, POLL_INTERVAL);
    },

    stopPolling() {
      if (this.pollTimer != null) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },

    // ========== 机器人数据加载 ==========
    loadRobotData() {
      // 从全局或API获取机器人数据
      const app = getApp();
      if (app.globalData.robotData) {
        this.robotData = app.globalData.robotData;
        this.updateRobotMarkers();
      }
    },
    
    async fetchRobotData() {
      if (this.loading) return;
      this.loading = true;
      try {
        // 尝试从多个可能的API接口获取数据
        const apiEndpoints = [
          BASE + '/robot/data',
          BASE + '/robot-data',
          BASE + '/api/robot/data',
          BASE + '/data/robot'
        ];
        
        let success = false;
        
        // 尝试每个接口，直到成功
        for (const endpoint of apiEndpoints) {
          try {
            const res = await uni.request({
              url: endpoint,
              method: 'GET',
              timeout: 10000
            });
            
            const code = res.statusCode;
            const raw = res.data;
            
            console.log('从', endpoint, '获取数据:', code, raw);
            
            if (code === 200 && raw != null) {
              // 处理不同的数据格式
              let data = null;
              if (raw.success === true) {
                data = raw.data;
              } else {
                data = raw;
              }
              
              if (data != null) {
                // 处理数组数据，取第一个元素
                if (Array.isArray(data) && data.length > 0) {
                  data = data[0];
                }
                
                // 确保经纬度字段被正确处理
                if (data.lat) data.latitude = data.lat;
                if (data.lng) data.longitude = data.lng;
                if (data.lon) data.longitude = data.lon;
                
                // 确保温湿度字段被正确处理
                if (data.temp) data.temperature = data.temp;
                if (data.hum) data.humidity = data.hum;
                
                // 确保烟雾值字段被正确处理
                if (data.smokeValue) data.smoke = data.smokeValue;
                
                // 确保人员数字段被正确处理
                if (data.personCount) data.person_count = data.personCount;
                if (data.peopleCount) data.person_count = data.peopleCount;
                
                // 确保卫星数字段被正确处理
                if (data.sat) data.satellites = data.sat;
                if (data.satCount) data.satellites = data.satCount;
                
                // 确保电量和电压字段被正确处理
                if (data.battery) data.batteryLevel = data.battery;
                if (data.voltage) data.voltage = data.voltage;
                if (data.batt) data.batteryLevel = data.batt;
                if (data.volt) data.voltage = data.volt;
                
                this.robotData = normalizeRobotData(data);
                this.updateRobotMarkers();
                // 检查机器人数据是否有经纬度信息，如果有，更新地图中心点
                if (this.robotData.latitude && this.robotData.longitude) {
                  this.latitude = this.robotData.latitude;
                  this.longitude = this.robotData.longitude;
                  if (this.mapContext) {
                    this.mapContext.moveToLocation();
                  }
                }
                this.connected = true;
                const now = new Date();
                const mm = now.getMinutes();
                const ss = now.getSeconds();
                const mmStr = mm < 10 ? ('0' + mm) : ('' + mm);
                const ssStr = ss < 10 ? ('0' + ss) : ('' + ss);
                this.lastUpdate = now.getHours() + ':' + mmStr + ':' + ssStr;
                success = true;
                console.log('成功从', endpoint, '获取数据:', data);
                console.log('处理后的数据:', this.robotData);
                break;
              }
            } else {
              console.warn('从', endpoint, '获取数据失败:', code, raw);
            }
          } catch (e) {
            console.warn('从', endpoint, '获取数据失败:', e.message);
          }
        }
        
        if (!success) {
          this.connected = false;
          console.error('所有API接口都获取数据失败');
        }
      } catch (e) {
        console.error('获取数据失败:', e);
        this.connected = false;
      } finally {
        this.loading = false;
      }
    },
    
    // 更新机器人标记（与Web版样式一致）
    updateRobotMarkers() {
      let robots = [];
      // 处理不同格式的robotData
      if (Array.isArray(this.robotData)) {
        robots = this.robotData;
      } else if (typeof this.robotData === 'object' && this.robotData !== null) {
        // 检查是否是单个机器人对象
        if (this.robotData.latitude && this.robotData.longitude) {
          robots = [this.robotData];
        } else {
          // 尝试获取对象值
          robots = Object.values(this.robotData);
        }
      }
      
      const newMarkers = [];
      
      robots.forEach((r, index) => {
        if (!r.longitude || !r.latitude) return;
        
        const bat = r.batteryLevel || 0;
        const color = bat < 20 ? '#ff4d4f' : bat < 50 ? '#faad14' : '#00d4ff';
        
        // 根据地图缩放级别动态调整标记大小
        const baseSize = 36;
        const scaleFactor = (20 - this.scale) / 17; // 缩放因子，范围0-1
        const fontSize = Math.round(baseSize + scaleFactor * 20); // 字体大小：36-56
        const borderRadius = Math.round(16 + scaleFactor * 8); // 边框半径：16-24
        const padding = Math.round(12 + scaleFactor * 6); // 内边距：12-18
        const borderWidth = Math.round(2 + scaleFactor * 1); // 边框宽度：2-3
        
        newMarkers.push({
          id: 1000 + index,
          latitude: r.latitude,
          longitude: r.longitude,
          title: r.deviceId || 'robot',
          callout: {
            content: `${r.deviceId || 'robot'}\n🔋${bat}%  🚀${(r.speed || 0).toFixed(1)}km/h`,
            color: '#333',
            fontSize: 16,
            bgColor: '#fff',
            borderRadius: 12,
            padding: 12,
            display: 'BYCLICK'
          },
          label: {
            content: `🤖`,
            color: color,
            fontSize: fontSize,
            bgColor: '#fff',
            borderRadius: borderRadius,
            padding: padding,
            borderWidth: borderWidth,
            borderColor: color
          }
        });
      });
      
      // 合并其他标记（起点、终点等）
      const otherMarkers = this.markers.filter(m => m.id < 1000 || m.id === 999);
      this.markers = [...otherMarkers, ...newMarkers];
      this.robotMarkers = newMarkers;
    },
    
    // ========== 标记管理 ==========
    addStartMarker(coord) {
      this.markers = this.markers.filter(m => m.id !== 998);
      this.markers.push({
        id: 998,
        latitude: coord.lat,
        longitude: coord.lng,
        title: '起点',
        iconPath: '/static/start.png',
        width: 30,
        height: 30,
        label: {
          content: '🚩 起点',
          color: '#52c41a',
          fontSize: 12,
          bgColor: '#fff',
          borderRadius: 8,
          padding: 4
        }
      });
    },
    
    addEndMarker(coord) {
      this.markers = this.markers.filter(m => m.id !== 999);
      this.markers.push({
        id: 999,
        latitude: coord.lat,
        longitude: coord.lng,
        title: '目的地',
        iconPath: '/static/map_landmark.png',
        width: 36,
        height: 36,
        label: {
          content: '🏁 终点',
          color: '#ff4d4f',
          fontSize: 12,
          bgColor: '#fff',
          borderRadius: 8,
          padding: 4
        }
      });
      this.currentDest = coord;
    },
    
    // ========== 用户操作 ==========
    locateMe() {
      this.getCurrentLocation();
      uni.showToast({ title: '定位到当前位置', icon: 'success' });
    },
    
    toggleMapType() {
      this.mapType = this.mapType === 0 ? 1 : 0;
      uni.showToast({ title: `切换到${this.mapTypeText}地图`, icon: 'none' });
    },
    
    zoomIn() {
      if (this.scale < 20) {
        this.scale += 1;
        this.updateRobotMarkers(); // 缩放后更新标记大小
      }
    },
    
    zoomOut() {
      if (this.scale > 3) {
        this.scale -= 1;
        this.updateRobotMarkers(); // 缩放后更新标记大小
      }
    },
    
    // 地图缩放事件处理
    mapScaleChanged(e) {
      this.scale = e.detail.scale;
      this.updateRobotMarkers(); // 缩放后更新标记大小
    },
    
    useRobotPosition() {
      const robots = Object.values(this.robotData);
      if (!robots.length) {
        uni.showToast({ title: '暂无机器人数据', icon: 'none' });
        return;
      }
      const robot = robots[0];
      this.startPoint = `${robot.longitude.toFixed(6)},${robot.latitude.toFixed(6)}`;
      this.startCoord = { lng: robot.longitude, lat: robot.latitude };
      this.addStartMarker(this.startCoord);
      uni.showToast({ title: '已使用机器人位置', icon: 'success' });
    },
    
    selectOnMap() {
      uni.showToast({ title: '请点击地图上的位置', icon: 'none' });
      // 小程序地图需要其他方式实现点击选点
    },
    
    // ========== 路线规划（调用高德API） ==========
    async planRoute() {
      if (!this.startCoord) {
        uni.showToast({ title: '请输入起点坐标', icon: 'error' });
        return;
      }
      if (!this.endCoord) {
        uni.showToast({ title: '请输入终点坐标', icon: 'error' });
        return;
      }
      
      uni.showLoading({ title: '规划路线中...' });
      
      try {
        const url = `https://restapi.amap.com/v3/direction/walking?origin=${this.startCoord.lng},${this.startCoord.lat}&destination=${this.endCoord.lng},${this.endCoord.lat}&key=${AMAP_KEY}`;
        
        const res = await uni.request({ url, method: 'GET' });
        const data = res.data;
        
        if (data.status !== '1' || !data.route?.paths?.length) {
          throw new Error(data.info || '规划失败');
        }
        
        const path = data.route.paths[0];
        this.clearRoute();
        
        // 解析路线点
        const points = [];
        path.steps.forEach(step => {
          step.polyline.split(';').forEach(p => {
            const [lng, lat] = p.split(',').map(Number);
            if (!isNaN(lng)) {
              points.push({ longitude: lng, latitude: lat });
            }
          });
        });
        
        // 绘制路线
        this.polyline = [{
          points: points,
          color: '#00d4ff',
          width: 6,
          dottedLine: false,
          borderColor: '#fff',
          borderWidth: 1
        }];
        
        // 更新路线信息
        const distance = (path.distance / 1000).toFixed(2);
        const minutes = Math.ceil(path.duration / 60);
        this.routeInfo = {
          distance: distance,
          duration: minutes,
          mode: '步行'
        };
        
        // 调整地图视野
        this.fitRouteBounds(points);
        
        uni.showToast({ title: `规划完成：${distance}公里，约${minutes}分钟`, icon: 'success' });
        
      } catch (err) {
        console.error('路线规划失败:', err);
        uni.showToast({ title: '路线规划失败: ' + err.message, icon: 'error' });
      } finally {
        uni.hideLoading();
      }
    },
    
    fitRouteBounds(points) {
      if (!points.length) return;
      
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      
      points.forEach(p => {
        minLat = Math.min(minLat, p.latitude);
        maxLat = Math.max(maxLat, p.latitude);
        minLng = Math.min(minLng, p.longitude);
        maxLng = Math.max(maxLng, p.longitude);
      });
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latDelta = maxLat - minLat;
      const lngDelta = maxLng - minLng;
      const scale = Math.floor(16 - Math.max(latDelta, lngDelta) * 100);
      
      this.latitude = centerLat;
      this.longitude = centerLng;
      this.scale = Math.max(12, Math.min(18, scale));
    },
    
    // ========== 发送到机器人 ==========
    async sendToDevice() {
      if (!this.currentDest) {
        uni.showToast({ title: '请先规划路线', icon: 'warning' });
        return;
      }
      
      uni.showModal({
        title: '发送目的地',
        content: `将目的地发送到巡检机器人？\n${this.currentDest.lng.toFixed(6)}, ${this.currentDest.lat.toFixed(6)}`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '发送中...' });
            try {
              const response = await uni.request({
                url: BASE + '/api/destination/set?type=destination&longitude=' + this.currentDest.lng + '&latitude=' + this.currentDest.lat + '&name=' + encodeURIComponent(`${this.currentDest.lng},${this.currentDest.lat}`),
                method: 'GET'
              });
              
              if (response.data.success) {
                uni.showToast({ title: '目的地已发送到机器人', icon: 'success' });
              } else {
                throw new Error('发送失败');
              }
            } catch (err) {
              console.error('发送失败:', err);
              uni.showToast({ title: '发送失败: ' + err.message, icon: 'error' });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    },
    
    // ========== 清除路线 ==========
    clearRoute() {
      this.polyline = [];
      this.routeInfo = { distance: 0, duration: 0, mode: '步行' };
      this.currentDest = null;
      this.endCoord = null;
      this.endPoint = '';
      this.startCoord = null;
      this.startPoint = '';
      
      // 移除起点和终点标记
      this.markers = this.markers.filter(m => m.id !== 998 && m.id !== 999);
      
      uni.showToast({ title: '已清除路线', icon: 'success' });
    },
    
    // ========== 搜索地点 ==========
    searchPlace() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
        return;
      }
      uni.showLoading({ title: '搜索中...' });
      this.searchWithAmap(this.searchKeyword);
    },
    
    async searchWithAmap(keyword) {
      try {
        const url = `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(keyword)}&key=${AMAP_KEY}&city=南京`;
        const res = await uni.request({ url, method: 'GET' });
        const data = res.data;
        
        uni.hideLoading();
        
        if (data.status === '1' && data.pois && data.pois.length) {
          const poi = data.pois[0];
          const [lng, lat] = poi.location.split(',').map(Number);
          this.endPoint = `${lng},${lat}`;
          this.endCoord = { lng, lat };
          this.addEndMarker(this.endCoord);
          uni.showToast({ title: `已定位到：${poi.name}`, icon: 'success' });
        } else {
          uni.showToast({ title: '未找到相关地点', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('搜索出错:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    onSearchFocus() {
      this.showSearchResults = true;
    },
    
    onSearchBlur() {
      setTimeout(() => { this.showSearchResults = false; }, 200);
    },
    
    // ========== 面板控制 ==========
    openDestinationPanel() {
      this.showDestinationPanel = true;
    },
    
    closeDestinationPanel() {
      this.showDestinationPanel = false;
    },
    
    onMarkerTap(e) {
      const markerId = e.markerId;
      const marker = this.markers.find(m => m.id === markerId);
      if (marker) {
        let title = '位置信息';
        if (marker.id === 998) title = '起点';
        else if (marker.id === 999) title = '目的地';
        else if (marker.id >= 1000) title = '机器人';
        
        uni.showModal({
          title: title,
          content: `GPS坐标：${marker.longitude.toFixed(6)}, ${marker.latitude.toFixed(6)}`,
          showCancel: false
        });
      }
    },
    
    onControlTap(e) {
      if (e.controlId === 1) this.locateMe();
    },
    
    onRegionChange(e) {
      if (e.type === 'end') {
        this.mapContext.getCenterLocation({
          success: (res) => {
            this.latitude = res.latitude;
            this.longitude = res.longitude;
          }
        });
        // 当地图缩放时，更新机器人标记大小
        if (e.causedBy === 'scale') {
          this.mapContext.getScale({
            success: (res) => {
              this.scale = res.scale;
              this.updateRobotMarkers();
            }
          });
        }
      }
    },
    
    toggleBottomInfo() {
      this.showBottomInfo = !this.showBottomInfo;
    }
  }
}
</script>

<style scoped>
.page {
  flex: 1;
  background: #f5f5f5;
  position: relative;
  min-height: 100vh;
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
  z-index: 998;
  position: relative;
}

/* 状态栏 */
.status-bar {
  flex-direction: row;
  align-items: center;
  padding: 16rpx 30rpx;
  z-index: 997;
  position: relative;
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

.map-container {
  width: 100%;
  height: calc(100vh - 120rpx);
  position: relative;
  z-index: 1;
  overflow: visible;
}

.map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 地图控制按钮 */
.map-controls {
  position: absolute;
  top: 180rpx;
  right: 20rpx;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.control-btn {
  background: #ffffff;
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
  right: 20rpx;
  z-index: 1000;
  display: flex;
  gap: 10rpx;
}

.search-input {
  flex: 1;
  background: #ffffff;
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

/* 目的地面板 */
.destination-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border-top-left-radius: 30rpx;
  border-top-right-radius: 30rpx;
  padding: 40rpx 30rpx 30rpx;
  z-index: 200;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.panel-header .title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.panel-header .close {
  font-size: 38rpx;
  color: #999;
  padding: 10rpx;
}

.destination-form {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.form-group .label {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.form-group .input {
  background: #f5f5f5;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.button-group {
  display: flex;
  gap: 20rpx;
  margin: 10rpx 0;
}

.button-group .btn {
  flex: 1;
  background: #f5f5f5;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.button-group .btn:active {
  background: #e8e8e8;
}

.btn-icon {
  font-size: 36rpx;
}

.btn-text {
  font-size: 24rpx;
  color: #333;
}

.route-info {
  background: #f8f9fa;
  border: 1rpx solid #e9ecef;
  border-radius: 12rpx;
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
  justify-content: space-around;
  flex-wrap: wrap;
}

.info-item {
  font-size: 26rpx;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 15rpx;
  margin-top: 20rpx;
}

.action-btn {
  flex: 1;
  border-radius: 12rpx;
  padding: 25rpx 15rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.action-btn.plan-route {
  background: #008c8c;
}

.action-btn.send-to-device {
  background: #4CAF50;
}

.action-btn.send-to-device.disabled {
  background: #cccccc;
  opacity: 0.6;
}

.action-btn.clear-route {
  background: #f44336;
}

.action-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.action-icon {
  font-size: 32rpx;
  color: white;
}

.action-text {
  font-size: 24rpx;
  color: white;
  font-weight: 500;
}

/* 底部信息栏 */
.bottom-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding: 20rpx 30rpx;
  z-index: 150;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.info-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.location-info, .map-info {
  display: flex;
  flex-direction: column;
  gap: 5rpx;
}

.coord, .scale, .markers {
  font-size: 22rpx;
  color: #666;
}

.toggle-info {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10rpx;
}

.toggle-icon {
  font-size: 24rpx;
  color: #999;
}
</style>