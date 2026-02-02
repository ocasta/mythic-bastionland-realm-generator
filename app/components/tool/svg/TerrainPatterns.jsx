/**
 * SVG pattern definitions for terrain tiles.
 * Renders pattern elements that can be referenced by hex tiles using fill="url(#terrain-{type})".
 */
const TerrainPatterns = ({ terrainTypes, terrainStyle }) => {
  const terrainsWithImages = terrainTypes.filter((terrain) => terrain.image);

  if (terrainsWithImages.length === 0) {
    return null;
  }

  // Comic style needs more horizontal overflow to hide edge seams
  const isComic = terrainStyle === 'comic';
  const xOffset = isComic ? -0.25 : -0.12;
  const yOffset = isComic ? -0.12 : -0.06;
  const imgWidth = isComic ? 1.5 : 1.24;
  const imgHeight = isComic ? 1.24 : 1.12;

  return (
    <defs>
      {terrainsWithImages.map((terrain) => (
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
      ))}
    </defs>
  );
};

export default TerrainPatterns;
