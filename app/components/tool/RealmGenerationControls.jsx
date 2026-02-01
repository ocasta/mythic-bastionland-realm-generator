import { useRef, useState } from 'react';

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

const RealmGenerationControls = ({
  rows,
  cols,
  holdings,
  landmarks,
  myths,
  useQuickStartMyths,
  onRowsChange,
  onColsChange,
  onHoldingsChange,
  onLandmarksChange,
  onMythsChange,
  onUseQuickStartMythsChange,
  onGenerateRandom,
  onGenerateBalanced,
  onGenerateClustered,
  onGenerateWeighted,
  onClear,
  onExport,
  onImport,
  onGenerateGMPDF,
  onGeneratePlayerPDF
}) => {
  const fileInputRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExport = () => {
    onExport();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      onImport(file);
    } else if (file) {
      alert('Please select a valid JSON file');
    }
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="generation-controls mb-4">
      <div className="mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
        >
          <span
            className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
          >
            ▶
          </span>
          Generation Settings
        </button>

        {isExpanded && (
          <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Map Width
                </label>
                <NumberStepper
                  value={cols}
                  min={6}
                  max={12}
                  onChange={onColsChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Holdings
                </label>
                <NumberStepper
                  value={holdings}
                  min={1}
                  max={4}
                  onChange={onHoldingsChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Map Height
                </label>
                <NumberStepper
                  value={rows}
                  min={6}
                  max={12}
                  onChange={onRowsChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Landmarks
                </label>
                <NumberStepper
                  value={landmarks}
                  min={2}
                  max={6}
                  onChange={onLandmarksChange}
                />
              </div>
              <div></div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Myths
                </label>
                <NumberStepper
                  value={myths}
                  min={1}
                  max={6}
                  onChange={onMythsChange}
                />
              </div>
              <div className="col-span-2 flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  Use Only Quick Start Myths
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUseQuickStartMythsChange(false)}
                    className={`px-3 py-1 text-sm rounded border ${
                      !useQuickStartMyths
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => onUseQuickStartMythsChange(true)}
                    className={`px-3 py-1 text-sm rounded border ${
                      useQuickStartMyths
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={onGenerateRandom}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate Random
        </button>
        <button
          onClick={onGenerateBalanced}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Generate Balanced
        </button>
        <button
          onClick={onGenerateClustered}
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Generate Clustered
        </button>
        <button
          onClick={onGenerateWeighted}
          className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Generate Weighted
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          title="Export realm as JSON file"
        >
          Export Realm
        </button>
        <button
          onClick={handleImportClick}
          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          title="Import realm from JSON file"
        >
          Import Realm
        </button>
        <button
          onClick={onGenerateGMPDF}
          className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700"
          title="Export PDF with labels and resources list"
        >
          Export GM's PDF
        </button>
        <button
          onClick={onGeneratePlayerPDF}
          className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
          title="Export PDF with map only (no labels)"
        >
          Export Player's PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default RealmGenerationControls;
