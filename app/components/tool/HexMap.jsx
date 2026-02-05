import HexTile from "./HexTile";
import FeatureMarker from "./FeatureMarker";
import { hexUtils } from "../../utils/hexUtils";
import { getHoldingLabel, getLandmarkLabel, getMythLabel } from "../../utils/featureLabels";
import TerrainPatterns from "./svg/TerrainPatterns";
import FeatureNameLabels from "./svg/FeatureNameLabels";
import RiverPaths from "./svg/RiverPaths";

const HexMap = ({ realm, svgWidth, svgHeight, hexSize, selectHex, selectedHex, paintingMode, onHexMouseDown, onHexMouseEnter, onHexMouseUp, terrainTypes, terrainStyle, showNames, showCoordinates, draggingFeature, onFeatureDragStart, onFeatureDrop, riverDrawingMode, currentRiverPath, onRiverHexClick }) => {
  const holdings = realm.getHoldings();
  const landmarks = realm.getLandmarks();
  const myths = realm.getMyths();
  const barriers = realm.getBarriers();
  const rivers = realm.getRivers();

  // Function to get the line coordinates for a barrier side
  const getBarrierLine = (x, y, side, hexSize) => {
    // Hexagon sides are numbered 1-6 starting from left going clockwise
    const sideAngles = [
      -Math.PI/3 * 2, // Side 1: left
      -Math.PI/3,     // Side 2: top-left
      0,              // Side 3: top-right
      Math.PI/3,      // Side 4: right
      Math.PI/3 * 2,  // Side 5: bottom-right
      Math.PI         // Side 6: bottom-left
    ];

    const angle1 = sideAngles[side - 1] - Math.PI / 2;
    const angle2 = sideAngles[side % 6] - Math.PI / 2;

    const x1 = x + hexSize * Math.cos(angle1);
    const y1 = y + hexSize * Math.sin(angle1);
    const x2 = x + hexSize * Math.cos(angle2);
    const y2 = y + hexSize * Math.sin(angle2);

    return { x1, y1, x2, y2 };
  };

  // Get drop zone styling based on feature type
  const getDropZoneStyle = (featureType) => {
    const draggedHolding = holdings.find(h => h.row === draggingFeature?.row && h.col === draggingFeature?.col);

    const styles = {
      holding: draggedHolding?.isSeatOfPower
        ? { fill: 'rgba(251, 191, 36, 0.2)', stroke: 'rgba(251, 191, 36, 0.5)', cursorColor: '%23fbbf24' }
        : { fill: 'rgba(37, 99, 235, 0.2)', stroke: 'rgba(37, 99, 235, 0.5)', cursorColor: '%232563eb' },
      landmark: { fill: 'rgba(34, 197, 94, 0.2)', stroke: 'rgba(34, 197, 94, 0.5)', cursorColor: '%2322c55e' },
      myth: { fill: 'rgba(147, 51, 234, 0.2)', stroke: 'rgba(147, 51, 234, 0.5)', cursorColor: '%239333ea' },
    };

    return styles[featureType] || styles.holding;
  };

  return (
    <div className="hex-grid overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="hex-grid-svg"
      >
        <TerrainPatterns terrainTypes={terrainTypes} terrainStyle={terrainStyle} />

        {/* Hex terrain tiles */}
        {realm.hexMap.map((row, rowIndex) =>
          row.map((hex, colIndex) => (
            <HexTile
              key={`${rowIndex}-${colIndex}`}
              hex={hex}
              rowIndex={rowIndex}
              colIndex={colIndex}
              hexSize={hexSize}
              selectHex={selectHex}
              paintingMode={paintingMode}
              onHexMouseDown={onHexMouseDown}
              onHexMouseEnter={onHexMouseEnter}
              onHexMouseUp={onHexMouseUp}
              terrainTypes={terrainTypes}
              showCoordinates={showCoordinates}
              riverDrawingMode={riverDrawingMode}
              onRiverHexClick={onRiverHexClick}
            />
          ))
        )}

        {/* Rivers - rendered after hex tiles */}
        <RiverPaths
          rivers={rivers}
          hexSize={hexSize}
          terrainStyle={terrainStyle}
          currentRiverPath={currentRiverPath}
          realm={realm}
        />

        {/* Feature markers - rendered on top of rivers */}
        <g className="feature-markers">
          {realm.hexMap.map((row, rowIndex) =>
            row.map((hex, colIndex) => {
              const landmark = landmarks.find(l => l.row === rowIndex && l.col === colIndex);
              const holding = holdings.find(h => h.row === rowIndex && h.col === colIndex);
              const myth = myths.find(m => m.row === rowIndex && m.col === colIndex);

              if (!landmark && !holding && !myth) return null;

              const { x, y } = hexUtils.hexToWorld(rowIndex, colIndex, hexSize);
              const holdingRef = holding ? getHoldingLabel(holding, holdings) : null;
              const landmarkRef = landmark ? getLandmarkLabel(landmark, landmarks) : null;
              const mythRef = myth ? getMythLabel(myth, myths) : null;

              return (
                <g key={`feature-${rowIndex}-${colIndex}`}>
                  {holding && holdingRef && (
                    <FeatureMarker
                      x={x}
                      y={y}
                      label={holdingRef}
                      featureType="holding"
                      isSeatOfPower={holding.isSeatOfPower}
                      paintingMode={paintingMode}
                      riverDrawingMode={riverDrawingMode}
                      draggingFeature={draggingFeature}
                      onDragStart={() => onFeatureDragStart && onFeatureDragStart('holding', rowIndex, colIndex)}
                    />
                  )}
                  {landmark && landmarkRef && (
                    <FeatureMarker
                      x={x}
                      y={y}
                      label={landmarkRef}
                      featureType="landmark"
                      paintingMode={paintingMode}
                      riverDrawingMode={riverDrawingMode}
                      draggingFeature={draggingFeature}
                      onDragStart={() => onFeatureDragStart && onFeatureDragStart('landmark', rowIndex, colIndex)}
                    />
                  )}
                  {myth && mythRef && (
                    <FeatureMarker
                      x={x}
                      y={y}
                      label={mythRef}
                      featureType="myth"
                      paintingMode={paintingMode}
                      riverDrawingMode={riverDrawingMode}
                      draggingFeature={draggingFeature}
                      onDragStart={() => onFeatureDragStart && onFeatureDragStart('myth', rowIndex, colIndex)}
                    />
                  )}
                </g>
              );
            })
          )}
        </g>

        {/* Drop zone overlays when dragging a feature */}
        {draggingFeature && (
          <g className="drop-zones">
            {realm.hexMap.map((row, rowIndex) =>
              row.map((hex, colIndex) => {
                const hasFeature = holdings.find(h => h.row === rowIndex && h.col === colIndex) ||
                                   landmarks.find(l => l.row === rowIndex && l.col === colIndex) ||
                                   myths.find(m => m.row === rowIndex && m.col === colIndex);
                const isSource = draggingFeature.row === rowIndex && draggingFeature.col === colIndex;

                if (hasFeature || isSource) return null;

                const { x, y } = hexUtils.hexToWorld(rowIndex, colIndex, hexSize);
                const hexPath = hexUtils.generateHexPath(x, y, hexSize);
                const style = getDropZoneStyle(draggingFeature.type);

                // Create a custom cursor with a colored circle and plus sign
                const cursorSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='${style.cursorColor}'/%3E%3Cpath d='M12 7v10M7 12h10' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 12 12, copy`;

                return (
                  <path
                    key={`drop-${rowIndex}-${colIndex}`}
                    d={hexPath}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth="2"
                    style={{ cursor: cursorSvg }}
                    onMouseUp={() => onFeatureDrop(rowIndex, colIndex)}
                  />
                );
              })
            )}
          </g>
        )}

        {/* Hex grid strokes - rendered on top of all hex tiles */}
        <g className="hex-strokes pointer-events-none">
          {realm.hexMap.map((row, rowIndex) =>
            row.map((hex, colIndex) => {
              const { x, y } = hexUtils.hexToWorld(rowIndex, colIndex, hexSize);
              const hexPath = hexUtils.generateHexPath(x, y, hexSize);

              return (
                <path
                  key={`stroke-${rowIndex}-${colIndex}`}
                  d={hexPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-600 dark:text-gray-400"
                />
              );
            })
          )}
        </g>

        {/* Selected hex overlay - rendered on top of strokes */}
        {selectedHex && !paintingMode && (
          <g className="selected-hex pointer-events-none">
            {realm.hexMap.map((row, rowIndex) =>
              row.map((hex, colIndex) => {
                if (hex === selectedHex) {
                  const { x, y } = hexUtils.hexToWorld(rowIndex, colIndex, hexSize);
                  const hexPath = hexUtils.generateHexPath(x, y, hexSize);

                  return (
                    <path
                      key={`selected-${rowIndex}-${colIndex}`}
                      d={hexPath}
                      fill="rgba(255, 192, 203, 0.5)"
                      stroke="purple"
                      strokeWidth="3"
                      className="pointer-events-none"
                    />
                  );
                }
                return null;
              })
            )}
          </g>
        )}

        {/* Barriers - rendered on top of selection */}
        <g className="hex-barriers pointer-events-none">
          {barriers.map((barrier, index) => {
            const { x, y } = hexUtils.hexToWorld(barrier.row, barrier.col, hexSize);
            const { x1, y1, x2, y2 } = getBarrierLine(x, y, barrier.side, hexSize);

            return (
              <line
                key={`barrier-${barrier.row}-${barrier.col}-${barrier.side}-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="red"
                strokeWidth="4"
                className="pointer-events-none"
                opacity="0.8"
              />
            );
          })}
        </g>

        {/* Feature name labels - rendered on top of everything */}
        {showNames && (
          <FeatureNameLabels
            holdings={holdings}
            landmarks={landmarks}
            myths={myths}
            hexSize={hexSize}
          />
        )}
      </svg>
    </div>
  );
};

export default HexMap;
