import { hexUtils } from '../../../utils/hexUtils';

/**
 * Renders name labels below features on the hex map.
 * Shows feature names in small boxes below holdings, landmarks, and myths.
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

  return (
    <g className="feature-name-labels pointer-events-none">
      {holdings.map((holding, index) => renderLabel(holding, index, 'holding'))}
      {landmarks.map((landmark, index) => renderLabel(landmark, index, 'landmark'))}
      {myths.map((myth, index) => renderLabel(myth, index, 'myth'))}
    </g>
  );
};

export default FeatureNameLabels;
