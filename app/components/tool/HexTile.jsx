import { hexUtils } from '../../utils/hexUtils';

const HexTile = ({ hex, rowIndex, colIndex, hexSize, selectHex, selectedHex, paintingMode, onHexMouseDown, onHexMouseEnter, onHexMouseUp, landmark, holding, myth, holdingRef, landmarkRef, mythRef, terrainTypes, showNames, draggingFeature, onFeatureDragStart }) => {
  const { x, y } = hexUtils.hexToWorld(rowIndex, colIndex, hexSize);
  const hexPath = hexUtils.generateHexPath(x, y, hexSize);

  // Change cursor based on mode
  const cursorClass = paintingMode ? 'cursor-crosshair' : 'cursor-pointer';

  const handleMouseDown = (e) => {
    if (paintingMode) {
      e.preventDefault(); // Prevent text selection and default drag behavior
      onHexMouseDown && onHexMouseDown(hex);
    }
  };

  const handleClick = () => {
    if (!paintingMode) {
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
    <g>
      <path
        d={hexPath}
        fill={fill}
        stroke="none"
        className={`hex-tile ${cursorClass} hover:opacity-80 transition-opacity`}
        stroke="none"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => onHexMouseEnter && onHexMouseEnter(hex)}
        onMouseUp={() => onHexMouseUp && onHexMouseUp()}
        style={{ userSelect: 'none' }}
      />
      
      {/* Render holdings */}
      {holding && holdingRef && (
        <g
          className={paintingMode || draggingFeature ? "pointer-events-none" : "cursor-grab"}
          onMouseDown={(e) => {
            if (!paintingMode && !draggingFeature) {
              e.stopPropagation();
              onFeatureDragStart && onFeatureDragStart('holding', rowIndex, colIndex);
            }
          }}
        >
          <circle
            cx={x}
            cy={y}
            r="12"
            fill={holdingRef === 'S' ? '#fbbf24' : '#2563eb'}
            stroke={holdingRef === 'S' ? '#000000' : 'none'}
            strokeWidth={holdingRef === 'S' ? 2 : 0}
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            className="select-none fill-white"
            style={{ fontWeight: 'bold' }}
          >
            {holdingRef}
          </text>
        </g>
      )}

      {/* Render landmarks */}
      {landmark && landmarkRef && (
        <g
          className={paintingMode || draggingFeature ? "pointer-events-none" : "cursor-grab"}
          onMouseDown={(e) => {
            if (!paintingMode && !draggingFeature) {
              e.stopPropagation();
              onFeatureDragStart && onFeatureDragStart('landmark', rowIndex, colIndex);
            }
          }}
        >
          <circle cx={x} cy={y} r="12" fill="#22c55e" />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            className="select-none fill-white"
            style={{ fontWeight: 'bold' }}
          >
            {landmarkRef}
          </text>
        </g>
      )}

      {/* Render myths */}
      {myth && mythRef && (
        <g
          className={paintingMode || draggingFeature ? "pointer-events-none" : "cursor-grab"}
          onMouseDown={(e) => {
            if (!paintingMode && !draggingFeature) {
              e.stopPropagation();
              onFeatureDragStart && onFeatureDragStart('myth', rowIndex, colIndex);
            }
          }}
        >
          <circle cx={x} cy={y} r="12" fill="#9333ea" />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            className="select-none fill-white"
            style={{ fontWeight: 'bold' }}
          >
            {mythRef}
          </text>
        </g>
      )}
    </g>
  );
};

export default HexTile;
