
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MOCK_TEAMS, GROUP_IDS } from './constants';
import { DrawState, Group, Team } from './types';
import { findFirstValidGroupIndex, shuffle, isValidPlacement } from './services/drawService';
import PotList from './components/PotList';
import GroupCard from './components/GroupCard';
import Controls from './components/Controls';
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
  const autoDrawInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    resetDraw();
  }, []);

  const resetDraw = () => {
    if (autoDrawInterval.current) clearInterval(autoDrawInterval.current);
    
    const pot1 = MOCK_TEAMS.filter(t => t.pot === 1);
    const hosts = pot1.filter(t => t.isHost);
    const nonHostsPot1 = shuffle(pot1.filter(t => !t.isHost));
    
    const preparedPots = [
      [...hosts, ...nonHostsPot1],
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
        if (team.id === 'USA') groupIdx = 0;
        if (team.id === 'MEX') groupIdx = 1;
        if (team.id === 'CAN') groupIdx = 2;
      } else {
        groupIdx = findFirstValidGroupIndex(team, groups);
      }

      if (groupIdx === -1) {
        return {
          ...prev,
          isDrawing: false,
          error: `Deadlock: Cannot place ${team.name} anywhere. Try resetting.`,
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
        isDrawing: isComplete ? false : prev.isDrawing
      };
    });
  }, []);

  const moveTeam = (teamId: string, fromGroupId: string | null, toGroupId: string) => {
    setState(prev => {
      const targetGroup = prev.groups.find(g => g.id === toGroupId);
      if (!targetGroup) return prev;

      let movingTeam: Team | undefined;
      
      if (fromGroupId) {
        // Moving between groups
        const sourceGroup = prev.groups.find(g => g.id === fromGroupId);
        movingTeam = sourceGroup?.teams.find(t => t.id === teamId);
      } else {
        // Dragging from pot (manual draw)
        const currentPot = prev.pots[prev.currentPotIndex];
        const teamInPot = currentPot[prev.currentTeamIndex];
        if (teamInPot.id === teamId) {
          movingTeam = teamInPot;
        }
      }

      if (!movingTeam) return prev;

      // Check if team is host and being moved to wrong group
      if (movingTeam.isHost) {
        if (movingTeam.id === 'USA' && toGroupId !== 'A') return { ...prev, error: "USA must stay in Group A" };
        if (movingTeam.id === 'MEX' && toGroupId !== 'B') return { ...prev, error: "Mexico must stay in Group B" };
        if (movingTeam.id === 'CAN' && toGroupId !== 'C') return { ...prev, error: "Canada must stay in Group C" };
      }

      // Check confederation rules (using a temporary group copy to simulate move)
      // If moving within groups, we remove it first from count logic
      const tempGroup = { ...targetGroup, teams: targetGroup.teams.filter(t => t.id !== teamId) };
      if (!isValidPlacement(movingTeam, tempGroup)) {
        return { ...prev, error: `Invalid move for ${movingTeam.name}: Confederation rules violated.` };
      }

      // Perform move
      let newGroups = prev.groups.map(g => {
        if (g.id === fromGroupId) {
          return { ...g, teams: g.teams.filter(t => t.id !== teamId) };
        }
        if (g.id === toGroupId) {
          // Add only if not already there (prevents duplicates)
          if (g.teams.find(t => t.id === teamId)) return g;
          return { ...g, teams: [...g.teams, movingTeam!] };
        }
        return g;
      });

      let nextPotIdx = prev.currentPotIndex;
      let nextTeamIdx = prev.currentTeamIndex;
      let isComplete = prev.isComplete;

      // If we moved from pot, advance the draw cursor
      if (!fromGroupId) {
        const currentPot = prev.pots[prev.currentPotIndex];
        nextTeamIdx++;
        if (nextTeamIdx >= currentPot.length) {
          if (nextPotIdx >= 3) {
            isComplete = true;
          } else {
            nextPotIdx++;
            nextTeamIdx = 0;
          }
        }
      }

      return {
        ...prev,
        groups: newGroups,
        currentPotIndex: nextPotIdx,
        currentTeamIndex: nextTeamIdx,
        isComplete,
        error: undefined
      };
    });
  };

  const handleStartAutoDraw = () => {
    if (state.isComplete) return;
    setState(s => ({ ...s, isDrawing: true }));
    autoDrawInterval.current = setInterval(() => {
      drawNextTeam();
    }, 400);
  };

  const exportCSV = () => {
    const headers = ['Group', 'Slot', 'Team', 'Confederation', 'Rank'];
    const rows = state.groups.flatMap(g => 
      g.teams.map((t, i) => [g.name, i + 1, t.name, t.confederation, t.rank])
    );
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "world_cup_2026_draw.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-6 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Trophy className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase italic">
                FIFA World Cup 2026<span className="text-indigo-500 ml-1">Draw</span>
              </h1>
              <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium">
                <Globe size={14} className="text-indigo-400" />
                <span>USA · MEXICO · CANADA</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
            <div className="flex -space-x-2">
              {['🇺🇸', '🇲🇽', '🇨🇦'].map((flag, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-lg">
                  {flag}
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Host Nations</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-12">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-800 flex-1"></div>
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Qualifying Pots</h2>
            <div className="h-px bg-slate-800 flex-1"></div>
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
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-800 flex-1"></div>
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Group Stage Brackets</h2>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {state.error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-8 flex items-center justify-center gap-3 text-sm font-semibold animate-in zoom-in-95">
              <span>⚠️</span>
              {state.error}
              <button onClick={() => setState(s => ({ ...s, error: undefined }))} className="ml-4 underline opacity-70 hover:opacity-100">Dismiss</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {state.groups.map((group) => (
              <GroupCard key={group.id} group={group} onMoveTeam={moveTeam} />
            ))}
          </div>
        </section>

        {!state.isDrawing && !state.isComplete && (
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-6 text-slate-400 text-sm max-w-3xl mx-auto text-center">
            <h4 className="font-bold text-indigo-400 mb-2 flex items-center justify-center gap-2">
              <Globe size={18} />
              Manual Management Enabled
            </h4>
            <p className="opacity-80">
              You can drag teams between groups or from the current pot into a group. 
              The system will prevent moves that violate confederation rules.
            </p>
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

      {state.isComplete && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-indigo-600/10 absolute inset-0 backdrop-blur-sm animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default App;
