import React, { useState, useMemo } from 'react';
import { MOCK_TEAMS, CONFEDERATION_LABELS } from '../constants';
import { Confederation, Team } from '../types';
import { TeamIcon } from './TeamIcon';
import { Search, Globe, Hash, TrendingUp, Users, Star, LayoutGrid, List } from 'lucide-react';

export const TeamsListView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfed, setFilterConfed] = useState<Confederation | 'ALL'>('ALL');
  const [grouping, setGrouping] = useState<'pot' | 'confed'>('pot');

  const filteredTeams = useMemo(() => {
    return MOCK_TEAMS.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          team.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesConfed = filterConfed === 'ALL' || team.confederation === filterConfed;
      return matchesSearch && matchesConfed;
    });
  }, [searchQuery, filterConfed]);

  const categorizedTeams = useMemo(() => {
    if (grouping === 'pot') {
      const pots: Record<number, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
      filteredTeams.forEach(t => pots[t.pot].push(t));
      return Object.entries(pots).map(([key, teams]) => ({
        id: `pot-${key}`,
        title: `Pot ${key}`,
        subtitle: `${teams.length} Teams`,
        teams: teams.sort((a, b) => a.rank - b.rank)
      }));
    } else {
      const confeds: Partial<Record<Confederation, Team[]>> = {};
      filteredTeams.forEach(t => {
        if (!confeds[t.confederation]) confeds[t.confederation] = [];
        confeds[t.confederation]!.push(t);
      });
      return Object.entries(confeds)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([confed, teams]) => ({
          id: confed,
          title: CONFEDERATION_LABELS[confed as Confederation],
          subtitle: `${teams.length} Qualifiers`,
          teams: teams.sort((a, b) => a.rank - b.rank)
        }));
    }
  }, [filteredTeams, grouping]);

  const stats = useMemo(() => {
    const total = MOCK_TEAMS.length;
    const avgRank = Math.round(MOCK_TEAMS.reduce((acc, t) => acc + t.rank, 0) / total);
    const hosts = MOCK_TEAMS.filter(t => t.isHost).length;
    return { total, avgRank, hosts };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Dashboard Style Stats - Updated to clean white card aesthetic */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-500/20">
               <Users className="text-indigo-200" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Qualified <span className="text-indigo-600 dark:text-indigo-400">Nations</span></h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">48 Finalists · 2026 Tournament Field</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-3xl border border-slate-200 dark:border-slate-700 text-center min-w-[120px] shadow-sm">
                <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Avg Rank</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">#{stats.avgRank}</div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-3xl border border-slate-200 dark:border-slate-700 text-center min-w-[120px] shadow-sm">
                <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Hosts</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.hosts}</div>
             </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Find nation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button onClick={() => setGrouping('pot')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'pot' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>
              <Hash size={12} /> Pots
            </button>
            <button onClick={() => setGrouping('confed')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'confed' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>
              <Globe size={12} /> Regions
            </button>
          </div>
        </div>
      </div>

      {/* Display Sections */}
      <div className="space-y-12">
        {categorizedTeams.map(section => (
          <section key={section.id} className="space-y-5">
            <div className="flex items-center gap-4 px-2">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">{section.title}</h3>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.subtitle}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {section.teams.map(team => (
                <div key={team.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <TeamIcon code={team.flagCode} name={team.name} className="w-10 h-6.5 rounded shadow-lg group-hover:scale-110 transition-transform" />
                      {team.isHost && <Star size={12} className="text-amber-500 fill-amber-500" />}
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-black text-slate-900 dark:text-white uppercase italic text-xs truncate">{team.name}</h4>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                         <span>Rank #{team.rank}</span>
                         <span className="text-indigo-500">{team.id}</span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};