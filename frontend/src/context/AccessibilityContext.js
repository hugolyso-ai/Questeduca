import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    dyslexiaFont: false,
    colorblindMode: 'none', // none, protanopia, deuteranopia, tritanopia
    highContrast: false,
    textSize: 'medium' // small, medium, large, xlarge
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading accessibility settings:', e);
      }
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const html = document.documentElement;
    
    // Dyslexia mode
    if (settings.dyslexiaFont) {
      html.classList.add('dyslexia-mode');
    } else {
      html.classList.remove('dyslexia-mode');
    }

    // High contrast
    if (settings.highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }

    // Colorblind modes
    html.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (settings.colorblindMode !== 'none') {
      html.classList.add(`colorblind-${settings.colorblindMode}`);
    }

    // Text size
    html.classList.remove('text-size-small', 'text-size-medium', 'text-size-large', 'text-size-xlarge');
    html.classList.add(`text-size-${settings.textSize}`);

    // Save to localStorage
    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings({
      dyslexiaFont: false,
      colorblindMode: 'none',
      highContrast: false,
      textSize: 'medium'
    });
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {/* SVG Filters for colorblind modes */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Protanopia filter (red-blind) */}
          <filter id="protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                      0.558, 0.442, 0,     0, 0
                      0,     0.242, 0.758, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          {/* Deuteranopia filter (green-blind) */}
          <filter id="deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0,   0, 0
                      0.7,   0.3,   0,   0, 0
                      0,     0.3,   0.7, 0, 0
                      0,     0,     0,   1, 0"
            />
          </filter>
          {/* Tritanopia filter (blue-blind) */}
          <filter id="tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05,  0,     0, 0
                      0,    0.433, 0.567, 0, 0
                      0,    0.475, 0.525, 0, 0
                      0,    0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
