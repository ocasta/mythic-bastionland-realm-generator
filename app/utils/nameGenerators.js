/**
 * Consolidated name generation functions using a factory pattern
 * Replaces duplicate name generator code across the codebase
 */

// Word lists for name generation
const wordLists = {
  holdingStyles: [
    "Dark", "Ruined", "Hostile", "Ancient", "Ornate", "Wild",
    "Pristine", "Fortified", "Unfinished", "Welcoming", "Proud", "Bright"
  ],
  holdingFeatures: [
    "Turrets", "Tower", "Wall", "Battlements", "Citadel", "Gate",
    "Spire", "Dome", "Beacons", "Bridge", "Pillars", "Moat"
  ],
  seatOfPowerFeatures: [
    "Hearth", "Throne", "Musicians", "Pool", "Advisers", "Servants",
    "Shrine", "Table", "Reliquary", "Cauldron", "Chandelier", "Guards"
  ],
  seatOfPowerDecorations: [
    "Antlers", "Silver", "Heraldry", "Bones", "Flowers", "Scripture",
    "Jewels", "Wreaths", "Candles", "Fur", "Tapestries", "Shields"
  ],
  baileyNames: [
    "Filthy Marketplace", "Abandoned Forge", "Joyous Library", "Sophisticated Fountain",
    "Industrious Temple", "Humble Forum", "Majestic Tomb", "Hallowed Garden",
    "Rustic Hall", "Solemn Workshops", "Bustling Arena", "Immaculate Garrison"
  ],
  keepFeatures: [
    "Hearth", "Throne", "Musicians", "Pool", "Advisers", "Servants",
    "Shrine", "Table", "Reliquary", "Cauldron", "Chandelier", "Guards"
  ],
  keepDecorations: [
    "Antlers", "Silver", "Heraldry", "Bones", "Flowers", "Scripture",
    "Jewels", "Wreaths", "Candles", "Fur", "Tapestries", "Shields"
  ],
  foodAdjectives: [
    "Spiced", "Herbal", "Crunchy", "Sour", "Dry", "Fermented",
    "Salted", "Wet", "Fatty", "Chewy", "Sweet", "Mild"
  ],
  foodItems: [
    "Fish", "Fruit", "Stew", "Mushrooms", "Pie", "Cheese",
    "Nuts", "Cake", "Porridge", "Bread", "Vegetable", "Meat"
  ],
  goodsAdjectives: [
    "Military", "Abundant", "Traditional", "Specialist", "Industrious", "Innovative",
    "Secretive", "Simple", "Strong", "Decorated", "Fine", "Lucky"
  ],
  goodsItems: [
    "Textile", "Livestock", "Grain", "Mead", "Tools", "Stone",
    "Wood", "Pottery", "Metal", "Leather", "Honey", "Herb"
  ],
  luxuriesAdjectives: [
    "Antique", "Intricate", "Unique", "Scarce", "Hazardous", "Flawless",
    "Luminous", "Lost", "Esoteric", "Sacred", "Mythical", "Beautiful"
  ],
  luxuriesItems: [
    "Jewel", "Wine", "Spice", "Fragrance", "Silk", "Fur",
    "Artwork", "Sword", "Creature", "Ore", "Root", "Scripture"
  ],
  dramaThemes: [
    "Betrayal", "Jealousy", "Rivalry", "Infidelity", "Coup", "Ambition",
    "Redemption", "Revelation", "Wrath", "Greed", "Banishment", "Manipulation"
  ],
  dramaElements: [
    "Brawl", "Poison", "Oath", "Feast", "Letters", "Disguise",
    "Inheritance", "Assassin", "Family", "Alcohol", "Blackmail", "Gold"
  ],
  woeAdjectives: [
    "Secretive", "Violent", "Looming", "Sudden", "Ongoing", "Prophecised",
    "Mysterious", "Sanctioned", "Unseen", "Vast", "Escalating", "Concealed"
  ],
  woeEvents: [
    "Disease", "Famine", "Raids", "Invasion", "Abduction", "Storm",
    "Fire", "Revolt", "Exodus", "Beast", "Killing", "Theft"
  ],
  newsEvents: [
    "Duel", "Birth", "Market", "Trial", "Ritual", "Mercenaries",
    "Festival", "Tournament", "Punishment", "Performance", "Death", "Marriage"
  ],
  newsMoods: [
    "Pensive", "Joyous", "Content", "Divided", "Furious", "Sceptical",
    "Adoring", "Nostalgic", "Unified", "Bleak", "Solemn", "Optimistic"
  ],
  appearanceCol1: [
    "Delicate", "Short", "Robust", "Hard", "Haggard", "Cold",
    "Warm", "Youthful", "Soft", "Sickly", "Tall", "Rough"
  ],
  appearanceCol2: [
    "Armoured", "Tattered", "Vibrant", "Crude", "Eclectic", "Traditional",
    "Comfortable", "Gaudy", "Drab", "Decorated", "Functional", "Elegant"
  ],
  voiceCol1: [
    "Whispering", "Soothing", "Smooth", "Flat", "Mumbled", "Weak",
    "Strong", "Hesitant", "Melodic", "Gravelly", "Erratic", "Booming"
  ],
  voiceCol2: [
    "Formal", "Poetic", "Precise", "Intense", "Rambling", "Detached",
    "Passionate", "Terse", "Relaxed", "Blunt", "Boisterous", "Friendly"
  ],
  personalityCol1: [
    "Cautious", "Spiritual", "Intellectual", "Ambitious", "Serene", "Righteous",
    "Empathetic", "Unstable", "Prying", "Melancholic", "Cynical", "Rash"
  ],
  personalityCol2: [
    "Botany", "History", "Music", "Gambling", "Animals", "Art",
    "Cookery", "Craft", "Fishing", "Fashion", "Hunting", "Stories"
  ],
  relationshipCol1: [
    "Adoring", "Reluctant", "Secret", "Estranged", "Hateful", "Distant",
    "Harmonious", "Intimate", "Recent", "Sworn", "Tumultuous", "Resentful"
  ],
  relationshipCol2: [
    "Kin", "Friend", "Lover", "Spouse", "Supporter", "Ally",
    "Rival", "Successor", "Mentor", "Peer", "Enemy", "Guardian"
  ],
  desireCol1: [
    "Escape", "Wealth", "Status", "Knowledge", "Mastery", "Heirloom",
    "Marriage", "Truth", "Travel", "Power", "Security", "Forgiveness"
  ],
  desireCol2: [
    "Freedom", "Love", "Legacy", "Recovery", "Revenge", "Duty",
    "Fear", "Guilt", "Recognition", "Defiance", "Curiosity", "Hatred"
  ],
  backgroundCol1: [
    "Deprived", "Pious", "Outcast", "Military", "Insular", "Nomadic",
    "Drudgery", "Mercantile", "Feral", "Prestigious", "Academic", "Pampered"
  ],
  backgroundCol2: [
    "War", "Migration", "Riding", "Study", "Exile", "Joy",
    "Sickness", "Escape", "Injury", "Friendship", "Execution", "Romance"
  ],
  ailmentCol1: [
    "Hidden", "Mild", "Intermittent", "Growing", "Medicated", "Denied",
    "Unexplained", "Constant", "Diminishing", "Permanent", "Debilitating", "Obvious"
  ],
  ailmentCol2: [
    "Insomnia", "Migraines", "Arthritis", "Nausea", "Fixation", "Blindness",
    "Deafness", "Melancholy", "Shaking", "Frailty", "Coughing", "Lethargy"
  ],
  heraldryCol1: [
    "Light", "Hot", "Earthy", "Rich", "Metallic", "Brilliant",
    "Grey", "Jewelled", "Subdued", "Airy", "Cold", "Dark"
  ],
  heraldryCol2: [
    "Beast", "Bird", "Fish", "Weapon", "Crown", "Tree",
    "Flower", "Bodypart", "Structure", "Ring", "Tool", "Star"
  ],
};

