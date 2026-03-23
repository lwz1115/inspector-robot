// 主题定义
const THEMES = {
  classic: {
    id: 'classic',
    name: '经典青绿',
    primary:    '#008c8c',
    primary2:   '#00a8a8',
    bg:         '#f1f1f1',
    card:       '#ffffff',
    text:       '#333333',
    textSub:    '#666666',
    border:     '#e8e8e8',
    inputBg:    '#f8f9fa',
    headerBg:   'linear-gradient(135deg,#008c8c,#00a8a8)',
    tabActive:  '#008c8c',
    btnText:    '#ffffff',
    danger:     '#ff4d4f'
  },
  midnight: {
    id: 'midnight',
    name: '深夜极光',
    primary:    '#7c3aed',
    primary2:   '#a78bfa',
    bg:         '#0d1117',
    card:       '#161b22',
    text:       '#e6edf3',
    textSub:    '#8b949e',
    border:     '#30363d',
    inputBg:    '#21262d',
    headerBg:   'linear-gradient(135deg,#1e1b4b,#312e81)',
    tabActive:  '#a78bfa',
    btnText:    '#ffffff',
    danger:     '#f85149'
  },
  sakura: {
    id: 'sakura',
    name: '樱花物语',
    primary:    '#ec4899',
    primary2:   '#f472b6',
    bg:         '#fff0f6',
    card:       '#ffffff',
    text:       '#4a1942',
    textSub:    '#9d4e8a',
    border:     '#fce7f3',
    inputBg:    '#fff5f9',
    headerBg:   'linear-gradient(135deg,#f472b6,#ec4899)',
    tabActive:  '#ec4899',
    btnText:    '#ffffff',
    danger:     '#e11d48'
  }
}

/**
 * 读取当前主题变量，所有页面在 onShow 调用此函数刷新
 */
export function getThemeVars() {
  try {
    const id = uni.getStorageSync('appTheme') || 'classic'
    return THEMES[id] || THEMES.classic
  } catch (e) {
    return THEMES.classic
  }
}

export { THEMES }
