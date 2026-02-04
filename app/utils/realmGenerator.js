import { terrainTypes, forEachHex } from "./hexUtils";
import { Realm, Hex } from "./realmModel";
import landmarksData from "../data/landmarks.json";
import mythsData from "../data/myths.json";
import seersData from "../data/seers.json";

/**
 * Creates a random picker function that avoids duplicates until the pool is exhausted.
 * @param {Array|Function} pool - The pool of items to pick from, or a function that returns the pool
 * @returns {Function} A picker function that returns a random item from the pool
 */
function createRandomPicker(pool) {
  const picked = new Set();

  return (dynamicPool = null) => {
    // Use dynamic pool if provided (for landmarks by type), otherwise use static pool
    const currentPool = dynamicPool || (typeof pool === 'function' ? pool() : pool);
    let available = currentPool.filter(item => !picked.has(item));

    // If all items have been picked, reset and use all items
    if (available.length === 0) {
      picked.clear();
      available = [...currentPool];
    }

    const selected = available[Math.floor(Math.random() * available.length)];
    picked.add(selected);
    return selected;
  };
}

const holdingStyles = [
  "Dark", "Ruined", "Hostile", "Ancient", "Ornate", "Wild",
  "Pristine", "Fortified", "Unfinished", "Welcoming", "Proud", "Bright"
];

const holdingFeatures = [
  "Turrets", "Tower", "Wall", "Battlements", "Citadel", "Gate",
  "Spire", "Dome", "Beacons", "Bridge", "Pillars", "Moat"
];

const seatOfPowerFeatures = [
  "Hearth", "Throne", "Musicians", "Pool", "Advisers", "Servants",
  "Shrine", "Table", "Reliquary", "Cauldron", "Chandelier", "Guards"
];

const seatOfPowerDecorations = [
  "Antlers", "Silver", "Heraldry", "Bones", "Flowers", "Scripture",
  "Jewels", "Wreaths", "Candles", "Fur", "Tapestries", "Shields"
];

const baileyNames = [
  "Filthy Marketplace", "Abandoned Forge", "Joyous Library", "Sophisticated Fountain",
  "Industrious Temple", "Humble Forum", "Majestic Tomb", "Hallowed Garden",
  "Rustic Hall", "Solemn Workshops", "Bustling Arena", "Immaculate Garrison"
];

const keepFeatures = [
  "Hearth", "Throne", "Musicians", "Pool", "Advisers", "Servants",
  "Shrine", "Table", "Reliquary", "Cauldron", "Chandelier", "Guards"
];

const keepDecorations = [
  "Antlers", "Silver", "Heraldry", "Bones", "Flowers", "Scripture",
  "Jewels", "Wreaths", "Candles", "Fur", "Tapestries", "Shields"
];

const foodAdjectives = [
  "Spiced", "Herbal", "Crunchy", "Sour", "Dry", "Fermented",
  "Salted", "Wet", "Fatty", "Chewy", "Sweet", "Mild"
];

const foodItems = [
  "Fish", "Fruit", "Stew", "Mushrooms", "Pie", "Cheese",
  "Nuts", "Cake", "Porridge", "Bread", "Vegetable", "Meat"
];

const goodsAdjectives = [
  "Military", "Abundant", "Traditional", "Specialist", "Industrious", "Innovative",
  "Secretive", "Simple", "Strong", "Decorated", "Fine", "Lucky"
];

const goodsItems = [
  "Textile", "Livestock", "Grain", "Mead", "Tools", "Stone",
  "Wood", "Pottery", "Metal", "Leather", "Honey", "Herb"
];

const luxuriesAdjectives = [
  "Antique", "Intricate", "Unique", "Scarce", "Hazardous", "Flawless",
  "Luminous", "Lost", "Esoteric", "Sacred", "Mythical", "Beautiful"
];

const luxuriesItems = [
  "Jewel", "Wine", "Spice", "Fragrance", "Silk", "Fur",
  "Artwork", "Sword", "Creature", "Ore", "Root", "Scripture"
];

