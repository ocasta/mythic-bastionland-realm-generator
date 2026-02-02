import TerrainSwatch from './TerrainSwatch';

const TerrainLegend = ({ terrainTypes }) => {
  return (
    <div className="mr-4">
      <h4 className="font-semibold mb-1 text-gray-900 dark:text-white">Terrain Types:</h4>
      <div className="flex flex-wrap gap-2">
        {terrainTypes.map((terrain) => (
          <div key={terrain.type} className="flex items-center gap-1">
            <TerrainSwatch terrain={terrain} size="md" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{terrain.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerrainLegend;
