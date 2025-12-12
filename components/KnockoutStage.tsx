
import React, { useState, useMemo, useEffect } from 'react';
import { Group, Team } from '../types';
import { generateFullBracket, simulateWinner, GroupStanding, BracketMatch, SimulationResult } from '../services/knockoutService';
import { TeamIcon } from './TeamIcon';
import { Trophy, GitBranch, RefreshCcw, Sparkles, Swords, Check, Crown, Medal, TrendingUp, Target, BarChart3, Info, Zap, Hash, Activity, ShieldCheck } from 'lucide-react';

interface KnockoutStageProps {
  groups: Group[];
  simulation: SimulationResult;
}

type KnockoutSubView = 'matches' | 'tree';

export const KnockoutStage: React.FC<KnockoutStageProps> = ({ groups, simulation }) => {
  const [activeTab, setActiveTab] = useState<KnockoutSubView>('tree');
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});
  const [hoveredTeam, setHoveredTeam] = useState<{ team: GroupStanding, x: number, y: number } | null>(null);

  useEffect(() => {
    setUserOverrides({});
  }, [groups]);

  const bracketMatches = useMemo(() => {
    return generateFullBracket(groups, userOverrides, simulation);
  }, [groups, userOverrides, simulation]);

  const knockoutStats = useMemo(() => {
    const matches = bracketMatches;
    const completed = matches.filter(m => !!m.winnerId).length;
    const total = matches.length;
    const progress = Math.round((completed / total) * 100);
    const upcoming = total - completed;
    return { completed, total, progress, upcoming };
  }, [bracketMatches]);

  const handleSelectWinner = (matchId: string, teamId: string) => {
    setUserOverrides(prev => ({ ...prev, [matchId]: teamId }));
  };

  const handleAutoAdvance = () => {
    const newOverrides = { ...userOverrides };
    const roundOrder: ('R32' | 'R16' | 'QF' | 'SF' | 'B' | 'F')[] = ['R32', 'R16', 'QF', 'SF', 'B', 'F'];
    
    roundOrder.forEach(round => {
      const currentBracket = generateFullBracket(groups, newOverrides, simulation);
      currentBracket.filter(m => m.round === round).forEach(match => {
        if (!newOverrides[match.id] && match.home && match.away) {
          const winner = simulateWinner(match.home, match.away);
          if (winner) newOverrides[match.id] = winner;
        }
      });
    });
    setUserOverrides(newOverrides);
  };

  const handleReset = () => {
    setUserOverrides({});
  };

  const rounds = [
    { key: 'R32', label: 'Round of 32', matches: bracketMatches.filter(m => m.round === 'R32') },
    { key: 'R16', label: 'Round of 16', matches: bracketMatches.filter(m => m.round === 'R16') },
    { key: 'QF', label: 'Quarter-Finals', matches: bracketMatches.filter(m => m.round === 'QF') },
    { key: 'SF', label: 'Semi-Finals', matches: bracketMatches.filter(m => m.round === 'SF') },
    { key: 'B', label: 'Bronze Final', matches: bracketMatches.filter(m => m.round === 'B') },
    { key: 'F', label: 'Final', matches: bracketMatches.filter(m => m.round === 'F') },
  ];

  return (
    <div className="relative pb-20">
      {/* 
        CRITICAL FIX: The Tooltip is placed OUTSIDE the main flow container.
        This prevents it from triggering 'space-y' margin recalculations 
        when it is conditionally rendered, which was causing the page to 'shake'.
      */}
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-xl dark:shadow-none relative overflow-hidden h-[300px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-xl shadow-indigo-600/20 shrink-0">
                  <Trophy className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tight dark:text-white leading-none">
                    Knockout <span className="text-indigo-600 dark:text-indigo-500">Stage</span>
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded">LIVE SIMULATOR</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Matches 73-104</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">
                  <RefreshCcw size={12} />
                  Reset
                </button>
                <button onClick={handleAutoAdvance} className="flex items-center gap-1.5 px-4 py-2 text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md">
                  <Sparkles size={12} />
                  Simulate
                </button>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <TabButton active={activeTab === 'tree'} onClick={() => setActiveTab('tree')} icon={<GitBranch size={14} />} label="Tree" />
                  <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Swords size={14} />} label="Grid" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-24 mt-6">
              <SummaryCard 
                label="Completed" 
                value={`${knockoutStats.completed}/${knockoutStats.total}`} 
                subValue={`${knockoutStats.progress}% Phase`}
                icon={<Hash size={18} />} 
                color="bg-indigo-600" 
              />
              <SummaryCard 
                label="Remaining" 
                value={knockoutStats.upcoming} 
                subValue="Match Slots"
                icon={<Target size={18} />} 
                color="bg-emerald-600" 
              />
              <SummaryCard 
                label="Strategy" 
                value="Ranked" 
                subValue="Auto-Sim"
                icon={<Activity size={18} />} 
                color="bg-amber-600" 
              />
               <SummaryCard 
                label="Active View" 
                value={activeTab === 'tree' ? 'TreeView' : 'Grid'} 
                subValue="Rendering"
                icon={<TrendingUp size={18} />} 
                color="bg-sky-600" 
              />
            </div>
          </div>
        </div>

        <div className="mt-8">
          {activeTab === 'matches' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
              {rounds[0].matches.map(match => (
                <R32MatchCard 
                  key={match.id} 
                  match={match} 
                  onSelectWinner={handleSelectWinner} 
                  simulation={simulation}
                  onTeamHover={setHoveredTeam}
                />
              ))}
            </div>
          )}

          {activeTab === 'tree' && (
            <div className="relative overflow-x-auto pb-12 custom-scrollbar rounded-3xl bg-slate-200/10 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
              <div className="relative flex gap-12 min-w-max px-12 py-12">
                <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
                  <svg width="100%" height="100%" className="overflow-visible">
                    {rounds.slice(0, -1).map((round, rIdx) => (
                      <RoundConnectors 
                        key={round.key} 
                        round={round} 
                        nextRound={rounds[rIdx + 1]} 
                      />
                    ))}
                  </svg>
                </div>

                {rounds.map((round) => (
                  <div key={round.key} className="flex flex-col gap-12 w-64 z-10">
                    <div className="text-center sticky top-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md py-2.5 mb-4 rounded-xl border border-white/10 dark:border-slate-800/10 shadow-sm">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                        {round.label}
                      </span>
                    </div>
                    <div className="flex flex-col justify-around flex-1 gap-10">
                      {round.matches.map((match) => (
                        <div key={match.id} id={`match-${match.id}`} className="relative">
                          <TreeMatch 
                            match={match} 
                            onSelectWinner={handleSelectWinner} 
                            isFinal={round.key === 'F'} 
                            isBronze={round.key === 'B'}
                            onTeamHover={setHoveredTeam}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip rendered at end of component, strictly floating over everything */}
      {hoveredTeam && (
        <TeamStatsTooltip 
          team={hoveredTeam.team} 
          x={hoveredTeam.x} 
          y={hoveredTeam.y} 
        />
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string, value: string | number, subValue?: string, icon: React.ReactNode, color: string }> = ({ label, value, subValue, icon, color }) => (
  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-3.5 flex items-center gap-3.5 h-full overflow-hidden shrink-0 transition-colors">
    <div className={`${color} p-2.5 rounded-xl text-white shadow-lg shrink-0`}>
      {icon}
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate leading-tight mb-1">{label}</span>
      <div className="flex flex-col justify-center">
        <span className="text-base font-black text-slate-900 dark:text-white leading-none truncate tracking-tight">{value}</span>
        {subValue && <span className="text-[8px] font-bold text-slate-500 truncate mt-1 uppercase tracking-tighter">{subValue}</span>}
      </div>
    </div>
  </div>
);

const TeamStatsTooltip: React.FC<{ team: GroupStanding, x: number, y: number }> = ({ team, x, y }) => {
  const strengthPercentage = Math.max(0, Math.min(100, (200 - team.rank) / 2));
  return (
    <div 
      className="fixed z-[9999] w-[280px] bg-slate-900/98 border border-white/10 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-5 pointer-events-none backdrop-blur-md animate-in fade-in duration-150"
      style={{ 
        left: `${Math.max(16, Math.min(window.innerWidth - 300, x + 20))}px`, 
        top: `${Math.max(16, Math.min(window.innerHeight - 340, y - 120))}px`,
        contain: 'layout'
      }}
    >
      <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
        <TeamIcon code={team.flagCode} name={team.name} className="w-10 h-6.5 rounded shadow-sm" />
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-black text-sm truncate uppercase tracking-tight italic">{team.name}</h4>
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{team.confederation} · Rank #{team.rank}</span>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
            <Zap size={10} className="text-amber-400" /> Power Index
          </span>
          <span className="text-[9px] font-black text-white">{strengthPercentage}%</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${strengthPercentage}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 p-2 rounded-lg"><div className="text-[7px] font-bold text-slate-500 uppercase">Points</div><div className="text-xs font-black text-indigo-400">{team.points}</div></div>
        <div className="bg-white/5 p-2 rounded-lg"><div className="text-[7px] font-bold text-slate-500 uppercase">GD</div><div className="text-xs font-black text-emerald-400">{team.goalsDiff}</div></div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-md transition-colors ${active ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

const RoundConnectors: React.FC<{ round: any, nextRound: any }> = ({ round, nextRound }) => {
  return (
    <>
      {round.matches.map((match: any) => {
        const nextMatch = nextRound.matches.find((nm: any) => nm.id === match.nextMatchId);
        if (!nextMatch) return null;
        const startEl = document.getElementById(`match-${match.id}`);
        const endEl = document.getElementById(`match-${nextMatch.id}`);
        if (!startEl || !endEl) return null;
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();
        const parentRect = startEl.closest('.min-w-max')?.getBoundingClientRect();
        if (!parentRect) return null;
        const x1 = startRect.right - parentRect.left;
        const y1 = startRect.top + startRect.height / 2 - parentRect.top;
        const x2 = endRect.left - parentRect.left;
        const y2 = endRect.top + endRect.height / 2 - parentRect.top;
        return (
          <path key={`${match.id}-${nextMatch.id}`} d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`} stroke="currentColor" strokeWidth={2} fill="none" className="text-slate-300 dark:text-slate-700 opacity-20" />
        );
      })}
    </>
  );
};

const R32MatchCard: React.FC<{ 
  match: BracketMatch; 
  onSelectWinner: (matchId: string, teamId: string) => void;
  simulation: SimulationResult;
  onTeamHover: (data: { team: GroupStanding, x: number, y: number } | null) => void;
}> = ({ match, onSelectWinner, simulation, onTeamHover }) => {
  const getTeamSeeding = (team: Team | null) => {
    if (!team) return null;
    for (const [groupId, table] of Object.entries(simulation.groupTables) as [string, GroupStanding[]][]) {
      const idx = table.findIndex(t => t.id === team.id);
      if (idx === 0) return `Winner G-${groupId}`;
      if (idx === 1) return `Runner-up ${groupId}`;
      if (idx === 2) return `3rd Place ${groupId}`;
    }
    return null;
  };
  const hasWinner = !!match.winnerId;
  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden flex flex-col ${hasWinner ? 'border-indigo-500/40' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className={`px-4 py-2 flex justify-between items-center border-b ${hasWinner ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500'}`}>
        <span className="text-[9px] font-black uppercase tracking-widest">{match.label}</span>
      </div>
      <div className="p-4 space-y-3.5 flex-1">
        <TeamAdvanceRow team={match.home as GroupStanding | null} seeding={getTeamSeeding(match.home)} isWinner={match.winnerId === match.home?.id} onClick={() => match.home && onSelectWinner(match.id, match.home.id)} onHover={onTeamHover} />
        <div className="flex items-center py-0.5"><div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div><span className="px-2 text-[7px] font-black text-slate-300 uppercase italic">VS</span><div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div></div>
        <TeamAdvanceRow team={match.away as GroupStanding | null} seeding={getTeamSeeding(match.away)} isWinner={match.winnerId === match.away?.id} onClick={() => match.away && onSelectWinner(match.id, match.away.id)} onHover={onTeamHover} />
      </div>
    </div>
  );
};

const TeamAdvanceRow: React.FC<{ 
  team: GroupStanding | null; 
  seeding: string | null; 
  isWinner: boolean; 
  onClick: () => void; 
  onHover: (data: { team: GroupStanding, x: number, y: number } | null) => void;
}> = ({ team, seeding, isWinner, onClick, onHover }) => {
  if (!team) return <div className="flex items-center gap-3 opacity-10"><div className="w-6 h-4 bg-slate-300 rounded-sm"></div><div className="h-2.5 w-20 bg-slate-300 rounded"></div></div>;
  return (
    <div onClick={onClick} onMouseEnter={(e) => onHover({ team, x: e.clientX, y: e.clientY })} onMouseLeave={() => onHover(null)} className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-colors cursor-pointer ${isWinner ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      <TeamIcon code={team.flagCode} name={team.name} className="w-7 h-4.5" />
      <div className="flex-1 min-w-0">
        <div className={`text-[11px] font-black truncate ${isWinner ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{team.name}</div>
        <div className={`text-[7px] font-bold uppercase tracking-widest truncate ${isWinner ? 'text-indigo-200' : 'text-slate-400'}`}>{seeding}</div>
      </div>
      {isWinner && <Check size={12} className="text-white" />}
    </div>
  );
};

const TreeMatch: React.FC<{ 
  match: BracketMatch; 
  onSelectWinner: (matchId: string, teamId: string) => void; 
  isFinal?: boolean;
  isBronze?: boolean;
  onTeamHover: (data: { team: GroupStanding, x: number, y: number } | null) => void;
}> = ({ match, onSelectWinner, isFinal, isBronze, onTeamHover }) => {
  const hasWinner = !!match.winnerId;
  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-xl shadow-lg overflow-hidden w-full ${isFinal && hasWinner ? 'border-amber-400 ring-2 ring-amber-400/10' : hasWinner ? 'border-indigo-600' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className={`px-2 py-1 text-[7px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${hasWinner ? (isFinal ? 'bg-amber-400 text-amber-950' : 'bg-indigo-600 text-white') : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'}`}>
        <span>{match.label}</span>
        {isBronze && <Medal size={8} />}
      </div>
      <div className="p-1.5 space-y-1">
        <TreeSlot team={match.home as GroupStanding | null} isWinner={match.winnerId === match.home?.id} onClick={() => match.home && onSelectWinner(match.id, match.home.id)} onHover={onTeamHover} />
        <TreeSlot team={match.away as GroupStanding | null} isWinner={match.winnerId === match.away?.id} onClick={() => match.away && onSelectWinner(match.id, match.away.id)} onHover={onTeamHover} />
      </div>
    </div>
  );
};

const TreeSlot: React.FC<{ 
  team: GroupStanding | null; 
  isWinner: boolean; 
  onClick: () => void; 
  onHover: (data: { team: GroupStanding, x: number, y: number } | null) => void;
}> = ({ team, isWinner, onClick, onHover }) => {
  if (!team) return <div className="flex items-center gap-2 px-1 py-1 opacity-10"><div className="w-3.5 h-2 bg-slate-400 rounded-xs"></div><span className="text-[9px] font-bold">TBD</span></div>;
  return (
    <div onClick={onClick} onMouseEnter={(e) => onHover({ team, x: e.clientX, y: e.clientY })} onMouseLeave={() => onHover(null)} className={`flex items-center gap-2 px-1.5 py-1 rounded transition-colors cursor-pointer ${isWinner ? 'bg-indigo-600 text-white font-black' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      <TeamIcon code={team.flagCode} name={team.name} className="w-3.5 h-2" />
      <span className={`text-[9px] truncate flex-1 ${isWinner ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>{team.name}</span>
      {isWinner && <Crown size={7} className="text-white fill-white" />}
    </div>
  );
};