const dramaThemes = [
  "Betrayal", "Jealousy", "Rivalry", "Infidelity", "Coup", "Ambition",
  "Redemption", "Revelation", "Wrath", "Greed", "Banishment", "Manipulation"
];

const dramaElements = [
  "Brawl", "Poison", "Oath", "Feast", "Letters", "Disguise",
  "Inheritance", "Assassin", "Family", "Alcohol", "Blackmail", "Gold"
];

const woeAdjectives = [
  "Secretive", "Violent", "Looming", "Sudden", "Ongoing", "Prophecised",
  "Mysterious", "Sanctioned", "Unseen", "Vast", "Escalating", "Concealed"
];

const woeEvents = [
  "Disease", "Famine", "Raids", "Invasion", "Abduction", "Storm",
  "Fire", "Revolt", "Exodus", "Beast", "Killing", "Theft"
];

const newsEvents = [
  "Duel", "Birth", "Market", "Trial", "Ritual", "Mercenaries",
  "Festival", "Tournament", "Punishment", "Performance", "Death", "Marriage"
];

const newsMoods = [
  "Pensive", "Joyous", "Content", "Divided", "Furious", "Sceptical",
  "Adoring", "Nostalgic", "Unified", "Bleak", "Solemn", "Optimistic"
];

// Ruler detail tables
const appearanceCol1 = [
  "Delicate", "Short", "Robust", "Hard", "Haggard", "Cold",
  "Warm", "Youthful", "Soft", "Sickly", "Tall", "Rough"
];
const appearanceCol2 = [
  "Armoured", "Tattered", "Vibrant", "Crude", "Eclectic", "Traditional",
  "Comfortable", "Gaudy", "Drab", "Decorated", "Functional", "Elegant"
];

const voiceCol1 = [
  "Whispering", "Soothing", "Smooth", "Flat", "Mumbled", "Weak",
  "Strong", "Hesitant", "Melodic", "Gravelly", "Erratic", "Booming"
];
const voiceCol2 = [
  "Formal", "Poetic", "Precise", "Intense", "Rambling", "Detached",
  "Passionate", "Terse", "Relaxed", "Blunt", "Boisterous", "Friendly"
];

const personalityCol1 = [
  "Cautious", "Spiritual", "Intellectual", "Ambitious", "Serene", "Righteous",
  "Empathetic", "Unstable", "Prying", "Melancholic", "Cynical", "Rash"
];
const personalityCol2 = [
  "Botany", "History", "Music", "Gambling", "Animals", "Art",
  "Cookery", "Craft", "Fishing", "Fashion", "Hunting", "Stories"
];

const relationshipCol1 = [
  "Adoring", "Reluctant", "Secret", "Estranged", "Hateful", "Distant",
  "Harmonious", "Intimate", "Recent", "Sworn", "Tumultuous", "Resentful"
];
const relationshipCol2 = [
  "Kin", "Friend", "Lover", "Spouse", "Supporter", "Ally",
  "Rival", "Successor", "Mentor", "Peer", "Enemy", "Guardian"
];

const desireCol1 = [
  "Escape", "Wealth", "Status", "Knowledge", "Mastery", "Heirloom",
  "Marriage", "Truth", "Travel", "Power", "Security", "Forgiveness"
];
const desireCol2 = [
  "Freedom", "Love", "Legacy", "Recovery", "Revenge", "Duty",
  "Fear", "Guilt", "Recognition", "Defiance", "Curiosity", "Hatred"
];

const backgroundCol1 = [
  "Deprived", "Pious", "Outcast", "Military", "Insular", "Nomadic",
  "Drudgery", "Mercantile", "Feral", "Prestigious", "Academic", "Pampered"
];
const backgroundCol2 = [
  "War", "Migration", "Riding", "Study", "Exile", "Joy",
  "Sickness", "Escape", "Injury", "Friendship", "Execution", "Romance"
];

const ailmentCol1 = [
  "Hidden", "Mild", "Intermittent", "Growing", "Medicated", "Denied",
  "Unexplained", "Constant", "Diminishing", "Permanent", "Debilitating", "Obvious"
];
const ailmentCol2 = [
  "Insomnia", "Migraines", "Arthritis", "Nausea", "Fixation", "Blindness",
  "Deafness", "Melancholy", "Shaking", "Frailty", "Coughing", "Lethargy"
];

