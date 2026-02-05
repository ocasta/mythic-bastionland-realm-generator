import { useState, useCallback } from "react";
import { hexUtils } from "../utils/hexUtils";

/**
 * Custom hook for river drawing functionality
 * Handles river path creation and tributary detection
 */
export function useRiverDrawing({ realm, setRealm, setPaintingMode, setSelectedTerrainType, setSelectedHex }) {
  const [riverDrawingMode, setRiverDrawingMode] = useState(false);
  const [currentRiverPath, setCurrentRiverPath] = useState([]);

  const startRiverDrawing = useCallback(() => {
    setRiverDrawingMode(true);
    setCurrentRiverPath([]);
    setPaintingMode(false);
    setSelectedTerrainType(null);
    setSelectedHex(null);
  }, [setPaintingMode, setSelectedTerrainType, setSelectedHex]);

  const addRiverPoint = useCallback((row, col, corner = null) => {
    const newPoint = { row, col };
    if (corner !== null && corner !== undefined) {
      newPoint.corner = corner;
    }

    setCurrentRiverPath(prev => {
      // If this is not the first point, check adjacency
      if (prev.length > 0) {
        const lastPoint = prev[prev.length - 1];
        const isAdjacent = hexUtils.arePointsAdjacent(lastPoint, newPoint, realm.rows, realm.cols);

        if (!isAdjacent) {
          return prev; // Ignore non-adjacent clicks
        }

        // Don't allow revisiting the exact same point
        const isDuplicate = prev.some(p =>
          p.row === row && p.col === col &&
          ((p.corner === undefined || p.corner === null) && (corner === undefined || corner === null) ||
           p.corner === corner)
        );
        if (isDuplicate) {
          return prev;
        }
      }

      return [...prev, newPoint];
    });
  }, [realm.rows, realm.cols]);

  const finishRiver = useCallback(() => {
    if (currentRiverPath.length >= 2) {
      const newRealm = realm.copy();

      // Check if this river ends on an existing river (making it a tributary)
      const lastPoint = currentRiverPath[currentRiverPath.length - 1];
      let tributaryOf = null;

      for (const river of newRealm.rivers) {
        if (river.hasPoint(lastPoint.row, lastPoint.col, lastPoint.corner ?? null)) {
          tributaryOf = river.id;
          break;
        }
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
  }, [currentRiverPath, realm, setRealm]);

  const cancelRiver = useCallback(() => {
    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
  }, []);

  const removeRiver = useCallback((id) => {
    const newRealm = realm.copy();
    newRealm.removeRiver(id);
    setRealm(newRealm);
  }, [realm, setRealm]);

  const resetRiverState = useCallback(() => {
    setRiverDrawingMode(false);
    setCurrentRiverPath([]);
  }, []);

  return {
    riverDrawingMode,
    currentRiverPath,
    startRiverDrawing,
    addRiverPoint,
    finishRiver,
    cancelRiver,
    removeRiver,
    resetRiverState,
  };
}

export default useRiverDrawing;
