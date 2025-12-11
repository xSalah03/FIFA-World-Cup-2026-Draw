
import React, { useState } from 'react';
import { Group, Team } from '../types';

interface GroupCardProps {
  group: Group;
  onMoveTeam: (teamId: string, fromGroupId: string | null, toGroupId: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onMoveTeam }) => {
  const [isOver, setIsOver] = useState(false);
  const slots = [0, 1, 2, 3];

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
    
    // Prevent dropping into same group
    if (fromGroupId === group.id) return;
    
    onMoveTeam(teamId, fromGroupId, group.id);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-900/80 border rounded-xl overflow-hidden transition-all duration-300 shadow-lg ${
        isOver 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-800 scale-[1.02]' 
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className={`px-4 py-2 border-b transition-colors ${isOver ? 'bg-indigo-900/50' : 'bg-indigo-950/40 border-slate-800'}`}>
        <h3 className="text-indigo-400 font-black text-lg">GROUP {group.name}</h3>
      </div>
      <div className="p-3 space-y-2 min-h-[160px]">
        {slots.map((slotIndex) => {
          const team = group.teams[slotIndex];
          return (
            <div 
              key={slotIndex} 
              draggable={!!team}
              onDragStart={(e) => team && handleDragStart(e, team)}
              className={`flex items-center gap-3 h-9 px-3 rounded border transition-all duration-500 ${
                team 
                  ? 'bg-slate-800 border-indigo-500/30 text-slate-100 cursor-grab active:cursor-grabbing hover:bg-slate-700' 
                  : 'bg-slate-950/40 border-slate-900 text-slate-700 border-dashed'
              }`}
            >
              {team ? (
                <>
                  <span className="text-lg">{team.flag}</span>
                  <span className="font-semibold flex-1 truncate text-xs sm:text-sm">{team.name}</span>
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">{team.confederation}</span>
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
