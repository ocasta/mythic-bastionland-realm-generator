import { hexUtils } from '../../../utils/hexUtils';
import { getLandmarkLabel, getHoldingLabel, getMythLabel } from '../../../utils/featureLabels';

// Feature label colors
const LANDMARK_COLOR = '#22c55e';  // Green
const HOLDING_COLOR = '#2563eb';   // Blue
const SEAT_OF_POWER_COLOR = '#fbbf24';  // Gold/amber
const MYTH_COLOR = '#9333ea';  // Purple

/**
 * Renders name labels below features on the hex map.
 * Shows feature names in small boxes below holdings, landmarks, and myths.
 * For holdings and landmarks, the label prefix is included on the left with color.
 */
const FeatureNameLabels = ({ holdings, landmarks, myths, hexSize }) => {
  const renderLabel = (feature, index, prefix) => {
    const { x, y } = hexUtils.hexToWorld(feature.row, feature.col, hexSize);
    if (!feature.name) return null;

    const textWidth = feature.name.length * 5 + 4;

    return (
      <g key={`${prefix}-label-${index}`} className="feature-name-label">
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
          {feature.name}
        </text>
      </g>
    );
  };

  const renderHoldingLabel = (holding, index) => {
    const { x, y } = hexUtils.hexToWorld(holding.row, holding.col, hexSize);
    if (!holding.name) return null;

    const label = getHoldingLabel(holding, holdings);
    const labelColor = holding.isSeatOfPower ? SEAT_OF_POWER_COLOR : HOLDING_COLOR;
    const labelWidth = label.length * 6 + 2;
    const nameWidth = holding.name.length * 4.5 + 2;
    const totalWidth = labelWidth + nameWidth;

    return (
      <g key={`holding-label-${index}`} className="feature-name-label">
        {/* Outer border around entire label */}
        <rect
          x={x - totalWidth / 2}
          y={y + 14}
          width={totalWidth}
          height="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          rx="2"
        />
        {/* Colored background for label prefix */}
        <rect
          x={x - totalWidth / 2 + 1}
          y={y + 15}
          width={labelWidth - 1}
          height="12"
          fill={labelColor}
          rx="1"
        />
        {/* Label prefix text */}
        <text
          x={x - totalWidth / 2 + labelWidth / 2}
          y={y + 23}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="white"
          fontWeight="bold"
        >
          {label}
        </text>
        {/* Name text - left justified */}
        <text
          x={x - totalWidth / 2 + labelWidth + 1}
          y={y + 23}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="8"
          fill="black"
        >
          {holding.name}
        </text>
      </g>
    );
  };

  const renderLandmarkLabel = (landmark, index) => {
    const { x, y } = hexUtils.hexToWorld(landmark.row, landmark.col, hexSize);
    if (!landmark.name) return null;

    const label = getLandmarkLabel(landmark, landmarks);
    const labelWidth = label.length * 6 + 2;
    const nameWidth = landmark.name.length * 4.5 + 2;
    const totalWidth = labelWidth + nameWidth;

    return (
      <g key={`landmark-label-${index}`} className="feature-name-label">
        {/* Outer border around entire label */}
        <rect
          x={x - totalWidth / 2}
          y={y + 14}
          width={totalWidth}
          height="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          rx="2"
        />
        {/* Green background for label prefix */}
        <rect
          x={x - totalWidth / 2 + 1}
          y={y + 15}
          width={labelWidth - 1}
          height="12"
          fill={LANDMARK_COLOR}
          rx="1"
        />
        {/* Label prefix text */}
        <text
          x={x - totalWidth / 2 + labelWidth / 2}
          y={y + 23}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="white"
          fontWeight="bold"
        >
          {label}
        </text>
        {/* Name text - left justified */}
        <text
          x={x - totalWidth / 2 + labelWidth + 1}
          y={y + 23}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="8"
          fill="black"
        >
          {landmark.name}
        </text>
      </g>
    );
  };

  const renderMythLabel = (myth, index) => {
    const { x, y } = hexUtils.hexToWorld(myth.row, myth.col, hexSize);
    if (!myth.name) return null;

    const label = getMythLabel(myth, myths);
    const labelWidth = label.length * 6 + 2;
    const nameWidth = myth.name.length * 4.5 + 2;
    const totalWidth = labelWidth + nameWidth;

    return (
      <g key={`myth-label-${index}`} className="feature-name-label">
        {/* Outer border around entire label */}
        <rect
          x={x - totalWidth / 2}
          y={y + 14}
          width={totalWidth}
          height="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          rx="2"
        />
        {/* Purple background for label prefix */}
        <rect
          x={x - totalWidth / 2 + 1}
          y={y + 15}
          width={labelWidth - 1}
          height="12"
          fill={MYTH_COLOR}
          rx="1"
        />
        {/* Label prefix text */}
        <text
          x={x - totalWidth / 2 + labelWidth / 2}
          y={y + 23}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="white"
          fontWeight="bold"
        >
          {label}
        </text>
        {/* Name text - left justified */}
        <text
          x={x - totalWidth / 2 + labelWidth + 1}
          y={y + 23}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="8"
          fill="black"
        >
          {myth.name}
        </text>
      </g>
    );
  };

  return (
    <g className="feature-name-labels pointer-events-none">
      {holdings.map((holding, index) => renderHoldingLabel(holding, index))}
      {landmarks.map((landmark, index) => renderLandmarkLabel(landmark, index))}
      {myths.map((myth, index) => renderMythLabel(myth, index))}
    </g>
  );
};

export default FeatureNameLabels;
