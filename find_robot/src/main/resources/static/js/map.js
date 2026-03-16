// ── 地图模块 ──────────────────────────────────────────────
const MapModule = {
  map: null,
  markers: [],
  routeMarkers: [],
  routePolylines: [],
  ready: false,
  currentDest: null,

  init() {
    if (typeof AMap === 'undefined') return;
    this.map = new AMap.Map('map', {
      zoom: 16,
      center: [118.93069167, 32.1230155],
      viewMode: '3D',
      mapStyle: 'amap://styles/normal'
    });
    this.map.on('complete', () => {
      this.ready = true;
      document.dispatchEvent(new Event('mapReady'));
    });
  },

  updateMarkers(robots) {
    if (!this.ready) return;
    this.markers.forEach(m => this.map.remove(m));
    this.markers = [];
    robots.forEach(r => {
      if (!r.longitude || !r.latitude) return;
      const bat = r.batteryLevel || 0;
      const color = bat < 20 ? '#ff4d4f' : bat < 50 ? '#faad14' : '#00d4ff';
      const marker = new AMap.Marker({
        position: [r.longitude, r.latitude],
        content: `<div style="background:linear-gradient(135deg,${color},#4facfe);border:3px solid #fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,212,255,0.5);font-size:16px">🤖</div>`,
        offset: new AMap.Pixel(-18, -18),
        title: r.deviceId
      });
      const info = new AMap.InfoWindow({
        content: `<div style="color:#333;padding:10px;min-width:200px;font-family:'Microsoft YaHei'">
          <b style="color:#1890ff">${r.deviceId || 'robot'}</b><hr style="margin:6px 0">
          <div>📍 ${r.longitude?.toFixed(6)}, ${r.latitude?.toFixed(6)}</div>
          <div>🔋 ${bat}% &nbsp; ⚡ ${(r.voltage||0).toFixed(2)}V</div>
          <div>🚀 ${(r.speed||0).toFixed(1)} km/h &nbsp; 📡 ${r.satellites||0}颗</div>
        </div>`,
        offset: new AMap.Pixel(0, -30)
      });
      marker.on('click', () => info.open(this.map, marker.getPosition()));
      this.map.add(marker);
      this.markers.push(marker);
    });
  },

  toggleStyle() {
    this._dark = !this._dark;
    this.map?.setMapStyle('amap://styles/' + (this._dark ? 'dark' : 'normal'));
  },

  fitAll() {
    if (!this.ready || !this.markers.length) return;
    this.map.setFitView(this.markers);
  },

  focusOn(lng, lat) {
    if (!this.ready) return;
    this.map.setCenter([lng, lat]);
    this.map.setZoom(18);
  },

  clearRoute() {
    this.routeMarkers.forEach(m => this.map.remove(m));
    this.routePolylines.forEach(p => this.map.remove(p));
    this.routeMarkers = [];
    this.routePolylines = [];
    document.getElementById('routeInfo').style.display = 'none';
    document.getElementById('destInfo').style.display = 'none';
    this.currentDest = null;
  },

  async planRoute(startLng, startLat, endLng, endLat) {
    const url = `https://restapi.amap.com/v3/direction/walking?origin=${startLng},${startLat}&destination=${endLng},${endLat}&key=c216de193661bf95f9891763d1837c8f`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== '1' || !data.route?.paths?.length) throw new Error(data.info || '规划失败');

    const path = data.route.paths[0];
    this.clearRoute();

    // 绘制路线
    const points = [];
    path.steps.forEach(step => {
      step.polyline.split(';').forEach(p => {
        const [lng, lat] = p.split(',').map(Number);
        if (!isNaN(lng)) points.push([lng, lat]);
      });
    });
    const poly = new AMap.Polyline({
      path: points, strokeColor: '#00d4ff', strokeWeight: 5,
      strokeOpacity: 0.9, lineJoin: 'round'
    });
    this.map.add(poly);
    this.routePolylines.push(poly);

    // 起终点标记
    [[startLng, startLat, '起', '#52c41a'], [endLng, endLat, '终', '#ff4d4f']].forEach(([lng, lat, label, color]) => {
      const m = new AMap.Marker({
        position: [lng, lat],
        content: `<div style="background:${color};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${label}</div>`,
        offset: new AMap.Pixel(-14, -14)
      });
      this.map.add(m);
      this.routeMarkers.push(m);
    });

    this.map.setFitView([...this.routeMarkers, poly]);

    const dist = (path.distance / 1000).toFixed(2);
    const mins = Math.ceil(path.duration / 60);

    // 更新路线信息
    const ri = document.getElementById('routeInfo');
    if (ri) {
      ri.style.display = 'block';
      ri.innerHTML = `距离: <b style="color:var(--accent)">${dist}公里</b> &nbsp;|&nbsp; 步行约 <b style="color:var(--accent)">${mins}分钟</b>`;
    }

    this.currentDest = { longitude: endLng, latitude: endLat, name: `${endLng},${endLat}` };
    const di = document.getElementById('destInfo');
    if (di) {
      di.style.display = 'block';
      di.textContent = `目的地: ${endLng.toFixed(6)}, ${endLat.toFixed(6)}`;
    }

    return { dist, mins };
  }
};
