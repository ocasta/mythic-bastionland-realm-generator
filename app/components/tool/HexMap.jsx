import HexTile from "./HexTile";
import FeatureMarker from "./FeatureMarker";
import { hexUtils } from "../../utils/hexUtils";
import { getHoldingLabel, getLandmarkLabel, getMythLabel } from "../../utils/featureLabels";
import TerrainPatterns from "./svg/TerrainPatterns";
import FeatureNameLabels from "./svg/FeatureNameLabels";
import RiverPaths from "./svg/RiverPaths";
import RiverWaypointHandles from "./svg/RiverWaypointHandles";

// Padding to prevent feature labels from being clipped on the left edge
const LABEL_PADDING_LEFT = 60;

const HexMap = ({ realm, svgWidth, svgHeight, hexSize, selectHex, selectedHex, paintingMode, onHexMouseDown, onHexMouseEnter, onHexMouseUp, terrainTypes, terrainStyle, showNames, showCoordinates, showFeatureNames, draggingFeature, onFeatureDragStart, onFeatureDrop, riverDrawingMode, currentRiverPath, onRiverHexClick, selectedRiverId, onRiverClick, onWaypointMouseDown, onWaypointDrag, onWaypointDragEnd, draggingWaypoint, dragPreviewPoint, dragPaths, contextMenu, onContextMenu, onCloseContextMenu, onDeleteWaypoint }) => {
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

  // Handle SVG mouse move for waypoint dragging
  const handleSvgMouseMove = (e) => {
    if (draggingWaypoint && onWaypointDrag) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      // Account for viewBox offset
      const scaleX = (svgWidth + LABEL_PADDING_LEFT) / rect.width;
      const scaleY = svgHeight / rect.height;
      const worldX = (e.clientX - rect.left) * scaleX - LABEL_PADDING_LEFT;
      const worldY = (e.clientY - rect.top) * scaleY;
      onWaypointDrag(worldX, worldY);
    }
  };

  // Handle SVG mouse up for waypoint dragging
  const handleSvgMouseUp = () => {
    if (draggingWaypoint && onWaypointDragEnd) {
      onWaypointDragEnd();
    }
  };

  // Handle SVG click to deselect river
  const handleSvgClick = (e) => {
    // Only deselect if clicking on the SVG background, not on a river
    if (selectedRiverId && e.target === e.currentTarget) {
      onRiverClick?.(null);
    }
  };

  return (
    <div className="hex-grid overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <svg
        width={svgWidth + LABEL_PADDING_LEFT}
        height={svgHeight}
        viewBox={`${-LABEL_PADDING_LEFT} 0 ${svgWidth + LABEL_PADDING_LEFT} ${svgHeight}`}
        className="hex-grid-svg"
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseUp}
        onClick={handleSvgClick}
        style={draggingWaypoint ? { cursor: 'grabbing' } : undefined}
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
          selectedRiverId={selectedRiverId}
          onRiverClick={onRiverClick}
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
                      onSelect={() => selectHex(hex)}
                    />
                  )}
                  {landmark && landmarkRef && (
                    <FeatureMarker
                      x={x}
                      y={y}
                      label={landmarkRef}
                      featureType="landmark"
                      landmarkType={landmark.type}
                      paintingMode={paintingMode}
                      riverDrawingMode={riverDrawingMode}
                      draggingFeature={draggingFeature}
                      onDragStart={() => onFeatureDragStart && onFeatureDragStart('landmark', rowIndex, colIndex)}
                      onSelect={() => selectHex(hex)}
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
                      onSelect={() => selectHex(hex)}
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

        {/* River waypoint handles - rendered on top of features for drag interaction */}
        <RiverWaypointHandles
          rivers={rivers}
          hexSize={hexSize}
          selectedRiverId={selectedRiverId}
          onWaypointMouseDown={onWaypointMouseDown}
          draggingWaypoint={draggingWaypoint}
          dragPreviewPoint={dragPreviewPoint}
          dragPaths={dragPaths}
          contextMenu={contextMenu}
          onContextMenu={onContextMenu}
          onCloseContextMenu={onCloseContextMenu}
          onDeleteWaypoint={onDeleteWaypoint}
        />

        {/* Feature name labels - rendered on top of everything */}
        {showNames && (
          <FeatureNameLabels
            holdings={holdings}
            landmarks={landmarks}
            myths={myths}
            hexSize={hexSize}
            showFeatureNames={showFeatureNames}
          />
        )}
      </svg>
    </div>
  );
};

export default HexMap;
