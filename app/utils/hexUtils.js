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
   * Convert a river point (center or corner) to pixel coordinates
   * @param {Object} point - Point with row, col, and optional corner
   * @param {number} hexSize - Hex radius
   * @returns {{x: number, y: number}} Pixel coordinates
   */
  pointToWorld: (point, hexSize = hexConfig.defaultSize) => {
    if (point.corner !== undefined && point.corner !== null) {
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
    const p1IsCorner = p1.corner !== undefined && p1.corner !== null;
    const p2IsCorner = p2.corner !== undefined && p2.corner !== null;

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
      const maxDistSq = hexConfig.defaultSize * hexConfig.defaultSize * 1.1; // slight tolerance
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
      const maxDistSq = hexConfig.defaultSize * hexConfig.defaultSize * 1.1; // slight tolerance
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
    if (distSq < 1) return true;

    // Adjacent corners on shared edge - check distance equals one edge length
    // Edge length = hexSize for regular hexagon
    const edgeLengthSq = hexConfig.defaultSize * hexConfig.defaultSize;
    return Math.abs(distSq - edgeLengthSq) < 10;
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
