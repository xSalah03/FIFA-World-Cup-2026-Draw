
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { MOCK_TEAMS, GROUP_IDS } from './constants';
import { DrawState, Group, Team, Theme, AppView, DrawHistoryEntry } from './types';
import { findSafeGroupIndex, shuffle, isValidPlacement, isValidSwap } from './services/drawService';
// Imported simulation service and result interface
import { calculateGroupStandings, SimulationResult } from './services/knockoutService';
import PotList from './components/PotList';
import GroupCard from './components/GroupCard';
import Controls from './components/Controls';
import { ThemeToggle } from './components/ThemeToggle';
import { SavedDrawsManager } from './components/SavedDrawsManager';
import { KnockoutStage } from './components/KnockoutStage';
import { GroupStandingsView } from './components/GroupStandingsView';
import { Trophy, Globe, LayoutDashboard, GitBranch, ListOrdered } from 'lucide-react';

const getInitialCompletedState = (): DrawState => {
  const findTeam = (id: string) => MOCK_TEAMS.find(t => t.id === id)!;
  
  const mapping: Record<string, string[]> = {
    'A': ['MEX', 'RSA', 'KOR', 'EPOD'],
    'B': ['CAN', 'EPOA', 'QAT', 'SUI'],
    'C': ['BRA', 'MAR', 'HAI', 'SCO'],
    'D': ['USA', 'PAR', 'AUS', 'EPOC'],
    'E': ['GER', 'CUW', 'CIV', 'ECU'],
    'F': ['NED', 'JPN', 'EPOB', 'TUN'],
    'G': ['BEL', 'EGY', 'IRN', 'NZL'],
    'H': ['ESP', 'CPV', 'KSA', 'URU'],
    'I': ['FRA', 'SEN', 'FPO2', 'NOR'],
    'J': ['ARG', 'ALG', 'AUT', 'JOR'],
    'K': ['POR', 'FPO1', 'UZB', 'COL'],
    'L': ['ENG', 'CRO', 'GHA', 'PAN']
  };

  const groups = GROUP_IDS.map(id => ({
    id,
    name: id,
    teams: (mapping[id] || []).map(findTeam)
  }));

  return {
    pots: [
      MOCK_TEAMS.filter(t => t.pot === 1),
      MOCK_TEAMS.filter(t => t.pot === 2),
      MOCK_TEAMS.filter(t => t.pot === 3),
      MOCK_TEAMS.filter(t => t.pot === 4),
    ],
    groups,
    currentPotIndex: 3,
    currentTeamIndex: 11,
    isDrawing: false,
    history: [],
    isComplete: true,
  };
};

