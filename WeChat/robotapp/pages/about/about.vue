<template>
    <view class="container" :style="'background:' + theme.bg + ';'">
        <!-- 导航头部 -->
        <view class="nav-header" :style="'background:' + theme.card + ';border-bottom:1rpx solid ' + theme.border + ';'">
            <view class="nav-back" @click="goBack">
                <text class="back-text" :style="'color:' + theme.primary + ';'">‹</text>
                <text class="back-label" :style="'color:' + theme.primary + ';'">返回</text>
            </view>
            <text class="nav-title" :style="'color:' + theme.text + ';'">关于我们</text>
            <view class="nav-placeholder"></view>
        </view>

        <!-- 内容区域 -->
        <scroll-view class="content" scroll-y="true">
            <!-- 顶部图片 -->
            <view class="image-section">
                <image class="campus-image" src="/static/banner-list.jpg" mode="aspectFill"></image>
                <view class="image-overlay">
                    <text class="overlay-title" :style="'color:' + theme.card + ';'">南京工业职业技术大学</text>
                    <text class="overlay-subtitle" :style="'color:' + theme.card + ';'">Nanjing Vocational University of Industry Technology</text>
                </view>
            </view>

            <!-- 学校信息 -->
            <view class="info-card" :style="'background:' + theme.card + ';border:1rpx solid ' + theme.border + ';'">
                <view class="card-header">
                    <text class="header-icon">🏫</text>
                    <text class="header-title" :style="'color:' + theme.text + ';'">学校信息</text>
                </view>
                
                <!-- 联系信息 -->
                <view class="contact-list">
                    <view class="contact-item">
                        <text class="contact-icon">📞</text>
                        <view class="contact-info">
                            <text class="contact-label">联系电话</text>
                            <text class="contact-value" :style="'color:' + theme.text + ';'">025-85864009</text>
                        </view>
                    </view>
                    <view class="contact-item">
                        <text class="contact-icon">🎓</text>
                        <view class="contact-info">
                            <text class="contact-label">招生咨询电话</text>
                            <text class="contact-value" :style="'color:' + theme.text + ';'">025-85861136</text>
                        </view>
                    </view>
                    <view class="contact-item">
                        <text class="contact-icon">📠</text>
                        <view class="contact-info">
                            <text class="contact-label">传真</text>
                            <text class="contact-value" :style="'color:' + theme.text + ';'">025-84498778</text>
                        </view>
                    </view>
                    <view class="contact-item">
                        <text class="contact-icon">📧</text>
                        <view class="contact-info">
                            <text class="contact-label">E-mail</text>
                            <text class="contact-value" :style="'color:' + theme.text + ';'">nlit@nlit.edu.cn</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 地图定位 -->
            <view class="map-card" :style="'background:' + theme.card + ';border:1rpx solid ' + theme.border + ';'">
                <view class="card-header">
                    <text class="header-icon">📍</text>
                    <text class="header-title" :style="'color:' + theme.text + ';'">学校位置</text>
                </view>
                <view class="map-container">
                    <!-- 地图组件 -->
                    <map 
                        class="map" 
                        :latitude="latitude" 
                        :longitude="longitude"
                        :markers="markers"
                        scale="16"
                        show-location
                        @tap="handleOpenMapLocation"
                    ></map>
                    <view class="map-overlay" @click="handleOpenMapLocation">
                        <text class="map-address">点击查看详细位置</text>
                    </view>
                </view>
                <text class="location-text" :style="'color:' + theme.textSub + ';'">江苏省南京市栖霞区仙林大学城羊山北路1号</text>
            </view>

            <!-- 开发团队 -->
            <view class="team-card" :style="'background:' + theme.card + ';border:1rpx solid ' + theme.border + ';'">
                <view class="card-header">
                    <text class="header-icon">👥</text>
                    <text class="header-title" :style="'color:' + theme.text + ';'">开发团队</text>
                </view>
                <text class="team-info" :style="'color:' + theme.text + ';'">李文卓</text>
                
                <!-- 联系信息 -->
                <view class="contact-list team-contact">
                    <view class="contact-item">
                        <text class="contact-icon">📞</text>
                        <view class="contact-info">
                            <text class="contact-label">电话</text>
                            <text class="contact-value" :style="'color:' + theme.text + ';'">13865571613</text>
                        </view>
                    </view>
                    <view class="contact-item">
                        <text class="contact-icon">📧</text>
                        <view class="contact-info">
                            <text class="contact-label">邮箱</text>
                            <text class="contact-value" :style="'color:' + theme.text + ';'">3397214850@qq.com</text>
                        </view>
                    </view>
                    <view class="contact-item">
                        <text class="contact-icon">💬</text>
                        <view class="contact-info">
                            <text class="contact-label">微信</text>
                            <text class="contact-value" :style="'color:' + theme.text + ';'">liwenzhuo1115</text>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 底部信息 -->
            <view class="bottom-info">
                <text class="copyright" :style="'color:' + theme.textSub + ';'">©2025 南京工业职业技术大学 版权所有</text>
            </view>
        </scroll-view>
    </view>
