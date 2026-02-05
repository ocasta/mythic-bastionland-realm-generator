import { useState, useRef, useEffect } from "react";
import { hexConfig, getTerrainTypesForStyle } from "../utils/hexUtils";
import { Realm } from "../utils/realmModel";
import { RealmGenerator as RealmGeneratorUtil } from "../utils/realmGenerator";
import { exportRealm, importRealm } from "../utils/realmExport";
import { generateGMPDF, generatePlayerPDF } from "../utils/pdfExport";
import { loadRealmFromStorage, saveRealmToStorage, clearRealmStorage } from "../utils/realmStorage";
import { useHexPainting } from "../hooks/useHexPainting";
import { useFeatureManagement } from "../hooks/useFeatureManagement";
import { useFeatureDragDrop } from "../hooks/useFeatureDragDrop";
import { useRiverDrawing } from "../hooks/useRiverDrawing";
import RealmGenerationControls from "./tool/RealmGenerationControls";
import TerrainLegend from "./tool/TerrainLegend";
import TerrainStatistics from "./tool/TerrainStatistics";
import HexMap from "./tool/HexMap";
import HexPainter from "./tool/HexPainter";
import HexDetails from "./tool/HexDetails";
import RealmOverview from "./tool/RealmOverview";
import RealmResources from "./tool/RealmResources";

