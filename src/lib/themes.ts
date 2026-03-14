export interface Theme {
  id: string
  name: string
  accent: string
  accentDark: string
  surface: string
  surface2: string
  bg: string
  textMuted: string
}

export const THEMES: Theme[] = [
  {
    id: 'terminal',
    name: 'Terminal',
    accent: '#28C76F',
    accentDark: '#1E9A52',
    surface: '#141414',
    surface2: '#0F1F16',
    bg: '#0A0A0A',
    textMuted: '#2A7A50',
  },
  {
    id: 'casino',
    name: 'Casino',
    accent: '#C9A84C',
    accentDark: '#A8893A',
    surface: '#1A1D27',
    surface2: '#242736',
    bg: '#0F1117',
    textMuted: '#7A6A3A',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    accent: '#38BDF8',
    accentDark: '#0EA5E9',
    surface: '#0F1923',
    surface2: '#162032',
    bg: '#090E14',
    textMuted: '#2A5A7A',
  },
  {
    id: 'rose',
    name: 'Rose',
    accent: '#FB7185',
    accentDark: '#F43F5E',
    surface: '#1C1318',
    surface2: '#261820',
    bg: '#0F090C',
    textMuted: '#7A2A3A',
  },
]

export const DEFAULT_THEME_ID = 'terminal'

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-accent-dark', theme.accentDark)
  root.style.setProperty('--color-surface', theme.surface)
  root.style.setProperty('--color-surface-2', theme.surface2)
  root.style.setProperty('--color-bg', theme.bg)
  root.style.setProperty('--color-text-muted', theme.textMuted)
}
