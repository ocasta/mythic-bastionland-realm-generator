import { terrainTypes } from './hexUtils';

/**
 * Represents a single hex tile in the realm
 */
export class Hex {
  constructor(row, col, terrainType = terrainTypes[0]) {
    this.row = row;
    this.col = col;
    this.terrainType = terrainType;
    this.coordinates = { row, col };
  }

  /**
   * Get the terrain type of this hex
   */
  getTerrainType() {
    return this.terrainType;
  }

  /**
   * Set the terrain type of this hex
   */
  setTerrainType(terrainType) {
    this.terrainType = terrainType;
  }

  /**
   * Get the display color for this hex
   */
  getColor() {
    return this.terrainType.color;
  }

  /**
   * Get the display name for this hex
   */
  getName() {
    return this.terrainType.name;
  }

  /**
   * Convert hex tile to plain object for serialization
   */
  toJSON() {
    return {
      row: this.row,
      col: this.col,
      terrainType: this.terrainType,
      coordinates: this.coordinates
    };
  }

  static fromJSON(data) {
    return new Hex(data.row, data.col, data.terrainType);
  }
}

export class Holding {
  constructor(row, col, isSeatOfPower = false, name = "Unknown", details = null, ruler = "", rulerDetails = null) {
    this.row = row;
    this.col = col;
    this.isSeatOfPower = isSeatOfPower;
    this.name = name;
    // details is an array of 6 objects: { type: 'None'|'Holding'|'Bailey'|'Keep'|'Food'|etc., name: string }
    // Default: first 3 are Holding, Bailey, Keep; rest are None
    // Note: actual generation happens in realmGenerator.js generateDefaultHoldingDetails()
    this.details = details || [
      { type: 'Holding', name: name },
      { type: 'Bailey', name: '' },
      { type: 'Keep', name: '' },
      { type: 'None', name: '' },
      { type: 'None', name: '' },
      { type: 'None', name: '' }
    ];
    this.ruler = ruler;
    // rulerDetails is an array of 6 objects for ruler attributes
    // Default: first 3 are Appearance, Voice, Personality; rest are None
    // Note: actual generation happens in realmGenerator.js generateDefaultRulerDetails()
    this.rulerDetails = rulerDetails || [
      { type: 'Appearance', name: '' },
      { type: 'Voice', name: '' },
      { type: 'Personality', name: '' },
      { type: 'None', name: '' },
      { type: 'None', name: '' },
      { type: 'None', name: '' }
    ];
  }

  static fromJSON(data) {
    return new Holding(data.row, data.col, data.isSeatOfPower, data.name, data.details, data.ruler, data.rulerDetails);
  }
}

export class Myth {
  constructor(row, col, name) {
    this.row = row;
    this.col = col;
    this.name = name;
  }
}

export class Barrier {
  constructor(row, col, side) {
    this.row = row;
    this.col = col;
    this.side = side; // 1-6, starting top left and going clockwise
  }
}

export class River {
  constructor(id) {
    this.id = id;
    this.path = [];        // Array of {row, col, corner?} - ordered from source to mouth
    this.tributaryOf = null; // ID of river this joins (null if main river)
  }

  addPoint(row, col, corner = null) {
    const point = { row, col };
    if (corner !== null && corner !== undefined) {
      point.corner = corner;
    }
    this.path.push(point);
  }

  removePoint(row, col, corner = null) {
    this.path = this.path.filter(p => {
      const samePos = p.row === row && p.col === col;
      if (!samePos) return true;
      // If corner specified, only remove matching corner points
      if (corner !== null && corner !== undefined) {
        return p.corner !== corner;
      }
      // If no corner specified, only remove center points
      return p.corner !== undefined && p.corner !== null;
    });
  }

  hasPoint(row, col, corner = null) {
    return this.path.some(p => {
      const samePos = p.row === row && p.col === col;
      if (!samePos) return false;
      // If corner specified, match corner points
      if (corner !== null && corner !== undefined) {
        return p.corner === corner;
      }
      // If no corner specified, match center points
      return p.corner === undefined || p.corner === null;
    });
  }

  /**
   * Check if river has any point at this hex (center or any corner)
   */
  hasPointAtHex(row, col) {
    return this.path.some(p => p.row === row && p.col === col);
  }

  static fromJSON(data) {
    const river = new River(data.id);
    river.path = data.path || [];
    river.tributaryOf = data.tributaryOf || null;
    return river;
  }

  toJSON() {
    return {
      id: this.id,
      path: this.path,
      tributaryOf: this.tributaryOf
    };
  }
}

export const landmarkTypes = [
  "Dwelling", "Sanctum", "Monument", "Hazard", "Curse", "Ruin"
];

export class Landmark {
  constructor(row, col, type, name, seer) {
    this.row = row;
    this.col = col;
    this.type = type;
    this.name = name;
    this.seer = seer || null;
  }

  static fromJSON(data) {
    return new Landmark(data.row, data.col, data.type, data.name, data.seer);
  }
}

/**
 * Represents the entire realm with a grid of hex tiles
 */
