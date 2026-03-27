import { storageString } from '@/utils/uts_helpers.js'

const CLASSIC = {
  id: 'classic',
  name: '经典青绿',
  primary: '#008c8c',
  primary2: '#00a8a8',
  bg: '#f1f1f1',
  card: '#ffffff',
  text: '#333333',
  textSub: '#666666',
  border: '#e8e8e8',
  inputBg: '#f8f9fa',
  headerBg: 'linear-gradient(135deg,#008c8c,#00a8a8)',
  tabActive: '#008c8c',
  btnText: '#ffffff',
  danger: '#ff4d4f'
}

const MIDNIGHT = {
  id: 'midnight',
  name: '深夜极光',
  primary: '#7c3aed',
  primary2: '#a78bfa',
  bg: '#0d1117',
  card: '#161b22',
  text: '#e6edf3',
  textSub: '#8b949e',
  border: '#30363d',
  inputBg: '#21262d',
  headerBg: 'linear-gradient(135deg,#1e1b4b,#312e81)',
  tabActive: '#a78bfa',
  btnText: '#ffffff',
  danger: '#f85149'
}

const SAKURA = {
  id: 'sakura',
  name: '樱花物语',
  primary: '#ec4899',
  primary2: '#f472b6',
  bg: '#fff0f6',
  card: '#ffffff',
  text: '#4a1942',
  textSub: '#9d4e8a',
  border: '#fce7f3',
  inputBg: '#fff5f9',
  headerBg: 'linear-gradient(135deg,#f472b6,#ec4899)',
  tabActive: '#ec4899',
  btnText: '#ffffff',
  danger: '#e11d48'
}

function themeById(id) {
  if (id === 'midnight') return MIDNIGHT
  if (id === 'sakura') return SAKURA
  return CLASSIC
}

export function getThemeVars() {
  try {
    const id = storageString('appTheme') || 'classic'
    return themeById(id)
  } catch (e) {
    return CLASSIC
  }
}

function withMeta(base, desc, swatches) {
  return { ...base, desc, swatches }
}

export function getThemeList() {
  return [
    withMeta(CLASSIC, '沉稳清爽的默认风格，青绿主色调，适合日常使用', ['#008c8c', '#00a8a8', '#f1f1f1', '#ffffff']),
    withMeta(MIDNIGHT, '深色背景配霓虹紫蓝，科技感十足，护眼夜间模式', ['#0d1117', '#161b22', '#7c3aed', '#a78bfa']),
    withMeta(SAKURA, '粉白渐变，温柔细腻，清新少女风格', ['#fff0f6', '#ffffff', '#ec4899', '#f472b6'])
  ]
}

export const THEMES = { classic: CLASSIC, midnight: MIDNIGHT, sakura: SAKURA }
