import TerrainSwatch from './TerrainSwatch';

const HexPainter = ({ terrainTypes, paintingMode, selectedTerrainType, onStartPainting, onStopPainting, terrainStyle, onTerrainStyleChange, showNames, onShowNamesChange, riverDrawingMode, currentRiverPath, onStartRiverDrawing, onFinishRiver, onCancelRiver }) => {
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
              <TerrainSwatch terrain={terrain} size="md" />
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

      {/* River Drawing Section */}
      <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
        <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">Rivers</label>

        {!riverDrawingMode ? (
          <button
            onClick={onStartRiverDrawing}
            disabled={paintingMode}
            className={`w-full px-3 py-2 rounded border transition-colors ${
              paintingMode
                ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Draw River
            </span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-900 rounded text-sm text-cyan-700 dark:text-cyan-300">
              <p className="font-medium">River Drawing Mode</p>
              <p>Click hexes to trace the river path</p>
              <p className="text-xs mt-1 opacity-75">
                {currentRiverPath.length === 0
                  ? 'Click to set river source'
                  : `${currentRiverPath.length} point${currentRiverPath.length === 1 ? '' : 's'} - click adjacent hexes to continue`}
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={onFinishRiver}
                disabled={currentRiverPath.length < 2}
                className={`flex-1 px-3 py-2 rounded border transition-colors ${
                  currentRiverPath.length < 2
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800'
                }`}
              >
                Finish River
              </button>
              <button
                onClick={onCancelRiver}
                className="flex-1 px-3 py-2 rounded border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

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
