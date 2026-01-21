'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'accessibility'

interface ThemeProviderProps {
    children: React.ReactNode
    defaultTheme?: Theme
}

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
    children,
    defaultTheme = 'light'
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme)

    useEffect(() => {
        const root = window.document.documentElement

        // Remove old theme attributes/classes
        root.classList.remove('light', 'dark')
        root.removeAttribute('data-theme')

        if (theme === 'dark') {
            root.classList.add('dark')
        } else if (theme === 'light') {
            root.classList.add('light')
        } else {
            // For named themes, apply attribute
            root.setAttribute('data-theme', theme)
            // Typically custom themes are 'light' based, so ensure dark class is removed
            root.classList.remove('dark')
        }

        // Persist to local storage
        localStorage.setItem('portal-theme', theme)
    }, [theme])

    useEffect(() => {
        // Load from local storage on mount
        const saved = localStorage.getItem('portal-theme') as Theme
        if (saved) setTheme(saved)
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider')
    return context
}
