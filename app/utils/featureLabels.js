/**
 * Utility functions for generating reference labels for realm features.
 * These labels are used consistently across HexMap, RealmOverview, and PDF export.
 */

/**
 * Get the reference label for a holding (e.g., 'S' for Seat of Power, 'H1', 'H2', etc.)
 * @param {Object} holding - The holding to get a label for
 * @param {Array} allHoldings - All holdings in the realm
 * @returns {string|null} The reference label
 */
export function getHoldingLabel(holding, allHoldings) {
  if (!holding) return null;

  if (holding.isSeatOfPower) {
    return 'S';
  }

  const nonSeatHoldings = allHoldings.filter(h => !h.isSeatOfPower);
  const index = nonSeatHoldings.findIndex(
    h => h.row === holding.row && h.col === holding.col
  );

  return index >= 0 ? `H${index + 1}` : null;
}

/**
 * Get the reference label for a landmark (e.g., 'L1', 'L2', etc.)
 * @param {Object} landmark - The landmark to get a label for
 * @param {Array} allLandmarks - All landmarks in the realm
 * @returns {string|null} The reference label
 */
export function getLandmarkLabel(landmark, allLandmarks) {
  if (!landmark) return null;

  const index = allLandmarks.findIndex(
    l => l.row === landmark.row && l.col === landmark.col
  );

  return index >= 0 ? `L${index + 1}` : null;
}

/**
 * Get the reference label for a myth (e.g., 'M1', 'M2', etc.)
 * @param {Object} myth - The myth to get a label for
 * @param {Array} allMyths - All myths in the realm
 * @returns {string|null} The reference label
 */
export function getMythLabel(myth, allMyths) {
  if (!myth) return null;

  const index = allMyths.findIndex(
    m => m.row === myth.row && m.col === myth.col
  );

  return index >= 0 ? `M${index + 1}` : null;
}

/**
 * Get the reference label for any feature at a given position
 * @param {number} row - The row coordinate
 * @param {number} col - The column coordinate
 * @param {Object} realm - The realm object
 * @returns {string|null} The reference label for the feature at that position
 */
export function getFeatureLabelAtPosition(row, col, realm) {
  const holdings = realm.getHoldings();
  const landmarks = realm.getLandmarks();
  const myths = realm.getMyths();

  const holding = holdings.find(h => h.row === row && h.col === col);
  if (holding) {
    return getHoldingLabel(holding, holdings);
  }

  const landmark = landmarks.find(l => l.row === row && l.col === col);
  if (landmark) {
    return getLandmarkLabel(landmark, landmarks);
  }

  const myth = myths.find(m => m.row === row && m.col === col);
  if (myth) {
    return getMythLabel(myth, myths);
  }

  return null;
}

/**
 * Get all feature labels organized by type
 * @param {Object} realm - The realm object
 * @returns {Object} Object containing labeled holdings, landmarks, and myths
 */
export function getAllFeatureLabels(realm) {
  const holdings = realm.getHoldings();
  const landmarks = realm.getLandmarks();
  const myths = realm.getMyths();

  return {
    holdings: holdings.map(h => ({
      ...h,
      label: getHoldingLabel(h, holdings),
    })),
    landmarks: landmarks.map(l => ({
      ...l,
      label: getLandmarkLabel(l, landmarks),
    })),
    myths: myths.map(m => ({
      ...m,
      label: getMythLabel(m, myths),
    })),
  };
}
