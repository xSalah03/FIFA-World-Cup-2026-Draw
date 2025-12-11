
import React, { useState } from 'react';
import { Group, Team } from '../types';
import { TeamIcon } from './TeamIcon';

interface GroupCardProps {
  group: Group;
  onMoveTeam: (teamId: string, fromGroupId: string | null, toGroupId: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onMoveTeam }) => {
  const [isOver, setIsOver] = useState(false);
  const slots = [1, 2, 3, 4];

  const handleDragStart = (e: React.DragEvent, team: Team) => {
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('fromGroupId', group.id);
    e.dataTransfer.effectAllowed = 'move';
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
    const teamId = e.dataTransfer.getData('teamId');
    const fromGroupId = e.dataTransfer.getData('fromGroupId') || null;
    if (fromGroupId === group.id) return;
    onMoveTeam(teamId, fromGroupId, group.id);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white dark:bg-slate-900/80 border rounded-xl overflow-hidden transition-all duration-300 shadow-sm dark:shadow-lg ${
        isOver 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 scale-[1.02]' 
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className={`px-4 py-2 border-b transition-colors flex justify-between items-center ${isOver ? 'bg-indigo-50 dark:bg-indigo-900/50' : 'bg-slate-50 dark:bg-indigo-950/40 border-slate-200 dark:border-slate-800'}`}>
        <h3 className="text-indigo-600 dark:text-indigo-400 font-black text-lg tracking-wider italic">GROUP {group.name}</h3>
        <div className="flex gap-1">
          {slots.map(s => {
            const hasTeam = group.teams.some(t => t.pot === s);
            return <div key={s} className={`w-1.5 h-1.5 rounded-full ${hasTeam ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
          })}
        </div>
      </div>
      <div className="p-3 space-y-2 min-h-[160px]">
        {slots.map((potNum) => {
          const team = group.teams.find(t => t.pot === potNum);
          return (
            <div 
              key={potNum} 
              draggable={!!team}
              onDragStart={(e) => team && handleDragStart(e, team)}
              className={`group flex items-center gap-3 h-10 px-3 rounded border transition-all duration-300 ${
                team 
                  ? 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-500/30 text-slate-800 dark:text-slate-100 cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-500/60 shadow-sm' 
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
