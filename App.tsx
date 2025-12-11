
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MOCK_TEAMS, GROUP_IDS } from './constants';
import { DrawState, Group, Team, Theme } from './types';
import { findSafeGroupIndex, shuffle, isValidPlacement } from './services/drawService';
import PotList from './components/PotList';
import GroupCard from './components/GroupCard';
import Controls from './components/Controls';
import { ThemeToggle } from './components/ThemeToggle';
import { Trophy, Globe } from 'lucide-react';

const INITIAL_STATE: DrawState = {
  pots: [
    MOCK_TEAMS.filter(t => t.pot === 1),
    MOCK_TEAMS.filter(t => t.pot === 2),
    MOCK_TEAMS.filter(t => t.pot === 3),
    MOCK_TEAMS.filter(t => t.pot === 4),
  ],
  groups: GROUP_IDS.map(id => ({ id, name: id, teams: [] })),
  currentPotIndex: 0,
  currentTeamIndex: 0,
  isDrawing: false,
  history: [],
  isComplete: false,
};

const App: React.FC = () => {
  const [state, setState] = useState<DrawState>(INITIAL_STATE);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const autoDrawInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme', theme);

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    resetDraw();
  }, []);

  const resetDraw = () => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    
    const pot1 = MOCK_TEAMS.filter(t => t.pot === 1);
    const hosts = pot1.filter(t => t.isHost);
    const nonHostsPot1 = shuffle(pot1.filter(t => !t.isHost));
    
    const sortedHosts = [...hosts].sort((a, b) => {
      const order = { 'MEX': 0, 'CAN': 1, 'USA': 2 };
      return (order[a.id as keyof typeof order] ?? 99) - (order[b.id as keyof typeof order] ?? 99);
    });

    const preparedPots = [
      [...sortedHosts, ...nonHostsPot1],
      shuffle(MOCK_TEAMS.filter(t => t.pot === 2)),
      shuffle(MOCK_TEAMS.filter(t => t.pot === 3)),
      shuffle(MOCK_TEAMS.filter(t => t.pot === 4)),
    ];

    setState({
      ...INITIAL_STATE,
      pots: preparedPots,
    });
  };

  const drawNextTeam = useCallback(() => {
    setState(prev => {
      if (prev.isComplete) return prev;

      const { currentPotIndex, currentTeamIndex, pots, groups, history } = prev;
      const currentPot = pots[currentPotIndex];
      const team = currentPot[currentTeamIndex];

      let groupIdx = -1;
      
      if (team.isHost) {
        if (team.id === 'MEX') groupIdx = 0; 
        if (team.id === 'CAN') groupIdx = 1; 
        if (team.id === 'USA') groupIdx = 3; 
      } else {
        groupIdx = findSafeGroupIndex(team, currentPot, currentTeamIndex, groups);
      }

      if (groupIdx === -1) {
        if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
        return {
          ...prev,
          isDrawing: false,
          error: `Constraints error: Placing ${team.name} now would make it impossible to finish Pot ${currentPotIndex + 1} legally. Try resetting or adjusting manual placements.`,
        };
      }

      const newGroups = groups.map((g, idx) => 
        idx === groupIdx ? { ...g, teams: [...g.teams, team] } : g
      );

      const nextTeamIdx = currentTeamIndex + 1;
      let nextPotIdx = currentPotIndex;
      let isComplete = false;

      if (nextTeamIdx >= currentPot.length) {
        if (currentPotIndex >= 3) {
          isComplete = true;
          if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
        } else {
          nextPotIdx = currentPotIndex + 1;
        }
      }

      return {
        ...prev,
        groups: newGroups,
        currentPotIndex: nextPotIdx,
        currentTeamIndex: isComplete ? currentTeamIndex : (nextTeamIdx >= currentPot.length ? 0 : nextTeamIdx),
        history: [...history, { team, groupId: groups[groupIdx].id }],
        isComplete,
        isDrawing: isComplete ? false : prev.isDrawing,
        error: undefined
      };
    });
  }, []);

  const moveTeam = (teamId: string, fromGroupId: string | null, toGroupId: string) => {
    setState(prev => {
      const targetGroup = prev.groups.find(g => g.id === toGroupId);
      if (!targetGroup) return prev;

      let movingTeam: Team | undefined;
      
      if (fromGroupId) {
        const sourceGroup = prev.groups.find(g => g.id === fromGroupId);
        movingTeam = sourceGroup?.teams.find(t => t.id === teamId);
      } else {
        const currentPot = prev.pots[prev.currentPotIndex];
        movingTeam = currentPot.find(t => t.id === teamId);
      }

      if (!movingTeam) return prev;

      if (movingTeam.isHost) {
        if (movingTeam.id === 'MEX' && toGroupId !== 'A') return { ...prev, error: "Mexico is locked to Group A" };
        if (movingTeam.id === 'CAN' && toGroupId !== 'B') return { ...prev, error: "Canada is locked to Group B" };
        if (movingTeam.id === 'USA' && toGroupId !== 'D') return { ...prev, error: "USA is locked to Group D" };
      }

      if (targetGroup.teams.some(t => t.pot === movingTeam!.pot)) {
        return { ...prev, error: `Group ${toGroupId} already has a team from Pot ${movingTeam.pot}.` };
      }

      if (!isValidPlacement(movingTeam, targetGroup)) {
        return { ...prev, error: `Placement invalid: Same-confederation or UEFA limits violated.` };
      }

      let newGroups = prev.groups.map(g => {
        if (g.id === fromGroupId) return { ...g, teams: g.teams.filter(t => t.id !== teamId) };
        if (g.id === toGroupId) return { ...g, teams: [...g.teams, movingTeam!] };
        return g;
      });

      let nextPotIdx = prev.currentPotIndex;
      let nextTeamIdx = prev.currentTeamIndex;
      let isComplete = prev.isComplete;

      if (!fromGroupId) {
        const currentPot = prev.pots[prev.currentPotIndex];
        nextTeamIdx++;
        if (nextTeamIdx >= currentPot.length) {
          if (nextPotIdx >= 3) isComplete = true; else { nextPotIdx++; nextTeamIdx = 0; }
        }
      }

      return { ...prev, groups: newGroups, currentPotIndex: nextPotIdx, currentTeamIndex: nextTeamIdx, isComplete, error: undefined };
    });
  };

  const handleStartAutoDraw = () => {
    if (state.isComplete) return;
    setState(s => ({ ...s, isDrawing: true, error: undefined }));
    autoDrawInterval.current = setInterval(() => {
      drawNextTeam();
    }, 400);
  };

  const exportCSV = () => {
    const headers = ['Group', 'Pot', 'Team', 'Confederation', 'Rank'];
    const rows = state.groups.flatMap(g => g.teams.sort((a,b)=>a.pot-b.pot).map(t => [g.name, t.pot, t.name, t.confederation, t.rank]));
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fifa_2026_draw_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6 sticky top-0 z-30 shadow-sm dark:shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Trophy className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                FIFA World Cup 2026<span className="text-indigo-600 dark:text-indigo-500 ml-1">Draw</span>
              </h1>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                <Globe size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span>OFFICIAL SIMULATOR · 48 TEAMS</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-4 mr-4">
                  {['mx', 'ca', 'us'].map((code, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 overflow-hidden shadow-md">
                      <img src={`https://flagcdn.com/w80/${code}.png`} className="w-full h-full object-cover" />
                    </div>
                  ))}
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block"></div>
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-12">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <h2 className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">World Ranking Distribution</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {state.pots.map((pot, idx) => (
              <PotList 
                key={idx} 
                potNumber={idx + 1} 
                teams={pot} 
                drawnCount={state.currentPotIndex > idx ? pot.length : (state.currentPotIndex === idx ? state.currentTeamIndex : 0)} 
                currentPotIndex={state.currentPotIndex}
                activeTeamIndex={state.currentPotIndex === idx ? state.currentTeamIndex : -1}
                onDragStart={setDraggedTeam}
                onDragEnd={() => setDraggedTeam(null)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <h2 className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">Tournament Brackets (A-L)</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          </div>

          {state.error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-8 flex items-center justify-between gap-3 text-sm font-semibold animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                {state.error}
              </div>
              <button onClick={() => setState(s => ({ ...s, error: undefined }))} className="px-3 py-1 bg-red-500/20 rounded hover:bg-red-500/40 transition-colors uppercase text-[10px]">Close</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.groups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                onMoveTeam={moveTeam} 
                draggedTeam={draggedTeam}
                onDragStart={setDraggedTeam}
                onDragEnd={() => setDraggedTeam(null)}
              />
            ))}
          </div>
        </section>

        {!state.isDrawing && !state.isComplete && (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center shadow-sm">
            <div className="text-center md:text-left flex-1">
              <h4 className="font-black text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
                <Globe size={20} className="text-indigo-600 dark:text-indigo-500" />
                FIFA Draw Protocols
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                The 48-team expansion introduces 12 groups. 
                Our <b>Safety Solver</b> ensures 1 team per pot per group while respecting confederation caps.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center w-24">
                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">16</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">UEFA</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center w-24">
                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">4</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Pots</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center w-24">
                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-xl">12</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">Groups</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Controls 
        onStart={handleStartAutoDraw}
        onNext={drawNextTeam}
        onReset={resetDraw}
        onExport={exportCSV}
        isDrawing={state.isDrawing}
        isComplete={state.isComplete}
        canNext={!state.isComplete && !state.error}
      />
    </div>
  );
};

export default App;
