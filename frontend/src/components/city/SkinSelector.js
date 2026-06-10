import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SEASONAL_SKINS } from './cityConfig';

const SkinSelector = ({ currentSkin, onSkinChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all font-bold"
        data-testid="skin-selector-btn"
      >
        <Palette size={18} />
        <span>{SEASONAL_SKINS[currentSkin]?.icon}</span>
        <span className="hidden sm:inline">{SEASONAL_SKINS[currentSkin]?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 min-w-[220px]">
          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 border-b">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Palette size={16} /> Skins Sazonais
            </h3>
          </div>
          <div className="p-2">
            {Object.values(SEASONAL_SKINS).map((skin) => (
              <button
                key={skin.id}
                onClick={() => {
                  onSkinChange(skin.id);
                  setIsOpen(false);
                  toast.success(`Skin "${skin.name}" ativada!`, { icon: skin.icon });
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  currentSkin === skin.id
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
                    : 'hover:bg-gray-100'
                }`}
                data-testid={`skin-option-${skin.id}`}
              >
                <span className="text-2xl">{skin.icon}</span>
                <div className="text-left">
                  <p className="font-bold text-gray-800">{skin.name}</p>
                  <p className="text-xs text-gray-500">{skin.description}</p>
                </div>
                {currentSkin === skin.id && (
                  <Check size={18} className="ml-auto text-purple-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinSelector;
