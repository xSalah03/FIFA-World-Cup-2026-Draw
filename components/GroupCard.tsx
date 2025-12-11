
import React, { useState } from 'react';
import { Group, Team } from '../types';
import { TeamIcon } from './TeamIcon';
import { isValidPlacement } from '../services/drawService';
import { AlertCircle } from 'lucide-react';

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

  const isAlreadyInGroup = draggedTeam && group.teams.some(t => t.id === draggedTeam.id);
  const isValidTarget = draggedTeam && !isAlreadyInGroup && isValidPlacement(draggedTeam, group);
  const isPotOccupied = draggedTeam && group.teams.some(t => t.pot === draggedTeam.pot);

  // Dynamic status for visual feedback
  let borderStyle = 'border-slate-200 dark:border-slate-800';
  let bgStyle = 'bg-white dark:bg-slate-900/80';
  let headerStyle = 'bg-slate-50 dark:bg-indigo-950/40 border-slate-200 dark:border-slate-800';

  if (draggedTeam && !isAlreadyInGroup) {
    if (isOver) {
      if (isValidTarget) {
        borderStyle = 'border-emerald-500 ring-4 ring-emerald-500/20 scale-[1.02] z-10';
        bgStyle = 'bg-emerald-50/30 dark:bg-emerald-950/20';
        headerStyle = 'bg-emerald-500 text-white border-emerald-500';
      } else {
        borderStyle = 'border-red-500 ring-4 ring-red-500/20 scale-[0.98] z-10';
        bgStyle = 'bg-red-50/30 dark:bg-red-950/20';
        headerStyle = 'bg-red-500 text-white border-red-500';
      }
    } else if (isValidTarget) {
      borderStyle = 'border-emerald-500/40 ring-2 ring-emerald-500/10 shadow-lg';
      bgStyle = 'bg-emerald-50/10 dark:bg-emerald-950/10';
    }
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border rounded-xl overflow-hidden transition-all duration-300 shadow-sm dark:shadow-lg ${borderStyle} ${bgStyle}`}
    >
      <div className={`px-4 py-2 border-b transition-all flex justify-between items-center ${headerStyle}`}>
        <h3 className={`font-black text-lg tracking-wider italic ${isOver ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
          GROUP {group.name}
        </h3>
        <div className="flex gap-1">
          {slots.map(s => {
            const hasTeam = group.teams.some(t => t.pot === s);
            return <div key={s} className={`w-1.5 h-1.5 rounded-full ${hasTeam ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
          })}
        </div>
      </div>

      {isOver && draggedTeam && !isAlreadyInGroup && !isValidTarget && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-[2px] pointer-events-none">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-2xl flex flex-col items-center gap-2 text-center animate-in zoom-in-95">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase leading-tight">
              {isPotOccupied 
                ? `Pot ${draggedTeam.pot} Slot Full` 
                : 'Rule Violation'}
            </p>
          </div>
        </div>
      )}

      <div className="p-3 space-y-2 min-h-[160px]">
        {slots.map((potNum) => {
          const team = group.teams.find(t => t.pot === potNum);
          const isBeingDragged = draggedTeam && team && draggedTeam.id === team.id;

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
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900 text-slate-300 dark:text-slate-700 border-dashed'
              }`}
            >
              <div className="w-8 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">P{potNum}</div>
              {team ? (
                <>
                  <TeamIcon code={team.flagCode} name={team.name} className="w-5 h-3.5" />
                  <span className="font-bold flex-1 truncate text-xs sm:text-sm">{team.name}</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">{team.confederation}</span>
                </>
              ) : (
                <span className="text-[10px] font-mono opacity-20">— EMPTY —</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupCard;
