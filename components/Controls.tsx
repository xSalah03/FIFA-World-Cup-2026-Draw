
import React from 'react';
import { Play, SkipForward, RotateCcw, CheckCircle2, Undo2, Loader2, GitBranch, ArrowRight, Zap, LayoutDashboard, ListOrdered, History, Users } from 'lucide-react';
import { AppView, DrawHistoryEntry, Group } from '../types';

interface ControlsProps {
  onStart: () => void;
  onFastForward?: () => void;
  onNext: () => void;
  onUndo: () => void;
  onReset: () => void;
  onExport: () => void;
  onViewChange?: (view: AppView) => void;
  isDrawing: boolean;
  isComplete: boolean;
  canNext: boolean;
  canUndo: boolean;
  currentView: AppView;
  history?: DrawHistoryEntry[];
  groups?: Group[];
}

const Controls: React.FC<ControlsProps> = ({ 
  onStart, 
  onFastForward,
  onNext, 
  onUndo, 
  onReset, 
  onViewChange,
  isDrawing, 
  isComplete, 
  canNext, 
  canUndo,
  currentView,
  history = [],
  groups = []
}) => {
  const lastAction = history.length > 0 ? history[history.length - 1] : null;
  const undoLabel = lastAction?.type === 'swap' ? 'Undo Swap' : (isComplete ? 'Edit Last Pick' : 'Undo Last');
  const teamsPlaced = groups.reduce((acc, g) => acc + g.teams.length, 0);

  const renderTeamsControls = () => (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewChange?.('draw')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <LayoutDashboard size={14} />
          <span className="hidden sm:inline">Back to Brackets</span>
        </button>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
          <Users size={16} />
          Participant Directory
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => onViewChange?.('draw')}
          className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          Start Draw
          <ArrowRight size={14} />
        </button>
      </div>
    </>
  );

  const renderDrawControls = () => (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all group"
        >
          <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      <div className="flex flex-col items-center">
        {isComplete ? (
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[8px] sm:text-[10px] bg-emerald-50 dark:bg-emerald-500/10 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-500/30 animate-in fade-in zoom-in-95">
            <CheckCircle2 size={14} />
            Groups Finalized
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
             <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={onUndo}
                disabled={!canUndo || isDrawing}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black uppercase tracking-wider text-[8px] sm:text-[10px] transition-all border ${
                  !canUndo || isDrawing
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50' 
                    : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm'
                }`}
              >
                <Undo2 size={12} />
                {undoLabel}
              </button>
              <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 tracking-tighter uppercase">
                {teamsPlaced}/48
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isComplete ? (
          <>
            <button
              onClick={onNext}
              disabled={isDrawing || !canNext}
              className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all border ${
                isDrawing || !canNext 
                  ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              }`}
            >
              <SkipForward size={14} />
              Step
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={onStart}
                disabled={isDrawing}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all shadow-lg ${
                  isDrawing 
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-400 dark:text-indigo-600 border border-indigo-200 dark:border-indigo-800 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                }`}
              >
                {isDrawing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                {isDrawing ? 'Drawing' : 'Auto Draw'}
              </button>
              <button
                onClick={onFastForward}
                disabled={isDrawing}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all border bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm disabled:opacity-50"
                title="Instant Draw"
              >
                <Zap size={14} fill={isDrawing ? "none" : "currentColor"} />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => onViewChange?.('standings')}
            className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            Groups
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </>
  );

  const renderStandingsControls = () => (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewChange?.('draw')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <LayoutDashboard size={14} />
          <span className="hidden sm:inline">Brackets</span>
        </button>
      </div>

      <div className="hidden sm:flex flex-col items-center">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-[10px] bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
          <History size={16} />
          Simulation Summary
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => onViewChange?.('knockouts')}
          className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          Knockouts
          <ArrowRight size={14} />
        </button>
      </div>
    </>
  );

  const renderKnockoutControls = () => (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewChange?.('standings')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <ListOrdered size={14} />
          <span className="hidden sm:inline">Standings</span>
        </button>
      </div>

      <div className="hidden sm:flex flex-col items-center">
        <div className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700">
          Tournament Dashboard
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw size={14} />
          New Draw
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 sticky bottom-0 p-3 sm:p-4 z-40 transition-all shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {currentView === 'teams' && renderTeamsControls()}
        {currentView === 'draw' && renderDrawControls()}
        {currentView === 'standings' && renderStandingsControls()}
        {currentView === 'knockouts' && renderKnockoutControls()}
      </div>
    </div>
  );
};

export default Controls;
