export default {
  data() {
    return {
      startX: 0,
      startY: 0,
      // 新增：滑动偏移量
      translateX: 0,
      // 缓存窗口宽度，避免重复调用API
      windowWidth: 0,
      // tab 配置映射
      tabConfig: [
        { path: '/pages/device/device', index: 0 },
        { path: '/pages/navigation/navigation', index: 1 },
        { path: '/pages/profile/profile', index: 2 }
      ]
    }
  },
  onLoad() {
    // 在页面加载时获取并缓存窗口宽度
    this.getWindowWidth()
  },
  onShow() {
    // 页面显示时重置位移并同步 tabBar 选中状态
    this.translateX = 0
    this.syncTabBar()
  },
  methods: {
    // 兼容获取窗口宽度的方法
    getWindowWidth() {
      try {
        // 优先使用新版API
        if (wx.getWindowInfo) {
          const windowInfo = wx.getWindowInfo()
          this.windowWidth = windowInfo.windowWidth
        } else if (wx.getSystemInfoSync) {
          // 兼容旧版API（带降级处理）
          const systemInfo = wx.getSystemInfoSync()
          this.windowWidth = systemInfo.windowWidth
        } else {
          // 默认值
          this.windowWidth = 375
        }
      } catch (e) {
        // 异常时使用默认宽度
        this.windowWidth = 375
      }
    },
    
    // 同步当前页面的 tabBar 选中状态 - 兼容所有版本
    syncTabBar() {
      try {
        // 方式1: 通过getCurrentPages获取当前页面路径
        let currentPath = ''
        const pages = getCurrentPages()
        
        if (pages && pages.length > 0) {
          const currentPage = pages[pages.length - 1]
          currentPath = '/' + currentPage.route
        }
        
        // 方式2: 备选方案 - 使用页面自身定义的路径
        if (!currentPath) {
          currentPath = this.pagePath || ''
        }
        
        // 找到对应的tab项
        const tabItem = this.tabConfig.find(item => item.path === currentPath)
        if (tabItem) {
          // 兼容方式设置tabBar选中状态
          this.setTabBarActive(tabItem.index)
        }
      } catch (e) {
        console.warn('同步tabBar状态失败:', e)
      }
    },
    
    // 兼容所有版本的tabBar选中状态设置方法
    setTabBarActive(activeIndex) {
      // 遍历所有tab项，设置选中/未选中状态
      this.tabConfig.forEach((item, index) => {
        uni.setTabBarItem({
          index: index,
          selected: index === activeIndex
        })
      })
    },
    
    // 触摸开始
    onTouchStart(e) {
      this.startX = e.touches[0].clientX
      this.startY = e.touches[0].clientY
      // 重置位移
      this.translateX = 0
    },
    
    // 新增：触摸移动 - 实时更新位移（修复废弃API）
    onTouchMove(e) {
      const moveX = e.touches[0].clientX
      const diffX = moveX - this.startX
      const diffY = e.touches[0].clientY - this.startY
      
      // 只处理水平滑动
      if (Math.abs(diffY) > Math.abs(diffX)) return
      
      // 使用缓存的窗口宽度，避免重复调用废弃API
      const maxTranslate = this.windowWidth * 0.3
      if (Math.abs(diffX) <= maxTranslate) {
        this.translateX = diffX
      }
    },
    
    // 触摸结束
    onTouchEnd(e) {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = endX - this.startX
      const diffY = endY - this.startY
      
      // 重置位移
      this.translateX = 0
      
      // 过滤垂直滑动（只处理水平滑动）
      if (Math.abs(diffY) > Math.abs(diffX)) return
      
      // 滑动阈值：50px
      if (Math.abs(diffX) > 50) {
        this.handleSwipe(diffX)
      }
    },
    
    // 处理滑动逻辑（需要在具体页面实现）
    handleSwipe(diffX) {
      // 由具体页面实现
    }
  }
}