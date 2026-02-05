const FEATURE_COLORS = {
  holding: '#2563eb',      // Blue
  seatOfPower: '#fbbf24',  // Gold/amber
  landmark: '#22c55e',     // Green
  myth: '#9333ea',         // Purple
};

// Map landmark types to their icon files
const LANDMARK_ICONS = {
  'Dwelling': '/dwellings.svg',
  'Sanctum': '/sanctum.svg',
  'Monument': '/monument.svg',
  'Hazard': '/hazards.svg',
  'Curse': '/cursed.svg',
  'Ruin': '/ruins.svg',
};

// Holding icons
const HOLDING_ICONS = {
  seatOfPower: '/castle.svg',
  holding: '/town.svg',
};

const FeatureMarker = ({
  x,
  y,
  label,
  featureType,
  isSeatOfPower = false,
  landmarkType = null,
  paintingMode = false,
  riverDrawingMode = false,
  draggingFeature = null,
  onDragStart
}) => {
  const color = featureType === 'holding' && isSeatOfPower
    ? FEATURE_COLORS.seatOfPower
    : FEATURE_COLORS[featureType];

  const isDisabled = paintingMode || riverDrawingMode || draggingFeature;

  const handleMouseDown = (e) => {
    if (!isDisabled && onDragStart) {
      e.stopPropagation();
      onDragStart();
    }
  };

  // Holdings use an image only (label is merged into feature name label)
  if (featureType === 'holding') {
    const iconPath = isSeatOfPower ? HOLDING_ICONS.seatOfPower : HOLDING_ICONS.holding;
    const iconSize = 48;

    return (
      <g
        className={isDisabled ? 'pointer-events-none' : 'cursor-grab'}
        onMouseDown={handleMouseDown}
      >
        <image
          href={iconPath}
          x={x - iconSize / 2}
          y={y - iconSize / 2}
          width={iconSize}
          height={iconSize}
        />
      </g>
    );
  }

  // Landmarks use an image only (label is merged into feature name label)
  if (featureType === 'landmark' && landmarkType) {
    const iconPath = LANDMARK_ICONS[landmarkType] || LANDMARK_ICONS['Dwelling'];
    const iconSize = 64;

    return (
      <g
        className={isDisabled ? 'pointer-events-none' : 'cursor-grab'}
        onMouseDown={handleMouseDown}
      >
        <image
          href={iconPath}
          x={x - iconSize / 2}
          y={y - iconSize / 2}
          width={iconSize}
          height={iconSize}
        />
      </g>
    );
  }

  // Default rendering for myths (circle only, label merged into feature name label)
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
      />
    </g>
  );
};

export { FEATURE_COLORS, LANDMARK_ICONS, HOLDING_ICONS };
export default FeatureMarker;
