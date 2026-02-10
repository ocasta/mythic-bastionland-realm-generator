import { hexUtils } from "./hexUtils";

/**
 * Pure calculation functions for river rendering
 * Extracted from RiverPaths.jsx for reusability and testing
 */

/**
 * Base river width at source (in SVG units)
 */
export const BASE_WIDTH = 4;

/**
 * Width increment per tributary
 */
export const WIDTH_INCREMENT = 2;

/**
 * Maximum river width
 */
export const MAX_WIDTH = 12;

/**
 * Calculates the width of a river at each point based on tributaries
 * @param {Array} rivers - All rivers in the realm
 * @returns {Map} Map of river ID to array of widths at each point
 */
export function calculateRiverWidths(rivers) {
  const widthMap = new Map();

  // Build a map of which rivers are tributaries of which
  const tributaryCount = new Map();
  rivers.forEach((river) => {
    tributaryCount.set(river.id, 0);
  });

  // Count tributaries for each river
  rivers.forEach((river) => {
    if (river.tributaryOf !== null) {
      const parentCount = tributaryCount.get(river.tributaryOf) || 0;
      tributaryCount.set(river.tributaryOf, parentCount + 1);
    }
  });

  // Calculate widths for each river
  rivers.forEach((river) => {
    const widths = [];
    const pathLength = river.path.length;

    // Find if and where tributaries join this river
    const tributaryJoinPoints = [];
    rivers.forEach((otherRiver) => {
      if (otherRiver.tributaryOf === river.id && otherRiver.path.length > 0) {
        const lastPoint = otherRiver.path[otherRiver.path.length - 1];
        const joinIndex = river.path.findIndex(
          (p) => p.row === lastPoint.row && p.col === lastPoint.col
        );
        if (joinIndex >= 0) {
          tributaryJoinPoints.push(joinIndex);
        }
      }
    });

    // Sort join points to process in order
    tributaryJoinPoints.sort((a, b) => a - b);

    // Calculate width at each point
    let currentWidth = BASE_WIDTH;
    let tributaryIndex = 0;

    for (let i = 0; i < pathLength; i++) {
      while (
        tributaryIndex < tributaryJoinPoints.length &&
        tributaryJoinPoints[tributaryIndex] <= i
      ) {
        currentWidth = Math.min(currentWidth + WIDTH_INCREMENT, MAX_WIDTH);
        tributaryIndex++;
      }
      widths.push(currentWidth);
    }

    widthMap.set(river.id, widths);
  });

  return widthMap;
}

/**
 * Checks if a hex is a water terrain type
 * @param {Object} realm - The realm object
 * @param {number} row - Hex row
 * @param {number} col - Hex column
 * @returns {boolean} True if the hex is water
 */
export function isWaterHex(realm, row, col) {
  if (!realm) return false;
  const hex = realm.getHex(row, col);
  return hex && hex.terrainType && hex.terrainType.type === "water";
}

/**
 * Calculates the edge point where a river enters a water hex
 * @param {Object} fromPoint - Previous hex center {x, y}
 * @param {Object} toPoint - Water hex center {x, y}
 * @param {number} hexSize - Size of hex tiles
 * @returns {Object} Edge point {x, y}
 */
export function calculateWaterEdgePoint(fromPoint, toPoint, hexSize) {
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return fromPoint;

  const nx = dx / length;
  const ny = dy / length;

  const edgeDistanceFromCenter = hexSize * 0.866;
  const edgeDistance = length - edgeDistanceFromCenter;

  return {
    x: fromPoint.x + nx * edgeDistance,
    y: fromPoint.y + ny * edgeDistance,
  };
}

/**
 * Processes a river path to stop at water hex edges
 * @param {Array} path - Original path array (supports center and corner points)
 * @param {Object} realm - The realm object
 * @param {number} hexSize - Size of hex tiles
 * @returns {Array} Processed path with world coordinates, truncated at water
 */
