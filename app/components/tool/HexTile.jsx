import { hexUtils, hexConfig } from '../../utils/hexUtils';

// Distance threshold for corner snapping (in pixels)
const CORNER_SNAP_THRESHOLD = 12;

const HexTile = ({ hex, rowIndex, colIndex, hexSize, selectHex, paintingMode, onHexMouseDown, onHexMouseEnter, onHexMouseUp, terrainTypes, riverDrawingMode, onRiverHexClick }) => {
  const { x, y } = hexUtils.hexToWorld(rowIndex, colIndex, hexSize);
  const hexPath = hexUtils.generateHexPath(x, y, hexSize);

  // Change cursor based on mode
  const cursorClass = paintingMode || riverDrawingMode ? 'cursor-crosshair' : 'cursor-pointer';

  const handleMouseDown = (e) => {
    if (paintingMode) {
      e.preventDefault(); // Prevent text selection and default drag behavior
      onHexMouseDown && onHexMouseDown(hex);
    }
  };

  /**
   * Detect if click is near a corner and return corner index or null
   */
  const detectCorner = (e) => {
    // Get click position relative to SVG
    const svg = e.target.closest('svg');
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check distance to each corner
    for (let i = 0; i < 6; i++) {
      const corner = hexUtils.hexCornerToWorld(rowIndex, colIndex, i, hexSize);
      const dx = clickX - corner.x;
      const dy = clickY - corner.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CORNER_SNAP_THRESHOLD) {
        return i;
      }
    }

    return null;
  };

  const handleClick = (e) => {
    if (riverDrawingMode) {
      const corner = detectCorner(e);
      onRiverHexClick && onRiverHexClick(rowIndex, colIndex, corner);
    } else if (!paintingMode) {
      selectHex(hex);
    }
  };

  // Look up current style's terrain to check if images are enabled
  const currentTerrain = terrainTypes?.find(t => t.type === hex.terrainType.type);
  const hasImage = currentTerrain?.image;

  const fill = hasImage
    ? `url(#terrain-${hex.terrainType.type})`
    : hex.terrainType.color;

  return (
    <path
      d={hexPath}
      fill={fill}
      stroke="none"
      className={`hex-tile ${cursorClass} hover:opacity-80 transition-opacity`}
      onClick={(e) => handleClick(e)}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHexMouseEnter && onHexMouseEnter(hex)}
      onMouseUp={() => onHexMouseUp && onHexMouseUp()}
      style={{ userSelect: 'none' }}
    />
  );
};

export default HexTile;
