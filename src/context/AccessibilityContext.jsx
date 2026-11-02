import React, { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)

export const useAccessibility = () => useContext(AccessibilityContext)

const DEFAULT_SETTINGS = {
  textSize: 'medium',
  dyslexiaMode: false,
  dyscalculiaMode: false,
  highContrast: false,
  darkMode: false,
  colorblindMode: 'none',
  reduceMotion: false,
  readAloud: false,
}

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('questeduca_accessibility')
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    localStorage.setItem('questeduca_accessibility', JSON.stringify(settings))

    const root = document.documentElement
    root.classList.remove('dyslexia-mode', 'dyscalculia-mode', 'high-contrast', 'dark-mode', 'text-size-small', 'text-size-medium', 'text-size-large', 'text-size-xlarge', 'colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia')

    if (settings.dyslexiaMode) root.classList.add('dyslexia-mode')
    if (settings.dyscalculiaMode) root.classList.add('dyscalculia-mode')
    if (settings.highContrast) root.classList.add('high-contrast')
    if (settings.darkMode) root.classList.add('dark-mode')
    root.classList.add(`text-size-${settings.textSize}`)
    if (settings.colorblindMode !== 'none') root.classList.add(`colorblind-${settings.colorblindMode}`)
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, reset }}>
      {children}
    </AccessibilityContext.Provider>
  )
}