</template>

<script>
import { getThemeVars } from '@/config/theme.js'

export default {
    data() {
        return {
            latitude: 32.12934755,
            longitude: 118.95012178,
            markers: [{
                id: 1,
                latitude: 32.12934755,
                longitude: 118.95012178,
                title: '南京工业职业技术大学',
                width: 30,
                height: 30
            }],
            theme: getThemeVars()
        }
    },
    onShow() { this.theme = getThemeVars() },
    
    methods: {
        // 返回上一页
        goBack() {
            uni.navigateBack()
        },
        
        // 打开系统地图查看详细位置（与页面方法名避免与内置符号冲突）
        handleOpenMapLocation() {
            uni.openLocation({
                latitude: this.latitude,
                longitude: this.longitude,
                name: '南京工业职业技术大学',
                address: '江苏省南京市栖霞区仙林大学城羊山北路1号',
                scale: 18
            })
        }
    }
}
</script>

<style scoped>
.container {
    flex: 1;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
}

/* 导航头部 */
.nav-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 40rpx 30rpx 20rpx;
    background: white;
    border-bottom: 1rpx solid #f0f0f0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: 120rpx;
    box-sizing: border-box;
}

.nav-back {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.back-text {
    font-size: 48rpx;
    color: #1890ff;
    margin-right: 10rpx;
}

.back-label {
    font-size: 28rpx;
    color: #1890ff;
}

.nav-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333333;
}

.nav-placeholder {
    width: 120rpx;
}

/* 内容区域 */
.content {
    flex: 1;
    margin-top: 120rpx;
    height: auto;
}

/* 顶部图片 */
.image-section {
    width: 100%;
    height: 400rpx;
    position: relative;
    overflow: hidden;
}

.campus-image {
    width: 100%;
    height: 100%;
}

.image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    padding: 40rpx 30rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.overlay-title {
    font-size: 40rpx;
    font-weight: bold;
    color: white;
    text-align: center;
    margin-bottom: 10rpx;
    text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.3);
}

.overlay-subtitle {
    font-size: 24rpx;
    color: rgba(255,255,255,0.9);
    text-align: center;
    text-shadow: 0 1rpx 2rpx rgba(0,0,0,0.3);
}

/* 卡片样式 */
.info-card,
.map-card,
.team-card {
    background: white;
    border-radius: 20rpx;
    padding: 30rpx;
    margin: 10rpx 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

/* 卡片头部 */
.card-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 30rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
}

.header-icon {
    font-size: 36rpx;
    margin-right: 15rpx;
}

.header-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
}

/* 联系信息列表 */
.contact-list {
    margin: 0;
}

.contact-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 25rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
}

.contact-item:first-child {
    padding-top: 0;
}

.contact-item:last-child {
    padding-bottom: 0;
    border-bottom: none;
}

.contact-icon {
    font-size: 32rpx;
    margin-right: 20rpx;
    width: 40rpx;
    text-align: center;
}

.contact-info {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
}

/* 学校信息样式 */
.info-card .contact-info {
    justify-content: center;
}

.info-card .contact-label {
    font-size: 24rpx;
    color: #666666;
    min-width: 120rpx;
    margin-right: 10rpx;
}

.info-card .contact-value {
    font-size: 24rpx;
    color: #333333;
    font-weight: 400;
    flex: 1;
    text-align: left;
}

/* 开发团队样式 */
.team-card .contact-info {
    justify-content: flex-start;
}

.team-card .contact-label {
    font-size: 24rpx;
    color: #666666;
    min-width: 80rpx;
    margin-right: 10rpx;
}

.team-card .contact-value {
    font-size: 24rpx;
    color: #333333;
    font-weight: 400;
    flex: 1;
    text-align: left;
}

/* 地图部分 */
.map-container {
    position: relative;
    border-radius: 15rpx;
    overflow: hidden;
    margin-bottom: 20rpx;
}

.map {
    width: 100%;
    height: 400rpx;
}

.map-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    padding: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.map-address {
    color: white;
    font-size: 28rpx;
    text-align: center;
    font-weight: 500;
}

.location-text {
    font-size: 26rpx;
    color: #666666;
    text-align: center;
    line-height: 1.4;
}

/* 团队信息 */
.team-info {
    font-size: 28rpx;
    color: #333333;
    text-align: center;
    margin-bottom: 20rpx;
    font-weight: 500;
}

/* 团队联系信息 */
.team-contact {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;
}

/* 底部信息 */
.bottom-info {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx 30rpx;
    background: #f8f9fa;
    margin-top: 20rpx;
}

.copyright {
    font-size: 24rpx;
    color: #999999;
    text-align: center;
}
</style>