// Utility functions for hex grid operations

export const terrainTypes = [
  { type: "empty", color: "#f0f0f0", name: "Empty" },
  { type: "plains", color: "#90EE90", name: "Plains", image: "plains.png" },
  { type: "forest", color: "#228B22", name: "Forest", image: "forest.png" },
  { type: "mountain", color: "#8B4513", name: "Mountain", image: "mountains.png" },
  { type: "water", color: "#4682B4", name: "Water", image: "water.png" },
  { type: "desert", color: "#F4A460", name: "Desert", image: "desert.png" },
  { type: "swamp", color: "#556B2F", name: "Swamp", image: "swamp.png" },
  { type: "city", color: "#696969", name: "City", image: "city.png" },
];

// Helper to get terrain types with resolved image paths for a given style
export const getTerrainTypesForStyle = (style) => {
  if (style === 'none') {
    return terrainTypes.map(terrain => ({
      ...terrain,
      image: null
    }));
  }
  return terrainTypes.map(terrain => ({
    ...terrain,
    image: terrain.image ? `/terrain/${style}/${terrain.image}` : null
  }));
};

// Distance tolerances for river point calculations
const POINT_DISTANCE_TOLERANCE = 1.5;  // Max distance multiplier for point detection
const ADJACENCY_TOLERANCE = 1.1;       // Tolerance multiplier for adjacency checks
const EDGE_LENGTH_TOLERANCE = 10;      // Pixel tolerance for edge length matching
const CORNER_OVERLAP_TOLERANCE = 1;    // Pixel tolerance for same-corner detection
const DEFAULT_MAX_PATH_LENGTH = 10;    // Default BFS path search limit

// Centralized hex configuration
export const hexConfig = {
  defaultSize: 30,
  heightMultiplier: 2,
  xSpacingMultiplier: Math.sqrt(3),
  ySpacingMultiplier: 1.5,

  // Calculate derived values
  getHexHeight: (hexSize = hexConfig.defaultSize) =>
    hexSize * hexConfig.heightMultiplier,
  getXSpacing: (hexSize = hexConfig.defaultSize) =>
    hexSize * hexConfig.xSpacingMultiplier,
  getYSpacing: (hexSize = hexConfig.defaultSize) =>
    hexSize * hexConfig.ySpacingMultiplier,

  // Calculate SVG dimensions
  getSvgDimensions: (rows, cols, hexSize = hexConfig.defaultSize) => {
    const xSpacing = hexConfig.getXSpacing(hexSize);
    const ySpacing = hexConfig.getYSpacing(hexSize);
    return {
      width: cols * xSpacing + hexSize * 2,
      height: rows * ySpacing + hexSize * 2,
    };
  },
};

/**
 * Iterates over all hexes in a grid, calling the callback for each hex.
 * @param {number} rows - Number of rows in the grid
 * @param {number} cols - Number of columns in the grid
 * @param {Function} callback - Function to call with (row, col) for each hex
 */
export function forEachHex(rows, cols, callback) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      callback(row, col);
    }
  }
}

