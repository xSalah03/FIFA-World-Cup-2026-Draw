
import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Clock, Check, Star } from 'lucide-react';
import { DrawState, SavedDraw, Team, DrawHistoryEntry } from '../types';
import { MOCK_TEAMS, GROUP_IDS } from '../constants';

interface SavedDrawsManagerProps {
  currentState: DrawState;
  onLoad: (state: DrawState) => void;
}

const STORAGE_KEY = 'wc2026_saved_draws';

/**
 * Generates the specific draw state requested by the user
 */
const getOfficialPresetDraw = (): SavedDraw => {
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
    id: 'official-preset-2026',
    name: 'Official 2026 Preview',
    timestamp: 1718000000000, // Fixed historical date
    state: {
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
      history: [], // For preset, history can be empty as it's a static final state
      isComplete: true,
    },
    isPreset: true
  };
};

export const SavedDrawsManager: React.FC<SavedDrawsManagerProps> = ({ currentState, onLoad }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedDraws, setSavedDraws] = useState<SavedDraw[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let draws: SavedDraw[] = [];
    if (stored) {
      try {
        draws = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to load saved draws", e);
      }
    }

    // Always ensure the preset is at the top if it's not already in storage
    const preset = getOfficialPresetDraw();
    if (!draws.find(d => d.id === preset.id)) {
      draws = [preset, ...draws];
    }
    
    setSavedDraws(draws);
  }, []);

  const saveCurrentDraw = () => {
    const name = saveName.trim() || `Draw ${new Date().toLocaleString()}`;
    const newSave: SavedDraw = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      state: { ...currentState, isDrawing: false, error: undefined }
    };

    const updated = [newSave, ...savedDraws];
    setSavedDraws(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.filter(d => !d.isPreset)));
    setSaveName('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const deleteSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDraws.filter(s => s.id !== id);
    setSavedDraws(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.filter(d => !d.isPreset)));
  };

  const handleLoad = (save: SavedDraw) => {
    onLoad(save.state);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
      >
        <FolderOpen size={16} />
        <span>My Draws</span>
        {savedDraws.length > 0 && (
          <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px]">
            {savedDraws.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 fade-in">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Save Current State</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Name your draw..."
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && saveCurrentDraw()}
                />
                <button
                  onClick={saveCurrentDraw}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md transition-all shadow-sm"
                  title="Save Current Draw"
                >
                  {showSuccess ? <Check size={14} /> : <Save size={14} />}
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              <h4 className="px-4 pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">History</h4>
              {savedDraws.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Clock size={24} className="mx-auto text-slate-300 dark:text-slate-700 mb-2 opacity-50" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No saved states yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {savedDraws.map((save) => (
                    <div
                      key={save.id}
                      onClick={() => handleLoad(save)}
                      className={`group p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between ${save.isPreset ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-2">
                          {save.isPreset && <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                          {save.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {save.isPreset ? 'Recommended Preset' : `${new Date(save.timestamp).toLocaleDateString()} · ${save.state.isComplete ? 'Final' : `Pot ${save.state.currentPotIndex + 1}`}`}
                        </div>
                      </div>
                      {!save.isPreset && (
                        <button
                          onClick={(e) => deleteSave(save.id, e)}
                          className="p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-700 dark:hover:text-red-400 transition-colors"
                          title="Delete Save"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
