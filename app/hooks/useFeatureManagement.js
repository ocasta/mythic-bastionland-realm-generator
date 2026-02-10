import { useCallback } from "react";
import {
  pickRandomLandmark,
  pickRandomLandmarkType,
  pickRandomMyth,
  pickRandomSeer,
  generateHoldingDetailName,
  generateRulerDetailName,
  generateDefaultHoldingDetails,
  generateDefaultRulerDetails,
} from "../utils/realmGenerator";

/**
 * Custom hook for managing realm features (holdings, landmarks, myths, barriers)
 * Extracts CRUD operations from RealmGenerator
 */
export function useFeatureManagement({ realm, setRealm, setSelectedHex, useQuickStartLists }) {
  const updateSelectedHex = useCallback((row, col, newRealm) => {
    const hex = newRealm.getHex(row, col);
    setSelectedHex(hex);
  }, [setSelectedHex]);

  // Holdings
  const addHolding = useCallback((row, col, isSeatOfPower = false, name = null, details = null, ruler = "", rulerDetails = null) => {
    const newRealm = realm.copy();
    const holdingDetails = details ?? generateDefaultHoldingDetails(isSeatOfPower);
    const holdingName = name ?? holdingDetails[0].name;
    const holdingRulerDetails = rulerDetails ?? generateDefaultRulerDetails();
    newRealm.addHolding(row, col, isSeatOfPower, holdingName, holdingDetails, ruler, holdingRulerDetails);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const updateHolding = useCallback((row, col, updates) => {
    const newRealm = realm.copy();
    const holdingIndex = newRealm.holdings.findIndex(h => h.row === row && h.col === col);
    if (holdingIndex !== -1) {
      const holding = newRealm.holdings[holdingIndex];

      if ('name' in updates) holding.name = updates.name;
      if ('isSeatOfPower' in updates) holding.isSeatOfPower = updates.isSeatOfPower;
      if ('details' in updates) holding.details = updates.details;
      if ('ruler' in updates) holding.ruler = updates.ruler;
      if ('rulerDetails' in updates) holding.rulerDetails = updates.rulerDetails;
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const removeHolding = useCallback((row, col) => {
    const newRealm = realm.copy();
    newRealm.holdings = newRealm.holdings.filter(h => !(h.row === row && h.col === col));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const regenerateHolding = useCallback((row, col, detailIndex = null, section = 'holding') => {
    const newRealm = realm.copy();
    const holdingIndex = newRealm.holdings.findIndex(h => h.row === row && h.col === col);
    if (holdingIndex !== -1) {
      const holding = newRealm.holdings[holdingIndex];
      const isSeatOfPower = holding.isSeatOfPower;

      if (section === 'ruler') {
        if (detailIndex !== null && holding.rulerDetails && holding.rulerDetails[detailIndex]) {
          const detailType = holding.rulerDetails[detailIndex].type;
          holding.rulerDetails[detailIndex].name = generateRulerDetailName(detailType);
        }
      } else if (detailIndex !== null && holding.details && holding.details[detailIndex]) {
        const detailType = holding.details[detailIndex].type;
        holding.details[detailIndex].name = generateHoldingDetailName(detailType);
      } else {
        holding.details = generateDefaultHoldingDetails(isSeatOfPower);
        holding.rulerDetails = generateDefaultRulerDetails();
      }
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  // Landmarks
  const addLandmark = useCallback((row, col) => {
    const newRealm = realm.copy();
    const landmarkType = pickRandomLandmarkType();
    const landmark = pickRandomLandmark(landmarkType);
    newRealm.addLandmark(row, col, landmarkType, landmark);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const updateLandmark = useCallback((row, col, type, name, seer = null) => {
    const newRealm = realm.copy();
    const landmarkIndex = newRealm.landmarks.findIndex(l => l.row === row && l.col === col);
    if (landmarkIndex !== -1) {
      newRealm.landmarks[landmarkIndex].type = type;
      newRealm.landmarks[landmarkIndex].name = name;
      newRealm.landmarks[landmarkIndex].seer = seer;
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const removeLandmark = useCallback((row, col) => {
    const newRealm = realm.copy();
    newRealm.landmarks = newRealm.landmarks.filter(l => !(l.row === row && l.col === col));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const regenerateLandmark = useCallback((row, col) => {
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
  }, [realm, setRealm, updateSelectedHex, useQuickStartLists]);

  // Myths
  const addMyth = useCallback((row, col) => {
    const newRealm = realm.copy();
    const myth = pickRandomMyth();
    newRealm.addMyth(row, col, myth);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const updateMyth = useCallback((row, col, name) => {
    const newRealm = realm.copy();
    const mythIndex = newRealm.myths.findIndex(m => m.row === row && m.col === col);
    if (mythIndex !== -1) {
      newRealm.myths[mythIndex].name = name;
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const removeMyth = useCallback((row, col) => {
    const newRealm = realm.copy();
    newRealm.myths = newRealm.myths.filter(m => !(m.row === row && m.col === col));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const regenerateMyth = useCallback((row, col) => {
    const newRealm = realm.copy();
    const mythIndex = newRealm.myths.findIndex(m => m.row === row && m.col === col);
    if (mythIndex !== -1) {
      newRealm.myths[mythIndex].name = pickRandomMyth(useQuickStartLists);
    }
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex, useQuickStartLists]);

  // Barriers
  const addBarrier = useCallback((row, col, side) => {
    const newRealm = realm.copy();
    newRealm.addBarrier(row, col, side);
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  const removeBarrier = useCallback((row, col, side) => {
    const newRealm = realm.copy();
    newRealm.barriers = newRealm.barriers.filter(b => !(b.row === row && b.col === col && b.side === side));
    setRealm(newRealm);
    updateSelectedHex(row, col, newRealm);
  }, [realm, setRealm, updateSelectedHex]);

  return {
    // Holdings
    addHolding,
    updateHolding,
    removeHolding,
    regenerateHolding,
    // Landmarks
    addLandmark,
    updateLandmark,
    removeLandmark,
    regenerateLandmark,
    // Myths
    addMyth,
    updateMyth,
    removeMyth,
    regenerateMyth,
    // Barriers
    addBarrier,
    removeBarrier,
  };
}

export default useFeatureManagement;
