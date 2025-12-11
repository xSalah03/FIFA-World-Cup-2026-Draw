# World Cup 2026 Draw Simulator

A high-fidelity, professional-grade simulation tool for the **FIFA World Cup 2026** draw. This application handles the expanded **48-team format**, managing 12 groups (A through L) while strictly enforcing FIFA's complex geographical and seeding constraints.

## 🌟 Key Features

- **Automated Draw Logic**: Real-time calculation of valid group placements based on confederation rules.
- **Interactive Drag & Drop**: Manually adjust the draw or place teams directly. The system validates every move in real-time to prevent illegal group compositions.
- **Host Pre-Assignment**: Automatic placement of the three host nations—**USA (Group A)**, **Mexico (Group B)**, and **Canada (Group C)**—as required by FIFA.
- **Live Visualization**: Smooth animations showing teams moving from their respective pots into group slots.
- **Constraint Management**:
  - **Same-Confederation Limit**: No more than one team from AFC, CAF, CONMEBOL, CONCACAF, or OFC per group.
  - **UEFA Exception**: Up to two European teams allowed per group.
- **Data Export**: Generate a CSV report of the final group stage brackets for external analysis.

## 🛠 Technical Architecture

- **React 19**: Modern component-based architecture for reactive UI updates.
- **Tailwind CSS**: Utility-first styling for a sleek, "dark mode" broadcast-style aesthetic.
- **Lucide React**: High-quality iconography for navigation and status indicators.
- **Custom Draw Service**: Robust logic engine that performs recursive checks for group validity and deadlock prevention.

## 📋 Draw Rules & Logic

1. **Seeding**: 48 teams are divided into 4 Pots of 12 teams based on ranking and host status.
2. **Sequential Filling**: Teams are drawn from Pot 1, then Pot 2, Pot 3, and finally Pot 4.
3. **Validity Check**: For every team drawn, the system scans Groups A-L. A team is placed in the first group where they don't violate confederation limits.
4. **Hosts**: Hosts are always the first teams processed from Pot 1 and are locked into their specific group positions.

## 🚀 How to Use

1. **Start Draw**: Click "Auto-Draw" to watch the simulator perform the entire process automatically.
2. **Step-by-Step**: Click "Next Team" to control the pace and see the logic unfold team by team.
3. **Manual Adjustments**: 
   - Drag the *current* active team from its pot directly into any valid group.
   - Drag teams *between* groups to customize the brackets (validity checks still apply).
4. **Reset**: Use the "Reset Draw" button to reshuffle pots and start fresh.
5. **Export**: Once complete, download the full configuration via the "Export CSV" button.

---
*Created by a Senior Frontend Engineer for World Cup enthusiasts and data analysts.*
