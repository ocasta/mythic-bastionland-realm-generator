const HoldingEditor = ({ holding, selectedHex, onUpdate, onRemove, onRegenerate }) => {
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
            Name
          </label>
          <input
            type="text"
            value={holding.name}
            onChange={(e) =>
              onUpdate(
                selectedHex.row,
                selectedHex.col,
                holding.isSeatOfPower,
                e.target.value
              )
            }
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Holding name"
          />
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={holding.isSeatOfPower}
            onChange={(e) =>
              onUpdate(
                selectedHex.row,
                selectedHex.col,
                e.target.checked,
                holding.name
              )
            }
            className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          <span className="text-sm text-gray-900 dark:text-white">
            Seat of Power
          </span>
        </label>
      </div>
    </div>
  );
};

export default HoldingEditor;
