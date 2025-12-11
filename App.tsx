
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
    
    // Sort hosts specifically to handle drawing them in order for A, B, D assignment
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
        // Explicit Requested Host Mapping: Mexico (A), Canada (B), USA (D)
        if (team.id === 'MEX') groupIdx = 0; // Group A
        if (team.id === 'CAN') groupIdx = 1; // Group B
        if (team.id === 'USA') groupIdx = 3; // Group D
      } else {
        groupIdx = findFirstValidGroupIndex(team, groups);
      }

      if (groupIdx === -1) {
        return {
          ...prev,
          isDrawing: false,
          error: `Deadlock: Cannot place ${team.name} anywhere due to continental constraints. Try resetting.`,
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
        const teamInPot = currentPot[prev.currentTeamIndex];
        if (teamInPot.id === teamId) {
          movingTeam = teamInPot;
        }
      }

      if (!movingTeam) return prev;

      // Enforce host locked positions
      if (movingTeam.isHost) {
        if (movingTeam.id === 'MEX' && toGroupId !== 'A') return { ...prev, error: "Mexico must stay in Group A" };
        if (movingTeam.id === 'CAN' && toGroupId !== 'B') return { ...prev, error: "Canada must stay in Group B" };
        if (movingTeam.id === 'USA' && toGroupId !== 'D') return { ...prev, error: "USA must stay in Group D" };
      }

      const tempGroup = { ...targetGroup, teams: targetGroup.teams.filter(t => t.id !== teamId) };
      if (!isValidPlacement(movingTeam, tempGroup)) {
        return { ...prev, error: `Invalid move for ${movingTeam.name}: Confederation rules violated.` };
      }

      let newGroups = prev.groups.map(g => {
        if (g.id === fromGroupId) return { ...g, teams: g.teams.filter(t => t.id !== teamId) };
        if (g.id === toGroupId) {
          if (g.teams.find(t => t.id === teamId)) return g;
          return { ...g, teams: [...g.teams, movingTeam!] };
        }
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
    setState(s => ({ ...s, isDrawing: true }));
    autoDrawInterval.current = setInterval(() => {
      drawNextTeam();
    }, 400);
  };

  const exportCSV = () => {
    const headers = ['Group', 'Slot', 'Team', 'Confederation', 'Rank'];
    const rows = state.groups.flatMap(g => g.teams.map((t, i) => [g.name, i + 1, t.name, t.confederation, t.rank]));
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
    <div className="min-h-screen flex flex-col bg-slate-950">
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
                <span>MEXICO · CANADA · USA</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
            <div className="flex -space-x-2">
              {['🇲🇽', '🇨🇦', '🇺🇸'].map((flag, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-lg">
                  {flag}
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Host Assignments Locked</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-12">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-slate-800 flex-1"></div>
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Official Qualifying Pots</h2>
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
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-sm">Final Group Brackets (48 Teams)</h2>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {state.error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-8 flex items-center justify-center gap-3 text-sm font-semibold animate-in zoom-in-95">
              <span>⚠️</span>
              {state.error}
              <button onClick={() => setState(s => ({ ...s, error: undefined }))} className="ml-4 underline opacity-70 hover:opacity-100 font-bold">DISMISS</button>
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
              FIFA Regulation Mode
            </h4>
            <p className="opacity-80">
              Host seeding: <b>Mexico (A1)</b>, <b>Canada (B1)</b>, and <b>USA (D1)</b>. 
              UEFA distribution (16 teams) ensures 1-2 per group. All moves are validated against continental separation rules.
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
    </div>
  );
};

export default App;
