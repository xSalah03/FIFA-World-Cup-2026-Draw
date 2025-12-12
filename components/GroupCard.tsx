
import React, { useState, useMemo } from 'react';
import { Group, Team, Confederation } from '../types';
import { TeamIcon } from './TeamIcon';
import { isValidPlacement, isValidSwap } from '../services/drawService';
import { AlertCircle, Lock, CheckCircle2, ArrowLeftRight, Activity, Globe, Shield } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  allGroups: Group[];
  draggedTeam: Team | null;
  onMoveTeam: (teamId: string, fromGroupId: string | null, toGroupId: string) => void;
  onDragStart: (team: Team) => void;
  onDragEnd: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, allGroups, draggedTeam, onMoveTeam, onDragStart, onDragEnd }) => {
  const [isOver, setIsOver] = useState(false);
  const slots = [1, 2, 3, 4];

  const avgRank = useMemo(() => {
    if (group.teams.length === 0) return 0;
    const total = group.teams.reduce((acc, t) => acc + t.rank, 0);
    return Math.round(total / group.teams.length);
  }, [group.teams]);

  const confedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    group.teams.forEach(t => {
      counts[t.confederation] = (counts[t.confederation] || 0) + 1;
    });
    return counts;
  }, [group.teams]);

  // Strength score is an inverted rank for visual representation (0-100)
  const strengthScore = useMemo(() => {
    if (group.teams.length === 0) return 0;
    return Math.max(0, 100 - (avgRank / 2));
  }, [avgRank, group.teams.length]);

  const handleDragStart = (e: React.DragEvent, team: Team) => {
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('fromGroupId', group.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(team);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    onDragEnd();
    const teamId = e.dataTransfer.getData('teamId');
    const fromGroupId = e.dataTransfer.getData('fromGroupId') || null;
    if (fromGroupId === group.id) return;
    onMoveTeam(teamId, fromGroupId, group.id);
  };

  const getTargetTeam = (dragged: Team) => group.teams.find(t => t.pot === dragged.pot);

  const getActionReason = (dragged: Team, targetGroup: Group): { type: 'valid' | 'invalid' | 'swap', text: string } => {
    const existing = getTargetTeam(dragged);
    const fromGroupId = (document.querySelector(`[data-team-id="${dragged.id}"]`)?.getAttribute('data-group-id')) || null;
    const sourceGroup = fromGroupId ? allGroups.find(g => g.id === fromGroupId) : null;

    if (existing) {
      if (!sourceGroup) return { type: 'invalid', text: `Pot ${dragged.pot} Occupied` };
      if (isValidSwap(dragged, sourceGroup, existing, targetGroup)) {
        return { type: 'swap', text: `Swap with ${existing.name}` };
      }
      return { type: 'invalid', text: 'Invalid Swap' };
    }

    if (dragged.isHost) {
      if (dragged.id === 'MEX' && targetGroup.id !== 'A') return { type: 'invalid', text: "Host Locked to A" };
      if (dragged.id === 'CAN' && targetGroup.id !== 'B') return { type: 'invalid', text: "Host Locked to B" };
      if (dragged.id === 'USA' && targetGroup.id !== 'D') return { type: 'invalid', text: "Host Locked to D" };
    }

    if (!isValidPlacement(dragged, targetGroup)) return { type: 'invalid', text: "Confederation Rule" };

    return { type: 'valid', text: 'Valid Spot' };
  };

  const isAlreadyInGroup = draggedTeam && group.teams.some(t => t.id === draggedTeam.id);
  const action = draggedTeam && !isAlreadyInGroup ? getActionReason(draggedTeam, group) : null;
  const isValidTarget = action?.type === 'valid' || action?.type === 'swap';

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={`group/card relative h-full flex flex-col border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl dark:shadow-none ${
        isOver && draggedTeam && !isAlreadyInGroup
          ? isValidTarget
            ? action?.type === 'swap' 
              ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-indigo-50/10 dark:bg-indigo-950/20' 
              : 'border-emerald-500 ring-4 ring-emerald-500/10 bg-emerald-50/10 dark:bg-emerald-950/20'
            : 'border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/10 dark:bg-rose-950/20'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      }`}
    >
      {/* Dynamic Action Overlay */}
      {isOver && draggedTeam && !isAlreadyInGroup && action && (
        <div className="absolute top-14 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-2">
          <div className={`px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border text-white text-[10px] font-black uppercase tracking-widest ${
            action.type === 'swap' ? 'bg-indigo-600 border-indigo-400' :
            action.type === 'valid' ? 'bg-emerald-600 border-emerald-400' : 
            'bg-rose-600 border-rose-400'
          }`}>
            {action.type === 'swap' ? <ArrowLeftRight size={14} /> : 
             action.type === 'valid' ? <CheckCircle2 size={14} /> : 
             <AlertCircle size={14} />}
            {action.text}
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`px-5 py-3 border-b flex justify-between items-center transition-colors ${
        isOver && draggedTeam ? (isValidTarget ? 'bg-emerald-600 border-emerald-600' : 'bg-rose-600 border-rose-600') : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col">
          <h3 className={`font-black text-lg tracking-wider italic leading-tight ${isOver && draggedTeam ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            GROUP {group.id}
          </h3>
          <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${isOver && draggedTeam ? 'text-white/70' : 'text-slate-400'}`}>
            <Shield size={10} className={isOver && draggedTeam ? 'text-white/70' : 'text-indigo-500'} />
            Bracket {group.id}
          </div>
        </div>
        <div className="flex gap-1.5">
          {slots.map(s => (
            <div 
              key={s} 
              className={`w-2.5 h-2.5 rounded-full border border-black/5 transition-all duration-300 ${
                group.teams.some(t => t.pot === s)
                  ? isOver && draggedTeam ? 'bg-white' : 'bg-indigo-600 dark:bg-indigo-500 shadow-sm'
                  : draggedTeam?.pot === s && isOver && isValidTarget
                    ? 'bg-emerald-400 animate-pulse scale-125'
                    : 'bg-slate-200 dark:bg-slate-700/50'
              }`} 
            />
          ))}
        </div>
      </div>

      {/* Team Slots - Fixed height content to prevent layout shifts */}
      <div className="flex-1 p-4 space-y-2.5 bg-gradient-to-b from-transparent to-slate-50/30 dark:to-slate-950/10 min-h-[180px]">
        {slots.map((potNum) => {
          const team = group.teams.find(t => t.pot === potNum);
          const isBeingDragged = draggedTeam && team && draggedTeam.id === team.id;
          const isSwapTarget = draggedTeam && team && action?.type === 'swap' && draggedTeam.pot === potNum && isOver;
          const isTargetPot = draggedTeam && !team && draggedTeam.pot === potNum && isOver && action?.type === 'valid';

          return (
            <div 
              key={potNum} 
              draggable={!!team}
              onDragStart={(e) => team && handleDragStart(e, team)}
              onDragEnd={onDragEnd}
              data-team-id={team?.id}
              data-group-id={group.id}
              className={`flex items-center gap-3 h-10 px-3 rounded-xl border transition-all duration-300 ${
                team 
                  ? isBeingDragged 
                    ? 'opacity-0 scale-95'
                    : isSwapTarget
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-100 cursor-grab hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-md' 
                  : isTargetPot
                    ? 'bg-emerald-500/10 border-emerald-500 border-dashed animate-pulse ring-2 ring-emerald-500/10'
                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 border-dashed opacity-50'
              }`}
            >
              <div className={`w-8 text-[9px] font-black tracking-tight ${isSwapTarget ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-600'}`}>P{potNum}</div>
              {team ? (
                <>
                  <TeamIcon code={team.flagCode} name={team.name} className="w-6 h-4" />
                  <span className="font-bold flex-1 truncate text-xs">{team.name}</span>
                  {!isSwapTarget && (
                    <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-900/50 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                      {team.confederation}
                    </span>
                  )}
                  {isSwapTarget && <ArrowLeftRight size={14} className="text-white animate-spin-slow" />}
                </>
              ) : (
                <div className={`flex-1 text-[9px] font-black uppercase tracking-widest ${isTargetPot ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700 opacity-20'}`}>
                  {isTargetPot ? 'Drop to Place' : 'Pending'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Statistics Dashboard Footer - Fixed height and robust background */}
      <div className="mt-auto px-5 py-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between min-h-[44px]">
        <div className="flex flex-wrap gap-1.5 items-center max-w-[70%]">
          {group.teams.length > 0 ? (
            <>
              <Globe size={11} className="text-slate-400 mr-0.5 shrink-0" />
              {Object.entries(confedCounts).map(([confed, count]) => (
                <span key={confed} className="text-[9px] font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">
                  {confed} <span className="text-indigo-600 dark:text-indigo-400">{count}</span>
                </span>
              ))}
            </>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">No teams assigned</span>
          )}
        </div>
        
        {group.teams.length > 0 && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-all hover:scale-105">
              <Activity size={10} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                {strengthScore.toFixed(0)}% <span className="text-[8px] font-bold opacity-70 uppercase tracking-tighter">Power</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
