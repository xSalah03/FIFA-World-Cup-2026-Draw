
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MOCK_TEAMS, GROUP_IDS } from './constants';
import { DrawState, Group, Team, Theme, AppView } from './types';
import { findSafeGroupIndex, shuffle, isValidPlacement, isValidSwap } from './services/drawService';
import PotList from './components/PotList';
import GroupCard from './components/GroupCard';
import Controls from './components/Controls';
import { ThemeToggle } from './components/ThemeToggle';
import { SavedDrawsManager } from './components/SavedDrawsManager';
import { KnockoutStage } from './components/KnockoutStage';
import { Trophy, Globe, LayoutDashboard, GitBranch } from 'lucide-react';

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
  const [view, setView] = useState<AppView>('draw');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  
  // Undo/Redo Stacks (Session based)
  const [pastStates, setPastStates] = useState<DrawState[]>([]);
  const [futureStates, setFutureStates] = useState<DrawState[]>([]);
  
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
    setView('draw');
    setPastStates([]);
    setFutureStates([]);
    
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

  /**
   * Helper function to perform a single drawing step on a given state.
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

    const newGroups = groups.map((g, idx) => 
      idx === groupIdx ? { ...g, teams: [...g.teams, team] } : g
    );

    const nextTeamIdx = currentTeamIndex + 1;
    let nextPotIdx = currentPotIndex;
    let isComplete = false;

    if (nextTeamIdx >= currentPot.length) {
      if (currentPotIndex >= 3) {
        isComplete = true;
      } else {
        nextPotIdx = currentPotIndex + 1;
      }
    }

    return {
      ...currentState,
      groups: newGroups,
      currentPotIndex: nextPotIdx,
      currentTeamIndex: isComplete ? currentTeamIndex : (nextTeamIdx >= currentPot.length ? 0 : nextTeamIdx),
      history: [...history, { team, groupId: groups[groupIdx].id }],
      isComplete,
      error: undefined
    };
  };

  const drawNextTeam = useCallback(() => {
    setState(prev => {
      const newState = processNextTeam(prev);
      if (newState !== prev && !newState.error) {
        setPastStates(p => [...p, prev]);
        setFutureStates([]);
      }
      if (newState.isComplete && autoDrawInterval.current) {
        clearInterval(autoDrawInterval.current);
      }
      return newState;
    });
  }, []);

  const handleFastDraw = useCallback(() => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    
    setState(prev => {
      // Record state BEFORE lightning draw so one UNDO reverts the whole thing
      setPastStates(p => [...p, prev]);
      setFutureStates([]);

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

    if (pastStates.length > 0) {
      const lastState = pastStates[pastStates.length - 1];
      setFutureStates(f => [state, ...f]);
      setPastStates(p => p.slice(0, -1));
      setState(lastState);
    }
  }, [pastStates, state]);

  const redoNextMove = useCallback(() => {
    if (futureStates.length > 0) {
      const nextState = futureStates[0];
      setPastStates(p => [...p, state]);
      setFutureStates(f => f.slice(1));
      setState(nextState);
    }
  }, [futureStates, state]);

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

      let newState: DrawState | null = null;

      if (existingTeamInTarget) {
        if (sourceGroup) {
          if (!isValidSwap(movingTeam, sourceGroup, existingTeamInTarget, targetGroup)) {
            return { ...prev, error: `Switching ${movingTeam.name} and ${existingTeamInTarget.name} violates confederation or host rules.` };
          }

          const newGroups = prev.groups.map(g => {
            if (g.id === fromGroupId) {
              return { ...g, teams: g.teams.map(t => t.id === teamId ? existingTeamInTarget : t) };
            }
            if (g.id === toGroupId) {
              return { ...g, teams: g.teams.map(t => t.id === existingTeamInTarget.id ? movingTeam! : t) };
            }
            return g;
          });

          newState = {
            ...prev,
            groups: newGroups,
            error: undefined,
            history: [...prev.history, { team: movingTeam, groupId: toGroupId }]
          };
        } else {
          return { ...prev, error: `Group ${toGroupId} already has a team from Pot ${movingTeam.pot}. Use "Undo" to clear slots.` };
        }
      }

      if (!newState) {
        if (movingTeam.isHost) {
          if (movingTeam.id === 'MEX' && toGroupId !== 'A') return { ...prev, error: "Mexico is locked to Group A" };
          if (movingTeam.id === 'CAN' && toGroupId !== 'B') return { ...prev, error: "Canada is locked to Group B" };
          if (movingTeam.id === 'USA' && toGroupId !== 'D') return { ...prev, error: "USA is locked to Group D" };
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

        newState = { 
          ...prev, 
          groups: newGroups, 
          currentPotIndex: nextPotIdx, 
          currentTeamIndex: nextTeamIdx, 
          isComplete, 
          error: undefined,
          history: [...prev.history, { team: movingTeam!, groupId: toGroupId }]
        };
      }

      if (newState && newState !== prev) {
        setPastStates(p => [...p, prev]);
        setFutureStates([]);
        return newState;
      }

      return prev;
    });
  };

  const handleStartAutoDraw = () => {
    if (state.isComplete) return;
    setState(s => ({ ...s, isDrawing: true, error: undefined }));
    autoDrawInterval.current = setInterval(() => {
      drawNextTeam();
    }, 400);
  };

  const handleLoadState = (newState: DrawState) => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    setPastStates([]);
    setFutureStates([]);
    setState(newState);
    setView('draw');
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

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <SavedDrawsManager currentState={state} onLoad={handleLoadState} />
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block"></div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </header>

      {/* View Tabs */}
      {state.isComplete && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[89px] z-20 flex justify-center">
          <div className="flex p-1 gap-1">
            <button 
              onClick={() => setView('draw')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all rounded-lg ${view === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={18} />
              Group Stage
            </button>
            <button 
              onClick={() => setView('knockouts')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all rounded-lg ${view === 'knockouts' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <GitBranch size={18} />
              Knockout Stage
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-12">
        {view === 'draw' ? (
          <>
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
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 flex items-center justify-between gap-3 text-sm font-semibold animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚠️</span>
                    {state.error}
                  </div>
                  <button onClick={() => setState(s => ({ ...s, error: undefined }))} className="px-3 py-1 bg-rose-500/20 rounded hover:bg-rose-500/40 transition-colors uppercase text-[10px]">Close</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        ) : (
          <KnockoutStage groups={state.groups} />
        )}
      </main>

      <Controls 
        onStart={handleStartAutoDraw}
        onFastForward={handleFastDraw}
        onNext={drawNextTeam}
        onUndo={undoLastMove}
        onRedo={redoNextMove}
        onReset={resetDraw}
        onExport={() => {}}
        onProceed={() => setView('knockouts')}
        isDrawing={state.isDrawing}
        isComplete={state.isComplete}
        canNext={!state.isComplete && !state.error}
        canUndo={pastStates.length > 0}
        canRedo={futureStates.length > 0}
        currentView={view}
      />
    </div>
  );
};

export default App;
