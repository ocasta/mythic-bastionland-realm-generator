const SIDE_LABELS = {
  1: 'Left',
  2: 'Top Left',
  3: 'Top Right',
  4: 'Right',
  5: 'Bottom Right',
  6: 'Bottom Left',
};

const BarrierManager = ({ barriers, selectedHex, onAdd, onRemove }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Barriers
      </label>
      <div className="space-y-2">
        {barriers.length > 0 ? (
          <div className="space-y-1">
            {barriers.map((barrier, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-md"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  {SIDE_LABELS[barrier.side]}
                </span>
                <button
                  onClick={() =>
                    onRemove(selectedHex.row, selectedHex.col, barrier.side)
                  }
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No barriers on this hex
          </p>
        )}

        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((side) => {
            const hasBarrier = barriers.some((b) => b.side === side);
            return (
              <button
                key={side}
                onClick={() =>
                  !hasBarrier && onAdd(selectedHex.row, selectedHex.col, side)
                }
                disabled={hasBarrier}
                className={`px-2 py-1 text-xs rounded ${
                  hasBarrier
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                }`}
                title={`${
                  hasBarrier ? 'Barrier already exists on' : 'Add barrier to'
                } ${SIDE_LABELS[side].toLowerCase()} side`}
              >
                + {SIDE_LABELS[side]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BarrierManager;