/**
 * Creates a name generator function that combines two word lists
 * @param {string[]} column1 - First word list
 * @param {string[]} column2 - Second word list
 * @param {string} separator - Separator between words (default: " ")
 * @returns {Function} Generator function that returns a random name
 */
export function createNameGenerator(column1, column2, separator = " ") {
  return () => {
    const roll1 = Math.floor(Math.random() * column1.length);
    const roll2 = Math.floor(Math.random() * column2.length);
    return `${column1[roll1]}${separator}${column2[roll2]}`;
  };
}

/**
 * Creates a name generator for "X of Y" style names
 * @param {string[]} column1 - First word list
 * @param {string[]} column2 - Second word list
 * @returns {Function} Generator function
 */
export function createOfNameGenerator(column1, column2) {
  return () => {
    const roll1 = Math.floor(Math.random() * column1.length);
    const roll2 = Math.floor(Math.random() * column2.length);
    return `${column1[roll1]} of ${column2[roll2]}`;
  };
}

/**
 * Creates a single-list picker
 * @param {string[]} list - Word list to pick from
 * @returns {Function} Generator function
 */
export function createSinglePicker(list) {
  return () => {
    const roll = Math.floor(Math.random() * list.length);
    return list[roll];
  };
}

// Pre-built generators
export const generateHoldingName = (isSeatOfPower = false) => {
  if (isSeatOfPower) {
    return createOfNameGenerator(
      wordLists.seatOfPowerFeatures,
      wordLists.seatOfPowerDecorations
    )();
  }
  return createNameGenerator(
    wordLists.holdingStyles,
    wordLists.holdingFeatures
  )();
};

