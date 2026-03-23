// ── 位置检测 & 高德地图 ───────────────────────────────────
let mapObj = null, mapReady = false, mapDark = false;
let mapMarkers = [], routeMarkers = [], routePolylines = [], currentDest = null;

function initMap() {
  if (typeof AMap === 'undefined' || mapReady) return;
  mapObj = new AMap.Map('map', {
    zoom: 16,
    center: [118.93069167, 32.1230155],
    mapStyle: 'amap://styles/normal'
  });
  mapObj.on('complete', () => {
    mapReady = true;
    updateMapMarkers(Object.values(robotData));
  });
}

function updateLocation(robots) {
  if (mapReady) updateMapMarkers(robots);
  const list = document.getElementById('loc-robotList');
  if (!list) return;
  if (!robots.length) { list.innerHTML = '<div class="empty"><div class="icon">📡</div>等待数据...</div>'; return; }
  list.innerHTML = robots.map(r => {
    const bat = r.batteryLevel || 0;
    const cls = bat > 70 ? 'bat-high' : bat > 30 ? 'bat-mid' : 'bat-low';
    return `<div class="robot-item" onclick="focusRobot(${r.longitude},${r.latitude})">
      <div style="display:flex;justify-content:space-between">
        <span class="robot-name">${r.deviceId || 'robot'}</span>
        <span style="font-size:12px;color:${bat > 30 ? 'var(--success)' : 'var(--danger)'}">${bat}%</span>
      </div>
      <div class="robot-meta">📍 ${(r.longitude || 0).toFixed(5)}, ${(r.latitude || 0).toFixed(5)}<br>
        🚀 ${(r.speed || 0).toFixed(1)} km/h &nbsp; ⏰ ${timeSince(r.timestamp)}</div>
      <div class="battery-bar"><div class="battery-fill ${cls}" style="width:${bat}%"></div></div>
    </div>`;
  }).join('');
}

function updateMapMarkers(robots) {
  mapMarkers.forEach(m => mapObj.remove(m));
  mapMarkers = [];
  robots.forEach(r => {
    if (!r.longitude || !r.latitude) return;
    const bat = r.batteryLevel || 0;
    const color = bat < 20 ? '#ff4d4f' : bat < 50 ? '#faad14' : '#00d4ff';
    const m = new AMap.Marker({
      position: [r.longitude, r.latitude],
      content: `<div style="background:linear-gradient(135deg,${color},#4facfe);border:3px solid #fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,212,255,.5);font-size:16px">🤖</div>`,
      offset: new AMap.Pixel(-18, -18)
    });
    const info = new AMap.InfoWindow({
      content: `<div style="color:#333;padding:10px;min-width:190px;font-family:'Microsoft YaHei'">
        <b style="color:#1890ff">${r.deviceId || 'robot'}</b><hr style="margin:6px 0">
        <div>📍 ${r.longitude.toFixed(6)}, ${r.latitude.toFixed(6)}</div>
        <div>🔋 ${bat}% &nbsp; ⚡ ${(r.voltage || 0).toFixed(2)}V</div>
        <div>🚀 ${(r.speed || 0).toFixed(1)} km/h &nbsp; 📡 ${r.satellites || 0}颗</div>
      </div>`,
      offset: new AMap.Pixel(0, -30)
    });
    m.on('click', () => info.open(mapObj, m.getPosition()));
    mapObj.add(m);
    mapMarkers.push(m);
  });
}

function focusRobot(lng, lat) {
  if (mapObj) { mapObj.setCenter([lng, lat]); mapObj.setZoom(18); }
  document.getElementById('loc-start').value = lng.toFixed(6) + ',' + lat.toFixed(6);
}

function useRobotPos(field) {
  const robots = Object.values(robotData);
  if (!robots.length) { toast('暂无机器人数据', 'warning'); return; }
  const r = robots[0];
  document.getElementById('loc-' + field).value = r.longitude.toFixed(6) + ',' + r.latitude.toFixed(6);
}

