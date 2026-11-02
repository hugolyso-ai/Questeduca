import { useAccessibility } from '../context/AccessibilityContext';

const OPERATOR_ALIASES = { '+': '+', '-': '-', '−': '-', '×': '×', 'x': '×', '*': '×' };

export const parseMathQuestion = (text) => {
  if (typeof text !== 'string') return null;
  const match = text.match(/(\d+)\s*([+\-−×x*])\s*(\d+)/);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[3]);
  const op = OPERATOR_ALIASES[match[2]];
  const result = op === '+' ? a + b : op === '-' ? a - b : a * b;
  return { a, op, b, result };
};

export const isFirstGradeStored = () => localStorage.getItem('questeduca_school_year') === '1';

export const useMathAidsEnabled = () => {
  const { settings } = useAccessibility();
  return isFirstGradeStored() || settings.dyscalculiaMode;
};
