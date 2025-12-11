
import React from 'react';
import { Team } from '../types';
import { TeamIcon } from './TeamIcon';

interface PotListProps {
  potNumber: number;
  teams: Team[];
  drawnCount: number;
  currentPotIndex: number;
  activeTeamIndex: number;
}

const PotList: React.FC<PotListProps> = ({ potNumber, teams, drawnCount, currentPotIndex, activeTeamIndex }) => {
  const isCurrentPot = currentPotIndex === potNumber - 1;

  const handleDragStart = (e: React.DragEvent, team: Team) => {
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('fromGroupId', '');
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-300 ${isCurrentPot ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800/80 shadow-md' : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50'}`}>
      <div className={`px-4 py-3 font-bold text-sm tracking-widest uppercase flex justify-between items-center ${isCurrentPot ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
        <span>Pot {potNumber}</span>
        <span className="text-xs opacity-70">{drawnCount}/{teams.length}</span>
      </div>
      <div className="flex flex-col p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        {teams.map((team, idx) => {
          const isDrawn = idx < drawnCount;
          const isActive = isCurrentPot && idx === activeTeamIndex;
          
          return (
            <div 
              key={team.id} 
              draggable={isActive}
              onDragStart={(e) => handleDragStart(e, team)}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md mb-1 transition-all ${
                isDrawn 
                  ? 'opacity-30 bg-slate-50 dark:bg-slate-950/50 grayscale line-through' 
                  : isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-100 cursor-grab active:cursor-grabbing hover:bg-indigo-100 dark:hover:bg-indigo-800/40'
                    : 'bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none'
              }`}
            >
              <TeamIcon code={team.flagCode} name={team.name} />
              <span className="font-medium flex-1 truncate">{team.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{team.confederation}</span>
              {isActive && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PotList;
