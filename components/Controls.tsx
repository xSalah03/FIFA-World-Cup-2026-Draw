
import React from 'react';
import { Play, SkipForward, RotateCcw, Download, CheckCircle2, Undo2, Loader2, GitBranch, ArrowRight, Zap } from 'lucide-react';
import { AppView } from '../types';

interface ControlsProps {
  onStart: () => void;
  onFastForward?: () => void;
  onNext: () => void;
  onUndo: () => void;
  onReset: () => void;
  onExport: () => void;
  onProceed?: () => void;
  isDrawing: boolean;
  isComplete: boolean;
  canNext: boolean;
  canUndo: boolean;
  currentView: AppView;
}

const Controls: React.FC<ControlsProps> = ({ 
  onStart, 
  onFastForward,
  onNext, 
  onUndo, 
  onReset, 
  onExport, 
  onProceed,
  isDrawing, 
  isComplete, 
  canNext, 
  canUndo,
  currentView
}) => {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 sticky bottom-0 p-4 sm:p-6 z-20 flex flex-wrap justify-center gap-4 transition-colors shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {currentView === 'draw' && !isComplete && (
        <>
          <div className="flex gap-2">
            <button
              onClick={onStart}
              disabled={isDrawing}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-xl ${
                isDrawing 
                  ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-400 dark:text-indigo-600 border border-indigo-200 dark:border-indigo-900 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              {isDrawing ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
              {isDrawing ? 'Drawing...' : 'Auto-Draw'}
            </button>

            <button
              onClick={onFastForward}
              disabled={isDrawing}
              className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all border ${
                isDrawing 
                  ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-lg'
              }`}
              title="Lightning Draw (Instant)"
            >
              <Zap size={20} fill={isDrawing ? "none" : "currentColor"} />
            </button>
          </div>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border ${
              !canUndo 
                ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed' 
                : isDrawing
                  ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-500 text-amber-700 dark:text-amber-300 shadow-lg animate-pulse ring-2 ring-amber-500/20'
                  : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400'
            }`}
            title={isDrawing ? "Stop and Undo Last Move" : "Undo Last Move"}
          >
            <Undo2 size={20} />
            Previous Move
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
          {currentView === 'draw' ? (
            <>
              <button
                onClick={onUndo}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              >
                <Undo2 size={20} />
                Undo Last
              </button>
              
              <div className="hidden lg:flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 size={20} />
                Draw Complete
              </div>

              <button
                onClick={onProceed}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 animate-bounce"
              >
                <GitBranch size={20} />
                Proceed to Round of 32
                <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-200"
              >
                <RotateCcw size={20} />
                Restart Tournament
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'draw' && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <RotateCcw size={20} />
          Reset Draw
        </button>
      )}
    </div>
  );
};

export default Controls;
