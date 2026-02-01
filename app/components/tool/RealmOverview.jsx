import { useState } from 'react';

const RealmOverview = ({ realm }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const holdings = realm.getHoldings();
  const landmarks = realm.getLandmarks();
  const myths = realm.getMyths();

  // Helper to get reference label for a hex
  const getRef = (row, col) => {
    const holding = holdings.find(h => h.row === row && h.col === col);
    if (holding) {
      if (holding.isSeatOfPower) return 'S';
      const nonSeatHoldings = holdings.filter(h => !h.isSeatOfPower);
      const holdingIndex = nonSeatHoldings.findIndex(h => h.row === row && h.col === col);
      if (holdingIndex >= 0) return `H${holdingIndex + 1}`;
    }

    const landmarkIndex = landmarks.findIndex(l => l.row === row && l.col === col);
    if (landmarkIndex >= 0) return `L${landmarkIndex + 1}`;

    const mythIndex = myths.findIndex(m => m.row === row && m.col === col);
    if (mythIndex >= 0) return `M${mythIndex + 1}`;

    return null;
  };

  // Create a grid to display all hexes with their contents
  const createHexGrid = () => {
    const hexGrid = [];
    for (let row = 0; row < realm.rows; row++) {
      for (let col = 0; col < realm.cols; col++) {
        const hex = realm.getHex(row, col);
        const holding = holdings.find(h => h.row === row && h.col === col);
        const landmark = landmarks.find(l => l.row === row && l.col === col);
        const myth = myths.find(m => m.row === row && m.col === col);

        // Only include hexes that have content (not empty terrain or have holdings/landmarks/myths)
        if (hex.terrainType.type !== 'empty' || holding || landmark || myth) {
          hexGrid.push({
            row,
            col,
            terrain: hex.terrainType,
            holding,
            landmark,
            myth,
            ref: getRef(row, col)
          });
        }
      }
    }
    return hexGrid;
  };

  const hexGrid = createHexGrid();

  // Group hexes into chunks of the current column count
  const groupedHexes = [];
  for (let i = 0; i < hexGrid.length; i += realm.cols) {
    groupedHexes.push(hexGrid.slice(i, i + realm.cols));
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg h-fit">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Realm Overview</h3>
        <span className="text-gray-500 dark:text-gray-400 text-xl">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {groupedHexes.map((group, groupIndex) => (
            <div key={groupIndex} className="border-b border-gray-200 dark:border-gray-700 pb-2">
              {/* Top row: reference label or coordinates and terrain */}
              <div
                className="grid gap-1 text-sm"
                style={{ gridTemplateColumns: `repeat(${realm.cols}, minmax(0, 1fr))` }}
              >
                {group.map((hex, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {hex.ref || `${hex.row},${hex.col}`}
                    </span>
                    <span className="text-xs text-gray-900 dark:text-white">{hex.terrain.name}</span>
                  </div>
                ))}
              </div>

              {/* Bottom row: holdings, landmarks, myths */}
              <div
                className="grid gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1"
                style={{ gridTemplateColumns: `repeat(${realm.cols}, minmax(0, 1fr))` }}
              >
                {group.map((hex, index) => (
                  <div key={index} className="space-y-1">
                    {hex.holding && (
                      <div className="text-blue-600 dark:text-blue-400 font-semibold">
                        <div>{hex.holding.isSeatOfPower ? 'Seat of Power' : 'Holding'}</div>
                        {hex.holding.name && hex.holding.name !== "Unknown" && (
                          <div className="text-blue-500 dark:text-blue-300 font-normal">{hex.holding.name}</div>
                        )}
                      </div>
                    )}
                    {hex.landmark && (
                      <div className="text-green-600 dark:text-green-400">
                        {hex.landmark.type}: {hex.landmark.name} {hex.landmark.seer ? `(${hex.landmark.seer})` : ''}
                      </div>
                    )}
                    {hex.myth && (
                      <div className="text-purple-600 dark:text-purple-400">
                        Myth: {hex.myth.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {hexGrid.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
              No content to display. Generate a realm or add content to hexes.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealmOverview;
