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
  constructor(row, col, isSeatOfPower = false, name = "Unknown", details = null) {
    this.row = row;
    this.col = col;
    this.isSeatOfPower = isSeatOfPower;
    this.name = name;
    // details is an array of 6 objects: { type: 'None'|'Holding'|'Bailey'|'Keep'|'Food'|etc., name: string }
    // Default: first row is Keep (seat of power) or Holding (regular), rest are None
    const defaultFirstType = isSeatOfPower ? 'Keep' : 'Holding';
    this.details = details || [
      { type: defaultFirstType, name: name },
      { type: 'None', name: '' },
      { type: 'None', name: '' },
      { type: 'None', name: '' },
      { type: 'None', name: '' },
      { type: 'None', name: '' }
    ];
  }

  static fromJSON(data) {
    return new Holding(data.row, data.col, data.isSeatOfPower, data.name, data.details);
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

  addHolding(row, col, isSeatOfPower = false, name = "Unknown", details = null) {
    const holding = new Holding(row, col, isSeatOfPower, name, details);
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
}

export default { Realm, Hex };
