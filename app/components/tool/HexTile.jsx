import { hexUtils } from '../../utils/hexUtils';

const HexTile = ({ hex, rowIndex, colIndex, hexSize, selectHex, selectedHex, paintingMode, onHexMouseDown, onHexMouseEnter, onHexMouseUp, landmark, holding, myth, holdingRef, landmarkRef, mythRef }) => {
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
  
  const fill = hex.terrainType.image
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
        <g className="pointer-events-none">
          <circle cx={x} cy={y} r="12" fill="#2563eb" />
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
        <g className="pointer-events-none">
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
        <g className="pointer-events-none">
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
