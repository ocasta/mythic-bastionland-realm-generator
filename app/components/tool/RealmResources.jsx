import { useState } from 'react';

const RealmResources = ({ realm }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const holdings = realm.getHoldings();
  const landmarks = realm.getLandmarks();
  const myths = realm.getMyths();

  const hasContent = holdings.length > 0 || landmarks.length > 0 || myths.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg h-fit">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Realm Resources</h3>
        <span className="text-gray-500 dark:text-gray-400 text-xl">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {!hasContent && (
            <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              No resources to display. Generate a realm or add content to hexes.
            </div>
          )}

          {/* Holdings Section */}
          {holdings.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Holdings</h4>
              <ul className="space-y-1 text-sm">
                {holdings.filter(h => h.isSeatOfPower).map((holding) => (
                  <li key={`seat-${holding.row}-${holding.col}`} className="text-gray-700 dark:text-gray-300">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">S:</span>{' '}
                    Seat of Power
                    {holding.name && holding.name !== 'Unknown' && ` - ${holding.name}`}
                  </li>
                ))}
                {holdings.filter(h => !h.isSeatOfPower).map((holding, index) => (
                  <li key={`holding-${holding.row}-${holding.col}`} className="text-gray-700 dark:text-gray-300">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">H{index + 1}:</span>{' '}
                    Holding
                    {holding.name && holding.name !== 'Unknown' && ` - ${holding.name}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Landmarks Section */}
          {landmarks.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Landmarks</h4>
              <ul className="space-y-1 text-sm">
                {landmarks.map((landmark, index) => (
                  <li key={`landmark-${index}`} className="text-gray-700 dark:text-gray-300">
                    <span className="font-mono font-semibold text-green-600 dark:text-green-400">L{index + 1}:</span>{' '}
                    {landmark.type} - {landmark.name}
                    {landmark.seer && ` (${landmark.seer})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Myths Section */}
          {myths.length > 0 && (
            <div>
              <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Myths</h4>
              <ul className="space-y-1 text-sm">
                {myths.map((myth, index) => (
                  <li key={`myth-${index}`} className="text-gray-700 dark:text-gray-300">
                    <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">M{index + 1}:</span>{' '}
                    {myth.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealmResources;
