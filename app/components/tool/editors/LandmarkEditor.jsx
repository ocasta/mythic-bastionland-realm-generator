import { landmarkTypes } from '../../../utils/realmModel';
import { pickRandomLandmark, pickRandomSeer } from '../../../utils/realmGenerator';

const LandmarkEditor = ({ landmark, selectedHex, onUpdate, onRemove, onRegenerate }) => {
  const handleTypeChange = (newType) => {
    const newName = pickRandomLandmark(newType);
    const newSeer = newType === 'Sanctum' ? pickRandomSeer() : null;
    onUpdate(selectedHex.row, selectedHex.col, newType, newName, newSeer);
  };
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-xs text-gray-900 dark:text-white">
          Landmark
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onRegenerate(selectedHex.row, selectedHex.col)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
          >
            Regenerate
          </button>
          <button
            onClick={() => onRemove(selectedHex.row, selectedHex.col)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Type
          </label>
          <select
            value={landmark.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {landmarkTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Name
          </label>
          <input
            type="text"
            value={landmark.name}
            onChange={(e) =>
              onUpdate(
                selectedHex.row,
                selectedHex.col,
                landmark.type,
                e.target.value
              )
            }
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Landmark name"
          />
        </div>
        {landmark.seer && (
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Seer
            </label>
            <input
              type="text"
              value={landmark.seer}
              onChange={(e) =>
                onUpdate(
                  selectedHex.row,
                  selectedHex.col,
                  landmark.type,
                  landmark.name,
                  e.target.value
                )
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Landmark seer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LandmarkEditor;
