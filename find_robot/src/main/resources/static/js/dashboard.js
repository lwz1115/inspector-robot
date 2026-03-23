// ── 数据监控 ──────────────────────────────────────────────
function updateDashboard(robots) {
  if (!robots.length) return;
  const r = robots[0];
  const ts = r.timestamp < 1e12 ? r.timestamp * 1000 : r.timestamp;
  const delay = Math.floor((Date.now() - ts) / 1000);

  document.getElementById('d-satellites').innerHTML = (r.satellites || 0) + '<span class="stat-unit">颗</span>';
  document.getElementById('d-speed').innerHTML      = (r.speed || 0).toFixed(1) + '<span class="stat-unit">km/h</span>';
  document.getElementById('d-altitude').innerHTML   = (r.altitude || 0).toFixed(1) + '<span class="stat-unit">m</span>';
  document.getElementById('d-delay').innerHTML      = delay + '<span class="stat-unit">秒</span>';

  const bat = r.batteryLevel || 0;
  document.getElementById('d-battery').innerHTML = bat + '<span class="stat-unit">%</span>';
  document.getElementById('d-voltage').innerHTML = (r.voltage || 0).toFixed(2) + '<span class="stat-unit">V</span>';
  const batColor = bat > 70 ? 'var(--success)' : bat > 30 ? 'var(--warning)' : 'var(--danger)';
  document.getElementById('d-batteryBar').style.cssText = `height:100%;border-radius:4px;transition:width .5s,background .5s;width:${bat}%;background:${batColor}`;
  document.getElementById('d-online').textContent    = robots.length;
  document.getElementById('d-lastUpdate').textContent = new Date().toLocaleTimeString();

  const temp = r.temperature, humi = r.humidity;
  document.getElementById('d-temperature').innerHTML = temp != null ? temp.toFixed(1) + '<span class="stat-unit">℃</span>' : '--<span class="stat-unit">℃</span>';
  document.getElementById('d-humidity').innerHTML    = humi != null ? humi.toFixed(1) + '<span class="stat-unit">%</span>' : '--<span class="stat-unit">%</span>';
  document.getElementById('d-person').innerHTML      = (r.personCount != null ? r.personCount : '--') + '<span class="stat-unit">人</span>';
  if (temp != null) document.getElementById('d-tempBar').style.width = Math.min(100, Math.max(0, temp / 50 * 100)) + '%';
  if (humi != null) document.getElementById('d-humiBar').style.width = Math.min(100, humi) + '%';

  const smoke = r.smokeValue;
  const smokeEl = document.getElementById('d-smoke');
  const smokeBar = document.getElementById('d-smokeBar');
  const smokeStatus = document.getElementById('d-smokeStatus');
  const smokeAlert = document.getElementById('d-smokeAlert');
  if (smoke != null) {
    smokeEl.textContent = smoke;
    const pct = Math.min(100, smoke / 800 * 100);
    let color, label, bg, border;
    if (smoke >= 500) {
      color = 'var(--danger)'; label = '⚠️ 明显烟雾/明火';
      bg = 'rgba(255,77,79,.15)'; border = 'rgba(255,77,79,.4)';
    } else if (smoke >= 200) {
      color = 'var(--warning)'; label = '⚠️ 轻微烟雾';
      bg = 'rgba(250,173,20,.15)'; border = 'rgba(250,173,20,.4)';
    } else {
      color = 'var(--success)'; label = '✅ 洁净空气';
      bg = 'rgba(82,196,26,.15)'; border = 'rgba(82,196,26,.3)';
    }
    smokeBar.style.cssText = `height:100%;border-radius:5px;transition:width .5s,background .5s;width:${pct}%;background:${color}`;
    smokeStatus.style.cssText = `padding:8px 16px;border-radius:20px;font-size:13px;font-weight:bold;background:${bg};color:${color};border:1px solid ${border}`;
    smokeStatus.textContent = label;
    smokeAlert.style.display = (smoke >= 200 && r.alertMessage) ? 'block' : 'none';
    if (smoke >= 200 && r.alertMessage) smokeAlert.textContent = r.alertMessage;
  } else {
    smokeEl.textContent = '--';
    smokeAlert.style.display = 'none';
  }

  const alerts = robots.filter(x => x.alertMessage?.trim());
  document.getElementById('d-alerts').textContent = alerts.length;
  const al = document.getElementById('d-alertList');
  al.innerHTML = alerts.length
    ? alerts.map(x => `<div class="alert-item"><b>${x.deviceId}</b>: ${x.alertMessage}<div style="color:var(--text-muted);margin-top:3px">${fmtTime(x.timestamp)}</div></div>`).join('')
    : '<div class="empty"><div class="icon">✅</div>暂无警报</div>';
}
