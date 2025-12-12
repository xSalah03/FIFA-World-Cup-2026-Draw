import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { MOCK_TEAMS, GROUP_IDS } from './constants';
import { DrawState, Group, Team, Theme, AppView, DrawHistoryEntry } from './types';
import { findSafeGroupIndex, shuffle, isValidPlacement, isValidSwap } from './services/drawService';
import { calculateGroupStandings, SimulationResult } from './services/knockoutService';
import PotList from './components/PotList';
import GroupCard from './components/GroupCard';
import Controls from './components/Controls';
import { ThemeToggle } from './components/ThemeToggle';
import { SavedDrawsManager } from './components/SavedDrawsManager';
import { KnockoutStage } from './components/KnockoutStage';
import { GroupStandingsView } from './components/GroupStandingsView';
import { TeamsListView } from './components/TeamsListView';
import { Trophy, Globe, LayoutDashboard, GitBranch, ListOrdered, Users } from 'lucide-react';

const getInitialEmptyState = (): DrawState => {
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

  return {
    pots: preparedPots,
    groups: GROUP_IDS.map(id => ({ id, name: id, teams: [] })),
    currentPotIndex: 0,
    currentTeamIndex: 0,
    isDrawing: false,
    history: [],
    isComplete: false,
  };
};

const App: React.FC = () => {
  // Website now starts at 'teams' view with an empty state
  const [view, setView] = useState<AppView>('teams');
  const [state, setState] = useState<DrawState>(getInitialEmptyState());
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const autoDrawInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme', theme);

    const applyTheme = () => {
      const isDark = 
        theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const resetDraw = () => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    setView('draw');
    setState(getInitialEmptyState());
  };

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

      const snapshot: DrawHistoryEntry = {
        groups: JSON.parse(JSON.stringify(prev.groups)),
        currentPotIndex: prev.currentPotIndex,
        currentTeamIndex: prev.currentTeamIndex,
        isComplete: prev.isComplete,
        type: fromGroupId ? 'swap' : 'pick',
        lastTeam: movingTeam,
        lastGroupId: toGroupId
      };

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
          return { ...prev, groups: newGroups, error: undefined, history: [...prev.history, snapshot] };
        } else {
          if (!isValidPlacement(movingTeam, targetGroup)) return { ...prev, error: `Placement invalid: Confederation rules violated.` };
          const newGroups = prev.groups.map(g => {
            if (g.id === fromGroupId) return { ...g, teams: g.teams.filter(t => t.id !== teamId) };
            if (g.id === toGroupId) return { ...g, teams: [...g.teams, movingTeam!] };
            return g;
          });
          return { ...prev, groups: newGroups, error: undefined, history: [...prev.history, snapshot] };
        }
      }

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
      {/* Consolidated sticky header and navigation to ensure perfect mobile responsiveness */}
      <div className="sticky top-0 z-30 shadow-md">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 sm:py-6 shadow-sm dark:shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="bg-indigo-600 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
                <Trophy className="text-white" size={24} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic truncate">
                  WC 2026<span className="text-indigo-600 dark:text-indigo-500 ml-1">Draw</span>
                </h1>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] sm:text-sm font-medium">
                  <Globe size={12} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">OFFICIAL SIMULATOR · 48 TEAMS</span>
                </div>
              </div>
            </div>
            <div className="flex flex-row items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
              <SavedDrawsManager currentState={state} onLoad={handleLoadState} />
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>
        </header>

        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex justify-center">
          <div className="flex p-1.5 gap-1 sm:gap-2 overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setView('teams')} 
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all rounded-lg shrink-0 ${view === 'teams' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Users size={14} /> Teams
            </button>
            <button 
              onClick={() => setView('draw')} 
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all rounded-lg shrink-0 ${view === 'draw' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={14} /> Draw
            </button>
            {state.isComplete && (
              <>
                <button 
                  onClick={() => setView('standings')} 
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all rounded-lg shrink-0 ${view === 'standings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <ListOrdered size={14} /> Standings
                </button>
                <button 
                  onClick={() => setView('knockouts')} 
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all rounded-lg shrink-0 ${view === 'knockouts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <GitBranch size={14} /> Knockouts
                </button>
              </>
            )}
          </div>
        </nav>
      </div>

      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-8 sm:space-y-12">
        {view === 'teams' && <TeamsListView />}
        {view === 'draw' && (
          <>
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-4 mb-4 sm:mb-6">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                <h2 className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] text-center shrink-0">World Ranking Pots</h2>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {state.pots.map((pot, idx) => {
                  const isDrawnFully = state.isComplete || state.currentPotIndex > idx;
                  const isCurrentlyDrawing = !state.isComplete && state.currentPotIndex === idx;
                  const drawnCount = isDrawnFully ? pot.length : (isCurrentlyDrawing ? state.currentTeamIndex : 0);
                  return (
                    <PotList 
                      key={idx} 
                      potNumber={idx + 1} 
                      teams={pot} 
                      drawnCount={drawnCount} 
                      currentPotIndex={state.currentPotIndex} 
                      activeTeamIndex={isCurrentlyDrawing ? state.currentTeamIndex : -1} 
                      onDragStart={setDraggedTeam} 
                      onDragEnd={() => setDraggedTeam(null)} 
                    />
                  );
                })}
              </div>
            </section>
            
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-6 sm:mb-8">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                <h2 className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] text-center shrink-0">Tournament Brackets (A-L)</h2>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              </div>
              
              {state.error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-semibold animate-in zoom-in-95">
                  <div className="flex items-center gap-3"><span className="text-lg shrink-0">⚠️</span>{state.error}</div>
                  <button 
                    onClick={() => setState(s => ({ ...s, error: undefined }))} 
                    className="px-4 py-1.5 bg-rose-500/20 rounded-lg hover:bg-rose-500/40 transition-colors uppercase text-[10px] w-full sm:w-auto font-black tracking-widest"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {state.groups.map((group) => (
                  <GroupCard 
                    key={group.id} 
                    group={group} 
                    allGroups={state.groups} 
                    onMoveTeam={moveTeam} 
                    draggedTeam={draggedTeam} 
                    onDragStart={setDraggedTeam} 
                    onDragEnd={() => setDraggedTeam(null)} 
                  />
                ))}
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