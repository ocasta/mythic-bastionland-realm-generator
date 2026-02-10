import { hexUtils } from "../../../utils/hexUtils";
import { generateSmoothPath, BASE_WIDTH } from "../../../utils/riverCalculations";

/**
 * Renders a waypoint marker - circle for center points, rotated square for corners
 */
const WaypointMarker = ({
  point,
  hexSize,
  fillColor,
  size = 6,
  strokeWidth = 2,
  opacity = 1,
  interactive = false,
  onMouseDown,
  onContextMenu,
  keyPrefix = "waypoint",
  index = 0,
}) => {
  const { x, y } = hexUtils.pointToWorld(point, hexSize);
  const isCorner = hexUtils.isCornerPoint(point);

  const sharedProps = {
    key: `${keyPrefix}-${index}`,
    fill: fillColor,
    stroke: "white",
    strokeWidth,
    opacity,
    style: interactive
      ? { cursor: 'grab', pointerEvents: 'all' }
      : { pointerEvents: 'none' },
    ...(interactive && onMouseDown && { onMouseDown }),
    ...(interactive && onContextMenu && { onContextMenu }),
  };

  if (isCorner) {
    const rectSize = (size - 1) * 2;
    return (
      <rect
        {...sharedProps}
        x={x - size + 1}
        y={y - size + 1}
        width={rectSize}
        height={rectSize}
        transform={`rotate(45, ${x}, ${y})`}
      />
    );
  }

  return <circle {...sharedProps} cx={x} cy={y} r={size} />;
};

/**
 * SVG component for rendering river waypoint handles and drag preview
 * Separated from RiverPaths to render on top of feature markers
 */
const RiverWaypointHandles = ({
  rivers,
  hexSize,
  selectedRiverId = null,
  onWaypointMouseDown = null,
  draggingWaypoint = null,
  dragPreviewPoint = null,
  dragPaths = null,
  contextMenu = null,
  onContextMenu = null,
  onCloseContextMenu = null,
  onDeleteWaypoint = null,
}) => {
  if (!selectedRiverId && !dragPreviewPoint && !contextMenu) return null;

  const handleContextMenu = (e, riverId, pointIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      // Get position in SVG viewBox space
      const svg = e.target.closest('svg');
      const rect = svg.getBoundingClientRect();

      // Parse the viewBox to get the coordinate system
      const viewBox = svg.getAttribute('viewBox');
      const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);

      // Transform client coordinates to viewBox coordinates
      const scaleX = vbWidth / rect.width;
      const scaleY = vbHeight / rect.height;
      const x = (e.clientX - rect.left) * scaleX + vbX;
      const y = (e.clientY - rect.top) * scaleY + vbY;

      onContextMenu(riverId, pointIndex, x, y);
    }
  };

  return (
    <g className="river-waypoint-handles">
      {/* Render waypoint handles for selected river */}
      {selectedRiverId && rivers && (
        <g className="river-waypoints">
          {rivers
            .filter((river) => river.id === selectedRiverId)
            .map((river) =>
              river.path.map((point, idx) => {
                const isDragging = draggingWaypoint?.riverId === river.id && draggingWaypoint?.pointIndex === idx;
                return (
                  <WaypointMarker
                    key={`waypoint-${river.id}-${idx}`}
                    point={point}
                    hexSize={hexSize}
                    fillColor={isDragging ? '#f97316' : '#2563eb'}
                    size={6}
                    interactive
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onWaypointMouseDown?.(river.id, idx);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, river.id, idx)}
                    keyPrefix={`waypoint-${river.id}`}
                    index={idx}
                  />
                );
              })
            )}
        </g>
      )}

      {/* Render drag path preview */}
      {dragPreviewPoint && dragPaths && dragPreviewPoint.isValid && (
        <g className="drag-path-preview" style={{ pointerEvents: 'none' }}>
          {/* Path from previous point */}
          {dragPaths.pathFromPrev && dragPaths.pathFromPrev.length > 1 && (
            <path
              d={generateSmoothPath(dragPaths.pathFromPrev, hexSize)}
              fill="none"
              stroke="#22c55e"
              strokeWidth={BASE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 2"
              opacity={0.7}
            />
          )}
          {/* Path to next point */}
          {dragPaths.pathToNext && dragPaths.pathToNext.length > 1 && (
            <path
              d={generateSmoothPath(dragPaths.pathToNext, hexSize)}
              fill="none"
              stroke="#22c55e"
              strokeWidth={BASE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 2"
              opacity={0.7}
            />
          )}
          {/* Preview waypoints for the paths */}
          {dragPaths.pathFromPrev && dragPaths.pathFromPrev.slice(1).map((point, idx) => (
            <WaypointMarker
              key={`prev-path-${idx}`}
              point={point}
              hexSize={hexSize}
              fillColor="#22c55e"
              size={5}
              strokeWidth={1}
              opacity={0.6}
              keyPrefix="prev-path"
              index={idx}
            />
          ))}
          {dragPaths.pathToNext && dragPaths.pathToNext.slice(1, -1).map((point, idx) => (
            <WaypointMarker
              key={`next-path-${idx}`}
              point={point}
              hexSize={hexSize}
              fillColor="#22c55e"
              size={5}
              strokeWidth={1}
              opacity={0.6}
              keyPrefix="next-path"
              index={idx}
            />
          ))}
        </g>
      )}

      {/* Render drag preview point */}
      {dragPreviewPoint && (
        <g className="drag-preview">
          <WaypointMarker
            point={dragPreviewPoint}
            hexSize={hexSize}
            fillColor={dragPreviewPoint.isValid ? '#22c55e' : '#ef4444'}
            size={6}
            opacity={0.7}
            keyPrefix="drag-preview"
          />
        </g>
      )}

      {/* Context menu for waypoint actions */}
      {contextMenu && (
        <g className="waypoint-context-menu">
          {/* Invisible overlay to close menu when clicking outside */}
          <rect
            x={-1000}
            y={-1000}
            width={3000}
            height={3000}
            fill="transparent"
            style={{ cursor: 'default' }}
            onClick={(e) => {
              e.stopPropagation();
              onCloseContextMenu?.();
            }}
          />
          {/* Menu background */}
          <rect
            x={contextMenu.x}
            y={contextMenu.y}
            width={120}
            height={32}
            rx={4}
            fill="white"
            stroke="#d1d5db"
            strokeWidth={1}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          />
          {/* Delete option */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteWaypoint?.();
            }}
          >
            <rect
              x={contextMenu.x + 4}
              y={contextMenu.y + 4}
              width={112}
              height={24}
              rx={2}
              fill="transparent"
              className="hover:fill-red-50"
            />
            <text
              x={contextMenu.x + 12}
              y={contextMenu.y + 21}
              fontSize={13}
              fill="#dc2626"
              style={{ userSelect: 'none' }}
            >
              Delete waypoint
            </text>
          </g>
        </g>
      )}
    </g>
  );
};

export default RiverWaypointHandles;
