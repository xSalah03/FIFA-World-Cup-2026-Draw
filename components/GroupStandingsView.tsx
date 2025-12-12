import React, { useMemo } from 'react';
import { Group } from '../types';
import { SimulationResult, GroupStanding } from '../services/knockoutService';
import { TeamIcon } from './TeamIcon';
import { ListOrdered, Star, CheckCircle2, XCircle, AlertCircle, TrendingUp, Activity, Target, Hash, Info } from 'lucide-react';

interface GroupStandingsViewProps {
  groups: Group[];
  simulation: SimulationResult;
}

export const GroupStandingsView: React.FC<GroupStandingsViewProps> = ({ groups, simulation }) => {
  const { groupTables, bestThirds } = simulation;

  const tournamentStats = useMemo(() => {
    let totalGoals = 0;
    let strongestGroup = { id: '', avgRank: 999 };
    
    Object.entries(groupTables).forEach(([id, teams]) => {
      const avgRank = teams.reduce((acc, t) => acc + t.rank, 0) / teams.length;
      if (avgRank < strongestGroup.avgRank) {
        strongestGroup = { id, avgRank };
      }
      teams.forEach(t => {
        totalGoals += t.goalsFor;
      });
    });

    // Note: totalGoals counts each goal twice in group stage matches (home vs away)
    // so we divide by 2 for the actual tournament goal count.
    return {
      totalGoals: totalGoals / 2,
      strongestGroup: strongestGroup.id,
      avgRank: strongestGroup.avgRank.toFixed(1)
    };
  }, [groupTables]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Tournament Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label="Total Goals" 
          value={tournamentStats.totalGoals} 
          subValue="Group Stage" 
          icon={<Hash size={20} />} 
          color="text-indigo-600 dark:text-indigo-400"
          bgColor="bg-indigo-50 dark:bg-indigo-500/10"
        />
        <StatCard 
          label="Strongest Group" 
          value={`Group ${tournamentStats.strongestGroup}`} 
          subValue={`Avg. Rank ${tournamentStats.avgRank}`} 
          icon={<Activity size={20} />} 
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard 
          label="Status" 
          value="Simulated" 
          subValue="Ready for Knockouts" 
          icon={<Target size={20} />} 
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-50 dark:bg-amber-500/10"
        />
      </div>

      {/* Main Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(groupTables).map(([groupId, teams]) => (
          <div key={groupId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-lg italic uppercase tracking-wider text-slate-900 dark:text-white">
                Group <span className="text-indigo-600 dark:text-indigo-400">{groupId}</span>
              </h3>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 dark:bg-slate-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-800/20">
                    <th className="px-4 py-2.5 font-black text-center w-8">#</th>
                    <th className="px-2 py-2.5">Team</th>
                    <th className="px-2 py-2.5 text-center">P</th>
                    <th className="px-2 py-2.5 text-center">GD</th>
                    <th className="px-4 py-2.5 text-center w-12">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {teams.map((team, idx) => (
                    <tr 
                      key={team.id} 
                      className={`transition-colors ${
                        team.status === 'qualified' || team.status === 'best-third' 
                          ? 'bg-emerald-50/30 dark:bg-emerald-500/5' 
                          : 'opacity-70 grayscale-[0.5]'
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black ${
                          idx < 2 ? 'bg-emerald-600 text-white' : 
                          team.status === 'best-third' ? 'bg-indigo-600 text-white' : 
                          'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2.5">
                          <TeamIcon code={team.flagCode} name={team.name} className="w-6 h-4" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{team.name}</span>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">{team.confederation}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center font-medium text-slate-500 dark:text-slate-400">3</td>
                      <td className="px-2 py-3 text-center font-bold text-slate-600 dark:text-slate-300">
                        {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-black text-slate-900 dark:text-white">{team.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-auto px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Info size={12} />
                <span>Simulation Complete</span>
              </div>
              <div className="flex gap-1">
                {teams.slice(0, 2).map(t => (
                  <TeamIcon key={t.id} code={t.flagCode} name={t.name} className="w-4 h-2.5 opacity-60" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Best Thirds Table */}
      <div className="bg-indigo-600 dark:bg-indigo-950/40 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
                <Star className="text-amber-300 fill-amber-300" size={24} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight">
                  Best Thirds <span className="text-indigo-200">Ranking</span>
                </h2>
                <p className="text-indigo-100/60 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">
                  Top 8 Qualify for Round of 32
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10">
              <TrendingUp size={18} className="text-indigo-300" />
              <div className="text-[10px] font-black uppercase tracking-widest leading-none">
                Live Analysis <br /> <span className="text-white">Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
                    <th className="px-6 py-4 w-12 text-center">#</th>
                    <th className="px-2 py-4">Qualified Team</th>
                    <th className="px-4 py-4 text-center">Pts</th>
                    <th className="px-4 py-4 text-center">GD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bestThirds.map((team, idx) => (
                    <tr key={team.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500 text-white text-[10px] font-black shadow-lg">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-3">
                          <TeamIcon code={team.flagCode} name={team.name} className="w-8 h-5 shadow-lg border-white/20" />
                          <span className="font-black text-sm">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-black">{team.points}</td>
                      <td className="px-4 py-4 text-center font-bold text-indigo-200">
                        {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-center space-y-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Qualification Logic
                </h4>
                <p className="text-sm text-indigo-50 leading-relaxed font-medium">
                  The expanded 48-team format uses 12 groups. To round out the <span className="text-amber-300 font-bold">Round of 32</span>, the top two teams from each group qualify automatically (24 teams), plus the <span className="text-amber-300 font-bold">eight best-ranked</span> third-place finishers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <XCircle size={20} className="text-rose-400 mb-2" />
                  <div className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Eliminated</div>
                  <div className="text-xl font-black">4 Teams</div>
                  <div className="text-[8px] font-bold text-white/40 uppercase mt-1">Bottom 4 Thirds</div>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                  <AlertCircle size={20} className="text-amber-400 mb-2" />
                  <div className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Threshold</div>
                  <div className="text-xl font-black">~3.5 Pts</div>
                  <div className="text-[8px] font-bold text-white/40 uppercase mt-1">Est. Cut-off</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, subValue: string, icon: React.ReactNode, color: string, bgColor: string }> = ({ label, value, subValue, icon, color, bgColor }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`${bgColor} ${color} p-3 rounded-2xl`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{value}</span>
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{subValue}</span>
    </div>
  </div>
);
