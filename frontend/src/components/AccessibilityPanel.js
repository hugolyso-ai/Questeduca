import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Eye, Type, Palette, RotateCcw, Check, Moon, Sun } from 'lucide-react';

const AccessibilityPanel = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  if (!isOpen) return null;

  const colorblindOptions = [
    { value: 'none', label: 'Desativado', description: 'Cores normais' },
    { value: 'protanopia', label: 'Protanopia', description: 'Dificuldade com vermelho' },
    { value: 'deuteranopia', label: 'Deuteranopia', description: 'Dificuldade com verde' },
    { value: 'tritanopia', label: 'Tritanopia', description: 'Dificuldade com azul' }
  ];

  const textSizeOptions = [
    { value: 'small', label: 'Pequeno', example: 'Aa' },
    { value: 'medium', label: 'Médio', example: 'Aa' },
    { value: 'large', label: 'Grande', example: 'Aa' },
    { value: 'xlarge', label: 'Extra Grande', example: 'Aa' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl ${settings.darkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <Eye className="inline mr-2" size={28} />
                Acessibilidade
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Personaliza a tua experiência de jogo
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
              data-testid="close-accessibility-btn"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Dark Mode - NEW */}
          <div className={`rounded-2xl p-5 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${settings.darkMode ? 'bg-indigo-600' : 'bg-indigo-100'}`}>
                  {settings.darkMode ? (
                    <Moon className="text-white" size={24} />
                  ) : (
                    <Sun className="text-indigo-600" size={24} />
                  )}
                </div>
                <div>
                  <h3 className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Modo Escuro
                  </h3>
                  <p className={`text-sm ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Reduz o brilho para estudar à noite
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('darkMode', !settings.darkMode)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.darkMode ? 'bg-indigo-500' : 'bg-slate-300'
                }`}
                data-testid="toggle-dark-mode"
              >
                <span 
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Dyslexia Font */}
          <div className={`rounded-2xl p-5 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${settings.darkMode ? 'bg-purple-600' : 'bg-purple-100'}`}>
                  <Type className={settings.darkMode ? 'text-white' : 'text-purple-600'} size={24} />
                </div>
                <div>
                  <h3 className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Fonte para Dislexia
                  </h3>
                  <p className={`text-sm ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Usa a fonte OpenDyslexic
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('dyslexiaFont', !settings.dyslexiaFont)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.dyslexiaFont ? 'bg-purple-500' : 'bg-slate-300'
                }`}
                data-testid="toggle-dyslexia"
              >
                <span 
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.dyslexiaFont ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {settings.dyslexiaFont && (
              <div className="mt-4 p-3 bg-purple-100 rounded-xl">
                <p className="text-purple-800 text-sm" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
                  Pré-visualização: Esta é a fonte OpenDyslexic em ação!
                </p>
              </div>
            )}
          </div>

          {/* High Contrast */}
          <div className={`rounded-2xl p-5 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 p-3 rounded-xl">
                  <Eye className="text-white" size={24} />
                </div>
                <div>
                  <h3 className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Alto Contraste
                  </h3>
                  <p className={`text-sm ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Aumenta o contraste das cores
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.highContrast ? 'bg-slate-800' : 'bg-slate-300'
                }`}
                data-testid="toggle-high-contrast"
              >
                <span 
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    settings.highContrast ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Colorblind Mode */}
          <div className={`rounded-2xl p-5 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-red-400 via-green-400 to-blue-400 p-3 rounded-xl">
                <Palette className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Modo Daltónico
                </h3>
                <p className={`text-sm ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ajusta as cores para diferentes tipos
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {colorblindOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('colorblindMode', option.value)}
                  className={`p-3 rounded-xl text-left transition ${
                    settings.colorblindMode === option.value
                      ? 'bg-blue-500 text-white'
                      : settings.darkMode 
                        ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  data-testid={`colorblind-${option.value}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{option.label}</span>
                    {settings.colorblindMode === option.value && (
                      <Check size={16} />
                    )}
                  </div>
                  <span className={`text-xs ${
                    settings.colorblindMode === option.value ? 'text-white/80' : settings.darkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div className={`rounded-2xl p-5 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${settings.darkMode ? 'bg-blue-600' : 'bg-blue-100'}`}>
                <Type className={settings.darkMode ? 'text-white' : 'text-blue-600'} size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Tamanho do Texto
                </h3>
                <p className={`text-sm ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ajusta o tamanho das letras
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {textSizeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateSetting('textSize', option.value)}
                  className={`flex-1 p-3 rounded-xl text-center transition ${
                    settings.textSize === option.value
                      ? 'bg-blue-500 text-white'
                      : settings.darkMode 
                        ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                  data-testid={`text-size-${option.value}`}
                >
                  <span 
                    className="block font-bold"
                    style={{ 
                      fontSize: option.value === 'small' ? '14px' : 
                               option.value === 'medium' ? '18px' : 
                               option.value === 'large' ? '22px' : '26px' 
                    }}
                  >
                    {option.example}
                  </span>
                  <span className="text-xs mt-1 block">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetSettings}
            className={`w-full py-4 font-semibold rounded-xl transition flex items-center justify-center gap-2 ${
              settings.darkMode 
                ? 'bg-slate-600 text-slate-200 hover:bg-slate-500' 
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            data-testid="reset-accessibility"
          >
            <RotateCcw size={18} />
            Repor Definições
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPanel;
