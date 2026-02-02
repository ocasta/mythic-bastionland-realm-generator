# 🏰 Mythic Bastionland Realm Maker

<div align="center">
  
  [![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-yellow.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
  [![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
  [![React Router](https://img.shields.io/badge/React%20Router-7.5.3-red.svg)](https://reactrouter.com/)
  [![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF.svg)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.4-38B2AC.svg)](https://tailwindcss.com/)

  **An interactive web tool for Mythic Bastionland Referees to quickly generate and customize hex-based realms for their campaigns**
  
  [🚀 Demo](#demo) • [📖 Documentation](#documentation) • [🤝 Contributing](#contributing) • [� License](#license)

</div>

---

## ✨ Features

### 🗺️ **Interactive Hex Map Generator**
- Generate hex-based realms with customisable grid size (default 12x12)
- Multiple generation algorithms: Random, Balanced, Clustered, and Weighted
- Real-time terrain painting with intuitive brush tools
- Interactive hex selection and editing

### 🏛️ **Rich Realm Content**
- **Holdings**: Add settlements and seats of power to your realm
- **Landmarks**: Place dwellings, sanctums, monuments, hazards, curses, and ruins
- **Myths**: Incorporate the mysterious forces that shape your world
- Real-time statistics and terrain distribution analysis

### 🎨 **User-Friendly Interface**
- Clean, modern interface built with React and Tailwind CSS
- Responsive design that works on desktop and tablet
- Color-coded terrain types with visual legend
- Multiple terrain styles: Watercolour, Comic, or plain colours
- Drag and drop holdings, landmarks, and myths between hexes
- Toggle feature name labels on the map

### 📄 **PDF Export**
- Generate GM PDF with hex map and feature reference list (landscape A4)
- Generate Player PDF with clean map for handouts (no labels or spoilers)
- High-quality SVG-to-canvas rendering with terrain textures

### 🔧 **Developer Features**
- Modern React 19 with React Router 7
- Modular component architecture
- Comprehensive utilities for hex grid mathematics
- Docker support for easy deployment

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mmacphail/mythic-bastioland-realm-generator.git
   cd mythic-bastioland-realm-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to start creating realms!

### 🐳 Docker Deployment

```bash
# Build the image
docker build -t mythic-realm-maker .

# Run the container
docker run -p 3000:3000 mythic-realm-maker
```

---

## 📖 How to Use

### 🎲 **Generating Your First Realm**

1. **Choose a generation method:**
   - **Random**: Completely random terrain distribution
   - **Balanced**: Ensures each terrain type appears at least once
   - **Clustered**: Creates natural-looking terrain clusters
   - **Weighted**: Uses realistic terrain probability weights

2. **Customize with the Hex Painter:**
   - Select a terrain type from the painter panel
   - Click and drag across hexes to paint terrain
   - Use the detailed hex editor for precise adjustments

3. **Add Realm Features:**
   - Click any hex to open the detailed editor
   - Add **Holdings** for settlements and power centers
   - Place **Landmarks** to add character and challenges
   - Incorporate **Myths** to weave mystery into your world
   - Drag and drop features to reposition them on the map

4. **Export Your Realm:**
   - Generate a **GM PDF** with the full map and feature reference list
   - Generate a **Player PDF** with a clean map for handouts
   - Toggle **Show Names** to display or hide feature labels on the map

### 🗺️ **Terrain Types**
- **Plains** - Open grasslands and farmable land
- **Forest** - Dense woodlands and hunting grounds
- **Mountains** - Rocky peaks and mineral resources
- **Water** - Rivers, lakes, and coastal areas
- **Desert** - Arid wastelands and hidden oases
- **Swamp** - Mysterious wetlands and dangerous bogs
- **City** - Urban centers and trade hubs

---

## 🏗️ Project Structure

```
mythic-bastioland-realm-maker/
├── app/
│   ├── components/
│   │   ├── RealmGenerator.jsx        # Main application component
│   │   ├── ui/                       # Reusable UI primitives
│   │   │   └── NumberStepper.jsx     # Increment/decrement input
│   │   └── tool/                     # Feature-specific components
│   │       ├── HexMap.jsx            # Interactive hex grid
│   │       ├── HexTile.jsx           # Individual hex rendering
│   │       ├── HexDetails.jsx        # Hex editing interface
│   │       ├── HexPainter.jsx        # Terrain painting tool
│   │       ├── TerrainSwatch.jsx     # Terrain color/image display
│   │       ├── FeatureMarker.jsx     # SVG marker for features
│   │       ├── editors/              # Feature editing subcomponents
│   │       │   ├── TerrainSelector.jsx
│   │       │   ├── HoldingEditor.jsx
│   │       │   ├── LandmarkEditor.jsx
│   │       │   ├── MythEditor.jsx
│   │       │   └── BarrierManager.jsx
│   │       └── svg/                  # SVG-specific components
│   │           ├── TerrainPatterns.jsx
│   │           └── FeatureNameLabels.jsx
│   ├── utils/
│   │   ├── realmModel.js             # Core data models
│   │   ├── realmGenerator.js         # Generation algorithms
│   │   ├── hexUtils.js               # Hex grid mathematics
│   │   ├── featureLabels.js          # Reference label utilities
│   │   └── pdfExport.js              # PDF generation
│   ├── data/                         # JSON lookup tables
│   └── routes/
├── public/
└── Docker configuration
```

---

## 🛠️ Development

### 📋 **Available Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### 🧪 **Adding New Features**

The codebase is designed for easy extension:

- **New Terrain Types**: Add to `terrainTypes` in `hexUtils.js`
- **Generation Algorithms**: Extend `TerrainGenerator` class in `realmGenerator.js`
- **UI Components**: Add to `app/components/tool/` (or `editors/` for feature editors, `svg/` for SVG components)
- **Reusable Primitives**: Add to `app/components/ui/`
- **Data Models**: Extend classes in `realmModel.js`
- **Reference Labels**: Use utilities from `featureLabels.js` for consistent labeling

---

## 🤝 Contributing

We welcome contributions from the Mythic Bastionland community! Here's how you can help:

### 🎯 **Ways to Contribute**

- 🐛 **Bug Reports**: Found an issue? [Open an issue](https://github.com/mmacphail/mythic-bastioland-realm-generator/issues)
- 💡 **Feature Requests**: Have an idea? [Start a discussion](https://github.com/mmacphail/mythic-bastioland-realm-generator/discussions)
- 🔧 **Code Contributions**: Submit pull requests for improvements
- 📚 **Documentation**: Help improve guides and examples
- 🎨 **UI/UX**: Suggest interface improvements

### 📝 **Contribution Guidelines**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 🏷️ **Good First Issues**
Look for issues labeled `good first issue` - these are perfect for newcomers!

---

## 🎲 About Mythic Bastionland

This tool is designed for [Mythic Bastionland](https://www.bastionland.com/), the fantasy RPG by Chris McDowall. Mythic Bastionland emphasizes exploration, mystery, and the power of myths to shape the world.

*This is an unofficial fan project and is not affiliated with or endorsed by Bastionland Press.*

---

## � Acknowledgments

- **Chris McDowall** for creating the incredible Mythic Bastionland RPG
- **The Bastionland Community** for inspiration and feedback
- **React Router Team** for the excellent v7 framework
- **Tailwind CSS** for making beautiful UIs accessible

---

## 👤 Author

**mmacphail (Eskald)**
- GitHub: [@mmacphail](https://github.com/mmacphail)
- Feel free to reach out with questions or suggestions!

---

## 📝 License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

**You are free to:**
- Share — copy and redistribute the material
- Adapt — remix, transform, and build upon the material

**Under the following terms:**
- Attribution — Give appropriate credit
- NonCommercial — Not for commercial use

---

<div align="center">

**⭐ Star this repository if it helped your Mythic Bastionland campaign! ⭐**

*Made with ❤️ for the Mythic Bastionland community*

</div>