export const hexUtils = {
  /**
   * Check if a river point is a corner point (vs a hex center)
   * @param {Object} point - Point with row, col, and optional corner
   * @returns {boolean} True if the point is a corner
   */
  isCornerPoint: (point) => point.corner != null,

  hexToWorld: (row, col, hexSize = hexConfig.defaultSize) => {
    const xSpacing = hexConfig.getXSpacing(hexSize);
    const ySpacing = hexConfig.getYSpacing(hexSize);

    // Calculate position with proper offset for alternating rows
    const x = col * xSpacing + (row % 2) * (xSpacing / 2) + hexSize;
    const y = row * ySpacing + hexSize;

    return { x, y };
  },

  generateHexPath: (x, y, hexSize) => {
    const points = [];
    // Start from top and go clockwise
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2; // Start from top (-90 degrees)
      const pointX = x + hexSize * Math.cos(angle);
      const pointY = y + hexSize * Math.sin(angle);
      points.push(`${pointX},${pointY}`);
    }
    return `M ${points.join(" L ")} Z`;
  },

  getNeighbors: (row, col, maxRows, maxCols) => {
    const neighbors = [];
    const isEvenRow = row % 2 === 0;

    const directions = isEvenRow
      ? [
          [-1, -1],
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
        ]
      : [
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, 1],
        ];

    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
        neighbors.push({ row: newRow, col: newCol });
      }
    });

    return neighbors;
  },

  hexDistance: (row1, col1, row2, col2) => {
    const toCube = (row, col) => {
      const x = col - (row - (row & 1)) / 2;
      const z = row;
      const y = -x - z;
      return { x, y, z };
    };

    const cube1 = toCube(row1, col1);
    const cube2 = toCube(row2, col2);

    return (
      (Math.abs(cube1.x - cube2.x) +
        Math.abs(cube1.y - cube2.y) +
        Math.abs(cube1.z - cube2.z)) /
      2
    );
  },

  /**
   * Get pixel coordinates for a hex corner
   * @param {number} row - Hex row
   * @param {number} col - Hex column
   * @param {number} cornerIndex - Corner index (0-5): 0=top, 1=top-right, 2=bottom-right, 3=bottom, 4=bottom-left, 5=top-left
   * @param {number} hexSize - Hex radius
   * @returns {{x: number, y: number}} Pixel coordinates
   */
  hexCornerToWorld: (row, col, cornerIndex, hexSize = hexConfig.defaultSize) => {
    const center = hexUtils.hexToWorld(row, col, hexSize);
    const angle = (cornerIndex * Math.PI) / 3 - Math.PI / 2; // Match generateHexPath angles
    return {
      x: center.x + hexSize * Math.cos(angle),
      y: center.y + hexSize * Math.sin(angle),
    };
  },

  /**
   * Convert world (SVG) coordinates back to hex row/col
   * Returns the hex whose center is closest to the given point
   * @param {number} worldX - X coordinate in SVG space
   * @param {number} worldY - Y coordinate in SVG space
   * @param {number} maxRows - Grid row count
   * @param {number} maxCols - Grid column count
   * @param {number} hexSize - Hex radius
   * @returns {{row: number, col: number} | null} Hex coordinates or null if out of bounds
   */
  worldToHex: (worldX, worldY, maxRows, maxCols, hexSize = hexConfig.defaultSize) => {
    const xSpacing = hexConfig.getXSpacing(hexSize);
    const ySpacing = hexConfig.getYSpacing(hexSize);

    // Approximate row from Y
    const approxRow = Math.round((worldY - hexSize) / ySpacing);

    // Find best match by checking nearby rows and columns
    let bestRow = -1;
    let bestCol = -1;
    let bestDistSq = Infinity;

    for (let testRow = Math.max(0, approxRow - 1); testRow <= Math.min(maxRows - 1, approxRow + 1); testRow++) {
      // Approximate column from X, accounting for row offset
      const rowOffset = (testRow % 2) * (xSpacing / 2);
      const approxCol = Math.round((worldX - hexSize - rowOffset) / xSpacing);

      for (let testCol = Math.max(0, approxCol - 1); testCol <= Math.min(maxCols - 1, approxCol + 1); testCol++) {
        const center = hexUtils.hexToWorld(testRow, testCol, hexSize);
        const dx = worldX - center.x;
        const dy = worldY - center.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestRow = testRow;
          bestCol = testCol;
        }
      }
    }

    // Check if the point is actually within reasonable distance of a hex center
    if (bestDistSq > hexSize * hexSize * POINT_DISTANCE_TOLERANCE) {
      return null;
    }

    if (bestRow >= 0 && bestRow < maxRows && bestCol >= 0 && bestCol < maxCols) {
      return { row: bestRow, col: bestCol };
    }

    return null;
  },

  /**
   * Convert world coordinates to the nearest river point (center or corner)
   * Returns either a center point {row, col} or a corner point {row, col, corner}
   * @param {number} worldX - X coordinate in SVG space
   * @param {number} worldY - Y coordinate in SVG space
   * @param {number} maxRows - Grid row count
   * @param {number} maxCols - Grid column count
   * @param {number} hexSize - Hex radius
   * @returns {{row: number, col: number, corner?: number} | null} Point or null if out of bounds
   */
  worldToRiverPoint: (worldX, worldY, maxRows, maxCols, hexSize = hexConfig.defaultSize) => {
    const xSpacing = hexConfig.getXSpacing(hexSize);
    const ySpacing = hexConfig.getYSpacing(hexSize);

    // Approximate row from Y
    const approxRow = Math.round((worldY - hexSize) / ySpacing);

    let bestPoint = null;
    let bestDistSq = Infinity;

    // Check nearby hexes for centers and corners
    for (let testRow = Math.max(0, approxRow - 1); testRow <= Math.min(maxRows - 1, approxRow + 1); testRow++) {
      const rowOffset = (testRow % 2) * (xSpacing / 2);
      const approxCol = Math.round((worldX - hexSize - rowOffset) / xSpacing);

      for (let testCol = Math.max(0, approxCol - 1); testCol <= Math.min(maxCols - 1, approxCol + 1); testCol++) {
        // Check center
        const center = hexUtils.hexToWorld(testRow, testCol, hexSize);
        const dxCenter = worldX - center.x;
        const dyCenter = worldY - center.y;
        const distSqCenter = dxCenter * dxCenter + dyCenter * dyCenter;

        if (distSqCenter < bestDistSq) {
          bestDistSq = distSqCenter;
          bestPoint = { row: testRow, col: testCol };
        }

        // Check all 6 corners
        for (let cornerIdx = 0; cornerIdx < 6; cornerIdx++) {
          const corner = hexUtils.hexCornerToWorld(testRow, testCol, cornerIdx, hexSize);
          const dxCorner = worldX - corner.x;
          const dyCorner = worldY - corner.y;
          const distSqCorner = dxCorner * dxCorner + dyCorner * dyCorner;

          if (distSqCorner < bestDistSq) {
            bestDistSq = distSqCorner;
            bestPoint = { row: testRow, col: testCol, corner: cornerIdx };
          }
        }
      }
    }

    // Check if the point is within reasonable distance
    if (bestDistSq > hexSize * hexSize * POINT_DISTANCE_TOLERANCE) {
      return null;
    }

    return bestPoint;
  },

  /**
   * Convert a river point (center or corner) to pixel coordinates
   * @param {Object} point - Point with row, col, and optional corner
   * @param {number} hexSize - Hex radius
   * @returns {{x: number, y: number}} Pixel coordinates
   */
  pointToWorld: (point, hexSize = hexConfig.defaultSize) => {
    if (hexUtils.isCornerPoint(point)) {
      return hexUtils.hexCornerToWorld(point.row, point.col, point.corner, hexSize);
    }
    return hexUtils.hexToWorld(point.row, point.col, hexSize);
  },

  /**
   * Check if two river points are adjacent
   * @param {Object} p1 - First point {row, col, corner?}
   * @param {Object} p2 - Second point {row, col, corner?}
   * @param {number} maxRows - Grid row count
   * @param {number} maxCols - Grid column count
   * @returns {boolean} True if points are adjacent
   */
  arePointsAdjacent: (p1, p2, maxRows, maxCols) => {
    const p1IsCorner = hexUtils.isCornerPoint(p1);
    const p2IsCorner = hexUtils.isCornerPoint(p2);

    // Case 1: Both are centers - use existing neighbor logic
    if (!p1IsCorner && !p2IsCorner) {
      const neighbors = hexUtils.getNeighbors(p1.row, p1.col, maxRows, maxCols);
      return neighbors.some(n => n.row === p2.row && n.col === p2.col);
    }

    // Case 2: Center to corner - corner must be close to center (same hex or neighbor)
    if (!p1IsCorner && p2IsCorner) {
      // Same hex - always adjacent
      if (p1.row === p2.row && p1.col === p2.col) return true;
      // Check if corner is close to center (corners are shared by up to 3 hexes)
      const center = hexUtils.hexToWorld(p1.row, p1.col);
      const corner = hexUtils.hexCornerToWorld(p2.row, p2.col, p2.corner);
      const dx = center.x - corner.x;
      const dy = center.y - corner.y;
      const distSq = dx * dx + dy * dy;
      // Corner should be within hex radius to be reachable
      const maxDistSq = hexConfig.defaultSize * hexConfig.defaultSize * ADJACENCY_TOLERANCE;
      return distSq <= maxDistSq;
    }

    // Case 3: Corner to center - center must be reachable from corner
    if (p1IsCorner && !p2IsCorner) {
      // Same hex - always adjacent
      if (p1.row === p2.row && p1.col === p2.col) return true;
      // Check if center is close to corner (corners are shared by up to 3 hexes)
      const corner = hexUtils.hexCornerToWorld(p1.row, p1.col, p1.corner);
      const center = hexUtils.hexToWorld(p2.row, p2.col);
      const dx = corner.x - center.x;
      const dy = corner.y - center.y;
      const distSq = dx * dx + dy * dy;
      // Center should be within hex radius of corner to be reachable
      const maxDistSq = hexConfig.defaultSize * hexConfig.defaultSize * ADJACENCY_TOLERANCE;
      return distSq <= maxDistSq;
    }

    // Case 4: Both are corners
    // Adjacent if: same hex with adjacent corner indices, OR shared/adjacent corners between hexes
    if (p1.row === p2.row && p1.col === p2.col) {
      // Same hex - corners must be adjacent (differ by 1, with wraparound)
      const diff = Math.abs(p1.corner - p2.corner);
      return diff === 1 || diff === 5;
    }

    // Different hexes - check physical distance between corners
    const corner1 = hexUtils.hexCornerToWorld(p1.row, p1.col, p1.corner);
    const corner2 = hexUtils.hexCornerToWorld(p2.row, p2.col, p2.corner);
    const dx = corner1.x - corner2.x;
    const dy = corner1.y - corner2.y;
    const distSq = dx * dx + dy * dy;

    // Same physical corner (within tolerance)
    if (distSq < CORNER_OVERLAP_TOLERANCE) return true;

    // Adjacent corners on shared edge - check distance equals one edge length
    // Edge length = hexSize for regular hexagon
    const edgeLengthSq = hexConfig.defaultSize * hexConfig.defaultSize;
    return Math.abs(distSq - edgeLengthSq) < EDGE_LENGTH_TOLERANCE;
  },

  /**
   * Get the 6 corners that belong to a hex
   * @param {number} row - Hex row
   * @param {number} col - Hex column
   * @returns {Array} Array of {row, col, corner} objects
   */
  getHexCorners: (row, col) => {
    return [0, 1, 2, 3, 4, 5].map(corner => ({ row, col, corner }));
  },

  /**
   * Get all adjacent river points (centers and corners) from a given point
   * @param {Object} point - Point {row, col, corner?}
   * @param {number} maxRows - Grid row count
   * @param {number} maxCols - Grid column count
   * @returns {Array} Array of adjacent points
   */
  getAdjacentRiverPoints: (point, maxRows, maxCols) => {
    const adjacent = [];
    const isCorner = hexUtils.isCornerPoint(point);

    if (!isCorner) {
      // From a center, can go to neighboring centers or own corners
      const neighbors = hexUtils.getNeighbors(point.row, point.col, maxRows, maxCols);
      neighbors.forEach(n => adjacent.push({ row: n.row, col: n.col }));
      // Also can go to own corners
      for (let c = 0; c < 6; c++) {
        adjacent.push({ row: point.row, col: point.col, corner: c });
      }
    } else {
      // From a corner, can go to the hex center or adjacent corners
      adjacent.push({ row: point.row, col: point.col }); // Own center

      // Adjacent corners on same hex
      const prevCorner = (point.corner + 5) % 6;
      const nextCorner = (point.corner + 1) % 6;
      adjacent.push({ row: point.row, col: point.col, corner: prevCorner });
      adjacent.push({ row: point.row, col: point.col, corner: nextCorner });

      // Corners on neighboring hexes that share this corner position
      const neighbors = hexUtils.getNeighbors(point.row, point.col, maxRows, maxCols);
      const cornerWorld = hexUtils.hexCornerToWorld(point.row, point.col, point.corner);

      neighbors.forEach(n => {
        // Check if neighbor center is adjacent
        adjacent.push({ row: n.row, col: n.col });

        // Check neighbor's corners for shared/adjacent corners
        for (let c = 0; c < 6; c++) {
          const neighborCorner = hexUtils.hexCornerToWorld(n.row, n.col, c);
          const dx = cornerWorld.x - neighborCorner.x;
          const dy = cornerWorld.y - neighborCorner.y;
          const distSq = dx * dx + dy * dy;

          // Same corner (shared) or adjacent corner (edge length apart)
          const edgeLengthSq = hexConfig.defaultSize * hexConfig.defaultSize;
          if (distSq < CORNER_OVERLAP_TOLERANCE || Math.abs(distSq - edgeLengthSq) < EDGE_LENGTH_TOLERANCE) {
            adjacent.push({ row: n.row, col: n.col, corner: c });
          }
        }
      });
    }

    // Filter duplicates and out-of-bounds
    const seen = new Set();
    return adjacent.filter(p => {
      if (p.row < 0 || p.row >= maxRows || p.col < 0 || p.col >= maxCols) return false;
      const key = `${p.row},${p.col},${p.corner ?? 'c'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  /**
   * Find shortest path between two river points using BFS
   * @param {Object} start - Start point {row, col, corner?}
   * @param {Object} end - End point {row, col, corner?}
   * @param {number} maxRows - Grid row count
   * @param {number} maxCols - Grid column count
   * @param {number} maxLength - Maximum path length to search (default 10)
   * @returns {Array|null} Array of points forming path, or null if no path found
   */
  findRiverPath: (start, end, maxRows, maxCols, maxLength = DEFAULT_MAX_PATH_LENGTH) => {
    const startKey = `${start.row},${start.col},${start.corner ?? 'c'}`;
    const endKey = `${end.row},${end.col},${end.corner ?? 'c'}`;

    if (startKey === endKey) return [start];

    const queue = [[start]];
    const visited = new Set([startKey]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (path.length > maxLength) continue;

      const neighbors = hexUtils.getAdjacentRiverPoints(current, maxRows, maxCols);

      for (const neighbor of neighbors) {
        const key = `${neighbor.row},${neighbor.col},${neighbor.corner ?? 'c'}`;

        if (key === endKey) {
          return [...path, neighbor];
        }

        if (!visited.has(key)) {
          visited.add(key);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null; // No path found
  },

  exportGrid: (hexData) => {
    return JSON.stringify(hexData, null, 2);
  },

  importGrid: (jsonData) => {
    try {
      return JSON.parse(jsonData);
    } catch (error) {
      console.error("Error importing grid data:", error);
      return null;
    }
  },
};

export default hexUtils;
