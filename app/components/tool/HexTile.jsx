import { hexUtils } from '../../utils/hexUtils';
import FeatureMarker from './FeatureMarker';

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
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => onHexMouseEnter && onHexMouseEnter(hex)}
        onMouseUp={() => onHexMouseUp && onHexMouseUp()}
        style={{ userSelect: 'none' }}
      />

      {/* Render holdings */}
      {holding && holdingRef && (
        <FeatureMarker
          x={x}
          y={y}
          label={holdingRef}
          featureType="holding"
          isSeatOfPower={holding.isSeatOfPower}
          paintingMode={paintingMode}
          draggingFeature={draggingFeature}
          onDragStart={() => onFeatureDragStart && onFeatureDragStart('holding', rowIndex, colIndex)}
        />
      )}

      {/* Render landmarks */}
      {landmark && landmarkRef && (
        <FeatureMarker
          x={x}
          y={y}
          label={landmarkRef}
          featureType="landmark"
          paintingMode={paintingMode}
          draggingFeature={draggingFeature}
          onDragStart={() => onFeatureDragStart && onFeatureDragStart('landmark', rowIndex, colIndex)}
        />
      )}

      {/* Render myths */}
      {myth && mythRef && (
        <FeatureMarker
          x={x}
          y={y}
          label={mythRef}
          featureType="myth"
          paintingMode={paintingMode}
          draggingFeature={draggingFeature}
          onDragStart={() => onFeatureDragStart && onFeatureDragStart('myth', rowIndex, colIndex)}
        />
      )}
    </g>
  );
};

export default HexTile;