export function processPathForWater(path, realm, hexSize) {
  if (!path || path.length === 0) return [];

  const processedPoints = [];

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const worldPoint = hexUtils.pointToWorld(point, hexSize);

    if (isWaterHex(realm, point.row, point.col)) {
      if (processedPoints.length > 0) {
        const prevPoint = processedPoints[processedPoints.length - 1];
        const edgePoint = calculateWaterEdgePoint(prevPoint, worldPoint, hexSize);
        processedPoints.push(edgePoint);
      }
      break;
    }

    processedPoints.push(worldPoint);
  }

  return processedPoints;
}

/**
 * Generates a smooth SVG path through hex centers/corners using quadratic bezier curves
 * @param {Array} path - Array of {row, col, corner?} points
 * @param {number} hexSize - Size of hex tiles
 * @param {Object} realm - The realm object (optional, for water detection)
 * @returns {string} SVG path d attribute
 */
export function generateSmoothPath(path, hexSize, realm = null) {
  if (path.length === 0) return "";
  if (path.length === 1) {
    const { x, y } = hexUtils.pointToWorld(path[0], hexSize);
    return `M ${x} ${y}`;
  }

  const points = realm
    ? processPathForWater(path, realm, hexSize)
    : path.map((p) => hexUtils.pointToWorld(p, hexSize));

  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    d += ` L ${points[1].x} ${points[1].y}`;
    return d;
  }

  const firstMid = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
  d += ` L ${firstMid.x} ${firstMid.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const nextMid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    d += ` Q ${points[i].x} ${points[i].y} ${nextMid.x} ${nextMid.y}`;
  }

  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

  return d;
}

/**
 * Generates multiple path segments with varying widths, stopping at water hexes
 * @param {Array} path - Array of {row, col, corner?} points
 * @param {Array} widths - Width at each point
 * @param {number} hexSize - Size of hex tiles
 * @param {Object} realm - The realm object (for water detection)
 * @returns {Array} Array of {d, width} for each segment
 */
export function generateWidthSegments(path, widths, hexSize, realm = null) {
  if (path.length < 2) return [];

  const segments = [];

  // Find where the path should end (at first water hex)
  let endIndex = path.length;
  let waterEdgePoint = null;

  if (realm) {
    for (let i = 0; i < path.length; i++) {
      if (isWaterHex(realm, path[i].row, path[i].col)) {
        endIndex = i;
        if (i > 0) {
          const prevWorld = hexUtils.pointToWorld(path[i - 1], hexSize);
          const waterWorld = hexUtils.pointToWorld(path[i], hexSize);
          waterEdgePoint = calculateWaterEdgePoint(prevWorld, waterWorld, hexSize);
        }
        break;
      }
    }
  }

  const points = [];
  for (let i = 0; i < endIndex; i++) {
    points.push(hexUtils.pointToWorld(path[i], hexSize));
  }

  if (waterEdgePoint) {
    points.push(waterEdgePoint);
  }

  if (points.length < 2) return [];

  for (let i = 0; i < points.length - 1; i++) {
    const startWidth = widths[Math.min(i, widths.length - 1)];
    const endWidth = widths[Math.min(i + 1, widths.length - 1)];
    const segmentWidth = (startWidth + endWidth) / 2;

    let d;
    if (points.length === 2) {
      d = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    } else if (i === 0) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      d = `M ${points[i].x} ${points[i].y} L ${midX} ${midY}`;
    } else if (i === points.length - 2) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      const prevMidX = (points[i - 1].x + points[i].x) / 2;
      const prevMidY = (points[i - 1].y + points[i].y) / 2;
      d = `M ${prevMidX} ${prevMidY} Q ${points[i].x} ${points[i].y} ${midX} ${midY} L ${points[i + 1].x} ${points[i + 1].y}`;
    } else {
      const prevMidX = (points[i - 1].x + points[i].x) / 2;
      const prevMidY = (points[i - 1].y + points[i].y) / 2;
      const nextMidX = (points[i].x + points[i + 1].x) / 2;
      const nextMidY = (points[i].y + points[i + 1].y) / 2;
      d = `M ${prevMidX} ${prevMidY} Q ${points[i].x} ${points[i].y} ${nextMidX} ${nextMidY}`;
    }

    segments.push({ d, width: segmentWidth });
  }

  return segments;
}
