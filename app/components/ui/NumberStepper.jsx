const NumberStepper = ({ value, min, max, onChange }) => (
  <div className="flex items-center">
    <button
      onClick={() => onChange(value - 1)}
      disabled={value <= min}
      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-l border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      -
    </button>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-12 px-1 py-1 text-center border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <button
      onClick={() => onChange(value + 1)}
      disabled={value >= max}
      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-r border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      +
    </button>
  </div>
);

export default NumberStepper;
