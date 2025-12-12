
import React, { useMemo } from 'react';
import { Group } from '../types';
import { SimulationResult, GroupStanding } from '../services/knockoutService';
import { TeamIcon } from './TeamIcon';
import { ListOrdered, Star, CheckCircle2, XCircle, AlertCircle, TrendingUp, Activity, Target, Hash } from 'lucide-react';

interface GroupStandingsViewProps {
  groups: Group[];
  simulation: SimulationResult;
}

export const GroupStandingsView: React.FC<GroupStandingsViewProps> = ({ groups, simulation }) => {
  const { groupTables, bestThirds } = simulation;

  const tournamentStats = useMemo(() => {
    let totalGoals = 0;
    let strongestGroup = { id: '', avgRank: 999 };
    const tables = Object.entries(groupTables);

    tables.forEach(([id, teams]) => {
      const avgRank = teams.reduce((acc, t) => acc + t.rank, 0) / teams.length;
      if (avgRank < strongestGroup.avgRank) {
        strongestGroup = { id, avgRank };
      }
      teams.forEach(t => {
        totalGoals += t.goalsFor;
      });
    });

    const totalMatches = 72;
    const avgGoals = totalGoals / totalMatches;

    return {
      totalGoals,
      avgGoals: avgGoals.toFixed(2),
      strongestGroupId: strongestGroup.id,
      strongestGroupRank: strongestGroup.avgRank.toFixed(1)
    };
  }, [groupTables]);

  return (
    <div className="space-y-8 pb-20">
      {/* FIXED HEIGHT DASHBOARD - Decisive fix for layout stability */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-xl dark:shadow-none relative overflow-hidden h-[300px] flex flex-col justify-between">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-600 p-3.5 rounded-2xl shadow-xl shadow-emerald-600/20">
              <ListOrdered className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tight dark:text-white leading-none">
                Group Stage <span className="text-emerald-600 dark:text-emerald-500">Standings</span>
              </h2>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-2 ml-1">
                Final simulated results · Qualified Teams
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-24 mt-6">
            <SummaryCard 
              label="Goals" 
              value={tournamentStats.totalGoals} 
              subValue="Total Scored"
              icon={<Hash size={18} />} 
              color="bg-indigo-600" 
            />
            <SummaryCard 
              label="Average" 
              value={tournamentStats.avgGoals} 
              subValue="Goals/Match"
              icon={<Activity size={18} />} 
              color="bg-amber-600" 
            />
            <SummaryCard 
              label="Death Group" 
              value={`Group ${tournamentStats.strongestGroupId}`} 
              subValue={`Avg: ${tournamentStats.strongestGroupRank}`}
              icon={<TrendingUp size={18} />} 
              color="bg-rose-600" 
            />
            <SummaryCard 
              label="Wildcards" 
              value="8" 
              subValue="Slots Open"
              icon={<Target size={18} />} 
              color="bg-sky-600" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Object.entries(groupTables).map(([groupId, standings]) => (
            <div key={groupId} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:border-emerald-500/40 transition-colors duration-300 ${groupId === tournamentStats.strongestGroupId ? 'ring-1 ring-rose-500/20' : ''}`}>
              <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest italic flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${groupId === tournamentStats.strongestGroupId ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                  Group {groupId} {groupId === tournamentStats.strongestGroupId && <span className="text-rose-500 ml-1 text-[8px] tracking-normal">(Death)</span>}
                </span>
                <div className="flex gap-6 text-[10px] font-black text-slate-400 uppercase">
                  <span className="w-8 text-center">GD</span>
                  <span className="w-8 text-center">PTS</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {standings.map((team, idx) => (
                  <div key={team.id} className={`flex items-center gap-4 px-6 py-4 ${
                    team.status === 'qualified' ? 'bg-emerald-500/5' : 
                    team.status === 'best-third' ? 'bg-amber-500/5' : 
                    'bg-slate-50/30'
                  }`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-[11px] font-black w-3 ${idx < 2 ? 'text-emerald-500' : team.status === 'best-third' ? 'text-amber-500' : 'text-slate-400'}`}>{idx + 1}</span>
                      <TeamIcon code={team.flagCode} name={team.name} className="w-7 h-4.5" />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-bold truncate ${team.status !== 'eliminated' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {team.name}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">{team.confederation}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-6 items-center">
                      <span className="text-[11px] w-8 text-center font-bold text-slate-500">
                        {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                      </span>
                      <span className={`text-sm w-8 text-center font-black ${team.status === 'qualified' ? 'text-emerald-600 dark:text-emerald-400' : team.status === 'best-third' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                        {team.points}
                      </span>
                      <div className="w-5 flex justify-center">
                        {team.status === 'qualified' ? <CheckCircle2 size={16} className="text-emerald-500" /> :
                         team.status === 'best-third' ? <AlertCircle size={16} className="text-amber-500" /> :
                         <XCircle size={16} className="text-slate-300 dark:text-slate-700" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="sticky top-40">
            <div className="bg-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <h3 className="text-lg font-black uppercase italic tracking-wider mb-3">Wildcard Rank</h3>
              <p className="text-amber-50 text-[11px] leading-relaxed opacity-90">
                The best 8 third-place finishers from the 12 groups advance. Points and GD determine the final survival bracket.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                <span>Best 3rd Place</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto custom-scrollbar">
                {bestThirds.map((team, idx) => (
                  <div key={team.id} className="flex items-center gap-4 px-6 py-4 bg-emerald-500/5">
                    <span className="text-xs font-black text-emerald-500 w-3">{idx + 1}</span>
                    <TeamIcon code={team.flagCode} name={team.name} className="w-7 h-4.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{team.name}</div>
                      <div className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">{team.points} PTS · {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff} GD</div>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-black uppercase">ADV</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
