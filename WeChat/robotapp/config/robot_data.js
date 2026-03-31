export function emptyRobotData() {
  return {
    latitude: null,
    longitude: null,
    altitude: null,
    speed: null,
    roll: null,
    pitch: null,
    yaw: null,
    lidarOnline: false,
    lidarMinDist: null,
    lidarPoints: null,
    cameraOnline: false,
    cameraResolution: '',
    cpuUsage: null,
    memUsage: null,
    uptime: '',
    temperature: null,
    humidity: null,
    smoke: null,
    gas: null,
    light: null,
    pressure: null,
    batteryLevel: null,
    smokeValue: null,
    battery: null,
    voltage: null,
    person_count: null,
    satellites: null
  }
}

export function normalizeRobotData(raw) {
  const d = emptyRobotData()
  if (raw == null) return d
  d.latitude = toNumOrNull(raw, 'latitude')
  d.longitude = toNumOrNull(raw, 'longitude')
  d.altitude = toNumOrNull(raw, 'altitude')
  d.speed = toNumOrNull(raw, 'speed')
  d.roll = toNumOrNull(raw, 'roll')
  d.pitch = toNumOrNull(raw, 'pitch')
  d.yaw = toNumOrNull(raw, 'yaw')
  d.lidarOnline = toBool(raw, 'lidarOnline')
  d.lidarMinDist = toNumOrNull(raw, 'lidarMinDist')
  d.lidarPoints = toNumOrNull(raw, 'lidarPoints')
  d.cameraOnline = toBool(raw, 'cameraOnline')
  d.cameraResolution = toStrField(raw, 'cameraResolution')
  d.cpuUsage = toNumOrNull(raw, 'cpuUsage')
  d.memUsage = toNumOrNull(raw, 'memUsage')
  d.uptime = toStrField(raw, 'uptime')
  d.temperature = toNumOrNull(raw, 'temperature')
  d.humidity = toNumOrNull(raw, 'humidity')
  d.smoke = toNumOrNull(raw, 'smoke')
  d.gas = toNumOrNull(raw, 'gas')
  d.light = toNumOrNull(raw, 'light')
  d.pressure = toNumOrNull(raw, 'pressure')
  d.batteryLevel = toNumOrNull(raw, 'batteryLevel') || toNumOrNull(raw, 'battery')
  d.smokeValue = toNumOrNull(raw, 'smokeValue') || toNumOrNull(raw, 'smoke')
  d.battery = toNumOrNull(raw, 'battery') || toNumOrNull(raw, 'batteryLevel')
  d.voltage = toNumOrNull(raw, 'voltage') || toNumOrNull(raw, 'volt')
  d.person_count = toNumOrNull(raw, 'person_count')
  d.satellites = toNumOrNull(raw, 'satellites')
  return d
}

function toStrField(o, key) {
  const v = o[key]
  return v == null ? '' : '' + v
}

function toNumOrNull(o, key) {
  const v = o[key]
  if (v == null) return null
  const n = parseFloat('' + v)
  return isNaN(n) ? null : n
}

function toBool(o, key) {
  const v = o[key]
  return v === true
}
