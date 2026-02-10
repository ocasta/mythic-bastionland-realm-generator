import { useState, useCallback } from "react";

/**
 * Custom hook for feature drag and drop functionality
 * Handles dragging holdings, landmarks, and myths to new hex positions
 */
export function useFeatureDragDrop({ realm, setRealm }) {
  const [draggingFeature, setDraggingFeature] = useState(null);

  const moveHolding = useCallback((fromRow, fromCol, toRow, toCol) => {
    const newRealm = realm.copy();
    const holding = newRealm.holdings.find(h => h.row === fromRow && h.col === fromCol);
    if (holding) {
      holding.row = toRow;
      holding.col = toCol;
    }
    setRealm(newRealm);
  }, [realm, setRealm]);

  const moveLandmark = useCallback((fromRow, fromCol, toRow, toCol) => {
    const newRealm = realm.copy();
    const landmark = newRealm.landmarks.find(l => l.row === fromRow && l.col === fromCol);
    if (landmark) {
      landmark.row = toRow;
      landmark.col = toCol;
    }
    setRealm(newRealm);
  }, [realm, setRealm]);

  const moveMyth = useCallback((fromRow, fromCol, toRow, toCol) => {
    const newRealm = realm.copy();
    const myth = newRealm.myths.find(m => m.row === fromRow && m.col === fromCol);
    if (myth) {
      myth.row = toRow;
      myth.col = toCol;
    }
    setRealm(newRealm);
  }, [realm, setRealm]);

  const handleFeatureDragStart = useCallback((type, row, col) => {
    setDraggingFeature({ type, row, col });
  }, []);

  const handleFeatureDrop = useCallback((toRow, toCol) => {
    if (!draggingFeature) return;

    // Check target hex doesn't already have a feature
    const hasFeature = realm.getHolding(toRow, toCol) ||
                       realm.getLandmark(toRow, toCol) ||
                       realm.getMyth(toRow, toCol);
    if (hasFeature) {
      setDraggingFeature(null);
      return;
    }

    const { type, row, col } = draggingFeature;
    if (type === 'holding') moveHolding(row, col, toRow, toCol);
    else if (type === 'landmark') moveLandmark(row, col, toRow, toCol);
    else if (type === 'myth') moveMyth(row, col, toRow, toCol);

    setDraggingFeature(null);
  }, [draggingFeature, realm, moveHolding, moveLandmark, moveMyth]);

  const handleFeatureDragEnd = useCallback(() => {
    setDraggingFeature(null);
  }, []);

  return {
    draggingFeature,
    handleFeatureDragStart,
    handleFeatureDrop,
    handleFeatureDragEnd,
  };
}

export default useFeatureDragDrop;
