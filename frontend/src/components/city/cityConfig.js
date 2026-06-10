// Shared configuration for the free-build isometric city (AoE style)

export const ASSETS = {
  town_hall: '/assets/buildings/town_hall.png',
  house: '/assets/buildings/house.png',
  barracks: '/assets/buildings/barracks.png',
  farm: '/assets/buildings/farm.png',
  market: '/assets/buildings/market.png',
  school: '/assets/buildings/school.png',
  library: '/assets/buildings/library.png',
  lumber_mill: '/assets/buildings/lumber_mill.png',
  quarry: '/assets/buildings/quarry.png',
  mine: '/assets/buildings/mine.png',
  garden: '/assets/buildings/garden.png',
  wall: '/assets/buildings/wall.png',
  grassTexture: '/assets/grass_texture.jpg',
  roadTexture: '/assets/road_texture.jpg',
};

export const TILE_W = 110;
export const TILE_H = 55;
export const DIAMOND_CLIP = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';

export const gridToScreen = (x, y, gridSize) => ({
  left: (x - y) * (TILE_W / 2) + ((gridSize - 1) * TILE_W) / 2,
  top: (x + y) * (TILE_H / 2),
});

export const worldSize = (gridSize) => ({
  width: gridSize * TILE_W,
  height: gridSize * TILE_H,
});

export const BUILDING_CONFIG = {
  town_hall: { name: 'Câmara Municipal', category: 'civil', description: 'Centro administrativo da cidade. Tudo começa aqui — as estradas partem da Câmara.', scale: 1.5 },
  house: { name: 'Casa', category: 'civil', description: 'Residência para os habitantes. +10 população máxima.', scale: 1.0 },
  garden: { name: 'Jardim', category: 'civil', description: 'Espaço verde que produz diamantes bónus e melhora a qualidade de vida.', scale: 1.05, produces: true },
  school: { name: 'Escola', category: 'education', description: 'Aumenta o XP ganho em quizzes. Constrói perto das casas!', scale: 1.15 },
  library: { name: 'Biblioteca', category: 'education', description: 'Desbloqueia dicas nos quizzes.', scale: 1.05 },
  farm: { name: 'Quinta', category: 'resources', description: 'Produz comida para a população.', scale: 1.25, produces: true },
  lumber_mill: { name: 'Serração', category: 'resources', description: 'Produz madeira para construção.', scale: 1.1, produces: true },
  quarry: { name: 'Pedreira', category: 'resources', description: 'Extrai pedra para construções.', scale: 1.15, produces: true },
  mine: { name: 'Mina', category: 'resources', description: 'Extrai ferro para construções avançadas.', scale: 1.1, produces: true },
  market: { name: 'Mercado', category: 'resources', description: 'Produz moedas ao longo do tempo. Funciona melhor no centro!', scale: 1.15, produces: true },
  barracks: { name: 'Quartel', category: 'military', description: 'Treina soldados. +5 poder de ataque.', scale: 1.3 },
  wall: { name: 'Muralha', category: 'military', description: 'Defesa da cidade. +10 poder de defesa.', scale: 1.25 },
};

// Must mirror backend CITY_BUILDING_COSTS
export const BUILDING_COSTS = {
  town_hall: { coins: 100, wood: 50, stone: 50, iron: 20 },
  house: { coins: 30, wood: 20, stone: 10, iron: 0 },
  school: { coins: 80, wood: 30, stone: 30, iron: 10 },
  library: { coins: 60, wood: 40, stone: 20, iron: 5 },
  market: { coins: 50, wood: 25, stone: 25, iron: 5 },
  farm: { coins: 20, wood: 15, stone: 5, iron: 0 },
  lumber_mill: { coins: 25, wood: 10, stone: 10, iron: 5 },
  quarry: { coins: 30, wood: 10, stone: 5, iron: 10 },
  mine: { coins: 40, wood: 15, stone: 15, iron: 5 },
  barracks: { coins: 100, wood: 40, stone: 50, iron: 30 },
  wall: { coins: 50, wood: 20, stone: 60, iron: 15 },
  garden: { coins: 15, wood: 10, stone: 5, iron: 0 },
};

export const ROAD_COST = { wood: 5, stone: 5 };

export const CATEGORIES = [
  { id: 'civil', name: 'Civil' },
  { id: 'education', name: 'Educação' },
  { id: 'resources', name: 'Recursos' },
  { id: 'military', name: 'Militar' },
  { id: 'roads', name: 'Estradas' },
];

export const URBAN_TIPS = [
  'As estradas ligam as pessoas aos serviços — sem acesso, um edifício não serve a comunidade!',
  'Nas cidades reais, as escolas ficam perto das casas para as crianças poderem ir a pé.',
  'Os mercados funcionam melhor no centro da cidade, onde todos chegam facilmente.',
  'Indústrias como minas e pedreiras ficam normalmente afastadas das zonas residenciais.',
  'Os jardins e espaços verdes melhoram a saúde e a qualidade de vida dos habitantes.',
  'Um bom urbanista planeia as estradas antes dos edifícios!',
  'As muralhas protegiam as cidades medievais — hoje planeamos a segurança de outras formas.',
  'Uma cidade bem organizada poupa tempo e recursos a todos os seus habitantes.',
];

export const getBuildingCost = (buildingId, level = 0) => {
  const base = BUILDING_COSTS[buildingId] || { coins: 50, wood: 20, stone: 20, iron: 10 };
  const mult = level + 1;
  return {
    coins: base.coins * mult,
    wood: base.wood * mult,
    stone: base.stone * mult,
    iron: base.iron * mult,
  };
};

export const canAfford = (gameState, cost) => {
  const res = gameState?.resources || {};
  return (
    (gameState?.coins || 0) >= cost.coins &&
    (res.wood || 0) >= cost.wood &&
    (res.stone || 0) >= cost.stone &&
    (res.iron || 0) >= cost.iron
  );
};

export const SEASONAL_SKINS = {
  normal: {
    id: 'normal', name: 'Normal', icon: '🏠',
    description: 'Aspeto padrão da cidade',
    terrainFilter: 'none', buildingFilter: 'none',
    ambientColor: 'transparent', snowfall: false,
  },
  christmas: {
    id: 'christmas', name: 'Natal', icon: '🎄',
    description: 'Neve nos telhados e decorações de Natal',
    terrainFilter: 'brightness(1.1) saturate(0.7) hue-rotate(-10deg)',
    buildingFilter: 'brightness(1.05) saturate(0.8)',
    ambientColor: 'rgba(200, 220, 255, 0.15)', snowfall: true,
  },
  summer: {
    id: 'summer', name: 'Verão', icon: '☀️',
    description: 'Cores vibrantes e sol radiante',
    terrainFilter: 'saturate(1.4) brightness(1.08) contrast(1.05)',
    buildingFilter: 'saturate(1.2) brightness(1.05)',
    ambientColor: 'rgba(255, 200, 100, 0.08)', snowfall: false,
  },
};
