import { holdingDetailTypes, generateHoldingDetailName } from '../../../utils/realmGenerator';

const HoldingEditor = ({ holding, selectedHex, onUpdate, onRemove, onRegenerate }) => {
  // Ensure we have valid details array with 6 items
  const defaultFirstType = holding.isSeatOfPower ? 'Keep' : 'Holding';
  const details = holding.details && holding.details.length === 6
    ? holding.details
    : [
        { type: defaultFirstType, name: holding.name || '' },
        { type: 'None', name: '' },
        { type: 'None', name: '' },
        { type: 'None', name: '' },
        { type: 'None', name: '' },
        { type: 'None', name: '' }
      ];

  const handleDetailTypeChange = (index, newType) => {
    const newDetails = details.map((d, i) => {
      if (i === index) {
        // Generate a new name for the selected type, clear if None
        const newName = generateHoldingDetailName(newType);
        return { ...d, type: newType, name: newName };
      }
      return d;
    });
    onUpdate(selectedHex.row, selectedHex.col, { details: newDetails });
  };

  const handleDetailNameChange = (index, newName) => {
    const newDetails = details.map((d, i) => {
      if (i === index) {
        return { ...d, name: newName };
      }
      return d;
    });
    onUpdate(selectedHex.row, selectedHex.col, { details: newDetails });
  };

  const handleRegenerateDetail = (index) => {
    onRegenerate(selectedHex.row, selectedHex.col, index);
  };

  const handleSeatOfPowerChange = (isSeatOfPower) => {
    onUpdate(selectedHex.row, selectedHex.col, { isSeatOfPower });
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-900 dark:text-white">
          Holding
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => onRegenerate(selectedHex.row, selectedHex.col)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
          >
            Regenerate All
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
            Name
          </label>
          <input
            type="text"
            value={holding.name}
            onChange={(e) => onUpdate(selectedHex.row, selectedHex.col, { name: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Holding name"
          />
        </div>

        <label className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            checked={holding.isSeatOfPower}
            onChange={(e) => handleSeatOfPowerChange(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          <span className="text-sm text-gray-900 dark:text-white">
            Seat of Power
          </span>
        </label>

        {details.map((detail, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={detail.type}
              onChange={(e) => handleDetailTypeChange(index, e.target.value)}
              className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {holdingDetailTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={detail.name}
              onChange={(e) => handleDetailNameChange(index, e.target.value)}
              disabled={detail.type === 'None'}
              className={`flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${detail.type === 'None' ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={detail.type === 'None' ? '' : `${detail.type} name`}
            />
            <button
              onClick={() => handleRegenerateDetail(index)}
              disabled={detail.type === 'None'}
              className={`text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs whitespace-nowrap ${detail.type === 'None' ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={detail.type === 'None' ? '' : `Regenerate ${detail.type}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoldingEditor;