const RealmGenerator = ({ rows = 12, cols = 12 }) => {
  const hexMapRef = useRef(null);
  const [realm, setRealm] = useState(() => loadRealmFromStorage(rows, cols));
  const [selectedHex, setSelectedHex] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [holdingsCount, setHoldingsCount] = useState(4);
  const [landmarksCount, setLandmarksCount] = useState(4);
  const [mythsCount, setMythsCount] = useState(6);
  const [useQuickStartLists, setUseQuickStartLists] = useState(false);
  const [terrainStyle, setTerrainStyle] = useState("watercolour");
  const [showNames, setShowNames] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [showMapDecorations, setShowMapDecorations] = useState(true);
  const [showFeatureNames, setShowFeatureNames] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const styledTerrainTypes = getTerrainTypesForStyle(terrainStyle);

  // Custom hooks for state management
  const hexPainting = useHexPainting({ realm, setRealm, setSelectedHex });
  const featureManagement = useFeatureManagement({ realm, setRealm, setSelectedHex, useQuickStartLists });
  const featureDragDrop = useFeatureDragDrop({ realm, setRealm });
  const riverDrawing = useRiverDrawing({
    realm,
    setRealm,
    setPaintingMode: hexPainting.resetPaintingState,
    setSelectedTerrainType: () => {},
    setSelectedHex
  });

  // Save realm to localStorage whenever it changes
  useEffect(() => {
    saveRealmToStorage(realm);
  }, [realm]);

  const hexSize = hexConfig.defaultSize;
  const { width: svgWidth, height: svgHeight } = hexConfig.getSvgDimensions(
    realm.rows,
    realm.cols,
    hexSize
  );

  const resetInteractionState = () => {
    setSelectedHex(null);
    hexPainting.resetPaintingState();
    riverDrawing.resetRiverState();
  };

  const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));

  const handleRowsChange = (value) => {
    const nextRows = clampValue(value, 6, 18);
    if (nextRows === realm.rows) return;
    const newRealm = realm.copy();
    newRealm.resize(nextRows, realm.cols);
    setRealm(newRealm);
    resetInteractionState();
  };

  const handleColsChange = (value) => {
    const nextCols = clampValue(value, 6, 18);
    if (nextCols === realm.cols) return;
    const newRealm = realm.copy();
    newRealm.resize(realm.rows, nextCols);
    setRealm(newRealm);
    resetInteractionState();
  };

  const handleHoldingsChange = (value) => setHoldingsCount(clampValue(value, 1, 10));
  const handleLandmarksChange = (value) => setLandmarksCount(clampValue(value, 2, 20));
  const handleMythsChange = (value) => setMythsCount(clampValue(value, 1, 10));

  const selectHex = (hex) => {
    if (hexPainting.paintingMode) {
      hexPainting.paintHex(hex);
      return;
    }
    setSelectedHex(selectedHex && hex === selectedHex ? null : hex);
  };

  const handleHexMouseDown = (hex) => {
    if (hexPainting.paintingMode) {
      hexPainting.handleHexMouseDown(hex);
    } else {
      selectHex(hex);
    }
  };

  // Consolidated fill terrain function
  const fillTerrain = (strategy) => {
    const newRealm = realm.copy();
    RealmGeneratorUtil.fillRealm(newRealm, strategy, {
      holdings: holdingsCount,
      landmarks: landmarksCount,
      myths: mythsCount,
      useQuickStartLists
    });
    setRealm(newRealm);
  };

  const clearTerrain = () => {
    clearRealmStorage();
    const newRealm = new Realm(rows, cols);
    setRealm(newRealm);
    setHoldingsCount(4);
    setLandmarksCount(4);
    setMythsCount(6);
    setUseQuickStartLists(false);
  };

  const getTerrainStats = () => realm.getTerrainStats();

  const editHexTerrain = (row, col, terrainType) => {
    const newRealm = realm.copy();
    newRealm.setHex(row, col, terrainType);
    setRealm(newRealm);
    setSelectedHex(newRealm.getHex(row, col));
  };

  const editRealmName = (newName) => {
    const newRealm = realm.copy();
    newRealm.name = newName;
    setRealm(newRealm);
  };

  const handleExportRealm = () => exportRealm(realm);

  const handleImportRealm = (file) => {
    setImportError(null);
    setImportSuccess(null);

    importRealm(
      file,
      (importedRealm) => {
        setRealm(importedRealm);
        resetInteractionState();
        setImportSuccess(`Realm "${importedRealm.name}" imported successfully!`);
        setTimeout(() => setImportSuccess(null), 3000);
      },
      (error) => {
        setImportError(error);
        setTimeout(() => setImportError(null), 5000);
      }
    );
  };

  const handleGenerateGMPDF = async () => {
    setSelectedHex(null);
    setIsGeneratingPDF(true);
    document.body.style.cursor = 'wait';
    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      await generateGMPDF({ mapContainer: hexMapRef.current, realm, showMapDecorations });
    } finally {
      setIsGeneratingPDF(false);
      document.body.style.cursor = '';
    }
  };

  const handleGeneratePlayerPDF = async () => {
    setSelectedHex(null);
    setIsGeneratingPDF(true);
    document.body.style.cursor = 'wait';
    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      await generatePlayerPDF({ mapContainer: hexMapRef.current, realm, showMapDecorations });
    } finally {
      setIsGeneratingPDF(false);
      document.body.style.cursor = '';
    }
  };

  const handleGlobalMouseUp = () => {
    hexPainting.handleHexMouseUp();
    featureDragDrop.handleFeatureDragEnd();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" onMouseUp={handleGlobalMouseUp}>
      <div className="flex-1 hex-grid-container">
        <div className="controls mb-4">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Mythic Bastionland Realm Maker
          </h2>
          <div className="flex items-center gap-2 mb-2">
            <label className="font-semibold text-gray-900 dark:text-white">Realm Name:</label>
            <input
              type="text"
              value={realm.name}
              onChange={(e) => editRealmName(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 p-1 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {importError && (
            <div className="mb-2 p-2 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="mb-2 p-2 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded">
              {importSuccess}
            </div>
          )}

          <RealmGenerationControls
            rows={realm.rows}
            cols={realm.cols}
            holdings={holdingsCount}
            landmarks={landmarksCount}
            myths={mythsCount}
            useQuickStartLists={useQuickStartLists}
            showCoordinates={showCoordinates}
            showMapDecorations={showMapDecorations}
            showFeatureNames={showFeatureNames}
            onRowsChange={handleRowsChange}
            onColsChange={handleColsChange}
            onHoldingsChange={handleHoldingsChange}
            onLandmarksChange={handleLandmarksChange}
            onMythsChange={handleMythsChange}
            onUseQuickStartListsChange={setUseQuickStartLists}
            onShowCoordinatesChange={setShowCoordinates}
            onShowMapDecorationsChange={setShowMapDecorations}
            onShowFeatureNamesChange={setShowFeatureNames}
            onGenerateRandom={() => fillTerrain("random")}
            onGenerateBalanced={() => fillTerrain("balanced")}
            onGenerateClustered={() => fillTerrain("clustered")}
            onGenerateWeighted={() => fillTerrain("weighted")}
            onClear={clearTerrain}
            onExport={handleExportRealm}
            onImport={handleImportRealm}
            onGenerateGMPDF={handleGenerateGMPDF}
            onGeneratePlayerPDF={handleGeneratePlayerPDF}
            isGeneratingPDF={isGeneratingPDF}
          />

          <div className="legend flex flex-wrap gap-2 mb-4">
            <TerrainLegend terrainTypes={styledTerrainTypes} />
            <TerrainStatistics
              terrainStats={getTerrainStats()}
              terrainTypes={styledTerrainTypes}
            />
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-64 flex-shrink-0">
            <HexPainter
              terrainTypes={styledTerrainTypes}
              paintingMode={hexPainting.paintingMode}
              selectedTerrainType={hexPainting.selectedTerrainType}
              onStartPainting={hexPainting.startPainting}
              onStopPainting={hexPainting.stopPainting}
              terrainStyle={terrainStyle}
              onTerrainStyleChange={setTerrainStyle}
              showNames={showNames}
              onShowNamesChange={setShowNames}
              riverDrawingMode={riverDrawing.riverDrawingMode}
              currentRiverPath={riverDrawing.currentRiverPath}
              onStartRiverDrawing={riverDrawing.startRiverDrawing}
              onFinishRiver={riverDrawing.finishRiver}
              onCancelRiver={riverDrawing.cancelRiver}
            />
          </div>

          <div ref={hexMapRef} className="flex-1">
            <HexMap
              realm={realm}
              svgWidth={svgWidth}
              svgHeight={svgHeight}
              hexSize={hexSize}
              selectHex={selectHex}
              selectedHex={selectedHex}
              paintingMode={hexPainting.paintingMode}
              onHexMouseDown={handleHexMouseDown}
              onHexMouseEnter={hexPainting.handleHexMouseEnter}
              onHexMouseUp={hexPainting.handleHexMouseUp}
              terrainTypes={styledTerrainTypes}
              terrainStyle={terrainStyle}
              showNames={showNames}
              showCoordinates={showCoordinates}
              showFeatureNames={showFeatureNames}
              draggingFeature={featureDragDrop.draggingFeature}
              onFeatureDragStart={featureDragDrop.handleFeatureDragStart}
              onFeatureDrop={featureDragDrop.handleFeatureDrop}
              riverDrawingMode={riverDrawing.riverDrawingMode}
              currentRiverPath={riverDrawing.currentRiverPath}
              onRiverHexClick={riverDrawing.addRiverPoint}
            />
          </div>

          <div className="w-80 flex-shrink-0 text-xs">
            <HexDetails
              realm={realm}
              selectedHex={selectedHex}
              onTerrainChange={editHexTerrain}
              onAddHolding={featureManagement.addHolding}
              onUpdateHolding={featureManagement.updateHolding}
              onRemoveHolding={featureManagement.removeHolding}
              onRegenerateHolding={featureManagement.regenerateHolding}
              onAddLandmark={featureManagement.addLandmark}
              onUpdateLandmark={featureManagement.updateLandmark}
              onRemoveLandmark={featureManagement.removeLandmark}
              onRegenerateLandmark={featureManagement.regenerateLandmark}
              onAddMyth={featureManagement.addMyth}
              onUpdateMyth={featureManagement.updateMyth}
              onRemoveMyth={featureManagement.removeMyth}
              onRegenerateMyth={featureManagement.regenerateMyth}
              onAddBarrier={featureManagement.addBarrier}
              onRemoveBarrier={featureManagement.removeBarrier}
              onRemoveRiver={riverDrawing.removeRiver}
              terrainTypes={styledTerrainTypes}
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <RealmOverview realm={realm} />
          <RealmResources realm={realm} />
        </div>
      </div>
    </div>
  );
};

export default RealmGenerator;
