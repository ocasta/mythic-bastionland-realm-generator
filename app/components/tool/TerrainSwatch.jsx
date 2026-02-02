const SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

const TerrainSwatch = ({ terrain, size = 'md', className = '' }) => {
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div
      className={`${sizeClass} border border-gray-300 dark:border-gray-600 flex-shrink-0 ${className}`}
      style={{
        backgroundColor: terrain.color,
        backgroundImage: terrain.image ? `url(${terrain.image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
};

export default TerrainSwatch;
