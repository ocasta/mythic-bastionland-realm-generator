import TerrainSelector from './editors/TerrainSelector';
import HoldingEditor from './editors/HoldingEditor';
import LandmarkEditor from './editors/LandmarkEditor';
import MythEditor from './editors/MythEditor';
import BarrierManager from './editors/BarrierManager';

const HexDetails = ({
  realm,
  selectedHex,
  onTerrainChange,
  onAddHolding,
  onUpdateHolding,
  onRemoveHolding,
  onRegenerateHolding,
  onAddLandmark,
  onUpdateLandmark,
  onRemoveLandmark,
  onRegenerateLandmark,
  onAddMyth,
  onUpdateMyth,
  onRemoveMyth,
  onRegenerateMyth,
  onAddBarrier,
  onRemoveBarrier,
  onRemoveRiver,
  terrainTypes,
}) => {
  // Get feature for the selected hex
  const getHexFeature = () => {
    if (!selectedHex || !realm) return null;

    const holding = realm
      .getHoldings()
      .find((h) => h.row === selectedHex.row && h.col === selectedHex.col);
    if (holding) return { type: 'holding', data: holding };

    const landmark = realm
      .getLandmarks()
      .find((l) => l.row === selectedHex.row && l.col === selectedHex.col);
    if (landmark) return { type: 'landmark', data: landmark };

    const myth = realm
      .getMyths()
      .find((m) => m.row === selectedHex.row && m.col === selectedHex.col);
    if (myth) return { type: 'myth', data: myth };

    return null;
  };

  const getHexBarriers = () => {
    if (!selectedHex || !realm) return [];
    return realm
      .getBarriers()
      .filter((b) => b.row === selectedHex.row && b.col === selectedHex.col);
  };

  const getHexRivers = () => {
    if (!selectedHex || !realm) return [];
    return realm.getRiversAtHex(selectedHex.row, selectedHex.col);
  };

  const hexFeature = getHexFeature();
  const hexBarriers = getHexBarriers();
  const hexRivers = getHexRivers();

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Hex Details
      </h3>
      {selectedHex ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Coordinates
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Row: {selectedHex.row}, Col: {selectedHex.col}
            </p>
          </div>

          <TerrainSelector
            selectedHex={selectedHex}
            terrainTypes={terrainTypes}
            onTerrainChange={onTerrainChange}
          />

          {/* Feature Section */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Feature
            </label>
            {hexFeature ? (
              <div className="space-y-2">
                {hexFeature.type === 'holding' && (
                  <HoldingEditor
                    holding={hexFeature.data}
                    selectedHex={selectedHex}
                    onUpdate={onUpdateHolding}
                    onRemove={onRemoveHolding}
                    onRegenerate={onRegenerateHolding}
                  />
                )}

                {hexFeature.type === 'landmark' && (
                  <LandmarkEditor
                    landmark={hexFeature.data}
                    selectedHex={selectedHex}
                    onUpdate={onUpdateLandmark}
                    onRemove={onRemoveLandmark}
                    onRegenerate={onRegenerateLandmark}
                  />
                )}

                {hexFeature.type === 'myth' && (
                  <MythEditor
                    myth={hexFeature.data}
                    selectedHex={selectedHex}
                    onUpdate={onUpdateMyth}
                    onRemove={onRemoveMyth}
                    onRegenerate={onRegenerateMyth}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No feature on this hex
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      onAddHolding(selectedHex.row, selectedHex.col)
                    }
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    + Holding
                  </button>
                  <button
                    onClick={() =>
                      onAddLandmark(selectedHex.row, selectedHex.col)
                    }
                    className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    + Landmark
                  </button>
                  <button
                    onClick={() => onAddMyth(selectedHex.row, selectedHex.col)}
                    className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    + Myth
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Barriers Section */}
          <BarrierManager
            barriers={hexBarriers}
            selectedHex={selectedHex}
            onAdd={onAddBarrier}
            onRemove={onRemoveBarrier}
          />

          {/* Rivers Section */}
          {hexRivers.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rivers
              </label>
              <div className="space-y-2">
                {hexRivers.map((river) => (
                  <div
                    key={river.id}
                    className="flex items-center justify-between p-2 bg-cyan-50 dark:bg-cyan-900 rounded"
                  >
                    <span className="text-xs text-cyan-700 dark:text-cyan-300">
                      River {river.id}
                      {river.tributaryOf && ` (tributary of River ${river.tributaryOf})`}
                    </span>
                    <button
                      onClick={() => onRemoveRiver && onRemoveRiver(river.id)}
                      className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          Select a hex on the map to view its details
        </p>
      )}
    </div>
  );
};

export default HexDetails;