export class Realm {
  constructor(rows = 12, cols = 12, name = "My Realm") {
    this.rows = rows;
    this.cols = cols;
    this.name = name;
    this.holdings = [];
    this.landmarks = [];
    this.myths = [];
    this.barriers = [];
    this.rivers = [];
    this.nextRiverId = 1;
    this.hexMap = this.initializeHexMap();
    this.metadata = {
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0'
    };
  }

  /**
   * Initialize an empty grid with default terrain
   */
  initializeHexMap() {
    const hexMap = [];
    for (let row = 0; row < this.rows; row++) {
      hexMap[row] = [];
      for (let col = 0; col < this.cols; col++) {
        hexMap[row][col] = new Hex(row, col, terrainTypes[0]); // Default to 'empty'
      }
    }
    return hexMap;
  }

  /**
   * Get a hex tile at specific coordinates
   */
  getHex(row, col) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.hexMap[row][col];
    }
    return null;
  }

  /**
   * Set a hex tile at specific coordinates
   */
  setHex(row, col, terrainType) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.hexMap[row][col].setTerrainType(terrainType);
      this.metadata.lastModified = new Date();
    }
  }

  addHolding(row, col, isSeatOfPower = false, name = "Unknown", details = null, ruler = "", rulerDetails = null) {
    const holding = new Holding(row, col, isSeatOfPower, name, details, ruler, rulerDetails);
    this.holdings.push(holding);
  }

  getHoldings() {
    return this.holdings;
  }

  getHolding(row, col) {
    return this.holdings.find(h => h.row === row && h.col === col);
  }

  addLandmark(row, col, type, name, seer = null) {
    const landmark = new Landmark(row, col, type, name, seer);
    this.landmarks.push(landmark);
  }

  getLandmarks() {
    return this.landmarks;
  }

  getLandmark(row, col) {
    return this.landmarks.find(l => l.row === row && l.col === col);
  }

  addMyth(row, col, name) {
    const myth = new Myth(row, col, name);
    this.myths.push(myth);
  }

  getMyths() {
    return this.myths;
  }

  getMyth(row, col) {
    return this.myths.find(m => m.row === row && m.col === col);
  }

  addBarrier(row, col, side) {
    const barrier = new Barrier(row, col, side);
    this.barriers.push(barrier);
  }

  getBarriers() {
    return this.barriers;
  }

  // River methods
  addRiver(path = [], tributaryOf = null) {
    const river = new River(this.nextRiverId++);
    river.path = path;
    river.tributaryOf = tributaryOf;
    this.rivers.push(river);
    return river;
  }

  removeRiver(id) {
    // Also update any rivers that were tributaries of this one
    this.rivers.forEach(r => {
      if (r.tributaryOf === id) {
        r.tributaryOf = null;
      }
    });
    this.rivers = this.rivers.filter(r => r.id !== id);
  }

  getRivers() {
    return this.rivers;
  }

  getRiver(id) {
    return this.rivers.find(r => r.id === id);
  }

  getRiversAtHex(row, col) {
    return this.rivers.filter(r => r.hasPoint(row, col));
  }

  addPointToRiver(id, row, col, corner = null) {
    const river = this.getRiver(id);
    if (river) {
      river.addPoint(row, col, corner);
    }
  }

  removePointFromRiver(id, row, col, corner = null) {
    const river = this.getRiver(id);
    if (river) {
      river.removePoint(row, col, corner);
    }
  }

  /**
   * Get all hexes of a specific terrain type
   */
  getHexesByTerrain(terrainType) {
    const hexes = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.hexMap[row][col].getTerrainType().type === terrainType) {
          hexes.push(this.hexMap[row][col]);
        }
      }
    }
    return hexes;
  }

  /**
   * Get terrain distribution statistics
   */
  getTerrainStats() {
    const stats = {};
    terrainTypes.forEach(terrain => {
      stats[terrain.type] = 0;
    });

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const terrainType = this.hexMap[row][col].getTerrainType().type;
        stats[terrainType]++;
      }
    }

    return stats;
  }

  /**
   * Export realm to JSON
   */
  export() {
    return {
      rows: this.rows,
      cols: this.cols,
      name: this.name,
      grid: this.hexMap.map(row => row.map(hex => hex.toJSON())),
      holdings: this.holdings,
      landmarks: this.landmarks,
      myths: this.myths,
      barriers: this.barriers,
      rivers: this.rivers.map(r => r.toJSON()),
      nextRiverId: this.nextRiverId,
      metadata: this.metadata
    };
  }

  /**
   * Import realm from JSON
   */
  static import(data) {
    const realm = new Realm(data.rows, data.cols, data.name);
    realm.metadata = data.metadata;

    for (let row = 0; row < data.rows; row++) {
      for (let col = 0; col < data.cols; col++) {
        realm.hexMap[row][col] = Hex.fromJSON(data.hexMap[row][col]);
      }
    }

    // Import holdings, landmarks, and myths if they exist
    if (data.holdings) {
      realm.holdings = data.holdings.map(h => Holding.fromJSON(h));
    }
    if (data.landmarks) {
      realm.landmarks = data.landmarks.map(l => new Landmark(l.row, l.col, l.type, l.name));
    }
    if (data.myths) {
      realm.myths = data.myths.map(m => new Myth(m.row, m.col, m.name));
    }
    if (data.barriers) {
      realm.barriers = data.barriers.map(b => new Barrier(b.row, b.col, b.side));
    }
    if (data.rivers) {
      realm.rivers = data.rivers.map(r => River.fromJSON(r));
      realm.nextRiverId = data.nextRiverId || (realm.rivers.length + 1);
    }

    return realm;
  }

  copy() {
    const newRealm = new Realm(this.rows, this.cols);

    // Deep copy the hexMap array
    newRealm.hexMap = this.hexMap.map(row =>
      row.map(hex => new Hex(hex.row, hex.col, hex.terrainType))
    );

    newRealm.holdings = [...this.holdings];
    newRealm.landmarks = [...this.landmarks];
    newRealm.myths = [...this.myths];
    newRealm.barriers = [...this.barriers];
    newRealm.rivers = this.rivers.map(r => {
      const riverCopy = new River(r.id);
      riverCopy.path = [...r.path];
      riverCopy.tributaryOf = r.tributaryOf;
      return riverCopy;
    });
    newRealm.nextRiverId = this.nextRiverId;
    newRealm.metadata = { ...this.metadata, lastModified: new Date() };
    return newRealm;
  }

  /**
   * Resize the realm, preserving existing content.
   * When adding: if new total is odd, add to top/left; if even, add to bottom/right.
   * When removing: if old total was odd, remove from top/left; if even, remove from bottom/right.
   * Features outside new bounds are removed.
   */
  resize(newRows, newCols) {
    const rowDiff = newRows - this.rows;
    const colDiff = newCols - this.cols;

    // Calculate shift based on whether new/old total is odd or even
    let rowShift = 0; // How much to shift existing content down (positive) or up (negative)
    let colShift = 0; // How much to shift existing content right (positive) or left (negative)

    if (rowDiff > 0) {
      // Adding rows: odd total → top, even total → bottom
      rowShift = newRows % 2 === 1 ? 1 : 0;
    } else if (rowDiff < 0) {
      // Removing rows: odd old total → from top, even old total → from bottom
      rowShift = this.rows % 2 === 1 ? -1 : 0;
    }

    if (colDiff > 0) {
      // Adding columns: odd total → left, even total → right
      colShift = newCols % 2 === 1 ? 1 : 0;
    } else if (colDiff < 0) {
      // Removing columns: odd old total → from left, even old total → from right
      colShift = this.cols % 2 === 1 ? -1 : 0;
    }

    // Create new hex map
    const newHexMap = [];
    for (let row = 0; row < newRows; row++) {
      newHexMap[row] = [];
      for (let col = 0; col < newCols; col++) {
        // Find corresponding position in old map
        const oldRow = row - rowShift;
        const oldCol = col - colShift;

        if (oldRow >= 0 && oldRow < this.rows && oldCol >= 0 && oldCol < this.cols) {
          // Copy terrain from old hex
          const oldHex = this.hexMap[oldRow][oldCol];
          newHexMap[row][col] = new Hex(row, col, oldHex.terrainType);
        } else {
          // New empty hex
          newHexMap[row][col] = new Hex(row, col, terrainTypes[0]);
        }
      }
    }

    // Helper to check if position is within new bounds
    const isInBounds = (row, col) => row >= 0 && row < newRows && col >= 0 && col < newCols;

    // Shift and filter holdings
    this.holdings = this.holdings
      .map(h => {
        h.row += rowShift;
        h.col += colShift;
        return h;
      })
      .filter(h => isInBounds(h.row, h.col));

    // Shift and filter landmarks
    this.landmarks = this.landmarks
      .map(l => {
        l.row += rowShift;
        l.col += colShift;
        return l;
      })
      .filter(l => isInBounds(l.row, l.col));

    // Shift and filter myths
    this.myths = this.myths
      .map(m => {
        m.row += rowShift;
        m.col += colShift;
        return m;
      })
      .filter(m => isInBounds(m.row, m.col));

    // Shift and filter barriers
    this.barriers = this.barriers
      .map(b => {
        b.row += rowShift;
        b.col += colShift;
        return b;
      })
      .filter(b => isInBounds(b.row, b.col));

    // Shift and filter rivers
    this.rivers = this.rivers
      .map(r => {
        r.path = r.path
          .map(p => ({
            ...p,
            row: p.row + rowShift,
            col: p.col + colShift
          }))
          .filter(p => isInBounds(p.row, p.col));
        return r;
      })
      .filter(r => r.path.length >= 2); // Remove rivers with less than 2 points

    // Update realm dimensions and hex map
    this.rows = newRows;
    this.cols = newCols;
    this.hexMap = newHexMap;
    this.metadata.lastModified = new Date();

    return this;
  }
}

export default { Realm, Hex };
