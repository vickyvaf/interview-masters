import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeType = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: ThemeType
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('dashboard-theme') as ThemeType) || 'system'
  })
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    localStorage.setItem('dashboard-theme', theme)
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    if (theme === 'system') {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
    } else {
      setResolvedTheme(theme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useDashboardTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useDashboardTheme must be used within ThemeProvider')
  return context
}
