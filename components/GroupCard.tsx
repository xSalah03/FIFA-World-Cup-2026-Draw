
import React, { useState } from 'react';
import { Group, Team, Confederation } from '../types';
import { TeamIcon } from './TeamIcon';
import { isValidPlacement } from '../services/drawService';
import { AlertCircle, Lock } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  draggedTeam: Team | null;
  onMoveTeam: (teamId: string, fromGroupId: string | null, toGroupId: string) => void;
  onDragStart: (team: Team) => void;
  onDragEnd: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, draggedTeam, onMoveTeam, onDragStart, onDragEnd }) => {
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

  // Logic to determine WHY a group is invalid
  const getInvalidReason = (team: Team, targetGroup: Group): string | null => {
    // 1. Host constraints
    if (team.isHost) {
      if (team.id === 'MEX' && targetGroup.id !== 'A') return "Mexico must be in Group A";
      if (team.id === 'CAN' && targetGroup.id !== 'B') return "Canada must be in Group B";
      if (team.id === 'USA' && targetGroup.id !== 'D') return "USA must be in Group D";
    }

    // 2. Already in group
    if (targetGroup.teams.some(t => t.id === team.id)) return "Already in this group";

    // 3. Pot occupied
    if (targetGroup.teams.some(t => t.pot === team.pot)) return `Pot ${team.pot} already filled`;

    // 4. Confederation limits (checking same logic as isValidPlacement but returning string)
    const currentTeams = targetGroup.teams;
    if (team.confederation !== Confederation.FIFA) {
      const uefaCount = currentTeams.filter(t => t.confederation === Confederation.UEFA).length;
      if (team.confederation === Confederation.UEFA && uefaCount >= 2) return "Max 2 UEFA teams allowed";
      if (team.confederation !== Confederation.UEFA && currentTeams.some(t => t.confederation === team.confederation)) {
        return `Limit: 1 ${team.confederation} team`;
      }
    }

    return null;
  };

  const isAlreadyInGroup = draggedTeam && group.teams.some(t => t.id === draggedTeam.id);
  const invalidReason = draggedTeam ? getInvalidReason(draggedTeam, group) : null;
  const isValidTarget = draggedTeam && !invalidReason;

  // Dynamic status for visual feedback
  let borderStyle = 'border-slate-200 dark:border-slate-800';
  let bgStyle = 'bg-white dark:bg-slate-900/80';
  let headerStyle = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
  let containerScale = 'scale-100';

  if (draggedTeam && !isAlreadyInGroup) {
    if (isOver) {
      if (isValidTarget) {
        borderStyle = 'border-emerald-500 ring-4 ring-emerald-500/20 z-10';
        bgStyle = 'bg-emerald-50/40 dark:bg-emerald-950/30';
        headerStyle = 'bg-emerald-500 text-white border-emerald-500';
        containerScale = 'scale-[1.04]';
      } else {
        borderStyle = 'border-rose-500 ring-4 ring-rose-500/20 z-10';
        bgStyle = 'bg-rose-50/40 dark:bg-rose-950/30';
        headerStyle = 'bg-rose-500 text-white border-rose-500';
        containerScale = 'scale-[0.96]';
      }
    } else if (isValidTarget) {
      // Pulsing highlight for all valid targets
      borderStyle = 'border-emerald-500/60 ring-2 ring-emerald-500/10 shadow-lg animate-pulse';
      bgStyle = 'bg-emerald-50/10 dark:bg-emerald-950/10';
    }
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border rounded-xl overflow-hidden transition-all duration-300 shadow-sm dark:shadow-lg ${borderStyle} ${bgStyle} ${containerScale}`}
    >
      <div className={`px-4 py-2 border-b transition-all flex justify-between items-center ${headerStyle}`}>
        <h3 className={`font-black text-lg tracking-wider italic ${isOver ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
          GROUP {group.name}
        </h3>
        <div className="flex gap-1">
          {slots.map(s => {
            const hasTeam = group.teams.some(t => t.pot === s);
            const isTargetSlot = draggedTeam && draggedTeam.pot === s && !isOver;
            return (
              <div 
                key={s} 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  hasTeam 
                    ? 'bg-indigo-600 dark:bg-indigo-500' 
                    : isTargetSlot && isValidTarget
                      ? 'bg-emerald-400 animate-bounce'
                      : 'bg-slate-300 dark:bg-slate-700'
                }`} 
              />
            );
          })}
        </div>
      </div>

      {isOver && draggedTeam && !isAlreadyInGroup && !isValidTarget && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-rose-900/40 backdrop-blur-[1px] pointer-events-none transition-opacity duration-200">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-2xl flex flex-col items-center gap-2 text-center animate-in zoom-in-95 fade-in">
            {draggedTeam.isHost ? <Lock className="text-rose-500" size={24} /> : <AlertCircle className="text-rose-500" size={24} />}
            <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase leading-tight tracking-tight">
              {invalidReason || "Invalid Move"}
            </p>
          </div>
        </div>
      )}

      {isOver && draggedTeam && isValidTarget && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-emerald-500/20 rounded-full w-24 h-24 animate-ping" />
        </div>
      )}

      <div className="p-3 space-y-2 min-h-[160px]">
        {slots.map((potNum) => {
          const team = group.teams.find(t => t.pot === potNum);
          const isBeingDragged = draggedTeam && team && draggedTeam.id === team.id;
          const isTargetPot = draggedTeam && !team && draggedTeam.pot === potNum && isOver && isValidTarget;

          return (
            <div 
              key={potNum} 
              draggable={!!team}
              onDragStart={(e) => team && handleDragStart(e, team)}
              onDragEnd={onDragEnd}
              className={`group flex items-center gap-3 h-10 px-3 rounded border transition-all duration-300 ${
                team 
                  ? isBeingDragged 
                    ? 'opacity-20 border-dashed border-slate-300 scale-95'
                    : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100 cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-500/60 shadow-sm' 
                  : isTargetPot
                    ? 'bg-emerald-100/50 dark:bg-emerald-900/40 border-emerald-500 border-solid ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900 text-slate-300 dark:text-slate-700 border-dashed'
              }`}
            >
              <div className={`w-8 text-[9px] font-black uppercase tracking-tighter transition-colors ${isTargetPot ? 'text-emerald-600' : 'text-slate-400 dark:text-slate-600'}`}>P{potNum}</div>
              {team ? (
                <>
                  <TeamIcon code={team.flagCode} name={team.name} className="w-5 h-3.5" />
                  <span className="font-bold flex-1 truncate text-xs sm:text-sm">{team.name}</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{team.confederation}</span>
                </>
              ) : (
                <span className={`text-[10px] font-mono transition-opacity ${isTargetPot ? 'text-emerald-600 opacity-100 font-bold' : 'opacity-20'}`}>
                  {isTargetPot ? `Drop ${draggedTeam.name} Here` : '— EMPTY —'}
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