function mapFitAll() {
  if (mapMarkers.length) mapObj.setFitView(mapMarkers);
}

function mapToggleStyle() {
  mapDark = !mapDark;
  mapObj?.setMapStyle('amap://styles/' + (mapDark ? 'dark' : 'normal'));
}

async function planRoute() {
  const s = parseCoords(document.getElementById('loc-start').value);
  const e = parseCoords(document.getElementById('loc-end').value);
  if (!s) { toast('请输入起点坐标', 'error'); return; }
  if (!e) { toast('请输入终点坐标', 'error'); return; }
  const btn = document.getElementById('loc-planBtn');
  btn.disabled = true; btn.textContent = '规划中...';
  try {
    const url = `https://restapi.amap.com/v3/direction/walking?origin=${s.lng},${s.lat}&destination=${e.lng},${e.lat}&key=c216de193661bf95f9891763d1837c8f`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== '1' || !data.route?.paths?.length) throw new Error(data.info || '规划失败');
    const path = data.route.paths[0];
    clearRoute();
    const pts = [];
    path.steps.forEach(step => step.polyline.split(';').forEach(p => {
      const [lng, lat] = p.split(',').map(Number);
      if (!isNaN(lng)) pts.push([lng, lat]);
    }));
    const poly = new AMap.Polyline({ path: pts, strokeColor: '#00d4ff', strokeWeight: 5, strokeOpacity: .9, lineJoin: 'round' });
    mapObj.add(poly); routePolylines.push(poly);
    [[s.lng, s.lat, '起', '#52c41a'], [e.lng, e.lat, '终', '#ff4d4f']].forEach(([lng, lat, label, color]) => {
      const m = new AMap.Marker({
        position: [lng, lat],
        content: `<div style="background:${color};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">${label}</div>`,
        offset: new AMap.Pixel(-14, -14)
      });
      mapObj.add(m); routeMarkers.push(m);
    });
    mapObj.setFitView([...routeMarkers, poly]);
    const dist = (path.distance / 1000).toFixed(2);
    const mins = Math.ceil(path.duration / 60);
    const ri = document.getElementById('routeInfo');
    ri.style.display = 'block';
    ri.innerHTML = `距离: <b style="color:var(--accent)">${dist}公里</b> &nbsp;|&nbsp; 步行约 <b style="color:var(--accent)">${mins}分钟</b>`;
    currentDest = { longitude: e.lng, latitude: e.lat, name: `${e.lng},${e.lat}` };
    const di = document.getElementById('destInfo');
    di.style.display = 'block';
    di.textContent = `目的地: ${e.lng.toFixed(6)}, ${e.lat.toFixed(6)}`;
    document.getElementById('loc-sendBtn').disabled = false;
    toast(`规划完成：${dist}公里，约${mins}分钟`, 'success');
  } catch (err) {
    toast('路线规划失败: ' + err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '🚶 规划步行路线';
  }
}

function clearRoute() {
  routeMarkers.forEach(m => mapObj?.remove(m));
  routePolylines.forEach(p => mapObj?.remove(p));
  routeMarkers = []; routePolylines = []; currentDest = null;
  document.getElementById('routeInfo').style.display = 'none';
  document.getElementById('destInfo').style.display = 'none';
  document.getElementById('loc-sendBtn').disabled = true;
  document.getElementById('loc-start').value = '';
  document.getElementById('loc-end').value = '';
}

async function sendDest() {
  if (!currentDest) { toast('请先规划路线', 'warning'); return; }
  const btn = document.getElementById('loc-sendBtn');
  btn.disabled = true; btn.textContent = '发送中...';
  try {
    const res = await fetch(BASE + '/destination/set', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'destination', ...currentDest }) });
    if (!res.ok) throw new Error(res.status);
    toast('目的地已发送到机器人', 'success');
  } catch (e) {
    toast('发送失败: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '📤 发送目的地到机器人';
  }
}
