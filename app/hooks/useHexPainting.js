import { useState, useCallback } from "react";

/**
 * Custom hook for hex painting functionality
 * Handles terrain painting mode state and drag-to-paint behavior
 */
export function useHexPainting({ realm, setRealm, setSelectedHex }) {
  const [paintingMode, setPaintingMode] = useState(false);
  const [selectedTerrainType, setSelectedTerrainType] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);

  const startPainting = useCallback((terrainType) => {
    setPaintingMode(true);
    setSelectedTerrainType(terrainType);
    setSelectedHex(null);
  }, [setSelectedHex]);

  const stopPainting = useCallback(() => {
    setPaintingMode(false);
    setSelectedTerrainType(null);
    setIsDragging(false);
    setDragStarted(false);
  }, []);

  const paintHex = useCallback((hex) => {
    if (!paintingMode || !selectedTerrainType) return;
    if (hex.terrainType.type === selectedTerrainType.type) return;

    const newRealm = realm.copy();
    newRealm.setHex(hex.row, hex.col, selectedTerrainType);
    setRealm(newRealm);
  }, [paintingMode, selectedTerrainType, realm, setRealm]);

  const handleHexMouseDown = useCallback((hex) => {
    if (paintingMode) {
      setIsDragging(true);
      setDragStarted(true);
      paintHex(hex);
    }
  }, [paintingMode, paintHex]);

  const handleHexMouseEnter = useCallback((hex) => {
    if (paintingMode && isDragging && dragStarted) {
      paintHex(hex);
    }
  }, [paintingMode, isDragging, dragStarted, paintHex]);

  const handleHexMouseUp = useCallback(() => {
    if (paintingMode) {
      setIsDragging(false);
      setDragStarted(false);
    }
  }, [paintingMode]);

  const resetPaintingState = useCallback(() => {
    setPaintingMode(false);
    setSelectedTerrainType(null);
    setIsDragging(false);
    setDragStarted(false);
  }, []);

  return {
    paintingMode,
    selectedTerrainType,
    isDragging,
    startPainting,
    stopPainting,
    paintHex,
    handleHexMouseDown,
    handleHexMouseEnter,
    handleHexMouseUp,
    resetPaintingState,
  };
}

export default useHexPainting;
