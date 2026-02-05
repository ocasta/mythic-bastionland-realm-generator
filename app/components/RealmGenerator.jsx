import { useState, useRef, useEffect } from "react";
import { terrainTypes, hexConfig, getTerrainTypesForStyle, hexUtils } from "../utils/hexUtils";
import { Realm } from "../utils/realmModel";
import { RealmGenerator as RealmGeneratorUtil, pickRandomLandmark, pickRandomLandmarkType, pickRandomMyth, pickRandomSeer, generateHoldingName, generateKeepName, generateHoldingDetailName, generateDefaultHoldingDetails, generateRulerDetailName, generateDefaultRulerDetails } from "../utils/realmGenerator";
import { exportRealm, importRealm, validateRealmData, createRealmFromImportData } from "../utils/realmExport";
import { generateGMPDF, generatePlayerPDF } from "../utils/pdfExport";
import RealmGenerationControls from "./tool/RealmGenerationControls";
import TerrainLegend from "./tool/TerrainLegend";
import TerrainStatistics from "./tool/TerrainStatistics";
import HexMap from "./tool/HexMap";
import HexPainter from "./tool/HexPainter";
import HexDetails from "./tool/HexDetails";
import RealmOverview from "./tool/RealmOverview";
import RealmResources from "./tool/RealmResources";

const STORAGE_KEY = 'mythic-bastionland-realm';

const isBrowser = typeof window !== 'undefined';

const loadRealmFromStorage = (defaultRows, defaultCols) => {
  if (!isBrowser) {
    return new Realm(defaultRows, defaultCols);
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (validateRealmData(data)) {
        return createRealmFromImportData(data);
      }
    }
  } catch (e) {
    console.warn('Failed to load realm from localStorage:', e);
  }
  return new Realm(defaultRows, defaultCols);
};

const saveRealmToStorage = (realm) => {
  if (!isBrowser) return;
  try {
    const exportData = {
      name: realm.name,
      rows: realm.rows,
      cols: realm.cols,
      terrain: [],
      holdings: realm.holdings || [],
      landmarks: realm.landmarks || [],
      myths: realm.myths || [],
      barriers: realm.barriers || [],
      rivers: (realm.rivers || []).map(r => r.toJSON ? r.toJSON() : r),
      nextRiverId: realm.nextRiverId || 1
    };

    for (let row = 0; row < realm.rows; row++) {
      for (let col = 0; col < realm.cols; col++) {
        const hex = realm.getHex(row, col);
        if (hex && hex.terrainType) {
          exportData.terrain.push({
            row: row,
            col: col,
            type: hex.terrainType.type
          });
        }
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportData));
  } catch (e) {
    console.warn('Failed to save realm to localStorage:', e);
  }
};

const clearRealmStorage = () => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear realm from localStorage:', e);
  }
};

