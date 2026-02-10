import { useState } from 'react';
import TerrainSwatch from '../TerrainSwatch';

const TerrainSelector = ({ selectedHex, terrainTypes, onTerrainChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleTerrainChange = (terrainType) => {
    if (selectedHex && terrainType) {
      onTerrainChange(selectedHex.row, selectedHex.col, terrainType);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        Terrain Type
      </label>

      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          <TerrainSwatch terrain={selectedHex.terrainType} size="md" className="rounded" />
          <span>{selectedHex.terrainType.name}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {terrainTypes.map((terrain) => (
            <button
              key={terrain.type}
              onClick={() => handleTerrainChange(terrain)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 focus:outline-none flex items-center space-x-2 text-gray-900 dark:text-white"
            >
              <TerrainSwatch terrain={terrain} size="md" className="rounded" />
              <span>{terrain.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TerrainSelector;
