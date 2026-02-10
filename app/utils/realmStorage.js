import { Realm, River } from "./realmModel";
import { terrainTypes } from "./hexUtils";

const STORAGE_KEY = 'mythic-bastionland-realm';

const isBrowser = typeof window !== 'undefined';

/**
 * Serializes a realm to a plain object for storage/export
 * @param {Realm} realm - The realm to serialize
 * @returns {Object} Serialized realm data
 */
export function serializeRealm(realm) {
  const data = {
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
        data.terrain.push({
          row: row,
          col: col,
          type: hex.terrainType.type
        });
      }
    }
  }

  return data;
}

/**
 * Validates realm data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} True if valid
 */
export function validateRealmData(data) {
  if (!data.name || !data.rows || !data.cols || !data.terrain) {
    return false;
  }

  if (!Array.isArray(data.terrain)) {
    return false;
  }

  if (data.holdings && !Array.isArray(data.holdings)) {
    return false;
  }

  if (data.landmarks && !Array.isArray(data.landmarks)) {
    return false;
  }

  if (data.myths && !Array.isArray(data.myths)) {
    return false;
  }

  if (data.barriers && !Array.isArray(data.barriers)) {
    return false;
  }

  if (data.rivers && !Array.isArray(data.rivers)) {
    return false;
  }

  return true;
}

/**
 * Creates a Realm instance from serialized data
 * @param {Object} data - Serialized realm data
 * @returns {Realm} Deserialized realm
 */
export function deserializeRealm(data) {
  const realm = new Realm(data.rows, data.cols);
  realm.name = data.name;

  // Import terrain data
  data.terrain.forEach(terrainHex => {
    const terrainType = terrainTypes.find(t => t.type === terrainHex.type);
    if (terrainType) {
      realm.setHex(terrainHex.row, terrainHex.col, terrainType);
    }
  });

  // Import holdings
  if (data.holdings) {
    realm.holdings = data.holdings.map(holding => {
      const name = holding.name || "Unknown";
      const isSeatOfPower = holding.isSeatOfPower || false;
      const defaultFirstType = isSeatOfPower ? 'Keep' : 'Holding';
      let details = holding.details;
      if (!details) {
        details = [
          { type: defaultFirstType, name: name },
          { type: 'None', name: '' },
          { type: 'None', name: '' },
          { type: 'None', name: '' },
          { type: 'None', name: '' },
          { type: 'None', name: '' }
        ];
      } else if (details.length < 6) {
        while (details.length < 6) {
          details.push({ type: 'None', name: '' });
        }
      }
      const ruler = holding.ruler || '';
      let rulerDetails = holding.rulerDetails;
      if (!rulerDetails) {
        rulerDetails = [
          { type: 'None', name: '' },
          { type: 'None', name: '' },
          { type: 'None', name: '' },
          { type: 'None', name: '' },
          { type: 'None', name: '' },
          { type: 'None', name: '' }
        ];
      } else if (rulerDetails.length < 6) {
        while (rulerDetails.length < 6) {
          rulerDetails.push({ type: 'None', name: '' });
        }
      }
      return {
        row: holding.row,
        col: holding.col,
        isSeatOfPower: isSeatOfPower,
        name: name,
        details: details,
        ruler: ruler,
        rulerDetails: rulerDetails
      };
    });
  }

  // Import landmarks
  if (data.landmarks) {
    realm.landmarks = data.landmarks.map(landmark => ({
      row: landmark.row,
      col: landmark.col,
      type: landmark.type,
      name: landmark.name,
      seer: landmark.seer || null
    }));
  }

  // Import myths
  if (data.myths) {
    realm.myths = data.myths.map(myth => ({
      row: myth.row,
      col: myth.col,
      name: myth.name
    }));
  }

  // Import barriers
  if (data.barriers) {
    realm.barriers = data.barriers.map(barrier => ({
      row: barrier.row,
      col: barrier.col,
      side: barrier.side
    }));
  }

  // Import rivers
  if (data.rivers) {
    realm.rivers = data.rivers.map(river => River.fromJSON(river));
    realm.nextRiverId = data.nextRiverId || (realm.rivers.length + 1);
  }

  return realm;
}

/**
 * Loads realm from localStorage
 * @param {number} defaultRows - Default rows if no stored realm
 * @param {number} defaultCols - Default cols if no stored realm
 * @returns {Realm} Loaded or new realm
 */
export function loadRealmFromStorage(defaultRows, defaultCols) {
  if (!isBrowser) {
    return new Realm(defaultRows, defaultCols);
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (validateRealmData(data)) {
        return deserializeRealm(data);
      }
    }
  } catch (e) {
    console.warn('Failed to load realm from localStorage:', e);
  }
  return new Realm(defaultRows, defaultCols);
}

/**
 * Saves realm to localStorage
 * @param {Realm} realm - Realm to save
 */
export function saveRealmToStorage(realm) {
  if (!isBrowser) return;
  try {
    const data = serializeRealm(realm);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save realm to localStorage:', e);
  }
}

/**
 * Clears realm from localStorage
 */
export function clearRealmStorage() {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear realm from localStorage:', e);
  }
}

export { STORAGE_KEY };
