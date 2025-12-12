
import React, { useState, useMemo } from 'react';
import { MOCK_TEAMS, CONFEDERATION_LABELS } from '../constants';
import { Confederation, Team } from '../types';
import { TeamIcon } from './TeamIcon';
import { Search, Filter, Globe, Hash, TrendingUp, Info, Users, Shield, Star, LayoutGrid, List } from 'lucide-react';

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
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatSummary 
          icon={<Users className="text-indigo-600 dark:text-indigo-400" size={20} />} 
          label="Total Nations" 
          value={stats.total} 
          subLabel="Qualified Finalists"
        />
        <StatSummary 
          icon={<TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />} 
          label="Average Rank" 
          value={`#${stats.avgRank}`} 
          subLabel="Tournament Field"
        />
        <StatSummary 
          icon={<Star className="text-amber-500" size={20} />} 
          label="Host Nations" 
          value={stats.hosts} 
          subLabel="MEX / CAN / USA"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search teams by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button 
              onClick={() => setGrouping('pot')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'pot' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
            >
              <Hash size={12} /> By Pot
            </button>
            <button 
              onClick={() => setGrouping('confed')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${grouping === 'confed' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
            >
              <Globe size={12} /> By Region
            </button>
          </div>

          <select 
            value={filterConfed}
            onChange={(e) => setFilterConfed(e.target.value as Confederation | 'ALL')}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Regions</option>
            {Object.entries(CONFEDERATION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Display */}
      <div className="space-y-12">
        {categorizedTeams.map(section => (
          <section key={section.id} className="space-y-4">
            <div className="flex items-end gap-3 px-2">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white leading-none">
                {section.title}
              </h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                {section.subtitle}
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mb-1.5 ml-2"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {section.teams.map(team => (
                <TeamCard key={team.id} team={team} />
              ))}
              {section.teams.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 dark:text-slate-600 text-sm font-medium italic">No teams found matching filters</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const TeamCard: React.FC<{ team: Team }> = ({ team }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <TeamIcon code={team.flagCode} name={team.name} className="w-10 h-6.5 shadow-md group-hover:scale-110 transition-transform" />
      <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">{team.id}</span>
    </div>
    <div className="space-y-1">
      <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate leading-tight">
        {team.name}
      </h4>
      <div className="flex items-center gap-1.5">
        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
          team.pot === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
          team.pot === 2 ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400' :
          team.pot === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
          'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
        }`}>
          Pot {team.pot}
        </span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Rank #{team.rank}</span>
      </div>
    </div>
    
    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Globe size={10} className="text-slate-300 dark:text-slate-700" />
        <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{team.confederation}</span>
      </div>
      {team.isHost && (
        <div className="bg-amber-400 text-amber-950 p-1 rounded shadow-sm">
          <Star size={10} fill="currentColor" />
        </div>
      )}
    </div>
  </div>
);

const StatSummary: React.FC<{ icon: React.ReactNode, label: string, value: string | number, subLabel: string }> = ({ icon, label, value, subLabel }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</span>
      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none my-0.5">{value}</span>
      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{subLabel}</span>
    </div>
  </div>
);
