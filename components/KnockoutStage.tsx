
import React, { useState, useMemo, useEffect } from 'react';
import { Group, Team } from '../types';
import { calculateGroupStandings, generateFullBracket, simulateWinner, GroupStanding, BracketMatch } from '../services/knockoutService';
import { TeamIcon } from './TeamIcon';
// Added missing ChevronRight import
import { Trophy, ListOrdered, GitBranch, Star, Target, Crown, RefreshCcw, MousePointer2, Sparkles, Dices, Swords, Info, ChevronRight } from 'lucide-react';

interface KnockoutStageProps {
  groups: Group[];
}

type KnockoutSubView = 'matches' | 'tree' | 'standings';

export const KnockoutStage: React.FC<KnockoutStageProps> = ({ groups }) => {
  const [activeTab, setActiveTab] = useState<KnockoutSubView>('matches');
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});
  
  const [simulatedStandings, setSimulatedStandings] = useState<{ 
    groupTables: Record<string, GroupStanding[]>, 
    bestThirds: GroupStanding[] 
  } | null>(null);

  useEffect(() => {
    if (!simulatedStandings) {
      handleSimulateGroups();
    }
  }, [groups]);

  const handleSimulateGroups = () => {
    const results = calculateGroupStandings(groups);
    setSimulatedStandings(results);
    setUserOverrides({});
  };

  const { groupTables, bestThirds } = simulatedStandings || { groupTables: {}, bestThirds: [] };
  
  const bracketMatches = useMemo(() => {
    if (!simulatedStandings) return [];
    return generateFullBracket(groups, userOverrides, simulatedStandings);
  }, [groups, userOverrides, simulatedStandings]);

  const handleSelectWinner = (matchId: string, teamId: string) => {
    setUserOverrides(prev => ({
      ...prev,
      [matchId]: teamId
    }));
  };

  const handleAutoAdvance = () => {
    if (!simulatedStandings) return;
    const newOverrides = { ...userOverrides };
    const roundOrder: ('R32' | 'R16' | 'QF' | 'SF' | 'F')[] = ['R32', 'R16', 'QF', 'SF', 'F'];
    
    roundOrder.forEach(round => {
      const currentBracket = generateFullBracket(groups, newOverrides, simulatedStandings);
      currentBracket.filter(m => m.round === round).forEach(match => {
        if (!newOverrides[match.id] && match.home && match.away) {
          const winner = simulateWinner(match.home, match.away);
          if (winner) newOverrides[match.id] = winner;
        }
      });
    });

    setUserOverrides(newOverrides);
  };

  const r32Matches = bracketMatches.filter(m => m.round === 'R32');

  const rounds = [
    { key: 'R32', label: 'Round of 32', matches: r32Matches },
    { key: 'R16', label: 'Round of 16', matches: bracketMatches.filter(m => m.round === 'R16') },
    { key: 'QF', label: 'Quarter-Finals', matches: bracketMatches.filter(m => m.round === 'QF') },
    { key: 'SF', label: 'Semi-Finals', matches: bracketMatches.filter(m => m.round === 'SF') },
    { key: 'F', label: 'The Final', matches: bracketMatches.filter(m => m.round === 'F') },
  ];

  if (!simulatedStandings) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-2xl shadow-xl shadow-amber-500/20">
            <Trophy className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight dark:text-white leading-none">
              Knockout <span className="text-indigo-600 dark:text-indigo-500">Stage</span>
            </h2>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-2">
              The road to World Cup glory begins now
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleSimulateGroups}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white dark:bg-slate-800 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-all border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
          >
            <Dices size={14} />
            Simulate Groups
          </button>

          <button 
            onClick={handleAutoAdvance}
            className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25"
          >
            <Sparkles size={14} />
            Auto Advance
          </button>

          {Object.keys(userOverrides).length > 0 && (
            <button 
              onClick={() => setUserOverrides({})}
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all border border-rose-200 dark:border-rose-900/50"
            >
              <RefreshCcw size={14} />
              Reset
            </button>
          )}

          <div className="flex bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-sm p-1 rounded-xl border border-white/20 dark:border-slate-700">
            <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Swords size={16} />} label="Matches" />
            <TabButton active={activeTab === 'tree'} onClick={() => setActiveTab('tree')} icon={<GitBranch size={16} />} label="Tree" />
            <TabButton active={activeTab === 'standings'} onClick={() => setActiveTab('standings')} icon={<ListOrdered size={16} />} label="Standings" />
          </div>
        </div>
      </div>

      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
          {r32Matches.map(match => (
            <R32MatchCard 
              key={match.id} 
              match={match} 
              onSelectWinner={handleSelectWinner} 
              standings={simulatedStandings}
            />
          ))}
        </div>
      )}

      {activeTab === 'tree' && (
        <div className="relative overflow-x-auto pb-12 custom-scrollbar animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex gap-16 min-w-max px-4 py-8">
            {rounds.map((round) => (
              <div key={round.key} className="flex flex-col gap-8 w-64">
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 border-b border-slate-200 dark:border-slate-800 pb-2 px-4 inline-block">
                    {round.label}
                  </span>
                </div>
                <div className="flex flex-col justify-around flex-1 gap-12">
                  {round.matches.map((match) => (
                    <TreeMatch 
                      key={match.id} 
                      match={match} 
                      onSelectWinner={handleSelectWinner}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-600/20 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md relative z-10">
              <Star size={40} className="text-amber-300 fill-amber-300" />
            </div>
            <div className="flex-1 text-center md:text-left relative z-10">
              <h3 className="text-2xl font-black uppercase tracking-[0.1em] mb-2 italic">The Wildcard 8</h3>
              <p className="text-indigo-100 text-sm max-w-xl">These top 8 third-place finishers survived the group stage and joined the Round of 32.</p>
            </div>
            <div className="flex -space-x-3 relative z-10">
              {bestThirds.map(t => (
                <div key={t.id} className="w-12 h-12 rounded-full border-4 border-indigo-600 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-2xl ring-2 ring-white/10" title={t.name}>
                  <TeamIcon code={t.flagCode} name={t.name} className="w-full h-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Object.entries(groupTables).map(([groupId, standings]) => (
              <GroupTable key={groupId} id={groupId} standings={standings} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
      active 
        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const R32MatchCard: React.FC<{ 
  match: BracketMatch; 
  onSelectWinner: (matchId: string, teamId: string) => void;
  standings: { groupTables: Record<string, GroupStanding[]> }
}> = ({ match, onSelectWinner, standings }) => {
  const getTeamSeeding = (team: Team | null) => {
    if (!team) return null;
    // Explicitly cast Object.entries to fix findIndex error on unknown type
    for (const [groupId, table] of Object.entries(standings.groupTables) as [string, GroupStanding[]][]) {
      const idx = table.findIndex(t => t.id === team.id);
      if (idx === 0) return `Winner Grp ${groupId}`;
      if (idx === 1) return `Runner-up ${groupId}`;
      if (idx === 2) return `3rd Place ${groupId}`;
    }
    return null;
  };

  const winProb = useMemo(() => {
    if (!match.home || !match.away) return 50;
    const diff = match.away.rank - match.home.rank; // Lower rank is better
    const prob = 50 + (diff * 0.5);
    return Math.min(95, Math.max(5, Math.round(prob)));
  }, [match.home, match.away]);

  const hasWinner = !!match.winnerId;

  return (
    <div className={`group/card bg-white dark:bg-slate-900 border transition-all duration-300 rounded-2xl shadow-sm overflow-hidden flex flex-col ${
      hasWinner ? 'border-indigo-500/50 shadow-indigo-500/5' : 'border-slate-200 dark:border-slate-800'
    }`}>
      <div className={`px-4 py-2 flex justify-between items-center border-b ${
        hasWinner ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-800'
      }`}>
        <span className="text-[10px] font-black uppercase tracking-widest">{match.label}</span>
        {hasWinner && <Check size={12} />}
      </div>
      
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-center">
        <R32TeamRow 
          team={match.home} 
          seeding={getTeamSeeding(match.home)} 
          isWinner={match.winnerId === match.home?.id} 
          prob={winProb}
          onClick={() => match.home && onSelectWinner(match.id, match.home.id)}
          hasMatchWinner={hasWinner}
        />
        
        <div className="relative flex items-center py-2">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
          <span className="px-3 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase italic bg-white dark:bg-slate-900 relative z-10">VS</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
        </div>

        <R32TeamRow 
          team={match.away} 
          seeding={getTeamSeeding(match.away)} 
          isWinner={match.winnerId === match.away?.id} 
          prob={100 - winProb}
          onClick={() => match.away && onSelectWinner(match.id, match.away.id)}
          hasMatchWinner={hasWinner}
        />
      </div>

      {!hasWinner && match.home && match.away && (
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Info size={12} className="text-indigo-400" />
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
            Rank Delta: {Math.abs(match.home.rank - match.away.rank)} · Prediction: {match.home.rank < match.away.rank ? match.home.name : match.away.name} favored
          </span>
        </div>
      )}
    </div>
  );
};

const R32TeamRow: React.FC<{ 
  team: Team | null; 
  seeding: string | null; 
  isWinner: boolean; 
  prob: number;
  onClick: () => void;
  hasMatchWinner: boolean;
}> = ({ team, seeding, isWinner, prob, onClick, hasMatchWinner }) => {
  if (!team) return (
    <div className="flex items-center gap-3 opacity-20">
      <div className="w-8 h-5 bg-slate-200 rounded-sm"></div>
      <div className="flex-1 space-y-1">
        <div className="h-3 w-24 bg-slate-200 rounded"></div>
        <div className="h-2 w-16 bg-slate-100 rounded"></div>
      </div>
    </div>
  );

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-2 rounded-xl transition-all duration-300 cursor-pointer relative group/row ${
        isWinner 
          ? 'bg-indigo-500/10 ring-1 ring-indigo-500/20' 
          : hasMatchWinner 
            ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
      }`}
    >
      <TeamIcon code={team.flagCode} name={team.name} className="w-10 h-6.5 shadow-md flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-black truncate tracking-tight dark:text-white ${isWinner ? 'text-indigo-600' : 'text-slate-800'}`}>
          {team.name}
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{seeding || `Rank #${team.rank}`}</div>
      </div>
      {isWinner ? (
        <div className="flex flex-col items-end">
          <Target size={14} className="text-indigo-500" />
          <span className="text-[8px] font-black uppercase text-indigo-500/70 tracking-tighter">Advanced</span>
        </div>
      ) : (
        <div className="flex flex-col items-end opacity-0 group-hover/row:opacity-100 transition-opacity">
          <span className="text-[10px] font-black text-indigo-400">{prob}%</span>
          <span className="text-[7px] font-bold uppercase text-slate-400">Win Exp</span>
        </div>
      )}
    </div>
  );
};

const TreeMatch: React.FC<{ 
  match: BracketMatch;
  onSelectWinner: (matchId: string, teamId: string) => void;
}> = ({ match, onSelectWinner }) => {
  const hasWinner = !!match.winnerId;

  return (
    <div className="relative group/match">
      <div className={`bg-white dark:bg-slate-900 border transition-all duration-300 rounded-xl shadow-sm overflow-hidden hover:shadow-xl ${
        match.round === 'F' && hasWinner 
          ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/10' 
          : hasWinner
            ? 'border-indigo-400 dark:border-indigo-500/50 shadow-indigo-500/10'
            : 'border-slate-200 dark:border-slate-800'
      }`}>
        <div className={`px-3 py-1.5 flex justify-between items-center transition-colors ${
          match.round === 'F' && hasWinner
            ? 'bg-amber-400 text-amber-950' 
            : hasWinner
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500'
        }`}>
          <span className="text-[9px] font-black uppercase tracking-wider">{match.label}</span>
          {match.round === 'F' ? <Crown size={12} fill="currentColor" /> : hasWinner && <Check size={10} />}
        </div>
        <div className="p-2.5 space-y-1.5">
          <TreeTeamSlot 
            team={match.home} 
            isWinner={match.winnerId === match.home?.id} 
            onClick={() => match.home && onSelectWinner(match.id, match.home.id)}
            hasMatchWinner={hasWinner}
          />
          <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-1"></div>
          <TreeTeamSlot 
            team={match.away} 
            isWinner={match.winnerId === match.away?.id} 
            onClick={() => match.away && onSelectWinner(match.id, match.away.id)}
            hasMatchWinner={hasWinner}
          />
        </div>
      </div>
      
      {match.nextMatchId && (
        <div className={`absolute left-full top-1/2 w-8 h-px transition-colors -z-10 -translate-y-1/2 ${
          hasWinner ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-200 dark:border-slate-800'
        }`}></div>
      )}
    </div>
  );
};

const TreeTeamSlot: React.FC<{ 
  team: Team | null;
  isWinner: boolean;
  onClick: () => void;
  hasMatchWinner: boolean;
}> = ({ team, isWinner, onClick, hasMatchWinner }) => {
  if (!team) return (
    <div className="flex items-center gap-2 px-2 py-1.5 opacity-10">
      <div className="w-5 h-3.5 bg-slate-200 rounded-sm"></div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">TBD</span>
    </div>
  );

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-300 relative group/slot ${
        isWinner 
          ? 'bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500/20 opacity-100'
          : hasMatchWinner
            ? 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800 opacity-100'
      }`}
    >
      <TeamIcon code={team.flagCode} name={team.name} className="w-5 h-3.5 shadow-sm" />
      <span className={`text-[11px] font-bold truncate flex-1 tracking-tight dark:text-white ${isWinner ? 'font-black' : ''}`}>
        {team.name}
      </span>
      {isWinner && (
        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
          <Target size={10} />
        </div>
      )}
      
      {!isWinner && (
        <div className="absolute right-2 opacity-0 group-hover/slot:opacity-100 transition-opacity">
          <ChevronRight size={12} className="text-slate-400" />
        </div>
      )}
    </div>
  );
};

const GroupTable: React.FC<{ id: string, standings: GroupStanding[] }> = ({ id, standings }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
      <span className="font-black text-xs text-indigo-600 dark:text-indigo-400 italic tracking-wider">GROUP {id}</span>
      <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
        <span title="Goals For - Goals Against">GD</span>
        <span title="Points">PTS</span>
      </div>
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {standings.map((team, idx) => (
        <div 
          key={team.id} 
          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
            team.status === 'qualified' ? 'bg-emerald-500/5 dark:bg-emerald-500/5' : 
            team.status === 'best-third' ? 'bg-amber-500/5 dark:bg-amber-500/5' : ''
          }`}
        >
          <span className={`text-[10px] font-black w-3 ${idx < 2 ? 'text-emerald-500' : team.status === 'best-third' ? 'text-amber-500' : 'text-slate-400'}`}>
            {idx + 1}
          </span>
          <TeamIcon code={team.flagCode} name={team.name} className="w-6 h-4" />
          <span className={`text-xs flex-1 truncate font-bold ${team.status !== 'eliminated' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
            {team.name}
          </span>
          <span className={`text-[10px] w-6 text-center font-bold ${team.status !== 'eliminated' ? 'text-slate-600 dark:text-slate-400' : 'text-slate-300 dark:text-slate-700'}`}>
            {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
          </span>
          <span className={`text-xs w-6 text-center font-black ${team.status !== 'eliminated' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-700'}`}>
            {team.points}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const Check: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
