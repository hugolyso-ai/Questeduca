import React from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../lib/speech';

const ReadAloudButton = ({ text, label = 'Ouvir pergunta' }) => (
  <button
    type="button"
    onClick={() => speakText(text)}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
    data-testid="read-aloud-btn"
  >
    <Volume2 size={20} />
    {label}
  </button>
);

export default ReadAloudButton;
