
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={14} />, label: 'Light' },
    { value: 'dark', icon: <Moon size={14} />, label: 'Dark' },
    { value: 'system', icon: <Monitor size={14} />, label: 'System' },
  ];

  return (
    <nav 
      aria-label="Theme selection" 
      className="flex bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-pressed={theme === opt.value}
          title={`Switch to ${opt.label} theme`}
          className={`
            relative flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200
            ${theme === opt.value 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
            }
            active:scale-95
          `}
        >
          <span className={`${theme === opt.value ? 'scale-110' : 'scale-100'} transition-transform`}>
            {opt.icon}
          </span>
          <span className="hidden md:inline">{opt.label}</span>
        </button>
      ))}
    </nav>
  );
};
