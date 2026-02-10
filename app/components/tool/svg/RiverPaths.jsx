import { hexUtils } from "../../../utils/hexUtils";
import {
  calculateRiverWidths,
  generateSmoothPath,
  generateWidthSegments,
  BASE_WIDTH,
} from "../../../utils/riverCalculations";

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
 * SVG component for rendering rivers as smooth paths through hex centers
 * Note: Waypoint handles are rendered separately by RiverWaypointHandles to ensure proper z-ordering
 */
const RiverPaths = ({
  rivers,
  hexSize,
  terrainStyle,
  currentRiverPath = [],
  realm = null,
  selectedRiverId = null,
  onRiverClick = null,
}) => {
  if ((!rivers || rivers.length === 0) && currentRiverPath.length === 0) {
    return null;
  }

  const style = RIVER_STYLES[terrainStyle] || RIVER_STYLES.none;
  const widthMap = calculateRiverWidths(rivers || []);

  return (
    <g className="river-paths">
      {/* SVG filters for watercolour style - use userSpaceOnUse to avoid zero bounding box issues */}
      <defs>
        <filter id="riverBlur" filterUnits="userSpaceOnUse" x="0" y="0" width="2000" height="2000">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Render completed rivers */}
      {rivers &&
        rivers.map((river) => {
          if (river.path.length < 2) return null;

          const widths = widthMap.get(river.id) || river.path.map(() => BASE_WIDTH);
          const isSelected = selectedRiverId === river.id;

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
                {/* Hit target for click detection */}
                {onRiverClick && (
                  <path
                    d={generateSmoothPath(river.path, hexSize, realm)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRiverClick(river.id);
                    }}
                  />
                )}
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
                    style={{ pointerEvents: 'none' }}
                  />
                ))}
                {/* Main paths */}
                {segments.map((seg, idx) => (
                  <path
                    key={`main-${river.id}-${idx}`}
                    d={seg.d}
                    fill="none"
                    stroke={isSelected ? '#f59e0b' : style.stroke}
                    strokeWidth={seg.width * style.strokeWidth}
                    strokeLinecap={style.strokeLinecap}
                    strokeLinejoin={style.strokeLinejoin}
                    opacity={style.opacity}
                    style={{ pointerEvents: 'none' }}
                  />
                ))}
              </g>
            );
          }

          // For other styles, render with varying widths
          const segments = generateWidthSegments(river.path, widths, hexSize, realm);
          return (
            <g key={`river-${river.id}`}>
              {/* Hit target for click detection */}
              {onRiverClick && (
                <path
                  d={generateSmoothPath(river.path, hexSize, realm)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={20}
                  style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRiverClick(river.id);
                  }}
                />
              )}
              {segments.map((seg, idx) => (
                <path
                  key={`seg-${river.id}-${idx}`}
                  d={seg.d}
                  fill="none"
                  stroke={isSelected ? '#f59e0b' : style.stroke}
                  strokeWidth={seg.width * style.strokeWidth}
                  strokeLinecap={style.strokeLinecap}
                  strokeLinejoin={style.strokeLinejoin}
                  filter={style.filter}
                  opacity={style.opacity}
                  style={{ pointerEvents: 'none' }}
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
          {/* Markers at each point - circles for centers, squares for corners */}
          {currentRiverPath.map((point, idx) => {
            const { x, y } = hexUtils.pointToWorld(point, hexSize);
            const isCorner = point.corner !== undefined && point.corner !== null;
            const fillColor = idx === 0 ? "#2563eb" : "#4a90d9";

            if (isCorner) {
              // Square marker for corner points
              const size = 6;
              return (
                <rect
                  key={`preview-point-${idx}`}
                  x={x - size / 2}
                  y={y - size / 2}
                  width={size}
                  height={size}
                  fill={fillColor}
                  stroke="white"
                  strokeWidth={1}
                  transform={`rotate(45, ${x}, ${y})`}
                />
              );
            }

            // Circle marker for center points
            return (
              <circle
                key={`preview-point-${idx}`}
                cx={x}
                cy={y}
                r={4}
                fill={fillColor}
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
