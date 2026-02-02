const HexPainter = ({ terrainTypes, paintingMode, selectedTerrainType, onStartPainting, onStopPainting, terrainStyle, onTerrainStyleChange, showNames, onShowNamesChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 h-fit">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Hex Painter</h3>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-900 dark:text-white">Terrain Style</label>
        <select
          value={terrainStyle}
          onChange={(e) => onTerrainStyleChange(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="none">No AI images</option>
          <option value="comic">Comic</option>
          <option value="watercolour">Watercolour</option>
        </select>
      </div>

      <div className="space-y-2">
        {terrainTypes.map((terrain) => (
          <button
            key={terrain.type}
            onClick={() => onStartPainting(terrain)}
            className={`w-full text-left px-3 py-2 rounded border transition-colors text-gray-900 dark:text-white ${
              paintingMode && selectedTerrainType?.type === terrain.type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            style={{
              borderLeftColor: terrain.color,
              borderLeftWidth: '4px'
            }}
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="w-4 h-4 border border-gray-300 dark:border-gray-600"
                style={{
                  backgroundColor: terrain.color,
                  backgroundImage: terrain.image ? `url(${terrain.image})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              ></span>
              {terrain.name}
            </span>
          </button>
        ))}
        
        {paintingMode && (
          <button
            onClick={onStopPainting}
            className="w-full px-3 py-2 rounded border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 transition-colors mt-4"
          >
            Stop Painting
          </button>
        )}
      </div>
      
      {paintingMode && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">Paint Mode Active</p>
          <p>Click and drag on hexes to paint with {selectedTerrainType?.name}</p>
          <p className="text-xs mt-1 opacity-75">Tip: Hold mouse button and drag across multiple hexes</p>
        </div>
      )}

      <div className="mt-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Show Names</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={showNames}
              onChange={(e) => onShowNamesChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors"></div>
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default HexPainter;