export const generateBaileyName = createSinglePicker(wordLists.baileyNames);

export const generateKeepName = createOfNameGenerator(
  wordLists.keepFeatures,
  wordLists.keepDecorations
);

export const generateFoodName = createNameGenerator(
  wordLists.foodAdjectives,
  wordLists.foodItems
);

export const generateGoodsName = createNameGenerator(
  wordLists.goodsAdjectives,
  wordLists.goodsItems
);

export const generateLuxuriesName = createNameGenerator(
  wordLists.luxuriesAdjectives,
  wordLists.luxuriesItems
);

export const generateDramaName = createNameGenerator(
  wordLists.dramaThemes,
  wordLists.dramaElements
);

export const generateWoeName = createNameGenerator(
  wordLists.woeAdjectives,
  wordLists.woeEvents
);

export const generateNewsName = createNameGenerator(
  wordLists.newsEvents,
  wordLists.newsMoods
);

export const generateAppearanceName = createNameGenerator(
  wordLists.appearanceCol1,
  wordLists.appearanceCol2
);

export const generateVoiceName = createNameGenerator(
  wordLists.voiceCol1,
  wordLists.voiceCol2
);

export const generatePersonalityName = createNameGenerator(
  wordLists.personalityCol1,
  wordLists.personalityCol2
);

export const generateRelationshipName = createNameGenerator(
  wordLists.relationshipCol1,
  wordLists.relationshipCol2
);

export const generateDesireName = createNameGenerator(
  wordLists.desireCol1,
  wordLists.desireCol2
);

export const generateBackgroundName = createNameGenerator(
  wordLists.backgroundCol1,
  wordLists.backgroundCol2
);

export const generateAilmentName = createNameGenerator(
  wordLists.ailmentCol1,
  wordLists.ailmentCol2
);

export const generateHeraldryName = createNameGenerator(
  wordLists.heraldryCol1,
  wordLists.heraldryCol2
);

// Lookup table for detail name generation
const holdingDetailGenerators = {
  Holding: (isSeatOfPower) => generateHoldingName(isSeatOfPower),
  Bailey: generateBaileyName,
  Keep: generateKeepName,
  Food: generateFoodName,
  Goods: generateGoodsName,
  Luxuries: generateLuxuriesName,
  Drama: generateDramaName,
  Woe: generateWoeName,
  News: generateNewsName,
  None: () => '',
};

const rulerDetailGenerators = {
  Appearance: generateAppearanceName,
  Voice: generateVoiceName,
  Personality: generatePersonalityName,
  Relationship: generateRelationshipName,
  Desire: generateDesireName,
  Background: generateBackgroundName,
  Ailment: generateAilmentName,
  Heraldry: generateHeraldryName,
  None: () => '',
};

export function generateHoldingDetailName(detailType, isSeatOfPower = false) {
  const generator = holdingDetailGenerators[detailType];
  if (!generator) return '';
  return detailType === 'Holding' ? generator(isSeatOfPower) : generator();
}

export function generateRulerDetailName(detailType) {
  const generator = rulerDetailGenerators[detailType];
  return generator ? generator() : '';
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

// Export detail type constants
export const holdingDetailTypes = ['None', 'Holding', 'Bailey', 'Keep', 'Food', 'Goods', 'Luxuries', 'Drama', 'Woe', 'News'];
export const rulerDetailTypes = ['None', 'Appearance', 'Voice', 'Personality', 'Relationship', 'Desire', 'Background', 'Ailment', 'Heraldry'];

// Export word lists for external use if needed
export { wordLists };