const RealmGenerator = ({ rows = 12, cols = 12 }) => {
  const hexMapRef = useRef(null);
  const [realm, setRealm] = useState(() => loadRealmFromStorage(rows, cols));
  const [selectedHex, setSelectedHex] = useState(null);
  const [paintingMode, setPaintingMode] = useState(false);
  const [selectedTerrainType, setSelectedTerrainType] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
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
  const [draggingFeature, setDraggingFeature] = useState(null);
  // Shape: { type: 'holding'|'landmark'|'myth', row: number, col: number }
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [riverDrawingMode, setRiverDrawingMode] = useState(false);
  const [currentRiverPath, setCurrentRiverPath] = useState([]);

  const styledTerrainTypes = getTerrainTypesForStyle(terrainStyle);

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
    setPaintingMode(false);
    setSelectedTerrainType(null);
    setIsDragging(false);
    setDragStarted(false);
    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
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

  const handleHoldingsChange = (value) => {
    setHoldingsCount(clampValue(value, 1, 10));
  };

  const handleLandmarksChange = (value) => {
    setLandmarksCount(clampValue(value, 2, 20));
  };

  const handleMythsChange = (value) => {
    setMythsCount(clampValue(value, 1, 10));
  };

  const selectHex = (hex) => {
    // If in painting mode, don't select hex - paint instead
    if (paintingMode) {
      paintHex(hex);
      return;
    }
    
    if(selectedHex && hex === selectedHex) {
      setSelectedHex(null);
    } else {
      setSelectedHex(hex);
    }
  };

  const handleHexMouseDown = (hex) => {
    if (paintingMode) {
      setIsDragging(true);
      setDragStarted(true);
      paintHex(hex);
    } else {
      selectHex(hex);
    }
  };

  const handleHexMouseEnter = (hex) => {
    if (paintingMode && isDragging && dragStarted) {
      paintHex(hex);
    }
  };

  const handleHexMouseUp = () => {
    if (paintingMode) {
      setIsDragging(false);
      setDragStarted(false);
    }
  };

  const startPainting = (terrainType) => {
    setPaintingMode(true);
    setSelectedTerrainType(terrainType);
    setSelectedHex(null); // Deselect any currently selected hex
  };

  const stopPainting = () => {
    setPaintingMode(false);
    setSelectedTerrainType(null);
    setIsDragging(false);
    setDragStarted(false);
  };

  const paintHex = (hex) => {
    if (!paintingMode || !selectedTerrainType) return;
    
    // Don't repaint if it's already the correct terrain type
    if (hex.terrainType.type === selectedTerrainType.type) return;
    
    const newRealm = realm.copy();
    newRealm.setHex(hex.row, hex.col, selectedTerrainType);
    setRealm(newRealm);
  };

  const fillRandomTerrain = () => {
    const newRealm = realm.copy();
    RealmGeneratorUtil.fillRealm(newRealm, "random", {
      holdings: holdingsCount,
      landmarks: landmarksCount,
      myths: mythsCount,
      useQuickStartLists
    });
    setRealm(newRealm);
  };

  const fillBalancedTerrain = () => {
    const newRealm = realm.copy();
    RealmGeneratorUtil.fillRealm(newRealm, "balanced", {
      holdings: holdingsCount,
      landmarks: landmarksCount,
      myths: mythsCount,
      useQuickStartLists
    });
    setRealm(newRealm);
  };

  const fillClusteredTerrain = () => {
    const newRealm = realm.copy();
    RealmGeneratorUtil.fillRealm(newRealm, "clustered", {
      holdings: holdingsCount,
      landmarks: landmarksCount,
      myths: mythsCount,
      useQuickStartLists
    });
    setRealm(newRealm);
  };

  const fillWeightedTerrain = () => {
    const newRealm = realm.copy();
    RealmGeneratorUtil.fillRealm(newRealm, "weighted", {
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

  const getTerrainStats = () => {
    return realm.getTerrainStats();
  };

  const updateSelectedHex = (row, col, newRealm) => {
    const hex = newRealm.getHex(row, col);
    setSelectedHex(hex);
  };

  const editHexTerrain = (row, col, terrainType) => {
    const newRealm = realm.copy();
    newRealm.setHex(row, col, terrainType);
    setRealm(newRealm);
    
    updateSelectedHex(row, col, newRealm);
  };

  const addHolding = (row, col, isSeatOfPower = false, name = null, details = null, ruler = "", rulerDetails = null) => {
    const newRealm = realm.copy();
    const holdingDetails = details ?? generateDefaultHoldingDetails(isSeatOfPower);
    const holdingName = name ?? holdingDetails[0].name;
    const holdingRulerDetails = rulerDetails ?? generateDefaultRulerDetails();
    newRealm.addHolding(row, col, isSeatOfPower, holdingName, holdingDetails, ruler, holdingRulerDetails);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const updateHolding = (row, col, updates) => {
    const newRealm = realm.copy();
    const holdingIndex = newRealm.holdings.findIndex(h => h.row === row && h.col === col);
    if (holdingIndex !== -1) {
      const holding = newRealm.holdings[holdingIndex];

      if ('name' in updates) {
        holding.name = updates.name;
      }

      if ('isSeatOfPower' in updates) {
        holding.isSeatOfPower = updates.isSeatOfPower;
      }

      if ('details' in updates) {
        holding.details = updates.details;
      }

      if ('ruler' in updates) {
        holding.ruler = updates.ruler;
      }

      if ('rulerDetails' in updates) {
        holding.rulerDetails = updates.rulerDetails;
      }
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const regenerateHolding = (row, col, detailIndex = null, section = 'holding') => {
    const newRealm = realm.copy();
    const holdingIndex = newRealm.holdings.findIndex(h => h.row === row && h.col === col);
    if (holdingIndex !== -1) {
      const holding = newRealm.holdings[holdingIndex];
      const isSeatOfPower = holding.isSeatOfPower;

      if (section === 'ruler') {
        // Regenerate ruler detail
        if (detailIndex !== null && holding.rulerDetails && holding.rulerDetails[detailIndex]) {
          const detailType = holding.rulerDetails[detailIndex].type;
          holding.rulerDetails[detailIndex].name = generateRulerDetailName(detailType);
        }
      } else if (detailIndex !== null && holding.details && holding.details[detailIndex]) {
        // Regenerate only the specific holding detail
        const detailType = holding.details[detailIndex].type;
        holding.details[detailIndex].name = generateHoldingDetailName(detailType);
      } else {
        // Regenerate all details (don't change main name or ruler)
        holding.details = generateDefaultHoldingDetails(isSeatOfPower);
        holding.rulerDetails = generateDefaultRulerDetails();
      }
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const removeHolding = (row, col) => {
    const newRealm = realm.copy();
    newRealm.holdings = newRealm.holdings.filter(h => !(h.row === row && h.col === col));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const addLandmark = (row, col) => {
    const newRealm = realm.copy();

    const landmarkType = pickRandomLandmarkType();
    const landmark = pickRandomLandmark(landmarkType);

    newRealm.addLandmark(row, col, landmarkType, landmark);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const updateLandmark = (row, col, type, name, seer = null) => {
    const newRealm = realm.copy();
    const landmarkIndex = newRealm.landmarks.findIndex(l => l.row === row && l.col === col);
    if (landmarkIndex !== -1) {
      newRealm.landmarks[landmarkIndex].type = type;
      newRealm.landmarks[landmarkIndex].name = name;
      newRealm.landmarks[landmarkIndex].seer = seer;
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const removeLandmark = (row, col) => {
    const newRealm = realm.copy();
    newRealm.landmarks = newRealm.landmarks.filter(l => !(l.row === row && l.col === col));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const regenerateLandmark = (row, col) => {
    const newRealm = realm.copy();
    const landmarkIndex = newRealm.landmarks.findIndex(l => l.row === row && l.col === col);
    if (landmarkIndex !== -1) {
      const landmarkType = pickRandomLandmarkType();
      const landmark = pickRandomLandmark(landmarkType);
      const seer = landmarkType === 'Sanctum' ? pickRandomSeer(useQuickStartLists) : null;
      newRealm.landmarks[landmarkIndex].type = landmarkType;
      newRealm.landmarks[landmarkIndex].name = landmark;
      newRealm.landmarks[landmarkIndex].seer = seer;
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const addMyth = (row, col) => {
    const newRealm = realm.copy();
    const myth = pickRandomMyth();
    newRealm.addMyth(row, col, myth);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const updateMyth = (row, col, name) => {
    const newRealm = realm.copy();
    const mythIndex = newRealm.myths.findIndex(m => m.row === row && m.col === col);
    if (mythIndex !== -1) {
      newRealm.myths[mythIndex].name = name;
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const removeMyth = (row, col) => {
    const newRealm = realm.copy();
    newRealm.myths = newRealm.myths.filter(m => !(m.row === row && m.col === col));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const regenerateMyth = (row, col) => {
    const newRealm = realm.copy();
    const mythIndex = newRealm.myths.findIndex(m => m.row === row && m.col === col);
    if (mythIndex !== -1) {
      newRealm.myths[mythIndex].name = pickRandomMyth(useQuickStartLists);
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const addBarrier = (row, col, side) => {
    const newRealm = realm.copy();
    newRealm.addBarrier(row, col, side);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  const removeBarrier = (row, col, side) => {
    const newRealm = realm.copy();
    newRealm.barriers = newRealm.barriers.filter(b => !(b.row === row && b.col === col && b.side === side));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  };

  // River drawing handlers
  const startRiverDrawing = () => {
    setRiverDrawingMode(true);
    setCurrentRiverPath([]);
    setPaintingMode(false);
    setSelectedTerrainType(null);
    setSelectedHex(null);
  };

  const addRiverPoint = (row, col, corner = null) => {
    const newPoint = { row, col };
    if (corner !== null && corner !== undefined) {
      newPoint.corner = corner;
    }

    // If this is not the first point, check adjacency
    if (currentRiverPath.length > 0) {
      const lastPoint = currentRiverPath[currentRiverPath.length - 1];

      // Use the new adjacency check that handles both centers and corners
      const isAdjacent = hexUtils.arePointsAdjacent(lastPoint, newPoint, realm.rows, realm.cols);

      if (!isAdjacent) {
        return; // Ignore non-adjacent clicks
      }

      // Don't allow revisiting the exact same point
      const isDuplicate = currentRiverPath.some(p =>
        p.row === row && p.col === col &&
        ((p.corner === undefined || p.corner === null) && (corner === undefined || corner === null) ||
         p.corner === corner)
      );
      if (isDuplicate) {
        return;
      }
    }

    setCurrentRiverPath(prev => [...prev, newPoint]);
  };

  const finishRiver = () => {
    if (currentRiverPath.length >= 2) {
      const newRealm = realm.copy();

      // Check if this river ends on an existing river (making it a tributary)
      const lastPoint = currentRiverPath[currentRiverPath.length - 1];
      let tributaryOf = null;

      for (const river of newRealm.rivers) {
        // Check for exact point match (center or corner)
        if (river.hasPoint(lastPoint.row, lastPoint.col, lastPoint.corner ?? null)) {
          tributaryOf = river.id;
          break;
        }
        // Also check if ending at any point in the same hex (for tributaries joining at different points)
        if (river.hasPointAtHex(lastPoint.row, lastPoint.col)) {
          tributaryOf = river.id;
          break;
        }
      }

      newRealm.addRiver([...currentRiverPath], tributaryOf);
      setRealm(newRealm);
    }

    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
  };

  const cancelRiver = () => {
    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
  };

  const removeRiver = (id) => {
    const newRealm = realm.copy();
    newRealm.removeRiver(id);
    setRealm(newRealm);
  };

  // Feature drag and drop handlers
  const moveHolding = (fromRow, fromCol, toRow, toCol) => {
    const newRealm = realm.copy();
    const holding = newRealm.holdings.find(h => h.row === fromRow && h.col === fromCol);
    if (holding) {
      holding.row = toRow;
      holding.col = toCol;
    }
    setRealm(newRealm);
  };

  const moveLandmark = (fromRow, fromCol, toRow, toCol) => {
    const newRealm = realm.copy();
    const landmark = newRealm.landmarks.find(l => l.row === fromRow && l.col === fromCol);
    if (landmark) {
      landmark.row = toRow;
      landmark.col = toCol;
    }
    setRealm(newRealm);
  };

  const moveMyth = (fromRow, fromCol, toRow, toCol) => {
    const newRealm = realm.copy();
    const myth = newRealm.myths.find(m => m.row === fromRow && m.col === fromCol);
    if (myth) {
      myth.row = toRow;
      myth.col = toCol;
    }
    setRealm(newRealm);
  };

  const handleFeatureDragStart = (type, row, col) => {
    setDraggingFeature({ type, row, col });
  };

  const handleFeatureDrop = (toRow, toCol) => {
    if (!draggingFeature) return;

    // Check target hex doesn't already have a feature
    const hasFeature = realm.getHolding(toRow, toCol) ||
                       realm.getLandmark(toRow, toCol) ||
                       realm.getMyth(toRow, toCol);
    if (hasFeature) {
      setDraggingFeature(null);
      return; // Can't drop on hex with existing feature
    }

    // Move the feature
    const { type, row, col } = draggingFeature;
    if (type === 'holding') moveHolding(row, col, toRow, toCol);
    else if (type === 'landmark') moveLandmark(row, col, toRow, toCol);
    else if (type === 'myth') moveMyth(row, col, toRow, toCol);

    setDraggingFeature(null);
  };

  const handleFeatureDragEnd = () => {
    setDraggingFeature(null);
  };

  const editRealmName = (newName) => {
    const newRealm = realm.copy();
    newRealm.name = newName;
    setRealm(newRealm);
  };

  const handleExportRealm = () => {
    exportRealm(realm);
  };

  const handleImportRealm = (file) => {
    setImportError(null);
    setImportSuccess(null);

    importRealm(
      file,
      (importedRealm) => {
        setRealm(importedRealm);
        resetInteractionState();
        setImportSuccess(`Realm "${importedRealm.name}" imported successfully!`);

        // Clear success message after 3 seconds
        setTimeout(() => setImportSuccess(null), 3000);
      },
      (error) => {
        setImportError(error);

        // Clear error message after 5 seconds
        setTimeout(() => setImportError(null), 5000);
      }
    );
  };

  const handleGenerateGMPDF = async () => {
    setSelectedHex(null);
    setIsGeneratingPDF(true);
    document.body.style.cursor = 'wait';
    try {
      // Allow state to update before capturing
      await new Promise(resolve => setTimeout(resolve, 0));
      await generateGMPDF({
        mapContainer: hexMapRef.current,
        realm,
        showMapDecorations
      });
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
      // Allow state to update before capturing
      await new Promise(resolve => setTimeout(resolve, 0));
      await generatePlayerPDF({
        mapContainer: hexMapRef.current,
        realm,
        showMapDecorations
      });
    } finally {
      setIsGeneratingPDF(false);
      document.body.style.cursor = '';
    }
  };

  const handleGlobalMouseUp = () => {
    handleHexMouseUp(); // existing terrain painting cleanup
    handleFeatureDragEnd(); // cancel drag if mouse released outside valid target
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

          {/* Import/Export Messages */}
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
            onGenerateRandom={fillRandomTerrain}
            onGenerateBalanced={fillBalancedTerrain}
            onGenerateClustered={fillClusteredTerrain}
            onGenerateWeighted={fillWeightedTerrain}
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
              paintingMode={paintingMode}
              selectedTerrainType={selectedTerrainType}
              onStartPainting={startPainting}
              onStopPainting={stopPainting}
              terrainStyle={terrainStyle}
              onTerrainStyleChange={setTerrainStyle}
              showNames={showNames}
              onShowNamesChange={setShowNames}
              riverDrawingMode={riverDrawingMode}
              currentRiverPath={currentRiverPath}
              onStartRiverDrawing={startRiverDrawing}
              onFinishRiver={finishRiver}
              onCancelRiver={cancelRiver}
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
              paintingMode={paintingMode}
              onHexMouseDown={handleHexMouseDown}
              onHexMouseEnter={handleHexMouseEnter}
              onHexMouseUp={handleHexMouseUp}
              terrainTypes={styledTerrainTypes}
              terrainStyle={terrainStyle}
              showNames={showNames}
              showCoordinates={showCoordinates}
              showFeatureNames={showFeatureNames}
              draggingFeature={draggingFeature}
              onFeatureDragStart={handleFeatureDragStart}
              onFeatureDrop={handleFeatureDrop}
              riverDrawingMode={riverDrawingMode}
              currentRiverPath={currentRiverPath}
              onRiverHexClick={addRiverPoint}
            />
          </div>

          <div className="w-80 flex-shrink-0 text-xs">
            <HexDetails
              realm={realm}
              selectedHex={selectedHex}
              onTerrainChange={editHexTerrain}
              onAddHolding={addHolding}
              onUpdateHolding={updateHolding}
              onRemoveHolding={removeHolding}
              onRegenerateHolding={regenerateHolding}
              onAddLandmark={addLandmark}
              onUpdateLandmark={updateLandmark}
              onRemoveLandmark={removeLandmark}
              onRegenerateLandmark={regenerateLandmark}
              onAddMyth={addMyth}
              onUpdateMyth={updateMyth}
              onRemoveMyth={removeMyth}
              onRegenerateMyth={regenerateMyth}
              onAddBarrier={addBarrier}
              onRemoveBarrier={removeBarrier}
              onRemoveRiver={removeRiver}
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
