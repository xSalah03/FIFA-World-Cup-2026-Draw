# World Cup 2026 Draw Simulator

A high-fidelity, professional-grade simulation tool for the **FIFA World Cup 2026** draw. This application handles the expanded **48-team format**, managing 12 groups (A through L) while strictly enforcing FIFA's complex geographical and seeding constraints.

## 🌟 Key Features

- **Automated Draw Logic**: Real-time calculation of valid group placements based on confederation rules.
- **Interactive Drag & Drop**: Manually adjust the draw or place teams directly.
  - **Dynamic Feedback**: Valid drop targets pulse with an emerald glow, while invalid targets show specific rule-violation overlays (e.g., "Max 2 UEFA Teams").
- **Draw Persistence**: Save your current draw state at any point and reload it later via the "My Draws" manager (powered by LocalStorage).
- **Interruptible Simulation**: Start an "Auto-Draw" and use the "Undo Previous Move" button at any time to halt the process and revert to a previous state for manual intervention.
- **Host Pre-Assignment**: Automatic placement of the three host nations—**Mexico (Group A)**, **Canada (Group B)**, and **USA (Group D)**—as required by FIFA protocol.
- **Constraint Management**:
  - **Same-Confederation Limit**: No more than one team from AFC, CAF, CONMEBOL, CONCACAF, or OFC per group.
  - **UEFA Exception**: Up to two European teams allowed per group.
- **Data Export**: Generate a comprehensive CSV report of the final group stage brackets.

## 🛠 Technical Architecture

- **React 19**: Modern component-based architecture for reactive UI updates and optimized state management.
- **Tailwind CSS**: Utility-first styling for a sleek, broadcast-style aesthetic with native Dark Mode support.
- **Lucide React**: High-quality iconography for intuitive navigation and status indicators.
- **Safety Solver Service**: A recursive backtracking engine that performs look-ahead checks to prevent "deadlocks" (where a draw becomes impossible to finish legally).

## 📋 Draw Rules & Logic

1. **Seeding**: 48 teams are divided into 4 Pots of 12 teams based on ranking and host status.
2. **Sequential Filling**: Teams are drawn from Pot 1, then Pot 2, Pot 3, and finally Pot 4.
3. **Validity Check**: For every team drawn, the system scans Groups A-L. A team is placed in the first group where they don't violate confederation limits.
4. **Hosts**: Hosts are always the first teams processed from Pot 1 and are locked into their specific group positions (Mexico A, Canada B, USA D).

## 🚀 How to Use

1. **Start Draw**: Click "Auto-Draw" to watch the simulator perform the entire process automatically.
2. **Manual Intervention**: Use "Previous Move" during an Auto-Draw to stop the simulation and adjust a placement.
3. **Manage States**:
   - Use the **My Draws** button to name and save your current configuration.
   - Delete or load past draws from the history list to compare different simulation outcomes.
4. **Interactive Adjustments**: 
   - Drag the *current* active team from its pot directly into any emerald-highlighted group.
   - Hover over groups to see why they might be invalid for the current team.
5. **Reset**: Use the "Reset Draw" button to reshuffle pots and start a fresh session.
6. **Export**: Once complete, download the full configuration via the "Export CSV" button.

---
*Created by a Senior Frontend Engineer for World Cup enthusiasts and tournament data analysts.*