const heraldryCol1 = [
  "Light", "Hot", "Earthy", "Rich", "Metallic", "Brilliant",
  "Grey", "Jewelled", "Subdued", "Airy", "Cold", "Dark"
];
const heraldryCol2 = [
  "Beast", "Bird", "Fish", "Weapon", "Crown", "Tree",
  "Flower", "Bodypart", "Structure", "Ring", "Tool", "Star"
];

export function generateHoldingName(isSeatOfPower = false) {
  if (isSeatOfPower) {
    const featureRoll = Math.floor(Math.random() * 12);
    const decorationRoll = Math.floor(Math.random() * 12);
    return `${seatOfPowerFeatures[featureRoll]} of ${seatOfPowerDecorations[decorationRoll]}`;
  }
  const styleRoll = Math.floor(Math.random() * 12);
  const featureRoll = Math.floor(Math.random() * 12);
  return `${holdingStyles[styleRoll]} ${holdingFeatures[featureRoll]}`;
}

export function generateBaileyName() {
  const roll = Math.floor(Math.random() * 12);
  return baileyNames[roll];
}

export function generateKeepName() {
  const featureRoll = Math.floor(Math.random() * 12);
  const decorationRoll = Math.floor(Math.random() * 12);
  return `${keepFeatures[featureRoll]} of ${keepDecorations[decorationRoll]}`;
}

export function generateFoodName() {
  const adjRoll = Math.floor(Math.random() * 12);
  const itemRoll = Math.floor(Math.random() * 12);
  return `${foodAdjectives[adjRoll]} ${foodItems[itemRoll]}`;
}

export function generateGoodsName() {
  const adjRoll = Math.floor(Math.random() * 12);
  const itemRoll = Math.floor(Math.random() * 12);
  return `${goodsAdjectives[adjRoll]} ${goodsItems[itemRoll]}`;
}

export function generateLuxuriesName() {
  const adjRoll = Math.floor(Math.random() * 12);
  const itemRoll = Math.floor(Math.random() * 12);
  return `${luxuriesAdjectives[adjRoll]} ${luxuriesItems[itemRoll]}`;
}

export function generateDramaName() {
  const themeRoll = Math.floor(Math.random() * 12);
  const elementRoll = Math.floor(Math.random() * 12);
  return `${dramaThemes[themeRoll]} ${dramaElements[elementRoll]}`;
}

export function generateWoeName() {
  const adjRoll = Math.floor(Math.random() * 12);
  const eventRoll = Math.floor(Math.random() * 12);
  return `${woeAdjectives[adjRoll]} ${woeEvents[eventRoll]}`;
}

export function generateNewsName() {
  const eventRoll = Math.floor(Math.random() * 12);
  const moodRoll = Math.floor(Math.random() * 12);
  return `${newsEvents[eventRoll]} ${newsMoods[moodRoll]}`;
}

export function generateAppearanceName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${appearanceCol1[roll1]} ${appearanceCol2[roll2]}`;
}

export function generateVoiceName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${voiceCol1[roll1]} ${voiceCol2[roll2]}`;
}

export function generatePersonalityName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${personalityCol1[roll1]} ${personalityCol2[roll2]}`;
}

export function generateRelationshipName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${relationshipCol1[roll1]} ${relationshipCol2[roll2]}`;
}

export function generateDesireName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${desireCol1[roll1]} ${desireCol2[roll2]}`;
}

export function generateBackgroundName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${backgroundCol1[roll1]} ${backgroundCol2[roll2]}`;
}

