import React from 'react';
import { parseMathQuestion, useMathAidsEnabled } from '../lib/mathAids';

const MAX_VISUAL_VALUE = 30;
const LINE_WIDTH = 300;
const GROUP_SIZE = 5;
const COLOR_FIRST = '#2563eb';
const COLOR_SECOND = '#d97706';

const Dots = ({ count, color, fadeFrom = Infinity }) => {
  const chunks = [];
  for (let i = 0; i < count; i += GROUP_SIZE) {
    chunks.push(Array.from({ length: Math.min(GROUP_SIZE, count - i) }, (_, j) => i + j));
  }
  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-xs">
      {chunks.map((chunk, c) => (
        <div key={c} className="flex gap-1 p-1 rounded-lg border-2 border-dashed border-slate-200">
          {chunk.map(index => (
            <span
              key={index}
              className="w-4 h-4 rounded-full transition-opacity"
              style={{ backgroundColor: color, opacity: index >= fadeFrom ? 0.25 : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const NumberLine = ({ a, op, b, revealed }) => {
  const end = op === '+' ? a + b : a - b;
  const top = Math.min(MAX_VISUAL_VALUE, Math.max(10, a, b, end) + 1);
  const step = top <= 20 ? 1 : 5;
  const x = value => 10 + (value / top) * (LINE_WIDTH - 20);
  const jumpMid = (x(a) + x(end)) / 2;
  const arcHeight = 32;
  return (
    <svg viewBox={`0 0 ${LINE_WIDTH} 80`} className="w-full max-w-md mx-auto" role="img" aria-label="Linha numérica">
      <defs>
        <marker id="math-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill={COLOR_FIRST} />
        </marker>
      </defs>
      <line x1={x(0)} y1="55" x2={x(top)} y2="55" stroke="#64748b" strokeWidth="2" />
      {Array.from({ length: top + 1 }, (_, v) => v).filter(v => v % step === 0).map(v => (
        <g key={v}>
          <line x1={x(v)} y1="49" x2={x(v)} y2="61" stroke="#64748b" strokeWidth="2" />
          <text x={x(v)} y="74" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">{v}</text>
        </g>
      ))}
      <path
        d={`M${x(a)},50 Q${jumpMid},${50 - arcHeight} ${x(end)},50`}
        fill="none"
        stroke={COLOR_FIRST}
        strokeWidth="2.5"
        markerEnd="url(#math-arrow)"
      />
      <circle cx={x(a)} cy="55" r="5" fill={COLOR_FIRST} />
      <text x={jumpMid} y={50 - arcHeight + 2} textAnchor="middle" fontSize="12" fontWeight="800" fill={COLOR_FIRST}>
        {op === '+' ? `+${b}` : `-${b}`}
      </text>
      {revealed ? (
        <circle cx={x(end)} cy="55" r="5" fill={COLOR_SECOND} />
      ) : (
        <text x={x(end)} y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill={COLOR_SECOND}>?</text>
      )}
    </svg>
  );
};

const MathVisual = ({ a, op, b, result, revealed = false }) => {
  const valid = a <= MAX_VISUAL_VALUE && b <= MAX_VISUAL_VALUE && result >= 0;
  if (!valid) return null;

  return (
    <div className="bg-white/90 rounded-2xl p-4 shadow-inner space-y-4 mb-4" data-testid="math-visual">
      {op === '×' ? (
        <div className="flex flex-col items-center gap-2">
          {Array.from({ length: b }, (_, row) => (
            <Dots key={row} count={a} color={COLOR_FIRST} />
          ))}
        </div>
      ) : op === '-' ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-slate-600">Tiramos {b} de {a}</p>
          <Dots count={a} color={COLOR_FIRST} fadeFrom={a - b} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Dots count={a} color={COLOR_FIRST} />
          <span className="text-3xl font-extrabold text-slate-700">{op}</span>
          <Dots count={b} color={COLOR_SECOND} />
        </div>
      )}
      {op !== '×' && <NumberLine a={a} op={op} b={b} revealed={revealed} />}
    </div>
  );
};

export const QuestionMathAid = ({ text, revealed = false }) => {
  const showAids = useMathAidsEnabled();
  const parsed = parseMathQuestion(text);
  if (!showAids || !parsed) return null;
  return <MathVisual {...parsed} revealed={revealed} />;
};

export default MathVisual;
