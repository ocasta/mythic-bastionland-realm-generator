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
        │   └── NumberStepper (ui/)
        ├── TerrainLegend / TerrainStatistics
        │   └── TerrainSwatch
        ├── HexPainter (terrain selection sidebar)
        │   └── TerrainSwatch
        ├── HexMap (SVG visualization)
        │   ├── TerrainPatterns (svg/)
        │   ├── HexTile[]
        │   │   └── FeatureMarker
        │   └── FeatureNameLabels (svg/)
        ├── HexDetails (editing panel)
        │   ├── TerrainSelector (editors/)
        │   ├── HoldingEditor (editors/)
        │   ├── LandmarkEditor (editors/)
        │   ├── MythEditor (editors/)
        │   └── BarrierManager (editors/)
        ├── RealmOverview (table summary)
        └── RealmResources (reference labels list)
```

### Key Directories

- `app/components/tool/` - Interactive UI components (HexMap, HexTile, HexPainter, HexDetails, etc.)
- `app/components/tool/editors/` - Feature editing subcomponents (TerrainSelector, HoldingEditor, etc.)
- `app/components/tool/svg/` - SVG-specific components (TerrainPatterns, FeatureNameLabels)
- `app/components/ui/` - Reusable UI primitives (NumberStepper)
- `app/utils/` - Core logic: hex math, data models, generation algorithms, export
- `app/data/` - JSON lookup tables for landmarks, myths, seers

### Reusable Components

- `TerrainSwatch` - Displays terrain color/image with configurable size (sm/md/lg)
- `FeatureMarker` - SVG circle+text for holdings, landmarks, myths on hex tiles
- `NumberStepper` - Increment/decrement input for numeric values

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
- `forEachHex(rows, cols, callback)` - Grid iteration utility

### Feature Labels (`app/utils/featureLabels.js`)

Utility functions for generating reference labels consistently across components:
- `getHoldingLabel(holding, allHoldings)` - Returns 'S' or 'H1', 'H2', etc.
- `getLandmarkLabel(landmark, allLandmarks)` - Returns 'L1', 'L2', etc.
- `getMythLabel(myth, allMyths)` - Returns 'M1', 'M2', etc.
- `getFeatureLabelAtPosition(row, col, realm)` - Get label for any feature at position

### Terrain Generation (`app/utils/realmGenerator.js`)

Four algorithms: Random, Balanced, Clustered (BFS growth), Weighted (custom probabilities).

Uses `createRandomPicker(pool)` factory to avoid duplicate selections until pool is exhausted.

Placement constraints:
- Holdings: 3+ hex distance apart
- Landmarks: 1+ hex from any feature
- Myths: 3+ hex from holdings and other myths

### State Management

State lives in `RealmGenerator.jsx`. Changes create new Realm copies (immutable pattern). Props drilling used throughout.

### PDF Export (`app/utils/pdfExport.js`)

Generates landscape A4 PDFs. GM PDF has hex map on left, resources list on right. Player PDF has centered map without labels.

Key functions:
- `cloneSVGForExport()` - Prepares SVG for rendering, optionally hiding labels
- `inlineImages()` - Converts image URLs to data URLs for export
- `renderSVGToCanvas()` - Renders prepared SVG to canvas
- `addFeatureSection()` - Reusable PDF section renderer for holdings/landmarks/myths

Styling constants in `PDF_STYLES` object for consistent formatting.

### Reference Label Colors

Color-coded labels on hex tiles and in PDF:
- Holdings: Blue (#2563eb) - S for Seat of Power, H1/H2/H3 for others
- Landmarks: Green (#22c55e) - L1, L2, L3, etc.
- Myths: Purple (#9333ea) - M1, M2, M3, etc.
