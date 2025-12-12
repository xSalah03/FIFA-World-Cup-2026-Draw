import React, { useState, useMemo, useEffect } from 'react';
import { Group, Team } from '../types';
import { generateFullBracket, simulateWinner, GroupStanding, BracketMatch, SimulationResult } from '../services/knockoutService';
import { TeamIcon } from './TeamIcon';
import { Trophy, RefreshCcw, Sparkles, Check, Crown, TrendingUp, Target, Hash, Activity, ShieldCheck, ListTree, LayoutGrid, Info, ArrowRight } from 'lucide-react';

interface KnockoutStageProps {
  groups: Group[];
  simulation: SimulationResult;
}

type KnockoutSubView = 'matches' | 'tree';

export const KnockoutStage: React.FC<KnockoutStageProps> = ({ groups, simulation }) => {
  const [activeTab, setActiveTab] = useState<KnockoutSubView>('tree');
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});
  const [hoveredTeam, setHoveredTeam] = useState<{ team: GroupStanding; x: number; y: number } | null>(null);

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
    { key: 'F', label: 'World Final', matches: bracketMatches.filter(m => m.round === 'F') },
  ];

  return (
    <div className="relative pb-20 space-y-10 animate-in fade-in duration-500">
      {/* Hero Dashboard Section - Updated to clean white card aesthetic */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 dark:bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-500/20">
                <Trophy className="text-amber-300 fill-amber-300" size={32} />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                  Knockout <span className="text-indigo-600 dark:text-indigo-400">Stage</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30">Sim Mode</span>
                   <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Match 73 - 104</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all font-black text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-400"
              >
                <RefreshCcw size={16} /> Reset
              </button>
              <button 
                onClick={handleAutoAdvance}
                className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95"
              >
                <Sparkles size={16} /> Simulate
              </button>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setActiveTab('tree')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tree' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ListTree size={14} /> Tree
                </button>
                <button 
                  onClick={() => setActiveTab('matches')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'matches' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutGrid size={14} /> Grid
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <HeroStatCard label="Completed" value={`${knockoutStats.completed}/${knockoutStats.total}`} subValue={`${knockoutStats.progress}% Done`} icon={<Hash size={20} />} progress={knockoutStats.progress} />
            <HeroStatCard label="Remaining" value={knockoutStats.upcoming} subValue="Live Slots" icon={<Target size={20} />} />
            <HeroStatCard label="Strategy" value="Direct" subValue="Knockout Rules" icon={<Activity size={20} />} />
            <HeroStatCard label="Format" value="Single Elim" subValue="Tournament Standard" icon={<ShieldCheck size={20} />} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {activeTab === 'tree' ? (
          <div className="p-8 sm:p-12 overflow-x-auto custom-scrollbar flex-1">
            <div className="relative min-w-max flex gap-12 sm:gap-20 pb-12 pt-4 justify-center">
              {rounds.map((round, rIdx) => (
                <div key={round.key} className="flex flex-col gap-8 w-64 sm:w-72">
                  <h3 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 mb-4">{round.label}</h3>
                  <div className="flex flex-col justify-around flex-1 gap-4">
                    {round.matches.map((match) => (
                      <TreeMatch 
                        key={match.id} 
                        match={match} 
                        onSelectWinner={handleSelectWinner}
                        isFinal={round.key === 'F'}
                        isBronze={round.key === 'B'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
             {bracketMatches.map(match => (
                <GridMatchCard key={match.id} match={match} onSelectWinner={handleSelectWinner} />
             ))}
          </div>
        )}
      </div>

      {hoveredTeam && <TeamStatsTooltip team={hoveredTeam.team} x={hoveredTeam.x} y={hoveredTeam.y} />}
    </div>
  );
};

const HeroStatCard: React.FC<{ label: string, value: string | number, subValue: string, icon: React.ReactNode, progress?: number }> = ({ label, value, subValue, icon, progress }) => (
  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex items-center gap-5 transition-all hover:bg-white dark:hover:bg-slate-700 hover:shadow-md group relative overflow-hidden">
    {progress !== undefined && (
      <div className="absolute bottom-0 left-0 h-1 bg-slate-200 dark:bg-slate-700 w-full">
        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
      </div>
    )}
    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">{label}</span>
      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</span>
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{subValue}</span>
    </div>
  </div>
);

const TreeMatch: React.FC<{ match: BracketMatch; onSelectWinner: (matchId: string, teamId: string) => void; isFinal?: boolean; isBronze?: boolean }> = ({ match, onSelectWinner, isFinal, isBronze }) => {
  const renderTeam = (team: Team | null, isHome: boolean) => {
    const isWinner = match.winnerId === team?.id && !!team;
    const isLoser = match.winnerId && match.winnerId !== team?.id && !!team;

    return (
      <button
        disabled={!team}
        onClick={() => team && onSelectWinner(match.id, team.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all relative group/team ${
          !team ? 'cursor-default' : 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
        } ${isWinner ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}
      >
        <div className="shrink-0">
          {team ? (
            <TeamIcon code={team.flagCode} name={team.name} className="w-6 h-4 rounded shadow-sm" />
          ) : (
            <div className="w-6 h-4 bg-slate-100 dark:bg-slate-800 rounded border border-dashed border-slate-300 dark:border-slate-700" />
          )}
        </div>
        <div className={`flex-1 text-left truncate text-xs font-bold ${
          isWinner ? 'text-indigo-700 dark:text-indigo-300' : 
          isLoser ? 'text-slate-400 dark:text-slate-600' : 
          'text-slate-700 dark:text-slate-200'
        }`}>
          {team?.name || 'TBD'}
        </div>
        {isWinner && <Check size={14} className="text-indigo-600 shrink-0" />}
      </button>
    );
  };

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${
      match.winnerId ? 'border-indigo-500/40 ring-1 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800'
    } ${isFinal ? 'border-amber-400 shadow-amber-400/10' : ''}`}>
      <div className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest flex justify-between items-center ${
        isFinal ? 'bg-amber-400 text-amber-950' : 
        isBronze ? 'bg-orange-100 text-orange-700' : 
        'bg-slate-50 dark:bg-slate-800 text-slate-400'
      }`}>
        <span>{match.label}</span>
        {isFinal && <Crown size={10} />}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {renderTeam(match.home, true)}
        {renderTeam(match.away, false)}
      </div>
    </div>
  );
};

const GridMatchCard: React.FC<{ match: BracketMatch; onSelectWinner: (matchId: string, teamId: string) => void }> = ({ match, onSelectWinner }) => {
  const hasWinner = !!match.winnerId;
  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-3xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-lg ${hasWinner ? 'border-indigo-600/40' : 'border-slate-200 dark:border-slate-800'}`}>
      <div className={`px-5 py-2.5 flex justify-between items-center border-b transition-colors ${hasWinner ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800/80 text-slate-500'}`}>
        <span className="text-[10px] font-black uppercase tracking-widest">{match.label} · {match.round}</span>
        {hasWinner && <Check size={14} />}
      </div>
      <div className="p-4 space-y-3">
        {[match.home, match.away].map((team, i) => {
          const isWinner = match.winnerId === team?.id && !!team;
          return (
            <button
              key={i}
              disabled={!team}
              onClick={() => team && onSelectWinner(match.id, team.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                isWinner 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500' 
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                 {team ? <TeamIcon code={team.flagCode} name={team.name} className="w-8 h-5" /> : <div className="w-8 h-5 bg-slate-100 dark:bg-slate-800 rounded" />}
                 <span className={`text-sm font-black ${isWinner ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{team?.name || 'Pending'}</span>
              </div>
              {isWinner && <Crown size={14} className="text-amber-500" />}
            </button>
          )
        })}
      </div>
    </div>
  );
};

const TeamStatsTooltip: React.FC<{ team: GroupStanding; x: number; y: number }> = ({ team, x, y }) => {
  const strengthPercentage = Math.max(0, Math.min(100, (200 - team.rank) / 2));
  return (
    <div 
      className="fixed z-[9999] w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 pointer-events-none backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
      style={{ left: `${x + 20}px`, top: `${y - 100}px` }}
    >
      <div className="flex items-center gap-4 mb-5 border-b border-slate-100 dark:border-white/10 pb-4">
        <TeamIcon code={team.flagCode} name={team.name} className="w-12 h-8 rounded-lg shadow-xl" />
        <div className="min-w-0">
          <h4 className="text-slate-900 dark:text-white font-black text-base truncate uppercase tracking-tight italic leading-tight">{team.name}</h4>
          <span className="text-[8px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">{team.confederation} · Rank #{team.rank}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Power Index</span>
            <span className="text-[10px] font-black text-slate-900 dark:text-white">{strengthPercentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 transition-all duration-1000" style={{ width: `${strengthPercentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};