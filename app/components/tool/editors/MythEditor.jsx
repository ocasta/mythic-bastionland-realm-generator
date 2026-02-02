const MythEditor = ({ myth, selectedHex, onUpdate, onRemove, onRegenerate }) => {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-900 dark:text-white">
          Myth
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
      <div>
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Name
        </label>
        <input
          type="text"
          value={myth.name}
          onChange={(e) =>
            onUpdate(selectedHex.row, selectedHex.col, e.target.value)
          }
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Myth name"
        />
      </div>
    </div>
  );
};

export default MythEditor;
