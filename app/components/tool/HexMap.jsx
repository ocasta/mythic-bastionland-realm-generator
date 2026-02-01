import HexTile from "./HexTile";
import { hexUtils } from "../../utils/hexUtils";

const HexMap = ({ realm, svgWidth, svgHeight, hexSize, selectHex, selectedHex, paintingMode, onHexMouseDown, onHexMouseEnter, onHexMouseUp, terrainTypes, terrainStyle }) => {
  const holdings = realm.getHoldings();
  const landmarks = realm.getLandmarks();
  const myths = realm.getMyths();
  const barriers = realm.getBarriers();
  
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
  
  return (
    <div className="hex-grid overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="hex-grid-svg"
      >
        <defs>
          {terrainTypes
            .filter((terrain) => terrain.image)
            .map((terrain) => {
              // Comic style needs more horizontal overflow to hide edge seams
              const isComic = terrainStyle === 'comic';
              const xOffset = isComic ? -0.25 : -0.12;
              const yOffset = isComic ? -0.12 : -0.06;
              const imgWidth = isComic ? 1.5 : 1.24;
              const imgHeight = isComic ? 1.24 : 1.12;

              return (
                <pattern
                  key={terrain.type}
                  id={`terrain-${terrain.type}`}
                  patternUnits="objectBoundingBox"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <image
                    href={terrain.image}
                    x={xOffset}
                    y={yOffset}
                    width={imgWidth}
                    height={imgHeight}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </pattern>
              );
            })}
        </defs>
        {realm.hexMap.map((row, rowIndex) =>
          row.map((hex, colIndex) => {
            const landmark = landmarks.find(l => l.row === rowIndex && l.col === colIndex);
            const holding = holdings.find(h => h.row === rowIndex && h.col === colIndex);
            const myth = myths.find(m => m.row === rowIndex && m.col === colIndex);

            // Compute reference labels based on array index
            const landmarkIndex = landmarks.findIndex(l => l.row === rowIndex && l.col === colIndex);
            const mythIndex = myths.findIndex(m => m.row === rowIndex && m.col === colIndex);

            // Holdings: "S" for Seat of Power, "H1", "H2" etc. for regular holdings
            let holdingRef = null;
            if (holding) {
              if (holding.isSeatOfPower) {
                holdingRef = 'S';
              } else {
                const nonSeatHoldings = holdings.filter(h => !h.isSeatOfPower);
                const holdingIndex = nonSeatHoldings.findIndex(h => h.row === rowIndex && h.col === colIndex);
                holdingRef = holdingIndex >= 0 ? `H${holdingIndex + 1}` : null;
              }
            }
            const landmarkRef = landmarkIndex >= 0 ? `L${landmarkIndex + 1}` : null;
            const mythRef = mythIndex >= 0 ? `M${mythIndex + 1}` : null;

            return (
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
                landmark={landmark}
                holding={holding}
                myth={myth}
                holdingRef={holdingRef}
                landmarkRef={landmarkRef}
                mythRef={mythRef}
              />
            );
          })
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
        <g className="feature-name-labels pointer-events-none">
          {holdings.map((holding, index) => {
            const { x, y } = hexUtils.hexToWorld(holding.row, holding.col, hexSize);
            if (!holding.name) return null;
            const textWidth = holding.name.length * 5 + 4;
            return (
              <g key={`holding-label-${index}`} className="feature-name-label">
                <rect
                  x={x - textWidth / 2}
                  y={y + 14}
                  width={textWidth}
                  height="14"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                  rx="2"
                />
                <text
                  x={x}
                  y={y + 23}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill="black"
                >
                  {holding.name}
                </text>
              </g>
            );
          })}
          {landmarks.map((landmark, index) => {
            const { x, y } = hexUtils.hexToWorld(landmark.row, landmark.col, hexSize);
            if (!landmark.name) return null;
            const textWidth = landmark.name.length * 5 + 4;
            return (
              <g key={`landmark-label-${index}`} className="feature-name-label">
                <rect
                  x={x - textWidth / 2}
                  y={y + 14}
                  width={textWidth}
                  height="14"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                  rx="2"
                />
                <text
                  x={x}
                  y={y + 23}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill="black"
                >
                  {landmark.name}
                </text>
              </g>
            );
          })}
          {myths.map((myth, index) => {
            const { x, y } = hexUtils.hexToWorld(myth.row, myth.col, hexSize);
            if (!myth.name) return null;
            const textWidth = myth.name.length * 5 + 4;
            return (
              <g key={`myth-label-${index}`} className="feature-name-label">
                <rect
                  x={x - textWidth / 2}
                  y={y + 14}
                  width={textWidth}
                  height="14"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                  rx="2"
                />
                <text
                  x={x}
                  y={y + 23}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill="black"
                >
                  {myth.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default HexMap;
