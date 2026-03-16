// ── 全局状态 ──────────────────────────────────────────────
const App = {
  robotData: {},
  currentPage: 'dashboard',
  refreshTimer: null,
  username: localStorage.getItem('currentUsername') || '用户',

  // ── 初始化 ────────────────────────────────────────────
  init() {
    this.renderUsername();
    this.bindNav();
    this.bindUserMenu();
    this.startRefresh();
    this.navigate('dashboard');
  },

  renderUsername() {
    const el = document.getElementById('username');
    if (el) el.textContent = this.username;
    const av = document.getElementById('avatar');
    if (av) av.textContent = this.username.charAt(0).toUpperCase();
  },

  // ── 导航 ──────────────────────────────────────────────
  bindNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.navigate(item.dataset.page));
    });
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    const titles = { dashboard: '数据监控', video: '视频监控', location: '位置检测', control: '设备控制' };
    const el = document.getElementById('page-title');
    if (el) el.textContent = titles[page] || '';
  },

  // ── 用户菜单 ──────────────────────────────────────────
  bindUserMenu() {
    const btn = document.getElementById('userBtn');
    const dd  = document.getElementById('dropdown');
    if (!btn || !dd) return;
    btn.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('show'); });
    document.addEventListener('click', () => dd.classList.remove('show'));
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
  },

  async logout() {
    try { await API.logout(); } catch (_) {}
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
  },

  // ── 数据刷新 ──────────────────────────────────────────
  startRefresh() {
    this.fetchData();
    this.refreshTimer = setInterval(() => this.fetchData(), 3000);
  },

  async fetchData() {
    try {
      const data = await API.getRobotData();
      this.processData(data);
      this.setStatus(true);
    } catch (e) {
      this.setStatus(false);
    }
  },

  processData(data) {
    if (!data || !data.length) return;
    data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const map = {};
    data.forEach(d => {
      const id = d.deviceId || 'robot';
      if (!map[id] || d.timestamp > map[id].timestamp) map[id] = d;
    });
    this.robotData = map;
    document.dispatchEvent(new CustomEvent('robotDataUpdated', { detail: Object.values(map) }));
  },

  setStatus(online) {
    const dot  = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (dot)  dot.className  = 'status-dot' + (online ? '' : ' offline');
    if (text) text.textContent = online ? '数据在线' : '连接断开';
  }
};

// ── 工具函数 ──────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function parseCoords(str) {
  const parts = str.split(',').map(s => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
    return { lng: parts[0], lat: parts[1] };
  return null;
}

function formatTime(ts) {
  if (!ts) return '--';
  const d = new Date(ts < 1e12 ? ts * 1000 : ts);
  return d.toLocaleTimeString();
}

function timeSince(ts) {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 1000);
  if (sec < 10)   return '刚刚';
  if (sec < 60)   return `${sec}秒前`;
  if (sec < 3600) return `${Math.floor(sec/60)}分钟前`;
  return `${Math.floor(sec/3600)}小时前`;
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  App.init();
  LocationPage.init();
});
