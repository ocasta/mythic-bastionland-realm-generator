# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mythic Bastionland Realm Generator - an interactive web-based hex grid realm generator for the Mythic Bastionland RPG. Creates 12x12 hex-based fantasy realms with terrain, settlements, landmarks, myths, and barriers.

## Commands

```bash
npm run dev      # Start development server (Vite + React Router)
npm run build    # Build for production
npm run start    # Start production server
```

No testing framework is currently configured.

## Tech Stack

- React 19 with React Router 7 (SSR enabled)
- Vite 6 build tool
- Tailwind CSS 4 with dark mode support
- jspdf for PDF generation
- ES modules throughout

## Architecture

### Component Hierarchy

```
root.jsx (Layout)
└── home.jsx (Route)
    └── RealmGenerator.jsx (Main State Container)
        ├── RealmGenerationControls
        ├── TerrainLegend / TerrainStatistics
        ├── HexPainter (terrain selection sidebar)
        ├── HexMap → HexTile[] (SVG visualization)
        ├── HexDetails (editing panel)
        ├── RealmOverview (table summary)
        └── RealmResources (reference labels list)
```

### Key Directories

- `app/components/tool/` - Interactive UI components (HexMap, HexTile, HexPainter, HexDetails, etc.)
- `app/utils/` - Core logic: hex math, data models, generation algorithms, export
- `app/data/` - JSON lookup tables for landmarks, myths, seers

### Data Model (`app/utils/realmModel.js`)

- `Realm` - 12x12 grid container with all features
- `Hex` - Individual tile with terrain type
- `Holding` - Settlements/seats of power (max 4, min 3 hex distance apart)
- `Landmark` - Named locations (Dwelling, Sanctum, Monument, Hazard, Curse, Ruin)
- `Myth` - Mysterious forces (3+ hexes from holdings)
- `Barrier` - Hex boundary barriers (6 possible sides per hex)

### Hex Grid System (`app/utils/hexUtils.js`)

- Odd-r offset coordinate system (row/col)
- Cube coordinate conversion for distance calculations
- SVG path generation for rendering
- Neighbor detection handles even/odd row adjacency

### Terrain Generation (`app/utils/realmGenerator.js`)

Four algorithms: Random, Balanced, Clustered (BFS growth), Weighted (custom probabilities).

Placement constraints:
- Holdings: 3+ hex distance apart
- Landmarks: 1+ hex from any feature
- Myths: 3+ hex from holdings and other myths

### State Management

State lives in `RealmGenerator.jsx`. Changes create new Realm copies (immutable pattern). Props drilling used throughout.

### PDF Export (`app/utils/pdfExport.js`)

Generates landscape A4 PDFs. GM PDF has hex map on left, resources list on right. Player PDF has centered map without labels. Uses custom SVG-to-canvas conversion to handle terrain pattern images. Opens PDF in new browser window.

### Reference Label Colors

Color-coded labels on hex tiles and in PDF:
- Holdings: Blue (#2563eb) - S for Seat of Power, H1/H2/H3 for others
- Landmarks: Green (#22c55e) - L1, L2, L3, etc.
- Myths: Purple (#9333ea) - M1, M2, M3, etc.
