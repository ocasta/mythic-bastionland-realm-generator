const FEATURE_COLORS = {
  holding: '#2563eb',      // Blue
  seatOfPower: '#fbbf24',  // Gold/amber
  landmark: '#22c55e',     // Green
  myth: '#9333ea',         // Purple
};

const FeatureMarker = ({
  x,
  y,
  label,
  featureType,
  isSeatOfPower = false,
  paintingMode = false,
  riverDrawingMode = false,
  draggingFeature = null,
  onDragStart
}) => {
  const color = featureType === 'holding' && isSeatOfPower
    ? FEATURE_COLORS.seatOfPower
    : FEATURE_COLORS[featureType];

  const showStroke = featureType === 'holding' && isSeatOfPower;
  const isDisabled = paintingMode || riverDrawingMode || draggingFeature;

  const handleMouseDown = (e) => {
    if (!isDisabled && onDragStart) {
      e.stopPropagation();
      onDragStart();
    }
  };

  return (
    <g
      className={isDisabled ? 'pointer-events-none' : 'cursor-grab'}
      onMouseDown={handleMouseDown}
    >
      <circle
        cx={x}
        cy={y}
        r="12"
        fill={color}
        stroke={showStroke ? '#000000' : 'none'}
        strokeWidth={showStroke ? 2 : 0}
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
        {label}
      </text>
    </g>
  );
};

export { FEATURE_COLORS };
export default FeatureMarker;