export function generateAilmentName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${ailmentCol1[roll1]} ${ailmentCol2[roll2]}`;
}

export function generateHeraldryName() {
  const roll1 = Math.floor(Math.random() * 12);
  const roll2 = Math.floor(Math.random() * 12);
  return `${heraldryCol1[roll1]} ${heraldryCol2[roll2]}`;
}

export const holdingDetailTypes = ['None', 'Holding', 'Bailey', 'Keep', 'Food', 'Goods', 'Luxuries', 'Drama', 'Woe', 'News'];

export const rulerDetailTypes = ['None', 'Appearance', 'Voice', 'Personality', 'Relationship', 'Desire', 'Background', 'Ailment', 'Heraldry'];

export function generateRulerDetailName(detailType) {
  switch (detailType) {
    case 'Appearance':
      return generateAppearanceName();
    case 'Voice':
      return generateVoiceName();
    case 'Personality':
      return generatePersonalityName();
    case 'Relationship':
      return generateRelationshipName();
    case 'Desire':
      return generateDesireName();
    case 'Background':
      return generateBackgroundName();
    case 'Ailment':
      return generateAilmentName();
    case 'Heraldry':
      return generateHeraldryName();
    case 'None':
    default:
      return '';
  }
}

export function generateDefaultRulerDetails() {
  return [
    { type: 'Appearance', name: generateAppearanceName() },
    { type: 'Voice', name: generateVoiceName() },
    { type: 'Personality', name: generatePersonalityName() },
    { type: 'None', name: '' },
    { type: 'None', name: '' },
    { type: 'None', name: '' }
  ];
}

export function generateHoldingDetailName(detailType) {
  switch (detailType) {
    case 'Holding':
      return generateHoldingName(false);
    case 'Bailey':
      return generateBaileyName();
    case 'Keep':
      return generateKeepName();
    case 'Food':
      return generateFoodName();
    case 'Goods':
      return generateGoodsName();
    case 'Luxuries':
      return generateLuxuriesName();
    case 'Drama':
      return generateDramaName();
    case 'Woe':
      return generateWoeName();
    case 'News':
      return generateNewsName();
    case 'None':
    default:
      return '';
  }
}

export function generateDefaultHoldingDetails(isSeatOfPower) {
  return [
    { type: 'Holding', name: generateHoldingName(isSeatOfPower) },
    { type: 'Bailey', name: generateBaileyName() },
    { type: 'Keep', name: generateKeepName() },
    { type: 'None', name: '' },
    { type: 'None', name: '' },
    { type: 'None', name: '' }
  ];
}

const quickStartMyths = [
  "The Wurm",
  "The Underworld",
  "The Dead",
  "The Order",
  "The Child",
  "The Forest",
  "The Goblin",
  "The Wyvern",
  "The River",
  "The Shadow",
  "The Wall",
  "The Plague"
];

const quickStartSeers = [
  "The Rotted Seer",
  "The Swollen Seer",
  "The Entombed Seer",
  "The Reed Seer",
  "The Loathed Seer",
  "The Lost Seer",
  "The Carved Seer",
  "The Enthroned Seer",
  "The Jewelled Seer",
  "The Jawbone Seer",
  "The Veiled Seer",
  "The Serpent Seer"
];

// Create pickers using the factory function
const landmarkPicker = createRandomPicker([]);
const seerPicker = createRandomPicker(seersData);
const quickStartSeerPicker = createRandomPicker(quickStartSeers);
const mythPicker = createRandomPicker(mythsData);
const quickStartMythPicker = createRandomPicker(quickStartMyths);

export function pickRandomLandmarkType() {
  const availableTypes = Object.keys(landmarksData);
  return availableTypes[Math.floor(Math.random() * availableTypes.length)];
}

export function pickRandomLandmark(type) {
  return landmarkPicker(landmarksData[type]);
}

export function pickRandomSeer(useQuickStartOnly = false) {
  return useQuickStartOnly ? quickStartSeerPicker() : seerPicker();
}

export function pickRandomMyth(useQuickStartOnly = false) {
  return useQuickStartOnly ? quickStartMythPicker() : mythPicker();
}

export class RealmGenerator {
  static defaultDimensions = { rows: 12, cols: 12 };

  static createRealm(rows = RealmGenerator.defaultDimensions.rows, cols = RealmGenerator.defaultDimensions.cols) {
    return new Realm(rows, cols);
  }

  static generateRealm(terrainStrategy, options = {}) {
    const rows = options.rows ?? RealmGenerator.defaultDimensions.rows;
    const cols = options.cols ?? RealmGenerator.defaultDimensions.cols;
    const holdings = options.holdings ?? 4;
    const landmarks = options.landmarks ?? 4;
    const myths = options.myths ?? 6;
    const useQuickStartLists = options.useQuickStartLists ?? false;

    const realm = this.createRealm(rows, cols);
    RealmGenerator.generateTerrain(realm, terrainStrategy);

    // Generate features in order of strictest constraints first
    RealmGenerator.generateHoldings(realm, holdings);    // Holdings first (most restrictive)
    RealmGenerator.generateLandmarks(realm, landmarks, useQuickStartLists);  // Landmarks second
    RealmGenerator.generateMyths(realm, myths, useQuickStartLists);  // Myths last (depends on holdings)

    return realm;
  }

  static pickRandomLocation(realm) {
    const row = Math.floor(Math.random() * realm.rows);
    const col = Math.floor(Math.random() * realm.cols);
    return { row, col };
  }

  /**
   * Calculate hex distance between two positions
   * Uses proper hexagonal grid distance calculation
   */
  static calculateHexDistance(pos1, pos2) {
    // Convert rectangular coordinates to hex coordinates
    // For offset coordinates (odd-r layout), we need to adjust
    const col1 = pos1.col - Math.floor((pos1.row - (pos1.row % 2)) / 2);
    const col2 = pos2.col - Math.floor((pos2.row - (pos2.row % 2)) / 2);
    
    const dx = col1 - col2;
    const dy = pos1.row - pos2.row;
    const dz = -dx - dy;
    
    // Hex distance is the maximum of the absolute values
    return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
  }

  /**
   * Check if a position has any feature (holding, landmark, or myth)
   */
  static hasFeatureAtPosition(realm, row, col) {
    const hasHolding = realm.holdings.some(h => h.row === row && h.col === col);
    const hasLandmark = realm.landmarks.some(l => l.row === row && l.col === col);
    const hasMyth = realm.myths.some(m => m.row === row && m.col === col);
    return hasHolding || hasLandmark || hasMyth;
  }

  /**
   * Check if a position is valid for a holding
   */
  static isValidHoldingPosition(realm, row, col) {
    // Rule 1: No feature at this location
    if (this.hasFeatureAtPosition(realm, row, col)) {
      return false;
    }

    // Rule 2: Holdings must be at least 3 hexes from each other
    for (const holding of realm.holdings) {
      const distance = this.calculateHexDistance({ row, col }, { row: holding.row, col: holding.col });
      if (distance < 3) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a position is valid for a landmark
   */
  static isValidLandmarkPosition(realm, row, col) {
    // Rule 1: No feature at this location
    if (this.hasFeatureAtPosition(realm, row, col)) {
      return false;
    }

    // Rule 2: Landmarks must be at least 1 hex from any other feature
    const allFeatures = [
      ...realm.holdings.map(h => ({ row: h.row, col: h.col })),
      ...realm.landmarks.map(l => ({ row: l.row, col: l.col })),
      ...realm.myths.map(m => ({ row: m.row, col: m.col }))
    ];

    for (const feature of allFeatures) {
      const distance = this.calculateHexDistance({ row, col }, feature);
      if (distance <= 1) { // Changed from < 1 to <= 1 to ensure at least 1 hex distance
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a position is valid for a myth
   */
  static isValidMythPosition(realm, row, col) {
    // Rule 1: No feature at this location
    if (this.hasFeatureAtPosition(realm, row, col)) {
      return false;
    }

    // Rule 2: Myths must be at least 3 hexes from holdings
    for (const holding of realm.holdings) {
      const distance = this.calculateHexDistance({ row, col }, { row: holding.row, col: holding.col });
      if (distance < 3) {
        return false;
      }
    }

    // Rule 3: Myths must be at least 3 hexes from other myths
    for (const myth of realm.myths) {
      const distance = this.calculateHexDistance({ row, col }, { row: myth.row, col: myth.col });
      if (distance < 3) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find a valid position with multiple attempts
   */
  static findValidPosition(realm, validationFn, maxAttempts = 100) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { row, col } = this.pickRandomLocation(realm);
      if (validationFn(realm, row, col)) {
        return { row, col };
      }
    }
    return null; // Could not find valid position
  }

  static generateHoldings(realm, count = 4) {
    for (let i = 0; i < count; i++) {
      const position = this.findValidPosition(realm, this.isValidHoldingPosition.bind(this));
      if (position) {
        const isSeatOfPower = i === 0;
        const details = generateDefaultHoldingDetails(isSeatOfPower);
        const holdingName = details[0].name;
        const rulerDetails = generateDefaultRulerDetails();
        realm.addHolding(position.row, position.col, isSeatOfPower, holdingName, details, "", rulerDetails);
      } else {
        console.warn(`Could not place holding ${i + 1} due to placement constraints`);
      }
    }
  }

  static generateLandmarks(realm, count = 4, useQuickStartOnly = false) {
    for (let i = 0; i < count; i++) {
      const position = this.findValidPosition(realm, this.isValidLandmarkPosition.bind(this));
      if (position) {
        const type = pickRandomLandmarkType();
        const label = pickRandomLandmark(type);
        const seer = type === "Sanctum" ? pickRandomSeer(useQuickStartOnly) : null;
        realm.addLandmark(position.row, position.col, type, label, seer);
      } else {
        console.warn(`Could not place landmark ${i + 1} due to placement constraints`);
      }
    }
  }

  static generateMyths(realm, count = 6, useQuickStartOnly = false) {
    for (let i = 0; i < count; i++) {
      const position = this.findValidPosition(realm, this.isValidMythPosition.bind(this));
      if (position) {
        const name = pickRandomMyth(useQuickStartOnly);
        realm.addMyth(position.row, position.col, name);
      } else {
        console.warn(`Could not place myth ${i + 1} due to placement constraints`);
      }
    }
  }

  static generateTerrain(realm, terrainStrategy) {
    if(terrainStrategy === "random") {
      return this.generateRandomTerrain(realm);
    } else if(terrainStrategy === "balanced") {
      return this.generateBalancedTerrain(realm);
    } else if(terrainStrategy === "clustered") {
      return this.generateClusteredTerrain(realm);
    } else if(terrainStrategy === "weighted") {
      return this.generateWeightedTerrain(realm);
    }
  }

  static generateRandomTerrain(realm) {
    return TerrainGenerator.generateRandomTerrain(
      realm,
      realm.rows,
      realm.cols
    );
  }

  static generateBalancedTerrain(realm) {
    return TerrainGenerator.generateBalancedTerrain(
      realm,
      realm.rows,
      realm.cols
    );
  }

  static generateWeightedTerrain(realm) {
    return TerrainGenerator.generateWeightedTerrain(
      realm,
      realm.rows,
      realm.cols
    );
  }

  static generateClusteredTerrain(realm) {
    return TerrainGenerator.generateClusteredTerrain(
      realm,
      realm.rows,
      realm.cols
    );
  }
}

/**
 * Random terrain generation utilities
 */
export class TerrainGenerator {
  /**
   * Get available terrain types (excluding empty and city)
   */
  static getAvailableTerrains() {
    return terrainTypes.filter(
      (terrain) => terrain.type !== "empty" && terrain.type !== "city"
    );
  }

  /**
   * Create a new realm with given dimensions
   */
  static createRealm(rows, cols) {
    return new Realm(rows, cols);
  }

  /**
   * Select a random terrain from available terrains
   */
  static selectRandomTerrain(availableTerrains) {
    return availableTerrains[
      Math.floor(Math.random() * availableTerrains.length)
    ];
  }

  /**
   * Generate all possible positions for a grid
   */
  static generateAllPositions(rows, cols) {
    const positions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        positions.push({ row, col });
      }
    }
    return positions;
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Fill all hexes in a realm with random terrain
   */
  static fillWithRandomTerrain(realm, rows, cols, availableTerrains) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const randomTerrain = this.selectRandomTerrain(availableTerrains);
        realm.setHex(row, col, randomTerrain);
      }
    }
  }
  /**
   * Generate completely random terrain
   */
  static generateRandomTerrain(realm, rows = 12, cols = 12) {
    const availableTerrains = this.getAvailableTerrains();

    this.fillWithRandomTerrain(realm, rows, cols, availableTerrains);

    return realm;
  }

  /**
   * Generate terrain ensuring each terrain type appears at least once
   */
  static generateBalancedTerrain(realm, rows = 12, cols = 12) {
    const totalHexes = rows * cols;
    const availableTerrains = this.getAvailableTerrains();

    // Create and shuffle all possible positions
    const positions = this.shuffleArray(this.generateAllPositions(rows, cols));

    let positionIndex = 0;

    // First, place at least one of each terrain type
    availableTerrains.forEach((terrain) => {
      if (positionIndex < totalHexes) {
        const pos = positions[positionIndex];
        realm.setHex(pos.row, pos.col, terrain);
        positionIndex++;
      }
    });

    // Fill remaining positions with random terrain types
    while (positionIndex < totalHexes) {
      const pos = positions[positionIndex];
      const randomTerrain = this.selectRandomTerrain(availableTerrains);
      realm.setHex(pos.row, pos.col, randomTerrain);
      positionIndex++;
    }

    return realm;
  }

  /**
   * Generate terrain with weighted distribution
   */
  static generateWeightedTerrain(realm, rows = 12, cols = 12, weights = null) {
    const availableTerrains = this.getAvailableTerrains();

    // Default weights favor more common terrain types
    const defaultWeights = {
      plains: 0.35,
      forest: 0.25,
      mountain: 0.18,
      water: 0.15,
      desert: 0.04,
      swamp: 0.03,
    };

    const terrainWeights = weights || defaultWeights;

    // Create weighted array
    const weightedTerrains = [];
    availableTerrains.forEach((terrain) => {
      const weight = terrainWeights[terrain.type] || 0.1;
      const count = Math.floor(weight * 100); // Convert to integer for array repetition
      for (let i = 0; i < count; i++) {
        weightedTerrains.push(terrain);
      }
    });

    // Generate terrain
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const randomTerrain = this.selectRandomTerrain(weightedTerrains);
        realm.setHex(row, col, randomTerrain);
      }
    }

    return realm;
  }

  /**
   * Generate terrain with clustered regions (more realistic)
   */
  static generateClusteredTerrain(realm, rows = 12, cols = 12) {
    const visited = Array(rows)
      .fill()
      .map(() => Array(cols).fill(false));
    const availableTerrains = this.getAvailableTerrains();

    // Generate seed points for different terrain types
    const seedCount = Math.min(
      availableTerrains.length,
      Math.floor((rows * cols) / 8)
    );
    const seeds = [];

    for (let i = 0; i < seedCount; i++) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      const terrain = availableTerrains[i % availableTerrains.length];
      seeds.push({ row, col, terrain });
    }

    // Grow clusters from seed points
    seeds.forEach((seed) => {
      const queue = [seed];
      const clusterSize = Math.floor(Math.random() * 8) + 3; // 3-10 hexes per cluster
      let grown = 0;

      while (queue.length > 0 && grown < clusterSize) {
        const current = queue.shift();

        if (
          current.row >= 0 &&
          current.row < rows &&
          current.col >= 0 &&
          current.col < cols &&
          !visited[current.row][current.col]
        ) {
          visited[current.row][current.col] = true;
          realm.setHex(current.row, current.col, seed.terrain);
          grown++;

          // Add neighbors to queue with some probability
          const neighbors = [
            { row: current.row - 1, col: current.col },
            { row: current.row + 1, col: current.col },
            { row: current.row, col: current.col - 1 },
            { row: current.row, col: current.col + 1 },
          ];

          neighbors.forEach((neighbor) => {
            if (Math.random() < 0.6) {
              // 60% chance to spread to neighbor
              queue.push({ ...neighbor, terrain: seed.terrain });
            }
          });
        }
      }
    });

    // Fill remaining unvisited hexes with random terrain
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!visited[row][col]) {
          const randomTerrain = this.selectRandomTerrain(availableTerrains);
          realm.setHex(row, col, randomTerrain);
        }
      }
    }

    return realm;
  }
}

export default { Realm, Hex, TerrainGenerator };
