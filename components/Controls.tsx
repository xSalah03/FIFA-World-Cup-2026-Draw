
import React from 'react';
import { Play, SkipForward, RotateCcw, Download, CheckCircle2 } from 'lucide-react';

interface ControlsProps {
  onStart: () => void;
  onNext: () => void;
  onReset: () => void;
  onExport: () => void;
  isDrawing: boolean;
  isComplete: boolean;
  canNext: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onStart, onNext, onReset, onExport, isDrawing, isComplete, canNext }) => {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 sticky bottom-0 p-4 sm:p-6 z-20 flex flex-wrap justify-center gap-4 transition-colors shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {!isComplete && (
        <>
          <button
            onClick={onStart}
            disabled={isDrawing}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-xl ${
              isDrawing 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            <Play size={20} fill="currentColor" />
            Auto-Draw
          </button>

          <button
            onClick={onNext}
            disabled={isDrawing || !canNext}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border ${
              isDrawing || !canNext 
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <SkipForward size={20} />
            Next Team
          </button>
        </>
      )}

      {isComplete && (
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 rounded-full border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 size={24} />
            Draw Complete
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-xl"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      )}

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <RotateCcw size={20} />
        Reset Draw
      </button>
    </div>
  );
};

export default Controls;
