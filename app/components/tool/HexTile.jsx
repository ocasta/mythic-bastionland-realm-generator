import { hexUtils } from '../../utils/hexUtils';

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

  const handleClick = () => {
    if (riverDrawingMode) {
      onRiverHexClick && onRiverHexClick(rowIndex, colIndex);
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
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHexMouseEnter && onHexMouseEnter(hex)}
      onMouseUp={() => onHexMouseUp && onHexMouseUp()}
      style={{ userSelect: 'none' }}
    />
  );
};

export default HexTile;
