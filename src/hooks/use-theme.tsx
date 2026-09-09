'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY, THEMES, type ThemeValue } from '@/constants'

interface ThemeContextValue {
  theme: ThemeValue
  setTheme: (theme: ThemeValue) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'orange',
  setTheme: () => {},
})

const themeColors: Record<ThemeValue, string> = {
  orange: '#f97316',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
}

function getInitialTheme(): ThemeValue {
  if (typeof window === 'undefined') return 'orange'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  const valid = THEMES.find((t) => t.value === stored)
  return valid ? valid.value : 'orange'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeValue>(getInitialTheme)

  const setTheme = (t: ThemeValue) => {
    setThemeState(t)
    localStorage.setItem(THEME_STORAGE_KEY, t)
  }

  // Apply CSS variable
  useEffect(() => {
    const color = themeColors[theme]
    document.documentElement.style.setProperty('--color-primary', color)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
