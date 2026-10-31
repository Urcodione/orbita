(function (root) {
  'use strict';

  const VERSION = 2;
  const catalog = [
    { type: 'engine', name: 'Motor de impulso', description: 'Aumenta o tanque e reduz o combustível gasto entre planetas.', stat: 'Eficiência de voo' },
    { type: 'warp', name: 'Núcleo de dobra', description: 'Reduz o combustível de dobra necessário para alcançar outra galáxia.', stat: 'Eficiência de dobra' },
    { type: 'life', name: 'Suporte de vida', description: 'Amplia a reserva de oxigênio e reduz o consumo nas expedições.', stat: 'Reserva de oxigênio' },
    { type: 'shield', name: 'Escudo ambiental', description: 'Reforça o casco e protege a nave em ambientes hostis.', stat: 'Proteção ambiental' },
    { type: 'scanner', name: 'Scanner orbital', description: 'Identifica planetas, rende mais dados e melhora a chance de módulos raros.', stat: 'Qualidade da análise' },
    { type: 'arm', name: 'Braço coletor', description: 'Recupera mais minério, cristais e créditos em cada expedição.', stat: 'Coleta de recursos' },
    { type: 'cargo', name: 'Armazém modular', description: 'Abre espaço para guardar e comparar mais módulos recuperados.', stat: 'Espaços de inventário' },
    { type: 'survival', name: 'Kit de sobrevivência', description: 'Reduz o consumo de oxigênio e o dano causado pelo ambiente.', stat: 'Autonomia da expedição' }
  ];
  const TYPES = catalog.map(item => item.type);
  const rarities = {
    common: { key: 'common', name: 'Comum', color: '#a8b8c8', multiplier: 1 },
    uncommon: { key: 'uncommon', name: 'Incomum', color: '#7ddeaa', multiplier: 1.28 },
    rare: { key: 'rare', name: 'Raro', color: '#63b9ff', multiplier: 1.72 },
    epic: { key: 'epic', name: 'Épico', color: '#c49aff', multiplier: 2.3 },
    legendary: { key: 'legendary', name: 'Lendário', color: '#ffc76a', multiplier: 3.15 }
  };
  const missions = [
    { id: 'scan', title: 'Um primeiro olhar', description: 'Analise Auralis com o scanner orbital.', action: 'Escanear planeta' },
    { id: 'dock', title: 'Pouso em Auralis', description: 'Ancore em um planeta analisado para iniciar uma expedição.', action: 'Ancorar' },
    { id: 'explore', title: 'Além da escotilha', description: 'Explore um ponto de interesse e recupere recursos e módulos.', action: 'Explorar um local' },
    { id: 'equip', title: 'Uma nave só sua', description: 'Equipe um módulo recuperado na aba Nave.', action: 'Equipar módulo' },
    { id: 'warp', title: 'O próximo horizonte', description: 'Refine cristais, decole e use a dobra para alcançar outra galáxia.', action: 'Saltar de galáxia' }
  ];
  const BIOMES = {
    forest: { name: 'Floresta bioluminescente', color: '#7edaa6', temp: [9, 31], rad: [3, 22], atmosphere: 'Respirável', sites: ['Bosque luminoso', 'Santuário esquecido', 'Gruta das sementes'], anomalies: ['Flora que responde à luz das estrelas', 'Árvores ligadas por uma rede mineral', 'Esporos com memória luminosa'] },
    volcanic: { name: 'Mundo vulcânico', color: '#f59367', temp: [95, 190], rad: [48, 86], atmosphere: 'Tóxica · gases sulfúricos', sites: ['Caldeira de obsidiana', 'Forja abandonada', 'Túnel de lava'], anomalies: ['Relâmpagos dentro de rios de lava', 'Cristais que armazenam calor', 'Uma forja emite sinais antigos'] },
    ice: { name: 'Geleiras eternas', color: '#92cce8', temp: [-115, -35], rad: [12, 42], atmosphere: 'Rarefeita · gelo de nitrogênio', sites: ['Fenda azul', 'Observatório congelado', 'Lago sob o gelo'], anomalies: ['Um oceano pulsa sob a crosta', 'Sinais de rádio presos no gelo', 'Auroras que acompanham a nave'] },
    desert: { name: 'Dunas de cobre', color: '#e9be77', temp: [38, 78], rad: [26, 64], atmosphere: 'Rarefeita · poeira metálica', sites: ['Mar de dunas', 'Farol soterrado', 'Cânion de cobre'], anomalies: ['Dunas movem-se contra o vento', 'Estruturas sob a areia emitem calor', 'Areia magnética desenha constelações'] },
    ocean: { name: 'Oceano de safira', color: '#619ddc', temp: [2, 26], rad: [8, 36], atmosphere: 'Respirável · umidade elevada', sites: ['Atol flutuante', 'Estação submersa', 'Recife abissal'], anomalies: ['Ilhas flutuam em campos magnéticos', 'O oceano canta em baixa frequência', 'Recifes formam circuitos naturais'] },
    crystal: { name: 'Deserto de cristais', color: '#b7a2e3', temp: [-20, 48], rad: [42, 92], atmosphere: 'Ionizada · partículas exóticas', sites: ['Jardim de prismas', 'Portal partido', 'Catedral de quartzo'], anomalies: ['Cristais dobram a luz ao redor da nave', 'Um eco responde antes da transmissão', 'A gravidade oscila a cada aurora'] }
  };
  Object.assign(BIOMES, {
    gas: { name: 'Gigante gasoso', color: '#dcac7e', temp: [-70, 180], rad: [24, 85], pressure: [8, 65], toxicity: [15, 65], medium: 'gas', atmosphere: 'Hidrogênio · sem superfície', sites: ['Corrente de hélio', 'Olho da tempestade', 'Nuvens de diamante', 'Vórtice profundo'], anomalies: ['Chuva de diamantes nas camadas inferiores', 'Um farol atravessa a tempestade'] },
    toxic: { name: 'Pântano corrosivo', color: '#bad96b', temp: [32, 130], rad: [30, 80], pressure: [2, 8], toxicity: [65, 100], atmosphere: 'Corrosiva · aerossóis ácidos', sites: ['Mar de enxofre', 'Estufa abandonada', 'Fenda corrosiva', 'Torre de esporos'], anomalies: ['Uma colônia sobrevive sob a chuva ácida', 'Relâmpagos verdes iluminam ruínas'] },
    magma: { name: 'Oceano de magma', color: '#ff7052', temp: [780, 1250], rad: [75, 165], pressure: [3, 18], toxicity: [65, 90], atmosphere: 'Vapor metálico · calor extremo', sites: ['Arquipélago de basalto', 'Fonte de plasma', 'Coração da forja'], anomalies: ['Metais líquidos desenham rios de luz', 'Uma máquina pulsa dentro do vulcão'] },
    rogue: { name: 'Mundo errante', color: '#93a5c4', temp: [-230, -150], rad: [12, 55], pressure: [0, 1], toxicity: [0, 5], atmosphere: 'Vácuo · escuridão permanente', sites: ['Sonda sem dono', 'Cidade sob o gelo', 'Fenda sem sol', 'Arquivo congelado'], anomalies: ['Uma cidade mantém suas luzes acesas', 'Sinais antigos viajam sob o gelo'] }
  });
  const recipes = [
    { id: 'thermal-shield', name: 'Escudo Cerâmica Solar', type: 'shield', rarity: 'rare', power: 1.72, description: 'Cerâmica até 1.400 °C. Abre a rota de estrelas azuis e mundos vulcânicos.', cost: { ore: 18, data: 20, crystals: 2, credits: 35 }, capabilities: { heat: 1400, cold: 60, radiation: 120, pressure: 20 } },
    { id: 'radiation-mesh', name: 'Malha Magnetar', type: 'shield', rarity: 'rare', power: 1.72, description: 'Proteção de 450 rad. Especializada em pulsares; resiste a apenas 220 °C.', cost: { ore: 20, data: 30, crystals: 2, credits: 40 }, capabilities: { heat: 220, cold: 80, radiation: 450, pressure: 15 } },
    { id: 'cryo-suit', name: 'Abrigo Zero Absoluto', type: 'survival', rarity: 'uncommon', power: 1.28, description: 'Isolamento até −260 °C para mundos errantes e geleiras profundas.', cost: { ore: 14, data: 16, crystals: 1, credits: 25 }, capabilities: { cold: 260, heat: 120, radiation: 75, pressure: 10 } },
    { id: 'dive-kit', name: 'Módulo Mergulhador', type: 'survival', rarity: 'uncommon', power: 1.28, description: 'Operação submersa até 40 atm. Troca o abrigo de superfície por cápsulas aquáticas.', cost: { ore: 16, data: 18, crystals: 1, credits: 25 }, capabilities: { liquid: true, pressure: 40, heat: 160, cold: 80, radiation: 100 } },
    { id: 'atmospheric-probe', name: 'Coletor de Tempestades', type: 'arm', rarity: 'rare', power: 1.72, description: 'Sondas e coletores para atmosferas gasosas, até 65 atm.', cost: { ore: 18, data: 24, crystals: 2, credits: 30 }, capabilities: { gas: true, pressure: 65, heat: 450, cold: 200, radiation: 150 } },
    { id: 'pressure-filter', name: 'Biosfera Selada', type: 'life', rarity: 'rare', power: 1.72, description: 'Filtra toxicidade 100%, mantém vedação a 100 atm e absorve 180 rad.', cost: { ore: 22, data: 28, crystals: 2, credits: 40 }, capabilities: { toxicity: 100, pressure: 100, heat: 200, cold: 130, radiation: 180 } },
    { id: 'solar-suit', name: 'Abrigo Helios', type: 'survival', rarity: 'epic', power: 2.3, description: 'Expedições a 1.800 °C e 240 rad. Complementa a malha radiológica em estrelas extremas.', cost: { ore: 28, data: 50, crystals: 4, credits: 70 }, capabilities: { heat: 1800, cold: 130, radiation: 240, pressure: 35, toxicity: 65 } },
    { id: 'abyss-hold', name: 'Armazém Abissal', type: 'cargo', rarity: 'rare', power: 1.72, description: 'Contêineres estanques com cápsula submersível até 180 atm e −220 °C.', cost: { ore: 26, data: 36, crystals: 3, credits: 50 }, capabilities: { liquid: true, pressure: 180, cold: 220, heat: 150, radiation: 100 } }
  ];
  // Recipes remain deterministic; specialist bonuses do not depend on rarity.
  const componentRecipes = [
    { id: 'alloy', name: 'Liga estrutural', description: 'Chassi de motores, depósitos e ferramentas.', cost: { ore: 3, credits: 4 }, components: {} },
    { id: 'prism', name: 'Prisma calibrado', description: 'Concentra energia para escudos e sensores.', cost: { crystals: 1, data: 3, credits: 4 }, components: {} },
    { id: 'circuit', name: 'Circuito lógico', description: 'Controle de sondas, sensores e suporte de vida.', cost: { ore: 2, data: 6, credits: 6 }, components: {} },
    { id: 'seal', name: 'Selo cerâmico', description: 'Isola calor, frio, pressão e gases corrosivos.', cost: { ore: 2, data: 2, credits: 4 }, components: {} },
    { id: 'field-core', name: 'Núcleo de campo', description: 'Combina prismas e circuitos para campos magnéticos e dobra.', cost: { data: 4, credits: 8 }, components: { prism: 2, circuit: 1 } },
    { id: 'battery', name: 'Célula energética', description: 'Reserva compacta para veículos, sondas e expedições.', cost: { data: 4, credits: 6 }, components: { alloy: 1, prism: 1 } }
  ];
  const recipeAssembly = {
    'thermal-shield': { components: { alloy: 2, prism: 1, seal: 1 }, cost: { data: 10, credits: 15 }, specialty: 'Cerâmica térmica', effects: { maxHull: 8 } },
    'radiation-mesh': { components: { 'field-core': 1, seal: 1 }, cost: { data: 12, credits: 15 }, specialty: 'Blindagem radiológica', effects: { maxHull: 4 } },
    'cryo-suit': { components: { seal: 2, alloy: 1 }, cost: { data: 8, credits: 12 }, specialty: 'Isolamento criogênico', effects: { expeditionIntegrity: 2 } },
    'dive-kit': { components: { seal: 2, circuit: 1 }, cost: { data: 8, credits: 12 }, specialty: 'Operação submersa', effects: { expeditionCapacity: 1 } },
    'atmospheric-probe': { components: { circuit: 1, alloy: 1, seal: 1 }, cost: { data: 12, credits: 15 }, specialty: 'Coleta atmosférica', effects: { collectionBonus: 0.10 } },
    'pressure-filter': { components: { seal: 2, circuit: 1 }, cost: { data: 12, credits: 15 }, specialty: 'Filtragem e pressão', effects: { maxOxygen: 10 } },
    'solar-suit': { components: { seal: 3, battery: 1 }, cost: { data: 24, credits: 30 }, specialty: 'Expedição solar', effects: { expeditionIntegrity: 3 } },
    'abyss-hold': { components: { alloy: 2, seal: 2, circuit: 1 }, cost: { data: 16, credits: 20 }, specialty: 'Depósito submersível', effects: { cargoCapacity: -1, expeditionCapacity: 2 } }
  };
  recipes.forEach(recipe => Object.assign(recipe, recipeAssembly[recipe.id]));
  recipes.push(
    { id: 'ion-sail', name: 'Motor Vela Iônica', type: 'engine', rarity: 'rare', power: 1.72, specialty: 'Rotas econômicas', description: 'Viaja com menos combustível. Prioriza eficiência, com um tanque menor que o modelo cargueiro.', cost: { data: 10, credits: 16 }, components: { alloy: 1, circuit: 1 }, capabilities: {}, effects: { fuelEfficiency: 0.48, maxFuel: -6 } },
    { id: 'long-haul', name: 'Motor Caravana', type: 'engine', rarity: 'rare', power: 1.72, specialty: 'Tanque de longa distância', description: 'Leva 48 unidades extras de combustível; o peso dos tanques reduz a eficiência de cada salto.', cost: { data: 10, credits: 16 }, components: { alloy: 2, seal: 1 }, capabilities: {}, effects: { maxFuel: 48, fuelEfficiency: -0.12 } },
    { id: 'fold-lens', name: 'Dobra Lente de Lyra', type: 'warp', rarity: 'rare', power: 1.72, specialty: 'Dobra econômica', description: 'Concentra a dobra para gastar menos células por galáxia.', cost: { data: 14, credits: 20 }, components: { 'field-core': 1, alloy: 1 }, capabilities: {}, effects: { warpEfficiency: 0.85 } },
    { id: 'pulsar-anchor', name: 'Dobra Âncora Pulsar', type: 'warp', rarity: 'rare', power: 1.72, specialty: 'Navegação radiológica', description: 'O campo da dobra bloqueia até 300 rad e libera o encaixe de escudo para proteção térmica. Consome mais células que a Lente de Lyra.', cost: { data: 18, credits: 24 }, components: { 'field-core': 1, seal: 2 }, capabilities: { radiation: 300 }, effects: { warpEfficiency: -0.12 } },
    { id: 'oxygen-garden', name: 'Jardim Respirante', type: 'life', rarity: 'rare', power: 1.72, specialty: 'Autonomia de oxigênio', description: 'Recicla o ar e sustenta expedições mais longas. Não substitui a filtragem corrosiva da Biosfera Selada.', cost: { data: 12, credits: 16 }, components: { battery: 1, circuit: 1 }, capabilities: {}, effects: { maxOxygen: 30, oxygenEfficiency: 0.35, expeditionReserve: 3 } },
    { id: 'kinetic-shell', name: 'Escudo Casco Bastião', type: 'shield', rarity: 'rare', power: 1.72, specialty: 'Impactos e tempestades', description: 'Casco reforçado e amortecedores reduzem danos nos setores perigosos. Proteção térmica e radiológica modestas.', cost: { data: 10, credits: 18 }, components: { alloy: 3, seal: 1 }, capabilities: { heat: 140, cold: 60, radiation: 80, pressure: 12 }, effects: { maxHull: 35, expeditionIntegrity: 4, hazardProtection: 1 } },
    { id: 'wide-lens', name: 'Scanner Horizonte', type: 'scanner', rarity: 'rare', power: 1.72, specialty: 'Visão de longo alcance', description: 'O pulso alcança até cinco setores de distância. Rende menos pesquisa que o Espectrômetro Arquivista.', cost: { data: 10, credits: 14 }, components: { prism: 1, circuit: 1 }, capabilities: {}, effects: { scanRadius: 2 } },
    { id: 'archive-eye', name: 'Scanner Arquivista', type: 'scanner', rarity: 'rare', power: 1.72, specialty: 'Pesquisa de anomalias', description: 'Aumenta os dados obtidos em análises e arquivos e melhora a chance de raridades, mantendo o alcance normal.', cost: { data: 12, credits: 14 }, components: { prism: 1, circuit: 2 }, capabilities: {}, effects: { scanBonus: 0.55 } },
    { id: 'mining-claw', name: 'Braço Garra de Titânio', type: 'arm', rarity: 'rare', power: 1.72, specialty: 'Extração mineral', description: 'Recupera mais minério e cristais com uma unidade de energia por coleta. Não inclui sondas para gigantes gasosos.', cost: { data: 10, credits: 16 }, components: { alloy: 2, circuit: 1 }, capabilities: {}, effects: { collectionBonus: 0.55, collectionEfficiency: 1 } },
    { id: 'caravan-hold', name: 'Armazém Caravana', type: 'cargo', rarity: 'rare', power: 1.72, specialty: 'Coleção de módulos', description: 'Guarda seis módulos extras e amplia a carga de expedição. Não possui vedação de submersão.', cost: { data: 10, credits: 16 }, components: { alloy: 3, circuit: 1 }, capabilities: {}, effects: { cargoCapacity: 6, expeditionCapacity: 3 } },
    { id: 'trail-camp', name: 'Abrigo Caminhante', type: 'survival', rarity: 'rare', power: 1.72, specialty: 'Expedições prolongadas', description: 'Acrescenta seis unidades de reserva local e reduz o dano de travessias perigosas. Sem operação submersa ou isolamento extremo.', cost: { data: 12, credits: 16 }, components: { battery: 1, seal: 1 }, capabilities: {}, effects: { expeditionReserve: 6, hazardProtection: 1 } }
  );
  const EFFECT_BOUNDS = { maxFuel: [-20, 80], maxOxygen: [-20, 60], maxHull: [-20, 60], cargoCapacity: [-4, 8], fuelEfficiency: [-0.4, 1], scanBonus: [-0.1, 1], oxygenEfficiency: [-0.3, 1], collectionBonus: [-0.3, 1], warpEfficiency: [-0.4, 1.5], expeditionReserve: [-4, 10], expeditionIntegrity: [-3, 6], expeditionCapacity: [-2, 4], scanRadius: [-1, 3], collectionEfficiency: [0, 1], hazardProtection: [0, 2] };
  const CAPABILITY_KEYS = ['heat', 'cold', 'radiation', 'pressure', 'toxicity', 'gas', 'liquid'];
  const SYSTEM_KINDS = {
    'yellow': { name: 'Estrela amarela', color: '#ffe0a0', heat: 0, radiation: 0, description: 'Rotas estáveis; um refúgio para preparar a nave.' },
    'red-dwarf': { name: 'Anã vermelha', color: '#ff927e', heat: 0, radiation: 0, description: 'Mundos gelados, mares densos e atmosferas corrosivas.' },
    'blue-giant': { name: 'Gigante azul', color: '#9dd7ff', heat: 700, radiation: 65, description: 'Coroa estelar a 700 °C. Exige proteção térmica para entrar.' },
    'pulsar': { name: 'Pulsar', color: '#c5a9ff', heat: 90, radiation: 225, description: 'Pulsos de 225 rad atravessam o sistema. Prepare a blindagem.' }
  };
  const GALAXY_ROUTES = {
    verdant: { description: 'Uma assinatura distante de brilho suave. Conteúdo e condições só serão conhecidos na chegada.', cost: 3 },
    forge: { description: 'Uma assinatura distante de brilho intenso. Conteúdo e condições só serão conhecidos na chegada.', cost: 4 },
    abyss: { description: 'Uma assinatura distante de brilho pulsante. Conteúdo e condições só serão conhecidos na chegada.', cost: 4 }
  };
  const GALAXY_KINDS = ['frontier', 'verdant', 'forge', 'abyss'];
  const FIRST_SYSTEM_NAMES = ['Porto Boreal', 'Meridiano', 'Coroa Azul', 'Farol de Nyx'];
  const FIRST_PLANET_NAMES = ['Auralis', 'Nivara', 'Talos', 'Elyria', 'Oriana', 'Lumera', 'Vesper', 'Íon', 'Aster', 'Nereida', 'Kora', 'Cinis', 'Solen', 'Vela', 'Lacuna', 'Mirra', 'Seda', 'Nox', 'Átria', 'Nimbo'];
  const NAME_STARTS = 'BCDFGHJKLMNPRSTV'.split('').flatMap(letter => ['ar', 'el', 'or', 'ul'].map(sound => letter + sound));
  const NAME_MIDDLES = ['al','an','ar','as','at','av','el','en','er','es','et','ev','il','in','ir','is','it','iv','ol','on','or','os','ot','ov','ul','un','ur','us','ut','uv','yl','yn'];
  const NAME_ENDINGS = ['ia','is','on','ar','en','or','ea','el','os','us','um','yn','as','ae','ir','io','al','an','es','et','il','in','ix','ol','om','ra','re','ri','ro','ta','te','va'];
  const ARCHIVE_LIMIT = 48;

  const MODULE_NAMES = {
    engine: ['Propulsor Cometa', 'Motor Vento Solar', 'Turbina de Íons'],
    warp: ['Núcleo Horizonte', 'Dobra Aurora', 'Matriz de Alcubierre'],
    life: ['Jardim de Oxigênio', 'Filtro Biosfera', 'Pulmão Estelar'],
    shield: ['Escudo Magnetar', 'Malha de Faraday', 'Campo Guardião'],
    scanner: ['Scanner Prisma', 'Olho de Órion', 'Espectrômetro Íris'],
    arm: ['Braço Libélula', 'Coletor Aracne', 'Pinça Orbital'],
    cargo: ['Armazém Colmeia', 'Baú de Órion', 'Compartimento Atlas'],
    survival: ['Kit Pioneiro', 'Abrigo Nômade', 'Mochila Fronteira']
  };

  function hashSeed(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value >>> 0;
    let result = 2166136261;
    for (const char of String(value)) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
    return result >>> 0;
  }
  function generator(seed) {
    let value = seed >>> 0;
    return function () {
      value = (value + 0x6D2B79F5) >>> 0;
      let t = value;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function random(state) {
    state.rng = (state.rng + 0x6D2B79F5) >>> 0;
    let t = state.rng;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  const integer = (rng, low, high) => low + Math.floor(rng() * (high - low + 1));
  const pick = (rng, values) => values[Math.floor(rng() * values.length)];
  const rounded = value => Math.round(value * 100) / 100;
  const clone = value => JSON.parse(JSON.stringify(value));
  // Replace a state's contents in place: unlike Object.assign, keys removed from the
  // working copy (e.g. a previous galaxy's market) must disappear from the live state too.
  function commit(target, next) {
    for (const key of Object.keys(target)) if (!Object.prototype.hasOwnProperty.call(next, key)) delete target[key];
    return Object.assign(target, next);
  }

  function celestialName(seed, index, kind, slot) {
    if (index === 0) return slot === 0 ? 'Véu de Íris' : slot < 5 ? FIRST_SYSTEM_NAMES[slot - 1] : FIRST_PLANET_NAMES[slot - 5];
    // A separate, bijective namespace leaves terrain RNG and saved IDs untouched.
    // Every route owns 32 slots. Extra syllables extend the space without numbers.
    const ordinal = (BigInt(index - 1) * 3n + BigInt(Math.max(0, GALAXY_KINDS.indexOf(kind) - 1))) * 32n + BigInt(slot);
    const permuted = Number((ordinal % 65536n * 40503n + BigInt(hashSeed(seed + ':celestial-names') % 65536)) % 65536n);
    let extension = '', high = ordinal / 65536n;
    while (high > 0n) { high--; extension = NAME_MIDDLES[Number(high % 32n)] + extension; high /= 32n; }
    return NAME_STARTS[permuted % 64] + NAME_MIDDLES[Math.floor(permuted / 64) % 32] + extension + NAME_ENDINGS[Math.floor(permuted / 2048)];
  }
  function nameGalaxy(galaxy, seed, index) {
    galaxy.name = celestialName(seed, index, galaxy.kind, 0);
    galaxy.systems.forEach((system, i) => { system.name = celestialName(seed, index, galaxy.kind, i + 1); });
    galaxy.planets.forEach((planet, i) => { planet.name = celestialName(seed, index, galaxy.kind, i + 5); });
    return galaxy;
  }
  function physicalConditions(biome, rng) {
    const definition = BIOMES[biome];
    return {
      medium: definition.medium || (biome === 'ocean' ? 'liquid' : 'solid'),
      pressure: rounded(definition.pressure ? integer(rng, ...definition.pressure) : biome === 'ocean' ? integer(rng, 10, 85) : biome === 'volcanic' ? 3 : 1),
      toxicity: definition.toxicity ? integer(rng, ...definition.toxicity) : biome === 'volcanic' ? 40 : biome === 'desert' ? 8 : 0,
      weather: biome === 'forest' ? integer(rng, 4, 15) : integer(rng, 18, 75)
    };
  }
  function generateGalaxy(seed, index, route) {
    const kind = route || 'frontier';
    const galaxySeed = hashSeed(seed + ':galaxy:' + index + ':' + kind);
    const rng = generator(galaxySeed);
    const count = integer(rng, 3, 4);
    const systemTypes = ['yellow', kind === 'abyss' ? 'pulsar' : kind === 'forge' ? 'blue-giant' : 'red-dwarf', 'blue-giant', 'pulsar'];
    if (count === 3 && kind === 'forge') systemTypes[2] = 'pulsar';
    const planets = [], systems = [];
    for (let sys = 0; sys < count; sys++) {
      const type = systemTypes[sys], star = SYSTEM_KINDS[type];
      const systemId = 'g' + index + '-sys' + sys;
      const worldCount = sys === 0 ? 5 : sys === 1 ? 4 : integer(rng, 3, 4);
      const system = { id: systemId, name: celestialName(seed, index, kind, sys + 1), kind: type, starColor: star.color, description: star.description, heat: star.heat, radiation: star.radiation, planetIds: [] };
      systems.push(system);
      const sequence = sys === 0 ? ['forest', 'desert', 'gas', 'ocean', 'volcanic'] : type === 'blue-giant' ? ['magma', 'crystal', 'toxic', 'volcanic'] : type === 'pulsar' ? ['rogue', 'gas', 'crystal', 'ice'] : ['ice', 'toxic', 'rogue', 'ocean'];
      for (let local = 0; local < worldCount; local++) {
        const i = planets.length, id = 'g' + index + '-p' + i;
        const biome = sequence[local];
        const definition = BIOMES[biome];
        const planetSeed = hashSeed(galaxySeed + ':planet:' + i), prng = generator(planetSeed);
        const safe = sys === 0 && local < 2;
        const special = index === 0 && i === 0;
        const conditions = physicalConditions(biome, prng);
        if (safe) Object.assign(conditions, { pressure: 1, toxicity: local === 0 ? 0 : 5, weather: local === 0 ? 8 : 14 });
        if (sys === 0 && biome === 'gas') Object.assign(conditions, { pressure: 6, toxicity: 12, weather: 30 });
        if (sys === 0 && biome === 'ocean') Object.assign(conditions, { pressure: 8, toxicity: 0, weather: 22 });
        if (sys === 0 && biome === 'volcanic') Object.assign(conditions, { pressure: 2, toxicity: 12, weather: 40 });
        const siteCount = i === 0 ? 3 : integer(prng, 2, Math.min(4, definition.sites.length));
        const p = {
          id, seed: planetSeed, systemId,
          name: celestialName(seed, index, kind, i + 5),
          biome, biomeName: definition.name, color: definition.color,
          temperature: safe ? (local === 0 ? 22 : 42) : sys === 0 && biome === 'gas' ? 45 : sys === 0 && biome === 'volcanic' ? 320 : integer(prng, ...definition.temp),
          atmosphere: definition.atmosphere, breathable: biome === 'forest' || biome === 'ocean',
          radiation: safe ? (local === 0 ? 8 : 18) : sys === 0 && biome === 'gas' ? 24 : sys === 0 && biome === 'volcanic' ? 70 : integer(prng, ...definition.rad),
          gravity: special ? 0.94 : rounded(biome === 'gas' ? 1.5 + prng() * 1.3 : 0.42 + prng() * 1.32),
          anomaly: pick(prng, definition.anomalies), distance: 18 + sys * 100 + local * 18 + integer(prng, 0, 8),
          size: rounded(biome === 'gas' ? 1.3 + prng() * 0.4 : 0.68 + prng() * 0.55),
          angle: rounded((local / worldCount) * Math.PI * 2 + prng() * 0.45), scanned: false,
          ...conditions,
          sites: definition.sites.slice(0, siteCount).map((name, n) => ({ id: id + '-s' + n, name, difficulty: safe ? 1 : n === 0 ? 1 : Math.min(3, n + 1), explored: false }))
        };
        planets.push(p); system.planetIds.push(id);
      }
    }
    return { id: 'galaxy-' + index, seed: galaxySeed, kind, name: celestialName(seed, index, kind, 0), systems, planets };
  }

  function makeModule(state, type, rarity, level, origin) {
    const descriptor = catalog.find(item => item.type === type);
    const power = rounded(rarities[rarity].multiplier * (1 + (level - 1) * 0.16));
    return {
      id: 'm' + state.nextModuleId++, type,
      name: MODULE_NAMES[type][Math.floor(random(state) * MODULE_NAMES[type].length)],
      rarity, level, power, origin: origin || 'recovered',
      description: descriptor.stat + ' · ' + power.toFixed(2).replace('.', ',') + '×'
    };
  }

  function create(seed) {
    const numericSeed = hashSeed(seed === undefined ? Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF) : seed);
    const state = {
      version: VERSION, seed: numericSeed, rng: numericSeed, nextModuleId: 1,
      turn: 0, galaxyIndex: 0, visitedGalaxies: 1,
      galaxy: generateGalaxy(numericSeed, 0),
      location: { planetId: 'g0-p0', mode: 'orbit' },
      ship: { name: 'Andorinha', color: '#f0a270' },
      resources: { fuel: 90, oxygen: 100, hull: 100, warpFuel: 1, crystals: 3, ore: 12, credits: 120, data: 0 },
      equipped: {}, inventory: [], components: {}, expedition: null, siteCaches: {}, siteOperations: {},
      surveyArchive: { entries: [], earlier: [0, 0, 0, 0, 0, 0], unavailable: 0 },
      discovery: { fragments: { origin: false, ember: false, tide: false }, claimed: false, extractions: 0, evacuations: 0 },
      progress: { scans: 0, landings: 0, explorations: 0, modulesEquipped: 0, warps: 0 },
      mission: { stage: 0, completed: [] },
      log: [{ id: 0, text: 'Bem-vindo ao Véu de Íris. Auralis aguarda sua primeira análise.', kind: 'info' }]
    };
    TYPES.forEach(type => { state.equipped[type] = makeModule(state, type, 'common', 1, 'starter'); });
    state.inventory.push(makeModule(state, 'scanner', 'rare', 1, 'cache'));
    state.inventory.push(makeModule(state, 'cargo', 'uncommon', 1, 'cache'));
    return state;
  }

  function moduleCapabilities(module) {
    const out = {};
    if (!module) return out;
    const boost = Math.max(0, module.power - 1);
    if (module.type === 'shield') Object.assign(out, { heat: Math.round(70 + 50 * boost), cold: Math.round(35 + 20 * boost), radiation: Math.round(30 + 35 * boost), pressure: rounded(2 + 2 * boost) });
    if (module.type === 'life') Object.assign(out, { toxicity: Math.min(100, Math.round(15 + 15 * boost)), pressure: rounded(2 + 3 * boost) });
    if (module.type === 'survival') Object.assign(out, { heat: Math.round(70 + 30 * boost), cold: Math.round(35 + 35 * boost), radiation: Math.round(30 + 15 * boost) });
    for (const [key, value] of Object.entries(module.capabilities || {})) {
      if (key === 'gas' || key === 'liquid') out[key] = value === true;
      else if (CAPABILITY_KEYS.includes(key)) out[key] = Math.max(out[key] || 0, value);
    }
    // A rune engraved on this module enhances this module's own protection (numbers add) or grants a sensor.
    for (const [key, value] of Object.entries(runeBonus(module)?.capabilities || {})) {
      if (key === 'gas' || key === 'liquid') out[key] = out[key] || value === true;
      else if (CAPABILITY_KEYS.includes(key)) out[key] = (out[key] || 0) + value;
    }
    return out;
  }
  // Runes are defined by the xenobiology module (api.runeBonus); the engine only reads the bonus of an engraved rune.
  function runeBonus(module) { return module && module.rune && typeof api.runeBonus === 'function' ? api.runeBonus(module.rune) : null; }
  function protection(state) {
    const out = { heat: 0, cold: 0, radiation: 0, pressure: 0, toxicity: 0, gas: false, liquid: false };
    for (const module of Object.values(state.equipped)) {
      for (const [key, value] of Object.entries(moduleCapabilities(module))) out[key] = key === 'gas' || key === 'liquid' ? out[key] || value : Math.max(out[key], value);
    }
    return out;
  }
  function moduleEffects(module) {
    const out = { ...(module.effects || {}) };
    for (const [key, value] of Object.entries(runeBonus(module)?.effects || {})) out[key] = rounded((out[key] || 0) + value);
    return out;
  }
  function stats(state) {
    const power = type => state.equipped[type].power;
    const effects = {};
    Object.values(state.equipped).forEach(module => Object.entries(moduleEffects(module)).forEach(([key, amount]) => { effects[key] = (effects[key] || 0) + amount; }));
    const effect = key => effects[key] || 0;
    return {
      maxFuel: Math.round(100 + 15 * (power('engine') - 1) + effect('maxFuel')),
      maxOxygen: Math.round(100 + 25 * (power('life') - 1) + 8 * (power('survival') - 1) + effect('maxOxygen')),
      maxHull: Math.round(100 + 20 * (power('shield') - 1) + effect('maxHull')),
      maxWarpFuel: 12,
      cargoCapacity: Math.max(4, Math.min(24, 8 + Math.round(power('cargo') * 2) + effect('cargoCapacity'))),
      cargoUsed: state.inventory.length,
      fuelEfficiency: rounded(Math.max(0.5, 1 + 0.22 * (power('engine') - 1) + effect('fuelEfficiency'))),
      scanBonus: rounded(Math.max(0, 0.25 * (power('scanner') - 1) + effect('scanBonus'))),
      radiationProtection: rounded(Math.min(0.82, 0.20 + 0.13 * (power('shield') - 1) + 0.04 * (power('survival') - 1))),
      oxygenEfficiency: rounded(Math.max(0.5, 1 + 0.18 * (power('life') - 1) + 0.12 * (power('survival') - 1) + effect('oxygenEfficiency'))),
      collectionBonus: rounded(Math.max(0.5, 1 + 0.20 * (power('arm') - 1) + effect('collectionBonus'))),
      warpEfficiency: rounded(Math.max(0.5, 1 + 0.35 * (power('warp') - 1) + effect('warpEfficiency'))),
      expeditionReserve: Math.max(12, Math.min(48, 24 + Math.min(10, Math.round((power('survival') - 1) * 4 + (power('life') - 1) * 2)) + effect('expeditionReserve'))),
      expeditionIntegrity: Math.max(6, Math.min(32, 10 + Math.min(10, Math.round((power('shield') - 1) * 3)) + effect('expeditionIntegrity'))),
      expeditionCapacity: Math.max(3, Math.min(16, 6 + Math.min(4, Math.floor((power('cargo') - 1) * 2)) + effect('expeditionCapacity'))),
      scanRadius: Math.max(1, Math.min(5, 3 + Math.round(power('scanner') - 1) + effect('scanRadius'))),
      collectionCost: Math.max(1, (power('arm') >= 1.7 ? 1 : 2) - effect('collectionEfficiency')),
      hazardDamage: Math.max(1, 3 - Math.floor(power('survival')) - effect('hazardProtection')),
      protection: protection(state)
    };
  }
  const METRICS = {
    maxFuel: ['Tanque de combustível', 'un.', true], fuelEfficiency: ['Eficiência de voo', '×', true],
    maxOxygen: ['Reserva de oxigênio', 'un.', true], oxygenEfficiency: ['Eficiência do ar', '×', true],
    maxHull: ['Resistência do casco', 'un.', true], warpEfficiency: ['Eficiência de dobra', '×', true],
    scanBonus: ['Bônus de pesquisa', '%', true], scanRadius: ['Alcance do scanner', 'setores', true],
    collectionBonus: ['Rendimento de coleta', '×', true], collectionCost: ['Energia por coleta', 'un.', false],
    cargoCapacity: ['Módulos no armazém', 'espaços', true], expeditionCapacity: ['Carga da expedição', 'espaços', true],
    expeditionReserve: ['Reserva da expedição', 'un.', true], expeditionIntegrity: ['Integridade local', 'un.', true],
    hazardDamage: ['Dano por setor perigoso', 'un.', false],
    heat: ['Proteção térmica', '°C', true], cold: ['Isolamento criogênico', '°C', true],
    radiation: ['Blindagem radiológica', 'rad', true], pressure: ['Resistência à pressão', 'atm', true],
    toxicity: ['Filtragem tóxica', '%', true], gas: ['Sonda atmosférica', '', true], liquid: ['Operação submersa', '', true]
  };
  const TYPE_METRICS = {
    engine: ['fuelEfficiency', 'maxFuel'], warp: ['warpEfficiency'], life: ['maxOxygen', 'oxygenEfficiency', 'expeditionReserve'],
    shield: ['maxHull', 'expeditionIntegrity', 'hazardDamage'], scanner: ['scanRadius', 'scanBonus'],
    arm: ['collectionBonus', 'collectionCost'], cargo: ['cargoCapacity', 'expeditionCapacity'], survival: ['expeditionReserve', 'hazardDamage', 'oxygenEfficiency']
  };
  function metricValue(computed, key) {
    if (CAPABILITY_KEYS.includes(key)) return ['gas', 'liquid'].includes(key) ? Boolean(computed.protection[key]) : computed.protection[key];
    return key === 'scanBonus' ? Math.round(computed[key] * 100) : computed[key];
  }
  function metricText(key, value) { return typeof value === 'boolean' ? value ? 'disponível' : 'ausente' : String(value).replace('.', ',') + ' ' + METRICS[key][1]; }
  // Every ship attribute with its label, unit, direction and current value (installed modules only).
  function shipMetrics(state) {
    const computed = stats(state);
    return Object.keys(METRICS).map(key => ({ key, label: METRICS[key][0], unit: METRICS[key][1], higherIsBetter: METRICS[key][2], value: metricValue(computed, key) }));
  }
  function moduleDetails(state, module) {
    if (typeof module === 'string') module = [...Object.values(state.equipped), ...state.inventory].find(item => item.id === module);
    if (!module || !TYPES.includes(module.type)) return null;
    const recipe = recipes.find(item => item.id === module.recipeId), computed = stats({ ...state, equipped: { ...state.equipped, [module.type]: module } });
    const keys = [...new Set([...TYPE_METRICS[module.type], ...Object.keys(moduleCapabilities(module)), ...Object.keys(moduleEffects(module)).filter(key => METRICS[key])])];
    const metrics = keys.map(key => ({ key, label: METRICS[key][0], value: CAPABILITY_KEYS.includes(key) ? moduleCapabilities(module)[key] : metricValue(computed, key), unit: METRICS[key][1], higherIsBetter: METRICS[key][2] }));
    return {
      id: module.id, type: module.type, name: module.name, specialty: recipe ? recipe.specialty : module.origin === 'beacon' ? 'Cartografia de galáxias' : 'Sistema versátil',
      description: module.description || defaultModuleDescription(module), metrics,
      benefits: metrics.map(item => item.label + ': ' + metricText(item.key, item.value)),
      capabilities: moduleCapabilities(module), effects: moduleEffects(module), favorite: Boolean(module.favorite)
    };
  }
  function compareModule(state, moduleId, planetId) {
    const candidate = state.inventory.find(module => module.id === moduleId);
    if (!candidate) return { current: null, candidate: null, rows: [], opens: [], closes: [], resourceLoss: [], label: 'Módulo indisponível', kind: 'sidegrade', allowed: false, reason: 'Escolha um módulo do armazém.' };
    const current = state.equipped[candidate.type], simulated = { ...state, equipped: { ...state.equipped, [candidate.type]: candidate } };
    const beforeStats = stats(state), afterStats = stats(simulated);
    const primary = TYPE_METRICS[candidate.type];
    const rows = Object.keys(METRICS).map(key => {
      const before = metricValue(beforeStats, key), after = metricValue(afterStats, key);
      const meta = METRICS[key];
      return { key, label: meta[0], before, after, unit: meta[1], higherIsBetter: meta[2], better: before === after ? 'neutral' : (Number(after) > Number(before)) === meta[2] ? 'up' : 'down' };
    }).filter(row => row.better !== 'neutral' || primary.includes(row.key));
    const opens = [], closes = [];
    state.galaxy.planets.forEach(planet => {
      const was = assess(state, planet.id).allowed, now = assess(simulated, planet.id).allowed;
      if (!was && now) opens.push({ id: planet.id, name: planet.name });
      if (was && !now) closes.push({ id: planet.id, name: planet.name });
    });
    const resourceLoss = ['fuel', 'oxygen', 'hull'].filter(key => state.resources[key] > afterStats['max' + key[0].toUpperCase() + key.slice(1)]).map(key => ({ key, amount: state.resources[key] - afterStats['max' + key[0].toUpperCase() + key.slice(1)] }));
    const improves = rows.some(row => row.better === 'up') || opens.length > 0, reduces = rows.some(row => row.better === 'down') || closes.length > 0;
    const kind = improves && reduces ? 'tradeoff' : improves ? 'upgrade' : reduces ? 'downgrade' : 'sidegrade';
    const labels = { tradeoff: 'Especialização com trocas', upgrade: 'Melhoria para esta nave', downgrade: 'Desempenho menor', sidegrade: 'Desempenho equivalente' };
    const checked = preview(state, 'equip', { moduleId });
    const target = planetId && state.galaxy.planets.find(planet => planet.id === planetId);
    return { current, candidate, rows, opens, closes, resourceLoss, label: labels[kind], kind, allowed: checked.allowed, reason: checked.reason,
      environment: target ? { id: target.id, name: target.name, before: assess(state, target.id), after: assess(simulated, target.id) } : null };
  }
  function suggestions(state, type, planetId) {
    return state.inventory.filter(module => module.type === type).map(module => {
      const comparison = compareModule(state, module.id, planetId), details = moduleDetails(state, module);
      let score = comparison.rows.reduce((sum, row) => sum + (row.better === 'up' ? 2 : row.better === 'down' ? -2 : 0), 0) + comparison.opens.length * 3 - comparison.closes.length * 2;
      if (comparison.environment) {
        const { before, after } = comparison.environment;
        if (!before.allowed && after.allowed) score += 40;
        if (before.allowed && !after.allowed) score -= 40;
        score += (before.missing.length - after.missing.length) * 5;
      }
      if (!comparison.allowed) score -= 100;
      const gained = comparison.rows.find(row => row.better === 'up');
      return { moduleId: module.id, kind: comparison.kind, score, label: details.specialty, summary: comparison.opens.length ? 'Abre ' + comparison.opens.length + ' mundo' + (comparison.opens.length === 1 ? '' : 's') : gained ? gained.label + ': ' + metricText(gained.key, gained.before) + ' → ' + metricText(gained.key, gained.after) : comparison.label };
    }).sort((a, b) => b.score - a.score || a.moduleId.localeCompare(b.moduleId));
  }
  function salvageInfo(state, moduleId) {
    const module = state.inventory.find(item => item.id === moduleId);
    if (!module) return null;
    const others = [...Object.values(state.equipped), ...state.inventory].filter(item => item.id !== module.id);
    const uniqueBenefits = [];
    Object.entries(moduleCapabilities(module)).forEach(([key, value]) => {
      if (Number(value) > Math.max(0, ...others.map(item => Number(moduleCapabilities(item)[key] || 0)))) uniqueBenefits.push(METRICS[key][0] + ': ' + metricText(key, value));
    });
    Object.entries(moduleEffects(module)).forEach(([key, value]) => {
      if (value > 0 && value > Math.max(0, ...others.map(item => moduleEffects(item)[key] || 0))) {
        const names = { hazardProtection: 'Proteção de travessias', collectionEfficiency: 'Coleta econômica' };
        uniqueBenefits.push(METRICS[key] ? METRICS[key][0] : names[key] || key);
      }
    });
    return { ore: Math.ceil(module.power * 3), credits: Math.ceil(module.power * 7), uniqueBenefits, favorite: Boolean(module.favorite) };
  }
  function currentPlanet(state) { const p=state.galaxy.planets.find(planet => planet.id === state.location.planetId);const env=state.guide?.v===2&&state.guide.active&&state.expedition?p?.sites.find(t=>t.id===state.expedition.siteId)?.environment:null;return env?{...p,...env}:p; }
  function currentSystem(state) {
    const planet = currentPlanet(state);
    return state.galaxy.systems.find(system => planet && system.id === planet.systemId);
  }
  function surveyCounts(planets) {
    const totalPlanets = planets.length, discovered = planets.filter(planet => planet.scanned).length;
    const totalSites = planets.reduce((sum, planet) => sum + planet.sites.length, 0);
    const completedSites = planets.reduce((sum, planet) => sum + planet.sites.filter(site => site.explored).length, 0);
    const completed = planets.filter(planet => planet.scanned && planet.sites.every(site => site.explored)).length;
    return { totalPlanets, unknown: totalPlanets - discovered, discovered, completed, completedSites, totalSites, percent: totalSites ? Math.floor(completedSites / totalSites * 100) : 0 };
  }
  function expandArchiveCounts(row) {
    const [, totalPlanets, discovered, completed, totalSites, completedSites] = row;
    return { totalPlanets, unknown: totalPlanets - discovered, discovered, completed, completedSites, totalSites, percent: totalSites ? Math.floor(completedSites / totalSites * 100) : 0 };
  }
  function archiveGalaxy(state) {
    if (!state.surveyArchive) state.surveyArchive = { entries: [], earlier: [0, 0, 0, 0, 0, 0], unavailable: state.galaxyIndex };
    const counts = surveyCounts(state.galaxy.planets), archive = state.surveyArchive;
    archive.entries.push([state.galaxyIndex, GALAXY_KINDS.indexOf(state.galaxy.kind), counts.totalPlanets, counts.discovered, counts.completed, counts.totalSites, counts.completedSites]);
    if (archive.entries.length > ARCHIVE_LIMIT) {
      const oldest = archive.entries.shift();
      archive.earlier[0]++;
      for (let i = 1; i < 6; i++) archive.earlier[i] += oldest[i + 1];
    }
  }
  function discoveryCatalog(state) {
    const galaxy = state.galaxy, archive = state.surveyArchive || { entries: [], earlier: [0, 0, 0, 0, 0, 0], unavailable: state.galaxyIndex };
    const current = { id: galaxy.id, index: state.campaign?.atHome ? 0 : state.galaxyIndex, name: galaxy.name, kind: galaxy.kind, ...surveyCounts(galaxy.planets), systems: galaxy.systems.map(system => {
      const planets = galaxy.planets.filter(planet => planet.systemId === system.id);
      return { id: system.id, name: system.name, ...surveyCounts(planets), planets: planets.map(planet => {
        const completedSites = planet.sites.filter(site => site.explored).length;
        return { id: planet.id, name: planet.scanned ? planet.name : null, biome: planet.scanned ? planet.biome : null, scanned: planet.scanned, completedSites, totalSites: planet.sites.length, percent: Math.floor(completedSites / planet.sites.length * 100), complete: planet.scanned && completedSites === planet.sites.length, current: planet.id === state.location.planetId };
      }) };
    }) };
    const archives = archive.entries.slice().reverse().map(row => ({ id: 'galaxy-' + row[0], index: row[0], name: celestialName(state.seed, row[0], GALAXY_KINDS[row[1]], 0), kind: GALAXY_KINDS[row[1]], ...expandArchiveCounts(row.slice(1)) }));
    let unavailableGalaxies = archive.unavailable;
    const earlierCounts = archive.earlier.slice();
    // The campaign return displays the real home map; the frontier remains a distinct visited galaxy.
    if (state.campaign?.atHome && state.campaign.frontier) {
      const homeIndex = archives.findIndex(item => item.index === 0);
      if (homeIndex >= 0) archives.splice(homeIndex, 1);
      else if (unavailableGalaxies > 0) unavailableGalaxies--;
      else if (earlierCounts[0] > 0) {
        const home = generateGalaxy(state.seed, 0, 'frontier');
        for (const [i, scan, bits] of state.campaign.homeSurvey || []) {
          const planet = home.planets[i];
          if (planet) { planet.scanned = !!scan; planet.sites.forEach((site, k) => { site.explored = !!(bits & (1 << k)); }); }
        }
        const counts = surveyCounts(home.planets);
        earlierCounts[0]--;
        ['totalPlanets', 'discovered', 'completed', 'totalSites', 'completedSites'].forEach((key, i) => { earlierCounts[i + 1] = Math.max(0, earlierCounts[i + 1] - counts[key]); });
      }
      const saved = state.campaign.frontier, frontier = generateGalaxy(state.seed, state.galaxyIndex, saved.kind);
      for (const [i, scan, bits] of saved.survey) {
        const planet = frontier.planets[i];
        if (planet) { planet.scanned = !!scan; planet.sites.forEach((site, k) => { site.explored = !!(bits & (1 << k)); }); }
      }
      archives.unshift({ id: frontier.id, index: state.galaxyIndex, name: frontier.name, kind: frontier.kind, ...surveyCounts(frontier.planets) });
    }
    const earlier = { totalGalaxies: earlierCounts[0], ...expandArchiveCounts(earlierCounts) };
    const totals = { totalGalaxies: state.visitedGalaxies, recordedGalaxies: archives.length + earlier.totalGalaxies + 1, totalPlanets: earlier.totalPlanets, unknown: earlier.unknown, discovered: earlier.discovered, completed: earlier.completed, completedSites: earlier.completedSites, totalSites: earlier.totalSites };
    for (const summary of [current, ...archives]) for (const key of ['totalPlanets', 'unknown', 'discovered', 'completed', 'completedSites', 'totalSites']) totals[key] += summary[key];
    totals.percent = totals.totalSites ? Math.floor(totals.completedSites / totals.totalSites * 100) : 0;
    return { current, archives, totals, earlier, unavailableGalaxies };
  }
  function travelCost(state, planetId) {
    const target = state.galaxy.planets.find(planet => planet.id === planetId);
    const current = currentPlanet(state);
    if (!target || !current) return null;
    if (current.id === target.id) return 0;
    const crossSystem = current.systemId !== target.systemId;
    return Math.ceil(((crossSystem ? 24 : 10) + Math.abs(target.distance - current.distance) * 0.07) / stats(state).fuelEfficiency);
  }
  function destinations(state) {
    const index = state.galaxyIndex + 1;
    return Object.entries(GALAXY_ROUTES).map(([kind, value]) => ({ id: 'route-' + index + '-' + kind, index, name: celestialName(state.seed, index, kind, 0), kind, description: value.description, warpCost: Math.max(1, Math.round(value.cost / stats(state).warpEfficiency)) }));
  }
  function warpCost(state, destinationId) {
    const choices = destinations(state);
    const destination = destinationId ? choices.find(item => item.id === destinationId) : choices[0];
    return destination ? destination.warpCost : null;
  }
  const REQUIREMENT_META = {
    heat: ['Proteção térmica', '°C', 'shield'], cold: ['Isolamento criogênico', '°C', 'survival'],
    radiation: ['Blindagem radiológica', 'rad', 'shield'], pressure: ['Resistência à pressão', 'atm', 'life'],
    toxicity: ['Filtragem tóxica', '%', 'life'], gas: ['Sonda atmosférica', '', 'arm'], liquid: ['Operação submersa', '', 'survival']
  };
  function requirementsFor(capabilities, needs) {
    return Object.entries(needs).filter(([, value]) => value > 0).map(([key, value]) => {
      const [label, unit, moduleType] = REQUIREMENT_META[key];
      const available = Number(capabilities[key] || 0), required = Number(value);
      return { key, label, required, available, unit, met: available >= required, moduleType };
    });
  }
  function assessSystem(state, systemId) {
    const system = state.galaxy.systems.find(item => item.id === systemId);
    if (!system) return { allowed: false, level: 'blocked', label: 'Sistema desconhecido', requirements: [], missing: [], cost: {}, system: null };
    const requirements = requirementsFor(protection(state), { heat: system.heat, radiation: system.radiation });
    const missing = requirements.filter(item => !item.met);
    return { allowed: missing.length === 0, level: missing.length ? 'blocked' : requirements.length ? 'risky' : 'safe', label: missing.length ? 'Sistema inacessível' : requirements.length ? 'Rota estelar hostil' : 'Rota estável', requirements, missing, cost: {}, system };
  }
  function assess(state, planetId, siteId) {
    let planet = state.galaxy.planets.find(item => item.id === (planetId || state.location.planetId));
    if (!planet) return { allowed: false, level: 'blocked', label: 'Planeta desconhecido', requirements: [], missing: [], cost: {}, operation: 'landing', operationLabel: 'Ancorar', system: null };
    const site = siteId ? planet.sites.find(item => item.id === siteId) : null;
    if (siteId && !site) return { allowed: false, level: 'blocked', label: 'Local desconhecido', requirements: [], missing: [], cost: {}, operation: 'landing', operationLabel: 'Ancorar', system: null };
    if(state.guide?.v===2&&state.guide.active&&site?.environment)planet={...planet,...site.environment};
    const system = state.galaxy.systems.find(item => item.id === planet.systemId);
    const computed = stats(state), caps = computed.protection;
    const difficulty = site ? site.difficulty : 1;
    const depth = difficulty - 1;
    const needs = {
      heat: Math.max(system.heat, planet.temperature > 0 ? planet.temperature + (planet.temperature > 100 ? depth * 45 : 0) : 0),
      cold: planet.temperature < 0 ? -planet.temperature + depth * 8 : 0,
      radiation: Math.max(system.radiation, planet.radiation + depth * 10),
      pressure: rounded(planet.pressure * (1 + depth * 0.25)),
      toxicity: Math.min(100, planet.toxicity + (planet.toxicity > 20 ? depth * 5 : 0)),
      gas: planet.medium === 'gas' ? 1 : 0,
      liquid: planet.medium === 'liquid' ? 1 : 0
    };
    const requirements = requirementsFor(caps, needs), missing = requirements.filter(item => !item.met);
    const peak = Math.min(2, Math.max(0, ...requirements.filter(item => !['gas', 'liquid'].includes(item.key)).map(item => item.required / Math.max(1, item.available))));
    const weather = Math.min(100, planet.weather + depth * 8);
    const pleasant = weather <= 18 && difficulty === 1 && planet.temperature >= -10 && planet.temperature <= 55 && planet.radiation <= 22 && planet.medium === 'solid';
    const oxygen = Math.max(4, Math.ceil(((state.guide?.active?7:33) + weather * 0.08 + depth * 3 + (planet.medium === 'gas' ? 5 : planet.medium === 'liquid' ? 3 : 0) + peak * 2) / computed.oxygenEfficiency));
    const hull = pleasant ? 0 : Math.max(1, Math.ceil(weather / 13 + depth * 2 + peak * 3 - state.equipped.shield.power * 1.7 - state.equipped.survival.power));
    const operation = planet.medium === 'gas' ? 'atmospheric' : planet.medium === 'liquid' ? 'submerge' : 'landing';
    const operationLabel = operation === 'atmospheric' ? 'Iniciar sondagem' : operation === 'submerge' ? 'Submergir' : 'Ancorar';
    return {
      allowed: !missing.length, level: missing.length ? 'blocked' : hull > 0 ? 'risky' : 'safe',
      label: missing.length ? 'Equipamento insuficiente' : hull > 0 ? 'Expedição exigente' : 'Ambiente favorável',
      requirements, missing, cost: { fuel: Math.max(3, Math.ceil(((state.guide?.active?5:12) + depth * 3) / computed.fuelEfficiency)), oxygen, hull }, operation, operationLabel, difficulty, weather,
      rewardMultiplier: rounded(1 + (difficulty - 1) * 0.3 + (planet.biome === 'magma' || system.kind === 'pulsar' ? 0.45 : 0) + (planet.medium !== 'solid' ? 0.2 : 0)), system
    };
  }
  function explorationCost(state, siteId) {
    return assess(state, state.location.planetId, siteId).cost;
  }
  function missingMessage(assessment) {
    return assessment.missing.map(item => item.key === 'gas' || item.key === 'liquid' ? item.label : item.label + ': exige ' + item.required + ' ' + item.unit + ', nave ' + item.available + ' ' + item.unit).join(' · ') + '. Fabrique e equipe módulos adequados na nave.';
  }

  const FRAGMENTS = [
    { id: 'origin', name: 'Origem', description: 'Um eco guardado em terra firme e no gelo.', biomes: ['forest', 'desert', 'ice', 'crystal', 'rogue'] },
    { id: 'ember', name: 'Brasa', description: 'Uma frequência preservada em calor ou corrosão.', biomes: ['volcanic', 'magma', 'toxic'] },
    { id: 'tide', name: 'Maré', description: 'Um sinal disperso em oceanos e atmosferas gigantes.', biomes: ['ocean', 'gas'] }
  ];
  function fragmentForBiome(biome) { return FRAGMENTS.find(item => item.biomes.includes(biome)).id; }
  function beaconView(state) {
    const discovery = state.discovery || { fragments: {}, claimed: false };
    const fragments = FRAGMENTS.map(item => ({ ...item, collected: discovery.fragments[item.id] === true }));
    const count = fragments.filter(item => item.collected).length;
    return { fragments, count, ready: count === 3 && !discovery.claimed, claimed: discovery.claimed, rewardName: 'Núcleo do Cartógrafo' };
  }
  function expeditionGeometry(expedition) {
    const rng = generator(hashSeed(expedition.seed + ':route'));
    const core = { x: expedition.tutorial ? 3 : integer(rng, 0, 5), y: 0 };
    const lane = expedition.tutorial ? 2 : integer(rng, Math.min(2, core.x), Math.max(2, core.x));
    const path = new Set([32]);
    let x = 2, y = 5;
    const walk = (tx, ty) => {
      while (x !== tx) { x += Math.sign(tx - x); path.add(y * 6 + x); }
      while (y !== ty) { y += Math.sign(ty - y); path.add(y * 6 + x); }
    };
    walk(2, 4); walk(lane, 4); walk(lane, 0); walk(core.x, 0);
    return { core, path };
  }
  function expeditionBeacons(e){const g=expeditionGeometry(e);return [4,2].map(y=>[...g.path].find(i=>Math.floor(i/6)===y));}
  const reactions={forest:'Esporos de defesa',ice:'Nevasca das ruínas',volcanic:'Instabilidade vulcânica',magma:'Erupção de plasma',gas:'Colapso da corrente',ocean:'Corrente abissal',toxic:'Vazamento corrosivo',desert:'Tempestade de poeira',crystal:'Ressonância dos cristais',rogue:'Descarga das ruínas'};
  // Every site is explored or out of reach even after swapping in any owned module, and warp fuel is short.
  function galaxyExhausted(state) {
    if (state.resources.warpFuel >= warpCost(state)) return false;
    const variants = [state, ...state.inventory.filter(module => module && state.equipped[module.type]).map(module => ({ ...state, equipped: { ...state.equipped, [module.type]: module } }))];
    return state.galaxy.planets.every(item => item.sites.every(site => site.explored || variants.every(variant => !assess(variant, item.id, site.id).allowed)));
  }
  function siteOperation(state,siteId){
    const id=siteId||state.expedition?.siteId,op=state.siteOperations?.[id];
    const planet=state.galaxy.planets.find(p=>p.sites.some(s=>s.id===id));
    const elapsed=state.expedition?.siteId===id?(state.expedition.weatherOffset||0)+state.expedition.turns:op?.elapsed||0;
    const enabled=!state.guide?.active&&!!planet;
    return {enabled,visits:op?.visits||0,elapsed,triggered:op?.reactionAt!=null,stabilized:!!op?.stabilized,remaining:op?.reactionAt==null?6:Math.max(0,op.reactionAt-elapsed),active:enabled&&!op?.stabilized&&op?.reactionAt!=null&&elapsed>=op.reactionAt,label:reactions[planet?.biome]||'Instabilidade local'};
  }
  function checkpointSite(state){
    const e=state.expedition;if(!e||state.guide?.active)return;
    const all=state.siteOperations||(state.siteOperations={}),op=all[e.siteId]||(all[e.siteId]={visits:1,elapsed:0,reactionAt:null,stabilized:false,revealed:[],beacons:[],puzzle:null});
    op.elapsed=(e.weatherOffset||0)+e.turns;op.revealed=[...new Set([...op.revealed,...e.revealed])];op.beacons=[...(e.beacons||[])];op.puzzle=e.puzzle?clone(e.puzzle):op.puzzle;
    if(e.fieldTask)op.fieldTask=clone(e.fieldTask);if(e.storyStep!==undefined)op.storyStep=e.storyStep;
  }

  function fieldWeather(state){
    const e=state.expedition,p=currentPlanet(state);if(!e||!e.adventure&&!(state.guide?.v===2&&state.guide.active))return null;
    const rigorous=p.weather>=35||['gas','magma','volcanic','ice','toxic'].includes(p.biome),phase=((e.weatherOffset||0)+e.turns)%8,op=siteOperation(state);
    const natural={rigorous,phase,active:rigorous&&phase>=5,warning:rigorous&&phase>=3&&phase<5,remaining:phase<3?3-phase:phase<5?5-phase:8-phase,label:({ice:'Blizzard',volcanic:'Cinzas',magma:'Chuva de brasas',gas:'Turbulência',ocean:'Correntes',toxic:'Nuvem corrosiva',desert:'Tempestade de areia'})[p.biome]||'Ventania'};
    if(op.active)return {...natural,rigorous:true,active:true,warning:false,persistent:true,remaining:null,label:op.label};
    if(op.triggered&&!op.stabilized&&!natural.active)return {...natural,rigorous:true,warning:true,remaining:op.remaining,label:op.label};
    return natural;
  }
  function expeditionBoard(expedition) {
    const rng = generator(expedition.seed), geometry = expeditionGeometry(expedition);
    const protectedCells = new Set(geometry.path);
    let caches = [25, 22, 7, 10];
    if (expedition.tutorial) [25, 21, 22, 7, 9, 10].forEach(index => protectedCells.add(index));
    else {
      const options = Array.from({ length: 30 }, (_, i) => i + 6).filter(index => index !== 32 && !protectedCells.has(index) && [...protectedCells].some(adjacent => Math.abs(index % 6 - adjacent % 6) + Math.abs(Math.floor(index / 6) - Math.floor(adjacent / 6)) === 1));
      caches = [];
      while (caches.length < 4 && options.length) caches.push(options.splice(integer(rng, 0, options.length - 1), 1)[0]);
      caches.forEach(index => protectedCells.add(index));
    }
    const cells = Array.from({ length: 36 }, (_, index) => {
      const roll = rng();
      return { x: index % 6, y: Math.floor(index / 6), kind: protectedCells.has(index) ? 'empty' : roll < 0.19 ? 'wall' : roll < 0.44 ? 'hazard' : 'empty' };
    });
    cells[32].kind = 'base'; cells[geometry.core.x].kind = expedition.coreSecured ? 'empty' : 'core';
    caches.forEach((index, i) => { cells[index].kind = ['ore', 'ore', 'data', 'crystal'][i]; });
    if(expedition.adventure&&!expedition.coreSecured)for(const index of expeditionBeacons(expedition))cells[index].kind='beacon';
    return cells;
  }
  function expeditionPuzzle(seed) {
    const rng = generator(hashSeed(seed + ':circuit'));
    const target = [integer(rng, 0, 3), integer(rng, 0, 3), integer(rng, 0, 3)];
    const dials = [...target];
    const scramble = [integer(rng, 1, 3), integer(rng, 0, 3), integer(rng, 1, 3)];
    scramble.forEach((count, i) => { dials[i] = (dials[i] + count) % 4; dials[(i + 1) % 3] = (dials[(i + 1) % 3] + count) % 4; });
    if (dials.every((value, i) => value === target[i])) { dials[0] = (dials[0] + 1) % 4; dials[1] = (dials[1] + 1) % 4; }
    return { dials, target };
  }
  function revealExpedition(expedition, radius) {
    const revealed = new Set(expedition.revealed);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) if (Math.abs(x - expedition.x) + Math.abs(y - expedition.y) <= radius) revealed.add(y * 6 + x);
    expedition.revealed = [...revealed];
  }
  function siteStatus(state,siteId){
    const planet=state.galaxy.planets.find(p=>p.sites.some(t=>t.id===siteId)),site=planet?.sites.find(t=>t.id===siteId);
    if(!site)return {exhausted:true,remaining:0,coreSecured:false,percent:0};
    const collected=(state.siteCaches?.[siteId]||[]).length,remaining=Math.max(0,4-collected);
    return {coreSecured:site.explored,remaining,collected,exhausted:site.explored&&remaining===0,percent:Math.round((collected+(site.explored?1:0))/5*100)};
  }
  function createExpedition(state, site) {
    const planet = currentPlanet(state), assessment = assess(state, planet.id, site.id);
    const computed = stats(state), reserve = state.guide?.active ? (state.guide.v===2&&state.guide.region>0?24:48) : computed.expeditionReserve, integrity = computed.expeditionIntegrity;
    const expedition = {
      seed: hashSeed(planet.seed + ':' + site.id + ':expedition'), planetId: planet.id, siteId: site.id,
      x: 2, y: 5, reserve, maxReserve: reserve, integrity, maxIntegrity: integrity, turns: 0, scans: 0,
      capacity: state.guide?.active ? Math.max(8, computed.expeditionCapacity) : computed.expeditionCapacity, load: 0,
      revealed: [32], visited: [32], collected: [...(state.siteCaches[site.id] || [])], harvested: [],
      coreSecured: !!site.explored, coreRecovered: false, tutorial: planet.id === 'g0-p0' && (site.id === 'g0-p0-s0'||state.guide?.v===2&&state.guide.active), firstExpedition: state.progress.explorations === 0, rewardMultiplier: assessment.rewardMultiplier,
      pending: { ore: 0, crystals: 0, credits: 0, data: 0 }, puzzle: null,
      ...(state.guide&&!state.guide.active?{adventure:true,beacons:[]}: {})
    };
    expedition.revealed.push(expeditionGeometry(expedition).core.x);
    if(expedition.adventure&&!expedition.coreSecured)expedition.revealed.push(...expeditionBeacons(expedition));
    revealExpedition(expedition, 1);
    if(!state.guide?.active){const op=state.siteOperations?.[site.id];expedition.weatherOffset=op?(op.elapsed+2):0;if(op){expedition.revealed=[...new Set([...expedition.revealed,...op.revealed])];if(expedition.adventure)expedition.beacons=[...op.beacons];if(!site.explored&&op.puzzle)expedition.puzzle=clone(op.puzzle);if(!site.explored&&op.fieldTask)expedition.fieldTask=clone(op.fieldTask);if(!site.explored&&op.storyStep!==undefined)expedition.storyStep=op.storyStep;}}
    return expedition;
  }
  function movementCost(state, tile, worstWeather=false) {
    const hazardous = tile.kind === 'hazard';
    const weather=fieldWeather(state),extra=hazardous&&weather?.rigorous&&(worstWeather||weather.active)?1:0;
    const op=siteOperation(state),pressure=tile.kind!=='base'&&!op.stabilized&&(op.active||worstWeather&&op.triggered)?1:0;
    return { reserve: (hazardous ? 2 : 1)+extra+pressure, integrity: hazardous ? stats(state).hazardDamage : 0 };
  }
  function planExpedition(state, action, data) {
    const expedition = state.expedition;
    if (!expedition) return reject('Inicie uma expedição em um local descoberto.');
    const board = expeditionBoard(expedition), current = board[expedition.y * 6 + expedition.x];
    const info = {}, cost = {};
    const atCore = current.kind === 'core';
    switch (action) {
      case 'expeditionBeacon':
        if(!expedition.adventure||current.kind!=='beacon'||expedition.beacons.includes(expedition.y*6+expedition.x))return reject('Alcance uma baliza ainda inativa.');
        cost.reserve=1;break;
      case 'expeditionWait':
        if(expedition.turns>=9999)return reject('Encerre esta saída antes de aguardar novamente.');
        if(!fieldWeather(state)?.rigorous)return reject('O clima está estável.');
        cost.reserve=expedition.x===2&&expedition.y===5?0:1;break;
      case 'expeditionMove': {
        if (!Number.isInteger(data.x) || !Number.isInteger(data.y) || data.x < 0 || data.x >= 6 || data.y < 0 || data.y >= 6) return reject('Escolha uma posição válida do mapa.');
        if (Math.abs(data.x - expedition.x) + Math.abs(data.y - expedition.y) !== 1) return reject('Avance um setor por vez, na horizontal ou vertical.');
        const tile = board[data.y * 6 + data.x];
        if (tile.kind === 'wall') return reject('Passagem obstruída. Procure outra rota.');
        Object.assign(cost, movementCost(state, tile));
        Object.assign(info, { x: data.x, y: data.y, localCost: cost });
        break;
      }
      case 'expeditionReturn': {
        const route = expeditionReturnRoute(state);
        if (route.atBase) return reject('Você já está na nave. Extraia a carga para encerrar a expedição.');
        if (!route.canReturn) return reject(route.reason, route.known ? { reserve: route.reserve, integrity: route.integrity } : {});
        Object.assign(cost, { reserve: route.reserve, integrity: route.integrity });
        info.route = route.path;
        break;
      }
      case 'expeditionScan':
        cost.reserve = 2;
        break;
      case 'expeditionCollect':
        if (!['ore', 'data', 'crystal'].includes(current.kind) || expedition.collected.includes(expedition.y * 6 + expedition.x)) return reject('Não há uma reserva de recursos para coletar neste setor.');
        if (expedition.load >= expedition.capacity) return reject('Compartimento da expedição cheio. Extraia a carga antes de coletar mais.');
        info.intensive=data.intensive===true;
        cost.reserve = stats(state).collectionCost+(info.intensive?3:0);
        if(info.intensive)cost.integrity=1;
        break;
      case 'expeditionInteract':
        if (!atCore) return reject('Alcance o núcleo para abrir o circuito.');
        if(expedition.adventure&&expedition.beacons.length<2)return reject('Ative as duas balizas do terreno para triangular este sinal.');
        if (expedition.coreRecovered) return reject('O núcleo deste local já está na carga.');
        break;
      case 'expeditionTune':
        if(expedition.adventure&&expedition.beacons.length<2)return reject('Falta triangular o sinal nas duas balizas.');
        if (!atCore || !expedition.puzzle || expedition.coreRecovered) return reject('Abra o circuito no setor do núcleo.');
        if (!Number.isInteger(data.index) || data.index < 0 || data.index > 2) return reject('Escolha um dos três rotores.');
        info.index = data.index;
        break;
      case 'expeditionRecover':
        if(expedition.adventure&&expedition.beacons.length<2)return reject('Falta triangular o sinal nas duas balizas.');
        if (!atCore || !expedition.puzzle || expedition.coreRecovered) return reject('Abra o circuito no setor do núcleo.');
        if (expedition.load + 3 > expedition.capacity) return reject('O núcleo ocupa 3 espaços. Extraia a carga de recursos e volte para recuperá-lo.');
        info.matched = expedition.puzzle.dials.every((value, index) => value === expedition.puzzle.target[index]);
        cost.reserve = info.matched ? 3 : 2;
        break;
      case 'expeditionSalvage':
        if (!expedition.pending.module) return reject('Não há módulo recuperado para desmontar.');
        break;
      case 'expeditionExtract':
        if (current.kind !== 'base') return reject('Retorne ao ponto de extração para guardar a carga.');
        if (!expedition.coreRecovered && expedition.load === 0) return reject('Recupere recursos ou o núcleo antes de extrair; use evacuar para desistir.');
        if (expedition.pending.module && state.inventory.length >= stats(state).cargoCapacity) return reject('Armazém da nave cheio. Desmonte o módulo da expedição para extraí-lo como minério.');
        break;
      case 'expeditionAbort':
        break;
      default: return reject('Ação de expedição desconhecida.');
    }
    if (cost.reserve && expedition.reserve < cost.reserve) return reject('Reserva insuficiente. Evacue para voltar à nave; a carga desta saída será perdida.', cost);
    if (cost.integrity && expedition.integrity <= cost.integrity) return reject('A integridade local não suporta esta travessia. Procure outra rota ou evacue.', cost);
    return { ok: true, cost, info };
  }
  function expeditionReturnRoute(state) {
    const expedition = state.expedition;
    if (!expedition) return null;
    const board = expeditionBoard(expedition), known = new Set(expedition.revealed);
    const start = expedition.y * 6 + expedition.x, atBase = start === 32;
    const summarize = label => {
      const knownRoute = Boolean(label), reserve = knownRoute ? label.reserve : null, integrity = knownRoute ? label.integrity : null;
      const afterReserve = knownRoute ? expedition.reserve - reserve : null;
      const afterIntegrity = knownRoute ? expedition.integrity - integrity : null;
      const canReturn = knownRoute && afterReserve >= 0 && afterIntegrity > 0;
      let reason = '';
      if (!knownRoute) reason = 'Nenhuma rota conhecida conecta sua posição à nave. Revele uma passagem antes de avançar.';
      else if (afterIntegrity <= 0) reason = 'A rota conhecida exige ' + integrity + ' de integridade; você tem ' + expedition.integrity + '. Procure uma passagem menos perigosa.';
      else if (afterReserve < 0) reason = 'Faltam ' + -afterReserve + ' de energia para retornar à nave por uma rota conhecida.';
      return { known: knownRoute, path: knownRoute ? label.path.map(index => ({ x: index % 6, y: Math.floor(index / 6) })) : [], steps: knownRoute ? label.path.length : null,
        reserve, integrity, afterReserve, afterIntegrity, canReturn, reason, atBase };
    };
    // Keep nondominated energy/damage routes: the shortest route may cross hazards
    // the suit cannot survive, while a slightly longer, safe route remains possible.
    // Each step is priced on the turn it would actually be taken (weather phase and the site reaction
    // change over time). Pricing every step at the worst case refused returns that walking completed
    // and overcharged the automatic return by 4-6 energy right after a core recovery.
    const stepCost = (tile, offset) => offset ? movementCost({ ...state, expedition: { ...expedition, turns: expedition.turns + offset } }, tile) : movementCost(state, tile);
    const first = { node: start, reserve: 0, integrity: 0, path: [] };
    const labels = new Map(), heap = [first];
    const key = label => label.node * 64 + label.path.length;
    const better = (a, b) => a.reserve - b.reserve || a.integrity - b.integrity || a.path.length - b.path.length;
    const push = label => { heap.push(label); let i = heap.length - 1; while (i) { const parent = (i - 1) >> 1; if (better(heap[parent], heap[i]) <= 0) break; [heap[parent], heap[i]] = [heap[i], heap[parent]]; i = parent; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && better(heap[l], heap[m]) < 0) m = l; if (r < heap.length && better(heap[r], heap[m]) < 0) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    labels.set(key(first), [first]);
    let fallback = null;
    while (heap.length) {
      const label = pop();
      if (!(labels.get(key(label)) || []).includes(label)) continue;
      if (label.node === 32) {
        if (label.integrity < expedition.integrity) return summarize(label);
        if (!fallback) fallback = label;
        continue;
      }
      if (label.path.length >= 48) continue;
      const tile = board[label.node];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = tile.x + dx, y = tile.y + dy;
        if (x < 0 || y < 0 || x >= 6 || y >= 6) continue;
        const index = y * 6 + x;
        if (!known.has(index) || board[index].kind === 'wall') continue;
        const cost = stepCost(board[index], label.path.length);
        const candidate = { node: index, reserve: label.reserve + cost.reserve, integrity: label.integrity + cost.integrity, path: [...label.path, index] };
        const slot = key(candidate), existing = labels.get(slot) || [];
        if (existing.some(other => other.reserve <= candidate.reserve && other.integrity <= candidate.integrity)) continue;
        labels.set(slot, [...existing.filter(other => !(candidate.reserve <= other.reserve && candidate.integrity <= other.integrity)), candidate]);
        push(candidate);
      }
    }
    return summarize(fallback);
  }
  function expeditionSafety(state, action, payload, prepared) {
    if (!state.expedition || !String(action).startsWith('expedition')) return null;
    const result = prepared || planExpedition(state, action, payload || {}), cost = result.cost || {};
    const projected = { ...state, expedition: { ...state.expedition } }, expedition = projected.expedition;
    expedition.reserve -= cost.reserve || 0;
    expedition.integrity -= cost.integrity || 0;
    if (result.ok && action === 'expeditionMove') { expedition.x = result.info.x; expedition.y = result.info.y; }
    if (result.ok && action === 'expeditionReturn') { expedition.x = 2; expedition.y = 5; }
    // Every expedition action advances the field clock; price the way back from the turn after it.
    if (result.ok) expedition.turns = (expedition.turns || 0) + 1;
    if(result.ok&&action==='expeditionRecover'&&result.info.matched&&!state.guide?.active){projected.siteOperations=clone(state.siteOperations||{});const id=expedition.siteId;projected.siteOperations[id]={...(projected.siteOperations[id]||{}),reactionAt:(expedition.weatherOffset||0)+expedition.turns+6};}
    const route = expeditionReturnRoute(projected);
    const returnMargin = route.known ? expedition.reserve - route.reserve : null;
    const integrityMargin = route.known ? expedition.integrity - route.integrity : null;
    const stranded = !route.canReturn;
    const risky = stranded || !route.atBase && (returnMargin <= 2 || integrityMargin <= 2);
    let reason = route.reason;
    if (stranded) reason = 'Após esta ação: ' + reason.charAt(0).toLowerCase() + reason.slice(1);
    else if (risky) reason = 'Após esta ação, a volta consome ' + route.reserve + ' de energia. Sua folga será de ' + returnMargin + '.';
    return { afterReserve: expedition.reserve, afterIntegrity: expedition.integrity, costReserve: cost.reserve || 0, costIntegrity: cost.integrity || 0,
      returnReserve: route.reserve, returnIntegrity: route.integrity, returnMargin, integrityMargin, knownRoute: route.known, stranded, risky, reason };
  }
  // Kind of the cell under the rover, as expeditionView would report it, without running every move/action preview.
  function expeditionCellKind(state) {
    const expedition = state.expedition;
    if (!expedition) return null;
    if (!expedition.revealed.includes(expedition.y * 6 + expedition.x)) return 'unknown';
    return expeditionBoard(expedition).find(tile => tile.x === expedition.x && tile.y === expedition.y)?.kind ?? null;
  }
  function expeditionView(state) {
    const expedition = state.expedition;
    if (!expedition) return null;
    const planet = currentPlanet(state), site = planet.sites.find(item => item.id === expedition.siteId);
    const known = new Set(expedition.revealed), back = expeditionReturnRoute(state);
    const cells = expeditionBoard(expedition).map(tile => {
      const index = tile.y * 6 + tile.x, visible = known.has(index);
      const adjacent = Math.abs(tile.x - expedition.x) + Math.abs(tile.y - expedition.y) === 1;
      const move = adjacent ? preview(state, 'expeditionMove', { x: tile.x, y: tile.y }) : null;
      return {
        x: tile.x, y: tile.y, kind: visible ? tile.kind : 'unknown', visible,
        visited: expedition.visited.includes(index), collected: visible && (expedition.beacons?.includes(index) || expedition.collected.includes(index) || tile.kind === 'core' && expedition.coreRecovered),
        current: expedition.x === tile.x && expedition.y === tile.y, adjacent,
        traversalCost: visible && tile.kind !== 'wall' ? movementCost(state,tile) : null,
        moveAllowed: Boolean(move && move.allowed), moveCost: move ? move.cost : {}, safety: move ? move.safety : null, reason: move ? move.reason : ''
      };
    });
    const actions = Object.fromEntries(['Scan', 'Collect', 'Interact', 'Recover', 'Return', 'Extract', 'Abort', 'Salvage'].map(action => [action.toLowerCase(), preview(state, 'expedition' + action)]));
    return {
      width: 6, height: 6, planetId: planet.id, siteId: site.id, siteName: site.name, biome: planet.biome, medium: planet.medium,
      position: { x: expedition.x, y: expedition.y }, base: { x: 2, y: 5 }, core: expedition.coreSecured ? null : expeditionGeometry(expedition).core,
      reserve: expedition.reserve, maxReserve: expedition.maxReserve, integrity: expedition.integrity, maxIntegrity: expedition.maxIntegrity,
      turns: expedition.turns, returnDistance: back.steps, returnReserve: back.reserve, returnIntegrity: back.integrity, returnMargin: back.afterReserve, returnRoute: back, returnBlocked: !back.canReturn,
      returnRisk: !back.canReturn || !back.atBase && (back.afterReserve <= 2 || back.afterIntegrity <= 2), atBase: back.atBase,
      weather:fieldWeather(state),beacons:expedition.adventure?{done:expedition.beacons.length,total:2}:null,
      coreSecured: !!expedition.coreSecured, coreRecovered: expedition.coreRecovered, capacity: expedition.capacity, load: expedition.load, pending: clone(expedition.pending),
      puzzle: expedition.puzzle ? { ...clone(expedition.puzzle), matched: expedition.puzzle.dials.every((value, i) => value === expedition.puzzle.target[i]), rule: 'Girar um rotor também gira o seguinte. Cada posição avança um quarto de volta.', cost: 3 } : null,
      trail:expedition.visited.map(i=>({x:i%6,y:Math.floor(i/6)})),cells, actions, discovery: beaconView(state)
    };
  }

  function reject(message, cost) { return { ok: false, message, cost: cost || {} }; }
  function plan(state, action, payload) {
    const data = payload || {};
    const planet = currentPlanet(state);
    const computed = stats(state);
    const res = state.resources;
    let cost = {};
    let info = {};
    if (!planet) return reject('Posição desconhecida. Carregue uma exploração válida.');
    if (action.startsWith('expedition')) return planExpedition(state, action, data);
    if (state.expedition&&action!=='stabilizeSite') return reject('Retorne à base e extraia a carga, ou evacue a expedição, antes de usar a nave.');
    if(state.location.stationId&&['travel','scan','dock','warp','launch'].includes(action))return reject('Desatraque do entreposto antes de navegar até um planeta ou iniciar uma dobra.');
    switch (action) {
      case 'stationDock':
        if(state.location.mode!=='orbit')return reject('Decole do planeta antes de viajar ao entreposto.');
        if(state.location.stationId)return reject('Sua nave já está atracada neste entreposto.');
        cost={fuel:Math.max(3,Math.ceil(8/computed.fuelEfficiency)),oxygen:2};break;
      case 'stationLeave':
        if(!state.location.stationId)return reject('Sua nave não está no entreposto.');
        cost={fuel:Math.max(3,Math.ceil(8/computed.fuelEfficiency)),oxygen:2};break;
      case 'travel': {
        const targetId = typeof data === 'string' ? data : data.planetId;
        const target = state.galaxy.planets.find(item => item.id === targetId);
        if (!target) return reject('Selecione um planeta desta galáxia.');
        if (state.location.mode !== 'orbit') return reject('Decole antes de viajar.');
        if (target.id === planet.id) return reject('Sua nave já está neste planeta.');
        const route = assessSystem(state, target.systemId);
        if (!route.allowed) return reject(missingMessage(route));
        cost = { fuel: travelCost(state, target.id), oxygen: target.systemId === planet.systemId ? 3 : 6 };
        info.assessment = route;
        info.target = target;
        break;
      }
      case 'scan':
        if (planet.scanned) return reject('A análise deste planeta já está completa.');
        cost = { oxygen: 2 };
        break;
      case 'dock':
        if (state.location.mode === 'docked') return reject('Sua nave já está ancorada.');
        if (!planet.scanned) return reject('Analise o planeta para definir uma operação segura.');
        info.assessment = assess(state);
        if (!info.assessment.allowed) return reject(missingMessage(info.assessment));
        break;
      case 'explore': {
        if (state.location.stationId) return reject('Desatraque do entreposto antes de explorar.');
        if (!planet.scanned) return reject('Analise o planeta antes de explorar.');
        const siteId = typeof data === 'string' ? data : data.siteId;
        const site = siteId ? planet.sites.find(item => item.id === siteId) : (planet.sites.find(item => !item.explored) || planet.sites.find(item => !siteStatus(state,item.id).exhausted));
        if (!site) return reject('Todos os locais deste planeta já foram explorados.');
        if (siteStatus(state, site.id).exhausted) return reject('Local esgotado: tecnologia e todos os depósitos já foram extraídos.');
        info.assessment = assess(state, planet.id, site.id);
        if (!info.assessment.allowed) return reject(missingMessage(info.assessment));
        cost = info.assessment.cost;
        info.site = site;
        break;
      }
      case 'launch':
        if (state.location.mode !== 'docked') return reject('Sua nave já está em órbita.');
        break;
      case 'warp': {
        if (state.location.mode !== 'orbit') return reject('Retorne à órbita antes de iniciar a dobra.');
        const destinationId = typeof data === 'string' ? data : data.destinationId;
        info.destination = destinationId ? destinations(state).find(item => item.id === destinationId) : destinations(state)[0];
        if (!info.destination) return reject('Escolha um destino da carta galáctica.');
        cost = { warpFuel: info.destination.warpCost, oxygen: 5 };
        break;
      }
      case 'stabilizeSite': {
        const site=planet.sites.find(t=>t.id===data.siteId),op=site&&state.siteOperations?.[site.id];if(state.location.stationId||state.guide?.active||!op||op.stabilized||state.expedition&&(state.expedition.siteId!==data.siteId||!((state.expedition.x===2&&state.expedition.y===5)||expeditionBoard(state.expedition)[state.expedition.y*6+state.expedition.x].kind==='core')))return reject('Selecione um local já visitado, fora da expedição.');cost={ore:8,crystals:2};info.siteId=site.id;break;
      }
      case 'claimBeacon':
        if (state.discovery && state.discovery.claimed) return reject('O Núcleo do Cartógrafo já foi entregue.');
        if (!beaconView(state).ready) return reject('Extraia os três fragmentos do sinal: Origem, Brasa e Maré.');
        if (state.inventory.length >= computed.cargoCapacity) return reject('Armazém cheio. Recicle um módulo antes de receber o núcleo.');
        break;
      case 'craftComponent': {
        const componentId = typeof data === 'string' ? data : data.componentId;
        info.recipe = componentRecipes.find(item => item.id === componentId);
        if (!info.recipe) return reject('Escolha uma receita de componente.');
        info.amount = data.amount === undefined ? 1 : data.amount;
        if (!Number.isInteger(info.amount) || info.amount < 1 || info.amount > 20) return reject('Fabrique de 1 a 20 componentes por lote.');
        if (((state.components || {})[componentId] || 0) + info.amount > 999) return reject('O estoque comporta até 999 unidades de cada componente.');
        cost = Object.fromEntries(Object.entries(info.recipe.cost).map(([key, value]) => [key, value * info.amount]));
        info.componentCosts = Object.fromEntries(Object.entries(info.recipe.components || {}).map(([key, value]) => [key, value * info.amount]));
        break;
      }
      case 'fabricate': {
        const recipeId = typeof data === 'string' ? data : data.recipeId;
        info.recipe = recipes.find(item => item.id === recipeId);
        if (!info.recipe) return reject('Escolha um projeto da oficina.');
        if (state.inventory.length >= computed.cargoCapacity) return reject('Armazém cheio. Recicle um módulo antes de fabricar.');
        cost = { ...info.recipe.cost };
        info.componentCosts = { ...info.recipe.components };
        break;
      }
      case 'equip': {
        const moduleId = typeof data === 'string' ? data : data.moduleId;
        const module = state.inventory.find(item => item.id === moduleId);
        if (!module) return reject('Este módulo não está no inventário.');
        if (module.type === 'cargo') {
          const capacity = stats({ ...state, equipped: { ...state.equipped, cargo: module } }).cargoCapacity;
          if (state.inventory.length > capacity) return reject('Recicle módulos até ter no máximo ' + capacity + ' no inventário.');
        }
        info.module = module;
        break;
      }
      case 'favoriteModule': {
        const moduleId = typeof data === 'string' ? data : data.moduleId;
        info.module = [...Object.values(state.equipped), ...state.inventory].find(item => item.id === moduleId);
        if (!info.module) return reject('Escolha um módulo da nave ou do armazém.');
        break;
      }
      case 'salvage': {
        const moduleId = typeof data === 'string' ? data : data.moduleId;
        const module = state.inventory.find(item => item.id === moduleId);
        if (!module) return reject('Escolha um módulo do inventário para reciclar.');
        if (module.favorite) return reject('Este módulo está protegido. Remova o favorito antes de reciclar.');
        info.module = module;
        break;
      }
      case 'refuel':
        if (res.fuel >= computed.maxFuel) return reject('O tanque de combustível já está cheio.');
        // Use whatever ore is on board (1 ore → up to 4 fuel) instead of refusing when 1-2 ore cannot fill 12.
        info.amount = Math.min(12, computed.maxFuel - res.fuel, Math.max(1, (res.ore || 0) * 4));
        cost = { ore: Math.ceil(info.amount / 4) };
        break;
      case 'refillOxygen':
        if (res.oxygen >= computed.maxOxygen) return reject('A reserva de oxigênio já está cheia.');
        if (state.location.mode === 'docked' && planet.breathable) {
          cost = {};
          info.amount = computed.maxOxygen - res.oxygen;
        } else {
          cost = { lumenfern: 1 };
          info.amount = Math.min(12, computed.maxOxygen - res.oxygen);
        }
        break;
      case 'repair':
        if (res.hull >= computed.maxHull) return reject('O casco está em perfeitas condições.');
        cost = data.payment === 'credits' || (data.payment !== 'ore' && res.ore < 3) ? { credits: 20 } : { ore: 3 };
        info.amount = Math.min(40, computed.maxHull - res.hull);
        break;
      case 'refine': {
        const amount = data.amount === undefined ? 1 : data.amount;
        if (!Number.isInteger(amount) || amount < 1 || amount > 12) return reject('Escolha de 1 a 12 unidades para refinar.');
        if (res.warpFuel + amount > computed.maxWarpFuel) return reject('A reserva comporta no máximo ' + computed.maxWarpFuel + ' unidades de dobra.');
        cost = { ore: 24 * amount, crystals: 3 * amount };
        info.amount = amount;
        break;
      }
      case 'rescue': {
        // Stranded: no destination the ship may enter (environment gates) is affordable in fuel and oxygen.
        // Counting planets of the current system that the ship can no longer enter refused rescue in blue-giant/pulsar systems.
        const reachable = state.galaxy.planets.some(item => item.id !== planet.id && assessSystem(state, item.systemId).allowed && res.fuel >= travelCost(state, item.id) && res.oxygen >= (item.systemId === planet.systemId ? 3 : 6));
        const critical = !reachable || res.oxygen < 3 || res.hull < Math.ceil(computed.maxHull * 0.25);
        const exhausted = galaxyExhausted(state);
        if (!critical && !exhausted) return reject('Resgate indisponível: a nave tem condições de seguir viagem. Use a manutenção para abastecer ou reparar.');
        break;
      }
      case 'trail': {
        if (!['blue','orange','cosmic','aurora','solar'].includes(data.trail)) return reject('Escolha um rastro válido.');
        info.trail=data.trail;break;
      }
      case 'paint': {
        const color = typeof data === 'string' ? data : data.color;
        if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) return reject('Escolha uma cor válida para a nave.');
        info.color = color.toLowerCase();
        break;
      }
      case 'rename': {
        const name = typeof data === 'string' ? data : data.name;
        if (typeof name !== 'string' || !name.trim() || name.trim().length > 24 || /[<>\x00-\x1f]/.test(name)) return reject('Use um nome de 1 a 24 caracteres, sem símbolos de marcação.');
        info.name = name.trim();
        break;
      }
      default: return reject('Ação desconhecida.');
    }
    for (const [id, amount] of Object.entries(info.componentCosts || {})) {
      const available = (state.components || {})[id] || 0;
      if (available < amount) return { ...reject('Faltam ' + (amount - available) + ' × ' + componentRecipes.find(item => item.id === id).name + '. Fabrique os componentes primeiro.', cost), components: info.componentCosts };
    }
    const labels = { fuel: 'combustível', oxygen: 'oxigênio', hull: 'integridade do casco', warpFuel: 'combustível de dobra', ore: 'minério', credits: 'créditos', crystals: 'cristais', lumenfern: 'Samambaia-lume', data: 'dados de pesquisa' };
    for (const [key, amount] of Object.entries(cost)) {
      if ((res[key] || 0) < amount || (key === 'hull' && amount > 0 && res.hull <= amount)) {
        if(key==='lumenfern')return reject('Precisa de 1 Samambaia-lume. Colete em florestas ou compre no entreposto; atmosferas respiráveis permitem captar ar gratuitamente.',cost);
        return { ...reject('Você precisa de ' + (key === 'hull' ? amount + 1 : amount) + ' de ' + labels[key] + '. Use os serviços da nave ou solicite resgate.', cost), components: info.componentCosts || {} };
      }
    }
    if (['travel', 'explore', 'warp'].includes(action) && res.hull <= 0) return reject('Repare o casco ou solicite resgate antes de prosseguir.', cost);
    return { ok: true, cost, info };
  }

  function preview(state, action, payload) {
    const result = plan(state, action, payload);
    return { allowed: result.ok, reason: result.message || '', cost: result.cost || {}, amount: result.info && result.info.amount, assessment: result.info && result.info.assessment, components: result.components || result.info && result.info.componentCosts || {}, ...(state.expedition && action.startsWith('expedition') ? { safety: expeditionSafety(state, action, payload, result) } : {}) };
  }

  function addLog(state, message, kind) {
    state.log.unshift({ id: state.turn, text: message, kind: kind || 'info' });
    state.log.length = Math.min(state.log.length, 20);
  }
  function updateMission(state) {
    const progress = state.progress;
    const achieved = [progress.scans > 0, progress.landings > 0, progress.explorations > 0, progress.modulesEquipped > 0, progress.warps > 0];
    state.mission.completed = missions.filter((_, index) => achieved[index]).map(item => item.id);
    const stage = achieved.indexOf(false);
    state.mission.stage = stage < 0 ? missions.length : stage;
  }
  function clampResources(state) {
    const computed = stats(state);
    state.resources.fuel = Math.min(state.resources.fuel, computed.maxFuel);
    state.resources.oxygen = Math.min(state.resources.oxygen, computed.maxOxygen);
    state.resources.hull = Math.min(state.resources.hull, computed.maxHull);
    for (const key of Object.keys(state.resources)) state.resources[key] = Math.max(0, Math.round(state.resources[key]));
  }
  function rollModule(state, firstExpedition, assessment) {
    if (firstExpedition) {
      const module = makeModule(state, 'engine', 'rare', 1, 'recovered');
      const recipe = recipes.find(item => item.id === 'ion-sail');
      return Object.assign(module, { recipeId: recipe.id, name: recipe.name, description: recipe.description, capabilities: { ...recipe.capabilities }, effects: { ...recipe.effects } });
    }
    const roll = Math.min(0.9999, random(state) + stats(state).scanBonus * 0.15 + Math.min(0.12, state.galaxyIndex * 0.015) + ((assessment && assessment.rewardMultiplier) || 1) * 0.025);
    const rarity = roll > 0.975 ? 'legendary' : roll > 0.89 ? 'epic' : roll > 0.62 ? 'rare' : roll > 0.25 ? 'uncommon' : 'common';
    const type = TYPES[Math.floor(random(state) * TYPES.length)];
    const level = Math.min(5, 1 + Math.floor((state.galaxyIndex + random(state) * 2) / 2));
    const module = makeModule(state, type, rarity, level, 'recovered');
    const compatible = recipes.filter(recipe => recipe.type === type && !recipe.mission);
    if (compatible.length) {
      const adaptation = compatible[Math.floor(random(state) * compatible.length)];
      module.capabilities = { ...adaptation.capabilities };
      module.effects = { ...adaptation.effects };
      module.recipeId = adaptation.id;
      module.name = adaptation.name;
      module.description = adaptation.description;
    }
    return module;
  }

  function dispatch(state, action, payload) {
    const prepared = plan(state, action, payload);
    if (!prepared.ok) return prepared;
    // Work on a copy so a rejected action, even after an added rule, cannot burn resources or RNG.
    const next = clone(state);
    const checked = plan(next, action, payload);
    const info = checked.info;
    const planet = currentPlanet(next);
    const res = next.resources;
    const reward = {};
    let message = '';
    let event = action;
    let kind = 'info';
    Object.entries(checked.cost).forEach(([key, amount]) => {
      if (key === 'reserve' || key === 'integrity') next.expedition[key] -= amount;
      else res[key] -= amount;
    });
    if (info.componentCosts) {
      if (!next.components) next.components = {};
      Object.entries(info.componentCosts).forEach(([key, amount]) => { next.components[key] = (next.components[key] || 0) - amount; });
    }
    if (next.expedition && action.startsWith('expedition')) next.expedition.turns++;
    next.turn++;
    switch (action) {
      case 'stationDock':next.location.stationId=currentSystem(next).id;message='Chegada ao entreposto. Nave atracada; mercado e encomendas disponíveis.';break;
      case 'stationLeave':delete next.location.stationId;message='Retorno à órbita de '+planet.name+'.';break;
      case 'travel':
        next.location.planetId = info.target.id;
        message = 'Chegada à órbita de ' + info.target.name + '. O desconhecido está logo abaixo.';
        break;
      case 'scan':
        planet.scanned = true;
        reward.data = Math.round((12 + planet.radiation * 0.08) * (1 + stats(next).scanBonus));
        res.data += reward.data;
        next.progress.scans++;
        message = planet.name + ' analisado. ' + planet.sites.length + ' locais e requisitos de operação identificados. +' + reward.data + ' dados.';
        kind = 'success';
        break;
      case 'dock':
        next.location.mode = 'docked';
        next.progress.landings++;
        message = (planet.medium === 'gas' ? 'Sondagem atmosférica pronta em ' : planet.medium === 'liquid' ? 'Submersão concluída em ' : 'Ancoragem concluída em ') + planet.name + '. Confira o risco de cada local.';
        break;
      case 'explore':
        if(next.location.mode!=='docked'){next.location.mode='docked';next.progress.landings++;}
        next.expedition = createExpedition(next, info.site);
        if(!next.guide?.active){checkpointSite(next);next.siteOperations[info.site.id].visits=(state.siteOperations?.[info.site.id]?.visits||0)+1;}
        message = info.site.name + ': expedição iniciada. Recupere o núcleo e retorne ao ponto de extração.';
        break;
      case 'expeditionBeacon': {
        const e=next.expedition;e.beacons.push(e.y*6+e.x);revealExpedition(e,2);
        message=e.beacons.length===2?'Sinal triangulado. A tecnologia pode ser acessada.':'Primeira baliza conectada. A área ao redor foi revelada.';break;
      }
      case 'expeditionWait':message='O abrigo aguarda a próxima fase do clima. Fora da base, esperar consome 1 energia.';break;
      case 'expeditionMove': {
        const expedition = next.expedition;
        expedition.x = info.x; expedition.y = info.y;
        expedition.visited.push(info.y * 6 + info.x);
        expedition.visited = [...new Set(expedition.visited)];
        revealExpedition(expedition, 1);
        message = info.localCost.integrity ? 'Travessia perigosa. A reserva e a integridade local diminuíram.' : 'Posição atualizada. Planeje a reserva para o retorno.';
        break;
      }
      case 'expeditionReturn': {
        const expedition = next.expedition;
        for (const position of info.route) {
          expedition.x = position.x; expedition.y = position.y;
          expedition.visited.push(position.y * 6 + position.x);
          revealExpedition(expedition, 1);
        }
        expedition.visited = [...new Set(expedition.visited)];
        expedition.turns += Math.max(0, info.route.length - 1);
        message = 'De volta à nave. Sua carga está preservada; extraia para guardá-la.';
        kind = 'success';
        break;
      }
      case 'expeditionScan':
        revealExpedition(next.expedition, stats(next).scanRadius);
        next.expedition.scans++;
        message = 'Pulso do scanner revelou caminhos, recursos e perigos próximos.';
        break;
      case 'expeditionCollect': {
        const expedition = next.expedition, tile = expeditionBoard(expedition)[expedition.y * 6 + expedition.x];
        const bonus = stats(next).collectionBonus;
        const research = tile.kind === 'data' ? 1 + stats(next).scanBonus : 1;
        // Round the normal yield first so an intensive collect is the advertised +50% (it ranged from +40% to +100%).
        const normal = Math.round((tile.kind === 'ore' ? 8 : tile.kind === 'data' ? 10 : 2) * bonus * research * expedition.rewardMultiplier);
        const amount = info.intensive ? Math.round(normal * 1.5) : normal;
        const key = tile.kind === 'crystal' ? 'crystals' : tile.kind;
        expedition.pending[key] += amount;
        expedition.pending.credits += Math.round(5 * expedition.rewardMultiplier);
        expedition.collected.push(tile.y * 6 + tile.x);
        expedition.harvested.push(tile.y * 6 + tile.x);
        expedition.load++;
        message = 'Carga recuperada. Leve-a à base para guardá-la na nave.';
        break;
      }
      case 'expeditionInteract':
        if (!next.expedition.puzzle) next.expedition.puzzle = expeditionPuzzle(next.expedition.seed);
        message = 'Circuito encontrado. Cada rotor gira também o seguinte. Reproduza o padrão de referência.';
        break;
      case 'expeditionTune': {
        const dials = next.expedition.puzzle.dials;
        dials[info.index] = (dials[info.index] + 1) % 4;
        dials[(info.index + 1) % 3] = (dials[(info.index + 1) % 3] + 1) % 4;
        message = 'Rotores ajustados. Compare o circuito ao padrão de referência.';
        break;
      }
      case 'expeditionRecover': {
        const expedition = next.expedition;
        if (!info.matched) {
          message = 'Circuito desalinhado: 2 de reserva consumidos. Ajuste o padrão antes de tentar de novo.';
          kind = 'warning';
          break;
        }
        const temp = { ...next, rng: expedition.seed, nextModuleId: next.nextModuleId };
        const module = rollModule(temp, expedition.firstExpedition, { rewardMultiplier: expedition.rewardMultiplier, level: assess(next, planet.id, expedition.siteId).level });
        next.nextModuleId = temp.nextModuleId;
        expedition.pending.module = module;
        expedition.pending.fragment = fragmentForBiome(planet.biome);
        expedition.pending.ore += Math.round(6 * stats(next).collectionBonus * expedition.rewardMultiplier);
        expedition.pending.crystals += expedition.firstExpedition ? 3 : 2;
        expedition.pending.data += Math.round(10 * (1 + stats(next).scanBonus) * expedition.rewardMultiplier);
        expedition.pending.credits += Math.round(24 * expedition.rewardMultiplier);
        expedition.coreRecovered = true;
        if(!next.guide?.active){checkpointSite(next);const op=next.siteOperations[expedition.siteId];if(op.reactionAt===null)op.reactionAt=op.elapsed+6;}
        expedition.load += 3;
        message = module.name + ' recuperado. O núcleo e o fragmento ainda precisam chegar à base.';
        kind = 'discovery';
        break;
      }
      case 'expeditionSalvage': {
        const expedition = next.expedition;
        expedition.pending.ore += Math.ceil(expedition.pending.module.power * 5);
        delete expedition.pending.module;
        expedition.load -= 2;
        message = 'Módulo desmontado em minério. O fragmento do sinal continua na carga.';
        break;
      }
      case 'expeditionExtract': {
        const expedition = next.expedition;
        Object.assign(reward, expedition.pending);
        for (const key of ['ore', 'crystals', 'data', 'credits']) res[key] += reward[key];
        if (reward.module) next.inventory.push(reward.module);
        if (reward.fragment) next.discovery.fragments[reward.fragment] = true;
        if (expedition.coreRecovered) {
          planet.sites.find(site => site.id === expedition.siteId).explored = true;
          next.progress.explorations++;
        }
        const depleted = new Set([...(next.siteCaches[expedition.siteId] || []), ...expedition.harvested]);
        next.siteCaches[expedition.siteId] = [...depleted];
        next.discovery.extractions++;
        if (planet.medium === 'gas' && expedition.coreRecovered) {
          reward.fuel = Math.min(4, stats(next).maxFuel - res.fuel);
          res.fuel += reward.fuel;
        }

        checkpointSite(next);
        next.expedition = null;
        message = 'Extração concluída. A carga foi guardada na nave.' + (reward.module ? ' ' + reward.module.name + ' disponível no armazém.' : '') + (reward.fragment ? ' Fragmento do sinal confirmado.' : '') + (reward.fuel ? ' Gases condensados: +' + reward.fuel + ' combustível.' : '');
        kind = 'discovery';
        break;
      }
      case 'expeditionAbort':
        next.discovery.evacuations++;
        checkpointSite(next);
        next.expedition = null;
        message = 'Evacuação concluída. A carga desta saída foi perdida; sua nave e seus equipamentos foram preservados.';
        kind = 'warning';
        break;
      case 'claimBeacon': {
        const module = makeModule(next, 'warp', 'epic', 1, 'beacon');
        module.name = 'Núcleo do Cartógrafo';
        module.description = 'Três frequências reunidas. Dobra épica para alcançar galáxias com menos combustível.';
        next.inventory.push(module);
        next.discovery.claimed = true;
        reward.module = module;
        message = 'Sinal reconstruído. O Núcleo do Cartógrafo foi entregue ao armazém: instale-o no encaixe de dobra.';
        kind = 'discovery';
        break;
      }
      case 'launch':
        next.location.mode = 'orbit';
        message = 'Retorno à órbita de ' + planet.name + ' concluído. O espaço espera por você.';
        break;
      case 'warp':
        archiveGalaxy(next);
        next.galaxyIndex++;
        next.visitedGalaxies++;
        next.galaxy = generateGalaxy(next.seed, next.galaxyIndex, info.destination.kind);
        next.siteCaches = {}; next.siteOperations = {};
        next.location = { planetId: next.galaxy.planets[0].id, mode: 'orbit' };
        next.progress.warps++;
        reward.data = 50;
        res.data += reward.data;
        message = 'Dobra concluída. ' + next.galaxy.name + ': ' + next.galaxy.systems.length + ' sistemas e ' + next.galaxy.planets.length + ' mundos para descobrir.';
        kind = 'discovery';
        break;
      case 'equip': {
        const previous = next.equipped[info.module.type];
        const index = next.inventory.findIndex(module => module.id === info.module.id);
        next.inventory[index] = previous;
        next.equipped[info.module.type] = info.module;
        if (info.module.origin !== 'starter') next.progress.modulesEquipped++;
        message = info.module.name + ' equipado. ' + previous.name + ' foi guardado no armazém.';
        kind = 'success';
        break;
      }
      case 'craftComponent': {
        if (!next.components) next.components = {};
        next.components[info.recipe.id] = (next.components[info.recipe.id] || 0) + info.amount;
        reward.components = { [info.recipe.id]: info.amount };
        message = info.amount + ' × ' + info.recipe.name + ' fabricado' + (info.amount > 1 ? 's' : '') + '. Disponível no laboratório.';
        kind = 'success';
        break;
      }
      case 'favoriteModule': {
        const module = [...Object.values(next.equipped), ...next.inventory].find(item => item.id === info.module.id);
        module.favorite = !module.favorite;
        message = module.name + (module.favorite ? ' protegido contra reciclagem.' : ' removido dos favoritos.');
        break;
      }
      case 'fabricate': {
        const recipe = info.recipe;
        const module = makeModule(next, recipe.type, recipe.rarity, 1, 'fabricated');
        Object.assign(module, { name: recipe.name, description: recipe.description, power: recipe.power, recipeId: recipe.id, capabilities: { ...recipe.capabilities }, effects: { ...recipe.effects } });
        next.inventory.push(module);
        reward.module = module;
        message = recipe.name + ' fabricado. Equipe-o no encaixe de ' + catalog.find(item => item.type === recipe.type).name.toLowerCase() + ' para ativar seus benefícios.';
        kind = 'success';
        break;
      }
      case 'salvage':
        next.inventory = next.inventory.filter(module => module.id !== info.module.id);
        reward.ore = Math.ceil(info.module.power * 3);
        reward.credits = Math.ceil(info.module.power * 7);
        res.ore += reward.ore;
        res.credits += reward.credits;
        message = info.module.name + ' reciclado. +' + reward.ore + ' minério · +' + reward.credits + ' créditos.';
        break;
      case 'refuel':
        res.fuel += info.amount;
        reward.fuel = info.amount;
        message = 'Tanque reabastecido: +' + info.amount + ' combustível.';
        break;
      case 'refillOxygen':
        res.oxygen += info.amount;
        reward.oxygen = info.amount;
        message = 'Suporte de vida reabastecido: +' + info.amount + ' oxigênio' + (Object.keys(checked.cost).length === 0 ? ' da atmosfera local.' : ' produzido no biorreator com Samambaia-lume.');
        break;
      case 'repair':
        res.hull += info.amount;
        reward.hull = info.amount;
        message = 'Reparo concluído: +' + info.amount + ' integridade do casco.';
        break;
      case 'refine':
        res.warpFuel += info.amount;
        reward.warpFuel = info.amount;
        message = 'Minério e cristais condensados em célula de dobra. +' + info.amount + ' combustível de dobra.';
        kind = 'success';
        break;
      case 'rescue': {
        const safe = next.galaxy.planets.find(item => item.biome === 'forest');
        next.location = { planetId: safe.id, mode: 'orbit' };
        const computed = stats(next);
        res.fuel = Math.max(res.fuel, Math.round(computed.maxFuel * 0.65));
        res.oxygen = Math.max(res.oxygen, Math.round(computed.maxOxygen * 0.8));
        res.hull = Math.max(res.hull, Math.round(computed.maxHull * 0.75));
        res.ore = Math.floor(res.ore * 0.8);
        res.credits = Math.floor(res.credits * 0.9);
        res.crystals = Math.max(0, res.crystals - 1);
        message = 'Resgate concluído na órbita de ' + safe.name + '. Sistemas recuperados; taxa de 20% do minério, 10% dos créditos e até 1 cristal.';
        // The emergency warp cell is only for a galaxy with nothing left to explore, judged with every module the
        // player owns (not just the installed ones, which made it a repeatable bypass of refining), and only when a
        // warp is actually permitted afterwards (the campaign can hold the ship in a chapter galaxy).
        const fueled = { ...next, resources: { ...res, warpFuel: warpCost(next) } }, heldByCampaign = preview(fueled, 'warp').allowed && !api.preview(fueled, 'warp').allowed;
        if (galaxyExhausted(next) && !heldByCampaign) {
          res.warpFuel = warpCost(next);
          message += ' Uma carga de dobra de emergência permite alcançar novos refúgios quando não restam locais acessíveis.';
        }
        kind = 'warning';
        break;
      }
      case 'stabilizeSite':
        next.siteOperations[info.siteId].stabilized=true;message='Estabilizador instalado. A reação do núcleo foi contida; o clima natural continua.';break;
      case 'trail':
        next.ship.trail=info.trail;message='Rastro atualizado.';break;
      case 'paint':
        next.ship.color = info.color;
        message = 'Pintura da nave atualizada.';
        break;
      case 'rename':
        next.ship.name = info.name;
        message = 'Nave registrada como ' + info.name + '.';
        break;
    }
    checkpointSite(next);
    clampResources(next);
    updateMission(next);
    addLog(next, message, kind);
    commit(state, next);
    return { ok: true, message, event, reward, cost: checked.cost };
  }

  function validateExpedition(state, validModule) {
    const expedition = state.expedition, planet = currentPlanet(state);
    const site = planet.sites.find(item => item.id === expedition.siteId);
    if (state.location.mode !== 'docked' || !planet.scanned || !site || Boolean(expedition.coreSecured) !== site.explored || expedition.planetId !== planet.id) return false;
    if(expedition.adventure!==undefined&&(expedition.adventure!==true||!Array.isArray(expedition.beacons)||expedition.beacons.length>2||new Set(expedition.beacons).size!==expedition.beacons.length||expedition.beacons.some(i=>!expeditionBeacons(expedition).includes(i))||expedition.coreRecovered&&expedition.beacons.length<2))return false;
    if (expedition.coreSecured !== undefined && typeof expedition.coreSecured !== 'boolean' || expedition.coreSecured && (expedition.coreRecovered || expedition.puzzle)) return false;
    if (expedition.seed !== hashSeed(planet.seed + ':' + site.id + ':expedition') || expedition.tutorial !== (planet.id === 'g0-p0' && (site.id === 'g0-p0-s0'||state.guide?.v===2&&state.guide.active))) return false;
    if (!['x', 'y'].every(key => Number.isInteger(expedition[key]) && expedition[key] >= 0 && expedition[key] < 6)) return false;
    for (const [key, maximum] of [['maxReserve', 48], ['maxIntegrity', 32], ['capacity', 16], ['turns', 10000], ['scans', 1000]]) if (!Number.isInteger(expedition[key]) || expedition[key] < 0 || expedition[key] > maximum) return false;
    if (!Number.isInteger(expedition.reserve) || expedition.reserve < 0 || expedition.reserve > expedition.maxReserve || !Number.isInteger(expedition.integrity) || expedition.integrity < 1 || expedition.integrity > expedition.maxIntegrity) return false;
    if (!Number.isInteger(expedition.load) || expedition.load < 0 || expedition.load > expedition.capacity || typeof expedition.coreRecovered !== 'boolean' || typeof expedition.firstExpedition !== 'boolean' || !Number.isFinite(expedition.rewardMultiplier) || expedition.rewardMultiplier < 1 || expedition.rewardMultiplier > 3) return false;
    if(expedition.weatherOffset!==undefined&&(!Number.isSafeInteger(expedition.weatherOffset)||expedition.weatherOffset<0))return false;
    const board = expeditionBoard(expedition);
    for (const key of ['revealed', 'visited', 'collected', 'harvested']) if (!Array.isArray(expedition[key]) || expedition[key].length > 36 || new Set(expedition[key]).size !== expedition[key].length || !expedition[key].every(index => Number.isInteger(index) && index >= 0 && index < 36)) return false;
    if (board[expedition.y * 6 + expedition.x].kind === 'wall' || !expedition.visited.includes(expedition.y * 6 + expedition.x) || !expedition.visited.every(index => expedition.revealed.includes(index) && board[index].kind !== 'wall')) return false;
    if (!expedition.collected.every(index => ['ore', 'data', 'crystal'].includes(board[index].kind)) || !expedition.harvested.every(index => expedition.collected.includes(index))) return false;
    const pending = expedition.pending;
    if (!pending || !['ore', 'crystals', 'data', 'credits'].every(key => Number.isInteger(pending[key]) && pending[key] >= 0 && pending[key] <= 1000)) return false;
    if (pending.module !== undefined && (!validModule(pending.module) || !expedition.coreRecovered)) return false;
    if (pending.fragment !== undefined && (pending.fragment !== fragmentForBiome(planet.biome) || !expedition.coreRecovered)) return false;
    if (expedition.coreRecovered && pending.fragment !== fragmentForBiome(planet.biome)) return false;
    if (expedition.load !== expedition.harvested.length + (expedition.coreRecovered ? pending.module ? 3 : 1 : 0)) return false;
    if (expedition.puzzle !== null) {
      const puzzle = expedition.puzzle;
      if (!puzzle || !['dials', 'target'].every(key => Array.isArray(puzzle[key]) && puzzle[key].length === 3 && puzzle[key].every(value => Number.isInteger(value) && value >= 0 && value <= 3))) return false;
      if (!puzzle.target.every((value, index) => value === expeditionPuzzle(expedition.seed).target[index])) return false;
      if ((puzzle.dials.reduce((sum, value) => sum + value, 0) - puzzle.target.reduce((sum, value) => sum + value, 0)) % 2 !== 0) return false;
    }
    return true;
  }

  function validate(state, legacy) {
    if (!state || state.version !== (legacy ? 1 : VERSION) || !Number.isInteger(state.seed) || !Number.isInteger(state.rng)) return false;
    if (state.seed < 0 || state.seed > 0xFFFFFFFF || state.rng < 0 || state.rng > 0xFFFFFFFF) return false;
    if (!Number.isSafeInteger(state.galaxyIndex) || state.galaxyIndex < 0 || !Number.isInteger(state.turn) || state.turn < 0) return false;
    if (!Number.isInteger(state.visitedGalaxies) || state.visitedGalaxies < 1) return false;
    if (!state.galaxy || !Array.isArray(state.galaxy.planets) || (legacy ? state.galaxy.planets.length !== 6 : state.galaxy.planets.length < 12 || state.galaxy.planets.length > 20)) return false;
    if(state.location?.stationId!==undefined&&(state.location.mode!=='orbit'||state.location.stationId!==currentSystem(state)?.id||state.expedition))return false;
    if (!state.location || !['orbit', 'docked'].includes(state.location.mode) || !currentPlanet(state)) return false;
    if (!state.ship || typeof state.ship.name !== 'string' || state.ship.name.length < 1 || state.ship.name.length > 24 || !/^#[\da-f]{6}$/i.test(state.ship.color)) return false;
    if (!state.resources || !['fuel', 'oxygen', 'hull', 'warpFuel', 'crystals', 'ore', 'credits', 'data'].every(key => Number.isInteger(state.resources[key]) && state.resources[key] >= 0)) return false;
    const validCapabilities = value => value === undefined || (value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key, amount]) => CAPABILITY_KEYS.includes(key) && (key === 'gas' || key === 'liquid' ? typeof amount === 'boolean' : Number.isFinite(amount) && amount >= 0 && amount <= 10000)));
    const validEffects = value => value === undefined || (value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key, amount]) => Object.hasOwn(EFFECT_BOUNDS, key) && Number.isFinite(amount) && amount >= EFFECT_BOUNDS[key][0] && amount <= EFFECT_BOUNDS[key][1] && (!['maxFuel', 'maxOxygen', 'maxHull', 'cargoCapacity', 'expeditionReserve', 'expeditionIntegrity', 'expeditionCapacity', 'scanRadius', 'collectionEfficiency', 'hazardProtection'].includes(key) || Number.isInteger(amount))));
    if (state.components !== undefined && (!state.components || typeof state.components !== 'object' || Array.isArray(state.components) || !Object.entries(state.components).every(([key, amount]) => componentRecipes.some(item => item.id === key) && Number.isInteger(amount) && amount >= 0 && amount <= 999))) return false;
    const validModule = module => module && typeof module.id === 'string' && TYPES.includes(module.type) && Object.hasOwn(rarities, module.rarity) && Number.isInteger(module.level) && module.level >= 1 && module.level <= 5 && Number.isFinite(module.power) && module.power >= 1 && module.power <= 6 && typeof module.name === 'string' && module.name.length <= 100 && validCapabilities(module.capabilities) && validEffects(module.effects) && (module.favorite === undefined || typeof module.favorite === 'boolean');
    if (!state.equipped || !TYPES.every(type => validModule(state.equipped[type]) && state.equipped[type].type === type)) return false;
    if (!Array.isArray(state.inventory) || state.inventory.length > 24 || !state.inventory.every(validModule)) return false;
    const ids = [...Object.values(state.equipped), ...state.inventory].map(module => module.id);
    if (new Set(ids).size !== ids.length) return false;
    if (!state.galaxy.planets.every(planet => planet && typeof planet.id === 'string' && typeof planet.name === 'string' && Object.hasOwn(BIOMES, planet.biome) && Number.isFinite(planet.temperature) && Number.isFinite(planet.radiation) && Number.isFinite(planet.distance) && typeof planet.scanned === 'boolean' && Array.isArray(planet.sites) && (legacy ? planet.sites.length === 3 : planet.sites.length >= 2 && planet.sites.length <= 4) && planet.sites.every(site => site && typeof site.id === 'string' && typeof site.name === 'string' && typeof site.explored === 'boolean' && (legacy || Number.isInteger(site.difficulty) && site.difficulty >= 1 && site.difficulty <= 3)))) return false;
    const planetIds = state.galaxy.planets.map(planet => planet.id);
    if (new Set(planetIds).size !== planetIds.length) return false;
    if (!legacy) {
      if (!['frontier', ...Object.keys(GALAXY_ROUTES)].includes(state.galaxy.kind) || !Number.isInteger(state.galaxy.seed)) return false;
      if (!Array.isArray(state.galaxy.systems) || state.galaxy.systems.length < 3 || state.galaxy.systems.length > 4) return false;
      const systemIds = state.galaxy.systems.map(system => system.id);
      if (new Set(systemIds).size !== systemIds.length) return false;
      if (!state.galaxy.systems.every(system => typeof system.id === 'string' && typeof system.name === 'string' && Object.hasOwn(SYSTEM_KINDS, system.kind) && Number.isFinite(system.heat) && system.heat >= 0 && Number.isFinite(system.radiation) && system.radiation >= 0 && Array.isArray(system.planetIds) && system.planetIds.length >= 2 && system.planetIds.length <= 8 && system.planetIds.every(id => state.galaxy.planets.some(planet => planet.id === id && planet.systemId === system.id)))) return false;
      const membership = state.galaxy.systems.flatMap(system => system.planetIds);
      if (membership.length !== planetIds.length || new Set(membership).size !== planetIds.length) return false;
      if (!state.galaxy.planets.every(planet => systemIds.includes(planet.systemId) && ['solid', 'liquid', 'gas'].includes(planet.medium) && Number.isFinite(planet.pressure) && planet.pressure >= 0 && Number.isFinite(planet.toxicity) && planet.toxicity >= 0 && planet.toxicity <= 100 && Number.isFinite(planet.weather) && planet.weather >= 0 && planet.weather <= 100 && planet.temperature >= -273 && planet.radiation >= 0)) return false;
    }
    if (state.discovery !== undefined && (!state.discovery || typeof state.discovery !== 'object' || !state.discovery.fragments || !FRAGMENTS.every(item => typeof state.discovery.fragments[item.id] === 'boolean') || typeof state.discovery.claimed !== 'boolean' || !['extractions', 'evacuations'].every(key => Number.isInteger(state.discovery[key]) && state.discovery[key] >= 0))) return false;
    if (state.surveyArchive !== undefined) {
      const archive = state.surveyArchive, integerCounts = values => values.every(value => Number.isSafeInteger(value) && value >= 0);
      const validCounts = row => integerCounts(row) && row[2] <= row[1] && row[3] <= row[2] && row[5] <= row[4] && row[4] >= row[1] * 2 && row[4] <= row[1] * 4 && row[5] >= row[3] * 2;
      if (!archive || !Array.isArray(archive.entries) || archive.entries.length > ARCHIVE_LIMIT || !Array.isArray(archive.earlier) || archive.earlier.length !== 6 || !validCounts(archive.earlier) || !Number.isSafeInteger(archive.unavailable) || archive.unavailable < 0) return false;
      if (archive.earlier[0] + archive.entries.length + archive.unavailable !== state.galaxyIndex || archive.earlier[1] < archive.earlier[0] * 12 || archive.earlier[1] > archive.earlier[0] * 20) return false;
      if (!archive.entries.every((row, index) => Array.isArray(row) && row.length === 7 && integerCounts(row) && row[0] < state.galaxyIndex && row[1] < GALAXY_KINDS.length && row[2] >= 12 && row[2] <= 20 && validCounts(row.slice(1)) && (index === 0 || row[0] > archive.entries[index - 1][0]))) return false;
    }
    if(state.siteOperations!==undefined){
      if(!state.siteOperations||typeof state.siteOperations!=='object'||Array.isArray(state.siteOperations)||Object.keys(state.siteOperations).length>80)return false;
      for(const [id,op] of Object.entries(state.siteOperations)){
        const world=state.galaxy.planets.find(p=>p.sites.some(t=>t.id===id));
        if(!world||!op||!Number.isSafeInteger(op.elapsed)||op.elapsed<0||!Number.isSafeInteger(op.visits)||op.visits<1||typeof op.stabilized!=='boolean'||op.reactionAt!==null&&(!Number.isSafeInteger(op.reactionAt)||op.reactionAt<0))return false;
        for(const key of ['revealed','beacons'])if(!Array.isArray(op[key])||op[key].length>36||new Set(op[key]).size!==op[key].length||!op[key].every(i=>Number.isInteger(i)&&i>=0&&i<36))return false;
        const seed=hashSeed(world.seed+':'+id+':expedition'),e={seed,tutorial:world.id==='g0-p0'&&id==='g0-p0-s0',adventure:true};
        if(op.beacons.length>2||op.beacons.some(i=>!expeditionBeacons(e).includes(i)))return false;
        if(op.puzzle!==null){const q=op.puzzle;if(!q||!['dials','target'].every(k=>Array.isArray(q[k])&&q[k].length===3&&q[k].every(n=>Number.isInteger(n)&&n>=0&&n<4))||q.target.some((n,i)=>n!==expeditionPuzzle(seed).target[i])||(q.dials.reduce((a,b)=>a+b,0)-q.target.reduce((a,b)=>a+b,0))%2!==0)return false;}
        if(op.storyStep!==undefined&&(!Number.isInteger(op.storyStep)||op.storyStep<0||op.storyStep>3))return false;
        if(op.fieldTask){const t=op.fieldTask;if(!['relay','observe','sample'].includes(t.kind)||!Number.isInteger(t.step)||t.step<0||t.step>3||!['target','values'].every(k=>Array.isArray(t[k])&&t[k].length===3&&t[k].every(n=>Number.isInteger(n)&&n>=0&&n<=4))||(t.kind==='relay'?t.target.some(n=>n!==2)||t.values.reduce((a,b)=>a+b,0)!==6:t.target.some(n=>n>2)))return false;}
      }
    }
    if (state.siteCaches !== undefined) {
      if (!state.siteCaches || typeof state.siteCaches !== 'object' || Array.isArray(state.siteCaches) || Object.keys(state.siteCaches).length > 80) return false;
      for (const [id, list] of Object.entries(state.siteCaches)) {
        const world = state.galaxy.planets.find(planet => planet.sites.some(site => site.id === id));
        if (!world || !Array.isArray(list) || list.length > 4 || new Set(list).size !== list.length) return false;
        const board = expeditionBoard({ seed: hashSeed(world.seed + ':' + id + ':expedition'), tutorial: world.id === 'g0-p0' && (id === 'g0-p0-s0'||state.guide?.v===2&&state.guide.active) });
        if (!list.every(index => Number.isInteger(index) && index >= 0 && index < 36 && ['ore', 'data', 'crystal'].includes(board[index].kind))) return false;
      }
    }
    if (state.expedition !== undefined && state.expedition !== null) {
      if (!validateExpedition(state, validModule)) return false;
      if (state.expedition.pending.module) {
        const id = state.expedition.pending.module.id;
        if (ids.includes(id)) return false;
        ids.push(id);
      }
    }
    if (!state.progress || !['scans', 'landings', 'explorations', 'modulesEquipped', 'warps'].every(key => Number.isInteger(state.progress[key]) && state.progress[key] >= 0)) return false;
    if (!state.mission || !Array.isArray(state.mission.completed)) return false;
    if (!Array.isArray(state.log) || state.log.length > 20 || !state.log.every(entry => typeof entry.text === 'string')) return false;
    if (!Number.isInteger(state.nextModuleId) || state.nextModuleId < 1 || ids.some(id => /^m\d+$/.test(id) && Number(id.slice(1)) >= state.nextModuleId)) return false;
    const computed = stats(state);
    if (state.inventory.length > computed.cargoCapacity || state.resources.fuel > computed.maxFuel || state.resources.oxygen > computed.maxOxygen || state.resources.hull > computed.maxHull || state.resources.warpFuel > computed.maxWarpFuel) return false;
    return true;
  }
  function attachLegacyWorlds(galaxy, oldPlanets) {
    const firstSystem = galaxy.systems[0];
    const appended = galaxy.planets.filter(planet => planet.systemId !== firstSystem.id);
    const originals = oldPlanets.map(planet => {
      const p = clone(planet);
      Object.assign(p, { ...physicalConditions(p.biome, generator(p.seed)), ...p, systemId: firstSystem.id, legacy: true });
      p.sites = p.sites.map(site => ({ ...site, difficulty: site.difficulty || 1 }));
      return p;
    });
    appended.forEach((planet, index) => {
      planet.id = 'g' + galaxy.id.slice(7) + '-p' + (index + originals.length);
      planet.sites.forEach((site, siteIndex) => { site.id = planet.id + '-s' + siteIndex; });
    });
    galaxy.planets = [...originals, ...appended];
    for (const system of galaxy.systems) system.planetIds = galaxy.planets.filter(planet => planet.systemId === system.id).map(planet => planet.id);
    galaxy.legacy = true;
    return galaxy;
  }
  function migrateLegacy(state) {
    if (!validate(state, true)) return null;
    const old = state.galaxy;
    const galaxy = attachLegacyWorlds(generateGalaxy(state.seed, state.galaxyIndex), old.planets);
    state.galaxy = galaxy;
    state.version = VERSION;
    return state;
  }
  function defaultModuleDescription(module) {
    const recipe = recipes.find(item => item.id === module.recipeId);
    return recipe ? recipe.description : catalog.find(item => item.type === module.type).stat + ' · ' + module.power.toFixed(2).replace('.', ',') + '×';
  }
  function snapshot(state) {
    const output = clone(state);
    const galaxy = output.galaxy;
    const survey = galaxy.planets.map((planet, index) => [index, planet.scanned ? 1 : 0, planet.sites.reduce((bits, site, i) => bits | (site.explored ? 1 << i : 0), 0)]).filter(row => row[1] || row[2]);
    output.universe = { kind: galaxy.kind, survey };
    if (state.campaign?.atHome) output.universe.index = 0;
    if (galaxy.legacy) {
      output.universe.legacy = galaxy.planets.filter(planet => planet.legacy);
      output.universe.name = galaxy.name;
    }
    delete output.galaxy;
    for (const module of [...Object.values(output.equipped), ...output.inventory]) {
      if (module.description === defaultModuleDescription(module)) delete module.description;
    }
    return output;
  }
  function restore(saved) {
    try {
      let state = typeof saved === 'string' ? JSON.parse(saved) : clone(saved);
      if (!state || typeof state !== 'object') return null;
      if (state.version === 1) state = migrateLegacy(state);
      if (!state) return null;
      if (state.universe && state.version === VERSION) {
        const universe = state.universe;
        if (!['frontier', ...Object.keys(GALAXY_ROUTES)].includes(universe.kind) || !Array.isArray(universe.survey) || universe.survey.length > 20) return null;
        const mapIndex = universe.index === 0 && state.campaign?.atHome === true ? 0 : state.galaxyIndex;
        if (universe.index !== undefined && universe.index !== mapIndex) return null;
        let galaxy = generateGalaxy(state.seed, mapIndex, universe.kind);
        api.restoreTrainingWorld?.(state,galaxy);
        if (universe.legacy) {
          if (!Array.isArray(universe.legacy) || universe.legacy.length !== 6) return null;
          galaxy = attachLegacyWorlds(galaxy, universe.legacy);
        }
        const seen = new Set();
        for (const row of universe.survey) {
          if (!Array.isArray(row) || row.length !== 3 || !Number.isInteger(row[0]) || !galaxy.planets[row[0]] || seen.has(row[0]) || ![0, 1].includes(row[1]) || !Number.isInteger(row[2]) || row[2] < 0 || row[2] >= (1 << galaxy.planets[row[0]].sites.length)) return null;
          seen.add(row[0]);
          const planet = galaxy.planets[row[0]];
          planet.scanned = row[1] === 1;
          planet.sites.forEach((site, index) => { site.explored = Boolean(row[2] & (1 << index)); });
        }
        state.galaxy = galaxy;
        delete state.universe;
        if (!state.equipped || !Array.isArray(state.inventory)) return null;
        for (const module of [...Object.values(state.equipped), ...state.inventory]) {
          if (!module.description) module.description = defaultModuleDescription(module);
        }
      }
      if (state.components === undefined) state.components = {};
      if (state.expedition === undefined) state.expedition = null;
      if (state.siteCaches === undefined) state.siteCaches = {};
      if(state.siteOperations===undefined)state.siteOperations={};
      if (state.discovery === undefined) state.discovery = { fragments: { origin: false, ember: false, tide: false }, claimed: false, extractions: 0, evacuations: 0 };
      if (state.surveyArchive === undefined) state.surveyArchive = { entries: [], earlier: [0, 0, 0, 0, 0, 0], unavailable: state.galaxyIndex };
      // Reapply deterministic campaign terrain before validating a pending core's biome fragment.
      api.restoreWorldOverrides?.(state);
      api.restoreTrainingWorld?.(state,state.galaxy);
      if (!validate(state)) return null;
      nameGalaxy(state.galaxy, state.seed, state.campaign?.atHome ? 0 : state.galaxyIndex);
      api.restoreTrainingWorld?.(state,state.galaxy);
      updateMission(state);
      return state;
    } catch (_) { return null; }
  }

  const api = { commit, shipMetrics, expeditionBoard, expeditionCellKind, siteOperation, checkpointSite, fieldWeather, siteStatus, generateGalaxy, expeditionView, expeditionReturnRoute, expeditionSafety, beaconView, discoveryCatalog, VERSION, create, dispatch, preview, stats, travelCost, warpCost, explorationCost, currentPlanet, currentSystem, assess, assessSystem, destinations, moduleCapabilities, moduleEffects, moduleDetails, compareModule, suggestions, salvageInfo, componentRecipes, recipes, snapshot, catalog, rarities, missions, biomes: BIOMES, validate, restore, serialize: state => JSON.stringify(state) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OrbitEngine = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
