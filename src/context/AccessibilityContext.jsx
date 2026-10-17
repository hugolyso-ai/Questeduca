import React, { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)

export const useAccessibility = () => useContext(AccessibilityContext)

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('questeduca_accessibility')
      return stored ? JSON.parse(stored) : {
        textSize: 'medium',
        dyslexiaMode: false,
        highContrast: false,
        darkMode: false,
        colorblindMode: 'none',
        reduceMotion: false,
      }
    } catch {
      return {
        textSize: 'medium',
        dyslexiaMode: false,
        highContrast: false,
        darkMode: false,
        colorblindMode: 'none',
        reduceMotion: false,
      }
    }
  })

  useEffect(() => {
    localStorage.setItem('questeduca_accessibility', JSON.stringify(settings))

    const root = document.documentElement
    root.classList.remove('dyslexia-mode', 'high-contrast', 'dark-mode', 'text-size-small', 'text-size-medium', 'text-size-large', 'text-size-xlarge')

    if (settings.dyslexiaMode) root.classList.add('dyslexia-mode')
    if (settings.highContrast) root.classList.add('high-contrast')
    if (settings.darkMode) root.classList.add('dark-mode')
    root.classList.add(`text-size-${settings.textSize}`)
    if (settings.colorblindMode !== 'none') root.classList.add(`colorblind-${settings.colorblindMode}`)
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setSettings({
      textSize: 'medium',
      dyslexiaMode: false,
      highContrast: false,
      darkMode: false,
      colorblindMode: 'none',
      reduceMotion: false,
    })
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, reset }}>
      {children}
    </AccessibilityContext.Provider>
  )
}
