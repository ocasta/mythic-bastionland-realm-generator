import { hexUtils } from "../../../utils/hexUtils";

/**
 * River style configurations - bolder strokes for visibility
 */
const RIVER_STYLES = {
  none: {
    stroke: "#2563eb",
    strokeWidth: 1.5,
    filter: null,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    opacity: 1,
  },
  comic: {
    stroke: "#4a9eed",
    strokeWidth: 1.4,
    filter: null,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    opacity: 0.75,
  },
  watercolour: {
    stroke: "#3b82f6",
    strokeWidth: 1.3,
    filter: "url(#riverBlur)",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    opacity: 0.75,
  },
};

/**
 * Base river width at source (in SVG units)
 */
const BASE_WIDTH = 4;

/**
 * Width increment per tributary
 */
const WIDTH_INCREMENT = 2;

/**
 * Maximum river width
 */
const MAX_WIDTH = 12;

/**
 * Calculates the width of a river at each point based on tributaries
 * @param {Array} rivers - All rivers in the realm
 * @returns {Map} Map of river ID to array of widths at each point
 */
function calculateRiverWidths(rivers) {
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
        // Find where tributary joins (last point of tributary should be on main river)
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
      // Check if a tributary joins at this point
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
function isWaterHex(realm, row, col) {
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
function calculateWaterEdgePoint(fromPoint, toPoint, hexSize) {
  // Calculate direction vector
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return fromPoint;

  // Normalize direction
  const nx = dx / length;
  const ny = dy / length;

  // Stop at the hex edge - distance from center to edge midpoint is hexSize * sqrt(3)/2
  const edgeDistanceFromCenter = hexSize * 0.866;
  const edgeDistance = length - edgeDistanceFromCenter;

  return {
    x: fromPoint.x + nx * edgeDistance,
    y: fromPoint.y + ny * edgeDistance,
  };
}

/**
 * Processes a river path to stop at water hex edges
 * @param {Array} path - Original path array
 * @param {Object} realm - The realm object
 * @param {number} hexSize - Size of hex tiles
 * @returns {Array} Processed path with world coordinates, truncated at water
 */
function processPathForWater(path, realm, hexSize) {
  if (!path || path.length === 0) return [];

  const processedPoints = [];

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const worldPoint = hexUtils.hexToWorld(point.row, point.col, hexSize);

    // Check if this hex is water
    if (isWaterHex(realm, point.row, point.col)) {
      // This is a water hex - calculate edge point and stop
      if (processedPoints.length > 0) {
        const prevPoint = processedPoints[processedPoints.length - 1];
        const edgePoint = calculateWaterEdgePoint(prevPoint, worldPoint, hexSize);
        processedPoints.push(edgePoint);
      }
      break; // Stop at water
    }

    processedPoints.push(worldPoint);
  }

  return processedPoints;
}

/**
 * Generates a smooth SVG path through hex centers using quadratic bezier curves
 * @param {Array} path - Array of {row, col} points
 * @param {number} hexSize - Size of hex tiles
 * @param {Object} realm - The realm object (optional, for water detection)
 * @returns {string} SVG path d attribute
 */
function generateSmoothPath(path, hexSize, realm = null) {
  if (path.length === 0) return "";
  if (path.length === 1) {
    const { x, y } = hexUtils.hexToWorld(path[0].row, path[0].col, hexSize);
    return `M ${x} ${y}`;
  }

  // Process path for water hexes if realm is provided
  const points = realm
    ? processPathForWater(path, realm, hexSize)
    : path.map((p) => hexUtils.hexToWorld(p.row, p.col, hexSize));

  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  // Start at first point
  let d = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    // Simple line for 2 points
    d += ` L ${points[1].x} ${points[1].y}`;
    return d;
  }

  // For 3+ points, use quadratic bezier curves
  // Move to midpoint between first two points
  const firstMid = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2,
  };
  d += ` L ${firstMid.x} ${firstMid.y}`;

  // Create curves through each point (except first and last)
  for (let i = 1; i < points.length - 1; i++) {
    const nextMid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    // Quadratic bezier: current point is control, midpoint is end
    d += ` Q ${points[i].x} ${points[i].y} ${nextMid.x} ${nextMid.y}`;
  }

  // Line to last point
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

  return d;
}

/**
 * Generates multiple path segments with varying widths, stopping at water hexes
 * @param {Array} path - Array of {row, col} points
 * @param {Array} widths - Width at each point
 * @param {number} hexSize - Size of hex tiles
 * @param {Object} realm - The realm object (for water detection)
 * @returns {Array} Array of {d, width} for each segment
 */
