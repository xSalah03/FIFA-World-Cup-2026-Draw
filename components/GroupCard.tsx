
import React, { useState } from 'react';
import { Group, Team, Confederation } from '../types';
import { TeamIcon } from './TeamIcon';
import { isValidPlacement, isValidSwap } from '../services/drawService';
import { AlertCircle, Lock, CheckCircle2, ArrowLeftRight } from 'lucide-react';

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

  const handleDragLeave = () => {
    setIsOver(false);
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
      if (!sourceGroup) {
        return { type: 'invalid', text: `Pot ${dragged.pot} Slot Occupied` };
      }
      if (isValidSwap(dragged, sourceGroup, existing, targetGroup)) {
        return { type: 'swap', text: `Swap with ${existing.name}` };
      }
      return { type: 'invalid', text: 'Invalid Swap (Rules)' };
    }

    // Host locks
    if (dragged.isHost) {
      if (dragged.id === 'MEX' && targetGroup.id !== 'A') return { type: 'invalid', text: "Locked to Group A" };
      if (dragged.id === 'CAN' && targetGroup.id !== 'B') return { type: 'invalid', text: "Locked to Group B" };
      if (dragged.id === 'USA' && targetGroup.id !== 'D') return { type: 'invalid', text: "Locked to Group D" };
    }

    if (!isValidPlacement(dragged, targetGroup)) {
      const uefaCount = targetGroup.teams.filter(t => t.confederation === Confederation.UEFA).length;
      if (dragged.confederation === Confederation.UEFA && uefaCount >= 2) return { type: 'invalid', text: "Limit: 2 UEFA Teams" };
      if (dragged.confederation !== Confederation.UEFA && targetGroup.teams.some(t => t.confederation === dragged.confederation)) {
        return { type: 'invalid', text: `Limit: 1 ${dragged.confederation} Team` };
      }
      return { type: 'invalid', text: "Rule Violation" };
    }

    return { type: 'valid', text: 'Valid Spot' };
  };

  const isAlreadyInGroup = draggedTeam && group.teams.some(t => t.id === draggedTeam.id);
  const action = draggedTeam && !isAlreadyInGroup ? getActionReason(draggedTeam, group) : null;
  const isValidTarget = action?.type === 'valid' || action?.type === 'swap';

  let borderStyle = 'border-slate-200 dark:border-slate-800';
  let bgStyle = 'bg-white dark:bg-slate-900/80';
  let shadowStyle = 'shadow-sm dark:shadow-none';

  if (draggedTeam && !isAlreadyInGroup) {
    if (isOver) {
      if (isValidTarget) {
        borderStyle = action?.type === 'swap' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-emerald-500 ring-2 ring-emerald-500/20';
        bgStyle = action?.type === 'swap' ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : 'bg-emerald-50/20 dark:bg-emerald-950/20';
        shadowStyle = action?.type === 'swap' ? 'shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'shadow-[0_0_30px_rgba(16,185,129,0.15)]';
      } else {
        borderStyle = 'border-rose-500 ring-2 ring-rose-500/20';
        bgStyle = 'bg-rose-50/20 dark:bg-rose-950/20';
        shadowStyle = 'shadow-[0_0_30px_rgba(244,63,94,0.15)]';
      }
    } else if (isValidTarget) {
      borderStyle = action?.type === 'swap' ? 'border-indigo-400/50 dark:border-indigo-500/30 ring-1 ring-indigo-400/10' : 'border-emerald-400/50 dark:border-emerald-500/30 ring-1 ring-emerald-400/10';
      bgStyle = action?.type === 'swap' ? 'bg-indigo-50/5 dark:bg-indigo-950/5' : 'bg-emerald-50/5 dark:bg-emerald-950/5';
      shadowStyle = action?.type === 'swap' ? 'shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'shadow-[0_0_15px_rgba(16,185,129,0.1)]';
    }
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border rounded-xl overflow-hidden transition-all duration-300 ${borderStyle} ${bgStyle} ${shadowStyle}`}
    >
      {isOver && draggedTeam && !isAlreadyInGroup && action && (
        <div className="absolute top-12 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none animate-in slide-in-from-top-2 duration-200">
          <div className={`px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 border text-white ${
            action.type === 'swap' ? 'bg-indigo-600 border-indigo-400' :
            action.type === 'valid' ? 'bg-emerald-600 border-emerald-400' : 
            'bg-rose-600 border-rose-400'
          }`}>
            {action.type === 'swap' ? <ArrowLeftRight size={14} /> : 
             action.type === 'valid' ? <CheckCircle2 size={14} /> : 
             <AlertCircle size={14} />}
            <span className="text-[10px] font-black uppercase tracking-wider">{action.text}</span>
          </div>
        </div>
      )}

      <div className={`px-4 py-2 border-b transition-all flex justify-between items-center ${
        isOver ? (isValidTarget ? (action?.type === 'swap' ? 'bg-indigo-600 border-indigo-600' : 'bg-emerald-600 border-emerald-600') : 'bg-rose-600 border-rose-600') : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <h3 className={`font-black text-lg tracking-wider italic ${isOver ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
          GROUP {group.name}
        </h3>
        <div className="flex gap-1">
          {slots.map(s => (
            <div 
              key={s} 
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                group.teams.some(t => t.pot === s)
                  ? (isOver && !isValidTarget ? 'bg-white/40' : 'bg-indigo-600 dark:bg-indigo-500') 
                  : draggedTeam?.pot === s && isValidTarget
                    ? (action?.type === 'swap' ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400 animate-bounce')
                    : 'bg-slate-300 dark:bg-slate-700'
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="p-3 space-y-2 min-h-[160px]">
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
              className={`group flex items-center gap-3 h-10 px-3 rounded border transition-all duration-300 ${
                team 
                  ? isBeingDragged 
                    ? 'opacity-20 border-dashed border-slate-300 scale-95 grayscale'
                    : isSwapTarget
                      ? 'bg-indigo-100/80 dark:bg-indigo-900/60 border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100 cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-500/60 shadow-sm' 
                  : isTargetPot
                    ? 'bg-emerald-100/50 dark:bg-emerald-900/40 border-emerald-500 border-solid ring-2 ring-emerald-500/10'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900 text-slate-300 dark:text-slate-700 border-dashed'
              }`}
            >
              <div className={`w-8 text-[9px] font-black uppercase tracking-tighter transition-colors ${isTargetPot ? 'text-emerald-600' : isSwapTarget ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-600'}`}>P{potNum}</div>
              {team ? (
                <>
                  <TeamIcon code={team.flagCode} name={team.name} className="w-5 h-3.5" />
                  <span className="font-bold flex-1 truncate text-xs sm:text-sm">{team.name}</span>
                  {isSwapTarget ? (
                    <ArrowLeftRight size={14} className="text-indigo-600 animate-spin-slow" />
                  ) : (
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{team.confederation}</span>
                  )}
                </>
              ) : (
                <span className={`text-[10px] font-mono transition-opacity ${isTargetPot ? 'text-emerald-600 opacity-100 font-bold animate-pulse' : 'opacity-20'}`}>
                  {isTargetPot ? `PLACE ${draggedTeam.name}` : '— EMPTY —'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupCard;