const App: React.FC = () => {
  const [state, setState] = useState<DrawState>(getInitialCompletedState());
  const [view, setView] = useState<AppView>('knockouts');
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

  const resetDraw = () => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    setView('draw');
    
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
      pots: preparedPots,
      groups: GROUP_IDS.map(id => ({ id, name: id, teams: [] })),
      currentPotIndex: 0,
      currentTeamIndex: 0,
      isDrawing: false,
      history: [],
      isComplete: false,
    });
  };

  /**
   * Performs a single drawing step. 
   * Captures the state BEFORE any changes for the history snapshot.
   */
  const processNextTeam = (currentState: DrawState): DrawState => {
    if (currentState.isComplete) return currentState;

    const { currentPotIndex, currentTeamIndex, pots, groups, history } = currentState;
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
      return {
        ...currentState,
        isDrawing: false,
        error: `Constraints error: Impossible to place ${team.name} legally.`,
      };
    }

    // SNAPSHOT: Represents the state BEFORE the team is picked.
    // Restoring this snapshot will return the team to the pot and reset indices.
    const historyEntry: DrawHistoryEntry = {
      groups: JSON.parse(JSON.stringify(groups)),
      currentPotIndex,
      currentTeamIndex,
      isComplete: currentState.isComplete,
      type: 'pick',
      lastTeam: team,
      lastGroupId: groups[groupIdx].id
    };

    const newGroups = groups.map((g, idx) => 
      idx === groupIdx ? { ...g, teams: [...g.teams, team] } : g
    );

    const totalTeamsPlaced = newGroups.reduce((acc, g) => acc + g.teams.length, 0);
    const isComplete = totalTeamsPlaced === 48;

    let nextPotIdx = currentPotIndex;
    let nextTeamIdx = currentTeamIndex + 1;

    if (!isComplete && nextTeamIdx >= currentPot.length) {
      nextPotIdx = Math.min(3, currentPotIndex + 1);
      nextTeamIdx = 0;
    }

    return {
      ...currentState,
      groups: newGroups,
      currentPotIndex: nextPotIdx,
      currentTeamIndex: isComplete ? currentTeamIndex : nextTeamIdx,
      history: [...history, historyEntry],
      isComplete,
      error: undefined
    };
  };

  const drawNextTeam = useCallback(() => {
    setState(prev => {
      const newState = processNextTeam(prev);
      if (newState.isComplete && autoDrawInterval.current) {
        clearInterval(autoDrawInterval.current);
      }
      return newState;
    });
  }, []);

  const handleFastDraw = useCallback(() => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    
    setState(prev => {
      let currentState = { ...prev, isDrawing: false };
      while (!currentState.isComplete && !currentState.error) {
        currentState = processNextTeam(currentState);
      }
      return { ...currentState, isDrawing: false };
    });
  }, []);

  /**
   * Restoration-based undo. Simply pops the last state from history.
   */
  const undoLastMove = useCallback(() => {
    if (autoDrawInterval.current) {
      clearInterval(autoDrawInterval.current);
    }

    setState(prev => {
      if (prev.history.length === 0) return { ...prev, isDrawing: false };
      
      const lastSnapshot = prev.history[prev.history.length - 1];
      
      return {
        ...prev,
        groups: lastSnapshot.groups,
        currentPotIndex: lastSnapshot.currentPotIndex,
        currentTeamIndex: lastSnapshot.currentTeamIndex,
        isComplete: lastSnapshot.isComplete,
        history: prev.history.slice(0, -1),
        isDrawing: false,
        error: undefined
      };
    });
  }, []);

  /**
   * Handles manual drag and drop for both picking (pot to group) and swapping (group to group).
   */
  const moveTeam = (teamId: string, fromGroupId: string | null, toGroupId: string) => {
    setState(prev => {
      const targetGroup = prev.groups.find(g => g.id === toGroupId);
      const sourceGroup = fromGroupId ? prev.groups.find(g => g.id === fromGroupId) : null;
      if (!targetGroup) return prev;

      let movingTeam: Team | undefined;
      if (sourceGroup) {
        movingTeam = sourceGroup.teams.find(t => t.id === teamId);
      } else {
        const currentPot = prev.pots[prev.currentPotIndex];
        movingTeam = currentPot.find(t => t.id === teamId);
      }

      if (!movingTeam) return prev;
      const existingTeamInTarget = targetGroup.teams.find(t => t.pot === movingTeam!.pot);

      // Snapshot for history before any changes are applied.
      const snapshot: DrawHistoryEntry = {
        groups: JSON.parse(JSON.stringify(prev.groups)),
        currentPotIndex: prev.currentPotIndex,
        currentTeamIndex: prev.currentTeamIndex,
        isComplete: prev.isComplete,
        type: fromGroupId ? 'swap' : 'pick',
        lastTeam: movingTeam,
        lastGroupId: toGroupId
      };

      // Case: SWAP between groups
      if (fromGroupId && sourceGroup) {
        if (existingTeamInTarget) {
          if (!isValidSwap(movingTeam, sourceGroup, existingTeamInTarget, targetGroup)) {
            return { ...prev, error: `Switching ${movingTeam.name} and ${existingTeamInTarget.name} violates confederation or host rules.` };
          }
          const newGroups = prev.groups.map(g => {
            if (g.id === fromGroupId) return { ...g, teams: g.teams.map(t => t.id === teamId ? existingTeamInTarget : t) };
            if (g.id === toGroupId) return { ...g, teams: g.teams.map(t => t.id === existingTeamInTarget.id ? movingTeam! : t) };
            return g;
          });
          // For swaps, indices currentPotIndex/currentTeamIndex do NOT change.
          return { ...prev, groups: newGroups, error: undefined, history: [...prev.history, snapshot] };
        } else {
          // Standard move between groups (into empty slot)
          if (!isValidPlacement(movingTeam, targetGroup)) return { ...prev, error: `Placement invalid: Confederation rules violated.` };
          const newGroups = prev.groups.map(g => {
            if (g.id === fromGroupId) return { ...g, teams: g.teams.filter(t => t.id !== teamId) };
            if (g.id === toGroupId) return { ...g, teams: [...g.teams, movingTeam!] };
            return g;
          });
          return { ...prev, groups: newGroups, error: undefined, history: [...prev.history, snapshot] };
        }
      }

      // Case: PICK from pot to group
      if (!fromGroupId) {
        if (existingTeamInTarget) {
          return { ...prev, error: `Group ${toGroupId} already has a team from Pot ${movingTeam.pot}. Use "Undo" to revert picks.` };
        }

        if (movingTeam.isHost) {
          if (movingTeam.id === 'MEX' && toGroupId !== 'A') return { ...prev, error: "Mexico is locked to Group A" };
          if (movingTeam.id === 'CAN' && toGroupId !== 'B') return { ...prev, error: "Canada is locked to Group B" };
          if (movingTeam.id === 'USA' && toGroupId !== 'D') return { ...prev, error: "USA is locked to Group D" };
        }

        if (!isValidPlacement(movingTeam, targetGroup)) return { ...prev, error: `Placement invalid: Confederation rules violated.` };

        const newGroups = prev.groups.map(g => {
          if (g.id === toGroupId) return { ...g, teams: [...g.teams, movingTeam!] };
          return g;
        });

        const totalTeamsPlaced = newGroups.reduce((acc, g) => acc + g.teams.length, 0);
        const isComplete = totalTeamsPlaced === 48;

        let nextPotIdx = prev.currentPotIndex;
        let nextTeamIdx = prev.currentTeamIndex + 1;

        if (!isComplete && nextTeamIdx >= prev.pots[nextPotIdx].length) {
          nextPotIdx = Math.min(3, nextPotIdx + 1);
          nextTeamIdx = 0;
        }

        return { 
          ...prev, 
          groups: newGroups, 
          currentPotIndex: nextPotIdx, 
          currentTeamIndex: isComplete ? prev.currentTeamIndex : nextTeamIdx, 
          isComplete, 
          error: undefined, 
          history: [...prev.history, snapshot] 
        };
      }

      return prev;
    });
  };

  const handleStartAutoDraw = () => {
    if (state.isComplete) return;
    setState(s => ({ ...s, isDrawing: true, error: undefined }));
    autoDrawInterval.current = setInterval(() => { drawNextTeam(); }, 400);
  };

  const handleLoadState = (newState: DrawState) => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    setState(newState);
    setView('draw');
  };

  const simulationResult = useMemo(() => {
    if (state.isComplete) return calculateGroupStandings(state.groups);
    return null;
  }, [state.groups, state.isComplete]);

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
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <SavedDrawsManager currentState={state} onLoad={handleLoadState} />
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block"></div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </header>

      {state.isComplete && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[89px] z-20 flex justify-center">
          <div className="flex p-1 gap-1">
            <button onClick={() => setView('draw')} className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${view === 'draw' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <LayoutDashboard size={18} /> Brackets
            </button>
            <button onClick={() => setView('standings')} className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${view === 'standings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <ListOrdered size={18} /> Standings
            </button>
            <button onClick={() => setView('knockouts')} className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg ${view === 'knockouts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <GitBranch size={18} /> Knockouts
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-12">
        {view === 'draw' && (
          <>
            <section>
              <div className="flex items-center gap-4 mb-6"><div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div><h2 className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">World Ranking Distribution</h2><div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {state.pots.map((pot, idx) => {
                  const isDrawnFully = state.isComplete || state.currentPotIndex > idx;
                  const isCurrentlyDrawing = !state.isComplete && state.currentPotIndex === idx;
                  const drawnCount = isDrawnFully ? pot.length : (isCurrentlyDrawing ? state.currentTeamIndex : 0);
                  return <PotList key={idx} potNumber={idx + 1} teams={pot} drawnCount={drawnCount} currentPotIndex={state.currentPotIndex} activeTeamIndex={isCurrentlyDrawing ? state.currentTeamIndex : -1} onDragStart={setDraggedTeam} onDragEnd={() => setDraggedTeam(null)} />;
                })}
              </div>
            </section>
            <section>
              <div className="flex items-center gap-4 mb-8"><div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div><h2 className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs">Tournament Brackets (A-L)</h2><div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div></div>
              {state.error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 flex items-center justify-between gap-3 text-sm font-semibold animate-in zoom-in-95"><div className="flex items-center gap-3"><span className="text-lg">⚠️</span>{state.error}</div><button onClick={() => setState(s => ({ ...s, error: undefined }))} className="px-3 py-1 bg-rose-500/20 rounded hover:bg-rose-500/40 transition-colors uppercase text-[10px]">Close</button></div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {state.groups.map((group) => <GroupCard key={group.id} group={group} allGroups={state.groups} onMoveTeam={moveTeam} draggedTeam={draggedTeam} onDragStart={setDraggedTeam} onDragEnd={() => setDraggedTeam(null)} />)}
              </div>
            </section>
          </>
        )}
        {view === 'standings' && simulationResult && <GroupStandingsView groups={state.groups} simulation={simulationResult} />}
        {view === 'knockouts' && simulationResult && <KnockoutStage groups={state.groups} simulation={simulationResult} />}
      </main>

      <Controls 
        onStart={handleStartAutoDraw}
        onFastForward={handleFastDraw}
        onNext={drawNextTeam}
        onUndo={undoLastMove}
        onReset={resetDraw}
        onExport={() => {}}
        onViewChange={(v) => setView(v)}
        isDrawing={state.isDrawing}
        isComplete={state.isComplete}
        canNext={!state.isComplete && !state.error}
        canUndo={state.history.length > 0}
        currentView={view}
        history={state.history}
        groups={state.groups}
      />
    </div>
  );
};

export default App;