function generateWidthSegments(path, widths, hexSize, realm = null) {
  if (path.length < 2) return [];

  const segments = [];

  // Find where the path should end (at first water hex)
  let endIndex = path.length;
  let waterEdgePoint = null;

  if (realm) {
    for (let i = 0; i < path.length; i++) {
      if (isWaterHex(realm, path[i].row, path[i].col)) {
        endIndex = i;
        // Calculate edge point if we have a previous point
        if (i > 0) {
          const prevWorld = hexUtils.hexToWorld(path[i - 1].row, path[i - 1].col, hexSize);
          const waterWorld = hexUtils.hexToWorld(path[i].row, path[i].col, hexSize);
          waterEdgePoint = calculateWaterEdgePoint(prevWorld, waterWorld, hexSize);
        }
        break;
      }
    }
  }

  // Convert path points to world coordinates (up to water)
  const points = [];
  for (let i = 0; i < endIndex; i++) {
    points.push(hexUtils.hexToWorld(path[i].row, path[i].col, hexSize));
  }

  // Add water edge point if we hit water
  if (waterEdgePoint) {
    points.push(waterEdgePoint);
  }

  if (points.length < 2) return [];

  // Create segments between consecutive points
  for (let i = 0; i < points.length - 1; i++) {
    const startWidth = widths[Math.min(i, widths.length - 1)];
    const endWidth = widths[Math.min(i + 1, widths.length - 1)];
    // Use average width for segment
    const segmentWidth = (startWidth + endWidth) / 2;

    // Generate smooth path for this segment considering adjacent points
    let d;
    if (i === 0) {
      // First segment: simple line to midpoint
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      d = `M ${points[i].x} ${points[i].y} L ${midX} ${midY}`;
    } else if (i === points.length - 2) {
      // Last segment: from midpoint to end
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      const prevMidX = (points[i - 1].x + points[i].x) / 2;
      const prevMidY = (points[i - 1].y + points[i].y) / 2;
      d = `M ${prevMidX} ${prevMidY} Q ${points[i].x} ${points[i].y} ${midX} ${midY} L ${points[i + 1].x} ${points[i + 1].y}`;
    } else {
      // Middle segment: curve through midpoints
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

/**
 * SVG component for rendering rivers as smooth paths through hex centers
 */
const RiverPaths = ({
  rivers,
  hexSize,
  terrainStyle,
  currentRiverPath = [],
  realm = null,
}) => {
  if ((!rivers || rivers.length === 0) && currentRiverPath.length === 0) {
    return null;
  }

  const style = RIVER_STYLES[terrainStyle] || RIVER_STYLES.none;
  const widthMap = calculateRiverWidths(rivers || []);

  return (
    <g className="river-paths">
      {/* SVG filters for watercolour style */}
      <defs>
        <filter id="riverBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Render completed rivers */}
      {rivers &&
        rivers.map((river) => {
          if (river.path.length < 2) return null;

          const widths = widthMap.get(river.id) || river.path.map(() => BASE_WIDTH);

          // For comic style, render outline first
          if (style.outline) {
            const segments = generateWidthSegments(
              river.path,
              widths,
              hexSize,
              realm
            );
            return (
              <g key={`river-${river.id}`}>
                {/* Outline paths */}
                {segments.map((seg, idx) => (
                  <path
                    key={`outline-${river.id}-${idx}`}
                    d={seg.d}
                    fill="none"
                    stroke={style.outline.stroke}
                    strokeWidth={seg.width * style.outline.strokeWidth}
                    strokeLinecap={style.strokeLinecap}
                    strokeLinejoin={style.strokeLinejoin}
                  />
                ))}
                {/* Main paths */}
                {segments.map((seg, idx) => (
                  <path
                    key={`main-${river.id}-${idx}`}
                    d={seg.d}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={seg.width * style.strokeWidth}
                    strokeLinecap={style.strokeLinecap}
                    strokeLinejoin={style.strokeLinejoin}
                    opacity={style.opacity}
                  />
                ))}
              </g>
            );
          }

          // For other styles, render with varying widths
          const segments = generateWidthSegments(river.path, widths, hexSize, realm);
          return (
            <g key={`river-${river.id}`}>
              {segments.map((seg, idx) => (
                <path
                  key={`seg-${river.id}-${idx}`}
                  d={seg.d}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={seg.width * style.strokeWidth}
                  strokeLinecap={style.strokeLinecap}
                  strokeLinejoin={style.strokeLinejoin}
                  filter={style.filter}
                  opacity={style.opacity}
                />
              ))}
            </g>
          );
        })}

      {/* Render current path being drawn (preview) */}
      {currentRiverPath.length > 0 && (
        <g className="river-preview">
          <path
            d={generateSmoothPath(currentRiverPath, hexSize)}
            fill="none"
            stroke="#4a90d9"
            strokeWidth={BASE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 2"
            opacity={0.7}
          />
          {/* Markers at each point */}
          {currentRiverPath.map((point, idx) => {
            const { x, y } = hexUtils.hexToWorld(point.row, point.col, hexSize);
            return (
              <circle
                key={`preview-point-${idx}`}
                cx={x}
                cy={y}
                r={4}
                fill={idx === 0 ? "#2563eb" : "#4a90d9"}
                stroke="white"
                strokeWidth={1}
              />
            );
          })}
        </g>
      )}
    </g>
  );
};

export default RiverPaths;
