import * as THREE from 'three';

/* =========================================================================
   ARMY CONTROL — a Control-Army-style army commander game
   World X runs east: Forest (base) -> Riverlands -> Mountains -> Desert ->
   Atlantis. Z is north/south, Y is up. Spawn is (0,0,4).
   ========================================================================= */

// ---------------------------------------------------------------- DATA ---
// Troop types. Each troop lives in a barrack of its type.
const TROOPS = [
  { id: 'sword',       name: 'Sword Soldier', bCost: 0,       cost: 25,     hpM: 1,    dmgM: 1, cd: 1.0, range: 1.8, speed: 8.2,  shirt: 0xc8a06a, pants: 0x6b4a2b, cls: 'sword',    zone: 0, desc: 'Slashes enemies with a sword, or fists if unarmed' },
  { id: 'bow',         name: 'Bow Soldier',   bCost: 300,     cost: 120,    hpM: 0.8,  dmgM: 1, cd: 1.2, range: 13,  speed: 8.2,  shirt: 0x3fa34d, pants: 0x3a4a22, cls: 'bow',      zone: 0, ranged: true, desc: 'Pierces enemies with arrows from range' },
  { id: 'swordmaster', name: 'Swordmaster',   bCost: 2500,    cost: 800,    hpM: 0.75, dmgM: 2, cd: 0.9, range: 2.0, speed: 8.6,  shirt: 0x2b3a6e, pants: 0x1b2140, cls: 'sword',    zone: 1, desc: 'Deals 2x damage but has 25% less health' },
  { id: 'centaur',     name: 'Centaur',       bCost: 9000,    cost: 2500,   hpM: 1.2,  dmgM: 2, cd: 1.1, range: 12,  speed: 12.3, shirt: 0xb5652a, pants: 0x6b3a18, cls: 'bow',      zone: 2, ranged: true, centaur: true, desc: '2x damage and 50% faster. Uses bows' },
  { id: 'paladin',     name: 'Paladin',       bCost: 25000,   cost: 6000,   hpM: 1.5,  dmgM: 1, cd: 1.0, range: 2.3, speed: 8.0,  shirt: 0xf2efe6, pants: 0xc9a13a, cls: 'sword',    zone: 2, dr: 0.15, undead: 2, desc: 'Takes 15% less damage and deals 2x damage to undead' },
  { id: 'wizard',      name: 'Wizard',        bCost: 70000,   cost: 15000,  hpM: 0.9,  dmgM: 1, cd: 1.5, range: 12,  speed: 8.0,  shirt: 0x6b3fd8, pants: 0x3d2466, cls: 'staff',    zone: 3, ranged: true, splash: 3, debuff: true, desc: 'Magic blasts that debuff enemies: they take 25% more damage' },
  { id: 'snowballer',  name: 'Snowballer',    bCost: 150000,  cost: 30000,  hpM: 1,    dmgM: 1, cd: 1.1, range: 12,  speed: 8.2,  shirt: 0x9fd8ff, pants: 0x3b6fbf, cls: 'snowball', zone: 3, ranged: true, boost: true, desc: 'Throws snowballs and randomly summons boosts for the army' },
  { id: 'healer',      name: 'Healer',        bCost: 300000,  cost: 60000,  hpM: 1.2,  dmgM: 1, cd: 1.4, range: 9,   speed: 8.4,  shirt: 0xffffff, pants: 0xff6f8f, cls: 'bandage',  zone: 4, healer: true, desc: 'Heals the most injured troop instead of attacking' },
  { id: 'absorber',    name: 'Absorber',      bCost: 700000,  cost: 120000, hpM: 3,    dmgM: 1, cd: 1.2, range: 2.3, speed: 7.8,  shirt: 0x2a2a3a, pants: 0x14141f, cls: 'glove',    zone: 4, absorber: true, desc: 'Draws enemy attacks. Hits for 7% of its max HP plus the damage it absorbed' },
  { id: 'beamer',      name: 'Beamer',        bCost: 1500000, cost: 300000, hpM: 1,    dmgM: 1, cd: 1.3, range: 14,  speed: 8.2,  shirt: 0x39e6ff, pants: 0x1b4f8a, cls: 'energy',   zone: 4, ranged: true, beam: true, desc: 'Fires an energy beam that also hits enemies around the target' },
  { id: 'skyknight',   name: 'Sky Knight',    bCost: 600e6,   cost: 100e6,  hpM: 2,    dmgM: 2.5, cd: 1.0, range: 2.3, speed: 9.5, shirt: 0xbfe6ff, pants: 0x8fb4e0, cls: 'sword',    zone: 8, dr: 0.1, desc: 'Winged knight: 2x health, 2.5x damage, 10% less damage taken' },
  { id: 'reaper',      name: 'Soul Reaper',   bCost: 3e9,     cost: 500e6,  hpM: 1.4,  dmgM: 3, cd: 0.9, range: 2.4, speed: 9,   shirt: 0x3a2a6a, pants: 0x1a1a2a, cls: 'sword',    zone: 9, undead: 2.5, desc: '3x damage, and 2.5x more against undead like Lost Souls' },
  { id: 'dinorider',   name: 'Raptor Rider',  bCost: 15e9,    cost: 2.5e9,  hpM: 2.2,  dmgM: 3, cd: 1.0, range: 13,  speed: 13,  shirt: 0x5a9a3a, pants: 0x3f6a2a, cls: 'bow',      zone: 10, ranged: true, centaur: true, desc: 'Rides a raptor: 3x damage, very fast, shoots from range' },
  { id: 'frostmage',   name: 'Frost Mage',    bCost: 80e9,    cost: 12e9,   hpM: 1.6,  dmgM: 2.5, cd: 1.4, range: 13, speed: 8.4, shirt: 0x9fdcff, pants: 0x3a6a9a, cls: 'staff',    zone: 11, ranged: true, splash: 4.5, debuff: true, desc: 'Huge icy blasts with 2.5x damage that debuff every enemy they hit' },
];
const TROOP_BY_ID = Object.fromEntries(TROOPS.map((t, i) => [t.id, i]));

TROOPS.push(
  { id: 'magmaknight', name: 'Magma Knight', bCost: 60e9, cost: 8e9, hpM: 2.7, dmgM: 3.2, cd: 0.95, range: 2.4, speed: 9.2, shirt: 0xff5a24, pants: 0x5a2222, cls: 'sword', zone: 14, dr: 0.12, desc: 'Magma-armored frontline knight with high damage and damage reduction' },
  { id: 'alienranger', name: 'Alien Ranger', bCost: 140e9, cost: 18e9, hpM: 1.4, dmgM: 3.6, cd: 1.0, range: 16, speed: 10, shirt: 0x53d7a0, pants: 0x163b35, cls: 'energy', zone: 15, ranged: true, beam: true, desc: 'Long-range plasma shots that pierce enemy lines' },
  { id: 'deepstalker', name: 'Deep Stalker', bCost: 280e9, cost: 36e9, hpM: 2.2, dmgM: 4.1, cd: 0.86, range: 2.8, speed: 11, shirt: 0x315a3a, pants: 0x182a20, cls: 'sword', zone: 16, desc: 'Fast ambusher who shreds targets at close range' },
  { id: 'stormcaster', name: 'Storm Caster', bCost: 560e9, cost: 75e9, hpM: 1.6, dmgM: 4.5, cd: 1.1, range: 15, speed: 9.4, shirt: 0x5f9bff, pants: 0x24395c, cls: 'staff', zone: 17, ranged: true, splash: 4, debuff: true, desc: 'Chains storm damage through nearby enemies and exposes them' },
  { id: 'uranian', name: 'Uranian Guard', bCost: 1.1e12, cost: 160e9, hpM: 3.0, dmgM: 4.3, cd: 0.95, range: 2.7, speed: 9.5, shirt: 0x9f7bff, pants: 0x29204a, cls: 'sword', zone: 18, dr: 0.2, desc: 'Citadel guardian with heavy armor and elite damage' },
  { id: 'starwarden', name: 'Star Warden', bCost: 2.2e12, cost: 320e9, hpM: 2.4, dmgM: 5.5, cd: 0.95, range: 15, speed: 10.5, shirt: 0xffd98a, pants: 0x4d3b7a, cls: 'staff', zone: 19, ranged: true, splash: 5, desc: 'Endgame astral caster whose attacks erupt into starbursts' },
);
for (let i = TROOPS.length - 6; i < TROOPS.length; i++) TROOP_BY_ID[TROOPS[i].id] = i;
const plotFee = (n) => (n === 0 ? 0 : Math.round(100 * Math.pow(2.2, n - 1) / 10) * 10);
const barrackCap = (L) => (L >= 12 ? 4 : L >= 8 ? 3 : L >= 4 ? 2 : 1);
const bXpNeed = (L) => Math.round(60 * Math.pow(1.5, L - 1));
const BARRACK_MAX_LV = 12;

// Gear. type: weapon (cls), armor (hp), bag (cap), wand (mat multiplier). cost 0 = drop / reward only.
const ITEMS = {};
const addItems = (type, cls, list) => list.forEach(([id, name, a, b, cost, zone, color]) => {
  ITEMS[id] = type === 'weapon' ? { id, name, type, cls, min: a, max: b, cost, zone, color }
    : type === 'armor' ? { id, name, type, hp: a, cost, zone, color }
    : type === 'bag' ? { id, name, type, cap: a, cost, zone, color }
    : { id, name, type, mult: a, cost, zone, color };
});
addItems('weapon', 'sword', [
  ['wooden_sword', 'Wooden Sword', 5, 10, 60, 0, 0xc28a4a], ['leaf_sword', 'Leaf Sword', 12, 18, 400, 0, 0x5fbf3a],
  ['stone_sword', 'Stone Sword', 25, 35, 1800, 0, 0x8d8d8d], ['golden_sword', 'Golden Sword', 70, 95, 0, 0, 0xffc83d],
  ['iron_sword', 'Iron Sword', 60, 80, 8000, 1, 0xcfd6de], ['flower_blade', 'Flower Blade', 140, 180, 0, 1, 0xfff4fb],
  ['steel_sword', 'Steel Sword', 150, 190, 35000, 2, 0x7fa6c9], ['emerald_sword', 'Emerald Sword', 380, 460, 0, 2, 0x3ddc84],
  ['crystal_sword', 'Crystal Sword', 350, 420, 150000, 3, 0x9ff0ff], ['wheel_blade', 'Lucky Blade', 700, 800, 0, 3, 0xff6fd8],
  ['desert_sword', 'Desert Sword', 900, 1100, 0, 3, 0xe6c77a], ['coral_sword', 'Coral Sword', 1100, 1300, 900000, 4, 0xff7f6b],
  ['sapphire_sword', 'Sapphire Sword', 2500, 3000, 0, 4, 0x3d6bff], ['trident', 'Trident', 5000, 6000, 0, 4, 0x4af0e0],
]);
addItems('weapon', 'bow', [
  ['wooden_bow', 'Wooden Bow', 6, 11, 150, 0, 0xb07a3a], ['hunter_bow', 'Hunter Bow', 20, 28, 1200, 0, 0x6b4a2b],
  ['iron_bow', 'Iron Bow', 55, 70, 9000, 1, 0xcfd6de], ['steel_bow', 'Steel Bow', 130, 170, 40000, 2, 0x7fa6c9],
  ['sand_bow', 'Sand Bow', 380, 440, 160000, 3, 0xe6c77a], ['phoenix_bow', 'Phoenix Bow', 1200, 1500, 0, 3, 0xff6a2a],
  ['coral_bow', 'Coral Bow', 1000, 1200, 950000, 4, 0xff7f6b],
]);
addItems('weapon', 'staff', [
  ['apprentice_staff', 'Apprentice Staff', 300, 380, 0, 3, 0x9f7bff], ['arcane_staff', 'Arcane Staff', 900, 1100, 400000, 3, 0xd05aff],
  ['sea_staff', 'Sea Staff', 2500, 3000, 1800000, 4, 0x4af0e0],
]);
addItems('weapon', 'snowball', [
  ['snowball', 'Snowball', 400, 480, 0, 3, 0xffffff], ['ice_ball', 'Ice Ball', 1200, 1400, 600000, 3, 0xaee8ff],
  ['glacier_ball', 'Glacier Ball', 3200, 3600, 2000000, 4, 0x5ad0ff],
]);
addItems('weapon', 'bandage', [
  ['bandage', 'Bandage', 150, 200, 0, 4, 0xffffff], ['med_kit', 'Med Kit', 600, 800, 800000, 4, 0xffe0e0],
]);
addItems('weapon', 'glove', [
  ['absorber_glove', 'Absorber Glove', 1, 1, 0, 4, 0x3a3a4a], ['spiked_glove', 'Spiked Glove', 1.8, 1.8, 2000000, 4, 0x8a1d22],
]);
addItems('weapon', 'energy', [
  ['energy_glove', 'Energy Glove', 1800, 2200, 0, 4, 0x39e6ff], ['overcharged_glove', 'Overcharged Glove', 4500, 5500, 4000000, 4, 0xfff04a],
]);
addItems('armor', null, [
  ['leaf_armor', 'Leaf Armor', 40, 0, 100, 0, 0x5fbf3a], ['leather_armor', 'Leather Armor', 120, 0, 600, 0, 0x8a5a2e],
  ['golem_armor', 'Golem Armor', 300, 0, 0, 0, 0x8d8d8d], ['iron_armor', 'Iron Armor', 400, 0, 5000, 1, 0xc9ced6],
  ['golden_armor', 'Golden Armor', 900, 0, 0, 0, 0xffc83d], ['steel_armor', 'Steel Armor', 1200, 0, 30000, 2, 0x6f8fb0],
  ['emerald_armor', 'Emerald Armor', 3500, 0, 0, 2, 0x3ddc84], ['mummy_wraps', 'Mummy Wraps', 6000, 0, 0, 3, 0xe8dcc0],
  ['crystal_armor', 'Crystal Armor', 8000, 0, 150000, 3, 0x9ff0ff], ['wheel_armor', 'Lucky Armor', 15000, 0, 0, 3, 0xff6fd8],
  ['coral_armor', 'Coral Armor', 22000, 0, 1000000, 4, 0xff7f6b], ['sapphire_armor', 'Sapphire Armor', 50000, 0, 0, 4, 0x3d6bff],
]);
addItems('bag', null, [
  ['starter_bag', 'Starter Bag', 25, 0, 0, 0, 0xb77a3d], ['small_bag', 'Small Bag', 60, 0, 80, 0, 0xa0692f],
  ['leather_bag', 'Leather Bag', 150, 0, 400, 0, 0x8a5a2e], ['big_bag', 'Big Bag', 400, 0, 2000, 0, 0x6b8a3d],
  ['explorer_bag', 'Explorer Bag', 1200, 0, 10000, 1, 0x3d6b8a], ['mountain_pack', 'Mountain Pack', 4000, 0, 50000, 2, 0x7a7a8a],
  ['desert_chest', 'Desert Chest', 15000, 0, 250000, 3, 0xe6c77a], ['atlantis_vault', 'Atlantis Vault', 60000, 0, 1200000, 4, 0x3a9fb5],
  ['mega_bag', 'Mega Bag', 250000, 0, 6000000, 4, 0xffc83d],
]);
addItems('wand', null, [
  ['basic_wand', 'Basic Wand', 1, 0, 0, 0, 0x8b5a2b], ['leaf_wand', 'Leaf Wand', 1.25, 0, 300, 0, 0x5fbf3a],
  ['stone_wand', 'Stone Wand', 1.5, 0, 3000, 0, 0x8d8d8d], ['river_wand', 'River Wand', 2, 0, 20000, 1, 0x4aa3ff],
  ['emerald_wand', 'Emerald Wand', 3, 0, 120000, 2, 0x3ddc84], ['desert_wand', 'Desert Wand', 5, 0, 0, 3, 0xe6c77a],
  ['sea_wand', 'Sea Wand', 8, 0, 3000000, 4, 0x4af0e0],
]);
const STARTER = { sword: null, bow: 'wooden_bow', staff: 'apprentice_staff', snowball: 'snowball', bandage: 'bandage', glove: 'absorber_glove', energy: 'energy_glove' };
const CLS_NAME = { sword: 'Swords', bow: 'Bows', staff: 'Staffs', snowball: 'Snowballs', bandage: 'Bandages', glove: 'Absorber Gloves', energy: 'Energy Gloves' };

// Resources (go in the bag and sell for gold)
const RES = {
  branch: { name: 'Tree Branch', value: 2, color: 0xa0692f },     petal: { name: 'Blue Petal', value: 4, color: 0x4aa3ff },
  pork: { name: 'Pork', value: 5, color: 0xf2a0a8 },              stone: { name: 'Stone', value: 3, color: 0x9a9a9a },
  vine: { name: 'Vine', value: 12, color: 0x3f8f3a },             golem_shard: { name: 'Golem Shard', value: 30, color: 0x8d8d8d },
  golden_key: { name: 'Golden Key', value: 500, color: 0xffc83d },river_stone: { name: 'River Stone', value: 15, color: 0x6f9fbf },
  flail: { name: 'Rusty Flail', value: 60, color: 0x777777 },     thorn: { name: 'Thorn', value: 45, color: 0x2f6a2f },
  white_petal: { name: 'White Petal', value: 400, color: 0xffffff }, rock_chunk: { name: 'Rock Chunk', value: 40, color: 0x7a7a80 },
  emerald: { name: 'Emerald', value: 80, color: 0x3ddc84 },       ogre_tooth: { name: 'Ogre Tooth', value: 150, color: 0xeee6c8 },
  golem_heart: { name: 'Golem Heart', value: 300, color: 0xd04040 }, sand: { name: 'Sand', value: 50, color: 0xe6c77a },
  cactus_fiber: { name: 'Cactus Fiber', value: 70, color: 0x6fae4a }, scorpion_tail: { name: 'Scorpion Tail', value: 500, color: 0xc0632f },
  mummy_cloth: { name: 'Mummy Cloth', value: 700, color: 0xe8dcc0 }, ancient_fragment: { name: 'Ancient Fragment', value: 2000, color: 0xb36bff },
  coral: { name: 'Coral', value: 300, color: 0xff7f6b },          pearl: { name: 'Pearl', value: 1200, color: 0xf4f0ff },
  shark_tooth: { name: 'Shark Tooth', value: 2500, color: 0xffffff }, sapphire: { name: 'Sapphire', value: 3000, color: 0x3d6bff },
};

const ZONES = [
  { id: 'forest',     name: 'Forest',     x0: -30, x1: 100, ground: 0x6cc24a, sky: 0x8fd3ff, sub: 'Home of your base' },
  { id: 'riverlands', name: 'Riverlands', x0: 100, x1: 180, ground: 0x58b85e, sky: 0x86d0f5, sub: 'Home of the White Flower' },
  { id: 'mountains',  name: 'Mountains',  x0: 180, x1: 260, ground: 0x9aa38a, sky: 0xa9c8e0, sub: 'Rocky, Ogres and the Emerald Golem' },
  { id: 'desert',     name: 'Desert',     x0: 260, x1: 340, ground: 0xe6c77a, sky: 0xf2d9a6, sub: 'Break the 3 Dark Pillars to summon the Lord of Sands' },
  { id: 'atlantis',   name: 'Atlantis',   x0: 340, x1: 420, ground: 0x3a9fb5, sky: 0x2a7fa0, sub: 'Break the 3 Shark Statues to summon Sir Shark' },
];
// Zones unlock by how many units (troops) you own, like the original.
const GATES = [
  { x: 100, zone: 1, req: 5 },
  { x: 180, zone: 2, req: 10 },
  { x: 260, zone: 3, req: 15 },
  { x: 340, zone: 4, req: 25 },
];
const Z_MIN = -44, Z_MAX = 44, X_MIN = -85, X_MAX = 1219;

// V11 late-game frontier. Volcano / Alien Realm / Shocked Forest are names
// documented in Control Army; the later two are original extensions for this game.
ZONES.push(
  { id: 'volcano', name: 'Volcano', x0: 740, x1: 820, ground: 0x5a3a32, sky: 0x6b2f2f, sub: 'Lava flows, Magma Brutes and the Inferno Titan', fog: [28, 105] },
  { id: 'alienrealm', name: 'Alien Realm', x0: 820, x1: 900, ground: 0x2f5b4d, sky: 0x16283a, sub: 'Alien scouts, plasma creatures and the UFO Overlord', fog: [24, 105] },
  { id: 'deepforest', name: 'Deep Forest', x0: 900, x1: 980, ground: 0x204f2c, sky: 0x183b28, sub: 'Ancient trees, root beasts and the Ancient Ent', fog: [22, 95] },
  { id: 'shocked', name: 'Shocked Forest', x0: 980, x1: 1060, ground: 0x3d5b5a, sky: 0x273d53, sub: 'Storm energy, lightning beasts and the Thunder King', fog: [20, 90] },
  { id: 'uranian', name: 'Uranian Citadel', x0: 1060, x1: 1139, ground: 0x4c3a6d, sky: 0x241c45, sub: 'Planet Uran technology and the Citadel Commander', fog: [24, 100] },
  { id: 'celestial', name: 'Celestial Frontier', x0: 1139, x1: 1219, ground: 0x7e78a8, sky: 0x40527c, sub: 'The final frontier. Astral monsters guard the Star Emperor', fog: [18, 88] },
);
GATES.push(
  { x: 740, zone: 14, req: 90, boss: 'frostgiant', rebirthReq: 4 },
  { x: 820, zone: 15, req: 110, rebirthReq: 5 },
  { x: 900, zone: 16, req: 135, boss: 'ufooverlord', rebirthReq: 6 },
  { x: 980, zone: 17, req: 165, rebirthReq: 7 },
  { x: 1060, zone: 18, req: 200, boss: 'thunderking', rebirthReq: 8 },
  { x: 1139, zone: 19, req: 250, boss: 'citadelcommander', rebirthReq: 10 },
);

// V12 command posts: capture and hold territory with your army.
const CAPTURE_POST_DEFS = [
  {id:'forest_post',zone:0,x:78,z:18,reward:1200},{id:'river_post',zone:1,x:142,z:20,reward:8000},{id:'mountain_post',zone:2,x:222,z:-18,reward:35000},
  {id:'desert_post',zone:3,x:302,z:18,reward:150000},{id:'atlantis_post',zone:4,x:382,z:-18,reward:650000},{id:'mushroom_post',zone:5,x:148,z:92,reward:1200000},
  {id:'ouro_post',zone:6,x:300,z:92,reward:3000000},{id:'magic_post',zone:7,x:382,z:92,reward:7500000},{id:'volcano_post',zone:14,x:780,z:18,reward:50000000},
  {id:'alien_post',zone:15,x:860,z:-18,reward:120000000},{id:'deep_post',zone:16,x:940,z:18,reward:250000000},{id:'storm_post',zone:17,x:1020,z:-18,reward:500000000},
  {id:'uran_post',zone:18,x:1100,z:18,reward:1200000000},{id:'celestial_post',zone:19,x:1180,z:-18,reward:3000000000},
];
Object.assign(RES, {
  magma: { name: 'Magma Core', value: 5000000, color: 0xff5a24 }, emberstone: { name: 'Emberstone', value: 7500000, color: 0xffb52e },
  alien_crystal: { name: 'Alien Crystal', value: 12000000, color: 0x7affb0 }, plasma_cell: { name: 'Plasma Cell', value: 16000000, color: 0x39e6ff },
  ancient_bark: { name: 'Ancient Bark', value: 25000000, color: 0x8a5a3a }, nature_core: { name: 'Nature Core', value: 42000000, color: 0x72d96f },
  storm_shard: { name: 'Storm Shard', value: 70000000, color: 0xb8eaff }, charged_core: { name: 'Charged Core', value: 95000000, color: 0x7ce8ff },
  uran_chip: { name: 'Uran Chip', value: 160000000, color: 0xb59cff }, quantum_core: { name: 'Quantum Core', value: 220000000, color: 0x62ffde },
  star_dust: { name: 'Star Dust', value: 400000000, color: 0xffe8a6 }, astral_core: { name: 'Astral Core', value: 650000000, color: 0xd08cff },
});
addItems('weapon', 'sword', [
  ['magma_blade', 'Magma Blade', 4.2e6, 5.3e6, 0, 14, 0xff5a24], ['citadel_blade', 'Citadel Blade', 28e6, 34e6, 0, 18, 0xb59cff], ['star_saber', 'Star Saber', 75e6, 92e6, 0, 19, 0xffe5a3],
]);
addItems('weapon', 'energy', [
  ['plasma_rifle', 'Plasma Rifle', 6.5e6, 8e6, 0, 15, 0x39e6ff], ['storm_cannon', 'Storm Cannon', 19e6, 24e6, 0, 17, 0x7ce8ff],
]);
addItems('weapon', 'staff', [
  ['ancient_staff', 'Ancient Staff', 12e6, 15e6, 0, 16, 0x72d96f], ['astral_staff', 'Astral Staff', 42e6, 55e6, 0, 19, 0xd08cff],
]);
addItems('armor', null, [
  ['volcanic_armor', 'Volcanic Armor', 60e6, 0, 0, 14, 0xff5a24], ['alien_armor', 'Alien Armor', 140e6, 0, 0, 15, 0x7affb0], ['deep_armor', 'Ancient Bark Armor', 260e6, 0, 0, 16, 0x72d96f],
  ['storm_armor', 'Storm Armor', 500e6, 0, 0, 17, 0x7ce8ff], ['citadel_armor', 'Citadel Armor', 1.2e9, 0, 0, 18, 0xb59cff], ['astral_armor', 'Astral Armor', 3e9, 0, 0, 19, 0xd08cff],
]);
addItems('bag', null, [
  ['magma_pack', 'Magma Pack', 900000, 0, 100e6, 14, 0xff5a24], ['alien_satchel', 'Alien Satchel', 3000000, 0, 500e6, 15, 0x7affb0], ['ancient_pack', 'Ancient Pack', 9000000, 0, 2e9, 16, 0x72d96f],
  ['storm_vault', 'Storm Vault', 25000000, 0, 8e9, 17, 0x7ce8ff], ['uran_vault', 'Uran Vault', 70000000, 0, 30e9, 18, 0xb59cff], ['astral_vault', 'Astral Vault', 200000000, 0, 100e9, 19, 0xd08cff],
]);
addItems('wand', null, [
  ['magma_wand', 'Magma Wand', 10, 0, 25e6, 14, 0xff5a24], ['plasma_wand', 'Plasma Wand', 14, 0, 75e6, 15, 0x39e6ff], ['nature_wand', 'Nature Wand', 18, 0, 250e6, 16, 0x72d96f],
  ['storm_wand', 'Storm Wand', 24, 0, 800e6, 17, 0x7ce8ff], ['uran_wand', 'Uran Wand', 32, 0, 3e9, 18, 0xb59cff], ['astral_wand', 'Astral Wand', 45, 0, 12e9, 19, 0xd08cff],
]);

// Skills: dropped by bosses, one equipped at a time (G key)
const SKILLS = {
  heal:   { name: 'Heal Power',   cd: 30, dur: 0,  color: 0x52d273, desc: 'Instantly heals every troop for 60% of their health' },
  shield: { name: 'Shield Power', cd: 45, dur: 10, color: 0x4aa3ff, desc: 'Troops take 50% less damage for 10s' },
  rage:   { name: 'Monster Rage', cd: 50, dur: 10, color: 0xff5a5f, desc: 'Troops deal 2x damage for 10s' },
  beast:  { name: 'Beast Mode',   cd: 60, dur: 15, color: 0xffa53d, desc: 'Troops get +50% damage and +50% speed for 15s' },
};

// Potions (stored, then used). 5 minutes each.
const POTION_TIME = 300;
const POTIONS = {
  gold: { name: '2x Gold Potion',      color: 0xffc83d, desc: 'Double gold from enemies and selling', gold: 200,  need: { petal: 10, vine: 5 } },
  luck: { name: '2x Luck Potion',      color: 0x52d273, desc: 'Double chance for rare drops',         gold: 1500, need: { golem_shard: 3, thorn: 5 } },
  exp:  { name: '+20% EXP Potion',     color: 0x8fe0ff, desc: 'Barracks earn 20% more XP',             gold: 100,  need: { branch: 10, stone: 10 } },
  mat:  { name: '2x Materials Potion', color: 0xb36bff, desc: 'Double materials from trees, rocks and ores', gold: 6000, need: { emerald: 3, ogre_tooth: 2 } },
};

// Codes (the real Control Army codes that give gold / potions / barrack XP)
const CODES = {
  HELLO: { gold: 500 }, RELEASE: { gold: 250 }, WATERFALL: { gold: 1000 }, UNDERWATER: { gold: 2500 }, SANDS: { gold: 2000 },
  MOUNTSHOP: { gold: 1500 }, '10K': { bxp: 10000 }, '20KLIKES': { pot: { gold: 2 } }, CASTLE: { pot: { luck: 2 } },
    EVERYTHING: { special: 'everything' },

  RAPTOR: { pot: { luck: 1 } }, PATRYK10B: { pot: { luck: 2, exp: 2 } }, MUSHROOMS: { res: { mushroom: 7 } },
};

const WHEELS = {
  standard: {
    name: 'Standard Wheel',
    cost: 0,
    cooldown: 30 * 60,
    prizes: [
      { label: '250 Gold',      w: 24, color: '#ffc83d', give: { gold: 250 } },
      { label: '500 Gold',      w: 20, color: '#ffb000', give: { gold: 500 } },
      { label: 'Gold Potion',   w: 14, color: '#ffe38a', give: { pot: { gold: 1 } } },
      { label: 'Luck Potion',   w: 14, color: '#52d273', give: { pot: { luck: 1 } } },
      { label: '1K Gold',       w: 12, color: '#ff8a3d', give: { gold: 1000 } },
      { label: '500 XP',        w: 10, color: '#8fe0ff', give: { bxp: 500 } },
      { label: 'Materials',     w: 5,  color: '#b36bff', give: { pot: { mat: 1 } } },
      { label: '5K Gold',       w: 1,  color: '#ff6fd8', give: { gold: 5000 } },
    ],
  },

  premium: {
    name: 'Premium Wheel',
    cost: 25000,
    cooldown: 10 * 60,
    prizes: [
      { label: '5K Gold',       w: 20, color: '#ffc83d', give: { gold: 5000 } },
      { label: 'Gold Potion',   w: 18, color: '#ffe38a', give: { pot: { gold: 2 } } },
      { label: 'Luck Potion',   w: 15, color: '#52d273', give: { pot: { luck: 2 } } },
      { label: '5K XP',         w: 15, color: '#8fe0ff', give: { bxp: 5000 } },
      { label: 'Materials',     w: 12, color: '#b36bff', give: { pot: { mat: 2 } } },
      { label: 'Ancient Shard', w: 10, color: '#d05aff', give: { key: { ancient_fragment: 1 } } },
      { label: 'Lucky Blade',   w: 8,  color: '#ff6fd8', give: { item: 'wheel_blade' } },
      { label: 'Lucky Armor',   w: 2,  color: '#ff3d9a', give: { item: 'wheel_armor' } },
    ],
  },
};

function wheelLayout(type = 'standard') {
  const prizes = WHEELS[type]?.prizes ?? WHEELS.standard.prizes;
  const totalWeight = prizes.reduce((sum, prize) => sum + prize.w, 0);
  let angle = 0;

  return prizes.map((prize) => {
    const start = angle;
    angle += (prize.w / totalWeight) * 360;

    return {
      ...prize,
      start,
      end: angle,
      center: (start + angle) / 2,
    };
  });
}

const normalizeDegrees = (degrees) => ((degrees % 360) + 360) % 360;


// Quest givers (like Tom, Emma and Mr. File)
const NPCS = [
  { id: 'tom', name: 'Tom', x: 8, z: -5, shirt: 0x3b7bd8, quests: [
    { t: 'Have 1 unit', k: 'units', n: 1, r: 50 },
    { t: 'Chop down 5 trees', k: 'count', id: 'tree', n: 5, r: 60 },
    { t: 'Pick 5 blue flowers', k: 'count', id: 'blueflower', n: 5, r: 60 },
    { t: 'Defeat 3 pigs', k: 'count', id: 'pig', n: 3, r: 80 },
    { t: 'Own 2 barracks', k: 'barracks', n: 2, r: 100 },
    { t: 'Defeat 5 Living Flowers', k: 'count', id: 'livingflower', n: 5, r: 150 },
    { t: 'Have 3 units', k: 'units', n: 3, r: 200 },
    { t: 'Buy a Wooden Sword', k: 'own', id: 'wooden_sword', n: 1, r: 150 },
    { t: 'Defeat 5 Flower Guards', k: 'count', id: 'flowerguard', n: 5, r: 300 },
    { t: 'Get a barrack to level 4', k: 'blevel', n: 4, r: 400 },
    { t: 'Defeat 5 Golems', k: 'count', id: 'golem', n: 5, r: 500 },
    { t: 'Sell 1,000 gold of goods', k: 'sold', n: 1000, r: 500 },
    { t: 'Have 5 units', k: 'units', n: 5, r: 800 },
    { t: 'Defeat the Golden Golem', k: 'count', id: 'goldengolem', n: 1, r: 1500 },
    { t: 'Find the Golden Key', k: 'found', id: 'golden_key', n: 1, r: 3000 },
  ] },
  { id: 'emma', name: 'Emma', x: 110, z: 10, shirt: 0xff6f8f, quests: [
    { t: 'Defeat 10 Flail Soldiers', k: 'count', id: 'flailsoldier', n: 10, r: 1500 },
    { t: 'Chop 10 Big Trees', k: 'count', id: 'bigtree', n: 10, r: 1500 },
    { t: 'Defeat 10 Thorn Flowers', k: 'count', id: 'thornflower', n: 10, r: 2000 },
    { t: 'Have 7 units', k: 'units', n: 7, r: 2500 },
    { t: 'Defeat 5 Moss Golems', k: 'count', id: 'mossgolem', n: 5, r: 3000 },
    { t: 'Buy an Iron Sword', k: 'own', id: 'iron_sword', n: 1, r: 3000 },
    { t: 'Break 10 River Rocks', k: 'count', id: 'riverrock', n: 10, r: 3500 },
    { t: 'Get a barrack to level 8', k: 'blevel', n: 8, r: 5000 },
    { t: 'Defeat the White Flower', k: 'count', id: 'whiteflower', n: 1, r: 8000 },
    { t: 'Have 10 units', k: 'units', n: 10, r: 8000 },
    { t: 'Sell 50,000 gold of goods', k: 'sold', n: 50000, r: 10000 },
    { t: 'Defeat the White Flower 3 times', k: 'count', id: 'whiteflower', n: 3, r: 15000 },
  ] },
  { id: 'file', name: 'Mr. File', x: 190, z: 10, shirt: 0x6f6f7a, quests: [
    { t: 'Defeat 10 Rocky', k: 'count', id: 'rocky', n: 10, r: 12000 },
    { t: 'Mine 10 Emerald Ores', k: 'count', id: 'emeraldore', n: 10, r: 15000 },
    { t: 'Defeat 8 Ogres', k: 'count', id: 'ogre', n: 8, r: 20000 },
    { t: 'Defeat 5 Bodyguard Golems', k: 'count', id: 'bodyguard', n: 5, r: 25000 },
    { t: 'Defeat the Emerald Golem', k: 'count', id: 'emeraldgolem', n: 1, r: 60000 },
    { t: 'Have 15 units', k: 'units', n: 15, r: 60000 },
    { t: 'Defeat the Pharaoh', k: 'count', id: 'pharaoh', n: 1, r: 150000 },
    { t: 'Defeat the Lord of Sands', k: 'count', id: 'lordofsands', n: 1, r: 250000 },
    { t: 'Have 25 units', k: 'units', n: 25, r: 300000 },
    { t: 'Defeat the Sapphire Golem', k: 'count', id: 'sapphiregolem', n: 1, r: 700000 },
    { t: 'Defeat Sir Shark', k: 'count', id: 'sirshark', n: 1, r: 1500000 },
  ] },
];

// Code signs placed around the map, like the hidden codes in the original
const CODE_SIGNS = [
  { code: 'HELLO', x: -4, z: 9 }, { code: 'RELEASE', x: 18, z: -30 }, { code: 'WATERFALL', x: 136, z: 38 },
  { code: 'MOUNTSHOP', x: 232, z: -38 }, { code: '10K', x: 252, z: 38 }, { code: 'SANDS', x: 300, z: -40 }, { code: 'UNDERWATER', x: 380, z: 38 },
];


// ------------------------------------------------------- V4 EXPANSION ---
// Hidden areas north of the main path, like the original's side zones
ZONES.push(
  { id: 'mushroom',  name: 'Mushroom Forest', x0: 110, x1: 186, z0: 57, z1: 125, ground: 0x4a3a5e, sky: 0x2e2244, sub: 'Mushy, the Wise Tree and the Spider Queen', annex: true },
  { id: 'ouroboros', name: 'Ouroboros',       x0: 262, x1: 338, z0: 57, z1: 125, ground: 0xb5653a, sky: 0xc9714a, sub: 'The Enchanter waits. Sit on the throne to summon the World Eater', annex: true },
  { id: 'magic',     name: 'Magic Forest',    x0: 344, x1: 420, z0: 57, z1: 125, ground: 0x3f6a4a, sky: 0x5a4a9a, sub: 'Mutant Gnome and the Minotaur', annex: true },
);
for (const z of ZONES) { if (z.z0 === undefined) { z.z0 = -44; z.z1 = 44; } }
const ANNEX_GATES = [
  { zone: 5, x: 160, z: 50, req: { units: 35 }, rebirthReq: 1, text: 'Mushroom Forest: 35 Units + 1 Rebirth' },
  { zone: 6, x: 300, z: 50, req: { gold: 20e6 }, rebirthReq: 2, text: 'Mysterious Fragments: 20M Gold + 2 Rebirths' },
  { zone: 7, x: 382, z: 50, req: { gold: 45e6, boss: 'spiderqueen' }, rebirthReq: 3, text: 'Magic Forest: Spider Queen + 45M + 3 Rebirths' },
];

// Key items (not stored in the bag, never sold)
const KEY = {
  golden_key: { name: 'Golden Key', color: 0xffc83d, desc: 'Dropped by the Golden Golem. Tom wants it' },
  ancient_fragment: { name: 'Ancient Fragment', color: 0xb36bff, desc: 'Used by the Enchanter. Dropped in the Desert or crafted' },
  sun_fragment: { name: 'Sun Fragment', color: 0xffb000, desc: 'Half of the World Eater summon' },
  moon_fragment: { name: 'Moon Fragment', color: 0x9fb4ff, desc: 'Half of the World Eater summon' },
  primal_core: { name: 'Primal Core', color: 0xff3d6b, desc: 'Lets you summon the Primal World Eater' },
  spider_summon: { name: 'Spider Queen Summon', color: 0x8a3fd8, desc: 'Place it on the web altar in the Mushroom Forest' },
  gem_ruby: { name: 'Ruby Gem', color: 0xe0353b, desc: 'Forest gem. Collect all 6 to summon the Minotaur' },
  gem_topaz: { name: 'Topaz Gem', color: 0xffc83d, desc: 'Riverlands gem' },
  gem_jade: { name: 'Jade Gem', color: 0x3ddc84, desc: 'Mountains gem' },
  gem_amber: { name: 'Amber Gem', color: 0xff8a3d, desc: 'Desert gem' },
  gem_aqua: { name: 'Aquamarine Gem', color: 0x4af0e0, desc: 'Atlantis gem' },
  gem_amethyst: { name: 'Amethyst Gem', color: 0xb36bff, desc: 'Mushroom Forest gem' },
  winner_token: { name: 'Winner Token', color: 0xffe066, desc: 'Proof that you beat the hardest bosses' },
};
const GEMS = ['gem_ruby', 'gem_topaz', 'gem_jade', 'gem_amber', 'gem_aqua', 'gem_amethyst'];
delete RES.golden_key; delete RES.ancient_fragment;
Object.assign(RES, {
  mushroom: { name: 'Coloured Mushroom', value: 4000, color: 0xff5a8a }, silk: { name: 'Spider Silk', value: 6000, color: 0xeeeeff },
  relic: { name: 'Ancient Relic', value: 12000, color: 0xd9a14a }, scale: { name: 'Serpent Scale', value: 9000, color: 0x5ac85a },
  dark_branch: { name: 'Dark Tree Branch', value: 20000, color: 0x3a2a4a }, magic_crystal: { name: 'Magic Crystal', value: 35000, color: 0xd05aff },
  fairy_wing: { name: 'Fairy Wing', value: 25000, color: 0xffb3f0 },
});

// late game gear: generated tiers per class, plus boss drops
const CLASS_BASE = { sword: 1200, bow: 1100, staff: 2750, snowball: 3400, bandage: 700, energy: 5000 };
const TIER_GEAR = [
  { zone: 5, pre: 'Mushroom', k: 5, cost: 12e6, color: 0xff5a8a },
  { zone: 6, pre: 'Serpent', k: 12, cost: 90e6, color: 0x5ac85a },
  { zone: 7, pre: 'Arcane', k: 30, cost: 600e6, color: 0xd05aff },
];
const CLS_WORD = { sword: 'Sword', bow: 'Bow', staff: 'Staff', snowball: 'Snowball', bandage: 'Bandage', energy: 'Energy Glove' };
for (const t of TIER_GEAR) {
  for (const [cls, base] of Object.entries(CLASS_BASE)) {
    const id = `${t.pre.toLowerCase()}_${cls}`;
    ITEMS[id] = { id, name: `${t.pre} ${CLS_WORD[cls]}`, type: 'weapon', cls, min: Math.round(base * t.k * 0.9), max: Math.round(base * t.k * 1.1), cost: t.cost * (cls === 'sword' || cls === 'bow' ? 1 : 1.5), zone: t.zone, color: t.color };
  }
  const gid = `${t.pre.toLowerCase()}_glove`;
  ITEMS[gid] = { id: gid, name: `${t.pre} Absorber Glove`, type: 'weapon', cls: 'glove', min: 1.8 + t.k / 6, max: 1.8 + t.k / 6, cost: t.cost * 2, zone: t.zone, color: t.color };
}
addItems('weapon', 'sword', [
  ['spider_fang', 'Spider Fang', 9000, 11000, 0, 5, 0x8a3fd8], ['world_blade', 'World Eater Blade', 22000, 26000, 0, 6, 0xff8a3d],
  ['primal_blade', 'Primal Blade', 55000, 65000, 0, 6, 0xff3d6b], ['minotaur_axe', 'Minotaur Axe', 80000, 95000, 0, 7, 0xb5652a],
]);
addItems('weapon', 'bow', [['world_bow', 'World Eater Bow', 20000, 24000, 0, 6, 0xff8a3d], ['gnome_bow', 'Gnome Bow', 35000, 42000, 0, 7, 0x52d273]]);
addItems('weapon', 'staff', [['wise_staff', 'Wise Staff', 22000, 26000, 0, 5, 0x6fae4a]]);
addItems('armor', null, [
  ['mushroom_armor', 'Mushroom Armor', 150000, 0, 10e6, 5, 0xff5a8a], ['silk_armor', 'Spider Silk Armor', 300000, 0, 0, 5, 0xeeeeff],
  ['serpent_armor', 'Serpent Armor', 400000, 0, 100e6, 6, 0x5ac85a], ['world_armor', 'World Eater Armor', 900000, 0, 0, 6, 0xff8a3d],
  ['arcane_armor', 'Arcane Armor', 1200000, 0, 700e6, 7, 0xd05aff], ['minotaur_hide', 'Minotaur Hide', 3000000, 0, 0, 7, 0xb5652a],
]);
addItems('bag', null, [['mushroom_pouch', 'Mushroom Pouch', 1000000, 0, 30e6, 5, 0xff5a8a], ['arcane_bag', 'Arcane Bag', 5000000, 0, 300e6, 7, 0xd05aff]]);
addItems('wand', null, [['mushroom_wand', 'Mushroom Wand', 12, 0, 25e6, 5, 0xff5a8a], ['serpent_wand', 'Serpent Wand', 20, 0, 150e6, 6, 0x5ac85a], ['arcane_wand', 'Arcane Wand', 40, 0, 800e6, 7, 0xd05aff]]);

// Player accessories (Riverlands accessory store): hats = luck, boots = speed, belts = gold
const ACC = {
  hat:   [['straw_hat', 'Straw Hat', 0.1, 5000, 1], ['wizard_hat', 'Wizard Hat', 0.25, 80000, 2], ['crown_hat', 'Royal Crown', 0.5, 1.5e6, 4], ['gnome_hat', 'Gnome Hat', 0.35, 0, 7], ['mushroom_cap', 'Mushroom Cap', 0.8, 40e6, 5], ['arcane_hood', 'Arcane Hood', 1.5, 500e6, 7]],
  boots: [['sandals', 'Sandals', 0.1, 3000, 1], ['leather_boots', 'Leather Boots', 0.2, 50000, 1], ['wind_boots', 'Wind Boots', 0.35, 900000, 3], ['fairy_boots', 'Fairy Boots', 0.5, 80e6, 7]],
  belt:  [['rope_belt', 'Rope Belt', 0.1, 8000, 1], ['gold_belt', 'Gold Belt', 0.25, 200000, 2], ['pharaoh_belt', 'Pharaoh Belt', 0.5, 5e6, 3], ['serpent_belt', 'Serpent Belt', 1, 120e6, 6]],
};
const ACC_INFO = { hat: { label: 'Hats', stat: 'luck' }, boots: { label: 'Boots', stat: 'speed' }, belt: { label: 'Belts', stat: 'gold' } };
for (const [slot, list] of Object.entries(ACC)) for (const [id, name, v, cost, zone] of list) ITEMS[id] = { id, name, type: slot, v, cost, zone, color: slot === 'hat' ? 0x9f7bff : slot === 'boots' ? 0x8a5a2e : 0xffc83d };

// Enchantments (1 Ancient Fragment each, at the Enchanter in Ouroboros)
const ENCHANTS = {
  weapon: [
    { id: 'sharp', name: 'Sharp', w: 40, dmg: 0.15, color: '#cfe3f0', desc: '+15% damage' },
    { id: 'swift', name: 'Swift', w: 25, spd: 0.25, color: '#8fe0ff', desc: '+25% attack speed' },
    { id: 'brutal', name: 'Brutal', w: 18, dmg: 0.35, color: '#ff8a3d', desc: '+35% damage' },
    { id: 'fiery', name: 'Fiery', w: 10, dmg: 0.1, splash: 0.35, color: '#ff5a2a', desc: '+10% damage, hits splash fire on nearby enemies' },
    { id: 'vampiric', name: 'Vampiric', w: 5, dmg: 0.1, steal: 0.06, color: '#ff3d6b', desc: '+10% damage, heals 6% of damage dealt' },
    { id: 'godly', name: 'Godly', w: 2, dmg: 0.8, spd: 0.15, color: '#ffe066', desc: '+80% damage and +15% attack speed' },
  ],
  armor: [
    { id: 'sturdy', name: 'Sturdy', w: 40, hp: 0.15, color: '#cfe3f0', desc: '+15% health' },
    { id: 'regen', name: 'Regenerating', w: 25, regen: 0.02, color: '#52d273', desc: 'Heals 2% health per second, even in combat' },
    { id: 'fortified', name: 'Fortified', w: 18, hp: 0.35, color: '#4aa3ff', desc: '+35% health' },
    { id: 'thorny', name: 'Thorny', w: 10, hp: 0.1, thorns: 0.3, color: '#3f8f3a', desc: '+10% health, reflects 30% of damage taken' },
    { id: 'evasive', name: 'Evasive', w: 5, hp: 0.1, dodge: 0.15, color: '#b36bff', desc: '+10% health, 15% chance to dodge' },
    { id: 'godly', name: 'Godly', w: 2, hp: 0.8, regen: 0.01, color: '#ffe066', desc: '+80% health and 1% regen' },
  ],
};
Object.assign(SKILLS, {
  chocolate: { name: 'Chocolate Power', cd: 45, dur: 12, color: 0x8a5a2e, desc: 'Troops heal 6% of their health every second for 12s' },
  cupid:     { name: 'Cupid Arrow',     cd: 55, dur: 6,  color: 0xff6fd8, desc: 'Charms every enemy nearby so they stop attacking for 6s' },
  phoenix:   { name: 'Phoenix Revive',  cd: 90, dur: 0,  color: 0xff6a2a, desc: 'Instantly revives every fallen troop at your side' },
  raptor:    { name: 'Raptor Speed',    cd: 40, dur: 12, color: 0x52d273, desc: 'You and your troops move twice as fast for 12s' },
  minotaur:  { name: "Minotaur's Rage", cd: 70, dur: 12, color: 0xb5652a, desc: 'Troops deal 3x damage for 12s' },
});
Object.assign(CODES, { FORGOTTEN: { key: { ancient_fragment: 5 } }, MAGICFOREST: { res: { fairy_wing: 2, dark_branch: 2 }, item: 'gnome_hat' } });
Object.assign(POTIONS, {});
const RECIPES = [
  { id: 'ancient_fragment', name: 'Ancient Fragment', gold: 50000, need: { mummy_cloth: 3, scorpion_tail: 2 } },
  { id: 'sun_fragment', name: 'Sun Fragment', gold: 2e6, need: { relic: 6, sand: 30 }, key: { ancient_fragment: 3 } },
  { id: 'moon_fragment', name: 'Moon Fragment', gold: 2e6, need: { scale: 6, pearl: 10 }, key: { ancient_fragment: 3 } },
  { id: 'spider_summon', name: 'Spider Queen Summon', gold: 5e6, need: { silk: 15, mushroom: 10 } },
];
// Dispensers: free gold every 5 minutes in each area
const DISPENSERS = [
  { zone: 0, x: 14, z: 2, gold: 500 }, { zone: 1, x: 114, z: -14, gold: 4000 }, { zone: 2, x: 194, z: -14, gold: 20000 },
  { zone: 3, x: 274, z: -14, gold: 80000 }, { zone: 4, x: 354, z: -14, gold: 300000 }, { zone: 5, x: 124, z: 70, gold: 1.5e6 },
  { zone: 6, x: 276, z: 70, gold: 5e6 }, { zone: 7, x: 358, z: 70, gold: 15e6 },
];
const DISPENSER_CD = 300;
// Altars that summon bosses with key items
const ALTARS = [
  { id: 'web', name: 'Web Altar', x: 170, z: 112, boss: 'spiderqueen', need: { spider_summon: 1 }, color: 0x8a3fd8 },
  { id: 'throne', name: 'Sun & Moon Throne', x: 322, z: 112, boss: 'worldeater', need: { sun_fragment: 1, moon_fragment: 1 }, color: 0xffb000,
    alt: { boss: 'primalworldeater', need: { sun_fragment: 1, moon_fragment: 1, primal_core: 1 } } },
  { id: 'labyrinth', name: 'Labyrinth Gate', x: 404, z: 112, boss: 'minotaur', need: Object.fromEntries(GEMS.map((g) => [g, 1])), color: 0xb5652a },
];
// Titles shown above your head
const TITLES = [
  { id: 'recruit', name: 'Recruit', how: 'Start the game', ok: () => true },
  { id: 'lumberjack', name: 'Lumberjack', how: 'Chop 100 trees', ok: () => (S.counts.tree || 0) + (S.counts.bigtree || 0) >= 100 },
  { id: 'golem', name: 'Golem Smasher', how: 'Defeat the Golden Golem', ok: () => S.bossesDown.goldengolem },
  { id: 'commander', name: 'Commander', how: 'Own 20 units', ok: () => soldiers.length >= 20 },
  { id: 'sand', name: 'Sand King', how: 'Defeat the Lord of Sands', ok: () => S.bossesDown.lordofsands },
  { id: 'shark', name: 'Shark Hunter', how: 'Defeat Sir Shark', ok: () => S.bossesDown.sirshark },
  { id: 'general', name: 'General', how: 'Own 40 units', ok: () => soldiers.length >= 40 },
  { id: 'mushy', name: "Mushy's Friend", how: 'Help Mushy 10 times', ok: () => S.mushy.lvl >= 10 },
  { id: 'enchanter', name: 'Enchanter', how: 'Get a Godly enchant', ok: () => Object.values(S.ench).includes('godly') },
  { id: 'eater', name: 'World Eater', how: 'Defeat the World Eater', ok: () => S.bossesDown.worldeater },
  { id: 'legend', name: 'Legend', how: 'Defeat the Minotaur', ok: () => S.bossesDown.minotaur },
  { id: 'winner', name: 'Winner', how: 'Get a Winner Token', ok: () => (S.items.winner_token || 0) > 0 },
];
const MUSHY_TARGETS = ['mushroomman', 'cavespider', 'glowshroom', 'spiderweb'];
const LEADERBOARD = [['ShadowKnight77', 412], ['xXBuilderXx', 298], ['NoobSlayer', 205], ['PixelPanda', 151], ['MushyFan2012', 96], ['GoldRushGuy', 61], ['TinyTim', 33]];

// ------------------------------------------------------- V5 EXPANSION ---
// Four new main areas east of Atlantis, plus the Mine (raids) north of the Mountains
ZONES[0].x0 = -86;
ZONES.push(
  { id: 'wisebird', name: 'Wise Bird Lands', x0: 420, x1: 500, z0: -44, z1: 44, ground: 0xcfe3a8, sky: 0xbfe6ff, sub: 'Floating islands, Harpies, the Wise Bird and the Phoenix', fog: [70, 170] },
  { id: 'soul',     name: 'Soul Land',       x0: 500, x1: 580, z0: -44, z1: 44, ground: 0x3d3a5a, sky: 0x241f3a, sub: 'Lost Souls wander here. The Ghost King and Ghost Pharaoh rule', fog: [22, 105] },
  { id: 'jungle',   name: 'Jungle',          x0: 580, x1: 660, z0: -44, z1: 44, ground: 0x3f8f3a, sky: 0x7fbf8a, sub: 'Raptors, tribes and Lord Rex. Beat him to reach the Arctic', fog: [35, 130] },
  { id: 'arctic',   name: 'Arctic',          x0: 660, x1: 740, z0: -44, z1: 44, ground: 0xeef6ff, sky: 0xcfe0f0, sub: 'Yetis, THE Penguin and the Frost Giant, the endgame boss', fog: [30, 120] },
  { id: 'mine',     name: 'The Mine',        x0: 194, x1: 254, z0: 57, z1: 125, ground: 0x4a4440, sky: 0x2a2622, sub: 'Start a Mine Raid and survive the waves', annex: true, fog: [25, 110] },
);
ZONES[4].fog = [25, 115]; ZONES[5].fog = [25, 115]; ZONES[7].fog = [25, 115]; ZONES[6].fog = [45, 140];
GATES.push({ x: 420, zone: 8, req: 45 }, { x: 500, zone: 9, req: 55 }, { x: 580, zone: 10, req: 65 }, { x: 660, zone: 11, req: 75, boss: 'jungleking' });
ANNEX_GATES.push({ zone: 12, x: 224, z: 50, req: { units: 20 }, rebirthReq: 1, text: 'The Mine: 20 Units + 1 Rebirth' });
const MAX_PLOTS = 20, BASE_PLOTS = 10;
const plotPrice = (owned) => Math.round(250000 * Math.pow(2.6, owned - BASE_PLOTS));
const levelPrice = (b) => Math.round(bXpNeed(b.level) * 40 * Math.pow(1.35, b.level) * (1 + TROOPS[b.type].zone));

Object.assign(RES, {
  feather: { name: 'Wise Feather', value: 60000, color: 0xf2e6c8 }, sky_shard: { name: 'Sky Shard', value: 90000, color: 0x8fe0ff },
  soul_dust: { name: 'Soul Dust', value: 150000, color: 0x9a8fd8 }, soul_gem: { name: 'Soul Gem', value: 240000, color: 0x5affd8 },
  jungle_vine: { name: 'Jungle Vine', value: 350000, color: 0x3f9a3a }, bamboo: { name: 'Bamboo', value: 500000, color: 0xb5c84a },
  ice: { name: 'Arctic Ice', value: 800000, color: 0xcfefff }, frost_ore: { name: 'Frost Ore', value: 1200000, color: 0x5ab4ff },
  shell: { name: 'Sea Shell', value: 5000, color: 0xffd0c0 },
});
// late game tiers
for (const t of [
  { zone: 8, pre: 'Sky', k: 70, cost: 800e6, color: 0x8fe0ff },
  { zone: 9, pre: 'Soul', k: 150, cost: 4e9, color: 0x9a8fd8 },
  { zone: 10, pre: 'Jungle', k: 320, cost: 20e9, color: 0x3f9a3a },
  { zone: 11, pre: 'Frost', k: 700, cost: 100e9, color: 0x5ab4ff },
]) {
  for (const [cls, base] of Object.entries(CLASS_BASE)) {
    const id = `${t.pre.toLowerCase()}_${cls}`;
    ITEMS[id] = { id, name: `${t.pre} ${CLS_WORD[cls]}`, type: 'weapon', cls, min: Math.round(base * t.k * 0.9), max: Math.round(base * t.k * 1.1), cost: t.cost * (cls === 'sword' || cls === 'bow' ? 1 : 1.5), zone: t.zone, color: t.color };
  }
  const gid = `${t.pre.toLowerCase()}_glove`;
  ITEMS[gid] = { id: gid, name: `${t.pre} Absorber Glove`, type: 'weapon', cls: 'glove', min: 1.8 + t.k / 6, max: 1.8 + t.k / 6, cost: t.cost * 2, zone: t.zone, color: t.color };
  const aid = `${t.pre.toLowerCase()}_armor`;
  ITEMS[aid] = { id: aid, name: `${t.pre} Armor`, type: 'armor', hp: Math.round(1200000 * t.k / 30 * 1.2), cost: t.cost * 1.2, zone: t.zone, color: t.color };
}
addItems('weapon', 'sword', [['bird_talon', 'Wise Talon', 260000, 300000, 0, 8, 0xf2e6c8], ['soul_reaper', 'Soul Reaper', 560000, 640000, 0, 9, 0x5affd8], ['king_fang', 'Jungle King Fang', 1.2e6, 1.4e6, 0, 10, 0x6fbf3a], ['frost_blade', 'Frost Giant Blade', 2.6e6, 3e6, 0, 11, 0x9fdcff], ['meteor_sword', 'Meteor Sword', 3000, 3600, 0, 4, 0xff6a2a], ['miner_pick', "Miner's Pickaxe", 900, 1100, 0, 2, 0xffb000]]);
addItems('weapon', 'bow', [['harpy_bow', 'Harpy Bow', 240000, 280000, 0, 8, 0xffb3f0], ['raptor_bow', 'Raptor Bow', 1.1e6, 1.3e6, 0, 10, 0x3f9a3a]]);
addItems('weapon', 'staff', [['soul_staff', 'Soul Staff', 1.3e6, 1.5e6, 0, 9, 0x9a8fd8], ['ice_staff', 'Blizzard Staff', 6e6, 7e6, 0, 11, 0xcfefff]]);
addItems('armor', null, [['owl_armor', 'Wise Owl Armor', 9e6, 0, 0, 8, 0xf2e6c8], ['soul_armor', 'Soul King Armor', 20e6, 0, 0, 9, 0x5affd8], ['trex_armor', 'T-Rex Hide', 45e6, 0, 0, 10, 0x6fbf3a], ['frost_armor', 'Frost Giant Armor', 100e6, 0, 0, 11, 0x9fdcff], ['shell_armor', 'Shell Armor', 60000, 0, 0, 2, 0xffd0c0]]);
addItems('bag', null, [['sky_bag', 'Cloud Bag', 25e6, 0, 1e9, 8, 0x8fe0ff], ['frost_bag', 'Frost Bag', 200e6, 0, 60e9, 11, 0x5ab4ff]]);
addItems('wand', null, [['sky_wand', 'Sky Wand', 70, 0, 1.2e9, 8, 0x8fe0ff], ['soul_wand', 'Soul Wand', 120, 0, 8e9, 9, 0x9a8fd8], ['frost_wand', 'Frost Wand', 250, 0, 150e9, 11, 0x5ab4ff]]);
Object.assign(KEY, {
  winter_core: { name: 'Winter Core', color: 0x9fdcff, desc: 'Dropped by the Frost Giant. Proof you beat the Arctic' },
});
Object.assign(CODES, { LOSTSOULS: { pot: { luck: 2 }, key: { ancient_fragment: 2 } }, ARCTIC: { gold: 50000 }, JUNGLESECRET: { pot: { exp: 2, mat: 1 } }, MINERAID: { gold: 20000 } });

addItems('weapon', 'sword', [
  ['ironwood_saber', 'Ironwood Saber', 220, 280, 52000, 2, 0x6f8f61],
  ['sun_saber', 'Sun Saber', 1400, 1750, 0, 3, 0xffb23e],
  ['tidal_edge', 'Tidal Edge', 3800, 4500, 0, 4, 0x47dbe7],
  ['starfall_blade', 'Starfall Blade', 1.1e6, 1.4e6, 0, 8, 0x9ad8ff],
  ['void_reaper', 'Void Reaper', 8e6, 1e7, 0, 9, 0x8b65d6],
]);
addItems('armor', null, [
  ['woodland_armor', 'Woodland Armor', 180, 0, 900, 0, 0x5fa447],
  ['river_armor', 'River Guard Armor', 650, 0, 12000, 1, 0x4aa3ff],
  ['granite_armor', 'Granite Armor', 2400, 0, 90000, 2, 0x858a92],
  ['sun_armor', 'Sunforged Armor', 9500, 0, 600000, 3, 0xe9bd58],
  ['tidal_armor', 'Tidal Armor', 30000, 0, 2500000, 4, 0x46cad7],
  ['cloud_armor', 'Cloud Armor', 90000, 0, 0, 8, 0xccecff],
  ['void_armor', 'Void Armor', 350000, 0, 0, 9, 0x6f55a8],
  ['raptor_armor', 'Raptor Armor', 800000, 0, 0, 10, 0x4b8b3c],
  ['frostmail', 'Frostmail', 2e6, 0, 5e9, 11, 0x9edfff],
  ['golden_commander', 'Golden Commander Armor', 4.5e6, 0, 0, 8, 0xffc83d],
  ['soulplate', 'Soulplate', 7e6, 0, 0, 9, 0x7b6fd0],
  ['primal_hide', 'Primal Hide', 1.5e7, 0, 0, 10, 0x6aa044],
  ['worldeater_armor', 'World Eater Armor', 4e7, 0, 0, 8, 0xd9a4ff],
]);

TITLES.push(
  { id: 'birdwatcher', name: 'Birdwatcher', how: 'Defeat the Wise Bird', ok: () => S.bossesDown.wisebird },
  { id: 'soulkeeper', name: 'Soul Keeper', how: 'Defeat the Ghost King', ok: () => S.bossesDown.soulking },
  { id: 'kingslayer', name: 'Kingslayer', how: 'Defeat Lord Rex', ok: () => S.bossesDown.jungleking },
  { id: 'frost', name: 'Frostbringer', how: 'Defeat the Frost Giant', ok: () => S.bossesDown.frostgiant },
  { id: 'warlord', name: 'Warlord', how: 'Own 75 units', ok: () => soldiers.length >= 75 },
  { id: 'raider', name: 'Raider', how: 'Clear a level 5 Mine Raid', ok: () => (S.raidBest || 0) >= 5 },
  { id: 'shells', name: 'Shell Hunter', how: 'Find all 25 shells', ok: () => Object.keys(S.shells).length >= SHELLS.length },
  { id: 'banker', name: 'Banker', how: 'Earn 1M interest at the Bank', ok: () => (S.bankEarned || 0) >= 1e6 },
  { id: 'stargazer', name: 'Stargazer', how: 'Break 5 meteorites', ok: () => (S.counts.meteor || 0) >= 5 },
);
// playtime gifts (claim from the Gifts button)
const GIFTS = [
  { t: 300, label: '5 min', give: { gold: 1000 } }, { t: 900, label: '15 min', give: { pot: { luck: 1 } } },
  { t: 1800, label: '30 min', give: { pot: { gold: 1, exp: 1 } } }, { t: 3600, label: '1 hour', give: { gold: 250000, key: { ancient_fragment: 2 } } },
  { t: 5400, label: '1.5 hours', give: { pot: { luck: 2, mat: 2 } } }, { t: 7200, label: '2 hours', give: { gold: 5e6, item: 'crown_hat' } },
];
// Shell Hunt: 20 shells hidden around the map
const SHELLS = [
  [-60, -40], [-80, 20], [40, 40], [92, -40], [118, 40], [176, -42], [210, 40], [250, -42], [296, 41], [336, -40],
  [365, 38], [412, -10], [130, 120], [300, 122], [415, 120], [470, 40], [540, -40], [620, 41], [700, -40], [735, 30],
];
const SHELL_REWARDS = { 5: { gold: 10000, pot: { luck: 1 } }, 10: { gold: 200000, item: 'shell_armor' }, 15: { gold: 5e6, key: { ancient_fragment: 3 } }, 20: { gold: 100e6, pot: { gold: 3, luck: 3 } } };
// Mine raid levels
const RAID_LEVELS = [
  { n: 1, mul: 1, units: 20 }, { n: 2, mul: 40, units: 30 }, { n: 3, mul: 1500, units: 40 }, { n: 4, mul: 60000, units: 55 }, { n: 5, mul: 2e6, units: 70 },
];
const RAID_CD = 300, RAID_WAVES = 5;
DISPENSERS.push({ zone: 8, x: 434, z: -14, gold: 50e6 }, { zone: 9, x: 514, z: -14, gold: 150e6 }, { zone: 10, x: 594, z: -14, gold: 400e6 }, { zone: 11, x: 674, z: -14, gold: 1e9 }, { zone: 12, x: 206, z: 70, gold: 3e6 });
DISPENSERS.push({ zone: 14, x: 754, z: -14, gold: 3e9 }, { zone: 15, x: 834, z: 14, gold: 8e9 }, { zone: 16, x: 914, z: -14, gold: 15e9 }, { zone: 17, x: 994, z: 14, gold: 30e9 }, { zone: 18, x: 1074, z: -14, gold: 60e9 }, { zone: 19, x: 1154, z: 14, gold: 125e9 });

// ------------------------------------------------------- V6 EXPANSION ---
// Badges (named after the real game's badges)
const BADGES = [
  { id: 'welcome', name: 'Welcome', how: 'Join the game', ok: () => true },
  { id: 'b_river', name: 'Riverlands', how: 'Unlock the Riverlands', ok: () => zoneUnlocked(1) },
  { id: 'b_mount', name: 'Mountains', how: 'Unlock the Mountains', ok: () => zoneUnlocked(2) },
  { id: 'b_desert', name: 'Desert', how: 'Unlock the Desert', ok: () => zoneUnlocked(3) },
  { id: 'b_atl', name: 'Atlantis', how: 'Unlock Atlantis', ok: () => zoneUnlocked(4) },
  { id: 'b_bird', name: 'Wise Bird Lands', how: 'Unlock the Wise Bird Lands', ok: () => zoneUnlocked(8) },
  { id: 'b_soul', name: 'Soul Land', how: 'Unlock Soul Land', ok: () => zoneUnlocked(9) },
  { id: 'b_jungle', name: 'Jungle', how: 'Unlock the Jungle', ok: () => zoneUnlocked(10) },
  { id: 'b_arctic', name: 'Arctic', how: 'Unlock the Arctic', ok: () => zoneUnlocked(11) },
  { id: 'b_egg', name: 'Golden Egg', how: 'Hatch a Golden Egg', ok: () => (S.hatched.golden || 0) > 0 },
  { id: 'b_war', name: 'War Hero', how: 'Capture 5 war flags', ok: () => (S.war.caps || 0) >= 5 },
];
const BADGE_BOSSES = ['goldengolem', 'whiteflower', 'emeraldgolem', 'pharaoh', 'lordofsands', 'sirshark', 'sapphiregolem', 'wisetree', 'spiderqueen', 'worldeater', 'primalworldeater', 'mutantgnome', 'minotaur', 'phoenixboss', 'ghostpharaoh', 'soulking', 'jungleking', 'ufo', 'roguealien', 'thepenguin', 'wisebird', 'frostgiant', 'minelord'];

// Eggs & pets (event eggs from the original, hatched with gold)
const RARITY = { common: { name: 'Common', color: '#cfd6e6', w: 60 }, rare: { name: 'Rare', color: '#4aa3ff', w: 28 }, epic: { name: 'Epic', color: '#b36bff', w: 10 }, legendary: { name: 'Legendary', color: '#ffc83d', w: 2 } };
const EGGS = [
  { id: 'golden', name: 'Golden Egg', zone: 0, cost: 2500, color: 0xffc83d, pets: [['chick', 'Chick', 'common', 0xffe066, { gold: 0.05 }], ['piglet', 'Piglet', 'common', 0xf6a5b3, { hp: 0.05 }], ['goldbunny', 'Gold Bunny', 'rare', 0xffd84a, { gold: 0.12 }], ['golemling', 'Golemling', 'epic', 0x9a9aa0, { hp: 0.15, dmg: 0.08 }], ['kinggolem', 'Golden King', 'legendary', 0xffb000, { gold: 0.3, dmg: 0.15 }]] },
  { id: 'emerald', name: 'Emerald Egg', zone: 2, cost: 150000, color: 0x3ddc84, pets: [['frog', 'Frog', 'common', 0x52d273, { luck: 0.05 }], ['rockpup', 'Rock Pup', 'common', 0x8a8f80, { hp: 0.08 }], ['emeraldfox', 'Emerald Fox', 'rare', 0x3ddc84, { dmg: 0.1 }], ['ogrebaby', 'Baby Ogre', 'epic', 0x7a9a4a, { hp: 0.2, dmg: 0.1 }], ['emeralddragon', 'Emerald Dragon', 'legendary', 0x1fbf6a, { dmg: 0.3, luck: 0.15 }]] },
  { id: 'bone', name: 'Bone Egg', zone: 3, cost: 2e6, color: 0xeee6d0, pets: [['skull', 'Skull Pet', 'common', 0xeee6d0, { dmg: 0.08 }], ['scorpling', 'Scorpling', 'common', 0xc9853a, { dmg: 0.06, gold: 0.04 }], ['mummycat', 'Mummy Cat', 'rare', 0xd8cfb0, { luck: 0.12 }], ['bonewolf', 'Bone Wolf', 'epic', 0xffffff, { dmg: 0.22 }], ['sandking', 'Sand King', 'legendary', 0xd9a14a, { gold: 0.35, dmg: 0.2 }]] },
  { id: 'sapphire', name: 'Sapphire Egg', zone: 4, cost: 20e6, color: 0x4a7bff, pets: [['fish', 'Goldfish', 'common', 0xff8a3d, { gold: 0.08 }], ['crab', 'Crab', 'common', 0xe0353b, { hp: 0.1 }], ['turtle', 'Sea Turtle', 'rare', 0x3f9a6a, { hp: 0.2 }], ['shark', 'Baby Shark', 'epic', 0x6f8fa8, { dmg: 0.28 }], ['kraken', 'Kraken', 'legendary', 0x8a3fd8, { dmg: 0.4, hp: 0.25 }]] },
  { id: 'mushroom', name: 'Mushroom Egg', zone: 5, cost: 200e6, color: 0xff5a8a, pets: [['shroom', 'Shroomy', 'common', 0xff5a8a, { luck: 0.1 }], ['spiderling', 'Spiderling', 'common', 0x2a1f3a, { dmg: 0.12 }], ['fairy', 'Fairy', 'rare', 0xffb3f0, { luck: 0.2, gold: 0.1 }], ['wisesprout', 'Wise Sprout', 'epic', 0x6fae4a, { hp: 0.3, dmg: 0.2 }], ['queenspider', 'Spider Queen', 'legendary', 0x8a3fd8, { dmg: 0.5, luck: 0.2 }]] },
  { id: 'worldeater', name: 'World Eater Egg', zone: 6, cost: 2e9, color: 0xff8a3d, pets: [['snake', 'Snake', 'common', 0x5ac85a, { dmg: 0.15 }], ['sunling', 'Sunling', 'common', 0xffb000, { gold: 0.15 }], ['moonling', 'Moonling', 'rare', 0x9fb4ff, { luck: 0.25 }], ['wyrm', 'Wyrm', 'epic', 0xff8a3d, { dmg: 0.35, hp: 0.2 }], ['minieater', 'Mini World Eater', 'legendary', 0xff3d6b, { dmg: 0.6, gold: 0.3 }]] },
  { id: 'carrot', name: 'Carrot Egg', zone: 8, cost: 20e9, color: 0xff8a2a, pets: [['bunny', 'Bunny', 'common', 0xffffff, { gold: 0.2 }], ['owlet', 'Owlet', 'common', 0x8a6a4a, { luck: 0.15 }], ['harpychick', 'Harpy Chick', 'rare', 0xb5e0ff, { dmg: 0.3 }], ['phoenixchick', 'Phoenix Chick', 'epic', 0xff6a2a, { dmg: 0.45, hp: 0.3 }], ['wisebirdpet', 'Wise Bird', 'legendary', 0xd8c8a0, { dmg: 0.7, luck: 0.3 }]] },
  { id: 'chocolate', name: 'Chocolate Egg', zone: 10, cost: 300e9, color: 0x8a5a2e, pets: [['raptorpup', 'Raptor Pup', 'common', 0x5a9a3a, { dmg: 0.25 }], ['ghost', 'Ghosty', 'common', 0xcfc8ff, { luck: 0.2 }], ['penguin', 'Penguin', 'rare', 0x1b1b2a, { hp: 0.4 }], ['yeti', 'Baby Yeti', 'epic', 0xf2f6ff, { dmg: 0.6, hp: 0.4 }], ['rexpet', 'Lord Rex Jr', 'legendary', 0x4f8a2a, { dmg: 1, gold: 0.4 }]] },
];
EGGS.push(
  { id: 'magma', name: 'Magma Egg', zone: 14, cost: 4e9, color: 0xff5a24, pets: [['emberpup','Ember Pup','common',0xff8a3d,{dmg:0.25}],['moltenbat','Molten Bat','common',0xd9352b,{speed:0.12}],['lavadrake','Lava Drake','rare',0xffb52e,{dmg:0.45}],['magmashell','Magma Shell','epic',0xc83f22,{hp:0.55}],['infernofamiliar','Inferno Familiar','legendary',0xff5a24,{dmg:0.9,gold:0.35}]] },
  { id: 'alien', name: 'Alien Egg', zone: 15, cost: 20e9, color: 0x7affb0, pets: [['blob','Green Blob','common',0x7affb0,{luck:0.22}],['drone','Plasma Drone','common',0x39e6ff,{dmg:0.3}],['xeno','Xeno Hound','rare',0x53d7a0,{hp:0.45}],['ufolet','Mini UFO','epic',0x9fb4ff,{dmg:0.65,luck:0.2}],['overlordpet','Overlord Core','legendary',0x7affb0,{dmg:1.1,gold:0.45}]] },
  { id: 'star', name: 'Star Egg', zone: 19, cost: 160e9, color: 0xd08cff, pets: [['starpuff','Star Puff','common',0xffe8a6,{gold:0.3}],['orbitbug','Orbit Bug','common',0xd08cff,{luck:0.3}],['cosmocat','Cosmo Cat','rare',0x9fb4ff,{dmg:0.55}],['nebulafox','Nebula Fox','epic',0x7ce8ff,{hp:0.7,dmg:0.5}],['starwyrm','Star Wyrm','legendary',0xffe8a6,{dmg:1.3,gold:0.55}]] },
);
const PET_BY_ID = {}; for (const e of EGGS) for (const [id, name, rar, color, bonus] of e.pets) PET_BY_ID[id] = { id, name, rar, color, bonus, egg: e.id };
const PET_TIERS = [
  { name: '', multiplier: 1, scale: 1 },
  { name: 'Big', multiplier: 3, scale: 1.5 },
  { name: 'Colossal', multiplier: 9, scale: 2.1 },
];

function petTier(pet) {
  return Math.max(0, Math.min(PET_TIERS.length - 1, Math.floor(Number(pet.tier) || 0)));
}

function petTierName(tier) {
  return PET_TIERS[tier]?.name || '';
}

const MAX_PETS = 60;
// Scientist research (permanent upgrades bought with gold)
const RESEARCH = [
  { id: 'dmg', name: 'Sharper Steel', desc: '+10% army damage per level', per: 0.1, base: 5000, max: 15 },
  { id: 'hp', name: 'Tough Armor', desc: '+10% troop health per level', per: 0.1, base: 5000, max: 15 },
  { id: 'gold', name: 'Gold Refinery', desc: '+8% gold from everything per level', per: 0.08, base: 8000, max: 15 },
  { id: 'bag', name: 'Bigger Pockets', desc: '+15% bag space per level', per: 0.15, base: 3000, max: 10 },
  { id: 'speed', name: 'Running Shoes', desc: '+4% walk speed per level', per: 0.04, base: 2000, max: 10 },
  { id: 'respawn', name: 'Fast Medics', desc: 'Troops respawn 8% faster per level', per: 0.08, base: 10000, max: 8 },
  { id: 'luck', name: 'Lucky Charm', desc: '+5% luck per level', per: 0.05, base: 20000, max: 10 },
];
const researchCost = (r) => Math.round(r.base * Math.pow(4.2, S.research[r.id] || 0));
const resV = (id) => (S.research[id] || 0) * RESEARCH.find((r) => r.id === id).per;
// War: three factions fight over flags in every main area
const FACTIONS = [
  { id: 'uran', name: 'Planet Uran', color: 0x9f7bff, css: '#9f7bff' },
  { id: 'dino', name: 'Dinosaurs', color: 0x52d273, css: '#52d273' },
  { id: 'united', name: 'United Lands', color: 0x4aa3ff, css: '#4aa3ff' },
];
const WAR_FLAGS = [[60, -26, 0], [150, -28, 1], [222, -26, 2], [290, -10, 3], [366, 10, 4], [462, -8, 8], [540, 12, 9], [612, 12, 10], [700, -8, 11]];
WAR_FLAGS.push([772, 18, 14], [852, -18, 15], [932, 16, 16], [1012, -16, 17], [1092, 18, 18], [1172, -18, 19]);
Object.assign(SKILLS, {
  energy: { name: 'Energy Blast', cd: 50, dur: 0, color: 0x39e6ff, desc: 'Blasts every enemy near you for 25x your army average damage' },
});
Object.assign(KEY, { alien_core: { name: 'Alien Core', color: 0x7affb0, desc: 'Dropped by UFOs. The Scientist pays well for it' } });
addItems('weapon', 'energy', [['alien_blaster', 'Alien Blaster', 0, 0, 0, 4, 0x7affb0]]);
ITEMS.alien_blaster.min = 9000; ITEMS.alien_blaster.max = 11000;
addItems('weapon', 'sword', [['penguin_blade', "THE Penguin's Blade", 3.2e6, 3.8e6, 0, 11, 0x2a2a4a], ['phoenix_sword', 'Phoenix Sword', 300000, 360000, 0, 8, 0xff6a2a], ['ghost_scythe', 'Ghost Pharaoh Scythe', 650000, 760000, 0, 9, 0xd8cfb0]]);
addItems('armor', null, [['phoenix_armor', 'Phoenix Armor', 11e6, 0, 0, 8, 0xff6a2a], ['penguin_armor', 'Penguin Suit', 110e6, 0, 0, 11, 0x2a2a4a], ['war_armor', 'War Banner Armor', 2e6, 0, 0, 4, 0xe0353b]]);
TITLES.push(
  { id: 'petlover', name: 'Pet Lover', how: 'Hatch 25 pets', ok: () => (S.hatchCount || 0) >= 25 },
  { id: 'scientist', name: 'Scientist', how: 'Buy 25 research levels', ok: () => Object.values(S.research).reduce((a, b) => a + b, 0) >= 25 },
  { id: 'alienhunter', name: 'Alien Hunter', how: 'Defeat a UFO', ok: () => S.bossesDown.ufo },
  { id: 'warlord2', name: 'Conqueror', how: 'Hold every war flag at once', ok: () => S.war.side && S.war.flags.every((f) => f === S.war.side) },
  { id: 'badges', name: 'Badge Collector', how: 'Earn 25 badges', ok: () => Object.keys(S.badges).length >= 25 },
);
Object.assign(CODES, { EGGHUNT: { gold: 5000 }, URANHQ: { key: { alien_core: 1 } }, WAR: { pot: { gold: 2 } } });

// ------------------------------------------------------- V7: CRAB CAVE, RUBY GOLEM ---
ZONES.push({ id: 'crabcave', name: 'Crab Cave', x0: 506, x1: 574, z0: 57, z1: 122, ground: 0x3c3a48, sky: 0x141a28, sub: 'Hermit Crabs, Crab Lords and King Crab. 5 more shells hide here', annex: true, fog: [20, 95] });
// Keep array indexes aligned with the numeric zone IDs used by troops,
// enemies, gates, posts, and other game data.
const ZONE_ORDER = [
  'forest',
  'riverlands',
  'mountains',
  'desert',
  'atlantis',
  'mushroom',
  'ouroboros',
  'magic',
  'wisebird',
  'soul',
  'jungle',
  'arctic',
  'mine',
  'crabcave',
  'volcano',
  'alienrealm',
  'deepforest',
  'shocked',
  'uranian',
  'celestial',
];

const zonesById = new Map(ZONES.map((zone) => [zone.id, zone]));

if (
  ZONE_ORDER.length !== ZONES.length ||
  ZONE_ORDER.some((id) => !zonesById.has(id))
) {
  throw new Error('Zone definitions do not match ZONE_ORDER');
}

ZONES.splice(
  0,
  ZONES.length,
  ...ZONE_ORDER.map((id) => zonesById.get(id))
);

ANNEX_GATES.push({ zone: 13, x: 540, z: 50, req: { units: 55 }, rebirthReq: 2, text: 'Crab Cave: 55 Units + 2 Rebirths' });
Object.assign(RES, { crab_shell: { name: 'Crab Shell', value: 260000, color: 0xd9552b }, cave_pearl: { name: 'Cave Pearl', value: 420000, color: 0xe8f0ff } });
addItems('weapon', 'sword', [['crab_claw', 'King Crab Claw', 720000, 840000, 0, 9, 0xd9352b]]);
addItems('armor', null, [['crab_armor', 'King Crab Shell Armor', 30e6, 0, 0, 9, 0xd9552b]]);
SHELLS.push([516, 70], [566, 82], [522, 112], [560, 116], [540, 96]);
SHELL_REWARDS[25] = { gold: 2e9, item: 'crab_armor', pot: { gold: 5, luck: 5 } };
SHELLS.push([772, -40], [852, 36], [932, -38], [1012, 38], [1092, -40], [1172, 36]);
SHELL_REWARDS[30] = { gold: 25e9, pot: { gold: 8, luck: 8 }, key: { ancient_fragment: 8 } };
SHELL_REWARDS[31] = { gold: 100e9, item: 'astral_armor', pot: { gold: 15, luck: 15 } };
// Ruby Golem quest chain (Update 18: titles + Ruby Golem quests)
const RUBY_QUESTS = [
  { t: 'kills', n: 50, text: 'Defeat 50 enemies' },
  { t: 'units', n: 15, text: 'Own 15 units' },
  { t: 'boss', id: 'goldengolem', text: 'Defeat the Golden Golem' },
  { t: 'earn', n: 1e6, text: 'Earn 1M gold' },
  { t: 'hatch', n: 5, text: 'Hatch 5 eggs' },
  { t: 'boss', id: 'lordofsands', text: 'Defeat the Lord of Sands' },
  { t: 'kills', n: 400, text: 'Defeat 400 enemies' },
  { t: 'research', n: 10, text: 'Reach 10 research levels at the Scientist' },
  { t: 'caps', n: 3, text: 'Capture 3 war flags' },
  { t: 'boss', id: 'sirshark', text: 'Defeat Sir Shark' },
  { t: 'units', n: 50, text: 'Own 50 units' },
  { t: 'boss', id: 'kingcrab', text: 'Defeat King Crab in the Crab Cave' },
];
TITLES.push(
  { id: 'ruby1', name: 'Ruby Recruit', how: 'Finish 4 Ruby Golem quests', ok: () => S.ruby.lvl >= 4 },
  { id: 'ruby2', name: 'Ruby Knight', how: 'Finish 8 Ruby Golem quests', ok: () => S.ruby.lvl >= 8 },
  { id: 'ruby3', name: 'Ruby Champion', how: 'Finish all 12 Ruby Golem quests', ok: () => S.ruby.lvl >= 12 },
  { id: 'reborn', name: 'Reborn', how: 'Rebirth once', ok: () => (S.rebirths || 0) >= 1 },
  { id: 'reborn5', name: 'Phoenix Soul', how: 'Rebirth 5 times', ok: () => (S.rebirths || 0) >= 5 },
  { id: 'crab', name: 'Crab Crusher', how: 'Defeat King Crab', ok: () => S.bossesDown.kingcrab },
);
BADGE_BOSSES.push('kingcrab', 'infernotitan', 'ufooverlord', 'ancientent', 'thunderking', 'citadelcommander', 'staremperor');
BADGES.push(
  { id: 'b_volcano', name: 'Volcano', how: 'Unlock Volcano', ok: () => zoneUnlocked(14) },
  { id: 'b_alien', name: 'Alien Realm', how: 'Unlock Alien Realm', ok: () => zoneUnlocked(15) },
  { id: 'b_deep', name: 'Deep Forest', how: 'Unlock Deep Forest', ok: () => zoneUnlocked(16) },
  { id: 'b_shocked', name: 'Shocked Forest', how: 'Unlock Shocked Forest', ok: () => zoneUnlocked(17) },
  { id: 'b_uran', name: 'Uranian Citadel', how: 'Unlock the Uranian Citadel', ok: () => zoneUnlocked(18) },
  { id: 'b_celestial', name: 'Celestial Frontier', how: 'Unlock the Celestial Frontier', ok: () => zoneUnlocked(19) },
);

// ------------------------------------------------------------ HELPERS ---
let seed = 1337;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const rr = (a, b) => a + rnd() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (n) => {
  n = Math.floor(n);
  if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-US');
};
const hasFiniteXZ = (p) =>
  p != null &&
  Number.isFinite(p.x) &&
  Number.isFinite(p.z);

const dist2 = (a, b) => {
  if (!hasFiniteXZ(a) || !hasFiniteXZ(b)) return Infinity;

  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
};

const zoneAt = (x, z = 0) => { if (z > 47) { for (let i = 0; i < ZONES.length; i++) { const Z = ZONES[i]; if (Z.annex && x >= Z.x0 - 8 && x <= Z.x1 + 8) return i; } } let best = 0, bx = -1e9; for (let i = 0; i < ZONES.length; i++) { const Z = ZONES[i]; if (!Z.annex && x >= Z.x0 && Z.x0 > bx) { bx = Z.x0; best = i; } } return best; };
const hex = (c) => '#' + c.toString(16).padStart(6, '0');

// ---------------------------------------------------------- RENDERER ---
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const SKY = new THREE.Color(0x8fd3ff);
scene.background = SKY.clone();
scene.fog = new THREE.Fog(SKY.clone(), 70, 170);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 190);

const hemi = new THREE.HemisphereLight(0xdff3ff, 0x5d7a3a, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d6, 1.9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

const matCache = new Map();
const mat = (color, opts = {}) => {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return matCache.get(key);
};
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(0.5, 12, 8),
  ico: new THREE.IcosahedronGeometry(1, 0),
  dod: new THREE.DodecahedronGeometry(1, 0),
  oct: new THREE.OctahedronGeometry(1, 0),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 7),
};
function part(geo, color, sx, sy, sz, x = 0, y = 0, z = 0, parent, material) {
  const m = new THREE.Mesh(geo, material || mat(color));
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = Math.max(sx, sy, sz) >= 0.3;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

// shared, mutable materials so upgrades recolor the whole army instantly

// ------------------------------------------------------------ MODELS ---
// Roblox-like blocky avatar. Built in "studs" then scaled.
function makeAvatar({ shirt, pants, skin = 0xffd66b, scale = 1, hat = null, weapon = null, face = true, horns = false, eyes = 0x1b1b1b, armor = false, crown = false, wMat = null, aMat = null, fin = false }) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const s = 0.42 * scale;
  body.scale.setScalar(s);
  const legL = new THREE.Group(); legL.position.set(-0.5, 2, 0); body.add(legL);
  const legR = new THREE.Group(); legR.position.set(0.5, 2, 0); body.add(legR);
  part(G.box, pants, 1, 2, 1, 0, -1, 0, legL);
  part(G.box, pants, 1, 2, 1, 0, -1, 0, legR);
  const torso = part(G.box, shirt, 2, 2, 1, 0, 3, 0, body);
  const armL = new THREE.Group(); armL.position.set(-1.5, 4, 0); body.add(armL);
  const armR = new THREE.Group(); armR.position.set(1.5, 4, 0); body.add(armR);
  part(G.box, skin, 1, 2, 1, 0, -1, 0, armL);
  part(G.box, skin, 1, 2, 1, 0, -1, 0, armR);
  // sleeves
  part(G.box, shirt, 1.05, 0.9, 1.05, 0, -0.45, 0, armL);
  part(G.box, shirt, 1.05, 0.9, 1.05, 0, -0.45, 0, armR);
  const head = part(G.box, skin, 1.25, 1.25, 1.25, 0, 4.65, 0, body);
  if (face) {
    part(G.box, eyes, 0.18, 0.28, 0.05, -0.28, 4.75, 0.63, body);
    part(G.box, eyes, 0.18, 0.28, 0.05, 0.28, 4.75, 0.63, body);
    part(G.box, eyes, 0.5, 0.08, 0.05, 0, 4.38, 0.63, body);
  }
  if (armor) {
    part(G.box, 0, 2.1, 1.3, 1.1, 0, 3.45, 0, body, (aMat || mat(0x6a5a48))); // chest plate
    part(G.box, 0, 1.4, 0.45, 1.4, 0, 5.4, 0, body, (aMat || mat(0x6a5a48))); // helmet top
    part(G.box, 0, 1.4, 0.8, 0.2, 0, 5.0, -0.62, body, (aMat || mat(0x6a5a48)));
  }
  if (hat) part(G.box, hat, 1.45, 0.4, 1.45, 0, 5.45, 0, body);
  if (crown) {
    part(G.box, 0xffc83d, 1.5, 0.45, 1.5, 0, 5.5, 0, body);
    for (const [cx, cz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) part(G.box, 0xffc83d, 0.3, 0.5, 0.3, cx, 5.9, cz, body);
  }
  if (fin) part(G.box, skin, 0.3, 1.6, 1.2, 0, 5.8, -0.2, body);
  if (horns) {
    part(G.box, 0xeeeeee, 0.25, 0.8, 0.25, -0.55, 5.5, 0, body);
    part(G.box, 0xeeeeee, 0.25, 0.8, 0.25, 0.55, 5.5, 0, body);
  }
  let wep = null;
  if (weapon) {
    wep = new THREE.Group();
    wep.position.set(0, -2, 0.3);
    armR.add(wep);
    if (weapon === 'sword') {
      part(G.box, 0x4a3520, 0.25, 0.8, 0.25, 0, 0, 0, wep);
      part(G.box, 0x333333, 0.9, 0.2, 0.3, 0, 0.4, 0, wep);
      part(G.box, 0, 0.3, 2.4, 0.12, 0, 1.7, 0, wep, (wMat || mat(0x8b5a2b))).rotation.y = 0;
      wep.rotation.x = Math.PI / 2;
    } else if (weapon === 'bow') {
      const bow = part(new THREE.TorusGeometry(1.2, 0.12, 5, 12, Math.PI), 0, 1, 1, 1, 0, 0, 0, wep, (wMat || mat(0x8b5a2b)));
      bow.rotation.z = Math.PI / 2;
      part(G.box, 0xeeeeee, 0.04, 2.4, 0.04, 0, 0, 0, wep);
    } else if (weapon === 'staff') {
      part(G.cyl, 0x5a3b1e, 0.2, 3.6, 0.2, 0, 0.8, 0, wep);
      part(G.sph, 0, 0.7, 0.7, 0.7, 0, 2.8, 0, wep, (wMat || mat(0x8b5a2b)));
    } else if (weapon === 'club') {
      part(G.box, 0x5a3b1e, 0.35, 1.2, 0.35, 0, 0, 0, wep);
      part(G.box, 0, 0.9, 1.8, 0.9, 0, 1.4, 0, wep, (wMat || mat(0x8b5a2b)));
      wep.rotation.x = Math.PI / 2;
    } else if (weapon === 'enemyclub') {
      part(G.box, 0x5a3b1e, 0.4, 2.8, 0.4, 0, 1, 0, wep);
      part(G.box, 0x6b4a2b, 0.9, 1.2, 0.9, 0, 2.4, 0, wep);
      wep.rotation.x = Math.PI / 2;
    } else if (weapon === 'snowball') {
      part(G.sph, 0, 0.9, 0.9, 0.9, 0, 0.2, 0, wep, (wMat || mat(0xffffff)));
    } else if (weapon === 'bandage') {
      part(G.box, 0, 0.9, 0.5, 0.9, 0, 0.2, 0, wep, (wMat || mat(0xffffff)));
      part(G.box, 0xff4d4d, 0.5, 0.52, 0.2, 0, 0.2, 0, wep);
    } else if (weapon === 'glove' || weapon === 'energy') {
      part(G.box, 0, 1.25, 1.1, 1.25, 0, 0.1, -0.3, wep, (wMat || mat(0x9a6a3a)));
    } else if (weapon === 'trident') {
      part(G.cyl, 0x2a6f7a, 0.25, 5, 0.25, 0, 1.5, 0, wep);
      for (const tx of [-0.5, 0, 0.5]) part(G.box, 0x4af0e0, 0.18, 1, 0.18, tx, 4.3, 0, wep);
      part(G.box, 0x4af0e0, 1.2, 0.18, 0.18, 0, 3.8, 0, wep);
      wep.rotation.x = Math.PI / 2;
    } else if (weapon === 'dagger') {
      part(G.box, 0xbbbbbb, 0.2, 1.3, 0.1, 0, 0.6, 0, wep);
      wep.rotation.x = Math.PI / 2;
    }
  }
  return { root, body, parts: { legL, legR, armL, armR, head, torso }, height: 5.6 * s, kind: 'biped' };
}
function makeQuad({ color, color2 = color, scale = 1, len = 2.2, h = 1.1, tail = false, snout = false, legH = 0.9, pincers = false, ears = false }) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  body.scale.setScalar(scale);
  part(G.box, color, 1.2, h, len, 0, legH + h / 2, 0, body);
  const head = part(G.box, color2, 1, 0.9, 0.9, 0, legH + h * 0.75, len / 2 + 0.35, body);
  part(G.box, 0x111111, 0.15, 0.15, 0.05, -0.25, legH + h * 0.85, len / 2 + 0.81, body);
  part(G.box, 0x111111, 0.15, 0.15, 0.05, 0.25, legH + h * 0.85, len / 2 + 0.81, body);
  if (snout) part(G.box, 0xff8fa0, 0.5, 0.35, 0.2, 0, legH + h * 0.6, len / 2 + 0.85, body);
  if (ears) {
    part(G.box, color2, 0.25, 0.4, 0.2, -0.3, legH + h * 1.3, len / 2 + 0.3, body);
    part(G.box, color2, 0.25, 0.4, 0.2, 0.3, legH + h * 1.3, len / 2 + 0.3, body);
  }
  const legs = [];
  for (const [lx, lz] of [[-0.4, len / 2 - 0.3], [0.4, len / 2 - 0.3], [-0.4, -len / 2 + 0.3], [0.4, -len / 2 + 0.3]]) {
    const g = new THREE.Group(); g.position.set(lx, legH, lz); body.add(g);
    part(G.box, color2, 0.35, legH, 0.35, 0, -legH / 2, 0, g);
    legs.push(g);
  }
  if (tail) {
    const t = new THREE.Group(); t.position.set(0, legH + h, -len / 2); body.add(t);
    part(G.box, color, 0.35, 0.35, 1.2, 0, 0.3, -0.4, t).rotation.x = -0.8;
    part(G.box, color, 0.35, 1.2, 0.35, 0, 1.0, -0.8, t);
    part(G.box, 0x331100, 0.3, 0.5, 0.3, 0, 1.6, -0.5, t).rotation.x = 0.9;
  }
  if (pincers) {
    part(G.box, color2, 0.4, 0.3, 0.8, -0.7, legH + 0.3, len / 2 + 0.6, body);
    part(G.box, color2, 0.4, 0.3, 0.8, 0.7, legH + 0.3, len / 2 + 0.6, body);
  }
  return { root, body, parts: { legs, head }, height: (legH + h + 0.4) * scale, kind: 'quad' };
}



// --------------------------------------------------------- ENTITY DEFS ---
function makeFlower({ petal = 0x4aa3ff, center = 0xffe066, scale = 1, face = true, stem = 0x3f8f3a }) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  body.scale.setScalar(scale);
  part(G.box, stem, 0.35, 1.6, 0.35, 0, 0.8, 0, body);
  part(G.box, stem, 0.7, 0.2, 0.3, 0.35, 0.6, 0, body).rotation.z = 0.5;
  part(G.box, stem, 0.7, 0.2, 0.3, -0.35, 0.9, 0, body).rotation.z = -0.5;
  const head = new THREE.Group(); head.position.y = 1.9; body.add(head);
  part(G.box, center, 0.8, 0.8, 0.35, 0, 0, 0, head);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; part(G.box, petal, 0.55, 0.55, 0.2, Math.cos(a) * 0.62, Math.sin(a) * 0.62, -0.05, head).rotation.z = a; }
  if (face) { part(G.box, 0x1b1b1b, 0.12, 0.2, 0.05, -0.16, 0.08, 0.19, head); part(G.box, 0x1b1b1b, 0.12, 0.2, 0.05, 0.16, 0.08, 0.19, head); part(G.box, 0x8a1d22, 0.3, 0.08, 0.05, 0, -0.17, 0.19, head); }
  return { root, body, parts: null, height: 2.7 * scale, kind: 'flower' };
}
function makeCentaur(opts) {
  const horse = makeQuad({ color: 0x8a5a2e, color2: 0x6b4217, len: 2.2, h: 1, legH: 0.9, scale: 0.8 });
  const rider = makeAvatar(opts);
  rider.body.position.set(0, 0.7, 0.35);
  rider.parts.legL.visible = false; rider.parts.legR.visible = false;
  horse.root.add(rider.body);
  for (const i of [1, 2, 3]) horse.body.children[i].visible = false; // hide horse head (rider is the head)
  return { root: horse.root, body: rider.body, parts: rider.parts, horseLegs: horse.parts.legs, height: rider.height + 0.4, kind: 'biped' };
}
function buildPillar() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = new THREE.MeshLambertMaterial({ color: 0x2a1f3a, emissive: 0x5a1fa0, emissiveIntensity: 0.35, flatShading: true });
  part(G.box, 0, 1.6, 0.6, 1.6, 0, 0.3, 0, body, m);
  part(G.box, 0, 1.1, 5, 1.1, 0, 3, 0, body, m);
  part(G.oct, 0, 0.6, 0.9, 0.6, 0, 6.1, 0, body, new THREE.MeshBasicMaterial({ color: 0xc07bff }));
  return { root, body, height: 6.8 };
}
function buildSharkStatue() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = new THREE.MeshLambertMaterial({ color: 0x8a96a6, flatShading: true });
  part(G.box, 0, 2, 1, 2, 0, 0.5, 0, body, m);
  part(G.box, 0, 1, 1.1, 3.2, 0, 1.9, 0, body, m);
  part(G.box, 0, 0.3, 1.2, 0.9, 0, 3, 0, body, m).rotation.x = -0.4;
  part(G.box, 0, 0.3, 1, 0.8, 0, 2, -1.9, body, m);
  return { root, body, height: 3.6 };
}
function buildDummy() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.box, 0x8a5a2e, 0.4, 3, 0.4, 0, 1.5, 0, body);
  part(G.box, 0xd9b86a, 1.4, 1.6, 0.8, 0, 2.6, 0, body);
  part(G.box, 0xd9b86a, 2.4, 0.35, 0.35, 0, 2.8, 0, body);
  part(G.box, 0xd9b86a, 0.9, 0.9, 0.9, 0, 3.9, 0, body);
  part(G.cyl, 0xff4d4d, 0.9, 0.1, 0.9, 0, 2.6, 0.42, body).rotation.x = Math.PI / 2;
  return { root, body, height: 4.6 };
}
function buildCoral() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const c = [0xff7f6b, 0xff5aa0, 0xffb84a][Math.floor(rnd() * 3)];
  part(G.box, c, 0.5, 2.4, 0.5, 0, 1.2, 0, body);
  part(G.box, c, 0.4, 1.6, 0.4, 0.6, 1.6, 0.1, body).rotation.z = -0.5;
  part(G.box, c, 0.4, 1.4, 0.4, -0.6, 1.4, -0.1, body).rotation.z = 0.5;
  part(G.box, c, 0.35, 1, 0.35, 0.1, 2.6, 0.4, body).rotation.x = 0.4;
  return { root, body, height: 3.2 };
}
function buildClam() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.sph, 0xd8c8f0, 2.2, 0.8, 1.8, 0, 0.4, 0, body);
  part(G.sph, 0xc0b0e0, 2.2, 0.7, 1.8, 0, 1.0, -0.4, body).rotation.x = -0.5;
  part(G.sph, 0xffffff, 0.6, 0.6, 0.6, 0, 0.9, 0.2, body, new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xaaaaff, emissiveIntensity: 0.4 }));
  return { root, body, height: 1.8 };
}
function buildSand() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.sph, 0xd9b45f, 2.6, 1.1, 2.2, 0, 0.3, 0, body, new THREE.MeshLambertMaterial({ color: 0xd9b45f, flatShading: true }));
  part(G.sph, 0xe6c77a, 1.4, 0.8, 1.2, 0.5, 0.7, 0.2, body);
  return { root, body, height: 1.6 };
}

const ENEMIES = {
  // Forest
  pig:          { name: 'Pig', zone: 0, hp: 25, dmg: 0, cd: 1, range: 0, speed: 3, aggro: 0, gold: 4, xp: 2, passive: true, loot: [['pork', 1, 2]], radius: 0.9,
                  build: () => makeQuad({ color: 0xf6a5b3, snout: true, len: 1.8, h: 1, legH: 0.5, scale: 0.9 }) },
  livingflower: { name: 'Living Flower', zone: 0, hp: 60, dmg: 3, cd: 1.2, range: 1.6, speed: 4, aggro: 7, gold: 8, xp: 4, loot: [['petal', 0.6, 2]], radius: 0.7,
                  build: () => makeFlower({ petal: 0xff6fa0, scale: 1 }) },
  flowerguard:  { name: 'Flower Guard', zone: 0, hp: 150, dmg: 6, cd: 1.2, range: 1.9, speed: 5, aggro: 9, gold: 18, xp: 8, loot: [['vine', 0.5, 1], ['leaf_sword', 0.04, 1]], radius: 0.7,
                  build: () => makeAvatar({ shirt: 0x3f8f3a, pants: 0x2a5a24, skin: 0x9fe07a, hat: 0xff6fa0, scale: 0.95, weapon: 'dagger' }) },
  golem:        { name: 'Golem', zone: 0, hp: 400, dmg: 10, cd: 1.4, range: 2.2, speed: 4, aggro: 9, gold: 40, xp: 15, loot: [['golem_shard', 0.4, 1], ['golem_armor', 0.03, 1], ['stone_sword', 0.03, 1]], radius: 1.0,
                  build: () => makeAvatar({ shirt: 0x8d8d8d, pants: 0x6d6d75, skin: 0x9a9aa0, scale: 1.4, eyes: 0x4af0ff }) },
  goldengolem:  { name: 'Golden Golem', zone: 0, hp: 4000, dmg: 25, cd: 1.5, range: 3, speed: 4.5, aggro: 12, gold: 800, xp: 300, boss: true, slam: 3.5, radius: 1.8,
                  loot: [['golden_key', 0.5, 1], ['golden_sword', 0.12, 1], ['golden_armor', 0.08, 1]],
                  build: () => makeAvatar({ shirt: 0xffc83d, pants: 0xd99a12, skin: 0xffd84a, scale: 2.5, eyes: 0x1b2140, crown: true }) },
  // Riverlands
  flailsoldier: { name: 'Flail Soldier', zone: 1, hp: 700, dmg: 18, cd: 1.2, range: 2.2, speed: 5.5, aggro: 10, gold: 70, xp: 30, loot: [['flail', 0.4, 1], ['iron_sword', 0.02, 1]], radius: 0.8,
                  build: () => makeAvatar({ shirt: 0x6b6b75, pants: 0x3a3a45, skin: 0xe0b48a, hat: 0x4a4a55, weapon: 'enemyclub' }) },
  thornflower:  { name: 'Thorn Flower', zone: 1, hp: 500, dmg: 14, cd: 1.0, range: 1.8, speed: 4.5, aggro: 9, gold: 55, xp: 25, loot: [['thorn', 0.5, 2]], radius: 0.8,
                  build: () => makeFlower({ petal: 0x8a1d6a, center: 0x2f6a2f, scale: 1.3 }) },
  mossgolem:    { name: 'Moss Golem', zone: 1, hp: 1500, dmg: 30, cd: 1.5, range: 2.4, speed: 4.5, aggro: 10, gold: 150, xp: 60, loot: [['golem_shard', 1, 3], ['iron_armor', 0.02, 1]], radius: 1.1,
                  build: () => makeAvatar({ shirt: 0x5a8a4a, pants: 0x4a6a3a, skin: 0x7a9a6a, scale: 1.6, eyes: 0xffe066 }) },
  whiteflower:  { name: 'White Flower', zone: 1, hp: 25000, dmg: 50, cd: 1.5, range: 3.5, speed: 3, aggro: 13, gold: 5000, xp: 1500, boss: true, slam: 4.5, radius: 2.4,
                  loot: [['white_petal', 1, 3], ['flower_blade', 0.12, 1], ['skill:heal', 0.25, 1]],
                  build: () => makeFlower({ petal: 0xffffff, center: 0xffe066, scale: 3.6 }) },
  // Mountains
  rocky:        { name: 'Rocky', zone: 2, hp: 2000, dmg: 40, cd: 1.2, range: 2, speed: 5, aggro: 10, gold: 180, xp: 120, loot: [['rock_chunk', 0.6, 2]], radius: 0.9,
                  build: () => makeAvatar({ shirt: 0x7a7a80, pants: 0x5a5a60, skin: 0x8a8a90, scale: 1.0, eyes: 0xffffff }) },
  ogre:         { name: 'Ogre', zone: 2, hp: 4000, dmg: 70, cd: 1.5, range: 2.8, speed: 4.8, aggro: 10, gold: 320, xp: 200, loot: [['ogre_tooth', 0.4, 1], ['steel_armor', 0.01, 1]], radius: 1.3,
                  build: () => makeAvatar({ shirt: 0x6b4a2b, pants: 0x3a2f1e, skin: 0x8fae5a, scale: 1.7, weapon: 'enemyclub', eyes: 0xd02020 }) },
  bodyguard:    { name: 'Bodyguard Golem', zone: 2, hp: 7000, dmg: 100, cd: 1.5, range: 2.6, speed: 4.5, aggro: 10, gold: 550, xp: 300, loot: [['golem_heart', 0.35, 1]], radius: 1.3,
                  build: () => makeAvatar({ shirt: 0x3a3a45, pants: 0x2a2a35, skin: 0x5a5a65, hat: 0x1b1b1b, scale: 1.8, eyes: 0xff3030 }) },
  emeraldgolem: { name: 'Emerald Golem', zone: 2, hp: 120000, dmg: 220, cd: 1.6, range: 4, speed: 4.5, aggro: 13, gold: 25000, xp: 6000, boss: true, slam: 5, radius: 2.4,
                  loot: [['emerald', 1, 10], ['emerald_sword', 0.15, 1], ['emerald_armor', 0.1, 1], ['skill:shield', 0.25, 1]],
                  build: () => makeAvatar({ shirt: 0x2fbf6a, pants: 0x1f8a4a, skin: 0x3ddc84, scale: 3, eyes: 0xffffff, crown: true }) },
  // Desert
  scorpion:     { name: 'Scorpion', zone: 3, hp: 9000, dmg: 150, cd: 1.0, range: 2.2, speed: 6.5, aggro: 10, gold: 800, xp: 450, loot: [['scorpion_tail', 0.4, 1]], radius: 1.1,
                  build: () => makeQuad({ color: 0xc86a2f, color2: 0x8a3f18, len: 2.2, h: 0.6, legH: 0.5, tail: true, pincers: true, scale: 1.1 }) },
  mummy:        { name: 'Mummy', zone: 3, hp: 14000, dmg: 200, cd: 1.3, range: 2, speed: 4.5, aggro: 10, gold: 1100, xp: 650, undead: true, loot: [['mummy_cloth', 0.35, 1], ['mummy_wraps', 0.01, 1]], radius: 0.8,
                  build: () => makeAvatar({ shirt: 0xe8dcc0, pants: 0xd8ccb0, skin: 0xe8dcc0, scale: 1.1, eyes: 0x22ff66 }) },
  pharaoh:      { name: 'Pharaoh', zone: 3, hp: 400000, dmg: 480, cd: 1.5, range: 3.8, speed: 5, aggro: 13, gold: 60000, xp: 20000, boss: true, slam: 5, undead: true, radius: 2.2,
                  loot: [['ancient_fragment', 1, 2], ['desert_wand', 0.2, 1], ['skill:rage', 0.25, 1]],
                  build: () => makeAvatar({ shirt: 0x2c5fbf, pants: 0xffc83d, skin: 0xc9965a, scale: 2.8, weapon: 'staff', crown: true, eyes: 0x22ffee }) },
  lordofsands:  { name: 'Lord of Sands', zone: 3, hp: 700000, dmg: 650, cd: 1.6, range: 4.5, speed: 4.5, aggro: 15, gold: 120000, xp: 35000, boss: true, slam: 5.5, summoned: 'darkpillar', radius: 2.8,
                  loot: [['ancient_fragment', 1, 4], ['desert_sword', 0.2, 1], ['phoenix_bow', 0.15, 1], ['skill:beast', 0.3, 1]],
                  build: () => makeAvatar({ shirt: 0xd9b45f, pants: 0xa8843a, skin: 0xe6c77a, scale: 3.4, weapon: 'enemyclub', crown: true, horns: true, eyes: 0xff8a00 }) },
  // Atlantis
  fishman:      { name: 'Fishman', zone: 4, hp: 40000, dmg: 500, cd: 1.2, range: 2.4, speed: 6, aggro: 10, gold: 3500, xp: 1500, loot: [['shark_tooth', 0.3, 1]], radius: 0.9,
                  build: () => makeAvatar({ shirt: 0x2a6f7a, pants: 0x1f4f5a, skin: 0x5ac8b0, scale: 1.2, weapon: 'trident', fin: true, eyes: 0xffe066 }) },
  crabknight:   { name: 'Crab Knight', zone: 4, hp: 60000, dmg: 700, cd: 1.3, range: 2.4, speed: 5, aggro: 10, gold: 5000, xp: 2200, loot: [['pearl', 0.4, 1], ['coral_armor', 0.005, 1]], radius: 1.2,
                  build: () => makeQuad({ color: 0xd9352b, color2: 0xa8241c, len: 1.8, h: 0.8, legH: 0.6, pincers: true, scale: 1.4 }) },
  sapphiregolem:{ name: 'Sapphire Golem', zone: 4, hp: 1500000, dmg: 1400, cd: 1.6, range: 4.5, speed: 4.5, aggro: 13, gold: 250000, xp: 80000, boss: true, slam: 5.5, radius: 2.6,
                  loot: [['sapphire', 1, 10], ['sapphire_sword', 0.15, 1], ['sapphire_armor', 0.12, 1]],
                  build: () => makeAvatar({ shirt: 0x2f4fbf, pants: 0x1f3a8a, skin: 0x3d6bff, scale: 3.2, eyes: 0xffffff, crown: true }) },
  sirshark:     { name: 'Sir Shark', zone: 4, hp: 3000000, dmg: 2000, cd: 1.7, range: 5, speed: 5, aggro: 15, gold: 600000, xp: 150000, boss: true, slam: 6, final: true, summoned: 'sharkstatue', radius: 3,
                  loot: [['trident', 0.25, 1], ['shark_tooth', 1, 20]],
                  build: () => makeAvatar({ shirt: 0x1f3a6e, pants: 0x14264a, skin: 0x8a96a6, scale: 3.8, weapon: 'trident', fin: true, crown: true, eyes: 0xffffff }) },
};

Object.assign(ENEMIES, {
  lavahound: { name: 'Lava Hound', zone: 14, hp: 450e6, dmg: 7e6, cd: 0.95, range: 2.3, speed: 8.2, aggro: 13, gold: 18e6, xp: 2.2e6, loot: [['magma', 0.55, 2], ['magma_blade', 0.003, 1]], radius: 1.0, build: () => makeQuad({ color: 0xc83f22, color2: 0x6b231a, len: 2.2, h: 1.1, legH: 0.8, tail: true, scale: 1.2 }) },
  magmaBrute: { name: 'Magma Brute', zone: 14, hp: 720e6, dmg: 11e6, cd: 1.25, range: 2.7, speed: 5.5, aggro: 13, gold: 28e6, xp: 3.2e6, loot: [['emberstone', 0.45, 2], ['volcanic_armor', 0.002, 1]], radius: 1.4, build: () => makeAvatar({ shirt: 0xff5a24, pants: 0x4b1e1e, skin: 0xe04a2d, scale: 2.0, eyes: 0xffef66, horns: true }) },
  infernotitan: { name: 'Inferno Titan', zone: 14, hp: 120e9, dmg: 24e6, cd: 1.6, range: 7, speed: 5, aggro: 18, gold: 7e9, xp: 900e6, boss: true, slam: 9, radius: 4.6, loot: [['magma_blade', 0.2, 1], ['volcanic_armor', 0.16, 1], ['magma', 1, 50], ['skill:rage', 0.35, 1]], build: () => makeAvatar({ shirt: 0xff5a24, pants: 0x7a2420, skin: 0xff8a3d, scale: 4.8, eyes: 0xffef66, horns: true, crown: true }) },
  aliengrunt: { name: 'Alien Grunt', zone: 15, hp: 900e6, dmg: 13e6, cd: 1.0, range: 2.4, speed: 7.3, aggro: 14, gold: 35e6, xp: 4e6, loot: [['alien_crystal', 0.5, 2]], radius: 0.9, build: () => makeAvatar({ shirt: 0x3acb89, pants: 0x1c5441, skin: 0x83ffb6, scale: 1.0, eyes: 0x000000, weapon: 'staff' }) },
  plasmalurker: { name: 'Plasma Lurker', zone: 15, hp: 1.4e9, dmg: 18e6, cd: 1.1, range: 12, speed: 7.5, aggro: 15, gold: 50e6, xp: 5e6, loot: [['plasma_cell', 0.48, 2], ['plasma_rifle', 0.003, 1]], radius: 1.0, build: () => makeAvatar({ shirt: 0x39e6ff, pants: 0x143747, skin: 0x7affb0, scale: 1.2, eyes: 0xff3d9a }) },
  ufooverlord: { name: 'UFO Overlord', zone: 15, hp: 220e9, dmg: 42e6, cd: 1.45, range: 9, speed: 6.5, aggro: 20, gold: 14e9, xp: 1.8e9, boss: true, slam: 8, radius: 4.8, loot: [['plasma_rifle', 0.22, 1], ['alien_armor', 0.16, 1], ['alien_crystal', 1, 50], ['skill:energy', 0.4, 1]], build: () => makeUfo(3.2) },
  rootling: { name: 'Rootling', zone: 16, hp: 2e9, dmg: 24e6, cd: 1.0, range: 2.1, speed: 7.2, aggro: 14, gold: 75e6, xp: 8e6, loot: [['ancient_bark', 0.52, 2]], radius: 1.0, build: () => makeAvatar({ shirt: 0x315a3a, pants: 0x182a20, skin: 0x6b8a4a, scale: 1.1, eyes: 0x72d96f, horns: true }) },
  treantbeast: { name: 'Treant Beast', zone: 16, hp: 3.5e9, dmg: 35e6, cd: 1.25, range: 2.8, speed: 5.2, aggro: 15, gold: 120e6, xp: 12e6, loot: [['nature_core', 0.5, 2], ['ancient_staff', 0.003, 1]], radius: 1.5, build: () => makeAvatar({ shirt: 0x6b4a2b, pants: 0x2a4829, skin: 0x72a85a, scale: 2.0, eyes: 0x8dff8d, horns: true }) },
  ancientent: { name: 'Ancient Ent', zone: 16, hp: 420e9, dmg: 72e6, cd: 1.7, range: 7, speed: 3.8, aggro: 19, gold: 26e9, xp: 3.2e9, boss: true, slam: 10, radius: 5.2, loot: [['ancient_staff', 0.22, 1], ['deep_armor', 0.18, 1], ['nature_core', 1, 60], ['skill:shield', 0.35, 1]], build: () => makeAvatar({ shirt: 0x4f7a3a, pants: 0x293b22, skin: 0x5a8a3a, scale: 5.1, eyes: 0x9dff7a, horns: true, crown: true }) },
  shockbeast: { name: 'Shock Beast', zone: 17, hp: 5e9, dmg: 48e6, cd: 0.9, range: 2.2, speed: 9, aggro: 16, gold: 180e6, xp: 17e6, loot: [['storm_shard', 0.52, 2]], radius: 1.0, build: () => makeQuad({ color: 0x4d79a8, color2: 0x233c66, len: 2.4, h: 1.0, legH: 0.8, tail: true, scale: 1.25 }) },
  thunderwarden: { name: 'Thunder Warden', zone: 17, hp: 7e9, dmg: 65e6, cd: 1.1, range: 11, speed: 7.2, aggro: 17, gold: 300e6, xp: 28e6, loot: [['charged_core', 0.5, 2], ['storm_cannon', 0.003, 1]], radius: 1.2, build: () => makeAvatar({ shirt: 0x5f9bff, pants: 0x24395c, skin: 0x8fdcff, scale: 1.5, eyes: 0xe0ffff, horns: true }) },
  thunderking: { name: 'Thunder King', zone: 17, hp: 800e9, dmg: 150e6, cd: 1.45, range: 8, speed: 6, aggro: 20, gold: 50e9, xp: 6e9, boss: true, slam: 10, radius: 5.0, loot: [['storm_cannon', 0.22, 1], ['storm_armor', 0.17, 1], ['charged_core', 1, 80], ['skill:beast', 0.35, 1]], build: () => makeAvatar({ shirt: 0x5f9bff, pants: 0x1e355a, skin: 0xaedcff, scale: 5.0, eyes: 0xffffff, horns: true, crown: true, weapon: 'staff' }) },
  uranguard: { name: 'Uran Guard', zone: 18, hp: 10e9, dmg: 75e6, cd: 1.0, range: 2.5, speed: 7.2, aggro: 17, gold: 350e6, xp: 35e6, loot: [['uran_chip', 0.52, 2]], radius: 1.1, build: () => makeAvatar({ shirt: 0x9f7bff, pants: 0x29204a, skin: 0xc8b8ff, scale: 1.35, eyes: 0x7affb0, armor: true }) },
  quantumdroid: { name: 'Quantum Droid', zone: 18, hp: 15e9, dmg: 105e6, cd: 1.15, range: 13, speed: 7.8, aggro: 18, gold: 600e6, xp: 55e6, loot: [['quantum_core', 0.48, 2], ['citadel_blade', 0.003, 1]], radius: 1.0, build: () => makeAvatar({ shirt: 0x62ffde, pants: 0x143e40, skin: 0xb6fff0, scale: 1.4, eyes: 0x1b2140, armor: true }) },
  citadelcommander: { name: 'Citadel Commander', zone: 18, hp: 1.4e12, dmg: 240e6, cd: 1.5, range: 8, speed: 6.2, aggro: 21, gold: 90e9, xp: 10e9, boss: true, slam: 11, radius: 5.4, loot: [['citadel_blade', 0.24, 1], ['citadel_armor', 0.18, 1], ['quantum_core', 1, 100], ['skill:phoenix', 0.32, 1]], build: () => makeAvatar({ shirt: 0xb59cff, pants: 0x3a295f, skin: 0xddd1ff, scale: 5.3, eyes: 0x7affb0, crown: true, armor: true }) },
  starlings: { name: 'Starling', zone: 19, hp: 22e9, dmg: 150e6, cd: 0.95, range: 12, speed: 9, aggro: 18, gold: 900e6, xp: 90e6, loot: [['star_dust', 0.52, 2]], radius: 0.9, build: () => makeOwl({ color: 0xd08cff, belly: 0xffe8a6, scale: 1.3, eyes: 0xffffff }) },
  astralguardian: { name: 'Astral Guardian', zone: 19, hp: 30e9, dmg: 190e6, cd: 1.1, range: 14, speed: 8, aggro: 19, gold: 1.4e9, xp: 140e6, loot: [['astral_core', 0.45, 2], ['astral_staff', 0.003, 1]], radius: 1.2, build: () => makeAvatar({ shirt: 0xd08cff, pants: 0x4d3b7a, skin: 0xffe0ae, scale: 1.6, eyes: 0xffffff, crown: true }) },
  staremperor: { name: 'Star Emperor', zone: 19, hp: 2.8e12, dmg: 400e6, cd: 1.55, range: 9, speed: 6.5, aggro: 22, gold: 180e9, xp: 22e9, boss: true, slam: 12, radius: 5.8, loot: [['star_saber', 0.25, 1], ['astral_armor', 0.2, 1], ['astral_core', 1, 125], ['winner_token', 0.08, 1]], build: () => makeAvatar({ shirt: 0xffd98a, pants: 0x4d3b7a, skin: 0xffe8ba, scale: 5.7, eyes: 0xd08cff, crown: true, armor: true }) },
});
const NODES = {
  tree:        { name: 'Tree', zone: 0, hp: 20, res: 'branch', n: 3, radius: 1.0, respawn: 15, build: () => buildTree(0x4fae3a, 1) },
  meteor: {
  name: 'Meteorite',
  zone: 0,
  hp: 200,
  res: null,
  n: 0,
  radius: 1.2,
  respawn: 1e9,
  meteor: true,
  build: () => buildMeteor(),
},

  blueflower:  { name: 'Blue Flower', zone: 0, hp: 12, res: 'petal', n: 2, radius: 0.6, respawn: 12, build: () => makeFlower({ petal: 0x4aa3ff, face: false, scale: 0.7 }) },
  rock:        { name: 'Rock', zone: 0, hp: 35, res: 'stone', n: 3, radius: 1.1, respawn: 18, build: () => buildRock(0x9a9aa0, null, 1) },
  bigtree:     { name: 'Big Tree', zone: 1, hp: 150, res: 'branch', n: 12, radius: 1.3, respawn: 18, build: () => buildTree(0x3f9a3a, 1.6) },
  riverrock:   { name: 'River Rock', zone: 1, hp: 250, res: 'river_stone', n: 5, radius: 1.2, respawn: 20, build: () => buildRock(0x6f8fa8, 0x9fd3ff, 1.1) },
  boulder:     { name: 'Boulder', zone: 2, hp: 800, res: 'stone', n: 25, radius: 1.5, respawn: 22, build: () => buildRock(0x7a7a80, null, 1.6) },
  emeraldore:  { name: 'Emerald Ore', zone: 2, hp: 1500, res: 'emerald', n: 4, radius: 1.3, respawn: 25, build: () => buildRock(0x6d6d75, 0x3ddc84, 1.2) },
  cactus:      { name: 'Cactus', zone: 3, hp: 2500, res: 'cactus_fiber', n: 8, radius: 0.9, respawn: 22, build: () => buildCactus() },
  sandpile:    { name: 'Sand Pile', zone: 3, hp: 1500, res: 'sand', n: 6, radius: 1.4, respawn: 20, build: () => buildSand() },
  darkpillar:  { name: 'Dark Pillar', zone: 3, hp: 20000, res: null, n: 0, radius: 1.0, respawn: 1e9, summon: 'lordofsands', build: () => buildPillar() },
  coral:       { name: 'Coral', zone: 4, hp: 8000, res: 'coral', n: 6, radius: 0.9, respawn: 25, build: () => buildCoral() },
  clam:        { name: 'Pearl Clam', zone: 4, hp: 15000, res: 'pearl', n: 3, radius: 1.3, respawn: 30, build: () => buildClam() },
  sharkstatue: { name: 'Shark Statue', zone: 4, hp: 50000, res: null, n: 0, radius: 1.2, respawn: 1e9, summon: 'sirshark', build: () => buildSharkStatue() },
  dummy:       { name: 'DPS Dummy', zone: 0, hp: 1e12, res: null, n: 0, radius: 0.8, respawn: 1, dummy: true, build: () => buildDummy() },
};

// v4 builders
function withCap(m, color, spots = 0xffffff) {
  part(G.sph, color, 3.4, 1.8, 3.4, 0, 6.2, 0, m.body);
  for (const [x, z] of [[-0.9, 0.9], [0.8, 0.6], [0, -1.1], [1, -0.6]]) part(G.box, spots, 0.45, 0.2, 0.45, x, 6.95, z, m.body);
  m.height += 0.5; return m;
}
function makeSpider({ color = 0x2a1f3a, scale = 1, eyes = 0xff3030 }) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); body.scale.setScalar(scale);
  part(G.sph, color, 1.6, 1.1, 2, 0, 1, -0.6, body);
  part(G.sph, color, 1.1, 0.9, 1.1, 0, 1, 0.8, body);
  for (const ex of [-0.25, 0.25]) part(G.box, eyes, 0.18, 0.18, 0.1, ex, 1.15, 1.35, body, new THREE.MeshBasicMaterial({ color: eyes }));
  const legs = [];
  for (let i = 0; i < 4; i++) for (const side of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(side * 0.6, 1, 0.6 - i * 0.45); body.add(g);
    const l = part(G.box, color, 1.4, 0.15, 0.15, side * 0.65, 0.2, 0, g); l.rotation.z = side * 0.5;
    part(G.box, color, 0.15, 1, 0.15, side * 1.3, -0.3, 0, g);
    legs.push(g);
  }
  return { root, body, parts: { legs }, height: 1.9 * scale, kind: 'quad' };
}
function makeWiseTree(scale = 1) {
  const t = buildTree(0x3f8f3a, 1.8 * scale);
  const face = new THREE.Group(); face.position.set(0, 2.6 * scale, 0.75 * scale); t.root.add(face);
  part(G.box, 0xffe066, 0.4 * scale, 0.4 * scale, 0.1, -0.4 * scale, 0, 0, face, new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  part(G.box, 0xffe066, 0.4 * scale, 0.4 * scale, 0.1, 0.4 * scale, 0, 0, face, new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  part(G.box, 0x2a1a0a, 1 * scale, 0.2 * scale, 0.1, 0, -0.7 * scale, 0, face);
  return { root: t.root, body: t.body, parts: null, height: t.height || 9 * scale, kind: 'flower' };
}
function makeSerpent(color = 0x5ac85a, scale = 1) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); body.scale.setScalar(scale);
  const segs = [];
  for (let i = 0; i < 6; i++) { const s = part(G.box, i % 2 ? color : new THREE.Color(color).multiplyScalar(0.75).getHex(), 1 - i * 0.08, 1 - i * 0.08, 1, 0, 0.5, -i * 0.9, body); segs.push(s); }
  part(G.box, color, 1.3, 1.1, 1.4, 0, 1.4, 0.6, body).rotation.x = -0.3;
  for (const ex of [-0.35, 0.35]) part(G.box, 0xffe066, 0.2, 0.2, 0.1, ex, 1.6, 1.32, body, new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  return { root, body, parts: { segs }, height: 2.3 * scale, kind: 'serpent' };
}
function buildGlowShroom() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const c = [0xff5a8a, 0x5ad0ff, 0xb36bff, 0xffe066][Math.floor(rnd() * 4)];
  part(G.cyl, 0xf2e6d0, 0.7, 1.6, 0.7, 0, 0.8, 0, body);
  part(G.sph, c, 2.4, 1.2, 2.4, 0, 1.8, 0, body, new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.5 }));
  return { root, body, height: 2.6 };
}
function buildWeb() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = new THREE.MeshBasicMaterial({ color: 0xeeeeff, transparent: true, opacity: 0.75 });
  for (let i = 0; i < 4; i++) { const b = part(G.box, 0, 3.4, 0.08, 0.08, 0, 1.8, 0, body, m); b.rotation.z = i * Math.PI / 4; }
  for (const r of [0.5, 1, 1.5]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 4, 8), m); ring.position.y = 1.8; body.add(ring); }
  part(G.box, 0x6b4217, 0.2, 3.6, 0.2, -1.7, 1.8, 0, body); part(G.box, 0x6b4217, 0.2, 3.6, 0.2, 1.7, 1.8, 0, body);
  return { root, body, height: 3.8 };
}
function buildUrn() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.sph, 0xd9a14a, 1.8, 2, 1.8, 0, 1, 0, body); part(G.cyl, 0xb5803a, 0.9, 0.6, 0.9, 0, 2.2, 0, body);
  part(G.box, 0x7a3a1a, 1.9, 0.25, 1.9, 0, 1.1, 0, body);
  return { root, body, height: 2.8 };
}
function buildMagicCrystal() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = new THREE.MeshLambertMaterial({ color: 0xd05aff, emissive: 0x8a2fd8, emissiveIntensity: 0.6, flatShading: true });
  part(G.oct, 0, 0.8, 2.2, 0.8, 0, 1.6, 0, body, m); part(G.oct, 0, 0.5, 1.4, 0.5, 0.7, 1, 0.3, body, m).rotation.z = -0.4; part(G.oct, 0, 0.45, 1.2, 0.45, -0.6, 0.9, -0.2, body, m).rotation.z = 0.5;
  return { root, body, height: 3.4 };
}
Object.assign(ENEMIES, {
  // Mushroom Forest
  mushroomman:  { name: 'Mushroom Man', zone: 5, hp: 150000, dmg: 2500, cd: 1.2, range: 2, speed: 5.5, aggro: 10, gold: 12000, xp: 4000, loot: [['mushroom', 0.5, 2], ['gem_amethyst', 0.01, 1]], radius: 0.9,
                  build: () => withCap(makeAvatar({ shirt: 0xf2e6d0, pants: 0xb5a58a, skin: 0xf2e6d0, scale: 1.1 }), 0xd9352b) },
  cavespider:   { name: 'Cave Spider', zone: 5, hp: 220000, dmg: 3200, cd: 1.0, range: 2, speed: 7, aggro: 11, gold: 16000, xp: 5500, loot: [['silk', 0.45, 2], ['gem_amethyst', 0.015, 1]], radius: 1.2,
                  build: () => makeSpider({ scale: 1.2 }) },
  wisetree:     { name: 'Wise Tree', zone: 5, hp: 8e6, dmg: 5000, cd: 1.8, range: 5, speed: 2, aggro: 14, gold: 1.5e6, xp: 300000, boss: true, slam: 6, radius: 2.8,
                  loot: [['wise_staff', 0.15, 1], ['skill:chocolate', 0.3, 1], ['gem_amethyst', 0.15, 1], ['mushroom', 1, 20]], build: () => makeWiseTree(1.0) },
  spiderqueen:  { name: 'Spider Queen', zone: 5, hp: 15e6, dmg: 7000, cd: 1.5, range: 5, speed: 5, aggro: 15, gold: 3e6, xp: 500000, boss: true, slam: 6, summoned: 'altar', radius: 3.4,
                  loot: [['spider_fang', 0.2, 1], ['silk_armor', 0.15, 1], ['skill:cupid', 0.3, 1], ['silk', 1, 25]], build: () => makeSpider({ color: 0x3a1f5a, scale: 3.4, eyes: 0xd05aff }) },
  // Ouroboros
  serpent:      { name: 'Ouroboros Serpent', zone: 6, hp: 400000, dmg: 5000, cd: 1.1, range: 2.4, speed: 6.5, aggro: 11, gold: 30000, xp: 9000, loot: [['scale', 0.45, 2]], radius: 1.1,
                  build: () => makeSerpent(0x5ac85a, 1.2) },
  sandwraith:   { name: 'Sand Wraith', zone: 6, hp: 550000, dmg: 6500, cd: 1.3, range: 2.2, speed: 5.5, aggro: 11, gold: 40000, xp: 12000, undead: true, loot: [['relic', 0.35, 1], ['ancient_fragment', 0.05, 1]], radius: 0.9,
                  build: () => makeAvatar({ shirt: 0x8a6a4a, pants: 0x6a4a2a, skin: 0xc9a66b, scale: 1.3, eyes: 0xff8a00, horns: true }) },
  worldeater:   { name: 'World Eater', zone: 6, hp: 40e6, dmg: 12000, cd: 1.6, range: 6, speed: 4.5, aggro: 16, gold: 8e6, xp: 1.2e6, boss: true, slam: 7, summoned: 'altar', radius: 3.6,
                  loot: [['world_blade', 0.15, 1], ['world_bow', 0.15, 1], ['world_armor', 0.12, 1], ['primal_core', 0.3, 1], ['skill:phoenix', 0.3, 1]], build: () => makeSerpent(0xff8a3d, 4) },
  primalworldeater: { name: 'Primal World Eater', zone: 6, hp: 100e6, dmg: 20000, cd: 1.5, range: 7, speed: 5, aggro: 17, gold: 25e6, xp: 3e6, boss: true, slam: 8, summoned: 'altar', radius: 4.2,
                  loot: [['primal_blade', 0.2, 1], ['winner_token', 0.05, 1], ['ancient_fragment', 1, 5]], build: () => makeSerpent(0xff3d6b, 5) },
  // Magic Forest
  gnome:        { name: 'Gnome', zone: 7, hp: 800000, dmg: 9000, cd: 1.0, range: 1.8, speed: 7, aggro: 10, gold: 60000, xp: 20000, loot: [['dark_branch', 0.4, 1], ['gnome_hat', 0.003, 1]], radius: 0.7,
                  build: () => makeAvatar({ shirt: 0x3b6fbf, pants: 0x6b4a2b, skin: 0xffd0a0, hat: 0xd9352b, scale: 0.8, weapon: 'dagger' }) },
  fairy:        { name: 'Dark Fairy', zone: 7, hp: 650000, dmg: 11000, cd: 1.2, range: 2.2, speed: 8, aggro: 12, gold: 70000, xp: 22000, loot: [['fairy_wing', 0.4, 1]], radius: 0.7,
                  build: () => { const m = makeAvatar({ shirt: 0x6b3fd8, pants: 0x3d2466, skin: 0xffd0f0, scale: 0.8, eyes: 0xd05aff }); for (const s of [-1, 1]) { const w = part(G.box, 0xffb3f0, 0.1, 2.4, 1.6, s * 0.7, 4, -0.9, m.body, new THREE.MeshLambertMaterial({ color: 0xffb3f0, transparent: true, opacity: 0.7 })); w.rotation.y = s * 0.6; } return m; } },
  mutantgnome:  { name: 'Mutant Gnome', zone: 7, hp: 60e6, dmg: 15000, cd: 1.4, range: 5.5, speed: 6, aggro: 16, gold: 15e6, xp: 2e6, boss: true, slam: 7, radius: 3.2,
                  loot: [['gnome_bow', 0.15, 1], ['skill:raptor', 0.3, 1], ['gnome_hat', 0.2, 1], ['dark_branch', 1, 20]],
                  build: () => makeAvatar({ shirt: 0x3b6fbf, pants: 0x6b4a2b, skin: 0x8fae5a, hat: 0xd9352b, scale: 3.4, weapon: 'enemyclub', eyes: 0xff3030 }) },
  minotaur:     { name: 'Minotaur', zone: 7, hp: 150e6, dmg: 25000, cd: 1.5, range: 6, speed: 6, aggro: 18, gold: 40e6, xp: 5e6, boss: true, slam: 8, final: true, summoned: 'altar', radius: 3.8,
                  loot: [['minotaur_axe', 0.2, 1], ['minotaur_hide', 0.15, 1], ['skill:minotaur', 0.3, 1], ['winner_token', 0.1, 1]],
                  build: () => makeAvatar({ shirt: 0x6b3a18, pants: 0x3a2010, skin: 0x8a5a2e, scale: 4, weapon: 'enemyclub', horns: true, eyes: 0xff3030 }) },
});
Object.assign(NODES, {
  glowshroom:   { name: 'Glow Mushroom', zone: 5, hp: 30000, res: 'mushroom', n: 3, radius: 1.2, respawn: 25, build: () => buildGlowShroom() },
  spiderweb:    { name: 'Spider Web', zone: 5, hp: 50000, res: 'silk', n: 3, radius: 1.4, respawn: 25, build: () => buildWeb() },
  urn:          { name: 'Ancient Urn', zone: 6, hp: 80000, res: 'relic', n: 2, radius: 1.0, respawn: 28, build: () => buildUrn() },
  darktree:     { name: 'Dark Tree', zone: 7, hp: 120000, res: 'dark_branch', n: 2, radius: 1.3, respawn: 28, build: () => buildTree(0x3a2a4a, 1.5) },
  magiccrystal: { name: 'Magic Crystal', zone: 7, hp: 200000, res: 'magic_crystal', n: 2, radius: 1.1, respawn: 30, build: () => buildMagicCrystal() },
});
// late-game balance pass (hp, dmg, gold)
for (const [id, hp, dmg, gold] of [
  ['mushroomman', 600e3, 12e3, 25e3], ['cavespider', 900e3, 16e3, 32e3], ['wisetree', 30e6, 40e3, 3e6], ['spiderqueen', 60e6, 55e3, 6e6],
  ['serpent', 2.5e6, 40e3, 80e3], ['sandwraith', 3.5e6, 50e3, 100e3], ['worldeater', 250e6, 120e3, 20e6], ['primalworldeater', 700e6, 180e3, 60e6],
  ['gnome', 6e6, 80e3, 200e3], ['fairy', 5e6, 90e3, 220e3], ['mutantgnome', 400e6, 220e3, 40e6], ['minotaur', 2e9, 300e3, 100e6],
]) Object.assign(ENEMIES[id], { hp, dmg, gold });
for (const [id, hp] of [['glowshroom', 120e3], ['spiderweb', 200e3], ['urn', 500e3], ['darktree', 1.2e6], ['magiccrystal', 2e6]]) NODES[id].hp = hp;
// zone gems and the Sir Shark is no longer the final boss
ENEMIES.sirshark.final = false;
for (const [id, gem] of [['golem', 'gem_ruby'], ['mossgolem', 'gem_topaz'], ['bodyguard', 'gem_jade'], ['mummy', 'gem_amber'], ['crabknight', 'gem_aqua']]) ENEMIES[id].loot.push([gem, 0.012, 1]);
for (const [id, gem] of [['goldengolem', 'gem_ruby'], ['whiteflower', 'gem_topaz'], ['emeraldgolem', 'gem_jade'], ['pharaoh', 'gem_amber'], ['sapphiregolem', 'gem_aqua']]) ENEMIES[id].loot.push([gem, 0.15, 1]);

function buildTree(leaf, s) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.box, 0x7a4a22, 0.7 * s, 2.4 * s, 0.7 * s, 0, 1.2 * s, 0, body);
  part(G.box, leaf, 2.6 * s, 1.6 * s, 2.6 * s, 0, 3.0 * s, 0, body);
  part(G.box, leaf, 1.8 * s, 1.2 * s, 1.8 * s, 0, 4.2 * s, 0, body);
  part(G.box, new THREE.Color(leaf).multiplyScalar(0.8).getHex(), 1.0 * s, 0.8 * s, 1.0 * s, 0, 5.0 * s, 0, body);
  return { root, body, height: 5.5 * s };
}
function buildRock(color, ore, s) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const r = part(G.dod, color, 1.3 * s, 0.9 * s, 1.1 * s, 0, 0.6 * s, 0, body, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  r.rotation.y = rnd() * 3;
  part(G.dod, color, 0.7 * s, 0.6 * s, 0.7 * s, 0.9 * s, 0.35 * s, 0.4 * s, body, r.material);
  if (ore) {
    const om = new THREE.MeshLambertMaterial({ color: ore, emissive: ore, emissiveIntensity: 0.25, flatShading: true });
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      const c = part(G.oct, 0, 0.28 * s, 0.45 * s, 0.28 * s, Math.cos(a) * 0.8 * s, 0.8 * s + (i % 2) * 0.3 * s, Math.sin(a) * 0.7 * s, body, om);
      c.rotation.z = Math.cos(a) * 0.5;
    }
  }
  return { root, body, height: 1.8 * s };
}
function buildCactus() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const c = 0x4f9a3a;
  part(G.box, c, 0.9, 3.4, 0.9, 0, 1.7, 0, body);
  part(G.box, c, 0.6, 0.6, 0.6, -0.7, 1.6, 0, body); part(G.box, c, 0.6, 1.4, 0.6, -1.0, 2.2, 0, body);
  part(G.box, c, 0.6, 0.6, 0.6, 0.7, 2.2, 0, body); part(G.box, c, 0.6, 1.2, 0.6, 1.0, 2.7, 0, body);
  part(G.box, 0xff6fa0, 0.4, 0.3, 0.4, 0, 3.5, 0, body);
  return { root, body, height: 3.8 };
}
function buildIce() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = new THREE.MeshLambertMaterial({ color: 0xaee8ff, emissive: 0x3a8fbf, emissiveIntensity: 0.25, flatShading: true, transparent: true, opacity: 0.92 });
  part(G.oct, 0, 0.9, 2.6, 0.9, 0, 2.2, 0, body, m);
  part(G.oct, 0, 0.5, 1.5, 0.5, 0.9, 1.2, 0.3, body, m).rotation.z = -0.4;
  part(G.oct, 0, 0.5, 1.3, 0.5, -0.8, 1.0, -0.2, body, m).rotation.z = 0.4;
  return { root, body, height: 4.4 };
}


function makeLabel(text, color = '#fff', bg = 'rgba(20,24,48,0.85)', size = 34) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `400 ${size}px "Lilita One", sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 36;
  c.width = w; c.height = size + 26;
  ctx.font = `400 ${size}px "Lilita One", sans-serif`;
  ctx.fillStyle = bg;
  const r = 14;
  ctx.beginPath(); ctx.roundRect(0, 0, w, c.height, r); ctx.fill();
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
  const k = 0.02;
  sp.scale.set(w * k, c.height * k, 1);
  return sp;
}


// v5 builders
const ghostMats = {};
function ghostify(m, opacity = 0.55) {
  m.root.traverse((o) => { if (o.isMesh) { const c = o.material.color.getHex(); const key = c + '_' + opacity; o.material = ghostMats[key] || (ghostMats[key] = new THREE.MeshLambertMaterial({ color: c, transparent: true, opacity, emissive: c, emissiveIntensity: 0.35, depthWrite: false })); o.castShadow = false; } });
  m.ghost = true; return m;
}
function makeOwl({ color = 0x8a6a4a, belly = 0xf2e6c8, scale = 1, eyes = 0xffe066 }) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); body.scale.setScalar(scale);
  part(G.box, color, 1.6, 1.8, 1.4, 0, 1.6, 0, body);
  part(G.box, belly, 1.1, 1.2, 0.1, 0, 1.4, 0.72, body);
  const head = part(G.box, color, 1.5, 1.2, 1.3, 0, 3.0, 0, body);
  for (const ex of [-0.38, 0.38]) { part(G.box, 0xffffff, 0.5, 0.5, 0.1, ex, 3.1, 0.66, body); part(G.box, eyes, 0.28, 0.28, 0.1, ex, 3.1, 0.7, body, new THREE.MeshBasicMaterial({ color: eyes })); }
  part(G.box, 0xffa52a, 0.25, 0.3, 0.3, 0, 2.8, 0.75, body);
  for (const ex of [-0.5, 0.5]) part(G.box, color, 0.3, 0.5, 0.3, ex, 3.75, 0, body).rotation.z = ex * 0.6;
  const wings = [];
  for (const sx of [-1, 1]) { const g = new THREE.Group(); g.position.set(sx * 0.8, 2.2, 0); body.add(g); part(G.box, color, 0.25, 1.6, 1.2, sx * 0.15, -0.6, 0, g); wings.push(g); }
  for (const ex of [-0.4, 0.4]) part(G.box, 0xffa52a, 0.35, 0.7, 0.35, ex, 0.35, 0.1, body);
  return { root, body, parts: { wings, head }, height: 4.2 * scale, kind: 'bird' };
}
function withWings(m, color) {
  const wings = [];
  for (const s of [-1, 1]) { const g = new THREE.Group(); g.position.set(s * 0.8, 4.4, -0.6); m.body.add(g); part(G.box, color, 0.15, 2.4, 1.8, s * 0.3, -0.6, 0, g); wings.push(g); }
  m.wings = wings; return m;
}
function buildNest() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.cyl, 0x8a6a3a, 2.4, 0.8, 2.4, 0, 0.4, 0, body);
  for (const [x, z] of [[-0.4, 0], [0.4, 0.2], [0, -0.4]]) part(G.sph, 0xf2f2e6, 0.6, 0.75, 0.6, x, 0.95, z, body);
  return { root, body, height: 1.6 };
}
function buildCrystalCluster(color, emissive) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: 0.55, flatShading: true });
  part(G.oct, 0, 0.7, 2, 0.7, 0, 1.4, 0, body, m); part(G.oct, 0, 0.45, 1.3, 0.45, 0.6, 0.9, 0.2, body, m).rotation.z = -0.5; part(G.oct, 0, 0.4, 1.1, 0.4, -0.5, 0.8, -0.3, body, m).rotation.z = 0.6;
  return { root, body, height: 3.1 };
}
function buildTomb() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.box, 0x6a6a78, 1.4, 2, 0.5, 0, 1, 0, body); part(G.cyl, 0x6a6a78, 1.4, 0.5, 0.5, 0, 2, 0, body).rotation.x = Math.PI / 2;
  part(G.box, 0x4a4a55, 0.2, 0.9, 0.06, 0, 1.3, 0.27, body); part(G.box, 0x4a4a55, 0.7, 0.2, 0.06, 0, 1.45, 0.27, body);
  return { root, body, height: 2.6 };
}
function buildBamboo() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  for (const [x, z, h] of [[0, 0, 5], [0.6, 0.3, 4], [-0.5, 0.4, 4.6], [0.2, -0.6, 3.6]]) { part(G.cyl, 0xb5c84a, 0.3, h, 0.3, x, h / 2, z, body); for (let y = 1; y < h; y += 1.1) part(G.cyl, 0x8a9a2a, 0.36, 0.12, 0.36, x, y, z, body); }
  return { root, body, height: 5.2 };
}
function buildIceBlock(ore) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const m = new THREE.MeshLambertMaterial({ color: 0xcfefff, transparent: true, opacity: 0.85, flatShading: true, emissive: 0x2a5a7a, emissiveIntensity: 0.25 });
  part(G.dod, 0, 1.4, 1.2, 1.4, 0, 1, 0, body, m);
  if (ore) for (const [x, y, z] of [[0.5, 1.3, 0.8], [-0.7, 0.8, 0.6], [0.2, 1.8, -0.6]]) part(G.oct, 0x5ab4ff, 0.3, 0.4, 0.3, x, y, z, body, new THREE.MeshBasicMaterial({ color: 0x5ab4ff }));
  return { root, body, height: 2.4 };
}
function makePenguin() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.sph, 0x1b1b2a, 1.2, 1.6, 1.1, 0, 0.9, 0, body); part(G.sph, 0xffffff, 0.8, 1.2, 0.4, 0, 0.85, 0.38, body);
  for (const ex of [-0.2, 0.2]) part(G.box, 0xffffff, 0.14, 0.14, 0.05, ex, 1.4, 0.52, body);
  part(G.box, 0xffa52a, 0.25, 0.12, 0.3, 0, 1.25, 0.6, body);
  const legs = [];
  for (const ex of [-0.25, 0.25]) { const g = new THREE.Group(); g.position.set(ex, 0.15, 0.1); body.add(g); part(G.box, 0xffa52a, 0.3, 0.12, 0.4, 0, 0, 0.1, g); legs.push(g); }
  return { root, body, parts: { legs }, height: 1.9, kind: 'quad' };
}
function buildMeteor() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  part(G.dod, 0x3a2a2a, 2, 1.6, 2, 0, 1.3, 0, body, new THREE.MeshLambertMaterial({ color: 0x3a2a2a, flatShading: true, emissive: 0xff3a00, emissiveIntensity: 0.35 }));
  for (const [x, y, z] of [[0.9, 1.6, 0.9], [-1, 1.2, 0.5], [0.3, 2.5, -0.6], [-0.4, 1.8, -1.1]]) part(G.oct, 0xff8a2a, 0.35, 0.5, 0.35, x, y, z, body, new THREE.MeshBasicMaterial({ color: 0xff8a2a }));
  return { root, body, height: 3.2 };
}
Object.assign(ENEMIES, {
  // Wise Bird Lands
  harpy:      { name: 'Sky Harpy', zone: 8, hp: 15e6, dmg: 180e3, cd: 1.1, range: 2.2, speed: 8, aggro: 12, gold: 500e3, xp: 60e3, loot: [['feather', 0.45, 2], ['harpy_bow', 0.004, 1]], radius: 0.8,
                build: () => withWings(makeAvatar({ shirt: 0xb5e0ff, pants: 0x7aa6d8, skin: 0xffe0c0, scale: 1, eyes: 0x4a2a8a }), 0xf2f2ff) },
  owlknight:  { name: 'Owl Knight', zone: 8, hp: 22e6, dmg: 230e3, cd: 1.3, range: 2.4, speed: 6, aggro: 11, gold: 650e3, xp: 80e3, loot: [['feather', 0.5, 3], ['bird_talon', 0.003, 1]], radius: 1.0,
                build: () => makeOwl({ scale: 0.95 }) },
  wisebird:   { name: 'Wise Bird', zone: 8, hp: 5e9, dmg: 450e3, cd: 1.6, range: 6, speed: 6, aggro: 17, gold: 250e6, xp: 15e6, boss: true, slam: 7, radius: 3.8,
                loot: [['bird_talon', 0.2, 1], ['owl_armor', 0.15, 1], ['harpy_bow', 0.15, 1], ['feather', 1, 40]], build: () => makeOwl({ color: 0xd8c8a0, belly: 0xffffff, scale: 3.2, eyes: 0x4af0ff }) },
  // Soul Land
  lostsoul:   { name: 'Lost Soul', zone: 9, hp: 35e6, dmg: 400e3, cd: 1.0, range: 2.2, speed: 7.5, aggro: 12, gold: 1.2e6, xp: 150e3, undead: true, loot: [['soul_dust', 0.5, 2]], radius: 0.8,
                build: () => ghostify(makeAvatar({ shirt: 0x9a8fd8, pants: 0x6a5fa8, skin: 0xcfc8ff, scale: 1.1, eyes: 0x5affd8, face: true })) },
  soulknight: { name: 'Soul Knight', zone: 9, hp: 50e6, dmg: 520e3, cd: 1.3, range: 2.4, speed: 6, aggro: 11, gold: 1.6e6, xp: 200e3, undead: true, loot: [['soul_gem', 0.35, 1], ['soul_reaper', 0.003, 1]], radius: 1.0,
                build: () => ghostify(makeAvatar({ shirt: 0x2a2a44, pants: 0x1a1a2a, skin: 0x5affd8, scale: 1.4, armor: true, horns: true, eyes: 0x5affd8, weapon: 'enemyclub' }), 0.8) },
  soulking:   { name: 'Soul King', zone: 9, hp: 12e9, dmg: 1e6, cd: 1.5, range: 6, speed: 5, aggro: 17, gold: 600e6, xp: 35e6, boss: true, slam: 7.5, undead: true, radius: 4,
                loot: [['soul_reaper', 0.2, 1], ['soul_staff', 0.15, 1], ['soul_armor', 0.15, 1], ['soul_gem', 1, 20]], build: () => ghostify(makeAvatar({ shirt: 0x3a2a6a, pants: 0x2a1a4a, skin: 0x9a8fd8, scale: 4, crown: true, eyes: 0x5affd8 }), 0.75) },
  // Jungle
  raptor:     { name: 'Raptor', zone: 10, hp: 80e6, dmg: 900e3, cd: 0.9, range: 2.2, speed: 9, aggro: 13, gold: 3e6, xp: 400e3, loot: [['jungle_vine', 0.4, 2], ['raptor_bow', 0.003, 1]], radius: 1.0,
                build: () => makeQuad({ color: 0x5a9a3a, color2: 0x3f7a2a, scale: 1.1, tail: true, len: 2.4, h: 1, legH: 1.1 }) },
  tribesman:  { name: 'Jungle Tribesman', zone: 10, hp: 95e6, dmg: 1.05e6, cd: 1.2, range: 2.4, speed: 7, aggro: 11, gold: 3.5e6, xp: 450e3, loot: [['bamboo', 0.4, 2]], radius: 0.8,
                build: () => makeAvatar({ shirt: 0x8a5a2e, pants: 0x5a3a1a, skin: 0xb5804a, scale: 1.1, hat: 0x3f9a3a, weapon: 'dagger', eyes: 0xffe066 }) },
  jungleking: { name: 'Jungle King', zone: 10, hp: 28e9, dmg: 2.2e6, cd: 1.4, range: 6.5, speed: 7, aggro: 18, gold: 1.5e9, xp: 80e6, boss: true, slam: 8, radius: 4.2,
                loot: [['king_fang', 0.2, 1], ['trex_armor', 0.15, 1], ['raptor_bow', 0.15, 1], ['skill:raptor', 0.3, 1], ['jungle_vine', 1, 30]],
                build: () => makeQuad({ color: 0x4f8a2a, color2: 0x3a6a1a, scale: 3.6, tail: true, len: 2.8, h: 1.4, legH: 1.3 }) },
  // Arctic
  penguin:    { name: 'Penguin', zone: 11, hp: 4e6, dmg: 0, cd: 1, range: 0, speed: 3, aggro: 0, gold: 2e6, xp: 100e3, passive: true, loot: [['ice', 1, 2]], radius: 0.7, build: () => makePenguin() },
  yeti:       { name: 'Yeti', zone: 11, hp: 180e6, dmg: 2e6, cd: 1.3, range: 2.6, speed: 6.5, aggro: 12, gold: 7e6, xp: 1e6, loot: [['ice', 0.5, 2], ['frost_blade', 0.002, 1]], radius: 1.3,
                build: () => makeAvatar({ shirt: 0xf2f6ff, pants: 0xdfe8f5, skin: 0xb5c8e0, scale: 1.7, eyes: 0x2a5aff, horns: true }) },
  icegolem:   { name: 'Ice Golem', zone: 11, hp: 240e6, dmg: 2.4e6, cd: 1.5, range: 2.8, speed: 5, aggro: 11, gold: 8.5e6, xp: 1.2e6, loot: [['frost_ore', 0.4, 1]], radius: 1.4,
                build: () => makeAvatar({ shirt: 0x9fdcff, pants: 0x6fb4e0, skin: 0xcfefff, scale: 1.9, eyes: 0x2a5aff }) },
  frostgiant: { name: 'Frost Giant', zone: 11, hp: 65e9, dmg: 5e6, cd: 1.6, range: 7, speed: 5.5, aggro: 18, gold: 4e9, xp: 200e6, boss: true, slam: 9, radius: 4.6,
                loot: [['frost_blade', 0.2, 1], ['frost_armor', 0.15, 1], ['ice_staff', 0.15, 1], ['winter_core', 1, 1], ['winner_token', 0.03, 1]], final: true,
                build: () => makeAvatar({ shirt: 0x6fb4e0, pants: 0x3a6a9a, skin: 0xcfefff, scale: 4.6, eyes: 0x4af0ff, crown: true, weapon: 'enemyclub' }) },
  // Mine raid enemies (scaled per raid)
  minebat:    { name: 'Cave Bat', zone: 12, hp: 300, dmg: 12, cd: 0.9, range: 1.8, speed: 9, aggro: 40, gold: 60, xp: 30, loot: [], radius: 0.6, raid: true,
                build: () => { const m = makeOwl({ color: 0x3a2a3a, belly: 0x5a4a5a, scale: 0.45, eyes: 0xff3030 }); return m; } },
  minegolem:  { name: 'Mine Golem', zone: 12, hp: 900, dmg: 25, cd: 1.3, range: 2.2, speed: 5.5, aggro: 40, gold: 150, xp: 70, loot: [], radius: 1.0, raid: true,
                build: () => makeAvatar({ shirt: 0x6a5a4a, pants: 0x4a3a2a, skin: 0x8a7a6a, scale: 1.5, eyes: 0xffb000 }) },
  minelord:   { name: 'Mine Lord', zone: 12, hp: 12000, dmg: 60, cd: 1.5, range: 5, speed: 5, aggro: 40, gold: 2000, xp: 800, boss: true, slam: 5, loot: [], radius: 2.6, raid: true,
                build: () => makeAvatar({ shirt: 0x8a6a2a, pants: 0x4a3a1a, skin: 0xb59a5a, scale: 3, eyes: 0xffb000, crown: true, weapon: 'enemyclub' }) },
});
Object.assign(NODES, {
  feathernest: { name: 'Feather Nest', zone: 8, hp: 3e6, res: 'feather', n: 3, radius: 1.3, respawn: 25, build: () => buildNest() },
  skycrystal:  { name: 'Sky Crystal', zone: 8, hp: 5e6, res: 'sky_shard', n: 2, radius: 1.1, respawn: 28, build: () => buildCrystalCluster(0x8fe0ff, 0x2a8ac0) },
  tombstone:   { name: 'Tombstone', zone: 9, hp: 7e6, res: 'soul_dust', n: 3, radius: 1.0, respawn: 25, build: () => buildTomb() },
  soulcrystal: { name: 'Soul Crystal', zone: 9, hp: 12e6, res: 'soul_gem', n: 2, radius: 1.1, respawn: 28, build: () => buildCrystalCluster(0x5affd8, 0x1a8a7a) },
  jungletree:  { name: 'Jungle Tree', zone: 10, hp: 16e6, res: 'jungle_vine', n: 3, radius: 1.3, respawn: 25, build: () => buildTree(0x2f7a2a, 1.7) },
  bamboo:      { name: 'Bamboo', zone: 10, hp: 25e6, res: 'bamboo', n: 2, radius: 1.1, respawn: 28, build: () => buildBamboo() },
  iceblock:    { name: 'Ice Block', zone: 11, hp: 36e6, res: 'ice', n: 3, radius: 1.3, respawn: 25, build: () => buildIceBlock(false) },
  frostore:    { name: 'Frost Ore', zone: 11, hp: 60e6, res: 'frost_ore', n: 2, radius: 1.3, respawn: 28, build: () => buildIceBlock(true) },

  // V11 resource nodes
  magmaflow: { name: 'Magma Flow', zone: 14, hp: 700e6, res: 'magma', n: 2, radius: 1.4, respawn: 28, build: () => buildCrystalCluster(0xff5a24, 0xaa2410) },
  emberrock: { name: 'Emberstone Rock', zone: 14, hp: 900e6, res: 'emberstone', n: 2, radius: 1.3, respawn: 30, build: () => buildRock(0x7a3628, false, 1.5) },
  aliennode: { name: 'Alien Crystal', zone: 15, hp: 1.1e9, res: 'alien_crystal', n: 2, radius: 1.3, respawn: 28, build: () => buildCrystalCluster(0x7affb0, 0x2a8a5a) },
  plasmacell: { name: 'Plasma Cell', zone: 15, hp: 1.4e9, res: 'plasma_cell', n: 2, radius: 1.1, respawn: 30, build: () => buildCrystalCluster(0x39e6ff, 0x1a6f9c) },
  ancienttree: { name: 'Ancient Tree', zone: 16, hp: 2e9, res: 'ancient_bark', n: 3, radius: 1.5, respawn: 28, build: () => buildTree(0x315a3a, 2.2) },
  naturecrystal: { name: 'Nature Core Node', zone: 16, hp: 2.5e9, res: 'nature_core', n: 2, radius: 1.2, respawn: 30, build: () => buildCrystalCluster(0x72d96f, 0x2f8a4a) },
  stormnode: { name: 'Storm Shard Node', zone: 17, hp: 3.5e9, res: 'storm_shard', n: 2, radius: 1.2, respawn: 28, build: () => buildCrystalCluster(0xb8eaff, 0x4aa3ff) },
  chargednode: { name: 'Charged Core', zone: 17, hp: 4.5e9, res: 'charged_core', n: 2, radius: 1.2, respawn: 30, build: () => buildCrystalCluster(0x7ce8ff, 0x2a8ab0) },
  urancrate: { name: 'Uran Crate', zone: 18, hp: 6e9, res: 'uran_chip', n: 2, radius: 1.4, respawn: 30, build: () => buildRock(0x5a4a7a, false, 1.7) },
  quantum: { name: 'Quantum Node', zone: 18, hp: 7.5e9, res: 'quantum_core', n: 2, radius: 1.3, respawn: 32, build: () => buildCrystalCluster(0x62ffde, 0x208f78) },
  stardust: { name: 'Star Dust Cluster', zone: 19, hp: 10e9, res: 'star_dust', n: 3, radius: 1.3, respawn: 30, build: () => buildCrystalCluster(0xffe8a6, 0xffb84a) },
  astralnode: { name: 'Astral Core Node', zone: 19, hp: 13e9, res: 'astral_core', n: 2, radius: 1.3, respawn: 32, build: () => buildCrystalCluster(0xd08cff, 0x6a2fb5) },
});
ENEMIES.minotaur.final = false;

// v6 enemies: real bosses from the original's badge list, plus world events and war guards
ENEMIES.soulking.name = 'Ghost King';
ENEMIES.jungleking.name = 'Lord Rex';
function makeUfo(scale = 1) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); body.scale.setScalar(scale);
  part(G.cyl, 0x9aa0b8, 5, 0.8, 5, 0, 5, 0, body, new THREE.MeshLambertMaterial({ color: 0x9aa0b8, emissive: 0x222233 }));
  part(G.sph, 0x7affb0, 2.4, 1.6, 2.4, 0, 5.8, 0, body, new THREE.MeshLambertMaterial({ color: 0x7affb0, transparent: true, opacity: 0.7, emissive: 0x2a8a5a }));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; part(G.sph, 0, 0.4, 0.4, 0.4, Math.cos(a) * 2.2, 4.75, Math.sin(a) * 2.2, body, new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffe066 : 0xff3d6b })); }
  const beam = part(G.cone, 0, 2.2, 4.5, 2.2, 0, 2.4, 0, body, new THREE.MeshBasicMaterial({ color: 0x7affb0, transparent: true, opacity: 0.25, depthWrite: false })); beam.castShadow = false;
  return { root, body, height: 6.5 * scale, kind: 'ufo' };
}
function makeBigPenguin() { const m = makePenguin(); m.body.scale.setScalar(3.4); m.height = 6.6; part(G.box, 0xe0353b, 0.9, 0.25, 0.4, 0, 1.15, 0.45, m.body); return m; }
Object.assign(ENEMIES, {
  phoenixboss: { name: 'Phoenix', zone: 8, hp: 7e9, dmg: 520e3, cd: 1.4, range: 6, speed: 7, aggro: 17, gold: 350e6, xp: 20e6, boss: true, slam: 7, radius: 3.5,
                 loot: [['phoenix_sword', 0.2, 1], ['phoenix_armor', 0.15, 1], ['skill:phoenix', 0.25, 1], ['skill:energy', 0.2, 1]], build: () => makeOwl({ color: 0xff6a2a, belly: 0xffd84a, scale: 2.8, eyes: 0xffffff }) },
  ghostpharaoh: { name: 'Ghost Pharaoh', zone: 9, hp: 16e9, dmg: 1.1e6, cd: 1.5, range: 6, speed: 5, aggro: 17, gold: 800e6, xp: 45e6, boss: true, slam: 7.5, undead: true, radius: 3.6,
                 loot: [['ghost_scythe', 0.2, 1], ['soul_gem', 1, 25]], build: () => ghostify(makeAvatar({ shirt: 0xd8cfb0, pants: 0xb5a57a, skin: 0xffd84a, scale: 3.6, crown: true, eyes: 0x5affd8 }), 0.7) },
  thepenguin:  { name: 'THE Penguin', zone: 11, hp: 45e9, dmg: 3.8e6, cd: 1.3, range: 6.5, speed: 6, aggro: 18, gold: 2.5e9, xp: 120e6, boss: true, slam: 8, radius: 4,
                 loot: [['penguin_blade', 0.2, 1], ['penguin_armor', 0.15, 1], ['ice', 1, 40]], build: () => makeBigPenguin() },
  ufo:         { name: 'UFO', zone: 0, hp: 1000, dmg: 20, cd: 1.6, range: 7, speed: 6, aggro: 30, gold: 600, xp: 300, boss: true, slam: 6, radius: 3, event: true,
                 loot: [['alien_blaster', 0.12, 1], ['alien_core', 1, 1], ['skill:energy', 0.1, 1]], build: () => makeUfo(1) },
  roguealien:  { name: 'Rogue Alien', zone: 0, hp: 200, dmg: 8, cd: 1.1, range: 9, speed: 7, aggro: 30, gold: 80, xp: 60, radius: 0.8, event: true, loot: [['alien_core', 0.05, 1]],
                 build: () => makeAvatar({ shirt: 0x7affb0, pants: 0x2a8a5a, skin: 0x9aff9a, scale: 1, eyes: 0x000000, weapon: 'staff' }) },
  warguard:    { name: 'War Guard', zone: 0, hp: 100, dmg: 10, cd: 1.2, range: 2.2, speed: 7, aggro: 16, gold: 50, xp: 40, radius: 0.8, war: true, loot: [],
                 build: () => makeAvatar({ shirt: 0x9f7bff, pants: 0x3a2a6a, skin: 0xffd66b, scale: 1.15, armor: true, weapon: 'dagger' }) },
});
for (const id of ['phoenixboss', 'ghostpharaoh', 'thepenguin']) ENEMIES[id].loot.push(['winner_token', id === 'thepenguin' ? 0.01 : 0.003, 1]);

// ---- V7 enemies: Crab Cave
function makeHermit(color, shell, scale) {
  const m = makeQuad({ color, color2: color, len: 1.8, h: 0.6, legH: 0.5, pincers: true, scale });
  const sh = part(G.cone, shell, 1.5, 1.8, 1.5, 0, 1.5, -0.3, m.body); sh.rotation.x = -0.4;
  part(G.box, 0xffffff, 0.2, 0.3, 0.2, 0, 1.6, 0.5, m.body);
  return m;
}
Object.assign(ENEMIES, {
  hermitcrab: { name: 'Hermit Crab', zone: 13, hp: 42e6, dmg: 430e3, cd: 1.1, range: 2.3, speed: 6, aggro: 11, gold: 1.4e6, xp: 170e3, loot: [['crab_shell', 0.5, 2], ['shell', 0.3, 3]], radius: 1.0,
    build: () => makeHermit(0xe0603a, 0xd8c8a0, 1.3) },
  crablord: { name: 'Crab Lord', zone: 13, hp: 75e6, dmg: 620e3, cd: 1.4, range: 2.6, speed: 5, aggro: 12, gold: 2.3e6, xp: 260e3, loot: [['cave_pearl', 0.4, 1], ['crab_claw', 0.004, 1]], radius: 1.4,
    build: () => makeQuad({ color: 0xb02020, color2: 0x701010, len: 2.2, h: 0.9, legH: 0.7, pincers: true, scale: 1.9 }) },
  kingcrab: { name: 'King Crab', zone: 13, hp: 15e9, dmg: 1.1e6, cd: 1.5, range: 6, speed: 4.5, aggro: 18, gold: 700e6, xp: 40e6, boss: true, slam: 8, radius: 4.2,
    loot: [['crab_claw', 0.2, 1], ['crab_armor', 0.12, 1], ['cave_pearl', 1, 25], ['winner_token', 0.05, 1]],
    build: () => { const m = makeQuad({ color: 0xd9352b, color2: 0x8a1a10, len: 2.4, h: 1, legH: 0.7, pincers: true, scale: 5 }); part(G.box, 0xffc83d, 0.9, 0.35, 0.9, 0, 1.75, 0.2, m.body); for (const sx of [-0.3, 0, 0.3]) part(G.cone, 0xffc83d, 0.18, 0.35, 0.18, sx, 2.05, 0.2, m.body); return m; } },
});

// -------------------------------------------------------------- STATE ---
const S = {
  mode: 'title', gold: 100,
  pack: {}, packCount: 0, bag: 'starter_bag', wand: 'basic_wand',
  owned: { starter_bag: true, basic_wand: true },
  barracks: [], bUid: 1,
  gatesOpen: {}, bossesDown: {},
  kills: 0, earned: 0, time: 0, sold: 0, won: false, sound: true, goldenKills: 0,
  counts: {}, found: {}, disc: {}, lootDisc: {},
  potInv: { gold: 0, luck: 0, exp: 0, mat: 0 }, potions: { gold: 0, luck: 0, exp: 0, mat: 0 },
  skills: {}, skill: null, skillCd: 0, fx: { shield: 0, rage: 0, beast: 0, boost: 0 },
  quests: { tom: 0, emma: 0, file: 0 }, met: { tom: true },
codes: {},
wheelAt: 0,
premiumWheelAt: 0,
wheelRot: 0,
premiumWheelRot: 0,
spinning: false,
  items: {}, ench: {}, autosell: {}, hat: null, boots: null, belt: null, title: 'recruit',
  skill2: null, skillCd2: 0, mushy: { lvl: 0, id: null, n: 0, start: 0 }, disp: {}, annexOpen: {},
  plots: 10, bank: 0, bankT: 0, bankEarned: 0, gifts: {}, shells: {}, raid: { active: false }, raidCd: 0, raidBest: 0, raidsWon: 0,
  ruby: { lvl: 0, on: false, base: 0 }, musicPick: 'auto', rebirths: 0, teams: [null, null, null],
  pets: [], petUid: 1, petEq: [], hatched: {}, hatchCount: 0, research: {}, badges: {}, favTp: {},
  war: { side: null, flags: [], caps: 0, pts: [0, 0, 0] },
  tutorialDone: false, tutorialStep: 0,
  momentum: 0, momentumAt: 0, momentumBest: 0,
  chain: { count: 0, lastAt: -99, best: 0 }, commands: 0,
  smartChain: true,
  daily: { key: '', kind: '', goal: 0, start: 0, claimed: false, reward: 0, streak: 0, lastClaim: '' },
  director: { active: false, ends: 0, next: 35, bonus: 1, label: '', spawned: [] },
  musicOn: true, musicVol: 0.6, sfxVol: 1, shadows: true, dmgNums: true, shellRadar: false,
  resourcesSold: 0,
  legacy: { points: 0, lifetime: 0, upgrades: { command: 0, quartermaster: 0, war_chest: 0, scout: 0, logistics: 0 }, milestones: {} },
  contract: { id: '', start: 0, goal: 0, ends: 0, claimed: false, reward: 0 },
  command: { mode: 'follow', formation: 'line', priority: 'nearest', orders: 0 },
  capture: {}, worldEvent: { active:false, kind:'', post:'', ends:0, next:90, reward:0 },
  secrets: {}, relics: {}, randomEvent: {active:false,kind:'',ends:0,next:85,reward:0,label:'',zone:0},
  commander: { id:'marshal', xp:0, unlocks:{ marshal:true } },
  bossMastery: {}, synergyToastAt: -99,
  trial: { active:false, id:'', start:0, ends:0, baseKills:0, baseBosses:0, reward:0, cooldown:0 },
  season: { id:'frontier_festival', xp:0, tickets:0, claimed:{}, lastDay:'', streak:0, week:'', weekKills:0, weekSold:0, weekClaimed:false, bonusAt:0, bonusId:'gold' },
  archive: { claimed:{}, ranks:{}, seenVersion:1 },
  expedition: { active:false, id:'', difficulty:1, wave:0, waves:0, kills:0, goal:0, start:0, ends:0, nextWaveAt:0, spawned:[], clears:0, best:0 },
  bounty: { slots:[], ends:0, next:22, completed:0, streak:0, lastRefresh:0 },
  eliteHunt: { active:false, type:'', ends:0, next:70 },
};
// ------------------------------------------------------ V14 COMMANDERS ---
// Commander identities change how the same army build performs. They are
// intentionally lightweight so the game stays readable and fast to operate.
const COMMANDERS = [
  { id:'marshal', name:'Field Marshal', req:1, color:0xffc83d, desc:'+5% troop damage and +7% speed while Rush is active', dmg:0.05, rushSpeed:0.07 },
  { id:'warden', name:'Iron Warden', req:5, color:0x8fe0ff, desc:'+12% troop health and +6% damage while Hold is active', hp:0.12, holdDmg:0.06 },
  { id:'quartermaster', name:'Quartermaster', req:10, color:0x52d273, desc:'+12% gold, +15% bag capacity and +5% material yield', gold:0.12, bag:0.15, mats:0.05 },
  { id:'hunter', name:'Beast Hunter', req:15, color:0xff6fd8, desc:'+7% luck, +8% crit chance and +12% boss damage', luck:0.07, crit:0.08, boss:0.12 },
];
const commanderDef = () => COMMANDERS.find(c => c.id === (S.commander?.id || 'marshal')) || COMMANDERS[0];
const commanderLevel = () => 1 + Math.floor((Number(S.commander?.xp) || 0) / 250);
const commanderUnlocked = id => !!(S.commander?.unlocks?.[id]) || commanderLevel() >= (COMMANDERS.find(c=>c.id===id)?.req || 999);
function gainCommanderXp(n, reason='') {
  if (!n || !S.commander) return;
  const before = commanderLevel();
  S.commander.xp = Math.max(0, Number(S.commander.xp)||0) + n;
  for (const c of COMMANDERS) if (commanderLevel() >= c.req) S.commander.unlocks[c.id] = true;
  const after = commanderLevel();
  if (after > before) {
    addLegacyPoints(Math.min(3, after - before), `Commander Rank ${after}`);
    toast(`COMMANDER RANK ${after} · ${commanderDef().name}`, 'gold', 3200);
    musicStinger('level');
  }
}
function commanderStat(stat) { const c = commanderDef(); return Number(c[stat]) || 0; }
function commanderDmg(s, target) {
  const c = commanderDef(); let m = 0;
  if (c.id === 'marshal' && S.command?.mode === 'rush') m += c.dmg;
  if (c.id === 'warden' && S.command?.mode === 'hold') m += c.holdDmg;
  if (target?.def?.boss && c.boss) m += c.boss;
  return m;
}
const commanderHp = () => commanderStat('hp');
const commanderSpeed = () => (commanderDef().id === 'marshal' && S.command?.mode === 'rush') ? commanderStat('rushSpeed') : 0;
const commanderGold = () => commanderStat('gold');
const commanderBag = () => commanderStat('bag');
const commanderMats = () => commanderStat('mats');
const commanderLuck = () => commanderStat('luck');
const commanderCrit = () => commanderStat('crit');

// ---------------------------------------------------------- V18 SYNERGY ---
const ARMY_SYNERGIES = [
  {id:'vanguard',name:'VANGUARD',color:0xffc83d,desc:'3+ melee troop types · +10% damage and +8% HP',dmg:.10,hp:.08,ok:c=>(c.sword||0)+(c.glove||0)+(c.swordmaster||0)+(c.paladin||0)>=3},
  {id:'volley',name:'VOLLEY',color:0x52d273,desc:'2+ bow troops · +9% speed and +8% ranged damage',speed:.09,ranged:.08,ok:c=>(c.bow||0)+(c.centaur||0)+(c.dinorider||0)>=2},
  {id:'arcane',name:'ARCANE CORE',color:0xb36bff,desc:'Staff + Snowball · +14% ability damage',ability:.14,ok:c=>(c.staff||0)>0&&(c.snowball||0)>0},
  {id:'guardian',name:'GUARDIAN',color:0x8fe0ff,desc:'Paladin + Absorber · +12% HP and +8% resistance',hp:.12,dr:.08,ok:c=>(c.paladin||0)>0&&(c.glove||0)>0},
  {id:'legion',name:'LEGION',color:0xff6fd8,desc:'4+ different troop types · +6% damage, speed and luck',dmg:.06,speed:.06,luck:.06,ok:c=>Object.keys(c).filter(k=>c[k]>0).length>=4}
];
function armySynergy(){ const c={}; for(const so of soldiers){ if(!so.alive) continue; c[so.def.id]=(c[so.def.id]||0)+1; } return [...ARMY_SYNERGIES].reverse().find(x=>x.ok(c))||null; }
function synergyBonus(k,target){ const sy=armySynergy(); if(!sy) return 0; if(k==='dmg') return sy.dmg||0; if(k==='hp') return sy.hp||0; if(k==='speed') return sy.speed||0; if(k==='luck') return sy.luck||0; if(k==='ranged') return sy.ranged||0; return 0; }
function bossMastery(id){ return Number(S.bossMastery?.[id])||0; }
function totalBossMastery(){ return Object.values(S.bossMastery||{}).reduce((a,v)=>a+(Number(v)||0),0); }
function bossMasteryBonus(){ return Math.min(.25,totalBossMastery()*.002); }
function recordBossMastery(e){
  if(!e?.def?.boss) return; const id=e.typeId,before=bossMastery(id),after=before+1; S.bossMastery[id]=after;
  for(const m of [1,3,5,10,25]) if(before<m&&after>=m){ const sh=m===25?12:m===10?7:m===5?4:m===3?2:1; const gold=Math.round(e.def.gold*(m===25?12:m===10?6:m===5?3:m===3?2:1)); addLegacyPoints(sh,`${e.def.name} Mastery ${m}`); addGold(gold); seasonGainXp(18+m*3,`${e.def.name} Mastery`); gainCommanderXp(20+m*4,`${e.def.name} Mastery`); toast(`${e.def.name} MASTERY ${m} · +${sh} ◈ · +${fmt(gold)} gold`,'gold',4200); musicStinger(m>=10?'legendary':'level'); burst(e.pos,0xd08cff,m>=10?32:20); }
}
function updateBossPhases(e) {
  if (!e?.def?.boss || !e.alive || !(e.maxHp > 0)) return;
  const hp = e.hp / e.maxHp;
  const phase = [0.75, 0.5, 0.25].filter((threshold) => hp <= threshold).length;
  if (phase <= Number(e.bossPhase || 0)) return;

  e.bossPhase = phase;
  e.phaseMul = [1, 1.15, 1.32, 1.52][phase];
  e.enraged = phase >= 2;
  e.castLockT = 0;
  const phaseName = ['', 'PHASE 2', 'PHASE 3', 'FINAL PHASE'][phase];
  toast(`${e.def.name} · ${phaseName} · ${Math.round(e.phaseMul * 100)}% POWER`, 'bad', 3500);
  banner(phaseName, `${e.def.name} is changing its attack pattern`);
  burst(e.pos, phase === 3 ? 0xff3030 : 0xd08cff, 24 + phase * 7);
  shock(e.pos, 7 + phase * 2);
  sfx('slam');
  musicStinger(phase === 3 ? 'combo' : 'level');

  // Nearby regular enemies join the fight at phase thresholds; don't repeatedly
  // buff the same enemy beyond the current phase's intended ceiling.
  const minions = entities.filter((x) => x.alive && x.kind === 'enemy' && !x.def.boss &&
    !x.def.passive && !x.def.event && !x.def.raid && !x.def.war && x.zone === e.zone).slice(0, phase);
  for (const minion of minions) {
    minion.state = 'chase';
    minion.target = soldiers.find((unit) => unit.alive) || player;
    minion.mul = Math.max(minion.mul || 1, 1.12 + phase * 0.1);
  }
}

// Signature attack style is selected per boss, with a zone-based fallback for
// bosses added later. The existing enemy definitions, damage values and loot
// tables remain canonical; this layer only changes how boss attacks are telegraphed.
const BOSS_STYLES = {
  goldengolem: 'quake', emeraldgolem: 'quake', infernotitan: 'quake', minelord: 'quake', kingcrab: 'quake',
  whiteflower: 'bloom', wisetree: 'bloom', ancientent: 'bloom', phoenixboss: 'bloom',
  pharaoh: 'barrage', lordofsands: 'barrage', ghostpharaoh: 'barrage', soulking: 'barrage',
  ufooverlord: 'barrage', thunderking: 'barrage', staremperor: 'barrage', starhunter: 'barrage',
  sirshark: 'charge', jungleking: 'charge', spiderqueen: 'charge', minotaur: 'charge', roamerwarlord: 'charge',
  sapphiregolem: 'nova', worldeater: 'nova', primalworldeater: 'nova', voidstalker: 'nova', citadelcommander: 'nova',
  wisebird: 'dive', phoenix: 'dive', frostgiant: 'frost', thepenguin: 'frost', mutantgnome: 'trickster',
};
const BOSS_STYLE_COLORS = {
  quake: 0xff7048, bloom: 0xff6fd8, barrage: 0xff4040, charge: 0xff9b3d,
  nova: 0xb36bff, dive: 0x8fe0ff, frost: 0x70d9ff, trickster: 0xffd84a,
};
function bossStyleFor(e) {
  if (BOSS_STYLES[e?.typeId]) return BOSS_STYLES[e.typeId];
  return ['quake', 'barrage', 'nova', 'charge'][Math.abs(Number(e?.zone) || 0) % 4];
}
function exposeBoss(e, seconds = 1.25) {
  if (!e?.alive || !e.def?.boss) return;
  e.vuln = Math.max(Number(e.vuln) || 0, seconds);
  const priorNotice = Number.isFinite(Number(e.lastExposeNotice)) ? Number(e.lastExposeNotice) : -99;
  if (S.time - priorNotice > 4.5) {
    e.lastExposeNotice = S.time;
    popNumber(e.pos, (e.barY || 3) + 0.7, 'EXPOSED!', 'lvl');
    toast(`${e.def.name} is exposed! Attack now!`, 'good', 1800);
  }
}
function bossSignatureAttack(e, target, baseDamage) {
  if (!e?.alive || !e.def?.boss || !target?.pos || !Number.isFinite(target.pos.x) || !Number.isFinite(target.pos.z)) return;
  const phase = clamp(Number(e.bossPhase) || 0, 0, 3);
  const style = bossStyleFor(e);
  const color = BOSS_STYLE_COLORS[style] || 0xff4040;
  const baseRadius = Math.max(2.5, Number(e.def.slam) || (Number(e.radius) || 2) * 1.5);
  e.bossAttackCount = (Number(e.bossAttackCount) || 0) + 1;
  const n = e.bossAttackCount;
  // Basic attacks keep the fight readable; signatures become more frequent as
  // the boss loses health, but never overlap a previous warning sequence.
  const signature = phase >= 3 ? n % 2 === 0 : phase >= 1 ? n % 2 === 0 : n % 3 === 0;
  if (!signature) {
    const delay = phase >= 2 ? 0.58 : 0.7;
    const radius = baseRadius * (e.enraged ? 1.12 : 1);
    telegraph(e, target.pos.clone(), radius, baseDamage * (e.enraged ? 0.9 : 0.78), delay, { color });
    e.castLockT = Math.max(Number(e.castLockT) || 0, delay + 0.08);
    e.cd = Math.max(e.cd, delay + 0.28);
    return;
  }

  const mark = (pos, radius, multiplier, delay, expose = false) => {
    telegraph(e, pos, radius, baseDamage * multiplier, delay, { color, expose });
    e.castLockT = Math.max(Number(e.castLockT) || 0, delay + 0.12);
  };
  const targetPos = target.pos.clone();
  const perp = (() => {
    const dx = targetPos.x - e.pos.x, dz = targetPos.z - e.pos.z;
    const len = Math.hypot(dx, dz) || 1;
    return { x: -dz / len, z: dx / len };
  })();
  let maxDelay = 0.9;

  if (style === 'quake') {
    // A safe-to-read point-blank shockwave punishes staying under heavy bosses.
    mark(e.pos.clone(), baseRadius * (phase >= 2 ? 1.55 : 1.3), 0.9, 0.85, phase < 2);
    if (phase >= 2) {
      maxDelay = 1.16;
      mark(targetPos, baseRadius * 0.78, 0.62, maxDelay, true);
    }
  } else if (style === 'bloom' || style === 'nova') {
    // Burst around the boss, then a targeted follow-up in later phases.
    mark(e.pos.clone(), baseRadius * (style === 'nova' ? 1.65 : 1.4), 0.82, 0.9, phase < 2);
    if (phase >= 1) {
      maxDelay = 1.18;
      mark(targetPos, baseRadius * 0.72, 0.58, maxDelay, true);
    }
  } else if (style === 'charge') {
    maxDelay = 0.92;
    bossLaneTelegraph(e, targetPos, baseDamage * (phase >= 2 ? 1.15 : 1), maxDelay,
      2.8 + phase * 0.42, 10 + phase * 2.2, color, phase >= 1);
    if (phase >= 2) {
      maxDelay = 1.22;
      mark(targetPos, baseRadius * 0.58, 0.48, maxDelay, true);
    }
  } else {
    // Barrage, dive, frost and trickster bosses mark several separate places.
    // Each marker is brief and avoidable; spread narrows only for late phases.
    const count = phase >= 3 ? 5 : 3;
    const spacing = baseRadius * (style === 'barrage' ? 0.76 : 0.62);
    const areaRadius = Math.max(1.8, baseRadius * (style === 'barrage' ? 0.52 : 0.46));
    for (let i = 0; i < count; i++) {
      const offsetIndex = i - (count - 1) / 2;
      let px = targetPos.x + perp.x * offsetIndex * spacing;
      let pz = targetPos.z + perp.z * offsetIndex * spacing;
      // Dive and trickster patterns are offset forward/back as well, to create
      // a recognizable pattern without making every marker stack on one spot.
      if (style === 'dive' || style === 'trickster') {
        const towardX = e.pos.x - targetPos.x, towardZ = e.pos.z - targetPos.z;
        const len = Math.hypot(towardX, towardZ) || 1;
        px += (towardX / len) * offsetIndex * 0.9;
        pz += (towardZ / len) * offsetIndex * 0.9;
      }
      const delay = 0.72 + i * (phase >= 3 ? 0.105 : 0.14);
      maxDelay = Math.max(maxDelay, delay);
      mark(new THREE.Vector3(px, 0, pz), areaRadius, style === 'barrage' ? 0.52 : 0.57, delay, i === count - 1);
    }
  }
  // Attack cooldown is never shorter than the warning sequence, preventing
  // stacked telegraphs during the faster late phases.
  e.castLockT = Math.max(Number(e.castLockT) || 0, maxDelay + 0.12);
  e.cd = Math.max(e.cd, maxDelay + 0.34);
  const priorCallout = Number.isFinite(Number(e.lastSignatureCallout)) ? Number(e.lastSignatureCallout) : -99;
  if (S.time - priorCallout > 5) {
    e.lastSignatureCallout = S.time;
    const labels = { quake: 'GROUND BREAKER', bloom: 'BLOOM BURST', barrage: 'MARKED BARRAGE', charge: 'CHARGE LINE', nova: 'VOID NOVA', dive: 'SKYFALL', frost: 'FROST FIELD', trickster: 'TRICKSTER STRIKE' };
    toast(`${e.def.name}: ${labels[style] || 'SIGNATURE ATTACK'} — dodge the warning!`, 'bad', 1900);
  }
}

const TRIALS = [
  {id:'skirmish',name:'Skirmish',desc:'Defeat 15 enemies before the clock runs out.',units:5,dur:60,goal:15,reward:50000,xp:80},
  {id:'blitz',name:'Blitz War',desc:'Defeat 25 enemies in a rapid-fire 50 second push.',units:15,dur:50,goal:25,reward:250000,xp:150},
  {id:'champion',name:'Champion Hunt',desc:'Defeat 3 bosses before time expires.',units:25,dur:180,goal:3,reward:2500000,xp:500,boss:true},
];
const trialDef = () => TRIALS.find(t=>t.id===S.trial?.id) || TRIALS[0];
function trialProgress() {
  const t = trialDef();
  if (!S.trial?.active) return 0;
  return t.boss ? Math.max(0, Object.keys(S.bossesDown||{}).filter(k => S.bossesDown[k]).length - (S.trial.baseBosses||0)) : Math.max(0, S.kills - (S.trial.baseKills||0));
}
function startTrial(id) {
  const t = TRIALS.find(x=>x.id===id); if(!t || S.mode!=='play') return false;
  if(S.trial.active){ toast('A Commander Trial is already active','bad'); return false; }
  if(S.time < (S.trial.cooldown||0)){ toast(`Trial ready in ${clock(S.trial.cooldown-S.time)}`,''); return false; }
  if(soldiers.filter(s=>s.alive).length < t.units){ toast(`${t.name} needs ${t.units} living units`,'bad'); sfx('error'); return false; }
  S.trial = {active:true,id:t.id,start:S.time,ends:S.time+t.dur,baseKills:S.kills,baseBosses:Object.keys(S.bossesDown||{}).filter(k=>S.bossesDown[k]).length,reward:t.reward,rewardBase:t.reward,cooldown:S.time+45};
  banner(t.name.toUpperCase(), `${t.desc} · ${t.dur}s`); toast('Commander Trial started!','gold',3200); musicStinger('combo');
  return true;
}
function updateTrial(dt){
  if(!S.trial?.active || S.mode!=='play') return;
  const t=trialDef(), p=trialProgress(), left=S.trial.ends-S.time;
  if(p>=t.goal){ const g=Math.round(t.reward*goldMult()); addGold(g); seasonGainXp(t.boss?80:40,t.name); addLegacyPoints(t.boss?8:4,`${t.name} complete`); gainCommanderXp(t.xp, t.name); toast(`${t.name} COMPLETE · +${fmt(g)} gold · +${t.xp} Commander XP`,'gold',5000); banner('TRIAL COMPLETE',`${t.name} · ${fmt(g)} gold`); musicStinger('victory'); S.trial={active:false,id:'',start:0,ends:0,baseKills:0,baseBosses:0,reward:0,cooldown:S.time+60}; return; }
  if(left<=0){ toast(`${t.name} failed · ${Math.min(p,t.goal)}/${t.goal}`,'bad',3200); S.trial.active=false; S.trial.cooldown=S.time+60; musicStinger('error'); }
}
function promoteBarrack(b) {
  if(!b) return false;
  const tier=Number(b.elite)||0;
  if(b.level<12){ toast('Barrack must reach level 12 first','bad'); return false; }
  if(tier>=3){ toast('This barrack is Elite III',''); return false; }
  const costs=[{g:5e6,s:3},{g:50e6,s:7},{g:500e6,s:15}], c=costs[tier];
  if(S.gold<c.g || legacyPoints()<c.s){ toast(`Need ${fmt(c.g)} gold + ${c.s} Command Shards`,'bad'); sfx('error'); return false; }
  S.gold-=c.g; S.legacy.points-=c.s; b.elite=tier+1; rebuildTroops(b); refreshSoldierStats();
  addLegacyPoints(1,`Elite ${b.elite} promotion`,true);
  toast(`${TROOPS[b.type].name} promoted to ELITE ${b.elite}`,'gold',4500); burst(barrackDoor(b),0xffc83d,28); musicStinger('legendary'); return true;
}

// ------------------------------------------------ V16 EXPEDITIONS ---
// Repeatable, self-contained army challenges. They reuse the existing world
// enemies so the game gets a stronger endgame loop without creating a second
// combat engine.
const EXPEDITIONS = [
  { id:'greenrun', name:'Greenrun Siege', zone:0, minUnits:5, waves:4, duration:78, color:0x52d273,
    desc:'Four escalating forest waves. Great for building a young army.', pool:['livingflower','flowerguard','golem'], baseGold:12000, shard:3 },
  { id:'ashen', name:'Ashen Gauntlet', zone:3, minUnits:15, waves:5, duration:86, color:0xff8a3d,
    desc:'Desert assault with denser waves and stronger enemies.', pool:['mummy','scorpion','sandsentinel'], baseGold:850000, shard:8 },
  { id:'abyss', name:'Abyssal Run', zone:4, minUnits:25, waves:5, duration:92, color:0x4af0e0,
    desc:'Fast Atlantis waves with dangerous ranged pressure.', pool:['shark','jellyfish','coralwarrior'], baseGold:4200000, shard:14 },
  { id:'astral', name:'Astral Warfront', zone:19, minUnits:250, waves:6, duration:110, color:0xd08cff,
    desc:'The late-game gauntlet. Every wave scales harder than the last.', pool:['starlings','astralguardian'], baseGold:220e9, shard:40 },
];
const expeditionDef=()=>EXPEDITIONS.find(x=>x.id===S.expedition.id)||EXPEDITIONS[0];
const expeditionRewardMult=()=>1+(Math.max(0,Number(S.expedition.difficulty)||1)-1)*0.7;
function expeditionUnlocked(x){return !!x && (S.unlockAll||zoneUnlocked(x.zone)) && soldiers.length>=x.minUnits;}
function expeditionCandidates(x){
  const pool=new Set(x.pool||[]);
  return entities.filter(e=>e.kind==='enemy'&&pool.has(e.typeId)&&e.zone===x.zone&&!e.def.boss&&!e.def.event&&!e.def.war&&!e.def.raid&&!e.roamer&&(!e.alive||e.expedition)&&e.dying<=0);
}
function spawnExpeditionWave() {
  const expedition = expeditionDef();
  const zone = ZONES[expedition.zone];

  if (!zone) return false;

  const wave = S.expedition.wave;
  const needed = Math.min(
    7,
    3 + wave + Math.floor((S.expedition.difficulty - 1) * 1.5)
  );

  const candidates = expeditionCandidates(expedition)
    .sort(() => Math.random() - 0.5);

  if (candidates.length < needed) return false;

  const spawned = [];

  for (let i = 0; i < needed; i++) {
    const e = candidates[i];
    const angle = (i / needed) * Math.PI * 2 + rnd() * 0.5;
    const distance = rr(10, 17);

    e.pos.set(
      clamp(
        player.pos.x + Math.cos(angle) * distance,
        zone.x0 + 3,
        zone.x1 - 3
      ),
      0,
      clamp(
        player.pos.z + Math.sin(angle) * distance,
        zone.z0 + 3,
        zone.z1 - 3
      )
    );

    e.home.copy(e.pos);
    e.alive = true;
    e.mesh.visible = true;
    e.maxHp = e.def.hp;
    e.hp = e.maxHp *
      (1 + 0.18 * (wave - 1)) *
      expeditionRewardMult();
    e.state = 'chase';
    e.target = player;
    e.dying = 0;
    e.respawnAt = Infinity;
    e.expedition = true;
    e.mul = (1 + 0.22 * (wave - 1)) * expeditionRewardMult();
    e.bar.visible = true;
    e.flash = 0;

    spawned.push(e);
  }

  S.expedition.spawned = spawned;
  banner(
    `EXPEDITION WAVE ${wave}/${S.expedition.waves}`,
    `${expedition.name} · ${needed} enemies incoming`
  );
  toast(`Wave ${wave} deployed · wipe it out!`, 'gold', 2600);
  musicStinger(wave >= S.expedition.waves ? 'combo' : 'level');

  return true;
}

function startExpedition(id,difficulty=1){
  const x=EXPEDITIONS.find(q=>q.id===id); difficulty=clamp(Number(difficulty)||1,1,3);
  if(!x||S.expedition.active)return false;
  if(!expeditionUnlocked(x)){toast(`Need ${fmt(x.minUnits)} units and ${ZONES[x.zone].name} unlocked`,'bad');return false;}
  if(!S.expedition.cooldowns)S.expedition.cooldowns={}; const cd=Number(S.expedition.cooldowns[id])||0;
  if(S.time<cd){toast(`${x.name} ready in ${clock(cd-S.time)}`,'bad');return false;}
  teleportTo(x.zone);
  S.expedition={active:true,id,difficulty,wave:1,waves:x.waves,kills:0,goal:0,start:S.time,ends:S.time+x.duration+((difficulty-1)*12),nextWaveAt:S.time,spawned:[],clears:S.expedition.clears||0,best:S.expedition.best||0,cooldowns:S.expedition.cooldowns||{}};
  S.expedition.cooldowns[id]=S.time+95+(difficulty-1)*25;
  if(!spawnExpeditionWave()){S.expedition.active=false;toast('This expedition could not deploy enough enemies in the current world load','bad');return false;}
  setCommandMode('rush'); seasonGainXp(35,'expedition start'); autoSave(); return true;
}
function expeditionFinish(success){
  const x=expeditionDef(), ex=S.expedition;
  const clears=(Number(ex.clears)||0)+(success?1:0); ex.clears=clears; ex.best=Math.max(Number(ex.best)||0,success?ex.wave:0);
  if(success){
    const g=Math.round(x.baseGold*(1+0.55*(ex.wave-1))*expeditionRewardMult()*goldMult());
    addGold(g); addLegacyPoints(x.shard,'Expedition clear'); seasonGainXp(80+ex.wave*20,'expedition clear'); gainCommanderXp(55+ex.wave*12, x.name); ex.best=Math.max(ex.best,x.waves);
    toast(`${x.name} CLEAR · +${fmt(g)} gold · +${x.shard} ◈`,'gold',5200); banner('EXPEDITION CLEAR',`${x.name} · ${ex.waves} waves defeated`); musicStinger('victory');
  } else { toast(`${x.name} failed · ${ex.kills}/${ex.goal} expedition kills`,'bad',3600); }
  for(const e of ex.spawned||[]){if(!e)continue;e.expedition=false;e.mul=1;e.target=null;e.state='idle';e.alive=false;e.mesh.visible=false;e.respawnAt=S.time+3;e.model.body.scale.setScalar(e.model.body.userData.s0??e.model.body.scale.x);}
  if(!S.expedition.cooldowns)S.expedition.cooldowns={}; S.expedition.cooldowns[x.id]=S.time+(success?95:55)+(ex.difficulty-1)*25;
  S.expedition={active:false,id:'',difficulty:1,wave:0,waves:0,kills:0,goal:0,start:0,ends:0,nextWaveAt:0,spawned:[],clears, best:ex.best,cooldowns:S.expedition.cooldowns};
  armyTarget=null; targetRing.visible=false; setCommandMode('follow'); autoSave();
}
function updateExpedition(dt){
  const ex=S.expedition; if(!ex||!ex.active){return;}
  const live=(ex.spawned||[]).filter(e=>e&&e.alive&&e.expedition).length;
  if(!ex.goal)ex.goal=ex.waves*(3+Math.floor((ex.difficulty-1)*1.5));
  if(live===0){
    if(ex.wave>=ex.waves){expeditionFinish(true);return;}
    if(S.time>=ex.nextWaveAt){ex.wave++;ex.nextWaveAt=S.time+2.0;if(!spawnExpeditionWave())expeditionFinish(false);}
  }
  if(S.time>=ex.ends)expeditionFinish(false);
}
function updateExpeditionHud(){
  const el=$('expeditionBox'); if(!el)return;
  const ex=S.expedition; if(S.mode!=='play'||!ex?.active){el.classList.add('hidden');return;} el.classList.remove('hidden');
  const x=expeditionDef(), left=Math.max(0,ex.ends-S.time), live=(ex.spawned||[]).filter(e=>e&&e.alive).length;
  el.innerHTML=`<div class="extitle">${x.name}</div><div class="exsub">Wave ${ex.wave}/${ex.waves} · ${live} foes · ${Math.ceil(left)}s</div>`;
}

// ---------------------------------------------------- V15 SEASON PASS ---
// A free seasonal meta-loop: daily calendar, short reward track, and event shop.
const SEASON = {
  id:'frontier_festival', name:'Frontier Festival', color:0xff6fd8, tierSize:100, maxTier:30,
  daily:[
    {label:'Day 1 Supply Drop',give:{gold:2500},tickets:2},{label:'Day 2 Luck Crate',give:{pot:{luck:1}},tickets:2},
    {label:'Day 3 War Chest',give:{gold:7500},tickets:3},{label:'Day 4 XP Cache',give:{bxp:1200},tickets:3},
    {label:'Day 5 Elite Rations',give:{pot:{exp:1}},tickets:4},{label:'Day 6 Rare Cache',give:{gold:15000,key:{ancient_fragment:1}},tickets:5},
    {label:'Day 7 Commander Cache',give:{gold:25000},tickets:8},
  ],
  tiers:[
    {gold:1000},{tickets:2},{pot:{luck:1}},{gold:2500},{bxp:1000},{tickets:3},{gold:5000},{pot:{exp:1}},{key:{ancient_fragment:1}},{tickets:4},
    {gold:8000},{pot:{mat:1}},{bxp:2500},{tickets:5},{item:'iron_sword'},{gold:12000},{pot:{gold:1}},{tickets:6},{key:{golden_key:1}},{gold:20000},
    {tickets:7},{pot:{luck:2}},{bxp:5000},{gold:30000},{tickets:8},{item:'crystal_armor'},{gold:50000},{tickets:10},{item:'wheel_blade'},{gold:100000,tickets:15},
  ],
  shop:[
    {id:'cache',name:'Festival Cache',cost:5,desc:'8,000 gold + 1 Luck Potion',reward:{gold:8000,pot:{luck:1}}},
    {id:'shards',name:'Command Shards',cost:9,desc:'3 permanent Command Shards',shards:3},
    {id:'xp',name:'Barrack Training Cache',cost:10,desc:'8,000 Barrack XP',reward:{bxp:8000}},
    {id:'luckyblade',name:'Lucky Blade',cost:24,desc:'Rare weapon',item:'wheel_blade'},
    {id:'crystalarmor',name:'Crystal Armor',cost:28,desc:'Rare armor',item:'crystal_armor'},
    {id:'royalcache',name:'Royal Cache',cost:40,desc:'75,000 gold + 3 potions + 2 shards',reward:{gold:75000,pot:{gold:1,luck:1,mat:1}},shards:2},
  ]
};
const seasonToday=()=>{const d=new Date();const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const day=d.getDay();const m=new Date(d.getFullYear(),d.getMonth(),d.getDate()-((day+6)%7));const week=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,'0')}-${String(m.getDate()).padStart(2,'0')}`;return {key,day,week};};
const seasonTier=()=>Math.min(SEASON.maxTier,Math.floor((Number(S.season?.xp)||0)/SEASON.tierSize));
function seasonGainXp(n,reason=''){n=Math.max(0,Number(n)||0);if(!n)return;const before=seasonTier();S.season.xp=Math.max(0,Number(S.season.xp)||0)+n;const after=seasonTier();if(after>before){toast(`FRONTIER PASS TIER ${after} · reward ready`,'gold',3600);banner(`TIER ${after} UNLOCKED`,`${SEASON.name} · claim your reward`);musicStinger('level');}}
function refreshSeasonCalendar(){const t=seasonToday(),se=S.season;if(se.week!==t.week){se.week=t.week;se.weekKills=S.kills;se.weekSold=S.resourcesSold||0;se.weekClaimed=false;}if(!se.lastDay)se.lastDay=t.key;if(!se.claimed)se.claimed={};}
function seasonCalendarClaim(){if(S.mode!=='play')return false;refreshSeasonCalendar();const t=seasonToday(),se=S.season;if(se.claimed[`day:${t.key}`]){toast("Today's festival reward is already claimed",'');return false;}const d=SEASON.daily[t.day===0?6:t.day-1];const prev=new Date();prev.setDate(prev.getDate()-1);const pk=`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}-${String(prev.getDate()).padStart(2,'0')}`;se.streak=se.lastDay===pk?Math.min(7,(Number(se.streak)||0)+1):1;se.lastDay=t.key;se.claimed[`day:${t.key}`]=true;if(d.give)givePrize(d.give,d.label);se.tickets=(Number(se.tickets)||0)+(d.tickets||0);seasonGainXp(35,'daily');toast(`Daily Reward · +${d.tickets} Festival Tickets · streak ${se.streak}/7`,'gold',4200);musicStinger('level');autoSave();return true;}
function seasonWeeklyProgress(){refreshSeasonCalendar();return {kills:Math.max(0,S.kills-S.season.weekKills),sold:Math.max(0,(S.resourcesSold||0)-S.season.weekSold)};}
function seasonClaimWeekly(){refreshSeasonCalendar();const se=S.season,p=seasonWeeklyProgress();if(se.weekClaimed){toast('Weekly Frontier Order already claimed','');return false;}if(p.kills<75||p.sold<150){toast(`Weekly Order needs 75 kills + 150 refined · ${p.kills}/75 · ${p.sold}/150`,'bad');return false;}se.weekClaimed=true;se.tickets=(Number(se.tickets)||0)+12;seasonGainXp(250,'weekly');addLegacyPoints(3,'Weekly Frontier Order');toast('WEEKLY ORDER COMPLETE · +12 Festival Tickets','gold',4500);musicStinger('victory');autoSave();return true;}
function seasonClaimTier(tier){tier=Number(tier)||0;const se=S.season;if(tier<1||tier>SEASON.maxTier)return false;if((Number(se.xp)||0)<tier*SEASON.tierSize){toast(`Tier ${tier} needs ${tier*SEASON.tierSize} Season XP`,'bad');return false;}if(se.claimed[`tier:${tier}`]){toast('That tier is already claimed','');return false;}const reward=SEASON.tiers[tier-1];if(!reward)return false;se.claimed[`tier:${tier}`]=true;if(reward.tickets)se.tickets=(Number(se.tickets)||0)+reward.tickets;const prize={...reward};delete prize.tickets;if(Object.keys(prize).length)givePrize(prize,`Frontier Pass Tier ${tier}`);toast(`Tier ${tier} claimed${reward.tickets?` · +${reward.tickets} Festival Tickets`:''}`,'gold',4200);musicStinger('level');autoSave();return true;}
function seasonBuy(id){const it=SEASON.shop.find(x=>x.id===id);if(!it)return false;const se=S.season;if((Number(se.tickets)||0)<it.cost){toast(`Need ${it.cost} Festival Tickets`,'bad');return false;}se.tickets-=it.cost;if(it.shards)addLegacyPoints(it.shards,`${it.name} purchase`);if(it.reward)givePrize(it.reward,it.name);if(it.item){grantItem(it.item,player.pos);toast(`Purchased ${ITEMS[it.item].name}`,'gold',3200);}burst(player.pos,SEASON.color,24);musicStinger('legendary');autoSave();return true;}
function updateSeason(){if(S.mode!=='play')return;refreshSeasonCalendar();const p=seasonWeeklyProgress();if(!S.season.weekClaimed&&p.kills>=75&&p.sold>=150&&S.time-(S.season.bonusAt||0)>8){S.season.bonusAt=S.time;toast('WEEKLY ORDER READY · open Season to claim','gold',3000);}}
function updateSeasonHud(){const el=$('seasonBox');if(!el)return;if(S.mode!=='play'){el.classList.add('hidden');return;}el.classList.remove('hidden');const tier=seasonTier(),xp=Number(S.season.xp)||0,p=seasonWeeklyProgress(),claimed=!!S.season.claimed[`day:${seasonToday().key}`];const pct=tier>=SEASON.maxTier?100:(xp%SEASON.tierSize)/SEASON.tierSize*100;el.innerHTML=`<div class="season-kicker">${SEASON.name.toUpperCase()}</div><div class="season-title">TIER ${tier}/${SEASON.maxTier} · ✦ ${fmt(S.season.tickets||0)}</div><div class="season-bar"><i style="width:${pct}%"></i></div><div class="season-meta">${tier>=SEASON.maxTier?'MAX TIER':`${fmt(xp-tier*SEASON.tierSize)}/${SEASON.tierSize} XP`} · Daily ${claimed?'CLAIMED':'READY'} · Week ${p.kills}/75</div>`;}

const RELIC_DEFS = [
  {id:'sun_relic', name:'Sun Relic', kind:'gold', zone:4, x:352, z:33, color:0xffc83d, desc:'+6% gold'},
  {id:'moon_relic', name:'Moon Relic', kind:'luck', zone:5, x:126, z:112, color:0xb7a7ff, desc:'+5% luck'},
  {id:'storm_relic', name:'Storm Relic', kind:'dmg', zone:17, x:1038, z:-31, color:0x8fe0ff, desc:'+5% damage'},
  {id:'void_relic', name:'Void Relic', kind:'loot', zone:15, x:846, z:31, color:0x7affb0, desc:'+4% material yield and +3% bag'},
  {id:'astral_relic', name:'Astral Relic', kind:'hp', zone:19, x:1203, z:-29, color:0xd08cff, desc:'+8% troop health'},
  {id:'war_relic', name:'War Relic', kind:'speed', zone:18, x:1082, z:-30, color:0xff6fd8, desc:'+6% troop speed'},
];
const relicBonus = (kind) => (Object.values(S.relics || {}).length ? RELIC_DEFS.filter(r => r.kind === kind && S.relics[r.id]).length : 0);
const accV = (slot) => (S[slot] ? ITEMS[S[slot]].v : 0);
const legacyLevel = () => Math.floor((S.legacy?.lifetime || 0) / 10);
const legacyBonus = (id) => Number(S.legacy?.upgrades?.[id]) || 0;
const luckMult = () => (1 + 0.03 * Object.keys(S.lootDisc).length + 0.02 * Object.keys(S.disc).length) * (1 + accV('hat')) * (1 + petBonus('luck') + resV('luck') + legacyBonus('scout') * 0.02 + commanderLuck()) * (1 + relicBonus('luck') * 0.05);

const comboGoldMult = () => 1 + Math.min(0.35, Math.max(0, S.momentum) * 0.035);
const directorGoldMult = () => (S.director?.active ? (S.director.bonus || 1) : 1);
const goldMult = () => (S.potions.gold > 0 ? 2 : 1) * (1 + accV('belt')) * (1 + petBonus('gold') + resV('gold') + legacyBonus('war_chest') * 0.03 + commanderGold()) * (1 + relicBonus('gold') * 0.06) * rebirthGold() * comboGoldMult() * directorGoldMult() * (S.randomEvent?.kind === 'golden_hour' ? 1.75 : 1);
const matMult = () => ITEMS[S.wand].mult * (S.potions.mat > 0 ? 2 : 1) * (1 + legacyBonus('scout') * 0.015 + commanderMats()) * (1 + relicBonus('loot') * 0.04);
const unitCount = () => soldiers.length;
const packCap = () => Math.floor(ITEMS[S.bag].cap * (1 + resV('bag') + commanderBag()) * (1 + legacyBonus('quartermaster') * 0.05) * (1 + relicBonus('loot') * 0.03));
const entities = [];
const soldiers = [];
const projectiles = [];
const coins = [];
const effects = [];
const gateObjs = [];
const npcObjs = [];
const PADS = [];
const PLOTS = [];
const captureObjs = [];
let armyTarget = null;

// Rebirth controls only the roaming-boss layer. Regular area/summon bosses
// are available normally; roaming bosses awaken after the third rebirth.
// Unlock-all codes still bypass the roaming-boss gate for testing/legacy saves.
const BOSS_REBIRTH_REQ = 3;
// Rebirth 3 gates ONLY roaming bosses. Normal area and summoned bosses
// continue to use their existing world/gate/summon requirements.
const bossUnlocked = () => true;
const roamingBossUnlocked = () => !!S.unlockAll || Number(S.rebirths || 0) >= BOSS_REBIRTH_REQ;
const gateRebirthUnlocked = (g) => !!S.unlockAll || Number(S.rebirths || 0) >= Number(g.rebirthReq || 0);
function normalizeBossLocks() {
  for (const e of entities) {
    if (!e?.def?.boss) continue;
    if (e.def.roaming || e.roamer) {
      if (!roamingBossUnlocked()) {
        e.alive = false;
        e.mesh.visible = false;
        e.target = null;
        e.dying = 0;
        e.respawnAt = Infinity;
      }
      continue;
    }
    e.bossLocked = false;
    if (e.tag) e.tag.visible = !!e.mesh?.visible;
  }
}

function unlockBosses() {
  if (!roamingBossUnlocked()) {
    normalizeBossLocks();
    return 0;
  }
  let count = 0;
  let roaming = 0;
  for (const e of entities) {
    if (!e || e.kind !== 'enemy' || !e.def?.boss) continue;
    if (e.roamer || e.def.roaming) {
      e.bossLocked = false;
      if (!e.alive && !e.dying) {
        e.mesh.visible = false;
        e.respawnAt = S.time + 8;
      }
      roaming++;
      continue;
    }
    if (!e.bossLocked) continue;
    e.bossLocked = false;
    e.alive = true; e.mesh.visible = true; e.hp = e.maxHp; e.respawnAt = 0;
    e.state = 'idle'; e.target = null; e.dying = 0;
    if (e.tag) e.tag.visible = true;
    count++;
  }
  if ((count || roaming) && S.mode === 'play') {
    banner('ROAMING BOSS HUNT UNLOCKED', 'Three rebirths complete · roaming bosses can now enter the world');
    toast(`${roaming ? 3 : 0} roaming bosses awakened${count ? ` · ${count} regular bosses refreshed` : ''}`, 'gold', 4800);
    musicStinger('victory');
    autoSave();
  }
  return count + roaming;
}

const REBIRTH_UNLOCKS = [
  [1, 'Mushroom Forest + Mine', 'Side-world areas begin opening behind rebirth gates'],
  [2, 'Ouroboros + Crab Cave', 'Secret progression and stronger side content'],
  [3, 'BOSSES + Magic Forest', 'Bosses awaken and boss-focused progression begins'],
  [4, 'Volcano', 'High-tier frontier opens'],
  [5, 'Alien Realm', 'Alien tech and stronger loot become reachable'],
  [6, 'Deep Forest', 'Ancient enemies and relic hunting'],
  [7, 'Shocked Forest', 'Storm enemies and late-game gear'],
  [8, 'Uranian Citadel', 'Citadel-tier army and gear'],
  [10, 'Celestial Frontier', 'Final astral frontier'],
];


// --------------------------------------------------------- V4 WORLD ---
const annexGateObjs = [];
const DISP_OBJS = [];
let fencePosts = null, fenceN = 0;
const m4f = new THREE.Matrix4();
function fenceLine(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0); if (len < 0.5) return;
  const n = Math.max(1, Math.round(len / 4));
  for (let i = 0; i <= n; i++) {
    if (fenceN >= 2000) break;
    const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n;
    m4f.compose(new THREE.Vector3(x, 0.8, z), new THREE.Quaternion(), new THREE.Vector3(0.4, 1.6, 0.4)); fencePosts.setMatrixAt(fenceN++, m4f);
  }
  for (const y of [0.6, 1.2]) part(G.box, 0x9a6a3a, Math.abs(x1 - x0) + 0.15, 0.18, Math.abs(z1 - z0) + 0.15, (x0 + x1) / 2, y, (z0 + z1) / 2, scene);
}
function buildFences() {
  fencePosts = new THREE.InstancedMesh(G.box, mat(0x8a5a2e), 2000);
  const zs = Z_MIN - 1, zn = Z_MAX + 1;
  fenceLine(X_MIN - 1, zs, X_MAX + 1, zs);
  fenceLine(X_MIN - 1, zs, X_MIN - 1, zn); fenceLine(X_MAX + 1, zs, X_MAX + 1, zn);
  // north side with openings for the side areas
  let x = X_MIN - 1;
  for (const g of [...ANNEX_GATES].sort((a, b) => a.x - b.x)) { fenceLine(x, zn, g.x - 4, zn); x = g.x + 4; }
  fenceLine(x, zn, X_MAX + 1, zn);
  for (const g of ANNEX_GATES) {
    const Z = ZONES[g.zone];
    // corridor walls
    for (const sx of [-4, 4]) part(G.box, 0x6d6d75, 1.2, 3.4, 13, g.x + sx, 1.7, 51, scene);
    // annex fence
    fenceLine(Z.x0, Z.z0, g.x - 4, Z.z0); fenceLine(g.x + 4, Z.z0, Z.x1, Z.z0);
    fenceLine(Z.x0, Z.z0, Z.x0, Z.z1); fenceLine(Z.x1, Z.z0, Z.x1, Z.z1); fenceLine(Z.x0, Z.z1, Z.x1, Z.z1);
  }
  fencePosts.count = fenceN; fencePosts.castShadow = true; scene.add(fencePosts);
}
function addZonePad(st) {
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.25, 32), new THREE.MeshLambertMaterial({ color: st.color, emissive: st.color, emissiveIntensity: 0.35 }));
  pad.position.set(st.x, 0.13, st.z); scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  ring.rotation.x = Math.PI / 2; ring.position.set(st.x, 0.3, st.z); scene.add(ring);
  if (st.stall !== false) {
    for (const [dx, dz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) part(G.box, 0x6b4217, 0.3, 3.8, 0.3, st.x + dx, 1.9, st.z + dz, scene);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 1.6, 4), mat(st.roof || st.color)); roof.position.set(st.x, 4.6, st.z); roof.rotation.y = Math.PI / 4; scene.add(roof);
  }
  const lbl = makeLabel(st.name, '#1b2140', hex(st.color), 36); lbl.position.set(st.x, st.stall === false ? 3.4 : 6.2, st.z); scene.add(lbl);
  const p = { ...st, bx: 1e9, bz: 1e9, pad, ring, lbl, inside: false };
  PADS.push(p); return p;
}
function buildAnnexes() {
  for (const g of ANNEX_GATES) {
    const Z = ZONES[g.zone];
    const gr = new THREE.Mesh(new THREE.BoxGeometry(Z.x1 - Z.x0, 1, Z.z1 - Z.z0), mat(Z.ground)); gr.position.set((Z.x0 + Z.x1) / 2, -0.47, (Z.z0 + Z.z1) / 2); gr.receiveShadow = true; scene.add(gr);
    const cor = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 14), mat(0x7a6a55)); cor.position.set(g.x, -0.46, 50.5); cor.receiveShadow = true; scene.add(cor);
    const path = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, Z.z1 - Z.z0 - 10), mat(new THREE.Color(Z.ground).multiplyScalar(1.25).getHex())); path.position.set(g.x, 0.04, (Z.z0 + Z.z1) / 2 - 3); scene.add(path);
    // gate across the corridor
    const bars = new THREE.Group();
    const bm = new THREE.MeshLambertMaterial({ color: 0xff4d4d, emissive: 0xff2020, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
    for (let x = -3; x <= 3; x += 1.2) part(G.box, 0, 0.35, 6, 0.35, g.x + x, 3, g.z, bars, bm);
    part(G.box, 0, 7.4, 0.4, 0.4, g.x, 5.8, g.z, bars, bm);
    scene.add(bars);
    part(G.box, 0x4a4a52, 9.6, 1.2, 1.4, g.x, 7.2, g.z, scene);
    const sign = makeLabel(g.text, '#ffffff', 'rgba(140,20,30,0.92)', 30); sign.position.set(g.x, 9, g.z - 1); scene.add(sign);
    const o = { ...g, bars, sign, open: false, anim: 0 };
    annexGateObjs.push(o);
    if (g.req.gold) addZonePad({ id: 'annexgate', panel: 'annexgate', tab: annexGateObjs.length - 1, name: g.zone === 6 ? 'ACTIVATE' : 'PAY TOLL', x: g.x, z: 40, color: 0xb36bff, stall: false });
  }
  // Ouroboros: the snake ring and obelisks
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 1.6, 10, 40), new THREE.MeshLambertMaterial({ color: 0x5ac85a, flatShading: true }));
  ring.position.set(300, 9, 118); scene.add(ring);
  part(G.box, 0x5ac85a, 2.6, 2.2, 3, 300, 18.2, 118, scene);
  effects.push({ persistent: true, update: (dt) => { ring.rotation.z += dt * 0.25; } });
  for (const [x, z] of [[272, 66], [328, 66], [272, 118], [328, 92], [280, 100]]) { part(G.box, 0x3a2a1a, 1.6, 8, 1.6, x, 4, z, scene); part(G.oct, 0xff8a3d, 0.9, 1.2, 0.9, x, 8.8, z, scene, new THREE.MeshBasicMaterial({ color: 0xff8a3d })); }
  // two mysterious fragments at the Ouroboros entrance
  const frags = [];
  for (const sx of [-6.5, 6.5]) { const f = part(G.oct, 0, 0.9, 1.5, 0.9, 300 + sx, 4, 44, scene, new THREE.MeshLambertMaterial({ color: 0x555566, emissive: 0x000000 })); frags.push(f); }
  effects.push({ persistent: true, update: (dt, t) => { const on = annexGateObjs[1] && annexGateObjs[1].open; for (const f of frags) { f.rotation.y += dt * (on ? 2 : 0.4); f.position.y = 4 + Math.sin(t * 2) * 0.3; f.material.emissive.set(on ? 0xb36bff : 0x000000); f.material.color.set(on ? 0xd09bff : 0x555566); } } });
  // Magic Forest: purple trees, floating crystals, fireflies
  const fz = ZONES[7];
  for (let i = 0; i < 40; i++) {
    const x = rr(fz.x0 + 3, fz.x1 - 3), z = rr(fz.z0 + 3, fz.z1 - 3); if (Math.abs(x - 382) < 8 || z < fz.z0 + 22 || PADS.some((p) => dist2(p, { x, z }) < 64) || ALTARS.some((p) => dist2(p, { x, z }) < 100)) continue;
    const t = buildTree([0x7a4fd8, 0x4fae8a, 0xd05aff][i % 3], rr(1.4, 2.4)); t.root.position.set(x, 0, z); scene.add(t.root);
  }
  const flies = [], flyGeo = new THREE.SphereGeometry(0.12, 6, 4), flyMat = new THREE.MeshBasicMaterial({ color: 0xfff28a });
  for (let i = 0; i < 70; i++) { const zz = rnd() < 0.5 ? ZONES[5] : fz; const f = new THREE.Mesh(flyGeo, flyMat); f.position.set(rr(zz.x0, zz.x1), rr(1, 6), rr(zz.z0, zz.z1)); f.userData.p = rnd() * 6; scene.add(f); flies.push(f); }
  effects.push({ persistent: true, update: (dt, t) => { for (const f of flies) { f.position.y += Math.sin(t * 1.5 + f.userData.p) * dt * 0.6; f.position.x += Math.cos(t + f.userData.p) * dt * 0.5; } } });
  // decor between the side areas: mountains
  for (let x = 90; x < 430; x += rr(8, 12)) { const t = buildTree(0x2f6a2f, rr(1.4, 2.2)); t.root.position.set(x, 0, rr(132, 142)); scene.add(t.root); }
  // zone shops, crafter, accessories, enchanter, Mushy
  addZonePad({ id: 'accessories', name: 'ACCESSORIES', x: 124, z: -12, color: 0x9f7bff });
  addZonePad({ id: 'crafter', name: 'CRAFTER', x: 140, z: 68, color: 0xb36bff });
  addZonePad({ id: 'weapons', name: 'MUSHROOM SHOP', x: 176, z: 68, color: 0xff5a8a });
  addZonePad({ id: 'mushy', name: 'MUSHY', x: 128, z: 96, color: 0xffe066, stall: false });
  addZonePad({ id: 'enchant', name: 'ENCHANTER', x: 288, z: 72, color: 0xd05aff });
  addZonePad({ id: 'weapons', name: 'DESERT GEAR', x: 312, z: 72, color: 0xe6c77a });
  addZonePad({ id: 'weapons', name: 'ARCANE SHOP', x: 368, z: 72, color: 0xd05aff });
  addZonePad({ id: 'armor', name: 'ARCANE ARMOR', x: 396, z: 72, color: 0x7a4fd8 });
  addZonePad({ id: 'teleport', name: 'TELEPORT', x: -12, z: 0, color: 0x4af0e0, stall: false });
  const mushy = withCap(makeAvatar({ shirt: 0xf2e6d0, pants: 0xb5a58a, skin: 0xf2e6d0, scale: 0.9 }), 0xff5a8a);
  mushy.root.position.set(128, 0, 101); scene.add(mushy.root);
  const ench = makeAvatar({ shirt: 0x6b3fd8, pants: 0x3d2466, hat: 0x3d2466, weapon: 'staff', skin: 0xc9965a });
  ench.root.position.set(288, 0, 77); scene.add(ench.root);
  // dispensers
  DISPENSERS.forEach((d, i) => {
    const g = new THREE.Group(); g.position.set(d.x, 0, d.z - 3.4); scene.add(g);
    part(G.box, 0xd9352b, 2.6, 4, 1.8, 0, 2, 0, g);
    part(G.box, 0xffe066, 1.6, 1.2, 0.1, 0, 2.8, 0.92, g, new THREE.MeshBasicMaterial({ color: 0xffe066 }));
    part(G.box, 0x1b1b1b, 1.2, 0.3, 0.1, 0, 1.2, 0.92, g);
    const coin = part(G.cyl, 0xffc83d, 1, 0.2, 1, 0, 4.9, 0, g, new THREE.MeshLambertMaterial({ color: 0xffc83d, emissive: 0x8a5d00, emissiveIntensity: 0.5 })); coin.rotation.x = Math.PI / 2;
    const p = addZonePad({ id: 'dispenser', idx: i, name: 'DISPENSER', x: d.x, z: d.z, color: 0xffc83d, stall: false });
    DISP_OBJS.push({ ...d, g, coin, p });
  });
  effects.push({ persistent: true, update: (dt) => { for (const o of DISP_OBJS) { const ready = S.time >= (S.disp[o.zone] || 0); o.coin.rotation.z += dt * (ready ? 3 : 0.3); o.coin.visible = ready; } } });
  // altars
  ALTARS.forEach((a, i) => {
    part(G.cyl, 0x3a2a4a, 7, 0.6, 7, a.x, 0.3, a.z, scene);
    for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2; part(G.box, a.color, 0.6, 2.4, 0.6, a.x + Math.cos(ang) * 3.6, 1.2, a.z + Math.sin(ang) * 3.6, scene, new THREE.MeshLambertMaterial({ color: a.color, emissive: a.color, emissiveIntensity: 0.4 })); }
    if (a.id === 'throne') { part(G.box, 0xffb000, 2.4, 1.2, 2, a.x, 1.2, a.z + 2.4, scene); part(G.box, 0xffb000, 2.4, 3.6, 0.5, a.x, 2.4, a.z + 3.4, scene); }
    addZonePad({ id: 'altar', panel: 'altar', tab: i, name: a.name.toUpperCase(), x: a.x, z: a.z - 6, color: a.color, stall: false });
  });
  // Mushroom Forest decor: giant glowing mushrooms + cave arch
  const mz = ZONES[5];
  for (let i = 0; i < 34; i++) {
    const side = i % 4, t = rnd();
    const x = side === 0 ? mz.x0 + rr(2, 5) : side === 1 ? mz.x1 - rr(2, 5) : mz.x0 + t * (mz.x1 - mz.x0);
    const z = side === 2 ? mz.z1 - rr(2, 5) : side === 3 ? mz.z0 + rr(8, 12) : mz.z0 + 10 + t * (mz.z1 - mz.z0 - 12);
    if (Math.abs(x - 160) < 8 || PADS.some((p) => dist2(p, { x, z }) < 50)) continue;
    const c = [0xff5a8a, 0x5ad0ff, 0xb36bff, 0xffe066][i % 4], h = rr(4, 10);
    part(G.cyl, 0xf2e6d0, 0.8, h, 0.8, x, h / 2, z, scene);
    part(G.sph, c, rr(3, 5.5), rr(1.4, 2.2), rr(3, 5.5), x, h, z, scene, new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.45 }));
  }
  for (const sx of [-1, 1]) part(G.dod, 0x4a4050, 4, 6, 4, 160 + sx * 6, 3, 45.5, scene, new THREE.MeshLambertMaterial({ color: 0x4a4050, flatShading: true }));
  part(G.box, 0x4a4050, 14, 3, 4, 160, 7, 45.5, scene, new THREE.MeshLambertMaterial({ color: 0x4a4050, flatShading: true }));
}
function inRegion(p) {
  if (p.x >= X_MIN && p.x <= X_MAX && p.z >= Z_MIN && p.z <= Z_MAX) return true;
  for (const g of annexGateObjs) {
    if (Math.abs(p.x - g.x) <= 3.1 && p.z > Z_MAX - 0.5 && p.z <= 58.5) { if (p.z < g.z - 0.9 || g.open) return true; }
    const Z = ZONES[g.zone];
    if (g.open && p.x >= Z.x0 + 0.6 && p.x <= Z.x1 - 0.6 && p.z >= Z.z0 && p.z <= Z.z1 - 0.6) return true;
  }
  return false;
}
const zoneUnlocked = (z) =>
  !!S.unlockAll ||
  z === 0 ||
  gateObjs.some((g) => g.zone === z && g.open) ||
  annexGateObjs.some((g) => g.zone === z && g.open);
const zoneSpawn = (z) => { const Z = ZONES[z]; if (Z.annex) { const g = ANNEX_GATES.find((x) => x.zone === z); return { x: g.x, z: Z.z0 + 4 }; } return z === 0 ? { x: 0, z: 4 } : { x: Z.x0 + 5, z: 0 }; };

// --------------------------------------------------------------- WORLD ---

function buildV11World() {
  const glow = (x,y,z,color,size=0.6) => part(G.oct,color,size,size*1.8,size,x,y,z,scene,new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.85}));
  for (let x=748;x<814;x+=8) { const h=rr(3,10); const r=part(G.cone,0x3a2525,rr(2,4),h,rr(2,4),x,h/2,rr(-36,36),scene,new THREE.MeshLambertMaterial({color:0x3a2525,flatShading:true})); r.rotation.y=rnd()*3; if(rnd()<0.65) glow(x+rr(-1.5,1.5),h+1,r.position.z,0xff5a24,0.7); }
  const lava=part(G.box,0xff4b1f,54,0.1,7,781,0.06,0,scene,new THREE.MeshLambertMaterial({color:0xff4b1f,emissive:0xaa1d00,emissiveIntensity:1,transparent:true,opacity:0.85}));
  effects.push({persistent:true,update:(dt,t)=>{lava.material.emissiveIntensity=0.7+Math.sin(t*3)*0.25;}});
  for(let i=0;i<18;i++){const x=rr(826,894),z=rr(-38,38);part(G.box,0x294c52,0.8,rr(3,7),0.8,x,rr(1.5,3.5),z,scene);glow(x,rr(4,7),z,i%2?0x39e6ff:0x7affb0,0.45);}
  for(let i=0;i<16;i++){const x=rr(906,974),z=rr(-40,40);const t=buildTree(0x315a3a,rr(2,3.2));t.root.position.set(x,0,z);scene.add(t.root);}
  const pylons=[];for(let i=0;i<9;i++){const x=rr(986,1055),z=rr(-36,36);pylons.push(part(G.box,0x4b6575,0.8,6,0.8,x,3,z,scene));glow(x,6.5,z,0xb8eaff,0.55);} effects.push({persistent:true,update:(dt)=>{for(const p of pylons)p.rotation.y+=dt*0.15;}});
  for(let i=0;i<20;i++){const x=rr(1066,1132),z=rr(-38,38);part(G.box,0x3c3155,1.4,rr(2,8),1.4,x,rr(1,4),z,scene);glow(x,rr(4,9),z,i%2?0x9f7bff:0x62ffde,0.45);}
  part(G.box,0x6953a3,10,10,10,1100,5,0,scene);glow(1100,12,0,0x62ffde,2.4);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(12,0.35,8,50),new THREE.MeshBasicMaterial({color:0x9f7bff,transparent:true,opacity:0.7}));ring.position.set(1100,12,0);scene.add(ring);effects.push({persistent:true,update:(dt)=>{ring.rotation.z+=dt*0.35;}});
  for(let i=0;i<75;i++) glow(rr(1144,1215),rr(1,10),rr(-42,42),i%3?0xd08cff:0xffe8a6,rr(0.12,0.35));
  const starRing=new THREE.Mesh(new THREE.TorusGeometry(15,0.55,10,60),new THREE.MeshBasicMaterial({color:0xffe8a6,transparent:true,opacity:0.75}));starRing.position.set(1180,10,0);scene.add(starRing);effects.push({persistent:true,update:(dt)=>{starRing.rotation.x+=dt*0.18;starRing.rotation.y+=dt*0.24;}});
  for(const [x,label] of [[781,'INFERNO GATE'],[860,'ALIEN SIGNAL'],[940,'ANCIENT GATE'],[1020,'STORM CORE'],[1100,'URAN COMMAND'],[1180,'STARFALL']]){const l=makeLabel(label,'#ffffff','rgba(26,18,45,0.9)',28);l.position.set(x,13,0);scene.add(l);}
}
function buildWorld() {
  for (const z of ZONES) {
    if (z.annex) continue;
    const w = z.x1 - z.x0;
    const g = new THREE.Mesh(new THREE.BoxGeometry(w, 1, 120), mat(z.ground));
    g.position.set(z.x0 + w / 2, -0.5, 0); g.receiveShadow = true; scene.add(g);
  }
  const outer = new THREE.Mesh(new THREE.BoxGeometry(1200, 1, 500), mat(0x5aa83e));
  outer.position.set(330, -0.52, 0); outer.receiveShadow = true; scene.add(outer);
  const path = new THREE.Mesh(new THREE.BoxGeometry(X_MAX - 10, 0.05, 6), mat(0xc9a66b));
  path.position.set((X_MAX + 10) / 2 - 5, 0.01, 0); path.receiveShadow = true; scene.add(path);
  // base plaza
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(46, 0.1, 46), mat(0xbfb8a8));
  plaza.position.set(-5, 0.03, 0); plaza.receiveShadow = true; scene.add(plaza);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if ((i + j) % 2 === 0) {
    const t = new THREE.Mesh(G.box, mat(0xada594)); t.scale.set(3.8, 0.02, 3.8);
    t.position.set(-5 - 23 + 1.9 + i * 3.83, 0.09, -23 + 1.9 + j * 3.83); t.receiveShadow = true; scene.add(t);
  }
  buildFences();
  const m4 = new THREE.Matrix4();

  // scenery outside the fence
  for (let x = X_MIN - 10; x < X_MAX + 20; x += rr(6, 10)) {
    const zi = zoneAt(clamp(x, X_MIN, X_MAX));
    if (zi >= 8) continue;
    if (zi === 3 && rnd() < 0.7) continue;
    const north = x < 100;
    if (zi === 4) { for (const zz of [Z_MIN - rr(5, 12)]) { const c = buildCoral(); c.root.position.set(x, 0, zz); c.root.scale.setScalar(rr(1.5, 2.5)); scene.add(c.root); } continue; }
    if (zi === 2) { for (const zz of [Z_MIN - rr(8, 16)]) { const m = new THREE.Mesh(new THREE.ConeGeometry(rr(6, 11), rr(10, 22), 5), new THREE.MeshLambertMaterial({ color: 0x8a8f80, flatShading: true })); m.position.set(x, 5, zz); scene.add(m); } continue; }
    const leaf = zi === 3 ? 0x8aa84a : zi === 1 ? 0x3f9a3a : 0x4fae3a;
    for (const zz of north ? [Z_MAX + rr(6, 14), Z_MIN - rr(6, 14)] : [Z_MIN - rr(6, 14)]) { const t = buildTree(leaf, rr(1.2, 2)); t.root.position.set(x, 0, zz); scene.add(t.root); }
  }
  // grass tufts & flowers
  const tuft = new THREE.InstancedMesh(G.box, mat(0xffffff), 1100);
  let ti = 0;
  for (let i = 0; i < 1100; i++) {
    const x = rr(-28, 258), z = rr(Z_MIN, Z_MAX);
    if (Math.abs(z) < 4 || (x < 18 && Math.abs(z) < 24)) continue;
    const zi = zoneAt(x);
    const c = zi === 2 ? 0x7a8a6a : zi === 1 ? 0x3f9a3a : 0x58a83a;
    m4.compose(new THREE.Vector3(x, 0.2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 3, 0)), new THREE.Vector3(0.25, rr(0.3, 0.6), 0.25));
    tuft.setMatrixAt(ti, m4); tuft.setColorAt(ti, new THREE.Color(c)); ti++;
  }
  tuft.count = ti; scene.add(tuft);
  const flowers = new THREE.InstancedMesh(G.box, mat(0xffffff), 260);
  const fc = [0xff6fa0, 0xffe066, 0xffffff, 0x4aa3ff];
  for (let i = 0; i < 260; i++) {
    let x = rr(-28, 178), z = rr(Z_MIN, Z_MAX);
    if (x < 18 && Math.abs(z) < 24) z = Z_MAX - rnd() * 18;
    m4.compose(new THREE.Vector3(x, 0.15, z), new THREE.Quaternion(), new THREE.Vector3(0.3, 0.3, 0.3));
    flowers.setMatrixAt(i, m4); flowers.setColorAt(i, new THREE.Color(fc[i % 4]));
  }
  scene.add(flowers);

  // Riverlands: river with two bridges and a waterfall
  const water = new THREE.Mesh(new THREE.BoxGeometry(9, 0.1, 110), new THREE.MeshLambertMaterial({ color: 0x3a9fe0, emissive: 0x1a4f80, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 }));
  water.position.set(136, 0.04, 0); scene.add(water);
  effects.push({ persistent: true, update: (dt, t) => { water.material.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.08; } });
  for (const bz of [0, 23]) {
    part(G.box, 0x9a6a3a, 11, 0.4, 6, 136, 0.3, bz, scene);
    for (const side of [-1, 1]) { part(G.box, 0x6b4217, 11, 0.8, 0.3, 136, 1, bz + side * 3, scene); for (const px of [131, 136, 141]) part(G.box, 0x6b4217, 0.4, 1.4, 0.4, px, 0.7, bz + side * 3, scene); }
  }
  part(G.box, 0x7a7a80, 16, 16, 4, 136, 8, Z_MAX + 4, scene);
  const fall = part(G.box, 0x6fc3ff, 7, 15, 0.6, 136, 7.5, Z_MAX + 1.8, scene, new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x3a9fe0, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 }));
  effects.push({ persistent: true, update: (dt, t) => { fall.material.opacity = 0.75 + Math.sin(t * 6) * 0.1; } });

  // Mountains: cliffs and a ramp
  for (let i = 0; i < 14; i++) {
    const cx = rr(186, 256), cz = (rnd() < 0.5 ? -1 : 1) * rr(30, 42);
    const c = part(G.dod, 0x8a8f80, rr(3, 6), rr(3, 8), rr(3, 6), cx, 1.5, cz, scene, new THREE.MeshLambertMaterial({ color: 0x8a8f80, flatShading: true }));
    c.rotation.y = rnd() * 3;
  }
  // Desert: pyramid & dunes
  const pyr = new THREE.Mesh(new THREE.ConeGeometry(14, 14, 4), new THREE.MeshLambertMaterial({ color: 0xd9b86a, flatShading: true }));
  pyr.position.set(300, 7, 36); pyr.rotation.y = Math.PI / 4; pyr.castShadow = true; scene.add(pyr);
  for (let i = 0; i < 30; i++) {
    const d = part(G.sph, 0xdcb86a, rr(4, 9), rr(0.6, 1.4), rr(3, 7), rr(265, 335), 0, rr(Z_MIN + 3, Z_MAX - 3), scene);
    if (Math.abs(d.position.z) < 6) d.position.z += 12 * Math.sign(d.position.z || 1);
    if (Math.abs(d.position.x - 300) < 16 && d.position.z > 20) d.position.z -= 30;
    d.castShadow = false;
  }
  // Atlantis: seaweed, coral, bubbles and ruins
  for (let i = 0; i < 40; i++) {
    const x = rr(344, 416), z = rr(Z_MIN + 2, Z_MAX - 2);
    if (Math.abs(z) < 5) continue;
    part(G.box, 0x2f8a4a, 0.3, rr(1.5, 3.5), 0.3, x, 1, z, scene);
  }
  for (const [x, z] of [[360, 30], [372, 34], [410, -32], [398, 36]]) { part(G.box, 0xc9d6e0, 1.6, 7, 1.6, x, 3.5, z, scene); part(G.box, 0xc9d6e0, 2.2, 0.6, 2.2, x, 7.2, z, scene); }
  const bubGeo = new THREE.SphereGeometry(0.18, 8, 6), bubMat = new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.6 });
  const bubbles = [];
  for (let i = 0; i < 60; i++) { const b = new THREE.Mesh(bubGeo, bubMat); b.position.set(rr(342, 418), rr(0, 12), rr(Z_MIN, Z_MAX)); scene.add(b); bubbles.push(b); }
  effects.push({ persistent: true, update: (dt) => { for (const b of bubbles) { b.position.y += dt * 1.5; if (b.position.y > 14) b.position.y = 0; } } });

  // unit gates
  for (const gd of GATES) {
    const wallC = gd.zone >= 8 ? ([0xd8e8f0, 0x5a5070, 0x6a8a4a, 0xcfe0f0, 0xff5a24, 0x39e6ff, 0x315a3a, 0x5f9bff, 0xb59cff, 0xffe8a6][gd.zone - 8] ?? 0x6d6d75) : gd.zone === 4 ? 0x6f9fb0 : gd.zone === 3 ? 0xc9a66b : gd.zone === 2 ? 0x7a7a80 : 0x8a8a92;
    for (const side of [-1, 1]) {
      const len = Z_MAX - 5;
      part(G.box, wallC, 2, 4, len, gd.x, 2, side * (5 + len / 2), scene);
      for (let z = 6; z < Z_MAX; z += 3) part(G.box, wallC, 2.2, 0.8, 1.2, gd.x, 4.4, side * z, scene);
      part(G.box, 0x6d6d75, 3, 7, 3, gd.x, 3.5, side * 5.5, scene);
      part(G.box, 0x6d6d75, 3.4, 0.8, 3.4, gd.x, 7.4, side * 5.5, scene);
    }
    const bars = new THREE.Group();
    const bm = new THREE.MeshLambertMaterial({ color: 0xff4d4d, emissive: 0xff2020, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
    for (let z = -3.6; z <= 3.6; z += 1.2) part(G.box, 0, 0.35, 6, 0.35, gd.x, 3, z, bars, bm);
    part(G.box, 0, 0.4, 0.4, 8, gd.x, 5.8, 0, bars, bm);
    scene.add(bars);
    const sign = makeLabel(`${ZONES[gd.zone].name}: ${gd.req} Units${gd.boss ? ' + ' + ENEMIES[gd.boss].name : ''}`, '#ffffff', 'rgba(140,20,30,0.92)', 32);
    sign.position.set(gd.x - 1.4, 8.2, 0); scene.add(sign);
    gateObjs.push({ ...gd, label: `${gd.req} units`, bars, sign, open: false, anim: 0 });
  }
  // code signs
  for (const cs of CODE_SIGNS) {
    part(G.box, 0x6b4217, 0.3, 2.2, 0.3, cs.x, 1.1, cs.z, scene);
    const l = makeLabel(`CODE: ${cs.code}`, '#1b2140', '#ffe066', 30);
    l.position.set(cs.x, 2.8, cs.z); scene.add(l);
  }

  buildAnnexes();
  buildBase();
  buildV5World();
  buildV11World();
}

function buildBase() {
  const stations = [
    { id: 'sell',     name: 'SELL',        x: -20, z: -12, color: 0xffc83d, roof: 0xd99a12 },
    { id: 'bags',     name: 'BAGS',        x: -8,  z: -12, color: 0xc28a4a, roof: 0x8a5a2e },
    { id: 'wands',    name: 'WANDS',       x: 4,   z: -12, color: 0x52d273, roof: 0x2f8a4a },
    { id: 'crafter',  name: 'CRAFTER',     x: 16,  z: -12, color: 0xb36bff, roof: 0x6b2fb5 },
    { id: 'barracks', name: 'BARRACKS',    x: -20, z: 12,  color: 0x4aa3ff, roof: 0x2a6fc0 },
    { id: 'weapons',  name: 'WEAPONS',     x: -8,  z: 12,  color: 0xff5a5f, roof: 0xb52a30 },
    { id: 'armor',    name: 'ARMOR',       x: 4,   z: 12,  color: 0x9fb4c8, roof: 0x5a6f88 },
    { id: 'wheel',    name: 'LUCKY WHEEL', x: 16,  z: 12,  color: 0xff6fd8, roof: 0xb53a95 },
  ];
  for (const st of stations) {
    const bx = st.x, bz = Math.sign(st.z) * 20;
    part(G.box, 0xefe3c8, 8, 5, 7, bx, 2.5, bz, scene);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 3.5, 4), mat(st.roof));
    roof.position.set(bx, 6.75, bz); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
    const f = bz - Math.sign(bz) * 3.55;
    part(G.box, 0x6b4217, 2, 3, 0.2, bx, 1.5, f, scene);
    part(G.box, 0x9fd3ff, 1.4, 1.2, 0.2, bx - 2.4, 3, f, scene);
    part(G.box, 0x9fd3ff, 1.4, 1.2, 0.2, bx + 2.4, 3, f, scene);
    part(G.box, st.color, 8.4, 0.6, 0.3, bx, 4.6, f, scene);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.25, 32), new THREE.MeshLambertMaterial({ color: st.color, emissive: st.color, emissiveIntensity: 0.35 }));
    pad.position.set(st.x, 0.13, st.z); pad.receiveShadow = true; scene.add(pad);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ring.rotation.x = Math.PI / 2; ring.position.set(st.x, 0.3, st.z); scene.add(ring);
    const lbl = makeLabel(st.name, '#1b2140', hex(st.color), 40);
    lbl.position.set(st.x, 3.4, st.z); scene.add(lbl);
    PADS.push({ ...st, bx, bz, pad, ring, lbl, inside: false });
  }
  // the lucky wheel prop
  const wheel = new THREE.Group(); wheel.position.set(16, 5, 16.2); scene.add(wheel);
  const wc = [0xffc83d, 0x52d273, 0x4aa3ff, 0xff6fd8, 0xff8a3d, 0xb36bff];
  for (let i = 0; i < 12; i++) { const s = part(G.box, wc[i % 6], 0.5, 1.6, 0.2, 0, 0, 0, wheel); s.position.set(Math.cos(i / 12 * Math.PI * 2) * 0.8, Math.sin(i / 12 * Math.PI * 2) * 0.8, 0); s.rotation.z = i / 12 * Math.PI * 2 + Math.PI / 2; }
  part(G.cyl, 0xffffff, 0.5, 0.3, 0.5, 0, 0, 0.1, wheel).rotation.x = Math.PI / 2;
  effects.push({ persistent: true, update: (dt) => { wheel.rotation.z += dt * (S.wheelSpin || 0.4); } });
  // flag + title
  part(G.cyl, 0xdddddd, 0.2, 8, 0.2, -4, 4, -3, scene);
  const flag = part(G.box, 0xffc83d, 0.05, 1.6, 2.6, -4, 7.1, -1.7, scene);
  effects.push({ update: (dt, t) => { flag.rotation.y = Math.sin(t * 2) * 0.15; }, persistent: true });
  const welcome = makeLabel('ARMY CONTROL', '#ffc83d', 'rgba(27,33,64,0.9)', 44);
  welcome.position.set(-4, 9.4, -3); scene.add(welcome);
  // barrack plots (2 rows of 5)
  let i = 0;
  for (const xs of [[-26, -16, -6, 4, 14], [-38, -48, -58, -68, -78]]) for (const z of [-32, 32]) for (const x of xs) {
    const slab = part(G.box, 0x9a8f7a, 7, 0.2, 7, x, 0.1, z, scene);
    const plus = makeLabel(`Plot ${i + 1}`, '#ffffff', 'rgba(27,33,64,0.6)', 28);
    plus.position.set(x, 1.4, z); scene.add(plus);
    PLOTS.push({ i, x, z, slab, plus, group: null, lbl: null, lblText: '' });
    i++;
  }
  // quest NPCs
  for (const n of NPCS) {
    const av = makeAvatar({ shirt: n.shirt, pants: 0x2a2f55, hat: n.id === 'file' ? 0x1b1b1b : null });
    av.root.position.set(n.x, 0, n.z); av.root.rotation.y = -Math.PI / 2; scene.add(av.root);
    const mark = makeLabel('!', '#1b2140', '#ffe066', 48); mark.position.set(n.x, 4.6, n.z); scene.add(mark);
    const nm = makeLabel(n.name, '#ffffff', 'rgba(27,33,64,0.85)', 28); nm.position.set(n.x, 3, n.z); scene.add(nm);
    npcObjs.push({ n, av, mark, near: false });
  }
  // DPS test area
  const dl = makeLabel('DPS TEST', '#ffffff', 'rgba(200,40,40,0.9)', 30); dl.position.set(-24, 6, 2); scene.add(dl);
}

// barrack building for a plot
function refreshPlot(b) {
  const p = PLOTS[b.plot];
  const t = TROOPS[b.type];
  if (!p.group) {
    p.plus.visible = false;
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); scene.add(g);
    part(G.box, 0xefe3c8, 6, 3.6, 6, 0, 1.8, 0, g);
    part(G.box, t.shirt, 6.3, 0.5, 6.3, 0, 3.8, 0, g);
    for (const cx of [-2.6, 2.6]) for (const cz of [-2.6, 2.6]) part(G.box, t.shirt, 1.1, 1.2, 1.1, cx, 4.4, cz, g);
    part(G.box, 0x3a2a1a, 1.8, 2.4, 0.2, 0, 1.2, -Math.sign(p.z) * 3.05, g);
    part(G.cyl, 0xdddddd, 0.12, 3, 0.12, 0, 5.5, 0, g);
    part(G.box, t.shirt, 0.05, 1, 1.6, 0, 6.4, 0.8, g);
    p.group = g;
  }
  const text = `${t.name} Lv${b.level}  ${b.troops}/${barrackCap(b.level)}`;
  if (text !== p.lblText) {
    if (p.lbl) { scene.remove(p.lbl); p.lbl.material.map.dispose(); p.lbl.material.dispose(); }
    p.lbl = makeLabel(text, '#1b2140', hex(t.shirt), 28);
    p.lbl.position.set(p.x, 7.6, p.z); scene.add(p.lbl);
    p.lblText = text;
  }
}
const barrackDoor = (b) => { const p = PLOTS[b.plot]; return new THREE.Vector3(p.x, 0, p.z - Math.sign(p.z) * 4.5); };

// --------------------------------------------------------- HEALTH BARS ---
const barGeo = new THREE.PlaneGeometry(1, 1);
const barFgGeo = new THREE.PlaneGeometry(1, 1); barFgGeo.translate(0.5, 0, 0);
const barBgMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7, depthWrite: false });
const barMats = { enemy: new THREE.MeshBasicMaterial({ color: 0xff4d4d, depthWrite: false }), node: new THREE.MeshBasicMaterial({ color: 0xffc83d, depthWrite: false }), ally: new THREE.MeshBasicMaterial({ color: 0x52d273, depthWrite: false }) };
function makeBar(width, kind) {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(barGeo, barBgMat); bg.scale.set(width + 0.1, 0.26, 1); g.add(bg);
  const fg = new THREE.Mesh(barFgGeo, barMats[kind]); fg.scale.set(width, 0.16, 1); fg.position.set(-width / 2, 0, 0.01); g.add(fg);
  g.renderOrder = 5; bg.renderOrder = 5; fg.renderOrder = 6;
  g.userData = { fg, width };
  g.visible = false;
  scene.add(g);
  return g;
}
function setBar(bar, ratio) {
  bar.userData.fg.scale.x = Math.max(0.0001, bar.userData.width * clamp(ratio, 0, 1));
}


// ------------------------------------------------------------ ENTITIES ---
const pickables = [];
function rollGolden(e) {
  const d = e.def;
  const can = !d.boss && !d.passive && e.kind === 'enemy';
  e.golden = can && rnd() < 0.05;
  e.maxHp = d.hp * (e.golden ? 4 : 1);
  if (e.golden && !e.aura) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(e.radius + 0.5, 0.12, 6, 30), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.2;
    const tag = makeLabel('GOLDEN', '#1b2140', '#ffc83d', 28);
    tag.position.y = e.model.height + 1.2; tag.scale.multiplyScalar(0.8);
    const g = new THREE.Group(); g.add(ring, tag);
    e.model.root.add(g); e.aura = g;
  }
  if (e.aura) e.aura.visible = e.golden;
  e.model.root.scale.setScalar(e.golden ? 1.2 : 1);
}
function spawnEntity(kind, typeId, x, z) {
  const def = kind === 'enemy' ? ENEMIES[typeId] : NODES[typeId];
  const model = def.build();
  model.root.position.set(x, 0, z);
  model.root.rotation.y = def.dummy ? -Math.PI / 2 : rnd() * Math.PI * 2;
  scene.add(model.root);
  const e = {
    kind, typeId, def, model, mesh: model.root, pos: model.root.position, home: new THREE.Vector3(x, 0, z),
    hp: def.hp, maxHp: def.hp, radius: def.radius, alive: true, respawnAt: 0,
    zone: def.zone, cd: rr(0, 1), state: 'idle', target: null, wanderT: rr(1, 4), wanderTo: null,
    flash: 0, walk: 0, moving: false, attackAnim: 0, dying: 0, vuln: 0, stuckT: 0, stuckSide: 1, bossPhase: 0, phaseMul: 1, bossAttackCount: 0, castLockT: 0, lastExposeNotice: -99, lastSignatureCallout: -99,
    bar: makeBar(def.boss ? 3.2 : kind === 'node' ? 1.6 : 1.4, kind === 'node' ? 'node' : 'enemy'),
  };
  e.barY = model.height + 0.6;
  model.root.traverse((o) => { if (o.isMesh) { o.userData.ent = e; pickables.push(o); } });
  if (def.boss) {
    const tag = makeLabel(def.name, '#ffc83d', 'rgba(120,20,30,0.9)', 34);
    tag.position.set(0, model.height + 1.6, 0); model.root.add(tag); e.tag = tag;
    if (def.roaming && !roamingBossUnlocked()) { e.bossLocked = true; tag.visible = false; e.alive = false; e.mesh.visible = false; e.respawnAt = Infinity; }
  }
  if (def.raid) raidPool.push(e);
  if (def.event) { if (typeId === 'ufo') ufoEnt = e; else alienPool.push(e); }
  if (def.war) guardPool.push(e);
  if (def.meteor) meteorEnt = e;
  if (def.summoned || def.raid || def.meteor || def.event || def.war) { e.alive = false; e.mesh.visible = false; e.respawnAt = Infinity; }
  entities.push(e);
  if (kind === 'enemy' && !def.raid && !def.event && !def.war && !def.bossLocked) { rollGolden(e); e.hp = e.maxHp; }
  return e;
}
function buildCommandPosts() {
  captureObjs.length = 0;
  for (const d of CAPTURE_POST_DEFS) {
    const root=new THREE.Group(); root.position.set(d.x,0,d.z); scene.add(root);
    const base=part(G.cyl,0x4c536e,3.2,0.35,3.2,0,0.18,0,root);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(4.3,0.14,7,44),new THREE.MeshBasicMaterial({color:0x8fe0ff,transparent:true,opacity:.9})); ring.rotation.x=Math.PI/2; ring.position.y=.35; root.add(ring);
    part(G.cyl,0xd5d9e7,.16,4.2,.16,0,2.1,0,root);
    const flag=part(G.box,0x8fe0ff,.12,1.25,1.9,.9,3.25,0,root);
    const label=makeLabel('COMMAND POST','#1b2140','rgba(143,224,255,.95)',26); label.position.set(0,5.4,0); root.add(label);
    const saved=S.capture?.[d.id]||{};
    captureObjs.push({def:d,root,ring,flag,label,progress:Number(saved.progress)||0,owner:Number(saved.owner)||0,incomeT:Number(saved.incomeT)||0,event:false});
  }
}
function captureState(o){ return S.capture[o.def.id]||(S.capture[o.def.id]={progress:o.progress,owner:o.owner,incomeT:o.incomeT||0,captures:0}); }
function updateCapturePosts(dt){
  for(const o of captureObjs){
    const z=ZONES[o.def.zone]; const unlocked=zoneUnlocked(o.def.zone)||S.unlockAll; if(!unlocked){o.root.visible=false;continue;} o.root.visible=true;
    const own=soldiers.filter(s=>s.alive&&dist2(s.pos,o.root.position)<23*23).length;
    const enemy=entities.filter(e=>e.alive&&e.kind==='enemy'&&!e.def.passive&&dist2(e.pos,o.root.position)<31*31).length;
    if(own>enemy) o.progress+=dt*(9+Math.min(20,own)*.65); else if(enemy>own) o.progress-=dt*(8+Math.min(20,enemy)*.65); else if(own) o.progress+=dt*1.5;
    o.progress=clamp(o.progress,0,100);
    if(o.progress>=100&&o.owner!==1){o.owner=1;const st=captureState(o);st.owner=1;st.progress=100;st.captures=(st.captures||0)+1;const g=Math.round(o.def.reward*goldMult());addGold(g);seasonGainXp(20,`${z.name} capture`);addLegacyPoints(2,`${z.name} command post captured`);banner('POST CAPTURED',`${z.name} · +${fmt(g)} gold`);toast('Hold this post for passive Command Income','good',3200);burst(o.root.position,0x52d273,22);shock(o.root.position,7);musicStinger('victory');}
    if(o.progress<=0&&o.owner===1&&enemy>own){o.owner=2;toast(`${z.name} post is under enemy control`,'bad',2800);} if(o.owner===2&&own>enemy)o.owner=0;
    o.incomeT+=dt; if(o.owner===1&&o.incomeT>=30){o.incomeT=0;const g=Math.round(o.def.reward*.18*goldMult());addGold(g);popNumber(o.root.position,5.2,`+${fmt(g)} Command Income`,'gold');}
    const st=captureState(o);st.progress=o.progress;st.owner=o.owner;st.incomeT=o.incomeT;o.ring.material.color.set(o.owner===1?0x52d273:o.owner===2?0xff5a5f:0x8fe0ff);o.flag.material.color.set(o.ring.material.color);o.ring.scale.setScalar(1+Math.sin(S.time*3)*.04);
  }
}
function nearestVisiblePost(){let best=null,bd=Infinity;for(const o of captureObjs)if(o.root.visible){const d=dist2(o.root.position,player.pos);if(d<bd){bd=d;best=o;}}return best;}
function startCommandEvent(){
  if(S.worldEvent.active||S.mode!=='play')return false; const o=nearestVisiblePost(); if(!o||dist2(o.root.position,player.pos)>55*55)return false;
  const kinds=['HOLD THE LINE','ELITE ASSAULT','COMMAND BONUS']; const kind=kinds[Math.floor(rnd()*kinds.length)];
  S.worldEvent={active:true,kind,post:o.def.id,ends:S.time+32,next:S.time+115,reward:Math.round(o.def.reward*1.5)}; o.event=true; o.progress=Math.min(88,Math.max(8,o.progress));
  banner(kind,`${ZONES[o.def.zone].name} · defend the Command Post`);toast('A battlefield event is active nearby!','gold',3500);musicStinger('combo');
  if(kind==='ELITE ASSAULT'){const cs=entities.filter(e=>e.kind==='enemy'&&!e.def.boss&&!e.def.passive&&!e.def.event&&!e.def.war&&!e.def.raid&&!e.alive&&e.zone===o.def.zone).slice(0,4);for(const e of cs){e.alive=true;e.mesh.visible=true;e.hp=e.maxHp*1.6;e.home.set(o.def.x+rr(-9,9),0,o.def.z+rr(-9,9));e.pos.copy(e.home);e.state='chase';e.target=player;e.mul=1.6;e.commandEvent=true;}}
  return true;
}
function updateCommandEvent(dt){
  if(!S.worldEvent.active){if(S.mode==='play'&&S.time>=(S.worldEvent.next||90)&&S.time>25)startCommandEvent();return;}
  const o=captureObjs.find(x=>x.def.id===S.worldEvent.post); if(!o){S.worldEvent.active=false;return;} const near=soldiers.filter(s=>s.alive&&dist2(s.pos,o.root.position)<49).length; const enemy=entities.filter(e=>e.alive&&e.commandEvent).length; const left=S.worldEvent.ends-S.time;
  if(left<=0||(near>0&&enemy===0&&o.progress>=100)){const success=near>0&&enemy===0&&o.progress>=100;if(success){const g=Math.round(S.worldEvent.reward*goldMult());addGold(g);addLegacyPoints(3,'Command Event');toast(`${S.worldEvent.kind} complete · +${fmt(g)} gold`,'gold',4500);musicStinger('victory');}else toast(`${S.worldEvent.kind} ended`,'');for(const e of entities)if(e.commandEvent){e.commandEvent=false;e.mul=1;if(e.alive&&!e.def.boss){e.alive=false;e.mesh.visible=false;e.respawnAt=S.time+2;}}o.event=false;S.worldEvent={active:false,kind:'',post:'',ends:0,next:S.time+115,reward:0};}
}

function populate() {
  const place = (zoneIdx, count, kind, id, x0, x1) => {
    const z = ZONES[zoneIdx];
    x0 = x0 ?? z.x0 + 5; x1 = x1 ?? z.x1 - 6;
    for (let i = 0; i < count; i++) {
      let x, zz, tries = 0;
      do { x = rr(x0, x1); zz = rr(z.z0 + 3, z.z1 - 3); tries++; }
      while (((!z.annex && Math.abs(zz) < 4.5) || (!z.annex && x > 128 && x < 144) || (z.annex && Math.abs(x - ANNEX_GATES.find((g) => g.zone === zoneIdx).x) < 4.5) || PADS.some((p) => dist2(p, { x, z: zz }) < 42) || entities.some((e) => dist2(e.home, { x, z: zz }) < 18)) && tries < 60);
      spawnEntity(kind, id, x, zz);
    }
  };
  // Forest (outside the base walls)
  place(0, 14, 'node', 'tree', 22, 95); place(0, 12, 'node', 'blueflower', 22, 95); place(0, 8, 'node', 'rock', 22, 95);
  place(0, 6, 'enemy', 'pig', 24, 60); place(0, 7, 'enemy', 'livingflower', 30, 75);
  place(0, 5, 'enemy', 'flowerguard', 50, 92); place(0, 3, 'enemy', 'golem', 65, 92);
  spawnEntity('enemy', 'goldengolem', 84, 26);
  for (const [x, z] of [[24, 8], [26, -10], [30, 16], [28, -18]]) spawnEntity('node', 'tree', x, z);
  // Riverlands
  place(1, 10, 'node', 'bigtree'); place(1, 7, 'node', 'riverrock');
  place(1, 6, 'enemy', 'flailsoldier'); place(1, 6, 'enemy', 'thornflower'); place(1, 3, 'enemy', 'mossgolem', 145, 172);
  spawnEntity('enemy', 'whiteflower', 164, -26);
  // Mountains
  place(2, 8, 'node', 'boulder'); place(2, 6, 'node', 'emeraldore');
  place(2, 6, 'enemy', 'rocky'); place(2, 5, 'enemy', 'ogre'); place(2, 3, 'enemy', 'bodyguard', 225, 252);
  spawnEntity('enemy', 'emeraldgolem', 244, 26);
  // Desert
  place(3, 8, 'node', 'cactus'); place(3, 6, 'node', 'sandpile');
  place(3, 6, 'enemy', 'scorpion'); place(3, 5, 'enemy', 'mummy');
  spawnEntity('enemy', 'pharaoh', 300, 22);
  for (const [x, z] of [[315, -14], [326, -34], [306, -36]]) spawnEntity('node', 'darkpillar', x, z);
  spawnEntity('enemy', 'lordofsands', 318, -26);
  // Atlantis
  place(4, 7, 'node', 'coral'); place(4, 5, 'node', 'clam');
  place(4, 6, 'enemy', 'fishman'); place(4, 4, 'enemy', 'crabknight');
  spawnEntity('enemy', 'sapphiregolem', 392, 26);
  for (const [x, z] of [[398, -14], [410, -34], [392, -36]]) spawnEntity('node', 'sharkstatue', x, z);
  spawnEntity('enemy', 'sirshark', 405, -24);
  // Mushroom Forest
  place(5, 8, 'node', 'glowshroom'); place(5, 6, 'node', 'spiderweb');
  place(5, 7, 'enemy', 'mushroomman'); place(5, 6, 'enemy', 'cavespider');
  spawnEntity('enemy', 'wisetree', 116, 116); spawnEntity('enemy', 'spiderqueen', 178, 118);
  // Ouroboros
  place(6, 8, 'node', 'urn'); place(6, 7, 'enemy', 'serpent'); place(6, 6, 'enemy', 'sandwraith');
  spawnEntity('enemy', 'worldeater', 312, 102); spawnEntity('enemy', 'primalworldeater', 286, 108);
  // Magic Forest
  place(7, 8, 'node', 'darktree'); place(7, 6, 'node', 'magiccrystal'); place(7, 7, 'enemy', 'gnome'); place(7, 6, 'enemy', 'fairy');
  spawnEntity('enemy', 'mutantgnome', 356, 110); spawnEntity('enemy', 'minotaur', 394, 118);
  // DPS test dummy at base
  spawnEntity('node', 'dummy', -24, 2);
  // Wise Bird Lands
  place(8, 8, 'node', 'feathernest'); place(8, 6, 'node', 'skycrystal'); place(8, 7, 'enemy', 'harpy'); place(8, 6, 'enemy', 'owlknight');
  spawnEntity('enemy', 'wisebird', 486, 28);
  // Soul Land
  place(9, 8, 'node', 'tombstone'); place(9, 6, 'node', 'soulcrystal'); place(9, 7, 'enemy', 'lostsoul'); place(9, 6, 'enemy', 'soulknight');
  spawnEntity('enemy', 'soulking', 566, -28);
  // Jungle
  place(10, 8, 'node', 'jungletree'); place(10, 6, 'node', 'bamboo'); place(10, 7, 'enemy', 'raptor'); place(10, 6, 'enemy', 'tribesman');
  spawnEntity('enemy', 'jungleking', 646, -26);
  // Arctic
  place(11, 8, 'node', 'iceblock'); place(11, 6, 'node', 'frostore'); place(11, 5, 'enemy', 'penguin'); place(11, 6, 'enemy', 'yeti'); place(11, 5, 'enemy', 'icegolem');
  spawnEntity('enemy', 'frostgiant', 724, 24);
  // Mine raid pool (dormant until a raid starts) + meteorite
  for (let i = 0; i < 8; i++) spawnEntity('enemy', 'minebat', 224, 116);
  for (let i = 0; i < 6; i++) spawnEntity('enemy', 'minegolem', 224, 116);
  spawnEntity('enemy', 'minelord', 224, 116);
  spawnEntity('node', 'meteor', 0, 0);
  spawnEntity('enemy', 'phoenixboss', 470, -30); spawnEntity('enemy', 'ghostpharaoh', 530, 30); spawnEntity('enemy', 'thepenguin', 690, -30);
  spawnEntity('enemy', 'ufo', 0, 0); for (let i = 0; i < 4; i++) spawnEntity('enemy', 'roguealien', 0, 0);
  for (let i = 0; i < 6; i++) spawnEntity('enemy', 'warguard', 0, 0);
  place(13, 9, 'enemy', 'hermitcrab'); place(13, 5, 'enemy', 'crablord'); spawnEntity('enemy', 'kingcrab', 540, 108);
  // V11 frontier
  place(14, 8, 'node', 'magmaflow'); place(14, 6, 'node', 'emberrock'); place(14, 7, 'enemy', 'lavahound'); place(14, 6, 'enemy', 'magmaBrute'); spawnEntity('enemy', 'infernotitan', 786, -26);
  place(15, 8, 'node', 'aliennode'); place(15, 6, 'node', 'plasmacell'); place(15, 7, 'enemy', 'aliengrunt'); place(15, 6, 'enemy', 'plasmalurker'); spawnEntity('enemy', 'ufooverlord', 880, 24);
  place(16, 8, 'node', 'ancienttree'); place(16, 6, 'node', 'naturecrystal'); place(16, 7, 'enemy', 'rootling'); place(16, 6, 'enemy', 'treantbeast'); spawnEntity('enemy', 'ancientent', 960, -25);
  place(17, 8, 'node', 'stormnode'); place(17, 6, 'node', 'chargednode'); place(17, 7, 'enemy', 'shockbeast'); place(17, 6, 'enemy', 'thunderwarden'); spawnEntity('enemy', 'thunderking', 1040, 24);
  place(18, 8, 'node', 'urancrate'); place(18, 6, 'node', 'quantum'); place(18, 7, 'enemy', 'uranguard'); place(18, 6, 'enemy', 'quantumdroid'); spawnEntity('enemy', 'citadelcommander', 1120, -26);
  place(19, 8, 'node', 'stardust'); place(19, 6, 'node', 'astralnode'); place(19, 7, 'enemy', 'starlings'); place(19, 6, 'enemy', 'astralguardian'); spawnEntity('enemy', 'staremperor', 1185, 24);
  S.war.flags = WAR_FLAGS.map((f, i) => i % 3); refreshFlags();
}


// ---------------------------------------------------- V13 WORLD SECRETS ---
const SECRET_DEFS = [
  {id:'cache_forest', kind:'cache', zone:0, x:88, z:-32, reward:12000, label:'Hidden Forest Cache', color:0xffc83d, req:0},
  {id:'cache_river', kind:'cache', zone:1, x:174, z:30, reward:75000, label:'Waterfall Cache', color:0x8fe0ff, req:1},
  {id:'cache_mountain', kind:'cache', zone:2, x:214, z:-33, reward:300000, label:'Mountain Relic Cache', color:0xb36bff, req:2},
  {id:'cache_desert', kind:'cache', zone:3, x:334, z:31, reward:1200000, label:'Buried Sand Cache', color:0xffb52e, req:3},
  {id:'cache_atlantis', kind:'cache', zone:4, x:412, z:31, reward:6000000, label:'Sunken Treasure', color:0x4af0e0, req:4},
  {id:'cache_bird', kind:'cache', zone:8, x:500, z:-32, reward:25000000, label:'Sky Cache', color:0xd08cff, req:8},
  {id:'cache_soul', kind:'cache', zone:9, x:592, z:30, reward:100000000, label:'Soul Reliquary', color:0x6fd8ff, req:9},
  {id:'cache_jungle', kind:'cache', zone:10, x:674, z:-31, reward:350000000, label:'Jungle Hoard', color:0x72d96f, req:10},
  {id:'cache_arctic', kind:'cache', zone:11, x:748, z:31, reward:1200000000, label:'Frozen Vault', color:0xbfe6ff, req:11},
  {id:'cache_alien', kind:'cache', zone:15, x:892, z:-32, reward:6000000000, label:'Alien Stash', color:0x7affb0, req:15},
  {id:'cache_uran', kind:'cache', zone:18, x:1128, z:31, reward:25000000000, label:'Citadel Vault', color:0xb59cff, req:18},
  {id:'cache_star', kind:'cache', zone:19, x:1208, z:31, reward:100000000000, label:'Starfall Vault', color:0xffe8a6, req:19},
  ...RELIC_DEFS.map(r => ({...r, kind:'relic', reward:0, req:r.zone})),
];
const secretObjs = [];
let secretHintAt = -99;
function buildSecrets(){
  secretObjs.length=0;
  for(const d of SECRET_DEFS){
    const root=new THREE.Group(); root.position.set(d.x,0,d.z); root.visible=false; scene.add(root);
    if(d.kind==='cache'){
      const chest=part(G.box,0x805a22,2.6,1.5,1.8,0,0.75,0,root);
      part(G.box,0xffc83d,0.35,1.65,1.95,0,0.78,0,root,new THREE.MeshLambertMaterial({color:0xffc83d,emissive:0x8a5d00,emissiveIntensity:.5}));
      const lid=part(G.box,0xb5782f,2.7,0.45,1.9,0,1.72,-0.1,root); lid.rotation.x=-0.1;
      const orb=part(G.oct,d.color,.38,.7,.38,0,3.05,0,root,new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.9}));
      const ring=new THREE.Mesh(new THREE.TorusGeometry(2.3,.11,6,32),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.55})); ring.rotation.x=Math.PI/2; ring.position.y=.2; root.add(ring);
      const lbl=makeLabel(d.label,'#1b2140','rgba(255,224,102,.95)',26); lbl.position.set(0,4.4,0); lbl.visible=false; root.add(lbl);
      secretObjs.push({def:d,root,orb,ring,lbl,discovered:false});
    } else {
      const base=part(G.cyl,0x352a4a,2.2,.5,2.2,0,.25,0,root);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.16,7,36),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.7})); ring.rotation.x=Math.PI/2; ring.position.y=.6; root.add(ring);
      const crystal=part(G.oct,d.color,.65,1.8,.65,0,1.7,0,root,new THREE.MeshLambertMaterial({color:d.color,emissive:d.color,emissiveIntensity:.55,flatShading:true}));
      const lbl=makeLabel(`${d.name} · ${d.desc}`,'#1b2140','rgba(214,190,255,.95)',24); lbl.position.set(0,4.2,0); lbl.visible=false; root.add(lbl);
      secretObjs.push({def:d,root,crystal,ring,lbl,discovered:false});
    }
  }
}
function discoverSecret(o){
  if(S.secrets[o.def.id]) return;
  S.secrets[o.def.id]=true; o.discovered=true; o.root.visible=true; o.lbl.visible=true;
  if(o.def.kind==='cache'){
    const g=Math.round(o.def.reward*goldMult()); addGold(g); addLegacyPoints(2,`${o.def.label} found`);
    giveLoot('ancient_fragment',1,o.root.position.clone());
    burst(o.root.position,o.def.color,26); shock(o.root.position,7); musicStinger('legendary');
    banner('SECRET FOUND',`${o.def.label} · +${fmt(g)} gold`); toast('Treasure discovered! Keep exploring for more secrets.','gold',4200);
  }else{
    S.relics[o.def.id]=true; addLegacyPoints(5,`${o.def.name} awakened`); burst(o.root.position,o.def.color,38); shock(o.root.position,9); musicStinger('legendary');
    banner('RELIC AWAKENED',`${o.def.name} · ${o.def.desc}`); toast(`${o.def.name} is permanent, even through rebirths.`,'gold',5000); refreshSoldierStats();
  }
  autoSave();
}
function updateSecrets(dt){
  if(S.mode!=='play') return;
  let nearest=null,bd=Infinity;
  for(const o of secretObjs){
    const unlocked=zoneUnlocked(o.def.zone);
    const claimed=!!S.secrets[o.def.id];
    if(!unlocked){o.root.visible=false;continue;}
    const d2=dist2(o.root.position,player.pos);
    if(!claimed && d2<32*32){o.root.visible=true;o.lbl.visible=false;o.root.position.y=0.03; if(d2<bd){bd=d2;nearest=o;}}
    if(claimed){o.root.visible=false;continue;}
    if(o.root.visible){o.ring.rotation.z += dt*(1.2 + o.def.zone*.02); if(o.crystal)o.crystal.rotation.y += dt*1.4; if(o.orb)o.orb.rotation.y += dt*2.2; const pulse=1+Math.sin(S.time*4+o.def.x)*.08; o.ring.scale.setScalar(pulse);}
    if(d2<4.8*4.8) discoverSecret(o);
  }
  if(nearest && S.time-secretHintAt>3.5 && bd>4.8*4.8){secretHintAt=S.time;toast(`Something is hidden nearby… ${nearest.def.kind==='relic'?'an ancient relic hums':'a treasure cache glimmers'} nearby.`,'');}
}
function drawSecretMinimap(){
  if(!window.__minimapSecretHook)return;
}

// Roaming bosses: a rare moving threat that can appear in any unlocked main/annex area.
Object.assign(ENEMIES, {
  roamerwarlord:{name:'Wandering Warlord',zone:0,hp:8e6,dmg:12000,cd:1.15,range:6,speed:7,aggro:22,gold:2e6,xp:550000,boss:true,roaming:true,slam:7,radius:3.8,loot:[['ancient_fragment',0.55,1],['wheel_blade',0.04,1],['skill:rage',0.18,1]],build:()=>makeAvatar({shirt:0xff5a5f,pants:0x2b1a28,skin:0xffd66b,scale:3.2,crown:true,armor:true,horns:true,eyes:0xffe066})},
  voidstalker:{name:'Void Stalker',zone:0,hp:2.5e8,dmg:260000,cd:1.3,range:7,speed:8.5,aggro:24,gold:5e8,xp:30e6,boss:true,roaming:true,slam:8,radius:4.2,loot:[['ancient_fragment',0.8,2],['skill:energy',0.28,1],['sapphire_sword',0.03,1]],build:()=>makeSpider({color:0x25173f,scale:2.7,eyes:0xd08cff})},
  starhunter:{name:'Star Hunter',zone:0,hp:5e11,dmg:6e7,cd:1.4,range:9,speed:7.2,aggro:26,gold:4e10,xp:4e9,boss:true,roaming:true,slam:10,radius:5.0,loot:[['ancient_fragment',1,4],['star_saber',0.07,1],['astral_staff',0.05,1],['winner_token',0.04,1]],build:()=>makeAvatar({shirt:0xd08cff,pants:0x241d45,skin:0xffe6bd,scale:4.8,crown:true,armor:true,eyes:0xffe8a6})},
});
function chooseRoamerZone(){
  const max=maxZoneReached();
  const candidates=[];
  for(let i=0;i<=max;i++) if(zoneUnlocked(i) && ZONES[i]) candidates.push(i);
  return candidates.length?candidates[Math.floor(rnd()*candidates.length)]:0;
}
function placeRoamer(e){
  if (!e || !roamingBossUnlocked()) {
    if (e) { e.alive=false; e.mesh.visible=false; e.target=null; e.dying=0; e.respawnAt=Infinity; }
    return false;
  }
  const zi=chooseRoamerZone(),z=ZONES[zi];
  e.zone=zi;
  const x=z.annex?z.x0+rr(12,(z.x1-z.x0)-12):rr(Math.max(z.x0+10,zi===0?28:z.x0+10),z.x1-10);
  const zz=rr(z.z0+10,z.z1-10);
  e.home.set(x,0,zz); e.pos.set(x,0,zz); e.target=null; e.state='idle'; e.enraged=false; e.dying=0; e.alive=true; e.mesh.visible=true; e.bossPhase=0; e.phaseMul=1; e.bossAttackCount=0; e.castLockT=0; e.vuln=0; e.lastExposeNotice=-99; e.lastSignatureCallout=-99;
  const scale=Math.max(1,zoneStats(zi).hp / Math.max(1,e.def.hp));
  e.maxHp=e.def.hp*scale; e.hp=e.maxHp; e.mul= Math.max(1, zoneStats(zi).dmg / Math.max(1,e.def.dmg));
  e.dmul=e.mul; e.roamZone=zi;
  if(e.tag)e.tag.textContent=e.def.name;
  banner('ROAMING BOSS',`${e.def.name} has appeared in ${z.name}`); toast('A roaming boss is loose. Hunt it for huge rewards!','bad',4200); musicStinger('combo');
}
function initRoamers(){
  for(const id of ['roamerwarlord','voidstalker','starhunter']){const e=spawnEntity('enemy',id,0,0);e.roamer=true;e.alive=false;e.mesh.visible=false;e.respawnAt=roamingBossUnlocked() ? 45 + Math.random()*40 : Infinity;e.roamZone=0;}
}
function updateRoamerTimers(){
  if(S.mode!=='play' || !roamingBossUnlocked()) return;
  for(const e of entities) if(e.roamer && !e.alive && S.time>=e.respawnAt){placeRoamer(e);}
}


// ---------------------------------------------------- V17 LIVING ECONOMY ---
// Rotating bounties + elite hunts keep the open world changing without adding another
// permanent panel-heavy subsystem.
// ---------------------------------------------------- V17 LIVING ECONOMY ---
// Rotating bounties + elite hunts keep the open world changing without adding
// another permanent panel-heavy subsystem.
const BOUNTY_KINDS = [
  { id:'hunt', label:'HUNT', verb:'Defeat', goalMin:8, goalMax:18, mul:1.0 },
  { id:'purge', label:'PURGE', verb:'Destroy', goalMin:14, goalMax:28, mul:1.25 },
  { id:'champion', label:'CHAMPION', verb:'Slay', goalMin:5, goalMax:10, mul:1.65 },
];
function bountyCandidates(){
  return Object.entries(ENEMIES).filter(([id,d]) => d && !d.boss && !d.passive && !d.raid && !d.event && !d.war && !d.roaming && zoneUnlocked(d.zone));
}
function refreshBounties(force=false){
  const now=S.time;
  if(!force && S.bounty?.slots?.length && now < (S.bounty.ends||0)) return;
  const pool=bountyCandidates();
  if(!pool.length) return;
  const used=new Set(); const slots=[];
  for(let i=0;i<3;i++){
    let pick=pool[Math.floor(rnd()*pool.length)]; let guard=0;
    while(used.has(pick[0]) && guard++<20) pick=pool[Math.floor(rnd()*pool.length)];
    used.add(pick[0]);
    const [id,d]=pick; const z=ZONES[d.zone]; const base=Math.max(1,zoneStats(d.zone).gold||d.gold||1000);
    const kind=BOUNTY_KINDS[i%BOUNTY_KINDS.length];
    const goal=Math.round(rr(kind.goalMin,kind.goalMax)*(1+Math.min(1.5,(d.zone||0)*0.045)));
    const reward=Math.round(base*goal*(3.5+kind.mul*2.2)*goldMult());
    slots.push({id:`${id}:${i}:${Math.floor(now)}`,target:id,zone:d.zone,goal,progress:0,reward,shards:1+(d.zone>=10?2:d.zone>=5?1:0),kind:kind.id,claimed:false});
  }
  S.bounty.slots=slots; S.bounty.ends=now+12*60; S.bounty.next=now+12*60; S.bounty.lastRefresh=now;
  if(S.mode==='play') { toast('New BOUNTIES posted · pick a target and go!', 'gold', 3500); musicStinger('combo'); }
}
function bountyProgress(id){ const b=(S.bounty?.slots||[]).find(x=>x.target===id&&!x.claimed); return b||null; }
function claimBounty(index){
  const b=S.bounty?.slots?.[index]; if(!b||b.claimed||b.progress<b.goal) return false;
  b.claimed=true; S.bounty.completed=(S.bounty.completed||0)+1; S.bounty.streak=(S.bounty.streak||0)+1;
  const streakMul=1+Math.min(1.0,(S.bounty.streak||0)*0.05); const gold=Math.round(b.reward*streakMul);
  addGold(gold); addLegacyPoints(b.shards,`Bounty: ${b.target}`); seasonGainXp(18+b.shards*5,`Bounty: ${b.target}`); gainCommanderXp(12+b.shards*5,`Bounty: ${b.target}`);
  toast(`BOUNTY COMPLETE · +${fmt(gold)} gold · +${b.shards} ◈`, 'gold', 4200); musicStinger('legendary'); burst(player.pos,0xffc83d,28);
  if(S.bounty.slots.every(x=>x.claimed)){ S.bounty.streak+=1; refreshBounties(true); toast('Bounty board cleared · bonus rotation!', 'good', 3200); }
  autoSave(); return true;
}
function updateBounties(dt){
  if(S.mode!=='play') return;
  if(!S.bounty?.slots?.length || S.time >= (S.bounty.ends||0)) refreshBounties();
  const live=(S.bounty?.slots||[]).filter(x=>!x.claimed); if(!live.length) return;
  // Kill progress is counted directly in killEntity. Keep a tiny safety sync so
  // saves produced before V17 still initialize cleanly.
  if(S.time >= (S.bounty.ends||0)-4 && S.bounty.ends) S.bounty.next=S.bounty.ends;
}
function activateEliteHunt(){
  if(S.eliteHunt.active || S.time < (S.eliteHunt.next||0) || S.kills<20) return false;
  const zi=zoneAt(player.pos.x); const candidates=entities.filter(e=>e.kind==='enemy'&&!e.def.boss&&!e.def.passive&&!e.def.raid&&!e.def.event&&!e.def.war&&!e.roaming&&!e.alive&&e.zone===zi);
  if(!candidates.length) return false;
  const e=candidates[Math.floor(rnd()*candidates.length)]; const z=ZONES[zi];
  const ang=rnd()*Math.PI*2, dist=rr(18,28); e.pos.set(clamp(player.pos.x+Math.cos(ang)*dist,z.x0+4,z.x1-4),0,clamp(player.pos.z+Math.sin(ang)*dist,z.z0+4,z.z1-4)); e.home.copy(e.pos);
  const scale=Math.max(1,zoneStats(zi).hp/Math.max(1,e.def.hp)); e.maxHp=e.def.hp*scale*5.5; e.hp=e.maxHp; e.mul=Math.max(1,zoneStats(zi).dmg/Math.max(1,e.def.dmg))*1.75; e.dmul=e.mul; e.alive=true; e.mesh.visible=true; e.dying=0; e.state='chase'; e.target=player; e.eliteHunt=true; e.eliteReward=5.5; e.eliteZone=zi; e.eliteEnds=S.time+42;
  e.model.root.scale.setScalar(1.4); if(!e.eliteTag){ const tag=makeLabel('ELITE HUNT','#ffffff','rgba(150,20,40,.95)',28); tag.position.set(0,e.model.height+1.4,0); e.model.root.add(tag); e.eliteTag=tag; const ring=new THREE.Mesh(new THREE.TorusGeometry(Math.max(1.2,e.radius+0.6),0.16,7,32),new THREE.MeshBasicMaterial({color:0xff5a5f,transparent:true,opacity:.9})); ring.rotation.x=Math.PI/2; ring.position.y=.25; e.model.root.add(ring); e.eliteRing=ring; }
  e.eliteTag.textContent=`ELITE · ${e.def.name}`; e.eliteTag.visible=true; if(e.eliteRing)e.eliteRing.visible=true;
  S.eliteHunt={active:true,type:e.typeId,ends:e.eliteEnds,next:S.time+110}; banner('ELITE HUNT',`${e.def.name} · ${z.name} · 5.5x bounty rewards`); toast('A supercharged enemy is hunting this area. Take it down!', 'bad', 4300); musicStinger('combo'); return true;
}
function updateEliteHunt(dt){
  if(S.mode!=='play') return;
  const h=S.eliteHunt;
  if(!h.active){ if(S.time>=h.next) activateEliteHunt(); return; }
  const e=entities.find(x=>x.eliteHunt&&x.typeId===h.type);
  if(!e || !e.alive || S.time>=h.ends){
    if(e){e.eliteHunt=false; e.model.root.scale.setScalar(1); if(e.eliteTag)e.eliteTag.visible=false; if(e.eliteRing)e.eliteRing.visible=false; if(e.alive&&!e.def.boss){e.alive=false;e.mesh.visible=false;e.respawnAt=S.time+2;}}
    if(e?.alive===false) toast('Elite Hunt escaped. Another hunt will appear later.','');
    h.active=false; h.type=''; h.ends=S.time+0; h.next=Math.max(h.next||0,S.time+105); return;
  }
  if(e.eliteRing){e.eliteRing.rotation.z+=dt*1.8;e.eliteRing.scale.setScalar(1+Math.sin(S.time*6)*.08);}
}

function v17BountyHud(){
  const live=(S.bounty?.slots||[]).filter(x=>!x.claimed); if(!live.length) return;
}

// -------------------------------------------------------------- PLAYER ---
const player = (() => {
  const m = makeAvatar({ shirt: 0xff8a3d, pants: 0x2b3a6e, skin: 0xffd66b, scale: 1.05 });
  m.root.position.set(0, 0, 4); scene.add(m.root);
  const tag = makeLabel('You', '#ffffff', 'rgba(27,33,64,0.8)', 30);
  tag.position.set(0, m.height + 0.9, 0); tag.scale.multiplyScalar(0.8); m.root.add(tag);
  return { tag, model: m, mesh: m.root, pos: m.root.position, vel: new THREE.Vector3(), vy: 0, hp: 100, maxHp: 100, radius: 0.6, alive: true, walk: 0, moving: false, facing: 0, lastHurt: -99, moveTo: null, isPlayer: true, attackAnim: 0, stuckT: 0, stuckSide: 1 };
})();
// V19 FIX3: keep player.pos permanently backed by the actual mesh position.
// Any legacy code that assigns player.pos now copies into the mesh position instead of
// replacing the reference with undefined/null, eliminating the reported '.x' crash.
Object.defineProperty(player, 'pos', {
  configurable: false,
  enumerable: true,
  get() { return player.mesh && player.mesh.position ? player.mesh.position : new THREE.Vector3(0, 0, 4); },
  set(v) {
    const p = player.mesh && player.mesh.position;
    if (!p) return;
    if (v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) p.copy(v);
    else p.set(0, 0, 4);
  }
});
function playerMaxHp() {
  let best = 0;
  for (const id in S.owned) if (ITEMS[id] && ITEMS[id].type === 'armor') best = Math.max(best, ITEMS[id].hp);
  return 100 + best * 2 * (1 + relicBonus('hp') * 0.08);
}

// --------------------------------------------------- BARRACKS & TROOPS ---
const itemMats = {};
const itemMat = (id) => itemMats[id] || (itemMats[id] = new THREE.MeshLambertMaterial({ color: ITEMS[id].color, flatShading: true, emissive: ITEMS[id].cost === 0 ? ITEMS[id].color : 0x000000, emissiveIntensity: ITEMS[id].cost === 0 ? 0.25 : 0 }));
const weaponOf = (b) => (b.weapon ? ITEMS[b.weapon] : { name: 'Fists', min: 2, max: 4, cls: 'sword' });
const armorOf = (b) => (b.armor ? ITEMS[b.armor] : { name: 'None', hp: 0 });
const enchOf = (b, kind) => { const id = kind === 'weapon' ? b.weapon : b.armor; const e = id && S.ench[id]; return e ? ENCHANTS[kind].find((x) => x.id === e) || {} : {}; };
function troopMaxHp(b) { const t = TROOPS[b.type]; const elite=1+0.12*(Number(b.elite)||0); return Math.round((40 + armorOf(b).hp) * t.hpM * (1 + 0.05 * (b.level - 1)) * elite * (1 + (enchOf(b, 'armor').hp || 0)) * (1 + petBonus('hp') + resV('hp') + commanderHp() + synergyBonus('hp')) * (1 + relicBonus('hp') * 0.08)); }
function troopDmgRange(b) {
  const t = TROOPS[b.type], w = weaponOf(b), k = t.dmgM * (1 + 0.05 * (b.level - 1)) * (1 + (enchOf(b, 'weapon').dmg || 0));
  if (t.absorber) { const hp = troopMaxHp(b); return [Math.round(hp * 0.07 * w.min), Math.round(hp * 0.07 * w.min)]; }
  return [Math.round(w.min * k), Math.round(w.max * k)];
}
function troopSpeed(s) { const elite=1+0.04*(Number(s.barrack.elite)||0); return s.def.speed * elite * (S.fx.beast > 0 ? 1.5 : 1) * (S.fx.raptor > 0 ? 2 : 1) * (1 + legacyBonus('logistics') * 0.025 + commanderSpeed() + synergyBonus('speed')) * (1 + relicBonus('speed') * 0.06); }
function rollDmg(s, target) {
  const b = s.barrack;
  const [a, c] = troopDmgRange(b);
  let d = rr(a, c);
  if (s.def.absorber) { d += s.absorbed * 0.5; s.absorbed *= 0.5; }
  if (S.fx.rage > 0) d *= 2;
  if (S.fx.beast > 0) d *= 1.5;
  if (S.fx.boost > 0) d *= 1.5;
  if (S.fx.minotaur > 0) d *= 3;
  d *= rebirthDmg();
  d *= 1 + petBonus('dmg') + resV('dmg');
  d *= 1 + relicBonus('dmg') * 0.05 + commanderDmg(s, target) + synergyBonus('dmg') + (s.def.ranged ? synergyBonus('ranged', target) : 0) + (target?.def?.boss ? bossMasteryBonus() : 0);
  d *= 1 + 0.15 * (Number(b.elite)||0);
  s.lastCrit = rnd() < (0.08 + commanderCrit()); if (s.lastCrit) d *= 2;
  if (s.def.undead && target.def && target.def.undead) d *= s.def.undead;
  if (target.vuln > 0) d *= 1.25;
  return d;
}
function makeTroopModel(b) {
  const t = TROOPS[b.type];
  const w = b.weapon ? b.weapon : null;
  const opts = { shirt: t.shirt, pants: t.pants, skin: 0xffd66b, weapon: t.cls === 'energy' ? 'glove' : (w || t.cls !== 'sword') ? t.cls : null, armor: !!b.armor,
    wMat: w ? itemMat(w) : null, aMat: b.armor ? itemMat(b.armor) : null, hat: t.id === 'wizard' ? 0x6b3fd8 : t.id === 'paladin' ? 0xc9a13a : null };
  if (opts.weapon === 'sword' && b.weapon === 'trident') opts.weapon = 'trident';
  return t.centaur ? makeCentaur(opts) : makeAvatar(opts);
}
function spawnTroop(b, at) {
  const t = TROOPS[b.type];
  const m = makeTroopModel(b);
  m.root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
  });
  m.root.position.copy(at || barrackDoor(b));
  scene.add(m.root);
  const s = { def: t, barrack: b, model: m, mesh: m.root, pos: m.root.position, hp: 0, maxHp: 0, alive: true, state: 'follow', target: null,
    cd: rr(0, 0.5), respawnAt: 0, radius: t.centaur ? 0.8 : 0.5, walk: 0, moving: false, attackAnim: 0, lastHurt: -99, absorbed: 0, bar: makeBar(1.2, 'ally') };
  s.maxHp = troopMaxHp(b); s.hp = s.maxHp; s.barY = m.height + 0.4;
  if ((Number(b.elite)||0) > 0) { const er = new THREE.Mesh(new THREE.TorusGeometry(0.75 + 0.12*(b.elite-1), 0.06, 6, 20), new THREE.MeshBasicMaterial({color: b.elite>=3?0xd08cff:b.elite===2?0xffc83d:0x8fe0ff, transparent:true, opacity:0.85})); er.rotation.x=Math.PI/2; er.position.y=0.05; m.root.add(er); s.eliteFx=er; }
  soldiers.push(s);
  return s;
}
function removeSoldier(s) { scene.remove(s.mesh); scene.remove(s.bar); soldiers.splice(soldiers.indexOf(s), 1); }
// rebuild models for a barrack (after equipping gear)
function rebuildTroops(b) {
  for (const s of soldiers.filter((x) => x.barrack === b)) {
    const pos = s.pos.clone(), rot = s.mesh.rotation.y, alive = s.alive, r = s.hp / s.maxHp, rsp = s.respawnAt, st = s.state, tg = s.target;
    removeSoldier(s);
    const n = spawnTroop(b, pos); n.mesh.rotation.y = rot; n.hp = n.maxHp * r; n.state = st; n.target = tg;
    if (!alive) { n.alive = false; n.hp = 0; n.state = 'dead'; n.respawnAt = rsp; n.mesh.visible = false; }
  }
  refreshPlot(b);
}
function refreshSoldierStats() {
  for (const s of soldiers) { const r = s.hp / s.maxHp; s.maxHp = troopMaxHp(s.barrack); s.hp = s.alive ? s.maxHp * r : 0; }
  const r = player.hp / player.maxHp; player.maxHp = playerMaxHp(); player.hp = player.maxHp * r;
}
function barrackCost(typeIdx) { return TROOPS[typeIdx].bCost + plotFee(S.barracks.length); }
const maxZoneReached = () => { let z = 0; for (const g of gateObjs) if (g.open) z = Math.max(z, g.zone); return z; };
function buyBarrack(typeIdx, free = false, autoTroop = true) {
  if (S.barracks.length >= S.plots) { toast(S.plots < MAX_PLOTS ? 'All your plots are used. Buy another plot in the Barracks pad' : 'All 20 plots are used', 'bad'); return null; }
  const t = TROOPS[typeIdx];
  if (!free && !zoneUnlocked(t.zone)) {
  toast(`Unlock ${ZONES[t.zone].name} first`, 'bad');
  return null;
}

  if (!free && !spend(barrackCost(typeIdx))) return null;
  const used = new Set(S.barracks.map((b) => b.plot));
  const plot = PLOTS.findIndex((p) => !used.has(p.i) && p.i < S.plots);
  const b = { uid: S.bUid++, type: typeIdx, plot, level: 1, xp: 0, troops: 0, weapon: null, armor: null, elite: 0 };
  const starter = STARTER[t.cls];
  if (starter) { if (!S.owned[starter]) S.owned[starter] = true; b.weapon = starter; }
  S.barracks.push(b);
  equipBest(b, true);
  if (autoTroop) { b.troops = 1; spawnTroop(b); }
  refreshPlot(b);
  if (!free) { toast(`Built a ${t.name} barrack${autoTroop ? ' · +1 troop' : ''}`, 'good'); burst(barrackDoor(b), t.shirt, 16); }
  checkQuest();
  return b;
}
function buyTroop(b) {
  if (b.troops >= barrackCap(b.level)) { toast(`This barrack is full. Level ${b.level < 4 ? 4 : b.level < 8 ? 8 : 12} adds another slot`, 'bad'); return; }
  const t = TROOPS[b.type];
  if (!spend(t.cost)) return;
  b.troops++;
  spawnTroop(b);
  refreshPlot(b);
  toast(`+1 ${t.name}`, 'good');
  checkQuest();
}
function giveBarrackXp(b, xp) {
  if (b.level >= BARRACK_MAX_LV) return;
  b.xp += xp * (S.potions.exp > 0 ? 1.2 : 1);
  let up = false;
  while (b.level < BARRACK_MAX_LV && b.xp >= bXpNeed(b.level)) { b.xp -= bXpNeed(b.level); b.level++; up = true; }
  if (b.level >= BARRACK_MAX_LV) b.xp = 0;
  if (up) {
    const newCap = barrackCap(b.level);
    toast(`${TROOPS[b.type].name} barrack reached level ${b.level}${newCap > barrackCap(b.level - 1) ? ` · +1 troop slot` : ''}`, 'good', 3000);
    const s = soldiers.find((x) => x.barrack === b && x.alive);
    if (s) popNumber(s.pos, s.barY + 0.5, `LV ${b.level}`, 'lvl');
    if (!giveBarrackXp.cool || S.time - giveBarrackXp.cool > 0.4) { sfx('level'); giveBarrackXp.cool = S.time; }
    refreshSoldierStats(); refreshPlot(b); checkQuest();
  }
}
function splitBarrackXp(total) {
  if (!S.barracks.length) return;
  for (const b of S.barracks) giveBarrackXp(b, total / S.barracks.length);
}
function itemScore(it) { return it.type === 'armor' ? it.hp : (it.min + it.max); }
function equipBest(b, silent) {
  const cls = TROOPS[b.type].cls;
  let bw = b.weapon ? ITEMS[b.weapon] : null, ba = b.armor ? ITEMS[b.armor] : null;
  for (const id in S.owned) {
    const it = ITEMS[id]; if (!it) continue;
    if (it.type === 'weapon' && it.cls === cls && (!bw || itemScore(it) > itemScore(bw))) bw = it;
    if (it.type === 'armor' && (!ba || itemScore(it) > itemScore(ba))) ba = it;
  }
  const ch = (bw ? bw.id : null) !== b.weapon || (ba ? ba.id : null) !== b.armor;
  b.weapon = bw ? bw.id : null; b.armor = ba ? ba.id : null;
  if (ch) { rebuildTroops(b); refreshSoldierStats(); }
  if (!silent && ch) toast(`${TROOPS[b.type].name} barrack equipped ${weaponOf(b).name} and ${armorOf(b).name}`, 'good');
}
function grantItem(id, at) {
  const it = ITEMS[id];
  if (S.owned[id]) {
    const g = Math.round(Math.max(it.cost * 0.3, 50 * Math.pow(4, it.zone)));
    addGold(g); if (at) popNumber(at, 3, `${it.name} → +${fmt(g)}`, 'gold');
    return false;
  }
  S.owned[id] = true;
  if (ACC[it.type]) { if (!S[it.type] || ITEMS[S[it.type]].v < it.v) S[it.type] = id; toast(`New ${it.type}: ${it.name} (+${Math.round(it.v * 100)}% ${ACC_INFO[it.type].stat})`, 'gold', 4000); }
  else toast(`New ${it.type}: ${it.name}. Equip it in the Barracks`, 'gold', 4000);
  if (at) popNumber(at, 3.5, it.name, 'lvl');
  sfx('level');
  refreshSoldierStats(); checkQuest();
  return true;
}

// -------------------------------------------------------------- CAMERA ---
const cam = { yaw: Math.PI * 0.5 + 0.35, pitch: 0.62, dist: 24, tYaw: Math.PI * 0.5 + 0.35, tDist: 24, target: new THREE.Vector3() };
function updateCamera(dt) {
  cam.yaw += (cam.tYaw - cam.yaw) * Math.min(1, dt * 10);
  cam.dist += (cam.tDist - cam.dist) * Math.min(1, dt * 8);
  const focus = S.mode === 'title' ? new THREE.Vector3(10, 0, 0) : player.pos;
  cam.target.lerp(new THREE.Vector3(focus.x, focus.y + 1.6, focus.z), Math.min(1, dt * 8));
  const cp = Math.cos(cam.pitch);
  camera.position.set(
    cam.target.x - Math.sin(cam.yaw) * cam.dist * cp,
    cam.target.y + Math.sin(cam.pitch) * cam.dist,
    cam.target.z - Math.cos(cam.yaw) * cam.dist * cp,
  );
  camera.lookAt(cam.target);
  sun.position.set(cam.target.x - 25, 50, cam.target.z + 20);
  sun.target.position.copy(cam.target);
}


// --------------------------------------------------------------- INPUT ---
const keys = {};
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let drag = null;

window.addEventListener('keydown', (e) => {
  if (S.mode !== 'play') return;
  if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === ' ' ) { e.preventDefault(); if (player.pos.y <= 0.01) { player.vy = 11; sfx('jump'); } }
  if (k === 'f') rally();
  if (k === 'g') useSkill(0);
  if (k === 'v') useSkill(1);
  if (k === 't') togglePanel('teleport');
  if (k === 'i') togglePanel('index');
  if (k === 'j') togglePanel('quests');
  if (k === 'c') togglePanel('codes');
  if (k === 'q') cam.tYaw += 0.5;
  if (k === 'e') cam.tYaw -= 0.5;
  if (k === 'tab') { e.preventDefault(); togglePanel('army'); }
  if (k === 'o') openPanel('command',0);
  if (!e.repeat && k === 'p') openPanel('command',1);
  if (!e.repeat && k === '1') setCommandMode('follow');
  if (!e.repeat && k === '2') setCommandMode('hold');
  if (!e.repeat && k === '3') setCommandMode('rush');
  if (!e.repeat && k === '4') setFormation('line');
  if (!e.repeat && k === '5') setFormation('wedge');
  if (!e.repeat && k === '6') setFormation('circle');
  if (k === 'h') togglePanel('help');
  if (k === 'm') toggleSound();
  if (k === 'b') togglePanel('season');
  if (k === 'x') togglePanel('expeditions');
  if (k === 'y') togglePanel('bounties');
  if (k === 'escape') closePanel();
  if (k === '`') fpsEl.classList.toggle('hidden');
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) player.moveTo = null;
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
renderer.domElement.addEventListener('pointerdown', (e) => {
  drag = { x: e.clientX, y: e.clientY, btn: e.button, moved: 0, yaw: cam.tYaw, pitch: cam.pitch, id: e.pointerId };
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
  if (drag.btn === 2 || (drag.btn === 0 && drag.moved > 12)) {
    cam.tYaw = drag.yaw - dx * 0.006;
    cam.yaw = cam.tYaw;
    cam.pitch = clamp(drag.pitch + dy * 0.004, 0.2, 1.3);
  }
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const d = drag; drag = null;
  if (S.mode !== 'play') return;
  if (d.btn === 0 && d.moved < 12) handleClick(e.clientX, e.clientY);
});
renderer.domElement.addEventListener('wheel', (e) => {
  cam.tDist = clamp(cam.tDist + Math.sign(e.deltaY) * 2.5, 10, 55);
}, { passive: true });

function handleClick(cx, cy) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  for (const h of hits) {
    const ent = h.object.userData.ent;
    if (ent && ent.alive && h.object.visible) { commandAttack(ent); return; }
  }
  const p = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, p)) {
    player.moveTo = new THREE.Vector3(p.x, 0, p.z);
    showMoveMarker(player.moveTo);
  }
}
function commandAttack(ent) {
  const alive = soldiers.filter((s) => s.alive);
  if (!alive.length) { toast(soldiers.length ? 'Your troops are respawning at their barracks' : 'Buy troops at the Barracks first', 'bad'); return; }
  armyTarget = ent; S.command.mode='rush'; S.command.orders=(S.command.orders||0)+1;
  for (const s of alive) { if (s.def.healer) continue; s.state = 'attack'; s.target = ent; }
  showTargetRing(ent); updateCommandHud();
  sfx('command');
}

function recordChain(reason = '') {
  const c = S.chain || (S.chain = { count: 0, lastAt: -99, best: 0 });
  if (S.time - c.lastAt > 4.5) c.count = 0;
  const previous = c.count;
  c.count = Math.min(30, c.count + 1);
  c.lastAt = S.time;
  c.best = Math.max(c.best || 0, c.count);
  if (c.count >= 3 && c.count % 3 === 0) {
    const bonus = Math.min(3000 * c.count, 30000);
    addGold(Math.round(bonus * 0.05));
    popNumber(player.pos, 3.6, `CHAIN x${c.count}`, 'gold');
    if (c.count === 6 || c.count === 12 || c.count === 18) musicStinger('combo');
  }
  for (const [milestone, multiplier] of [[5, 5], [10, 12], [20, 30]]) {
    if (previous < milestone && c.count >= milestone) {
      const reward = Math.round(zoneStats(zoneAt(player.pos.x, player.pos.z)).gold * multiplier * goldMult());
      addGold(reward);
      seasonGainXp(milestone * 2, `Kill chain x${milestone}`);
      gainCommanderXp(milestone, `Kill chain x${milestone}`);
      toast(`KILL CHAIN x${milestone} · +${fmt(reward)} gold · +${milestone * 2} Season XP`, 'gold', 3800);
      popNumber(player.pos, 4, `CHAIN x${milestone} REWARD`, 'gold');
      musicStinger('combo');
    }
  }
}
function decayChain(dt) {
  const c = S.chain;
  if (!c || !c.count) return;
  if (S.time - c.lastAt > 4.5) c.count = Math.max(0, c.count - dt * 1.6);
}
function autoChainTarget(dead) {
  if (!S.smartChain || !armyTarget || armyTarget !== dead || S.director?.active) return;
  if (dead.def.boss || dead.def.summoned || dead.def.event || dead.def.war || dead.def.raid) return;
  const sameZone = zoneAt(dead.pos.x, dead.pos.z);
  let best = null, bd = 22 * 22;
  for (const e of entities) {
    if (!e.alive || e === dead || e.def.boss || e.def.passive || e.def.dummy) continue;
    if (e.kind !== dead.kind || zoneAt(e.pos.x, e.pos.z) !== sameZone) continue;
    const d = dist2(e.pos, dead.pos);
    if (d < bd) { bd = d; best = e; }
  }
  if (!best) {
    armyTarget = null;
    targetRing.visible = false;
    return;
  }
  armyTarget = best;
  for (const s of soldiers) if (s.alive && !s.def.healer) { s.state = 'attack'; s.target = best; }
  showTargetRing(best);
}
const COMMAND_MODES={follow:'FOLLOW',hold:'HOLD',rush:'RUSH'}; const FORMATIONS={line:'LINE',wedge:'WEDGE',circle:'CIRCLE'}; const TARGET_PRIORITIES={nearest:'NEAREST',strongest:'STRONGEST',weakest:'WEAKEST',boss:'BOSS'};
function chooseCommandTarget(){const zi=zoneAt(player.pos.x,player.pos.z);let a=entities.filter(e=>e.alive&&e.kind==='enemy'&&!e.def.passive&&!e.def.dummy&&!e.def.event&&!e.def.war&&!e.def.raid&&zoneAt(e.pos.x,e.pos.z)===zi);if(!a.length)return null;const p=S.command.priority||'nearest';if(p==='boss'){const b=a.filter(e=>e.def.boss);if(b.length)a=b;}if(p==='strongest')a.sort((x,y)=>y.maxHp-x.maxHp);else if(p==='weakest')a.sort((x,y)=>x.hp-y.hp);else if(p==='boss')a.sort((x,y)=>(y.def.boss?1:0)-(x.def.boss?1:0)||dist2(x.pos,player.pos)-dist2(y.pos,player.pos));else a.sort((x,y)=>dist2(x.pos,player.pos)-dist2(y.pos,player.pos));return a[0]||null;}
function setCommandMode(mode){if(!COMMAND_MODES[mode])return;S.command.mode=mode;S.command.orders=(S.command.orders||0)+1;if(mode==='follow'){armyTarget=null;for(const s of soldiers)if(s.alive){s.state='follow';s.target=null;}targetRing.visible=false;toast('ORDER: FOLLOW','');}else if(mode==='hold'){armyTarget=null;for(const s of soldiers)if(s.alive){s.state='hold';s.target=null;s.holdPos=s.pos.clone();}targetRing.visible=false;toast('ORDER: HOLD POSITION','');}else{const t=chooseCommandTarget();if(t){armyTarget=t;for(const s of soldiers)if(s.alive&&!s.def.healer){s.state='attack';s.target=t;}showTargetRing(t);}toast(t?'ORDER: RUSH':'RUSH: NO TARGET','');}updateCommandHud();sfx('command');autoSave();}
function setFormation(id){if(!FORMATIONS[id])return;S.command.formation=id;S.command.orders=(S.command.orders||0)+1;toast(`FORMATION: ${FORMATIONS[id]}`,'');updateCommandHud();sfx('command',.7);autoSave();}
function setTargetPriority(id){if(!TARGET_PRIORITIES[id])return;S.command.priority=id;const t=chooseCommandTarget();if(t){armyTarget=t;for(const s of soldiers)if(s.alive&&!s.def.healer){s.state='attack';s.target=t;}showTargetRing(t);}toast(`TARGET: ${TARGET_PRIORITIES[id]}`,'');updateCommandHud();}
function commandDestination(s,slot,total,t,fwd,right){const fm=S.command.formation||'line',tp=t.pos;if(fm==='circle'){const a=slot/Math.max(1,total)*Math.PI*2,rad=t.radius+4.2+(s.def.ranged?4:0);return{x:tp.x+Math.cos(a)*rad,z:tp.z+Math.sin(a)*rad};}if(fm==='wedge'){const depth=Math.floor(slot/5),side=(slot%5)-2;return{x:tp.x-fwd.x*(1.7+depth*2)+right.x*side*(1.2+depth*.55),z:tp.z-fwd.z*(1.7+depth*2)+right.z*side*(1.2+depth*.55)};}const row=Math.floor(slot/6),col=(slot%6)-2.5,back=s.def.ranged?4.5+row*1.4:t.radius+1.5+row*1.1;return{x:tp.x-fwd.x*back+right.x*col*1.55,z:tp.z-fwd.z*back+right.z*col*1.55};}
function updateCommandHud(){const el=$('commandHud');if(!el)return;el.classList.remove('hidden');el.innerHTML=`<div><b>${COMMAND_MODES[S.command.mode]||'FOLLOW'}</b> · ${FORMATIONS[S.command.formation]||'LINE'}</div><small>Target: ${TARGET_PRIORITIES[S.command.priority]||'NEAREST'} · ${soldiers.length} units</small>`;}
function rally(){setCommandMode('follow');toast('Army, fall in!','');}

// markers
const targetRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 6, 40), new THREE.MeshBasicMaterial({ color: 0xff3b3b }));
targetRing.rotation.x = Math.PI / 2; targetRing.visible = false; scene.add(targetRing);
function showTargetRing(ent) { targetRing.visible = true; targetRing.userData.ent = ent; targetRing.material.color.set(ent.kind === 'node' ? 0xffc83d : 0xff3b3b); }
const moveMarker = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 6, 30), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
moveMarker.rotation.x = Math.PI / 2; moveMarker.visible = false; scene.add(moveMarker);
function showMoveMarker(p) { moveMarker.position.set(p.x, 0.15, p.z); moveMarker.visible = true; moveMarker.userData.t = 0; }


// ------------------------------------------------------------ MOVEMENT ---
function constrain(pos, prev, isPlayer) {
  if (!inRegion(pos)) {
    if (inRegion({ x: pos.x, z: prev.z })) pos.z = prev.z;
    else if (inRegion({ x: prev.x, z: pos.z })) pos.x = prev.x;
    else { pos.x = prev.x; pos.z = prev.z; }
    if (!inRegion(pos)) { pos.x = clamp(pos.x, X_MIN, X_MAX); pos.z = clamp(pos.z, Z_MIN, Z_MAX); }
    if (isPlayer) for (const g of annexGateObjs) if (!g.open && Math.abs(pos.x - g.x) < 4 && pos.z > g.z - 3 && S.time - (g.warned || -99) > 3) { g.warned = S.time; toast(annexReqText(g), 'bad', 3500); }
  }
  if (pos.z > Z_MAX + 0.5) return;
  for (const g of gateObjs) {
    const crossing = (prev.x < g.x) !== (pos.x < g.x) || Math.abs(pos.x - g.x) < 1.2;
    if (crossing && (!g.open || Math.abs(pos.z) > 3.8)) {
      pos.x = prev.x < g.x ? Math.min(pos.x, g.x - 1.25) : Math.max(pos.x, g.x + 1.25);
      if (isPlayer && !g.open && S.time - (g.warned || -99) > 3) { g.warned = S.time; toast(!gateRebirthUnlocked(g) ? `${ZONES[g.zone].name} requires ${g.rebirthReq} rebirth${g.rebirthReq===1?'':'s'} first` : `${ZONES[g.zone].name} requires ${g.req} units. You have ${soldiers.length}`, 'bad', 3000); }
    }
  }
}
const rReq = (g) => Number(g?.rebirthReq || 0);
function annexReqText(g) {
  const r = g.req, Z = ZONES[g.zone].name;
  if (!gateRebirthUnlocked(g) && Number(rReq(g)) > 0) return `${Z} requires ${rReq(g)} rebirth${rReq(g)===1?'':'s'}${r.units ? ` and ${r.units} units` : ''}`;
  if (r.units) return `${Z} requires ${r.units} units. You have ${soldiers.length}`;
  if (r.boss && !S.bossesDown[r.boss]) return `${Z} requires defeating the ${ENEMIES[r.boss].name} and ${fmt(r.gold)} gold`;
  return `Step on the pad to pay ${fmt(r.gold)} gold and open ${Z}`;
}
function pushOutOfNodes(pos, r) {
  for (const e of entities) {
    if (!e.alive || e.kind !== 'node') continue;
    const dx = pos.x - e.pos.x, dz = pos.z - e.pos.z, d = Math.hypot(dx, dz), min = e.radius + r;
    if (d < min && d > 0.0001) { pos.x = e.pos.x + (dx / d) * min; pos.z = e.pos.z + (dz / d) * min; }
  }
  for (const p of PLOTS) {
    if (!p.group) continue;
    if (Math.abs(pos.x - p.x) < 3 + r && Math.abs(pos.z - p.z) < 3 + r) {
      const ox = (3 + r) - Math.abs(pos.x - p.x), oz = (3 + r) - Math.abs(pos.z - p.z);
      if (ox < oz) pos.x += ox * Math.sign(pos.x - p.x || 1); else pos.z += oz * Math.sign(pos.z - p.z || 1);
    }
  }
  // base buildings
  for (const p of PADS) {
    const { bx, bz } = p;
    if (Math.abs(pos.x - bx) < 4 + r && Math.abs(pos.z - bz) < 4 + r) {
      const ox = (4 + r) - Math.abs(pos.x - bx), oz = (4 + r) - Math.abs(pos.z - bz);
      if (ox < oz) pos.x += ox * Math.sign(pos.x - bx || 1); else pos.z += oz * Math.sign(pos.z - bz || 1);
    }
  }
}
function navPointClear(x, z, r = 0.6) {
  const p = { x, z };
  if (!inRegion(p)) return false;

  for (const e of entities) {
    if (!e.alive || e.kind !== 'node' || !e.pos) continue;
    if (Math.abs(x - e.pos.x) > 12 || Math.abs(z - e.pos.z) > 12) continue;
    const rr = e.radius + r + 0.08;
    if ((x - e.pos.x) ** 2 + (z - e.pos.z) ** 2 < rr * rr) return false;
  }

  for (const p of PLOTS) {
    if (!p.group || Math.abs(x - p.x) > 8 || Math.abs(z - p.z) > 8) continue;
    if (Math.abs(x - p.x) < 3 + r && Math.abs(z - p.z) < 3 + r) return false;
  }

  for (const p of PADS) {
    if (Math.abs(x - p.bx) > 10 || Math.abs(z - p.bz) > 10) continue;
    if (Math.abs(x - p.bx) < 4 + r && Math.abs(z - p.bz) < 4 + r) return false;
  }

  return true;
}

function navSegmentClear(ax, az, bx, bz, r = 0.6) {
  const dx = bx - ax, dz = bz - az;
  const d = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(d / Math.max(0.7, r * 1.25)));
  let px = ax, pz = az;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = ax + dx * t, z = az + dz * t;
    if (!navPointClear(x, z, r)) return false;
    const probe = new THREE.Vector3(x, 0, z);
    const before = { x: px, z: pz };
    constrain(probe, before, false);
    if (Math.hypot(probe.x - x, probe.z - z) > Math.max(0.45, r * 0.9)) return false;
    px = x; pz = z;
  }
  return true;
}

function navFindLocalRoute(u, tx, tz, r = 0.6) {
  const cell = 2.0;
  const size = 15;
  const half = Math.floor(size / 2);
  const sx = u.pos.x, sz = u.pos.z;
  const dx = tx - sx, dz = tz - sz, d = Math.hypot(dx, dz) || 1;
  const reach = Math.min(14, d);
  const gxWorld = sx + dx / d * reach;
  const gzWorld = sz + dz / d * reach;

  const toCell = (x, z) => [clamp(Math.round((x - sx) / cell) + half, 0, size - 1), clamp(Math.round((z - sz) / cell) + half, 0, size - 1)];
  const fromCell = (ix, iz) => ({ x: sx + (ix - half) * cell, z: sz + (iz - half) * cell });
  const start = [half, half];
  let goal = toCell(gxWorld, gzWorld);

  // If the desired point is blocked, search nearby cells for the closest usable goal.
  let gp = fromCell(goal[0], goal[1]);
  if (!navPointClear(gp.x, gp.z, r)) {
    let best = null, bd = Infinity;
    for (let iz = 0; iz < size; iz++) for (let ix = 0; ix < size; ix++) {
      const p = fromCell(ix, iz);
      if (!navPointClear(p.x, p.z, r)) continue;
      const q = (p.x - gxWorld) ** 2 + (p.z - gzWorld) ** 2;
      if (q < bd) { bd = q; best = [ix, iz]; }
    }
    if (best) goal = best;
  }

  const key = (ix, iz) => iz * size + ix;
  const open = [{ ix: start[0], iz: start[1], g: 0, f: 0 }];
  const came = new Map();
  const gScore = new Map([[key(start[0], start[1]), 0]]);
  const closed = new Set();
  const h = (ix, iz) => Math.hypot(ix - goal[0], iz - goal[1]);
  open[0].f = h(start[0], start[1]);
  const dirs = [
    [1,0,1],[-1,0,1],[0,1,1],[0,-1,1],
    [1,1,1.414],[-1,1,1.414],[1,-1,1.414],[-1,-1,1.414],
  ];

  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.ix, cur.iz);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.ix === goal[0] && cur.iz === goal[1]) {
      const path = [];
      let k = ck;
      while (k !== key(start[0], start[1])) {
        const pair = came.get(k);
        if (!pair) break;
        path.push(fromCell(pair.ix, pair.iz));
        k = pair.from;
      }
      path.reverse();
      return path;
    }

    for (const [ox, oz, cost] of dirs) {
      const nx = cur.ix + ox, nz = cur.iz + oz;
      if (nx < 0 || nz < 0 || nx >= size || nz >= size) continue;
      const nk = key(nx, nz);
      if (closed.has(nk)) continue;
      const p = fromCell(nx, nz);
      if (!navPointClear(p.x, p.z, r)) continue;
      const c = fromCell(cur.ix, cur.iz);
      if (!navSegmentClear(c.x, c.z, p.x, p.z, r)) continue;
      const ng = cur.g + cost;
      if (ng >= (gScore.get(nk) ?? Infinity)) continue;
      gScore.set(nk, ng);
      came.set(nk, { from: ck, ix: nx, iz: nz });
      open.push({ ix: nx, iz: nz, g: ng, f: ng + h(nx, nz) });
    }
  }
  return null;
}

function navWaypoint(u, tx, tz, r = 0.6) {
  const now = S.time;
  const dTarget = Math.hypot(tx - u.pos.x, tz - u.pos.z);
  const routeTargetMoved = !Number.isFinite(u.navTx) || Math.hypot(tx - u.navTx, tz - u.navTz) > 2.5;
  const needRepath = !Array.isArray(u.navRoute) || u.navRoute.length === 0 || now >= (u.navRepath || 0) || routeTargetMoved;
  if (needRepath) {
    const route = navFindLocalRoute(u, tx, tz, r);
    u.navRoute = route || [];
    u.navRouteIndex = 0;
    u.navTx = tx; u.navTz = tz;
    u.navRepath = now + (route?.length ? 0.55 : 0.2);
  }
  if (!u.navRoute?.length) return null;
  while (u.navRouteIndex < u.navRoute.length) {
    const p = u.navRoute[u.navRouteIndex];
    if (Math.hypot(p.x - u.pos.x, p.z - u.pos.z) < 1.15) u.navRouteIndex++;
    else break;
  }
  return u.navRoute[u.navRouteIndex] || null;
}

function moveToward(u, tx, tz, speed, dt, stopDist = 0.1) {
  const dx = tx - u.pos.x, dz = tz - u.pos.z;
  const d = Math.hypot(dx, dz);
  if (d <= stopDist) {
    u.moving = false;
    u.navRoute = [];
    if (u.stuckT != null) u.stuckT = 0;
    return true;
  }

  const directClear = navSegmentClear(u.pos.x, u.pos.z, tx, tz, Math.max(0.45, u.radius || 0.6));
  let targetX = tx, targetZ = tz;
  if (!directClear && d > 1.2) {
    const wp = navWaypoint(u, tx, tz, Math.max(0.45, u.radius || 0.6));
    if (wp) { targetX = wp.x; targetZ = wp.z; }
  } else if (u.navRoute?.length) {
    u.navRoute = [];
  }

  const ddx = targetX - u.pos.x, ddz = targetZ - u.pos.z;
  const dd = Math.hypot(ddx, ddz) || 1;
  const step = Math.min(dd - Math.min(stopDist, dd * 0.5), speed * dt);
  const nx = ddx / dd, nz = ddz / dd;
  const prev = u.pos.clone();
  u.pos.x += nx * step; u.pos.z += nz * step;
  constrain(u.pos, prev, false);
  let moved = Math.hypot(u.pos.x - prev.x, u.pos.z - prev.z);

  if (moved < Math.max(0.005, step * 0.18)) {
    u.stuckT = (u.stuckT || 0) + dt;
    // Last-resort sweep if the local route is blocked by an unexpected dynamic state.
    const tries = [0.45, -0.45, 0.8, -0.8, 1.15, -1.15, 1.55, -1.55];
    let solved = false;
    for (const a of tries) {
      const c = Math.cos(a), s = Math.sin(a);
      const ax = nx * c - nz * s, az = nx * s + nz * c;
      const p = u.pos.clone(); p.x += ax * step * 1.35; p.z += az * step * 1.35;
      const before = u.pos.clone();
      if (!navSegmentClear(before.x, before.z, p.x, p.z, Math.max(0.45, u.radius || 0.6))) continue;
      constrain(p, before, false);
      const gain = Math.hypot(p.x - before.x, p.z - before.z);
      if (gain > Math.max(0.01, step * 0.22)) {
        u.pos.copy(p); moved = Math.hypot(u.pos.x - prev.x, u.pos.z - prev.z); solved = true; u.navRoute = []; break;
      }
    }
    if (!solved && u.stuckT > 0.9) {
      u.navRoute = [];
      u.navRepath = 0;
      const side = (u.stuckSide = -(u.stuckSide || 1));
      const p = u.pos.clone();
      p.x += -nz * side * Math.min(1.0, speed * dt * 1.5);
      p.z += nx * side * Math.min(1.0, speed * dt * 1.5);
      const before = u.pos.clone();
      constrain(p, before, false);
      if (Math.hypot(p.x - before.x, p.z - before.z) > 0.01) { u.pos.copy(p); u.stuckT = 0; }
    }
  } else if (u.stuckT != null) {
    u.stuckT = Math.max(0, u.stuckT - dt * 2.5);
  }

  faceDir(u, ddx, ddz, dt);
  u.moving = moved > 0.001;
  return false;
}
function faceDir(u, dx, dz, dt) {
  const target = Math.atan2(dx, dz);
  let diff = target - u.mesh.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  u.mesh.rotation.y += diff * Math.min(1, dt * 14);
}
function animateModel(u, dt) {
  const m = u.model;
  const wings = m.wings || (m.parts && m.parts.wings);
  if (wings) wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.25 + Math.sin(S.time * 9 + u.home.x) * 0.45); });
  if (m.kind === 'ufo') { m.body.rotation.y += dt * 1.6; m.body.position.y = Math.sin(S.time * 2) * 0.5; }
  if (m.kind === 'bird') m.body.position.y = 0.3 + Math.sin(S.time * 3 + u.home.x) * 0.25;
  if (!m.parts) return;
  u.walk += dt * (u.moving ? 11 : 0);
  const sw = u.moving ? Math.sin(u.walk) * 0.8 : 0;
  if (m.horseLegs) m.horseLegs.forEach((l, i) => { l.rotation.x = (i % 2 ? sw : -sw) * 0.7; });
  if (m.kind === 'biped') {
    const p = m.parts;
    p.legL.rotation.x += (sw - p.legL.rotation.x) * Math.min(1, dt * 16);
    p.legR.rotation.x += (-sw - p.legR.rotation.x) * Math.min(1, dt * 16);
    p.armL.rotation.x += (-sw * 0.8 - p.armL.rotation.x) * Math.min(1, dt * 16);
    let armR = sw * 0.8;
    if (u.attackAnim > 0) { u.attackAnim -= dt; const k = u.attackAnim / 0.3; armR = -2.2 * Math.sin(k * Math.PI); }
    p.armR.rotation.x += (armR - p.armR.rotation.x) * Math.min(1, dt * 22);
  } else {
    if (m.kind === 'serpent') { m.parts.segs.forEach((g, i) => { g.position.x = Math.sin(S.time * 6 + i * 0.9) * 0.25 * (u.moving ? 1.6 : 0.6); }); if (u.attackAnim > 0) u.attackAnim -= dt; return; }
    if (m.parts.legs) m.parts.legs.forEach((l, i) => { l.rotation.x = (i % 2 ? sw : -sw) * 0.7; });
    if (u.attackAnim > 0 && !m.parts.head) u.attackAnim -= dt;
    if (u.attackAnim > 0 && m.parts.head) { u.attackAnim -= dt; m.parts.head.position.z = m.parts.head.userData.z0 ?? (m.parts.head.userData.z0 = m.parts.head.position.z); m.parts.head.position.z = m.parts.head.userData.z0 + Math.sin((u.attackAnim / 0.3) * Math.PI) * 0.4; }
  }
}


// -------------------------------------------------------------- COMBAT ---
const dps = { total: 0, start: 0, last: -99 };
function damage(target, amount, source) {
  if (!target || target.alive !== true || !target.pos || !Number.isFinite(target.pos.x) || !Number.isFinite(target.pos.z) || !Number.isFinite(amount)) return;
  if (!target.kind) { // ally
    if (!target.isPlayer) {
      if (target.def.dr) amount *= 1 - target.def.dr;
      if (target.def.absorber) target.absorbed += amount;
      const ae = enchOf(target.barrack, 'armor');
      if (ae.dodge && rnd() < ae.dodge) { popNumber(target.pos, target.barY || 2, 'MISS', 'lvl'); return; }
      if (ae.thorns && source && source.kind === 'enemy' && source.alive) damage(source, amount * ae.thorns, null);
    }
    if (S.fx.shield > 0) amount *= 0.5;
  }
  amount = Math.max(1, Math.round(amount * rr(0.9, 1.1)));
  if (!target.kind || (target.kind === 'enemy' && !target.def.passive && !target.def.dummy)) music.fight = S.time;
  if (target.kind && target.def.dummy) {
    if (S.time - dps.last > 3) { dps.total = 0; dps.start = S.time; }
    dps.total += amount; dps.last = S.time; target.flash = 0.12;
    popNumber(target.pos, target.barY * 0.7, fmt(amount), '');
    return;
  }
  // Co-op raid bosses use server-authoritative shared health. The hook returns
  // true when the network layer has queued this damage for the room server.
  if (target.kind === 'enemy' && target._coopRaid && typeof window.__coopInterceptBossDamage === 'function') {
    try { if (window.__coopInterceptBossDamage(target, amount, source)) return; } catch (err) { console.warn('Co-op damage hook failed', err); }
  }
  target.hp -= amount;
  if (target.kind) {
    target.flash = 0.12;
    if (target.kind === 'enemy' && source && !target.def.passive) { target.state = 'chase'; if (!target.target || rnd() < 0.3) target.target = source; }
    if (target.kind === 'enemy' && target.def.passive) { target.fleeFrom = source; target.fleeT = 2.5; }
    const crit = source && source.lastCrit; if (crit) source.lastCrit = false;
    popNumber(target.pos, target.barY * 0.7, crit ? fmt(amount) + '!' : fmt(amount), crit ? 'crit' : '');
    if (source && source.barrack && !source.isPlayer && target.kind === 'enemy') {
      const we = enchOf(source.barrack, 'weapon');
      if (we.steal && source.alive) source.hp = Math.min(source.maxHp, source.hp + amount * we.steal);
      if (we.splash) { for (const o of entities) if (o !== target && o.alive && o.kind === 'enemy' && !o.def.passive && dist2(o.pos, target.pos) < 9) damage(o, amount * we.splash, null); if (rnd() < 0.3) burst(target.pos, 0xff5a2a, 3); }
    }
    if (target.hp <= 0) killEntity(target, source);
  } else {
    target.lastHurt = S.time;
    if (target.isPlayer) { popNumber(target.pos, 2.4, '-' + fmt(amount), 'hurt'); sfx('hurt'); }
    if (target.hp <= 0) target.isPlayer ? playerDown() : soldierDown(target);
  }
}
function lootRarity(id) {
  if (id.startsWith('skill:')) return { name:'MYTHIC', color:'#ff6fd8', stinger:'legendary' };
  const it=ITEMS[id]; if (it && it.cost===0) return { name:'LEGENDARY', color:'#ffc83d', stinger:'legendary' };
  if (KEY[id]) return { name:'RELIC', color:'#b36bff', stinger:'rare' };
  return { name:'RARE', color:'#8fe0ff', stinger:'rare' };
}
function rareLootFeedback(id, at){
  const r=lootRarity(id); const label = id.startsWith('skill:') ? SKILLS[id.slice(6)].name : ITEMS[id] ? ITEMS[id].name : KEY[id] ? KEY[id].name : RES[id]?.name || id;
  if(at){ burst(at, r.color, r.name==='MYTHIC'?34:r.name==='LEGENDARY'?26:18); popNumber(at, 4.3, `${r.name} · ${label}`, 'lvl'); }
  banner(r.name, label); musicStinger(r.stinger);
}
function giveLoot(id, n, at) {
  if (id.startsWith('skill:')) {
    const sk = id.slice(6);
    if (!S.skills[sk]) { rareLootFeedback(id, at); S.skills[sk] = true; if (!S.skill) S.skill = sk; else if (!S.skill2) S.skill2 = sk; toast(`New skill: ${SKILLS[sk].name}. Equip it from the Army menu, press G to use`, 'gold', 5000); sfx('level'); }
    else { addGold(1000); }
    return;
  }
  if (ITEMS[id]) { if (!S.owned[id]) rareLootFeedback(id, at); grantItem(id, at); if (!S.lootDisc[id]) { S.lootDisc[id] = true; } return; }
  if (KEY[id]) { if (!S.lootDisc[id]) rareLootFeedback(id, at); if (!S.lootDisc[id]) S.lootDisc[id] = true; addKey(id, n, at); return; }
  if (!S.lootDisc[id]) { S.lootDisc[id] = true; toast(`New loot discovered: ${RES[id].name} (+3% luck)`, 'good', 3500); }
  addRes(id, n, at);
}
function killEntity(e, source) {
  // Idempotent guard: projectiles/AoE can resolve in the same frame.
  if (!e || e.alive !== true || !e.pos || !Number.isFinite(e.pos.x) || !Number.isFinite(e.pos.z)) return;
  e.alive = false; e.hp = 0; e.dying = 0.35; if (e.bar) e.bar.visible = false; e.castLockT = 0;
  e.respawnAt = S.time + (e.kind === 'node' ? e.def.respawn : e.def.boss ? 90 : 25);
  if (e._coopRaid || e.def.summoned || e.def.raid || e.def.meteor || e.def.event || e.def.war) e.respawnAt = Infinity;
  S.counts[e.typeId] = (S.counts[e.typeId] || 0) + 1;
  const alive = soldiers.filter((s) => s.alive);
  const bset = [...new Set(alive.map((s) => s.barrack))];
  if (e.kind === 'node') {
    recordChain('break');
    addMomentum(0.7);
    if (e.def.res) addRes(e.def.res, Math.round(e.def.n * matMult()), e.pos);
    for (const b of bset) giveBarrackXp(b, Math.max(1, e.def.hp / 15) / Math.max(1, bset.length) * Math.min(bset.length, 3));
    sfx('break');
    burst(e.pos, e.def.res ? RES[e.def.res].color : 0xc07bff, 10);
    if (e.def.summon) checkSummon(e.def.summon, e.typeId);
    if (e.def.meteor) meteorBroken(e);
  } else {
    S.kills++;
    seasonGainXp(e.def.boss ? 12 : 3, e.def.name);
    gainCommanderXp(e.def.boss ? 35 : 5, e.def.name);
    recordChain('kill');
    addMomentum(e.def.boss ? 2.5 : 1);
    if (e.director) { e.director = false; e.mul = 1; }
    const gm = (e.golden ? 8 : 1) * goldMult();
    spawnCoins(e.pos, e.def.gold * gm * (e.mul || 1));
    if (e.golden) { S.goldenKills++; toast(`Golden ${e.def.name} defeated. 8x gold`, 'gold', 3000); }
    if(e.eliteHunt){
      const eb=Math.round(e.def.gold*(e.eliteReward||5.5)); spawnCoins(e.pos,eb); addLegacyPoints(4,'Elite Hunt'); seasonGainXp(35,'Elite Hunt'); gainCommanderXp(40,'Elite Hunt'); toast(`ELITE DEFEATED · +${fmt(eb)} bonus gold`,'gold',4200);
    }
    const lm = luckMult() * (S.potions.luck > 0 ? 2 : 1) * (e.golden ? 3 : 1) * (e.eliteHunt ? 1.65 : 1);
    for (const [id, chance, n] of e.def.loot) if (rnd() < Math.min(1, chance * lm)) giveLoot(id, n, e.pos);
    for (const b of (S.bounty?.slots||[])) if(!b.claimed && b.target===e.typeId){ b.progress=Math.min(b.goal,(b.progress||0)+1); if(b.progress>=b.goal) toast(`BOUNTY READY · ${e.def.name}`,'gold',2600); }
    if(e.eliteHunt){e.eliteHunt=false;e.eliteEnds=0;if(e.eliteTag)e.eliteTag.visible=false;if(e.eliteRing)e.eliteRing.visible=false;e.model.root.scale.setScalar(1);}
    for (const b of bset) giveBarrackXp(b, e.def.xp * (e.mul || 1) * (e.golden ? 3 : 1) / Math.max(1, bset.length) * Math.min(bset.length, 3));
    burst(e.pos, 0xffffff, 12);
    sfx(e.def.boss ? 'bossdown' : 'kill');
    if (e.def.boss && !e.def.raid) { recordBossMastery(e); bossDefeated(e); }
    autoChainTarget(e);
    if (e === ufoEnt) for (const a of alienPool) if (a.alive) damage(a, a.maxHp * 2, null);
  }
  checkQuest();
  if (armyTarget === e) { armyTarget = null; targetRing.visible = false; }
  for (const s of soldiers) if (s.target === e) { s.target = null; s.state = 'follow'; }
}
function checkSummon(bossId, nodeId) {
  const nodes = entities.filter((x) => x.typeId === nodeId);
  const left = nodes.filter((x) => x.alive).length;
  const boss = entities.find((x) => x.typeId === bossId);
  if (left > 0) { toast(`${NODES[nodeId].name} destroyed. ${left} left`, 'gold', 3000); return; }
  if (boss && !boss.alive) {
    boss.alive = true; boss.hp = boss.maxHp; boss.mesh.visible = true; boss.pos.copy(boss.home); boss.dying = 0; boss.state = 'idle'; boss.bossPhase = 0; boss.phaseMul = 1; boss.enraged = false; boss.bossAttackCount = 0; boss.castLockT = 0; boss.vuln = 0; boss.lastExposeNotice = -99; boss.lastSignatureCallout = -99;
    boss.model.body.scale.setScalar(boss.model.body.userData.s0 ?? boss.model.body.scale.x);
    shock(boss.pos, 8); burst(boss.pos, 0xc07bff, 30); sfx('bossdown');
    banner(`${boss.def.name} has been summoned`, 'Defeat it for legendary loot');
  }
}
function bossDefeated(e) {
  const first = !S.bossesDown[e.typeId];
  if(e.roamer){ addLegacyPoints(8,`${e.def.name} defeated`); toast(`${e.def.name} defeated · the world will send another hunter later`,'gold',4500); e.respawnAt=S.time+75+rr(0,55); }
  S.bossesDown[e.typeId] = true;
  toast(`${e.def.name} defeated`, 'good', 3500);
  if (first) banner(`${e.def.name} Defeated`, 'Check your loot and the Index');
  musicStinger('victory');
  if (e.def.summoned) {
    const nodeId = e.def.summoned;
    setTimeout(() => { for (const n of entities) if (n.typeId === nodeId) { n.respawnAt = S.time + 45; } }, 10);
  }
  if (e.def.final && first && !S.won) { S.won = true; setTimeout(showVictory, 1600); }
}
function soldierDown(s) {
  s.alive = false; s.hp = 0; s.state = 'dead'; s.target = null; s.respawnAt = S.time + 10 * (1 - resV('respawn'));
  s.bar.visible = false; s.dieAnim = 0.5; burst(s.pos, s.def.shirt, 8);
  if (soldiers.every((x) => !x.alive)) toast('Your whole army has fallen. Troops respawn at their barracks', 'bad', 4000);
}
function playerDown() {
  if (!player || !player.mesh) return;
  const pp = player.mesh.position;
  if (!pp || !Number.isFinite(pp.x) || !Number.isFinite(pp.z)) player.pos = new THREE.Vector3(0, 0, 4);
  player.alive = false;
  const lost = Math.floor(S.packCount / 2);
  if (lost > 0) for (const k in S.pack) { const take = Math.floor(S.pack[k] / 2); S.pack[k] -= take; S.packCount -= take; if (!S.pack[k]) delete S.pack[k]; }
  sfx('down');
  toast(lost ? `You were knocked out and dropped ${lost} items` : 'You were knocked out', 'bad', 4000);
  setTimeout(() => {
    if (!player || !player.mesh || !player.mesh.position) return;
    const pp2 = player.mesh.position;
    if (!Number.isFinite(pp2.x) || !Number.isFinite(pp2.z)) player.pos = new THREE.Vector3(0, 0, 4);
    player.pos.set(0, 0, 4); player.hp = player.maxHp; player.alive = true; player.moveTo = null;
    for (const s of soldiers) if (s.alive) { s.pos.copy(barrackDoor(s.barrack)); s.state = 'follow'; s.target = null; s.hp = s.maxHp; }
    armyTarget = null; targetRing.visible = false; updateHud();
  }, 1200);
}

function updateEnemies(dt) {
  const allies = soldiers.filter((s) => s.alive);
  const absorbers = allies.filter((s) => s.def.absorber);
  if (player.alive) allies.push(player);
  for (const e of entities) {
    if (!e || !e.pos || !Number.isFinite(e.pos.x) || !Number.isFinite(e.pos.z) || !e.mesh) continue;
    if (!e.alive) {
      if (e.dying > 0) {
        e.dying -= dt;
        const k = Math.max(0, e.dying / 0.35);
        e.model.body.scale.setScalar(k * (e.model.body.userData.s0 ?? (e.model.body.userData.s0 = e.model.body.scale.x)));
        if (e.dying <= 0) e.mesh.visible = false;
      } else if (S.time >= e.respawnAt) { if(e.roamer) { placeRoamer(e); } else respawnEntity(e); }
      continue;
    }
    if (e.vuln > 0) e.vuln -= dt;
    if (e.flash > 0) {
      e.flash -= dt;
      const s0 = e.model.body.userData.s0 ?? (e.model.body.userData.s0 = e.model.body.scale.x);
      e.model.body.scale.setScalar(s0 * (1 + (e.kind === 'node' ? 0.08 : 0.05) * Math.sin(e.flash * 50)));
      if (e.flash <= 0) e.model.body.scale.setScalar(s0);
    }
    if (e.kind === 'node') continue;
    if (!e.def.boss && e.state !== 'chase' && dist2(e.pos, player.pos) > 65 * 65) continue;
    const d = e.def;
    e.cd -= dt; e.moving = false;
    if (e.castLockT > 0) e.castLockT = Math.max(0, e.castLockT - dt);
    if (e.charm > 0) { e.charm -= dt; if (rnd() < dt * 3) burst(e.pos, 0xff6fd8, 1); wander(e, dt); clampZone(e); animateModel(e, dt); continue; }
    if (d.boss) updateBossPhases(e);
    if (e.model.kind === 'flower') e.model.body.rotation.z = Math.sin(S.time * 3 + e.home.x) * 0.08;
    const homeD = Math.sqrt(dist2(e.pos, e.home));
    const leash = d.boss ? 26 : 20;
    if (d.passive) {
      if (e.fleeT > 0 && e.fleeFrom) {
        e.fleeT -= dt;
        const ax = e.pos.x - e.fleeFrom.pos.x, az = e.pos.z - e.fleeFrom.pos.z, l = Math.hypot(ax, az) || 1;
        moveToward(e, e.pos.x + (ax / l) * 3, e.pos.z + (az / l) * 3, d.speed * 1.5, dt);
      } else wander(e, dt);
      clampZone(e); animateModel(e, dt); continue;
    }
    if (e.state === 'return') {
      if (moveToward(e, e.home.x, e.home.z, d.speed * 1.3, dt, 0.5)) e.state = 'idle';
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * dt * 0.5);
    } else {
      if (!e.target || !e.target.alive) {
        e.target = null;
        let best = null, bd = d.aggro * d.aggro;
        for (const a of allies) { const dd = dist2(a.pos, e.pos); if (dd < bd) { bd = dd; best = a; } }
        if (best) { e.target = best; e.state = 'chase'; } else if (e.state === 'chase') e.state = 'idle';
      }
      if (e.target) {
        // absorbers taunt everything nearby
        if (absorbers.length && !e.target.def?.absorber) {
          for (const a of absorbers) if (dist2(a.pos, e.pos) < (d.aggro * 1.6) ** 2) { e.target = a; break; }
        } else if (rnd() < dt * 0.6) {
          let best = e.target, bd = dist2(e.target.pos, e.pos);
          for (const a of allies) { const dd = dist2(a.pos, e.pos); if (dd < bd - 4) { bd = dd; best = a; } }
          if (!e.target.def?.absorber) e.target = best;
        }
        const t = e.target;
        const reach = d.range + e.radius * 0.5 + (t.radius || 0.5);
        const dd = Math.sqrt(dist2(t.pos, e.pos));
        if (homeD > leash) { e.state = 'return'; e.target = null; }
        else if (dd > reach) moveToward(e, t.pos.x, t.pos.z, d.speed, dt, reach * 0.9);
        else {
          faceDir(e, t.pos.x - e.pos.x, t.pos.z - e.pos.z, dt);
          if (e.cd <= 0 && !(e.castLockT > 0)) {
            e.cd = d.cd * (e.enraged ? 0.7 : 1) / (e.phaseMul || 1); e.attackAnim = 0.3;
            const attackDamage = d.dmg * (e.dmul || e.mul || 1) * (e.enraged ? 1.4 : 1);
            if (d.boss) bossSignatureAttack(e, t, attackDamage);
            else if (d.slam) telegraph(e, t.pos.clone(), d.slam, attackDamage, 0.2);
            else { damage(t, attackDamage, e); sfx('hit', 0.5); }
          }
        }
      } else wander(e, dt);
    }
    clampZone(e); animateModel(e, dt);
  }
}
function wander(e, dt) {
  e.wanderT -= dt;
  if (e.wanderT <= 0) { e.wanderT = rr(2, 5); e.wanderTo = rnd() < 0.6 ? new THREE.Vector3(e.home.x + rr(-5, 5), 0, e.home.z + rr(-5, 5)) : null; }
  if (e.wanderTo && !e.def.boss) { if (moveToward(e, e.wanderTo.x, e.wanderTo.z, e.def.speed * 0.4, dt, 0.3)) e.wanderTo = null; }
}
function clampZone(e) {
  const z = ZONES[e.zone];
  e.pos.x = clamp(e.pos.x, Math.max(z.x0 + 1.5, e.zone === 0 ? 20 : -99), z.x1 - 1.5);
  e.pos.z = clamp(e.pos.z, z.z0 + 1, z.z1 - 1);
}
function respawnEntity(e) {
  if (!e || !e.pos || !e.home) return;
  e.alive = true; e.state = 'idle'; e.target = null; e.bossPhase=0; e.phaseMul=1; e.enraged=false; e.bossAttackCount=0; e.castLockT=0; e.vuln=0; e.lastExposeNotice=-99; e.lastSignatureCallout=-99;
  e.pos.copy(e.home); e.mesh.visible = true;
  if (e.kind === 'enemy') rollGolden(e);
  e.hp = e.maxHp;
  e.model.body.scale.setScalar(e.model.body.userData.s0 ?? e.model.body.scale.x);
  e.dying = 0;
}

function updateSoldiers(dt) {
  const alive = soldiers.filter((s) => s.alive);
  const fwd = new THREE.Vector3(Math.sin(player.mesh.rotation.y), 0, Math.cos(player.mesh.rotation.y));
  const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
  const perRow = 6;
  let slot = 0;
  let threat = null;
  if (S.command.mode === 'rush' && (!armyTarget || !armyTarget.alive) && S.time % 0.25 < dt) { armyTarget = chooseCommandTarget(); if (armyTarget) showTargetRing(armyTarget); }
  if (!armyTarget && S.time % 0.3 < dt) {
    let bd = 16 * 16;
    for (const e of entities) {
      if (!e.alive || e.kind !== 'enemy' || e.def.passive || e.state !== 'chase' || !e.target) continue;
      const dd = dist2(e.pos, player.pos);
      if (dd < bd) { bd = dd; threat = e; }
    }
  }
  if (S.fx.boost > 0) S.fx.boost -= dt;
  for (const s of soldiers) {
    s.cd -= dt; s.moving = false;
    if (!s.alive) {
      if (s.dieAnim > 0) { s.dieAnim -= dt; s.model.body.rotation.x = -Math.PI / 2 * (1 - s.dieAnim / 0.5); if (s.dieAnim <= 0) s.mesh.visible = false; }
      if (S.time >= s.respawnAt) {
        s.alive = true; s.hp = s.maxHp; s.state = S.command.mode === 'hold' ? 'hold' : S.command.mode === 'rush' && armyTarget ? 'attack' : 'follow'; s.target = S.command.mode === 'rush' ? armyTarget : null; s.absorbed = 0;
        s.mesh.visible = true; s.model.body.rotation.x = 0;
        s.pos.copy(barrackDoor(s.barrack));
      }
      continue;
    }
    if (s.def.healer) {
      updateHealer(s, dt, alive);
      slot++;
      if (dist2(s.pos, player.pos) < 70 * 70) animateModel(s, dt);
      continue;
    }
    if (threat && s.state === 'follow' && S.command.mode !== 'hold') { s.state = 'attack'; s.target = threat; }
    if (S.command.mode === 'hold' && s.state === 'hold' && !s.target && threat) { s.state='attack'; s.target=threat; }
    if (s.state === 'hold' && s.holdPos && !s.target && dist2(s.pos,s.holdPos)>0.7*0.7) moveToward(s,s.holdPos.x,s.holdPos.z,troopSpeed(s)*1.15,dt,0.4);
    if (s.state === 'attack' && s.target && s.target.alive) {
      const t = s.target;
      const dest = commandDestination(s, slot, alive.length, t, fwd, right);
      const reach = s.def.ranged ? Math.max(1.6, s.def.range*0.24) : t.radius + 1.3 + s.radius * 0.5;
      const dd = Math.sqrt((dest.x-s.pos.x)**2 + (dest.z-s.pos.z)**2);
      if (dd > 0.9) moveToward(s, dest.x, dest.z, troopSpeed(s), dt, 0.45);
      else {
        faceDir(s, t.pos.x - s.pos.x, t.pos.z - s.pos.z, dt);
        if (s.cd <= 0) {
          s.cd = s.def.cd * rr(0.9, 1.1) / (1 + (enchOf(s.barrack, 'weapon').spd || 0)); s.attackAnim = 0.3;
          if (s.def.beam) fireBeam(s, t);
          else if (s.def.ranged) fireProjectile(s, t);
          else { damage(t, rollDmg(s, t), s); if (rnd() < 0.5) sfx(t.kind === 'node' ? (t.def.res === 'branch' ? 'chop' : 'mine') : 'hit', 0.35); }
        }
      }
    } else if (S.command.mode === 'rush') {
      const t=chooseCommandTarget();
      if(t){s.state='attack';s.target=t;armyTarget=t;showTargetRing(t);} else {s.state='follow';s.target=null;followSlot(s,slot++,perRow,fwd,right,dt);}
    } else if (S.command.mode === 'hold' && s.state === 'hold') {
      slot++;
    } else {
      s.state = 'follow'; s.target = null;
      followSlot(s, slot++, perRow, fwd, right, dt);
    }
    if (s.state === 'attack') slot++;
    separate(s, alive);
    { const rg = (enchOf(s.barrack, 'armor').regen || 0) + (S.fx.chocolate > 0 ? 0.06 : 0); if (rg) s.hp = Math.min(s.maxHp, s.hp + s.maxHp * rg * dt); }
    if (s.pos.x < 20 && S.time - s.lastHurt > 1) s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.3 * dt);
    if (dist2(s.pos, player.pos) < 70 * 70) {
      if(s.eliteFx){ s.eliteFx.rotation.z += dt*(2+s.barrack.elite); s.eliteFx.material.opacity = 0.55 + 0.28*Math.sin(S.time*5+s.pos.x); }
      animateModel(s, dt);
    }
  }
}
function followSlot(s, slot, perRow, fwd, right, dt) {
  const row = Math.floor(slot / perRow), col = (slot % perRow) - (perRow - 1) / 2;
  const back = 2.6 + row * 1.8;
  const tx = player.pos.x - fwd.x * back + right.x * col * 1.6;
  const tz = player.pos.z - fwd.z * back + right.z * col * 1.6;
  let far = Math.sqrt(dist2(s.pos, { x: tx, z: tz }));
  if (far > 50) {
    const p = { x: clamp(tx, X_MIN + 2, X_MAX - 2), z: clamp(tz, Z_MIN + 2, Z_MAX - 2) };
    if (inRegion(p)) { s.pos.x = p.x; s.pos.z = p.z; } else { s.pos.x = player.pos.x + rr(-1, 1); s.pos.z = player.pos.z + rr(-1, 1); }
    s.stuckT = 0; far = 0;
  }
  const sp = troopSpeed(s) * (far > 5 ? 1.8 : 1);
  if (moveToward(s, tx, tz, sp, dt, 0.25)) faceDir(s, fwd.x, fwd.z, dt);
  if (S.time - s.lastHurt > 4) s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.08 * dt);
}
function separate(s, alive) {
  for (const o of alive) {
    if (o === s) continue;
    const dx = s.pos.x - o.pos.x, dz = s.pos.z - o.pos.z, d = dx * dx + dz * dz, min = (s.radius + o.radius) * 1.1;
    if (d < min * min && d > 0.0001) { const l = Math.sqrt(d); const push = (min - l) * 0.5; s.pos.x += (dx / l) * push; s.pos.z += (dz / l) * push; }
  }
}
function updateHealer(s, dt, alive) {
  let hurt = null, worst = 0.98;
  for (const o of alive) { if (o === s && alive.length > 1) continue; const r = o.hp / o.maxHp; if (r < worst && dist2(o.pos, player.pos) < 35 * 35) { worst = r; hurt = o; } }
  if (hurt) {
    const dd = Math.sqrt(dist2(hurt.pos, s.pos));
    if (dd > s.def.range) moveToward(s, hurt.pos.x, hurt.pos.z, troopSpeed(s), dt, s.def.range * 0.8);
    else {
      faceDir(s, hurt.pos.x - s.pos.x, hurt.pos.z - s.pos.z, dt);
      if (s.cd <= 0) {
        s.cd = s.def.cd; s.attackAnim = 0.3;
        const w = weaponOf(s.barrack); const amt = rr(w.min, w.max) * (1 + 0.05 * (s.barrack.level - 1)) * 4;
        hurt.hp = Math.min(hurt.maxHp, hurt.hp + amt);
        popNumber(hurt.pos, hurt.barY, '+' + fmt(amt), 'res'); burst(hurt.pos, 0x52d273, 6);
      }
    }
  } else {
    const fwd = new THREE.Vector3(Math.sin(player.mesh.rotation.y), 0, Math.cos(player.mesh.rotation.y));
    const tx = player.pos.x - fwd.x * 1.6, tz = player.pos.z - fwd.z * 1.6;
    moveToward(s, tx + (s.barrack.uid % 3 - 1) * 1.4, tz, troopSpeed(s) * 1.4, dt, 0.4);
  }
  separate(s, alive);
}
function fireProjectile(s, t) {
  if (!s?.pos || !t?.pos || !t.alive) return;
  const cls = s.def.cls;
  const col = s.barrack.weapon ? ITEMS[s.barrack.weapon].color : 0xeeeeee;
  let m;
  if (cls === 'bow') { m = new THREE.Mesh(G.box, mat(0xeeeeee)); m.scale.set(0.08, 0.08, 1.1); }
  else { m = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({ color: cls === 'snowball' ? 0xffffff : col })); m.scale.setScalar(cls === 'snowball' ? 0.45 : 0.6); }
  m.position.set(s.pos.x, s.def.centaur ? 2.6 : 1.8, s.pos.z);
  scene.add(m);
  projectiles.push({ mesh: m, target: t, dmg: rollDmg(s, t), src: s, speed: cls === 'bow' ? 34 : 24, splash: s.def.splash || 0, debuff: s.def.debuff, color: col });
  sfx(cls === 'bow' ? 'bow' : 'zap', 0.4);
  if (s.def.boost && rnd() < 0.08) {
    if (rnd() < 0.5) { for (const o of soldiers) if (o.alive) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.25); popNumber(s.pos, s.barY + 0.6, 'Heal Boost', 'res'); }
    else { S.fx.boost = 5; popNumber(s.pos, s.barY + 0.6, 'Power Boost', 'lvl'); }
    burst(s.pos, 0x9fd8ff, 14);
  }
}
const beamMat = new THREE.MeshBasicMaterial({ color: 0x39e6ff, transparent: true, opacity: 0.9 });
function fireBeam(s, t) {
  if (!s?.pos || !t?.pos || !t.alive) return;
  const a = new THREE.Vector3(s.pos.x, 1.8, s.pos.z), b = new THREE.Vector3(t.pos.x, (t.barY || 2) * 0.5, t.pos.z);
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(G.box, beamMat.clone()); m.scale.set(0.25, 0.25, len);
  m.position.copy(a).lerp(b, 0.5); m.lookAt(b); scene.add(m);
  effects.push({ t: 0, update(dt) { this.t += dt; m.material.opacity = 0.9 * (1 - this.t / 0.18); if (this.t > 0.18) { scene.remove(m); m.material.dispose(); return true; } } });
  const dmg = rollDmg(s, t);
  damage(t, dmg, s);
  for (const e of entities) if (e !== t && e.alive && e.kind === 'enemy' && dist2(e.pos, t.pos) < 6.25) damage(e, dmg * 0.5, s);
  sfx('zap', 0.4);
}
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; const t = p.target;
    if (!p?.mesh || !t || !t.pos || !Number.isFinite(t.pos.x) || !Number.isFinite(t.pos.z)) {
      if (p?.mesh) scene.remove(p.mesh);
      projectiles.splice(i, 1);
      continue;
    }
    const tp = new THREE.Vector3(t.pos.x, (t.barY || 2) * 0.5, t.pos.z);
    const dir = tp.clone().sub(p.mesh.position); const d = dir.length();
    if (d < 0.6 || !t.alive) {
      if (t.alive) {
        if (p.debuff) t.vuln = 4;
        damage(t, p.dmg, p.src);
        if (p.splash) {
          for (const e of entities) if (e !== t && e.alive && e.kind === 'enemy' && dist2(e.pos, t.pos) < p.splash * p.splash) { damage(e, p.dmg * 0.5, p.src); if (p.debuff) e.vuln = 4; }
          burst(t.pos, p.color, 6);
        }
      }
      scene.remove(p.mesh); projectiles.splice(i, 1); continue;
    }
    dir.normalize(); p.mesh.position.addScaledVector(dir, Math.min(d, p.speed * dt)); p.mesh.lookAt(tp);
  }
}

// -------------------------------------------------------------- SKILLS ---
function useSkill(slot = 0) {
  const id = slot ? S.skill2 : S.skill, cdKey = slot ? 'skillCd2' : 'skillCd';
  if (!id) { toast(slot ? 'Skill slot 2 is empty. Equip a second skill from the Army menu' : 'No skill equipped. Bosses drop skills like Heal Power', 'bad'); return; }
  if (S.fx.block > 0) { toast(`Skills are BLOCKED for ${Math.ceil(S.fx.block)}s`, 'bad'); sfx('error'); return; }
  if (S[cdKey] > 0) { toast(`${SKILLS[id].name} ready in ${Math.ceil(S[cdKey])}s`, ''); return; }
  const sk = SKILLS[id];
  S[cdKey] = sk.cd;
  if (id === 'heal') { for (const s of soldiers) if (s.alive) { s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.6); burst(s.pos, 0x52d273, 4); } }
  else if (id === 'phoenix') {
    let n = 0;
    for (const s of soldiers) if (!s.alive) { s.alive = true; s.hp = s.maxHp; s.state = 'follow'; s.target = null; s.absorbed = 0; s.dieAnim = 0; s.mesh.visible = true; s.model.body.rotation.x = 0; s.pos.set(player.pos.x + rr(-2, 2), 0, player.pos.z + rr(-2, 2)); burst(s.pos, 0xff6a2a, 6); n++; }
    for (const s of soldiers) s.hp = s.maxHp;
    popNumber(player.pos, 3.4, n ? `${n} revived` : 'Full heal', 'lvl');
  } else if (id === 'cupid') {
    let n = 0;
    for (const e of entities) if (e.alive && e.kind === 'enemy' && !e.def.passive && dist2(e.pos, player.pos) < 26 * 26) { e.charm = sk.dur; e.target = null; e.state = 'idle'; burst(e.pos, 0xff6fd8, 6); n++; }
    popNumber(player.pos, 3.4, `${n} charmed`, 'lvl');
  } else if (id === 'energy') energyBlast();
  else S.fx[id] = sk.dur;
  shock(player.pos, 6); sfx('level');
  toast(`${sk.name}!`, 'gold');
}



// ------------------------------------------------------ DAILY ORDERS ---
const DAILY_ORDERS = [
  { id:'harvest', text:'Collect 45 resources', metric:() => Object.values(S.found || {}).reduce((a,n)=>a+n,0), goal:45, base:2500 },
  { id:'hunt', text:'Defeat 12 enemies', metric:() => S.kills, goal:12, base:3500 },
  { id:'refine', text:'Refine 35 resources at base', metric:() => S.resourcesSold || 0, goal:35, base:4500 },
  { id:'recruit', text:'Build 2 barracks', metric:() => S.barracks.length, goal:2, base:7500 },
  { id:'explore', text:'Unlock 1 new area', metric:() => Object.values(gateObjs).filter(g => g.open).length + Object.values(annexGateObjs || {}).filter(g => g.open).length, goal:1, base:10000 },
];
function dayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function chooseDailyOrder() {
  const key = dayKey();
  if (S.daily?.key === key && S.daily.kind) return;
  const dayNum = Math.floor(Date.now() / 86400000);
  const def = DAILY_ORDERS[((dayNum * 13 + 7) % DAILY_ORDERS.length + DAILY_ORDERS.length) % DAILY_ORDERS.length];
  let streak = Number(S.daily?.streak) || 0;
  const prev = S.daily?.lastClaim || '';
  const now = new Date(); now.setDate(now.getDate() - 1);
  const yesterday = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if (prev !== yesterday) streak = 0;
  S.daily = { key, kind:def.id, goal:def.goal, start:def.metric(), claimed:false, reward:Math.round(def.base * (1 + 0.15 * maxZoneReached())), streak, lastClaim:prev };
}
function dailyOrderDef() { chooseDailyOrder(); return DAILY_ORDERS.find(x => x.id === S.daily.kind) || DAILY_ORDERS[0]; }
function dailyProgress() { const d=dailyOrderDef(); return Math.max(0, d.metric() - Number(S.daily.start || 0)); }
function updateDailyOrder() {
  if (S.mode !== 'play') return;
  chooseDailyOrder();
  const d = dailyOrderDef(), p = Math.min(dailyProgress(), d.goal);
  if (!S.daily.claimed && p >= d.goal) {
    S.daily.claimed = true;
    S.daily.streak = (S.daily.streak || 0) + 1;
    S.daily.lastClaim = S.daily.key;
    const streakBonus = 1 + Math.min(0.5, (S.daily.streak - 1) * 0.05);
    const reward = Math.round(S.daily.reward * streakBonus);
    addGold(reward);
    toast(`Daily Order complete · +${fmt(reward)} gold · ${S.daily.streak} day streak`, 'gold', 5000);
    banner('ORDER COMPLETE', `Day ${S.daily.streak} · ${d.text}`);
    musicStinger('combo');
    sfx('sell');
  }
}
function updateDailyHud() {
  const el = $('dailyBox'); if (!el) return;
  if (S.mode !== 'play') { el.classList.add('hidden'); return; }
  chooseDailyOrder();
  const d = dailyOrderDef(), p = Math.min(dailyProgress(), d.goal), done = !!S.daily.claimed;
  el.classList.remove('hidden');
  el.innerHTML = `<div class="daily-top"><span class="daily-name">${done ? 'DAILY COMPLETE' : 'DAILY ORDER'}</span><span class="daily-streak">${S.daily.streak ? '🔥 ' + S.daily.streak : ''}</span></div><div class="daily-task">${d.text}</div><div class="daily-row"><div class="daily-bar"><i style="width:${p/d.goal*100}%"></i></div><span>${fmt(p)}/${fmt(d.goal)}</span></div><div class="daily-reward">${done ? 'Claimed' : `Auto-reward · ${fmt(S.daily.reward)} gold`}</div>`;
}

// ------------------------------------------------------- V4 SYSTEMS ---
function summonBoss(bossId) {
  const boss = entities.find((x) => x.typeId === bossId);
  if (!boss || boss.alive) return false;
  boss.alive = true; boss.hp = boss.maxHp; boss.mesh.visible = true; boss.pos.copy(boss.home); boss.dying = 0; boss.state = 'idle'; boss.enraged = false; boss.charm = 0; boss.bar.visible = true;
  boss.model.body.scale.setScalar(boss.model.body.userData.s0 ?? boss.model.body.scale.x);
  shock(boss.pos, 10); burst(boss.pos, 0xc07bff, 34); sfx('bossdown');
  banner(`${boss.def.name} has been summoned`, 'Defeat it for legendary loot');
  return true;
}
function summonFromAltar(ai, oi) {
  const a = ALTARS[ai], o = oi ? a.alt : { boss: a.boss, need: a.need };
  if (!Object.entries(o.need).every(([id, n]) => (S.items[id] || 0) >= n)) { sfx('error'); toast('Missing summon items', 'bad'); return; }
  if (!summonBoss(o.boss)) { toast('That boss is already here', 'bad'); return; }
  for (const [id, n] of Object.entries(o.need)) S.items[id] -= n;
  closePanel();
}
function craftRecipe(id) {
  const r = RECIPES.find((x) => x.id === id);
  if (!packHas(r.need) || !Object.entries(r.key || {}).every(([m, n]) => (S.items[m] || 0) >= n)) { sfx('error'); toast('Missing materials', 'bad'); return; }
  if (!spend(r.gold)) return;
  for (const [m, n] of Object.entries(r.need)) { S.pack[m] -= n; S.packCount -= n; if (!S.pack[m]) delete S.pack[m]; }
  for (const [m, n] of Object.entries(r.key || {})) S.items[m] -= n;
  addKey(id, 1, null);
  toast(`Crafted ${r.name}`, 'good');
}
function addKey(id, n, at) {
  S.items[id] = (S.items[id] || 0) + n; S.found[id] = (S.found[id] || 0) + n;
  if (at) popNumber(at, 3.2, `+${n} ${KEY[id].name}`, 'lvl');
  if (id.startsWith('gem_')) { const have = GEMS.filter((g) => S.items[g] > 0).length; toast(`${KEY[id].name} found (${have}/6 gems)`, 'gold', 3500); }
  else if (at) toast(`Key item: ${KEY[id].name}`, 'gold', 3000);
}
function rollEnchant(kind) {
  const list = ENCHANTS[kind], tot = list.reduce((a, e) => a + e.w, 0);
  let r = rnd() * tot;
  for (const e of list) { r -= e.w; if (r <= 0) return e; }
  return list[0];
}
function enchantItem(id) {
  const it = ITEMS[id];
  if (!S.owned[id] || !(S.items.ancient_fragment > 0)) { sfx('error'); toast('You need an Ancient Fragment', 'bad'); return; }
  S.items.ancient_fragment--;
  const e = rollEnchant(it.type);
  S.ench[id] = e.id;
  refreshSoldierStats();
  toast(`${it.name} is now ${e.name}: ${e.desc}`, e.w <= 5 ? 'gold' : 'good', 4500);
  burst(player.pos, parseInt(e.color.slice(1), 16), e.w <= 5 ? 40 : 16); sfx('level');
  if (e.w <= 5) banner(`${e.name.toUpperCase()} ENCHANT`, it.name);
}
function payAnnex(i) {
  const g = annexGateObjs[i];
  if (g.open) return;
  if (g.req.boss && !S.bossesDown[g.req.boss]) { sfx('error'); toast(`Defeat the ${ENEMIES[g.req.boss].name} first`, 'bad'); return; }
  if (!spend(g.req.gold)) return;
  openAnnex(g); closePanel();
}
function teleportTo(zi) {
  if (!zoneUnlocked(zi)) return;
  const p = zoneSpawn(zi);
  burst(player.pos, 0x4af0e0, 20);
  player.pos.set(p.x, 0, p.z); player.moveTo = null; armyTarget = null;
  for (const s of soldiers) { s.pos.set(p.x + rr(-3, 3), 0, p.z + rr(-3, 0)); s.state = 'follow'; s.target = null; }
  cam.target.set(p.x, 1.6, p.z);
  shock(player.pos, 6); burst(player.pos, 0x4af0e0, 30); sfx('gate');
}
// Mushy: endless quests
const mushyReward = () => Math.round(400000 * Math.pow(1.18, S.mushy.lvl));
const mushyProgress = () => (S.counts[S.mushy.id] || 0) - S.mushy.start;
const mushyText = () => { const id = S.mushy.id, d = ENEMIES[id] || NODES[id]; return `${NODES[id] ? 'Break' : 'Defeat'} ${S.mushy.n} ${d.name}${S.mushy.n > 1 ? 's' : ''}`; };
function mushyAct() {
  if (!S.met.mushy) S.met.mushy = true;
  if (!S.mushy.id) {
    const id = MUSHY_TARGETS[S.mushy.lvl % MUSHY_TARGETS.length];
    S.mushy.id = id; S.mushy.n = 5 + Math.floor(S.mushy.lvl * 1.5); S.mushy.start = S.counts[id] || 0;
    toast(`Mushy: ${mushyText()}`, 'gold', 3500); return;
  }
  if (mushyProgress() < S.mushy.n) return;
  const r = mushyReward();
  addGold(r);
  if ((S.mushy.lvl + 1) % 5 === 0) addKey('ancient_fragment', 1, player.pos);
  S.mushy.lvl++; S.mushy.id = null;
  toast(`Mushy: thank youuu! +${fmt(r)} gold`, 'gold', 3500); sfx('sell');
  mushyAct();
}
// titles
let titleSeen = null;
function refreshTitle() {
  const t = TITLES.find((x) => x.id === S.title) || TITLES[0];
  if (player.tag) { player.mesh.remove(player.tag); player.tag.material.map.dispose(); player.tag.material.dispose(); }
  const tag = makeLabel(t.id === 'recruit' ? 'You' : `You · ${t.name}`, t.id === 'winner' ? '#1b2140' : '#ffffff', t.id === 'winner' ? '#ffe066' : t.id === 'recruit' ? 'rgba(27,33,64,0.8)' : 'rgba(120,60,200,0.85)', 30);
  tag.position.set(0, player.model.height + 0.9, 0); tag.scale.multiplyScalar(0.8); player.mesh.add(tag); player.tag = tag;
}
function checkTitles() {
  if (!titleSeen) { titleSeen = new Set(TITLES.filter((t) => t.ok()).map((t) => t.id)); return; }
  for (const t of TITLES) if (!titleSeen.has(t.id) && t.ok()) { titleSeen.add(t.id); toast(`New title unlocked: ${t.name}. Pick it in the Army menu`, 'gold', 4500); sfx('level'); }
}

// ----------------------------------------------------------- ECONOMY ---
function addRes(res, n, at) {
  if (!RES[res] || !Number.isFinite(n) || n <= 0) return;

  if (KEY[res]) {
    addKey(res, n, at);
    return;
  }

  if (S.autosell[res]) {
    const gold = Math.round(n * RES[res].value * goldMult());
    S.found[res] = (S.found[res] || 0) + n;
    S.resourcesSold = (S.resourcesSold || 0) + n;
    S.sold += gold;
    addGold(gold);
    popNumber(at, 2.5, `+${fmt(gold)} (${RES[res].name})`, 'gold');
    sfx('pickup', 0.4);
    return;
  }

  const space = Math.max(0, packCap() - S.packCount);
  const take = Math.min(space, n);

  if (take > 0) {
    S.pack[res] = (S.pack[res] || 0) + take;
    S.packCount += take;
    S.found[res] = (S.found[res] || 0) + take;
    popNumber(at, 2.5, `+${take} ${RES[res].name}`, 'res');
    sfx('pickup', 0.5);
  }

  if (take < n && (!addRes.warn || S.time - addRes.warn > 3)) {
    addRes.warn = S.time;
    toast('Bag full. Sell at base or buy a bigger bag', 'bad', 3500);
  }

  updateHud();
}

function addGold(n) {
  S.gold += n; S.earned += n;
  const el = document.querySelector('.stat.gold');
  el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  updateHud();
}
function spend(n) { if (S.gold < n) { sfx('error'); toast('Not enough gold', 'bad'); return false; } S.gold -= n; sfx('buy'); updateHud(); return true; }
function sellAll() {
  if (S.packCount <= 0) return;
  let total = 0;
  for (const k in S.pack) total += S.pack[k] * (RES[k] ? RES[k].value : 0);
  total = Math.round(total * goldMult());
  const n = S.packCount;
  S.sold += total; S.resourcesSold = (S.resourcesSold || 0) + n;
  seasonGainXp(Math.max(3, Math.floor(n / 12)), 'refine');
  S.pack = {}; S.packCount = 0;
  addGold(total);
  toast(`Sold ${fmt(n)} items for ${fmt(total)} gold`, 'gold', 3000);
  sfx('sell'); popNumber(player.pos, 3, `+${fmt(total)}`, 'gold');
  checkQuest();
}
const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12);
const coinMat = new THREE.MeshLambertMaterial({ color: 0xffc83d, emissive: 0x8a5d00, emissiveIntensity: 0.4 });
function spawnCoins(pos, total) {
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.z) || !Number.isFinite(total) || total <= 0) return;
  const n = clamp(Math.ceil(Math.log2(total + 1)), 1, 10);
  const each = total / n;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(coinGeo, coinMat);
    m.position.set(pos.x, 1, pos.z); m.rotation.x = Math.PI / 2; scene.add(m);
    coins.push({ mesh: m, v: new THREE.Vector3(rr(-4, 4), rr(6, 9), rr(-4, 4)), t: 0, value: each });
  }
}
function updateCoins(dt) {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i]; c.t += dt; const m = c.mesh;
    if (c.t < 0.5) {
      c.v.y -= 25 * dt; m.position.addScaledVector(c.v, dt);
      if (m.position.y < 0.3) { m.position.y = 0.3; c.v.y *= -0.4; c.v.x *= 0.6; c.v.z *= 0.6; }
    } else {
      const tp = new THREE.Vector3(player.pos.x, player.pos.y + 1.4, player.pos.z);
      const dir = tp.sub(m.position); const d = dir.length();
      const sp = 10 + (c.t - 0.5) * 60;
      if (d < 0.8 || c.t > 4) {
        addGold(Math.round(c.value)); if (!updateCoins.cool || S.time - updateCoins.cool > 0.06) { sfx('coin', 0.4); updateCoins.cool = S.time; }
        scene.remove(m); coins.splice(i, 1); continue;
      }
      m.position.addScaledVector(dir.normalize(), Math.min(d, sp * dt));
    }
    m.rotation.z += dt * 8;
  }
}

// -------------------------------------------------------------- EFFECTS ---
const burstGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
function burst(pos, color, n) {
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.z)) return;
  const m = mat(color);
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(burstGeo, m);
    b.position.set(pos.x, 1, pos.z);
    scene.add(b);
    const v = new THREE.Vector3(rr(-5, 5), rr(4, 9), rr(-5, 5));
    let life = 0.8;
    effects.push({ update: (dt) => { life -= dt; v.y -= 20 * dt; b.position.addScaledVector(v, dt); if (b.position.y < 0.12) { b.position.y = 0.12; v.set(v.x * 0.5, 0, v.z * 0.5); } b.scale.setScalar(Math.max(0.01, life / 0.8)); if (life <= 0) { scene.remove(b); return true; } } });
  }
}
function telegraph(e, at, r, dmg, delay, opts = {}) {
  if (!e || !at || !Number.isFinite(at.x) || !Number.isFinite(at.z) || !Number.isFinite(r) || r <= 0) return;
  const center = new THREE.Vector3(at.x, 0, at.z);
  const radius = clamp(r, 0.6, 40);
  const wait = clamp(Number(delay) || 0.2, 0.15, 3.5);
  const color = Number.isFinite(opts.color) ? opts.color : 0xff2a2a;
  const ring = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(center.x, 0.15, center.z); ring.scale.setScalar(radius); scene.add(ring);
  const edge = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false }));
  edge.rotation.x = -Math.PI / 2; edge.position.set(center.x, 0.17, center.z); edge.scale.setScalar(radius); scene.add(edge);
  let t = 0, cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    scene.remove(ring, edge);
    ring.geometry.dispose(); edge.geometry.dispose(); ring.material.dispose(); edge.material.dispose();
  };
  effects.push({ update(dt) {
    if (!e.alive) { cleanup(); return true; }
    t += dt;
    const k = Math.min(1, t / wait);
    ring.material.opacity = 0.15 + 0.34 * k + Math.sin(t * 25) * 0.045;
    edge.material.opacity = 0.6 + 0.36 * k;
    if (t < wait) return false;
    cleanup();
    if (!e.alive) return true;
    shock(center, radius); sfx('slam');
    for (const ally of [...soldiers, player]) {
      if (ally?.alive && ally.pos && Number.isFinite(ally.pos.x) && Number.isFinite(ally.pos.z) && dist2(ally.pos, center) <= radius * radius) damage(ally, dmg, e);
    }
    if (opts.expose) exposeBoss(e, 1.25);
    return true;
  } });
}
function bossLaneTelegraph(e, targetPos, dmg, delay, width, length, color, expose = false) {
  if (!e?.alive || !e.pos || !targetPos || !Number.isFinite(targetPos.x) || !Number.isFinite(targetPos.z)) return;
  const dx = targetPos.x - e.pos.x, dz = targetPos.z - e.pos.z;
  const distance = Math.hypot(dx, dz) || 1;
  const dirX = dx / distance, dirZ = dz / distance;
  const laneLength = clamp(length, 7, 24), laneWidth = clamp(width, 1.6, 6);
  const startX = e.pos.x + dirX * Math.max(0.8, (e.radius || 1) * 0.35);
  const startZ = e.pos.z + dirZ * Math.max(0.8, (e.radius || 1) * 0.35);
  const finishX = startX + dirX * laneLength, finishZ = startZ + dirZ * laneLength;
  const center = new THREE.Vector3((startX + finishX) * 0.5, 0.12, (startZ + finishZ) * 0.5);
  const geometry = new THREE.BoxGeometry(laneWidth, 0.045, laneLength);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide });
  const lane = new THREE.Mesh(geometry, material);
  lane.position.copy(center); lane.rotation.y = Math.atan2(dirX, dirZ); scene.add(lane);
  let t = 0, cleaned = false;
  const wait = clamp(Number(delay) || 0.9, 0.2, 2.5);
  const cleanup = () => { if (cleaned) return; cleaned = true; scene.remove(lane); geometry.dispose(); material.dispose(); };
  effects.push({ update(dt) {
    if (!e.alive) { cleanup(); return true; }
    t += dt;
    const k = Math.min(1, t / wait);
    material.opacity = 0.14 + 0.3 * k + Math.sin(t * 26) * 0.035;
    if (t < wait) return false;
    cleanup();
    if (!e.alive) return true;
    const dx2 = finishX - startX, dz2 = finishZ - startZ;
    const lenSq = Math.max(0.001, dx2 * dx2 + dz2 * dz2);
    for (const ally of [...soldiers, player]) {
      if (!ally?.alive || !ally.pos || !Number.isFinite(ally.pos.x) || !Number.isFinite(ally.pos.z)) continue;
      const along = clamp(((ally.pos.x - startX) * dx2 + (ally.pos.z - startZ) * dz2) / lenSq, 0, 1);
      const nearestX = startX + along * dx2, nearestZ = startZ + along * dz2;
      if (dist2(ally.pos, { x: nearestX, z: nearestZ }) <= (laneWidth * 0.5) ** 2) damage(ally, dmg, e);
    }
    shock(center, laneLength * 0.5); sfx('slam');
    if (expose) exposeBoss(e, 1.25);
    return true;
  } });
}
function shock(pos, r) {
  if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.z)) return;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(pos.x, 0.2, pos.z);
  scene.add(ring);
  let t = 0;
  effects.push({ update: (dt) => { t += dt; const k = t / 0.4; ring.scale.setScalar(0.3 + k * r); ring.material.opacity = 0.8 * (1 - k); if (k >= 1) { scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); return true; } } });
}
const fxLayer = document.getElementById('fx');
const pops = [];
function popNumber(pos, height, text, cls = '') {
  if (
    !pos ||
    !Number.isFinite(pos.x) ||
    !Number.isFinite(pos.z) ||
    !Number.isFinite(height)
  ) {
    return;
  }

  if (pops.length > 40) {
    const oldest = pops.shift();
    oldest?.el?.remove();
  }

  const el = document.createElement('div');
  el.className = `dmg ${cls}`;
  el.textContent = String(text ?? '');
  fxLayer.appendChild(el);

  pops.push({
    el,
    p: new THREE.Vector3(
      pos.x + rr(-0.4, 0.4),
      height,
      pos.z + rr(-0.4, 0.4),
    ),
    t: 0,
  });
}

const tmpV = new THREE.Vector3();
function updatePops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i]; p.t += dt;
    if (p.t > 0.9) { p.el.remove(); pops.splice(i, 1); continue; }
    tmpV.copy(p.p); tmpV.y += p.t * 1.6;
    tmpV.project(camera);
    if (tmpV.z > 1) { p.el.style.display = 'none'; continue; }
    p.el.style.display = '';
    p.el.style.left = ((tmpV.x + 1) / 2 * window.innerWidth) + 'px';
    p.el.style.top = ((1 - tmpV.y) / 2 * window.innerHeight) + 'px';
    p.el.style.opacity = String(1 - Math.max(0, (p.t - 0.5) / 0.4));
  }
}


// --------------------------------------------------------------- AUDIO ---
let actx = null, master = null, musicGain = null;
function initAudio() {
  if (actx) {
    // Browsers may suspend audio until it is resumed during a user gesture.
    if (actx.state === 'suspended') {
      actx.resume().catch(() => {});
    }
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    actx = new AudioContextClass();

    master = actx.createGain();
    master.gain.value = 0.5;
    master.connect(actx.destination);

    musicGain = actx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(actx.destination);

    // Initialize the graph now; start scheduling once the context resumes.
    initMusicBus();

    actx.resume()
      .then(() => startMusic())
      .catch(() => {
        // Audio can be retried on the next user gesture.
      });
  } catch {
    actx = null;
    master = null;
    musicGain = null;
  }
}

function tone(freq, dur, type = 'square', vol = 0.2, slide = 0, when = 0, dest) {
  if (!actx || !S.sound) return;
  const t0 = actx.currentTime + when;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol = 0.2, freq = 1200) {
  if (!actx || !S.sound) return;
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
  const g = actx.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(master); src.start();
}
function sfx(name, vol = 1) {
  if (!actx || !S.sound) return;
  switch (name) {
    case 'hit': noise(0.08, 0.25 * vol, 900); tone(160, 0.08, 'square', 0.08 * vol, -60); break;
    case 'chop': noise(0.07, 0.3 * vol, 500); tone(220, 0.06, 'triangle', 0.12 * vol, -80); break;
    case 'mine': tone(900, 0.08, 'square', 0.08 * vol, -300); noise(0.05, 0.2 * vol, 3000); break;
    case 'break': noise(0.25, 0.3, 400); tone(120, 0.25, 'triangle', 0.2, -60); break;
    case 'kill': tone(520, 0.1, 'square', 0.12, 200); tone(780, 0.12, 'square', 0.1, 0, 0.08); break;
    case 'bossdown': [392, 523, 659, 784].forEach((f, i) => tone(f, 0.25, 'square', 0.14, 0, i * 0.12)); break;
    case 'coin': tone(1320, 0.07, 'square', 0.06 * vol); tone(1760, 0.1, 'square', 0.05 * vol, 0, 0.05); break;
    case 'pickup': tone(660, 0.07, 'triangle', 0.1 * vol, 300); break;
    case 'sell': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'triangle', 0.15, 0, i * 0.06)); break;
    case 'buy': tone(700, 0.08, 'square', 0.1); tone(1050, 0.12, 'square', 0.1, 0, 0.07); break;
    case 'error': tone(200, 0.15, 'square', 0.1, -60); break;
    case 'command': tone(440, 0.06, 'triangle', 0.12); tone(660, 0.08, 'triangle', 0.1, 0, 0.05); break;
    case 'jump': tone(300, 0.15, 'square', 0.07, 300); break;
    case 'hurt': tone(220, 0.15, 'sawtooth', 0.1, -100); break;
    case 'slam': noise(0.35, 0.45, 180); tone(70, 0.35, 'sine', 0.35, -30); break;
    case 'bow': noise(0.06, 0.12 * vol, 2500); break;
    case 'zap': tone(1200, 0.15, 'sawtooth', 0.05 * vol, -900); break;
    case 'level': [660, 880, 1100].forEach((f, i) => tone(f, 0.1, 'triangle', 0.1, 0, i * 0.06)); break;
    case 'down': tone(400, 0.5, 'sawtooth', 0.12, -300); break;
    case 'gate': tone(110, 0.8, 'sawtooth', 0.12, 60); break;
  }
}
// ---------------------------------------------------------- MUSIC v2 ---
// Procedural soundtrack: a lookahead step sequencer with drums, bass, pads, arps and lead,
// a different theme per area, boss battle music, delay + reverb.
// ---- MUSIC v4: sampled-style drum kit, Karplus-Strong plucks, area instruments, combat intensity
const THEMES = {
  base:     { bpm: 116, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], prog2: [3, 4, 5, 4], lead: 'chip', lead2: 'chip', pad: 'strings', bass: 'pluck', kit: 'pop', arp: 'chip', seed: 3, swing: 0.08 },
  forest: {
  bpm: 94,
  root: 67, // G
  scale: [0, 2, 4, 5, 7, 9, 11], // G major
  prog: [0, 4, 5, 3],            // G – C – D – Em
  prog2: [0, 5, 3, 4],           // G – D – Em – C
  lead: 'flute',
  lead2: 'flute',
  pad: 'strings',
  bass: 'round',
  kit: 'soft',
  arp: 'harp',
  seed: 7,
  swing: 0.06,
  wet: 0.4,
},

  river:    { bpm: 112, root: 67, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0, 5, 3, 1, 4], prog2: [3, 4, 5, 4], lead: 'guitar', lead2: 'flute', pad: 'strings', bass: 'round', kit: 'folk', arp: 'guitar', seed: 11, swing: 0.12 },
  mountain: { bpm: 112, root: 62, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 3, 4], prog2: [5, 6, 0, 4], lead: 'brass', lead2: 'brass', pad: 'choir', bass: 'saw', kit: 'march', arp: null, seed: 13 },
  desert:   { bpm: 110, root: 62, scale: [0, 1, 4, 5, 7, 8, 10], prog: [0, 1, 0, 6], prog2: [0, 1, 6, 0], lead: 'oud', lead2: 'flute', pad: 'strings', bass: 'round', kit: 'darbuka', arp: 'oud', seed: 17 },
  atlantis: { bpm: 108, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 4], prog2: [3, 0, 6, 4], lead: 'accordion', lead2: 'accordion', pad: 'strings', bass: 'round', kit: 'shanty', arp: 'harp', seed: 19, swing: 0.16, wet: 0.45 },
  mushroom: { bpm: 118, root: 64, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 6, 4], prog2: [3, 4, 0, 0], lead: 'marimba', lead2: 'bell', pad: 'strings', bass: 'round', kit: 'soft', arp: 'marimba', seed: 23, wet: 0.45 },
  ouroboros:{ bpm: 134, root: 62, scale: [0, 2, 3, 5, 7, 8, 11], prog: [0, 5, 3, 4], prog2: [5, 3, 4, 4], lead: 'saw', lead2: 'saw', pad: 'choir', bass: 'saw', kit: 'drive', arp: 'chip', seed: 29 },
  magic:    { bpm: 110, root: 65, scale: [0, 2, 4, 6, 7, 9, 11], prog: [0, 1, 4, 5], prog2: [3, 1, 4, 4], lead: 'bell', lead2: 'flute', pad: 'choir', bass: 'round', kit: 'soft', arp: 'harp', seed: 31, wet: 0.5 },
  sky:      { bpm: 114, root: 65, scale: [0, 2, 4, 6, 7, 9, 11], prog: [0, 4, 1, 5], prog2: [3, 4, 1, 4], lead: 'flute', lead2: 'flute', pad: 'strings', bass: 'round', kit: 'soft', arp: 'harp', seed: 37, wet: 0.55 },
  soul:     { bpm: 92, root: 59, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 4], prog2: [5, 6, 4, 4], lead: 'theremin', lead2: 'bell', pad: 'choir', bass: 'round', kit: 'spooky', arp: 'bell', seed: 41, wet: 0.7 },
  jungle:   { bpm: 132, root: 64, scale: [0, 3, 5, 7, 10, 12, 15], prog: [0, 0, 3, 4], prog2: [5, 3, 4, 4], lead: 'marimba', lead2: 'flute', pad: 'strings', bass: 'round', kit: 'tribal', arp: 'marimba', seed: 43 },
  arctic:   { bpm: 106, root: 69, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 2, 4], prog2: [5, 2, 3, 4], lead: 'bell', lead2: 'flute', pad: 'strings', bass: 'round', kit: 'soft', arp: 'bell', seed: 47, wet: 0.6 },
  mine:     { bpm: 142, root: 62, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 6, 5, 6], prog2: [5, 6, 4, 4], lead: 'saw', lead2: 'brass', pad: 'choir', bass: 'saw', kit: 'drive', arp: 'chip', seed: 53 },
  boss:     { bpm: 150, root: 60, scale: [0, 2, 3, 5, 7, 8, 11], prog: [0, 5, 6, 4, 0, 5, 3, 4], prog2: [5, 3, 4, 4, 5, 6, 4, 4], lead: 'saw', lead2: 'brass', pad: 'choir', bass: 'saw', kit: 'boss', arp: 'chip', seed: 59, always: true },
};
THEMES.baseremix = { bpm: 128, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], prog2: [3, 4, 5, 4], lead: 'saw', lead2: 'chip', pad: 'strings', bass: 'saw', kit: 'drive', arp: 'chip', seed: 3, swing: 0, always: true };
THEMES.cave = { bpm: 118, root: 62, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 5, 4], prog2: [3, 6, 0, 4], lead: 'guitar', lead2: 'accordion', pad: 'choir', bass: 'round', kit: 'shanty', arp: 'harp', seed: 61, swing: 0.1, wet: 0.6 };
THEMES.volcano = { bpm: 146, root: 52, scale: [0,1,3,5,7,8,10], prog: [0,1,6,4], prog2: [0,3,4,6], lead: 'brass', lead2: 'saw', pad: 'choir', bass: 'saw', kit: 'drive', arp: 'chip', seed: 71, swing: 0.02 };
THEMES.alien = { bpm: 132, root: 56, scale: [0,1,4,5,7,8,11], prog: [0,6,4,5], prog2: [4,5,0,6], lead: 'chip', lead2: 'theremin', pad: 'strings', bass: 'saw', kit: 'drive', arp: 'chip', seed: 73, swing: 0.03, wet: 0.5 };
THEMES.deep = { bpm: 104, root: 55, scale: [0,2,3,5,7,9,10], prog: [0,3,6,5], prog2: [4,3,0,6], lead: 'guitar', lead2: 'flute', pad: 'strings', bass: 'round', kit: 'soft', arp: 'harp', seed: 79, wet: 0.5 };
THEMES.shocked = { bpm: 154, root: 58, scale: [0,1,4,6,7,9,10], prog: [0,4,6,3], prog2: [3,6,4,0], lead: 'saw', lead2: 'chip', pad: 'choir', bass: 'saw', kit: 'boss', arp: 'chip', seed: 83, swing: 0.01 };
THEMES.uran = { bpm: 124, root: 60, scale: [0,2,4,6,7,9,11], prog: [0,6,4,1], prog2: [3,4,1,6], lead: 'brass', lead2: 'chip', pad: 'choir', bass: 'saw', kit: 'march', arp: 'chip', seed: 89, wet: 0.35 };
THEMES.celestial = { bpm: 118, root: 62, scale: [0,2,4,6,7,9,11], prog: [0,5,3,4], prog2: [5,3,4,0], lead: 'bell', lead2: 'harp', pad: 'choir', bass: 'round', kit: 'soft', arp: 'harp', seed: 97, wet: 0.7 };
const ZONE_THEME = { crabcave: 'cave', forest: 'forest', riverlands: 'river', mountains: 'mountain', desert: 'desert', atlantis: 'atlantis', mushroom: 'mushroom', ouroboros: 'ouroboros', magic: 'magic', wisebird: 'sky', soul: 'soul', jungle: 'jungle', arctic: 'arctic', mine: 'mine', volcano: 'volcano', alienrealm: 'alien', deepforest: 'deep', shocked: 'shocked', uranian: 'uran', celestial: 'celestial' };
const music = { theme: 'base', next: null, step: 0, t: 0, timer: null, bus: null, delay: null, verb: null, songs: {}, fight: -99, intensity: 0, smp: null, ks: {} };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function seeded(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function makeSong(th) {
  const rand = seeded(th.seed || 1);

  // Scale-degree motifs. The song's existing scale and chord progression
  // determine the actual pitches, so this works across the different themes.
  const motifs = [
    [0, 2, 4, 2, 1, 2, 4, 5],
    [4, 2, 1, 2, 4, 5, 4, 2],
    [2, 4, 5, 4, 2, 1, 0, 1],
    [0, 1, 2, 4, 2, 1, 0, 2],
  ];

  const motif = motifs[Math.floor(rand() * motifs.length)];
  const verseRhythm = [0, 2, 4, 6, 8, 10, 12, 14];
  const chorusRhythm = [0, 2, 4, 6, 8, 10, 12, 14];
  const bridgeRhythm = [0, 4, 8, 12];

  function buildSection(section) {
    const line = Array(128).fill(null);
    const progression =
      section === 'chorus' && th.prog2
        ? th.prog2
        : section === 'bridge' && th.prog2
          ? th.prog2
          : th.prog;

    const rhythm =
      section === 'bridge'
        ? bridgeRhythm
        : section === 'chorus'
          ? chorusRhythm
          : verseRhythm;

    for (let bar = 0; bar < 8; bar++) {
      const chordRoot = progression[bar % progression.length];
      const phraseShift = bar % 2 === 0 ? 0 : 2;

      for (let i = 0; i < rhythm.length; i++) {
        const step = rhythm[i];

        // Keep the bridge more spacious and make the verse slightly less dense.
        if (section === 'bridge' && i === 1 && bar % 2 === 1) continue;
        if (
          section === 'verse' &&
          i > 0 &&
          i < rhythm.length - 1 &&
          rand() < 0.16
        ) {
          continue;
        }

        let offset = motif[(i + phraseShift) % motif.length];

        // Add small, controlled variation instead of an unconstrained random walk.
        if (bar % 4 === 1 && i === 5) offset += 1;
        if (bar % 4 === 3 && i === 2) offset -= 1;

        // Lift the chorus for contrast; keep the bridge lower and calmer.
        let octaveLift = section === 'chorus' ? 7 : 0;
        if (section === 'bridge') octaveLift = -2;
        if (section === 'chorus' && i % 2 === 1) octaveLift = 0;

        let degree = chordRoot + offset + octaveLift;

        // Anchor important beats to chord tones. This helps the melody follow
        // the harmony instead of sounding like a sequence of unrelated notes.
        if (i === 0) degree = chordRoot + octaveLift;
        if (i === 4 && section !== 'bridge') {
          degree = chordRoot + 2 + octaveLift;
        }

        // End each eight-bar line on its final chord root.
        if (bar === 7 && i === rhythm.length - 1) {
          degree = chordRoot + octaveLift;
        }

        const len =
          section === 'bridge'
            ? 3 + (i % 2)
            : section === 'chorus'
              ? (i % 3 === 0 ? 3 : 2)
              : (i % 4 === 0 ? 3 : 2);

        line[bar * 16 + step] = { deg: degree, len };
      }
    }

    return line;
  }

  return {
    verse: buildSection('verse'),
    chorus: buildSection('chorus'),
    bridge: buildSection('bridge'),
    fill: Math.floor(rand() * 3),
  };
}

// Use the same improved generator for the Forest theme so every song follows
// the same coherent phrase-building rules.
function makeForestSong() {
  return makeSong(THEMES.forest);
}



const THEME_HOOKS = {
  base:       [0,2,4,7,5,4,2,4, 7,9,7,4,5,2,0,2],
  baseremix:  [0,0,4,7,9,7,4,2, 0,4,7,11,9,7,4,2],
  forest:     [0,2,4,7,9,7,4,2, 0,2,4,5,7,5,4,2],
  river:      [0,2,4,7,9,7,4,2, 0,4,7,9,7,4,2,1],
  mountain:   [0,0,3,4,7,9,7,4, 0,2,5,7,9,7,5,2],
  desert:     [0,1,4,5,7,5,4,1, 0,1,7,8,7,5,4,2],
  atlantis:   [0,3,5,7,12,10,7,5, 3,5,7,10,12,10,7,3],
  mushroom:   [0,3,1,5,6,4,2,1, 0,3,5,8,6,4,1,3],
  ouroboros:  [0,-1,3,6,4,2,1,-2, 0,3,6,8,6,4,2,-1],
  magic:      [0,2,5,9,7,5,4,2, 0,4,7,9,7,4,2,5],
  sky:        [7,9,11,14,12,9,7,5, 7,11,14,16,14,12,9,7],
  soul:       [0,3,4,2,-1,0,2,5, 0,-1,3,4,2,0,-2,3],
  jungle:     [0,0,3,5,7,5,10,7, 0,3,5,7,10,12,10,5],
  arctic:     [0,4,7,9,7,4,2,0, 4,7,9,12,9,7,4,2],
  mine:       [0,0,2,0,5,7,5,2, 0,2,5,7,5,2,0,-1],
  cave:       [0,3,5,4,2,-1,0,3, 0,5,7,9,7,4,2,-1],
  boss:       [0,0,3,7,6,3,2,0, 0,3,5,7,10,7,5,3],
  volcano:    [0,3,5,8,7,5,3,1, 0,3,7,8,10,8,7,3],
  alien:      [0,1,4,7,8,7,4,1, 0,4,7,11,8,7,4,1],
  deep:       [0,2,3,7,5,3,2,0, 0,3,5,7,10,7,5,3],
  shocked:    [0,1,4,6,7,6,4,1, 0,4,6,9,7,6,4,1],
  uran:       [0,4,6,7,11,9,7,6, 0,4,7,11,12,11,7,4],
  celestial:  [0,4,7,11,9,7,4,2, 0,5,7,11,14,11,9,7],
};
const THEME_COUNTERS = {
  river:'guitar', mountain:'brass', desert:'oud', atlantis:'harp', mushroom:'bell', ouroboros:'saw', magic:'flute', sky:'harp', soul:'theremin', jungle:'marimba', arctic:'bell', mine:'brass', cave:'guitar'
};
const THEME_ACCENTS = {
  river:'guitar', mountain:'brass', desert:'oud', atlantis:'harp', mushroom:'marimba', ouroboros:'saw', magic:'bell', sky:'flute', soul:'bell', jungle:'marimba', arctic:'bell', mine:'saw', cave:'harp'
};
function playThemeHook(theme, note, t, stepDur, hot, th, step, bar) {
  const motif = THEME_HOOKS[theme];
  if (!motif || bar < 1) return;
  const inst = THEME_COUNTERS[theme] || th.lead;
  const acc = THEME_ACCENTS[theme] || th.lead2;
  if (step % 4 === 0) {
    const idx = (step / 4 + bar * 2) % motif.length;
    const deg = motif[idx];
    const f = mtof(note(deg, theme === 'sky' || theme === 'arctic' ? 1 : 0));
    playInst(inst, f, t, stepDur * (theme === 'soul' ? 2.2 : 1.5), hot ? 0.050 : 0.033, th);
    if (hot && ['jungle','mine','ouroboros','river'].includes(theme)) mNote(f * 0.5, t, stepDur * 1.1, 'triangle', 0.035, { sus:0.2, wet:0.12 });
  }
  // Call-and-response accents are what makes the biome themes feel less like generic loops.
  if (hot && step % 8 === 6 && bar % 2 === 1) {
    const response = motif[(step / 2 + bar * 3) % motif.length];
    const f2 = mtof(note(response + 2, theme === 'sky' || theme === 'arctic' ? 1 : 0));
    playInst(acc, f2, t, stepDur * 0.8, 0.028, th);
  }
}

const FORM = ['intro', 'verse', 'chorus', 'verse', 'bridge', 'chorus'];
// ---------- offline drum synthesis into buffers (rendered once)
function renderSamples() {
  const sr = actx.sampleRate, mk = (sec, fn) => { const n = Math.floor(sr * sec), b = actx.createBuffer(1, n, sr), d = b.getChannelData(0); fn(d, n, sr); let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); if (pk > 0) for (let i = 0; i < n; i++) d[i] /= pk; return b; };
  const rnd2 = () => Math.random() * 2 - 1;
  const sat = (x, k) => Math.tanh(x * k) / Math.tanh(k);
  const S2 = {};
  S2.kick = mk(0.45, (d, n, sr) => { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; const f = 48 + 160 * Math.exp(-t * 28); ph += 2 * Math.PI * f / sr; const body = Math.sin(ph) * Math.exp(-t * 7.5); const click = i < sr * 0.004 ? rnd2() * (1 - i / (sr * 0.004)) * 0.6 : 0; d[i] = sat(body * 1.4 + click, 2); } });
  S2.snare = mk(0.3, (d, n, sr) => { let lp = 0; for (let i = 0; i < n; i++) { const t = i / sr; const tone = (Math.sin(2 * Math.PI * 185 * t) * 0.7 + Math.sin(2 * Math.PI * 330 * t) * 0.4) * Math.exp(-t * 28); const w = rnd2(); const hp = w - lp; lp += (w - lp) * 0.35; d[i] = tone + hp * Math.exp(-t * 15) * 1.1; } });
  S2.clap = mk(0.3, (d, n, sr) => { let lp = 0; for (let i = 0; i < n; i++) { const t = i / sr; const w = rnd2(); lp += (w - lp) * 0.5; const bp = w - lp; let env = Math.exp(-t * 20); for (const o of [0, 0.011, 0.022]) if (t >= o && t < o + 0.01) env = Math.max(env, 1 - (t - o) / 0.01); d[i] = bp * env; } });
  const metal = (sec, decay) => mk(sec, (d, n, sr) => { const fr = [205.3, 304.4, 369.6, 522.7, 540, 800].map((f) => f * 1.7); let prev = 0, hp1 = 0; for (let i = 0; i < n; i++) { const t = i / sr; let s = 0; for (const f of fr) s += (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1); s = s / 6 * 0.6 + rnd2() * 0.4; const h = s - prev; prev = s; hp1 = h - hp1 * 0.2; d[i] = hp1 * Math.exp(-t * decay); } });
  S2.hat = metal(0.08, 60); S2.ohat = metal(0.4, 9); S2.ride = metal(1.2, 3.2);
  S2.crash = mk(1.8, (d, n, sr) => { let prev = 0; for (let i = 0; i < n; i++) { const t = i / sr; const w = rnd2(); d[i] = (w - prev) * Math.exp(-t * 2.2) * (1 - Math.exp(-t * 400)); prev = w * 0.6; } });
  S2.shaker = mk(0.09, (d, n, sr) => { let prev = 0; for (let i = 0; i < n; i++) { const t = i / sr; const w = rnd2(); d[i] = (w - prev) * Math.sin(Math.PI * Math.min(1, t / 0.09)) ; prev = w; } });
  S2.tom = mk(0.5, (d, n, sr) => { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * (110 + 60 * Math.exp(-t * 18)) / sr; d[i] = sat(Math.sin(ph) * Math.exp(-t * 7) + rnd2() * 0.15 * Math.exp(-t * 40), 1.5); } });
  S2.conga = mk(0.35, (d, n, sr) => { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * (300 + 80 * Math.exp(-t * 60)) / sr; d[i] = Math.sin(ph) * Math.exp(-t * 11) + rnd2() * 0.2 * Math.exp(-t * 90); } });
  S2.taiko = mk(0.9, (d, n, sr) => { let ph = 0, lp = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * (62 + 50 * Math.exp(-t * 12)) / sr; const w = rnd2(); lp += (w - lp) * 0.05; d[i] = sat(Math.sin(ph) * Math.exp(-t * 4.5) + lp * 2 * Math.exp(-t * 9), 2); } });
  S2.rim = mk(0.06, (d, n, sr) => { for (let i = 0; i < n; i++) { const t = i / sr; d[i] = (Math.sin(2 * Math.PI * 1700 * t) * 0.6 + Math.sin(2 * Math.PI * 820 * t)) * Math.exp(-t * 80); } });
  S2.doum = mk(0.5, (d, n, sr) => { let ph = 0; for (let i = 0; i < n; i++) { const t = i / sr; ph += 2 * Math.PI * (90 + 40 * Math.exp(-t * 25)) / sr; d[i] = Math.sin(ph) * Math.exp(-t * 6); } });
  S2.tek = mk(0.08, (d, n, sr) => { let lp = 0; for (let i = 0; i < n; i++) { const t = i / sr; const w = rnd2(); lp += (w - lp) * 0.6; d[i] = (lp * 0.6 + Math.sin(2 * Math.PI * 620 * t)) * Math.exp(-t * 55); } });
  S2.chain = mk(0.5, (d, n, sr) => { for (let i = 0; i < n; i++) { const t = i / sr; d[i] = rnd2() * Math.exp(-t * 8) * (0.5 + 0.5 * Math.sin(t * 90)); } });
  return S2;
}
function drum(name, t, v = 1, rate = 1, pan = 0) {
  if (!music.smp) return;
  const src = actx.createBufferSource(); src.buffer = music.smp[name]; src.playbackRate.value = rate;
  const g = actx.createGain(); g.gain.value = v;
  let node = src.connect(g);
  if (pan && actx.createStereoPanner) { const p = actx.createStereoPanner(); p.pan.value = pan; node = g.connect(p); }
  node.connect(music.drumBus);
  if (name === 'snare' || name === 'clap' || name === 'crash' || name === 'taiko') { const s = actx.createGain(); s.gain.value = 0.18; g.connect(s); s.connect(music.verb); }
  src.start(t);
}
const kick = (t, v = 0.9) => drum('kick', t, v);
const snare = (t, v = 0.35) => drum('snare', t, Math.min(1, v * 2));
const hat = (t, v = 0.1, open = false) => drum(open ? 'ohat' : 'hat', t, Math.min(1, v * 3.5), 1, 0.25);
const tom = (t, f, v = 0.45) => drum('tom', t, Math.min(1, v * 1.6), f / 160, f > 180 ? -0.3 : 0.3);
const crash = (t, v = 0.12) => drum('crash', t, Math.min(1, v * 4), 1, -0.2);
// ---------- Karplus-Strong plucked strings (cached per note)
function ksBuffer(midi, bright) {
  const key = midi + (bright ? 'b' : ''); if (music.ks[key]) return music.ks[key];
  const sr = actx.sampleRate, f = mtof(midi), len = Math.floor(sr * 1.6), N = Math.max(2, Math.round(sr / f));
  const b = actx.createBuffer(1, len, sr), d = b.getChannelData(0), ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  const damp = bright ? 0.4985 : 0.497; let idx = 0;
  for (let i = 0; i < len; i++) { const a = ring[idx], c = ring[(idx + 1) % N]; const nv = (a + c) * damp; d[i] = a; ring[idx] = nv; idx = (idx + 1) % N; }
  music.ks[key] = b; return b;
}
function ksPluck(freq, t, dur, vol, bright, pan = 0) {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const src = actx.createBufferSource(); src.buffer = ksBuffer(Math.max(28, Math.min(100, midi)), bright);
  const g = actx.createGain(); g.gain.setValueAtTime(vol * 2.2, t); g.gain.setTargetAtTime(0.0001, t + Math.max(0.25, dur), 0.12);
  src.connect(g); let out = g;
  if (pan && actx.createStereoPanner) { const p = actx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  out.connect(music.bus); const s = actx.createGain(); s.gain.value = 0.35; g.connect(s); s.connect(music.verb);
  src.start(t); src.stop(t + Math.max(0.25, dur) + 0.8);
}
function fmBell(freq, t, dur, vol, ratio = 3.5) {
  const c = actx.createOscillator(), m = actx.createOscillator(), mg = actx.createGain(), g = actx.createGain();
  c.frequency.value = freq; m.frequency.value = freq * ratio; mg.gain.setValueAtTime(freq * 2.2, t); mg.gain.exponentialRampToValueAtTime(1, t + dur);
  m.connect(mg).connect(c.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  c.connect(g); g.connect(music.bus); const s = actx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(music.verb); const s2 = actx.createGain(); s2.gain.value = 0.3; g.connect(s2); s2.connect(music.delay);
  c.start(t); m.start(t); c.stop(t + dur + 0.05); m.stop(t + dur + 0.05);
}
function mNoiseTo(t, dur, vol, type, freq, q = 1, dest = music.bus) {
  if (!actx || !dest) return;

  if (!noiseBuf) {
    const length = actx.sampleRate;
    noiseBuf = actx.createBuffer(1, length, actx.sampleRate);

    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  const source = actx.createBufferSource();
  source.buffer = noiseBuf;

  const filter = actx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;

  const gain = actx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  source.connect(filter).connect(gain).connect(dest);
  source.start(t, Math.random() * 0.5);
  source.stop(t + dur + 0.02);
}

function mNoise(t, dur, vol, type, freq, q = 1) {
  mNoiseTo(t, dur, vol, type, freq, q, music.bus);
}
function playInst(name, f, t, dur, v, th) {
  const wet = th.wet ?? 0.3;
  switch (name) {
    case 'chip': mNote(f, t, dur, 'square', v * 0.7, { vib: dur > 0.3, wet, verb: 0.2, sus: 0.6 }); break;
    case 'flute': mNote(f, t, dur, 'triangle', v, { vib: true, att: 0.05, sus: 0.8, rel: 0.12, wet, verb: 0.35 }); mNoise(t, Math.min(0.12, dur), v * 0.22, 'bandpass', f * 2, 3); break;
    case 'saw': mNote(f, t, dur, 'sawtooth', v * 0.55, { cut: 2600, env: true, q: 3, sus: 0.6, wet, verb: 0.2, detune: -7 }); mNote(f, t, dur, 'sawtooth', v * 0.45, { cut: 2600, env: true, q: 3, sus: 0.6, detune: 7 }); break;
    case 'brass': mNote(f, t, dur, 'sawtooth', v * 0.7, { cut: 1800, q: 2, att: 0.04, sus: 0.7, wet, verb: 0.3, vib: dur > 0.4 }); mNote(f * 0.5, t, dur, 'square', v * 0.25, { cut: 900, att: 0.04, sus: 0.7 }); break;
    case 'bell': fmBell(f, t, Math.max(0.6, dur * 2), v * 0.8); break;
    case 'marimba': mNote(f, t, 0.35, 'sine', v * 1.1, { sus: 0.02, rel: 0.25, verb: 0.25 }); mNote(f * 4, t, 0.08, 'sine', v * 0.3, { sus: 0.01, rel: 0.05 }); break;
    case 'harp': ksPluck(f, t, dur, v, false, 0.2); break;
    case 'guitar': ksPluck(f, t, dur, v * 1.1, true, -0.15); break;
    case 'oud': ksPluck(f, t, dur, v * 1.1, true, 0.1); ksPluck(f * 1.003, t + 0.012, dur, v * 0.5, true, -0.1); break;
    case 'accordion': mNote(f, t, dur, 'sawtooth', v * 0.4, { cut: 2200, q: 1, att: 0.03, sus: 0.85, vib: true, detune: -9, wet, verb: 0.3 }); mNote(f, t, dur, 'square', v * 0.3, { cut: 1600, att: 0.03, sus: 0.85, detune: 9 }); break;
    case 'theremin': { const o = actx.createOscillator(), g = actx.createGain(), l = actx.createOscillator(), lg = actx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); l.frequency.value = 6.2; lg.gain.value = f * 0.025; l.connect(lg).connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 1.1, t + 0.1); g.gain.setValueAtTime(v * 1.1, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3); o.connect(g); g.connect(music.bus); const s = actx.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(music.verb); o.start(t); l.start(t); o.stop(t + dur + 0.35); l.stop(t + dur + 0.35); break; }
    default: mNote(f, t, dur, 'triangle', v, { wet, sus: 0.6 });
  }
}
function playPad(kind, f, t, dur, v, k) {
  if (kind === 'choir') { for (const fm of [700, 1150]) { const o = actx.createOscillator(), bp = actx.createBiquadFilter(), g = actx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = k * 4 - 6; bp.type = 'bandpass'; bp.frequency.value = fm; bp.Q.value = 6; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 1.6, t + 0.5); g.gain.setValueAtTime(v * 1.6, t + dur * 0.85); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4); o.connect(bp).connect(g); g.connect(music.padBus); const s = actx.createGain(); s.gain.value = 0.6; g.connect(s); s.connect(music.verb); o.start(t); o.stop(t + dur + 0.5); } }
  else { mNote(f, t, dur, 'sawtooth', v * 0.45, { att: 0.4, sus: 0.85, rel: 0.6, cut: 1400, detune: -8 + k, verb: 0.55, bus: 'pad' }); mNote(f, t, dur, 'sawtooth', v * 0.45, { att: 0.4, sus: 0.85, rel: 0.6, cut: 1400, detune: 8 - k, bus: 'pad' }); }
}
function pumpPad(t, stepDur) { if (!music.padBus) return; const g = music.padBus.gain; g.cancelScheduledValues(t); g.setValueAtTime(0.4, t); g.linearRampToValueAtTime(1, t + stepDur * 3); }
// kits: [kick steps], [snare steps], hat pattern, extras(fn)
function drumStep(kit, s, t, sec, lastBar, stepDur, hot) {
  const b = s % 16;
  if (sec === 'intro' && !hot) { if (b % 4 === 0) drum('shaker', t, 0.35); if (lastBar && b >= 12) snare(t, 0.08 + (b - 12) * 0.05); return; }
  if (lastBar && b >= 12) { // fill
    if (music.fill === 0) snare(t, 0.2 + (b - 12) * 0.07); else if (music.fill === 1) tom(t, 260 - (b - 12) * 40); else { snare(t, 0.22); if (b % 2) tom(t, 180); }
    if (b === 12) kick(t, 0.8); return;
  }
  if (b === 0 && s % 128 === 0 && (sec === 'chorus' || sec === 'bridge')) crash(t);
  const ch = sec === 'chorus';
  if (!hot && kit !== 'boss') { // calm layer: light pulse only
    if (b === 0) { kick(t, 0.45); pumpPad(t, stepDur); }
    if (b % 4 === 2) drum('shaker', t, 0.3);
    if (kit === 'tribal' || kit === 'darbuka') { if (b === 6 || b === 11) drum('conga', t, 0.35, 1, 0.3); }
    if (kit === 'spooky' && b === 8) drum('chain', t, 0.15);
    if (b === 8 && ch) drum('rim', t, 0.3);
    return;
  }
  switch (kit) {
    case 'pop': if (b === 0 || b === 8 || b === 10) { kick(t); pumpPad(t, stepDur); } if (b === 4 || b === 12) { snare(t, 0.38); if (ch) drum('clap', t, 0.5); } if (b % 2 === 0) hat(t, ch ? 0.1 : 0.07); if (ch && b % 2) hat(t, 0.04); if (b === 14) hat(t, 0.06, true); break;
    case 'folk': if (b === 0 || b === 10) { kick(t, 0.7); pumpPad(t, stepDur); } if (b === 4 || b === 12) drum('rim', t, 0.5); if (b === 12 && ch) snare(t, 0.25); if (b % 2 === 0) drum('shaker', t, 0.4 + (b % 4 === 0 ? 0.2 : 0)); break;
    case 'soft': if (b === 0 || b === 10) { kick(t, 0.6); pumpPad(t, stepDur); } if (b === 8) snare(t, 0.2); if (b % 4 === 2) hat(t, 0.05); if (b % 2 === 0) drum('shaker', t, 0.25); if (ch && b === 4) drum('rim', t, 0.35); break;
    case 'march': if (b % 4 === 0) { kick(t, 0.75); pumpPad(t, stepDur); } if (b === 4 || b === 12) snare(t, 0.35); if (b === 14 || b === 15 || (ch && (b === 7))) snare(t, 0.18); if (b % 2 === 0) hat(t, 0.05); if (b === 0 && s % 64 === 0) drum('taiko', t, 0.7); break;
    case 'darbuka': if (b === 0 || b === 7 || b === 10) { drum('doum', t, 0.9); pumpPad(t, stepDur); } if ([3, 5, 12, 14].includes(b)) drum('tek', t, 0.6, 1, 0.3); if (ch && b % 2) drum('tek', t, 0.25, 1.1, -0.3); if (b === 0) kick(t, 0.5); break;
    case 'shanty': if (b === 0 || b === 6 || b === 8) { kick(t, 0.8); pumpPad(t, stepDur); } if (b === 4 || b === 12) { snare(t, 0.25); drum('clap', t, 0.5); } if (b === 2 || b === 10 || b === 14) drum('tom', t, 0.4, 1.5); if (b % 2 === 0) drum('shaker', t, 0.35); break;
    case 'tribal': if (b === 0 || b === 6 || b === 10) { drum('taiko', t, b ? 0.6 : 0.9); pumpPad(t, stepDur); } if ([3, 7, 11, 13].includes(b)) drum('conga', t, 0.6, b % 4 === 3 ? 1 : 0.75, b % 2 ? 0.3 : -0.3); if (b % 2) drum('shaker', t, 0.35); if (ch && (b === 4 || b === 12)) drum('clap', t, 0.5); break;
    case 'spooky': if (b === 0) { drum('taiko', t, 0.6); pumpPad(t, stepDur); } if (b === 8) snare(t, 0.15); if (b === 12) drum('chain', t, 0.25); if (b % 4 === 2) drum('rim', t, 0.25, 0.7); break;
    case 'drive': if (b % 4 === 0) { kick(t); pumpPad(t, stepDur); } if (b === 4 || b === 12) { snare(t, 0.42); drum('clap', t, 0.4); } hat(t, b % 2 ? 0.05 : 0.09); if (ch && b === 14) kick(t, 0.6); if (ch && b % 8 === 0) drum('ride', t, 0.3); break;
    case 'boss': if (b % 2 === 0 || b === 15) { kick(t, b % 4 === 0 ? 1 : 0.6); if (b % 4 === 0) pumpPad(t, stepDur); } if (b === 4 || b === 12) { snare(t, 0.5); drum('clap', t, 0.5); } hat(t, 0.08); if (b === 14) tom(t, 200); if (b === 0 && s % 32 === 0) drum('taiko', t, 0.8); if (ch && b % 4 === 2) drum('ride', t, 0.25); break;
  }
}
function musicTick() {
  if (!actx || !music.bus) return;
  let th = THEMES[music.theme];
  if (music.t < actx.currentTime - 0.2) music.t = actx.currentTime + 0.05;
  // combat intensity follows recent fighting
  const want = th.always || (S.time - music.fight < 5) ? 1 : 0;
  music.intensity += (want - music.intensity) * (want > music.intensity ? 0.08 : 0.01);
  if (music.lp) music.lp.frequency.setTargetAtTime(4500 + music.intensity * 14000, actx.currentTime, 0.4);
  while (music.t < actx.currentTime + 0.15) {
    const stepDur = 60 / (th.bpm * (1 + (music.intensity > 0.8 ? 0.035 : music.intensity > 0.55 ? 0.018 : 0))) / 4;
    const s = music.step, b = s % 16, bar = Math.floor(s / 16);
    if (b === 0 && music.next && bar % 2 === 0) {
      const nextTheme = music.next;
      music.next = null;
      const gain = music.bus.gain;
      const fadeStart = Math.max(actx.currentTime, music.t - 0.12);
      gain.cancelScheduledValues(fadeStart);
      gain.setValueAtTime(gain.value, fadeStart);
      gain.linearRampToValueAtTime(0.32, music.t);
      gain.linearRampToValueAtTime(1, music.t + 0.55);
      music.theme = nextTheme;
      music.step = music.theme === 'boss' ? 16 * 16 : 16 * 8;
      th = THEMES[music.theme];
      crash(music.t, 0.1);
      continue;
    }
    const sec = FORM[Math.floor(bar / 8) % FORM.length], lastBar = bar % 8 === 7, hot = music.intensity > 0.5;
    const t = music.t + (b % 2 ? (th.swing || 0) * stepDur : 0);
    if (S.sound && S.musicOn) {
const song = music.songs[music.theme] || (music.songs[music.theme] =
  music.theme === 'forest' ? makeForestSong() : makeSong(th)
);
      music.fill = song.fill;
      const prog = sec === 'chorus' && th.prog2 ? th.prog2 : th.prog;
      const chordDeg = prog[bar % prog.length] + (sec === 'bridge' ? 3 : 0);
      const sc = th.scale, note = (deg, oct = 0) => th.root + sc[((deg % 7) + 7) % 7] + 12 * (Math.floor(deg / 7) + oct);
      if (b === 0) { const inv = bar % 2; [0, 2, 4, inv ? 7 : 6].forEach((k, i) => playPad(th.pad, mtof(note(chordDeg + k, -1)), t, stepDur * 15.5, ch2v(sec), i)); }
      // strummed / stabbed chords in the chorus when fighting
      if (sec === 'chorus' && hot && (b === 6 || b === 14)) { const inst = th.arp === 'guitar' || th.arp === 'oud' || th.arp === 'harp' ? 'guitar' : th.lead === 'brass' || th.lead === 'saw' ? 'brass' : 'chip'; [0, 2, 4].forEach((k, i) => playInst(inst, mtof(note(chordDeg + k)), t + i * 0.012, stepDur * 1.2, 0.03, th)); }
      // bass: whole notes when calm, groove when fighting
      if (sec !== 'intro') {
        const pat = !hot ? [0] : th.kit === 'boss' || th.kit === 'drive' ? [0, 2, 4, 6, 8, 10, 12, 14] : th.kit === 'shanty' ? [0, 6, 8, 12] : [0, 3, 6, 8, 11, 14];
        if (pat.includes(b)) {
          const walk = b === 14 && lastBar ? 1 : b === 6 || b === 14 ? 4 : 0, f = mtof(note(chordDeg + walk, -2)), d = stepDur * (!hot ? 14 : pat.length > 6 ? 1.6 : 2.6);
          if (th.bass === 'pluck' && hot) ksPluck(f, t, d, 0.09, true);
          else if (th.bass === 'saw') mNote(f, t, d, 'sawtooth', 0.1, { cut: sec === 'chorus' ? 1000 : 700, env: true, q: 6, sus: 0.2 });
          else mNote(f, t, d, 'triangle', 0.14, { sus: 0.5, rel: 0.1 });
          if (b % 8 === 0) mNote(mtof(note(chordDeg, -3)), t, stepDur * (hot ? 3 : 12), 'sine', 0.12, { sus: 0.6 });
        }
      }
      // arpeggio
      if (th.arp && sec !== 'bridge' && (hot ? b % 2 === 0 : b % 4 === 0)) { const ar = [0, 2, 4, 7, 4, 2, 0, 4][(b / 2) % 8 | 0]; playInst(th.arp, mtof(note(chordDeg + ar, th.arp === 'bell' ? 1 : 0)), t, stepDur * 1.6, hot ? 0.026 : 0.018, th); }
      if (sec === 'bridge' && b % 4 === 0) fmBell(mtof(note(chordDeg + [0, 4, 2, 7][(b / 4) % 4], 1)), t, stepDur * 6, 0.04);
      // melody
      if (sec !== 'intro' && (hot || sec !== 'bridge')) {
        const line = song[sec === 'chorus' ? 'chorus' : sec === 'bridge' ? 'bridge' : 'verse'];
        const m = line[(bar % 8) * 16 + b];
        if (m) {
          const f = mtof(note(m.deg)), dur = stepDur * m.len * 0.95, v = (hot ? 0.06 : 0.045);
          playInst(sec === 'chorus' ? th.lead2 : th.lead, f, t, dur, v, th);
          if (sec === 'chorus' && hot) { mNote(mtof(note(m.deg + 2)), t, dur, 'triangle', v * 0.4, { wet: 0.3, sus: 0.6 }); mNote(f * 2, t, dur, 'triangle', v * 0.22, { sus: 0.5 }); }
        }
      }
      playThemeHook(music.theme, note, t, stepDur, hot, th, s, bar);
      if (music.theme !== 'base' && music.theme !== 'boss' && hot && sec === 'chorus') {
        // Short impact/stab pattern on the chorus backbeat.
        if (b === 3 || b === 11) {
          const stab = mtof(note(chordDeg + 4, -1));
          playInst(THEME_ACCENTS[music.theme] || th.lead2, stab, t, stepDur * 0.9, 0.025, th);
          kick(t, 0.35);
        }
        if (b === 15 && lastBar) {
          snare(t, 0.5); crash(t, 0.10);
        }
      }
      const hype = hot && (S.momentum >= 5 || S.director?.active || S.chain?.count >= 6);
      if (hype && b % 2 === 0) hat(t, 0.045 + (S.momentum >= 8 ? 0.018 : 0));
      if (hype && (b === 2 || b === 10)) {
        const hf = mtof(note(chordDeg + (b === 10 ? 4 : 2), 1));
        playInst(THEME_ACCENTS[music.theme] || th.lead2, hf, t, stepDur * 0.7, 0.02 + Math.min(0.012, S.momentum * 0.001), th);
      }
      if (S.director?.active && (b === 0 || b === 8)) { kick(t, 0.75); drum('clap', t, 0.24); }
      drumStep(th.kit, s, t, sec, lastBar, stepDur, hot);
    }
    music.step++; music.t += stepDur;
  }
}
const ch2v = (sec) => (sec === 'chorus' ? 0.042 : 0.034);
function musicStinger(kind) {
  if (!actx || !music.bus || !S.sound || !S.musicOn) return;
  const t = actx.currentTime + 0.05;
  if (kind === 'victory') { [0, 4, 7, 12, 16].forEach((n, i) => { mNote(mtof(72 + n), t + i * 0.09, 0.5, 'square', 0.05, { wet: 0.4, sus: 0.4 }); fmBell(mtof(84 + n), t + i * 0.09, 0.8, 0.03); }); crash(t + 0.45, 0.14); kick(t + 0.45); }
  else if (kind === 'badge') { [0, 7, 12].forEach((n, i) => fmBell(mtof(79 + n), t + i * 0.08, 1, 0.05)); }
  else if (kind === 'zone') { [0, 4, 7].forEach((n, i) => ksPluck(mtof(67 + n), t + i * 0.1, 0.8, 0.07, true)); }
  else if (kind === 'combo') {
    [0, 7, 12, 16].forEach((n, i) => {
      mNote(mtof(76 + n), t + i * 0.06, 0.18, i > 1 ? 'sawtooth' : 'square', 0.045, { wet: 0.2, sus: 0.3 });
    });
    kick(t, 0.85); snare(t + 0.12, 0.3);
  }
  else if (kind === 'rare') {
    [0,4,7,12].forEach((n,i)=>{ fmBell(mtof(84+n), t+i*0.075, 0.7, 0.055); ksPluck(mtof(72+n), t+i*0.075, 0.45, 0.035, true); });
    crash(t+0.22,0.11);
  }
  else if (kind === 'legendary') {
    [0,4,7,12,16,19].forEach((n,i)=>{ mNote(mtof(76+n), t+i*0.06, 0.26, i%2?'sawtooth':'square', 0.055, { wet:0.3, sus:0.35 }); fmBell(mtof(88+n), t+i*0.06, 0.9, 0.035); });
    kick(t,1); kick(t+0.18,0.8); snare(t+0.28,0.45); crash(t+0.3,0.16);
  }
  else if (kind === 'legacy') {
    [72,79,84,91].forEach((f,i)=>fmBell(mtof(f), t+i*0.09, 0.9, 0.045));
    kick(t,0.65); crash(t+0.28,0.09);
  }
}

function initMusicBus() {
  if (music.bus) return;
  music.bus = actx.createGain(); music.bus.gain.value = 1;
  music.comp = actx.createDynamicsCompressor();
  music.comp.threshold.value = -20;
  music.comp.knee.value = 12;
  music.comp.ratio.value = 3;
  music.comp.attack.value = 0.01;
  music.comp.release.value = 0.22;
  music.lp = actx.createBiquadFilter(); music.lp.type = 'lowpass'; music.lp.frequency.value = 2400; music.lp.Q.value = 0.5;
  music.bus.connect(music.comp).connect(music.lp).connect(musicGain);
  music.drumBus = actx.createGain(); music.drumBus.gain.value = 0.55; music.drumBus.connect(music.bus);
  try { music.smp = renderSamples(); } catch (e) { music.smp = null; }
  // feedback delay
  const d = actx.createDelay(1); d.delayTime.value = 0.32;
  const fb = actx.createGain(); fb.gain.value = 0.32;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  d.connect(lp).connect(fb).connect(d); d.connect(music.comp);
  music.delay = actx.createGain(); music.delay.gain.value = 0.3; music.delay.connect(d);
  // small generated reverb
  const len = actx.sampleRate * 1.8, buf = actx.createBuffer(2, len, actx.sampleRate);
  for (let c = 0; c < 2; c++) { const ch = buf.getChannelData(c); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const cv = actx.createConvolver(); cv.buffer = buf; cv.connect(music.comp);
  music.verb = actx.createGain(); music.verb.gain.value = 0.25; music.verb.connect(cv);
  music.padBus = actx.createGain(); music.padBus.gain.value = 1; music.padBus.connect(music.bus);
}
function mNote(freq, t, dur, type, vol, opt = {}) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (opt.vib) { const l = actx.createOscillator(), lg = actx.createGain(); l.frequency.value = 5.5; lg.gain.value = freq * 0.012; l.connect(lg).connect(o.frequency); l.start(t + 0.08); l.stop(t + dur + 0.1); }
  if (opt.detune) o.detune.value = opt.detune;
  let node = o;
  if (opt.cut) { const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(opt.cut, t); if (opt.env) f.frequency.exponentialRampToValueAtTime(Math.max(120, opt.cut * 0.25), t + dur); f.Q.value = opt.q || 1; o.connect(f); node = f; }
  const a = opt.att || 0.008;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a, dur * (opt.sus ?? 0.3))); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (opt.rel || 0.05));
  node.connect(g); g.connect(opt.bus === 'pad' && music.padBus ? music.padBus : music.bus);
  if (opt.wet) { const s = actx.createGain(); s.gain.value = opt.wet; g.connect(s); s.connect(music.delay); }
  if (opt.verb) { const s = actx.createGain(); s.gain.value = opt.verb; g.connect(s); s.connect(music.verb); }
  o.start(t); o.stop(t + dur + (opt.rel || 0.05) + 0.05);
}
let noiseBuf = null;

function startMusic() {
  initMusicBus();
  music.t = actx.currentTime + 0.1;
  if (!music.timer) music.timer = setInterval(musicTick, 25);
}
function setMusicTheme(name) {
  if (!THEMES[name]) return;

  if (name === music.theme) {
    music.next = null;
    return;
  }

  if (name === music.next) return;

  music.next = name;

  if (name !== 'boss' && S.mode === 'play') {
    musicStinger('zone');
  }
}


function toggleSound() {
  S.sound = !S.sound;
  
  applySettings();
}


// --------------------------------------------------------- V5 WORLD ---
const SHELL_OBJS = [];
let raidPortal = null, bankPad = null;
function buildV5World() {
  // west base extension: new plots + plaza
  const plaza2 = new THREE.Mesh(new THREE.BoxGeometry(56, 0.1, 80), mat(0xbfb8a8)); plaza2.position.set(-57, 0.03, 0); plaza2.receiveShadow = true; scene.add(plaza2);
  const sign = makeLabel('PLOT EXPANSION', '#1b2140', '#ffe066', 36); sign.position.set(-57, 5, 0); scene.add(sign);
  part(G.cyl, 0x6b4217, 0.3, 4, 0.3, -57, 2, 0, scene);
  // Wise Bird Lands: floating islands + clouds
  const cloudM = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const isl = [];
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group(); g.position.set(rr(425, 495), rr(10, 22), rr(-80, 80) * (rnd() < 0.5 ? 1 : 1)); if (Math.abs(g.position.z) < 50) g.position.z = Math.sign(g.position.z || 1) * rr(52, 80);
    const top = part(G.box, 0x7fbf5a, rr(6, 10), 1.2, rr(6, 10), 0, 0, 0, g); part(G.cone, 0x8a7a6a, 3.5, 5, 3.5, 0, -3.2, 0, g).rotation.x = Math.PI;
    if (rnd() < 0.6) { const t = buildTree(0x9fd86a, 1); t.root.position.y = 0.6; g.add(t.root); }
    scene.add(g); isl.push(g); g.userData.p = rnd() * 6;
  }
  for (let i = 0; i < 18; i++) { const c = part(G.sph, 0, rr(8, 16), rr(3, 5), rr(6, 10), rr(420, 500), rr(26, 36), rr(-90, 90), scene, cloudM); c.castShadow = false; }
  effects.push({ persistent: true, update: (dt, t) => { for (const g of isl) g.position.y += Math.sin(t * 0.8 + g.userData.p) * dt * 0.4; } });
  // Soul Land: dead trees, graves, floating soul orbs
  const orbs = [], orbM = new THREE.MeshBasicMaterial({ color: 0x5affd8, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 40; i++) { const o = part(G.sph, 0, 0.35, 0.35, 0.35, rr(500, 580), rr(1, 5), rr(-44, 44), scene, orbM); o.castShadow = false; o.userData.p = rnd() * 6; orbs.push(o); }
  effects.push({ persistent: true, update: (dt, t) => { for (const o of orbs) { o.position.y = 2.5 + Math.sin(t + o.userData.p) * 1.5; o.position.x += Math.cos(t * 0.5 + o.userData.p) * dt * 0.6; } } });
  for (let x = 502; x < 580; x += rr(7, 11)) for (const zz of [Z_MIN - rr(4, 12), Z_MAX + rr(4, 12)]) { const t = buildTree(0x3a3550, rr(1.2, 1.8)); t.root.position.set(x, 0, zz); scene.add(t.root); }
  // Jungle: big trees, vines, temple
  for (let x = 582; x < 660; x += rr(5, 8)) for (const zz of [Z_MIN - rr(3, 10), Z_MAX + rr(3, 10)]) { const t = buildTree(0x2f8a2a, rr(2, 3)); t.root.position.set(x, 0, zz); scene.add(t.root); }
  const tm = new THREE.MeshLambertMaterial({ color: 0x8a8a6a, flatShading: true });
  for (let i = 0; i < 4; i++) part(G.box, 0, 18 - i * 4, 3, 18 - i * 4, 640, 1.5 + i * 3, 30, scene, tm);
  part(G.box, 0x2a2a1a, 3, 4, 0.5, 640, 2, 21, scene);
  // Arctic: snowy pines, ice spikes, falling snow
  for (let x = 662; x < 742; x += rr(5, 8)) for (const zz of [Z_MIN - rr(3, 10), Z_MAX + rr(3, 10)]) { const m = new THREE.Mesh(new THREE.ConeGeometry(rr(2, 3), rr(6, 10), 6), mat(0x2f5a4a)); m.position.set(x, 4, zz); scene.add(m); part(G.cone, 0xffffff, 1.2, 2, 1.2, x, 8.4, zz, scene); }
  const flakes = [], fM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 160; i++) { const f = part(G.box, 0, 0.15, 0.15, 0.15, rr(660, 740), rr(0, 20), rr(-44, 44), scene, fM); f.castShadow = false; flakes.push(f); }
  effects.push({ persistent: true, update: (dt, t) => { for (const f of flakes) { f.position.y -= dt * 2.5; f.position.x += Math.sin(t + f.position.z) * dt * 0.5; if (f.position.y < 0) f.position.y = 20; } } });
  // The Mine: rock walls, rails, lanterns, raid portal
  const mz = ZONES[12];
  for (let i = 0; i < 20; i++) { const sx = i % 2 ? mz.x0 + rr(1, 4) : mz.x1 - rr(1, 4); part(G.dod, 0x5a5048, rr(3, 5), rr(4, 8), rr(3, 5), sx, 2, rr(mz.z0 + 4, mz.z1 - 2), scene, new THREE.MeshLambertMaterial({ color: 0x5a5048, flatShading: true })); }
  for (let z = mz.z0 + 2; z < mz.z1 - 2; z += 2) part(G.box, 0x6b4217, 3, 0.15, 0.4, 224, 0.08, z, scene);
  for (const sx of [-1.2, 1.2]) part(G.box, 0x8a8a92, 0.2, 0.2, mz.z1 - mz.z0 - 4, 224 + sx, 0.2, (mz.z0 + mz.z1) / 2, scene);
  for (let i = 0; i < 8; i++) { const x = i % 2 ? 200 : 248, z = 64 + i * 7.5; part(G.box, 0x3a2a1a, 0.3, 4, 0.3, x, 2, z, scene); part(G.box, 0xffb000, 0.6, 0.6, 0.6, x, 4.2, z, scene, new THREE.MeshBasicMaterial({ color: 0xffb000 })); }
  const pg = new THREE.Group(); pg.position.set(224, 0, 116); scene.add(pg);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.6, 8, 28), new THREE.MeshLambertMaterial({ color: 0x5a4a3a })); ring.position.y = 4.6; pg.add(ring);
  const swirl = new THREE.Mesh(new THREE.CircleGeometry(3.5, 28), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.75, side: THREE.DoubleSide })); swirl.position.y = 4.6; pg.add(swirl);
  raidPortal = { g: pg, swirl };
  effects.push({ persistent: true, update: (dt, t) => { swirl.rotation.z += dt * (S.raid && S.raid.active ? 6 : 1.2); swirl.material.color.set(S.raid && S.raid.active ? 0xff3030 : 0xff8a2a); } });
  addZonePad({ id: 'raid', name: 'MINE RAID', x: 224, z: 104, color: 0xff8a2a, stall: false });
  // Bank in Atlantis
  bankPad = addZonePad({ id: 'bank', name: 'BANK', x: 372, z: -28, color: 0xffd84a, roof: 0x2a6f8a });
  addZonePad({ id: 'weapons', name: 'SKY SHOP', x: 452, z: -14, color: 0x8fe0ff });
  addZonePad({ id: 'armor', name: 'FROST ARMOR', x: 690, z: -14, color: 0x5ab4ff });
  addZonePad({ id: 'teleport', name: 'TELEPORT', x: 430, z: 14, color: 0x4af0e0, stall: false });
  addZonePad({ id: 'teleport', name: 'TELEPORT', x: 590, z: 14, color: 0x4af0e0, stall: false });
  addZonePad({ id: 'pets', name: 'EGGS & PETS', x: -57, z: 14, color: 0xffd84a, roof: 0xff8a3d });
  addZonePad({ id: 'war', name: 'WAR', x: -57, z: -14, color: 0xe0353b, roof: 0x3a2a4a });
  addZonePad({ id: 'research', name: 'SCIENTIST', x: 206, z: 16, color: 0x39e6ff, roof: 0xffffff });
  { const sc = makeAvatar({ shirt: 0xffffff, pants: 0x2a2f55, hat: null }); sc.root.position.set(210, 0, 19.5); sc.root.rotation.y = -2.2; scene.add(sc.root); const nm = makeLabel('Scientist', '#ffffff', 'rgba(27,33,64,0.85)', 28); nm.position.set(210, 3, 19.5); scene.add(nm); }
  buildWarFlags(); buildCrabCave(); buildRubyGolem();
  addZonePad({ id: 'rebirth', name: 'REBIRTH', x: -40, z: 0, color: 0xffc83d, roof: 0xff8a3d });
  // shells
  const shellM = new THREE.MeshLambertMaterial({ color: 0xffb3a0, emissive: 0xff6a5a, emissiveIntensity: 0.3 });
  SHELLS.forEach(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, 0.4, z); scene.add(g);
    part(G.cone, 0, 0.6, 0.9, 0.6, 0, 0.4, 0, g, shellM).rotation.z = 0.6; part(G.sph, 0, 0.7, 0.4, 0.7, -0.2, 0.15, 0, g, shellM);
    SHELL_OBJS.push({ i, x, z, g });
  });
  effects.push({ persistent: true, update: (dt, t) => { for (const o of SHELL_OBJS) { o.g.visible = !S.shells[o.i]; o.g.rotation.y += dt; o.g.position.y = 0.4 + Math.sin(t * 2 + o.i) * 0.15; } } });
}

// ------------------------------------------------------- V5 SYSTEMS ---
// Barrack management: buy plots, delete barracks, train levels with gold
function buyPlot() {
  if (S.plots >= MAX_PLOTS) { toast('All 20 plots are owned', 'bad'); return; }
  if (!spend(plotPrice(S.plots))) return;
  S.plots++; refreshPlotSlabs();
  const p = PLOTS[S.plots - 1]; burst(new THREE.Vector3(p.x, 1, p.z), 0xffe066, 20);
  toast(`Plot ${S.plots} bought. Build a barrack on it from the Barracks pad`, 'good', 3500);
}
function refreshPlotSlabs() {
  for (const p of PLOTS) {
    const owned = p.i < S.plots;
    p.slab.material = mat(owned ? 0x9a8f7a : 0x6a4a4a);
    const text = owned ? `Plot ${p.i + 1}` : `Locked Plot`;
    if (p.plusText !== text) { scene.remove(p.plus); p.plus = makeLabel(text, '#ffffff', owned ? 'rgba(27,33,64,0.6)' : 'rgba(140,30,40,0.75)', 28); p.plus.position.set(p.x, 1.4, p.z); scene.add(p.plus); p.plusText = text; }
    p.plus.visible = !p.group;
  }
}
function deleteBarrack(b) {
  if (!b) return;
  if (S.barracks.length <= 1) { toast('You need at least one barrack', 'bad'); return; }
  const t = TROOPS[b.type];
  const refund = Math.round((t.bCost + b.troops * t.cost) * 0.5);
  for (const s of soldiers.filter((x) => x.barrack === b)) { burst(s.pos, t.shirt, 4); removeSoldier(s); }
  const p = PLOTS[b.plot];
  if (p.group) { scene.remove(p.group); p.group = null; }
  if (p.lbl) { scene.remove(p.lbl); p.lbl = null; p.lblText = ''; }
  S.barracks.splice(S.barracks.indexOf(b), 1);
  refreshPlotSlabs();
  addGold(refund); burst(new THREE.Vector3(p.x, 1, p.z), 0xff8a3d, 20); sfx('break');
  toast(`Deleted the ${t.name} barrack. Refunded ${fmt(refund)} gold`, 'gold', 3500);
}
function trainBarrack(b) {
  if (!b || b.level >= BARRACK_MAX_LV) return;
  if (!spend(levelPrice(b))) return;
  b.xp = 0; giveBarrackXp(b, bXpNeed(b.level) + 1);
}
// Bank: deposit gold and earn interest every minute
const BANK_RATE = 0.01, BANK_CAP = 100e9;
function bankDeposit(frac) { const n = Math.floor(S.gold * frac); if (n <= 0) return; S.gold -= n; S.bank += n; sfx('sell'); toast(`Deposited ${fmt(n)} gold`, 'good'); updateHud(); }
function bankWithdraw() { if (S.bank <= 0) return; const n = Math.floor(S.bank); S.bank = 0; addGold(n); S.earned -= n; sfx('sell'); toast(`Withdrew ${fmt(n)} gold`, 'gold'); }
function updateBank(dt) {
  if (S.bank <= 0) { S.bankT = 0; return; }
  S.bankT += dt;
  if (S.bankT >= 60) { S.bankT -= 60; const i = Math.floor(Math.min(S.bank, BANK_CAP) * BANK_RATE); S.bank += i; S.bankEarned += i; if (i > 0) toast(`Bank interest: +${fmt(i)} gold`, 'gold', 2500); }
}
// Playtime gifts
const giftsReady = () => GIFTS.filter((g, i) => !S.gifts[i] && S.time >= g.t).length;
function claimGift(i) { const g = GIFTS[i]; if (S.gifts[i] || S.time < g.t) return; S.gifts[i] = true; givePrize(g.give, `Gift (${g.label})`); sfx('level'); burst(player.pos, 0xffc83d, 20); }
// Shell Hunt
function updateShells() {
  for (const o of SHELL_OBJS) {
    if (S.shells[o.i]) continue;
    if (Math.hypot(player.pos.x - o.x, player.pos.z - o.z) < 2.4) {
      S.shells[o.i] = true; const n = Object.keys(S.shells).length;
      sfx('coin'); burst(o.g.position, 0xffb3a0, 14); popNumber(player.pos, 3, `Shell ${n}/${SHELLS.length}`, 'lvl');
      addRes('shell', 1, player.pos);
      if (SHELL_REWARDS[n]) givePrize(SHELL_REWARDS[n], `Shell Hunt ${n}/${SHELLS.length}`);
      else toast(`Shell found (${n}/${SHELLS.length}). Rewards at 5, 10, 15, 20 and 25`, 'good', 3000);
    }
  }
}
// Meteorites: a random event every few minutes
let meteorEnt = null, meteorNext = 200, meteorExpire = 0;
function meteorTier(zi) { let hp = 0, gold = 0; for (const d of Object.values(NODES)) if (d.zone === zi && d.res) hp = Math.max(hp, d.hp); for (const d of Object.values(ENEMIES)) if (d.zone === zi && !d.boss && !d.passive) gold = Math.max(gold, d.gold); return { hp: Math.max(200, hp * 8), gold: Math.max(80, gold * 25) }; }
function updateMeteor(dt) {
  if (S.mode !== 'play' || !meteorEnt) return;
  if (meteorEnt.alive && S.time > meteorExpire) { meteorEnt.alive = false; meteorEnt.mesh.visible = false; meteorEnt.bar.visible = false; toast('The meteorite cooled down and crumbled', ''); }
  if (S.time < meteorNext) return;
  meteorNext = S.time + rr(240, 360);
  if (meteorEnt.alive) return;
  const opts = ZONES.map((z, i) => i).filter((i) => !ZONES[i].annex && zoneUnlocked(i));
  const here = zoneAt(player.pos.x, player.pos.z);
  const zi = opts.includes(here) && rnd() < 0.6 ? here : opts[Math.floor(rnd() * opts.length)];
  const Z = ZONES[zi];
  let x, z, tries = 0;
  do { x = rr(Math.max(Z.x0 + 6, zi === 0 ? 24 : -1e9), Z.x1 - 6); z = rr(-36, 36); tries++; } while ((Math.abs(z) < 6 || entities.some((e) => e.alive && dist2(e.pos, { x, z }) < 25)) && tries < 40);
  const tier = meteorTier(zi);
  toast(`A meteorite is falling in ${Z.name}!`, 'gold', 5000); banner('Meteorite Incoming', `Find it in ${Z.name} before it cools down`);
  // falling fireball
  const ball = part(G.sph, 0xff6a2a, 2.4, 2.4, 2.4, x + 40, 70, z - 20, scene, new THREE.MeshBasicMaterial({ color: 0xff8a2a }));
  let t = 0;
  effects.push({ update: (dt2) => {
    t += dt2; const k = Math.min(1, t / 2.2);
    ball.position.set(x + 40 * (1 - k), 70 * (1 - k) + 1, z - 20 * (1 - k));
    if (rnd() < 0.7) burst(ball.position, 0xffb000, 2);
    if (k >= 1) {
      scene.remove(ball); shock(new THREE.Vector3(x, 0, z), 12); burst(new THREE.Vector3(x, 1, z), 0xff6a2a, 40); sfx('slam');
      Object.assign(meteorEnt, { alive: true, zone: zi, hp: tier.hp, maxHp: tier.hp, mGold: tier.gold, dying: 0 });
      meteorEnt.pos.set(x, 0, z); meteorEnt.home.set(x, 0, z); meteorEnt.mesh.visible = true;
      meteorEnt.model.body.scale.setScalar(meteorEnt.model.body.userData.s0 ?? meteorEnt.model.body.scale.x);
      meteorExpire = S.time + 180;
      for (const e of entities) if (e.alive && e.kind === 'enemy' && !e.def.boss && dist2(e.pos, meteorEnt.pos) < 64) damage(e, e.maxHp * 0.5, null);
      return true;
    }
  } });
}
function meteorBroken(e) {
  S.counts.meteor = (S.counts.meteor || 0) + 1;
  const g = Math.round(e.mGold * goldMult());
  spawnCoins(e.pos, g);
  toast(`Meteorite broken: +${fmt(g)} gold`, 'gold', 3500);
  if (rnd() < 0.08 * luckMult()) grantItem('meteor_sword', e.pos);
  if (rnd() < 0.3) addKey('ancient_fragment', 1, e.pos);
  splitBarrackXp(e.maxHp / 10);
}
// Mine Raid: wave defense in the Mine
const raidPool = [];
function raidAlive() { return raidPool.filter((e) => e.alive).length; }
function startRaid(lvl) {
  const L = RAID_LEVELS[lvl - 1];
  if (S.raid.active) return;
  if (soldiers.length < L.units) { toast(`Raid level ${lvl} needs ${L.units} units`, 'bad'); return; }
  if (S.time < S.raidCd) { toast(`The Mine is resting. Next raid in ${clock(S.raidCd - S.time)}`, 'bad'); return; }
  S.raid = { active: true, lvl, wave: 0, t: 0, end: 240, kills: 0 };
  banner(`Mine Raid · Level ${lvl}`, `Survive ${RAID_WAVES} waves in 4 minutes`); sfx('gate');
  closePanel(); nextRaidWave();
}
function nextRaidWave() {
  const R = S.raid; R.wave++;
  const mul = RAID_LEVELS[R.lvl - 1].mul;
  const want = { minebat: 2 + R.wave, minegolem: R.wave, minelord: R.wave === RAID_WAVES ? 1 : 0 };
  for (const [id, n] of Object.entries(want)) {
    let left = n;
    for (const e of raidPool) {
      if (!left) break;
      if (e.typeId !== id || e.alive) continue;
      left--;
      e.mul = mul; e.maxHp = e.def.hp * mul; e.hp = e.maxHp; e.alive = true; e.dying = 0; e.state = 'idle'; e.target = null; e.enraged = false; e.golden = false;
      e.pos.set(224 + rr(-3, 3), 0, 114 + rr(-2, 2)); e.home.set(224 + rr(-14, 14), 0, rr(80, 108)); e.mesh.visible = true;
      e.model.body.scale.setScalar(e.model.body.userData.s0 ?? e.model.body.scale.x);
      burst(e.pos, 0xff8a2a, 6);
    }
  }
  toast(`Wave ${R.wave}/${RAID_WAVES}${R.wave === RAID_WAVES ? ' · The Mine Lord appears!' : ''}`, R.wave === RAID_WAVES ? 'bad' : 'gold', 3000);
  shock(raidPortal.g.position, 8);
}
function endRaid(win) {
  const R = S.raid; R.active = false;
  for (const e of raidPool) if (e.alive) { e.alive = false; e.mesh.visible = false; e.bar.visible = false; burst(e.pos, 0x888888, 4); }
  S.raidCd = S.time + RAID_CD;
  if (win) {
    const mul = RAID_LEVELS[R.lvl - 1].mul, g = Math.round(15000 * mul * goldMult());
    addGold(g); S.raidBest = Math.max(S.raidBest || 0, R.lvl); S.raidsWon = (S.raidsWon || 0) + 1;
    banner('Raid Cleared', `Level ${R.lvl} · +${fmt(g)} gold`); sfx('bossdown');
    if (rnd() < 0.35) grantItem('miner_pick', player.pos);
    addKey('ancient_fragment', R.lvl, player.pos);
  } else { banner('Raid Failed', 'Gear up and try again'); sfx('down'); }
}
function updateRaid(dt) {
  const R = S.raid; if (!R.active) return;
  R.t += dt;
  const inMine = zoneAt(player.pos.x, player.pos.z) === 12;
  if (R.t > R.end || !inMine && R.t > 3) { if (!inMine) toast('You left the Mine. The raid ended', 'bad'); endRaid(false); return; }
  for (const e of raidPool) if (e.alive) e.home.set(clamp(player.pos.x, 198, 250), 0, clamp(player.pos.z, 60, 120));
  if (raidAlive() === 0) { if (R.wave >= RAID_WAVES) endRaid(true); else nextRaidWave(); }
}
// world map (big overlay)
function drawWorldMap(cv) {
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  const x0 = -90, x1 = 745, z0 = -50, z1 = 130;
  const sx = (x) => (x - x0) / (x1 - x0) * W, sz = (z) => (z1 - z) / (z1 - z0) * H;
  ctx.fillStyle = '#141a28'; ctx.fillRect(0, 0, W, H);
  ZONES.forEach((Z, i) => {
    const ok = zoneUnlocked(i);
    ctx.fillStyle = hex(new THREE.Color(Z.ground).multiplyScalar(ok ? 0.9 : 0.35).getHex());
    ctx.fillRect(sx(Z.x0), sz(Z.z1), sx(Z.x1) - sx(Z.x0), sz(Z.z0) - sz(Z.z1));
    ctx.fillStyle = ok ? '#ffffff' : '#9aa0b8'; ctx.font = `800 ${Math.max(10, W / 80)}px Nunito, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(Z.name, sx((Z.x0 + Z.x1) / 2), sz((Z.z0 + Z.z1) / 2));
  });
  for (const g of annexGateObjs) { ctx.fillStyle = g.open ? '#7a6a55' : '#ff4d4d'; ctx.fillRect(sx(g.x - 3.5), sz(57), sx(g.x + 3.5) - sx(g.x - 3.5), sz(44) - sz(57)); }
  for (const g of gateObjs) { ctx.fillStyle = g.open ? '#6d6d75' : '#ff4d4d'; ctx.fillRect(sx(g.x) - 2, sz(44), 4, sz(-44) - sz(44)); }
  for (const e of entities) if (e.alive && e.def.boss) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(sx(e.pos.x), sz(e.pos.z), 5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke(); }
  if (meteorEnt && meteorEnt.alive) { ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(sx(meteorEnt.pos.x), sz(meteorEnt.pos.z), 7, 0, 7); ctx.fill(); }
  for (const o of SHELL_OBJS) if (!S.shells[o.i] && S.shellRadar) { ctx.fillStyle = '#ffb3a0'; ctx.fillRect(sx(o.x) - 2, sz(o.z) - 2, 4, 4); }
  for (const p of PADS) { ctx.fillStyle = hex(p.color); ctx.fillRect(sx(p.x) - 2, sz(p.z) - 2, 4, 4); }
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1b2140'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx(player.pos.x), sz(player.pos.z), 7, 0, 7); ctx.fill(); ctx.stroke();
}
// distance culling for far-away entities
let cullT = 0;
function cullEntities(dt) {
  cullT -= dt; if (cullT > 0) return; cullT = 0.3;
  for (const e of entities) {
    const far = dist2(e.pos, player.pos) > 125 * 125 && e.state !== 'chase';
    if (far && !e.culled) { e.culled = true; e.mesh.visible = false; }
    else if (!far && e.culled) { e.culled = false; e.mesh.visible = e.alive || e.dying > 0; }
  }
}
function applySettings() {
  if (master) master.gain.value = S.sound ? 0.5 * S.sfxVol : 0;
  if (musicGain) {
    const volume = S.sound && S.musicOn ? 0.42 * S.musicVol : 0;
    musicGain.gain.setTargetAtTime(volume, actx.currentTime, 0.08);
  }
  renderer.shadowMap.enabled = S.shadows; sun.castShadow = S.shadows;
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  fxLayer.style.display = S.dmgNums ? '' : 'none';
  $('btnSound').textContent = 'Settings';
}

// ------------------------------------------------------- V6 SYSTEMS ---
function zoneStats(zi) {
  let hp = 0, dmg = 0, gold = 0, bhp = 0;
  for (const d of Object.values(ENEMIES)) if (d.zone === zi && !d.passive && !d.event && !d.war && !d.raid) { if (d.boss) bhp = Math.max(bhp, d.hp); else { hp = Math.max(hp, d.hp); dmg = Math.max(dmg, d.dmg); gold = Math.max(gold, d.gold); } }
  return { hp: hp || 25, dmg: dmg || 3, gold: gold || 8, bhp: bhp || hp * 10 };
}
function activateEnemy(e, x, z, hpMul, dmul, gmul) {
  Object.assign(e, { alive: true, dying: 0, state: 'idle', target: null, enraged: false, golden: false, charm: 0, mul: gmul, dmul, culled: false });
  e.maxHp = Math.max(1, e.def.hp * hpMul); e.hp = e.maxHp;
  e.pos.set(x, 0, z); e.home.set(x, 0, z); e.mesh.visible = true; e.respawnAt = Infinity;
  e.zone = zoneAt(x, z);
  e.model.body.scale.setScalar(e.model.body.userData.s0 ?? e.model.body.scale.x);
}
// ---- Pets
const petObjs = [];
function petBonus(key) {
  let total = 0;

  for (const uid of S.petEq) {
    const pet = S.pets.find((p) => p.uid === uid);
    const definition = pet && PET_BY_ID[pet.id];

    if (definition) {
      total += (definition.bonus[key] || 0) * PET_TIERS[petTier(pet)].multiplier;
    }
  }

  return total;
}

function petBonusText(bonus, tier = 0) {
  const multiplier = PET_TIERS[tier]?.multiplier || 1;

  return Object.entries(bonus)
    .map(([key, value]) => {
      const label = key === 'dmg' ? 'damage' : key === 'hp' ? 'health' : key;
      return `+${Math.round(value * multiplier * 100)}% ${label}`;
    })
    .join(' · ');
}

function petScore(id, tier = 0) {
  const pet = PET_BY_ID[id];
  if (!pet) return 0;

  const bonus = pet.bonus;
  const multiplier = PET_TIERS[petTier({ tier })].multiplier;

  return (
    ((bonus.dmg || 0) * 1.2 +
      (bonus.hp || 0) +
      (bonus.gold || 0) * 0.9 +
      (bonus.luck || 0) * 0.8) *
    multiplier
  );
}

function equipBestPets(silent = false) {
  const sorted = [...S.pets].sort(
    (a, b) => petScore(b.id, b.tier) - petScore(a.id, a.tier)
  );

  S.petEq = sorted.slice(0, 3).map((pet) => pet.uid);
  refreshPets();

  if (!silent) toast('Equipped your 3 best pets', 'good');
}

function makePetModel(pd) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const egg = pd.egg;
  part(G.box, pd.color, 0.8, 0.7, 0.9, 0, 0.5, 0, body);
  const head = part(G.box, pd.color, 0.7, 0.65, 0.65, 0, 1.05, 0.3, body);
  for (const ex of [-0.17, 0.17]) part(G.box, 0x1b1b1b, 0.12, 0.14, 0.05, ex, 1.12, 0.64, body);
  if (['golden', 'carrot', 'emerald'].includes(egg)) for (const ex of [-0.2, 0.2]) part(G.box, pd.color, 0.15, 0.45, 0.12, ex, 1.55, 0.25, body);
  if (['sapphire', 'worldeater'].includes(egg)) part(G.box, pd.color, 0.15, 0.4, 0.5, 0, 0.95, -0.4, body);
  if (pd.rar === 'legendary' || pd.rar === 'epic') { const h = part(G.oct, 0, 0.18, 0.25, 0.18, 0, 1.7, 0.3, body, new THREE.MeshBasicMaterial({ color: pd.rar === 'legendary' ? 0xffc83d : 0xb36bff })); h.castShadow = false; }
root.scale.setScalar(
  (pd.rar === 'legendary' ? 1.3 : pd.rar === 'epic' ? 1.15 : 1) *
  PET_TIERS[petTier(pd)].scale
);
  return root;
}
function refreshPets() {
  for (const o of petObjs) scene.remove(o.mesh);
  petObjs.length = 0;
  S.petEq = S.petEq.filter((uid) => S.pets.some((p) => p.uid === uid)).slice(0, 3);
  S.petEq.forEach((uid, i) => {
    const p = S.pets.find((q) => q.uid === uid); const pd = PET_BY_ID[p.id];
    const mesh = makePetModel({ ...pd, tier: petTier(p) });
mesh.position.set(player.pos.x, 0, player.pos.z); scene.add(mesh);
    petObjs.push({ mesh, i, pd });
  });
  refreshSoldierStats();
}
function updatePets(dt) {
  const yaw = player.mesh.rotation.y;
  for (const o of petObjs) {
    const a = yaw + Math.PI + (o.i - 1) * 0.8, r = 2.6;
    const tx = player.pos.x + Math.sin(a) * r, tz = player.pos.z + Math.cos(a) * r;
    o.mesh.position.x += (tx - o.mesh.position.x) * Math.min(1, dt * 5);
    o.mesh.position.z += (tz - o.mesh.position.z) * Math.min(1, dt * 5);
    o.mesh.position.y = 0.6 + Math.abs(Math.sin(S.time * 5 + o.i)) * 0.35;
    o.mesh.rotation.y = yaw;
    if (o.pd.rar === 'legendary' && rnd() < dt * 4) burst(o.mesh.position, 0xffc83d, 1);
  }
}
function hatchEgg(eggId, n = 1) {
  const egg = EGGS.find((e) => e.id === eggId);
  if (!zoneUnlocked(egg.zone)) { toast(`Unlock ${ZONES[egg.zone].name} first`, 'bad'); return; }
  if (S.pets.length + n > MAX_PETS) { toast(`Pet inventory full (${MAX_PETS}). Delete some pets`, 'bad'); return; }
  if (!spend(egg.cost * n)) return;
  const got = [];
  for (let i = 0; i < n; i++) {
    const lk = Math.sqrt(luckMult() * (S.potions.luck > 0 ? 2 : 1));
    const ws = Object.entries(RARITY).map(([k, r]) => [k, k === 'common' ? r.w : r.w * lk]);
    let roll = rnd() * ws.reduce((a, w) => a + w[1], 0), rar = 'common';
    for (const [k, w] of ws) { roll -= w; if (roll < 0) { rar = k; break; } }
    const opts = egg.pets.filter((p) => p[2] === rar);
    const pid = opts[Math.floor(rnd() * opts.length)][0];
    S.pets.push({ uid: S.petUid++, id: pid }); got.push(pid);
  }
  S.hatched[eggId] = (S.hatched[eggId] || 0) + n; S.hatchCount = (S.hatchCount || 0) + n;
  showHatch(egg, got);
  if (S.petEq.length < 3) { equipBestPets(true); }
}

function showHatch(egg, got) {
  const ov = $('overlay');
  const best = got.reduce((a, b) => (Object.keys(RARITY).indexOf(PET_BY_ID[b].rar) > Object.keys(RARITY).indexOf(PET_BY_ID[a].rar) ? b : a));
  ov.innerHTML = `<div class="hatch"><div class="egg" style="--c:${hex(egg.color)}"></div><div class="hres hidden">${got.map((id) => { const p = PET_BY_ID[id], r = RARITY[p.rar]; return `<div class="pcard" style="--c:${r.color}"><div class="psw" style="background:${hex(p.color)}"></div><b>${p.name}</b><span>${r.name}</span><small>${petBonusText(p.bonus)}</small></div>`; }).join('')}</div><button class="buy hidden" id="hatchOk">Nice</button></div>`;
  ov.classList.remove('hidden');
  sfx('pickup');
  setTimeout(() => { sfx('break'); }, 700);
  setTimeout(() => {
    ov.querySelector('.egg').classList.add('crack'); ov.querySelector('.hres').classList.remove('hidden'); ov.querySelector('#hatchOk').classList.remove('hidden');
    const r = PET_BY_ID[best].rar; sfx(r === 'legendary' || r === 'epic' ? 'bossdown' : 'level');
    if (r === 'legendary') banner('LEGENDARY PET', PET_BY_ID[best].name);
    ov.querySelector('#hatchOk').onclick = () => { ov.classList.add('hidden'); ov.innerHTML = ''; };
  }, 1100);
}
function deletePet(uid) { const i = S.pets.findIndex((p) => p.uid === uid); if (i < 0) return; S.pets.splice(i, 1); S.petEq = S.petEq.filter((u) => u !== uid); refreshPets(); addGold(100); }
function fusePets(id, tier) {
  tier = Math.max(0, Math.min(PET_TIERS.length - 1, Math.floor(Number(tier) || 0)));

  if (tier >= PET_TIERS.length - 1) {
    toast('Colossal pets cannot be fused further', 'bad');
    return false;
  }

  const matching = S.pets.filter(
    (pet) => pet.id === id && petTier(pet) === tier
  );

  if (matching.length < 3) {
    toast(`You need 3 ${tier ? `${petTierName(tier)} ` : ''}matching pets to fuse`, 'bad');
    return false;
  }

  const consumed = matching.slice(0, 3);
  const consumedIds = new Set(consumed.map((pet) => pet.uid));

  // Preserve an equipped slot if any of the pets being fused was equipped.
  const firstEquippedIndex = S.petEq.findIndex((uid) => consumedIds.has(uid));
  const insertAt = firstEquippedIndex < 0
    ? -1
    : S.petEq.slice(0, firstEquippedIndex).filter((uid) => !consumedIds.has(uid)).length;

  S.pets = S.pets.filter((pet) => !consumedIds.has(pet.uid));

  const fusedPet = {
    uid: S.petUid++,
    id,
    tier: tier + 1,
  };

  S.pets.push(fusedPet);

  S.petEq = S.petEq.filter((uid) => !consumedIds.has(uid));
  if (insertAt >= 0) {
    S.petEq.splice(Math.min(insertAt, S.petEq.length), 0, fusedPet.uid);
  }

  refreshPets();

  const name = PET_BY_ID[id].name;
  toast(`${name} fused into a ${petTierName(fusedPet.tier)} ${name}!`, 'gold', 4000);
  sfx('level');
  return true;
}

function deleteCommons() {
  const keep = new Set(S.petEq);
  const before = S.pets.length;

  S.pets = S.pets.filter((pet) =>
    keep.has(pet.uid) ||
    PET_BY_ID[pet.id].rar !== 'common' ||
    petTier(pet) > 0
  );

  const deleted = before - S.pets.length;
  refreshPets();
  toast(`Deleted ${deleted} unequipped normal common pets`, '');
}

// ---- Research
function buyResearch(id, free) {
  const r = RESEARCH.find((x) => x.id === id), lv = S.research[id] || 0;
  if (lv >= r.max) return;
  if (free) { if ((S.items.alien_core || 0) < 1) return; S.items.alien_core--; } else if (!spend(researchCost(r))) return;
  S.research[id] = lv + 1; sfx('level'); toast(`${r.name} is now level ${lv + 1}`, 'good');
  refreshSoldierStats();
}
// ---- Badges
function badgeList() {
  return BADGES.concat(BADGE_BOSSES.filter((id) => ENEMIES[id]).map((id) => ({ id: 'd_' + id, name: `Defeat ${ENEMIES[id].name}`, how: `Defeat ${ENEMIES[id].name}`, ok: () => S.bossesDown[id] || (S.counts[id] || 0) > 0 })));
}
let badgeT = 0;
function checkBadges(dt) {
  badgeT -= dt; if (badgeT > 0) return; badgeT = 1;
  for (const b of badgeList()) if (!S.badges[b.id] && b.ok()) {
    S.badges[b.id] = true;
    if (S.mode === 'play') { toast(`Badge awarded: ${b.name}`, 'badge', 4000); musicStinger('badge'); }
  }
}
// ---- Skill block & energy blast
const hasWizards = () => S.barracks.some((b) => TROOPS[b.type].id === 'wizard' || TROOPS[b.type].id === 'frostmage');
function maybeSkillBlock(boss) {
  if (!boss || !boss.enraged || S.fx.block > 0 || rnd() > 0.012) return;
  if (hasWizards()) { if (!maybeSkillBlock.told) { toast(`${boss.def.name} tried to Skill BLOCK you. Your Wizards protected the army`, 'good', 3500); maybeSkillBlock.told = true; } return; }
  S.fx.block = 8; toast(`${boss.def.name} used Skill BLOCK! Skills are blocked for 8s. Wizards protect against this`, 'bad', 4000); shock(boss.pos, 10);
}
function energyBlast() {
  const al = soldiers.filter((s) => s.alive && !s.def.healer);
  const avg = al.length ? al.reduce((a, s) => { const [x, y] = troopDmgRange(s.barrack); return a + (x + y) / 2; }, 0) / al.length : 10;
  let n = 0;
  for (const e of entities) if (e.alive && e.kind === 'enemy' && !e.def.passive && dist2(e.pos, player.pos) < 16 * 16) { damage(e, avg * 25 * (1 + petBonus('dmg') + resV('dmg')), null); burst(e.pos, 0x39e6ff, 8); n++; }
  shock(player.pos, 16); popNumber(player.pos, 3.4, `${n} blasted`, 'lvl'); sfx('zap');
}
// ---- UFO world event
let ufoEnt = null, ufoNext = 420, ufoExpire = 0;
const alienPool = [];
function updateUfo(dt) {
  if (S.mode !== 'play' || !ufoEnt) return;
  if (ufoEnt.alive && S.time > ufoExpire) { ufoEnt.alive = false; ufoEnt.mesh.visible = false; ufoEnt.bar.visible = false; for (const a of alienPool) if (a.alive) { a.alive = false; a.mesh.visible = false; a.bar.visible = false; } toast('The UFO flew away', ''); }
  if (S.time < ufoNext) return;
  ufoNext = S.time + rr(360, 540);
  if (ufoEnt.alive || !zoneUnlocked(2)) return;
  const opts = ZONES.map((z, i) => i).filter((i) => !ZONES[i].annex && zoneUnlocked(i));
  const here = zoneAt(player.pos.x, player.pos.z);
  const zi = opts.includes(here) && rnd() < 0.6 ? here : opts[Math.floor(rnd() * opts.length)];
  const Z = ZONES[zi], st = zoneStats(zi);
  const x = rr(Math.max(Z.x0 + 10, zi === 0 ? 30 : -1e9), Z.x1 - 10), z = rr(-30, 30) || 12;
  activateEnemy(ufoEnt, x, z, st.bhp * 0.35 / ufoEnt.def.hp, st.dmg * 2.5 / ufoEnt.def.dmg, st.gold * 80 / ufoEnt.def.gold);
  alienPool.forEach((a, i) => activateEnemy(a, x + Math.cos(i * 1.6) * 6, z + Math.sin(i * 1.6) * 6, st.hp * 2 / a.def.hp, st.dmg * 1.2 / a.def.dmg, st.gold * 3 / a.def.gold));
  ufoExpire = S.time + 240;
  banner('UFO Invasion', `Rogue Aliens landed in ${Z.name}`); toast(`A UFO is attacking ${Z.name}! Defeat it for an Alien Core`, 'gold', 5000); sfx('zap');
  shock(ufoEnt.pos, 12);
}
// ---- War
const flagObjs = [];
const guardPool = [];
function buildWarFlags() {
  WAR_FLAGS.forEach(([x, z, zi], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    part(G.cyl, 0x8a8a92, 0.3, 9, 0.3, 0, 4.5, 0, g); part(G.box, 0x6d6d75, 2.4, 0.5, 2.4, 0, 0.25, 0, g);
    const clothM = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const cloth = part(G.box, 0, 0.08, 1.8, 2.8, 0, 7.8, 1.5, g, clothM);
    const ring = new THREE.Mesh(new THREE.RingGeometry(8.6, 9, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
    const fill = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    fill.rotation.x = -Math.PI / 2; fill.position.y = 0.05; g.add(fill);
    const lbl = makeLabel('WAR FLAG', '#ffffff', 'rgba(27,33,64,0.85)', 28); lbl.position.set(0, 10, 0); g.add(lbl);
    flagObjs.push({ i, x, z, zi, g, cloth, ring, fill, lbl, lblText: '', prog: 0, guarded: false });
  });
}
function refreshFlags() {
  for (const f of flagObjs) {
    const own = S.war.flags[f.i], fc = own >= 0 ? FACTIONS[own] : null;
    f.cloth.material.color.set(fc ? fc.color : 0xffffff); f.fill.material.color.set(fc ? fc.color : 0xffffff);
    const t = fc ? fc.name + (own === S.war.side ? ' (YOU)' : '') : 'Unclaimed';
    if (f.lblText !== t) { f.g.remove(f.lbl); f.lbl = makeLabel(t, '#ffffff', fc ? fc.css : 'rgba(27,33,64,0.85)', 28); f.lbl.position.set(0, 10, 0); f.g.add(f.lbl); f.lblText = t; }
  }
}
function joinFaction(i) {
  if (S.war.side === i) return;
  if (S.war.side !== null) for (let k = 0; k < S.war.flags.length; k++) if (S.war.flags[k] === S.war.side) S.war.flags[k] = (S.war.side + 1) % 3;
  S.war.side = i; refreshFlags(); sfx('gate');
  banner(`You joined ${FACTIONS[i].name}`, 'Capture war flags in every area for gold');
}
function warIncome() {
  let g = 0; WAR_FLAGS.forEach(([, , zi], i) => { if (S.war.flags[i] === S.war.side) g += zoneStats(zi).gold * 6; });
  return g;
}
let warT = 0;
function updateWar(dt) {
  if (S.mode !== 'play') return;
  for (const f of flagObjs) { f.cloth.rotation.y = Math.sin(S.time * 3 + f.i) * 0.2; f.ring.material.opacity = 0.25 + Math.sin(S.time * 4) * 0.1; }
  if (S.war.side === null) return;
  warT += dt;
  if (warT >= 60) {
    warT = 0;
    const inc = Math.round(warIncome() * goldMult());
    if (inc > 0) { addGold(inc); toast(`War income from your flags: +${fmt(inc)} gold`, 'gold', 3000); }
    S.war.flags.forEach((o, i) => { if (o >= 0) S.war.pts[o] += 1 + i; });
    // enemy factions attack your flags
    const mine = flagObjs.filter((f) => S.war.flags[f.i] === S.war.side && dist2(f, player.pos) > 40 * 40);
    if (mine.length && rnd() < 0.35) { const f = mine[Math.floor(rnd() * mine.length)]; const by = [0, 1, 2].filter((k) => k !== S.war.side)[Math.floor(rnd() * 2)]; S.war.flags[f.i] = by; refreshFlags(); toast(`${FACTIONS[by].name} captured your flag in ${ZONES[f.zi].name}!`, 'bad', 4000); }
  }
  for (const f of flagObjs) {
    const near = dist2(f, player.pos) < 9 * 9;
    if (!near || S.war.flags[f.i] === S.war.side || !zoneUnlocked(f.zi)) { if (!near) { f.prog = Math.max(0, f.prog - dt * 0.2); if (f.guarded && dist2(f, player.pos) > 60 * 60) { for (const e of guardPool) if (e.alive && e.flag === f.i) { e.alive = false; e.mesh.visible = false; e.bar.visible = false; } f.guarded = false; } } continue; }
    const owner = S.war.flags[f.i];
    if (owner >= 0 && !f.guarded) {
      f.guarded = true; const st = zoneStats(f.zi);
      let n = 0;
      for (const e of guardPool) { if (e.alive || n >= 3) continue; activateEnemy(e, f.x + Math.cos(n * 2.1) * 4, f.z + Math.sin(n * 2.1) * 4, st.hp * 2.5 / e.def.hp, st.dmg * 1.3 / e.def.dmg, st.gold * 4 / e.def.gold); e.flag = f.i; if (!e.shirts) { e.shirts = []; e.model.root.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHex() === 0x9f7bff) e.shirts.push(o); }); } for (const o of e.shirts) o.material = mat(FACTIONS[owner].color); n++; }
      toast(`${FACTIONS[owner].name} guards are defending this flag`, 'bad', 2500);
    }
    if (guardPool.some((e) => e.alive && e.flag === f.i)) continue;
    f.prog += dt / 8;
    if (S.time % 0.5 < dt) popNumber(new THREE.Vector3(f.x, 0, f.z), 9, `Capturing ${Math.min(100, Math.round(f.prog * 100))}%`, 'lvl');
    if (f.prog >= 1) {
      f.prog = 0; f.guarded = false; S.war.flags[f.i] = S.war.side; S.war.caps++; S.war.pts[S.war.side] += 10;
      const g = Math.round(zoneStats(f.zi).gold * 40 * goldMult()); addGold(g);
      refreshFlags(); banner('Flag Captured', `${ZONES[f.zi].name} · +${fmt(g)} gold`); musicStinger('victory'); burst(new THREE.Vector3(f.x, 4, f.z), FACTIONS[S.war.side].color, 30);
    }
  }
}

// ---------------------------------------------------------- PERF: FREEZE STATIC WORLD ---
let frozenStats = null;
function freezeStatic() {
  const t0 = performance.now();
  const keep = new Set();
  const addDeep = (o) => { if (o && o.isObject3D) o.traverse((c) => keep.add(c)); };
  const fromList = (arr) => { for (const it of arr) { if (!it) continue; if (it.isObject3D) addDeep(it); else for (const v of Object.values(it)) { if (v && v.isObject3D) addDeep(v); else if (v && v.root && v.root.isObject3D) addDeep(v.root); } } };
  [gateObjs, annexGateObjs, PADS, PLOTS, npcObjs, flagObjs, DISP_OBJS, SHELL_OBJS].forEach(fromList);
  if (raidPortal) addDeep(raidPortal.g);
  for (const e of entities) addDeep(e.mesh); for (const s of soldiers) addDeep(s.mesh);
  addDeep(player.mesh); addDeep(targetRing); addDeep(moveMarker);
  scene.updateMatrixWorld(true);
  // detect effect-driven animation by dry-running every persistent effect
  const cand = [];
  scene.traverse((o) => { if (!keep.has(o) && o !== scene) cand.push(o); });
  const snap = (o) => [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.y, o.rotation.z, o.scale.x, o.scale.y, o.scale.z, o.visible].join(',');
  const before = cand.map(snap);
  const st = S.time;
  for (const fx of effects) if (fx.persistent) { try { fx.update(0.37, 1.3); fx.update(0.21, 2.7); } catch (e) {} }
  S.time = st;
  cand.forEach((o, i) => { if (snap(o) !== before[i]) { let p = o; addDeep(o); while (p && p !== scene) { keep.add(p); p = p.parent; } } });
  // a parent of a kept object must keep its own transform live too
  for (const o of [...keep]) { let p = o.parent; while (p && p !== scene && !keep.has(p)) { keep.add(p); p = p.parent; } }
  scene.updateMatrixWorld(true);
  const groups = new Map(); let merged = 0;
  scene.traverse((o) => {
    if (keep.has(o) || !o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !o.visible) return;
    const m = o.material; if (m.transparent || m.map) return;
    let vis = true, p = o.parent; while (p) { if (!p.visible) vis = false; p = p.parent; } if (!vis) return;
    const g = o.geometry; if (!g.attributes.position || !g.attributes.normal) return;
    const bin = Math.floor(o.matrixWorld.elements[12] / 48) + ':' + Math.floor(o.matrixWorld.elements[14] / 60);
    const key = m.uuid + '|' + bin + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0);
    if (!groups.has(key)) groups.set(key, { m, cast: o.castShadow, recv: o.receiveShadow, list: [] });
    groups.get(key).list.push(o);
  });
  const normalMat = new THREE.Matrix3();
  for (const gr of groups.values()) {
    if (gr.list.length < 2) continue;
    let n = 0; const parts = [];
    for (const o of gr.list) { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; parts.push([o, g]); n += g.attributes.position.count; }
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let off = 0;
    const v = new THREE.Vector3();
    for (const [o, g] of parts) {
      const pa = g.attributes.position, na = g.attributes.normal; normalMat.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); pos[off * 3] = v.x; pos[off * 3 + 1] = v.y; pos[off * 3 + 2] = v.z;
        v.fromBufferAttribute(na, i).applyMatrix3(normalMat).normalize(); nor[off * 3] = v.x; nor[off * 3 + 1] = v.y; nor[off * 3 + 2] = v.z; off++;
      }
      o.parent.remove(o); merged++;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.computeBoundingSphere(); geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo, gr.m); mesh.castShadow = gr.cast; mesh.receiveShadow = gr.recv; mesh.matrixAutoUpdate = false; mesh.updateMatrix(); mesh.userData.frozen = true;
    scene.add(mesh);
  }
  // anything static left (sprites, singles, empty groups) stops recomputing its matrix every frame
  let still = 0;
  scene.traverse((o) => { if (o !== scene && !keep.has(o) && !o.userData.frozen) { o.updateMatrix(); o.matrixAutoUpdate = false; still++; } });
  scene.updateMatrixWorld(true);
  frozenStats = { merged, groups: groups.size, still, ms: Math.round(performance.now() - t0) };
}
// adaptive resolution: drop render scale when the frame rate stays low
const perf = { acc: 0, frames: 0, scale: Math.min(window.devicePixelRatio, 1.25) };
renderer.setPixelRatio(perf.scale);
function perfTick(rdt) {
  perf.acc += Math.min(rdt, 0.1); perf.frames++;
  if (perf.acc < 1.5) return;
  const fps = perf.frames / perf.acc; perf.acc = 0; perf.frames = 0; perf.fps = fps;
  const min = 0.65, max = Math.min(window.devicePixelRatio, 1.25);
  if (fps < 42 && perf.scale > min) { perf.scale = Math.max(min, perf.scale - 0.2); renderer.setPixelRatio(perf.scale); }
  else if (fps > 55 && perf.scale < max) { perf.scale = Math.min(max, perf.scale + 0.1); renderer.setPixelRatio(perf.scale); }
}

// ------------------------------------------------------- V7 SYSTEMS ---
function rubyProgress() {
  const q = RUBY_QUESTS[S.ruby.lvl]; if (!q) return [1, 1];
  switch (q.t) {
    case 'kills': return [Math.max(0, S.kills - S.ruby.base), q.n];
    case 'earn': return [Math.max(0, S.earned - S.ruby.base), q.n];
    case 'units': return [soldiers.length, q.n];
    case 'boss': return [S.bossesDown[q.id] ? 1 : 0, 1];
    case 'hatch': return [S.hatchCount || 0, q.n];
    case 'research': return [Object.values(S.research).reduce((a, b) => a + b, 0), q.n];
    case 'caps': return [S.war.caps, q.n];
  }
  return [0, 1];
}
const rubyReward = (lvl) => Math.round(8000 * Math.pow(3.2, lvl));
function rubyAct() {
  const q = RUBY_QUESTS[S.ruby.lvl]; if (!q) return;
  if (!S.ruby.on) { S.ruby.on = true; S.ruby.base = q.t === 'earn' ? S.earned : S.kills; toast(`Ruby Golem quest: ${q.text}`, 'good', 3500); sfx('level'); return; }
  const [p, n] = rubyProgress(); if (p < n) return;
  const g = rubyReward(S.ruby.lvl); addGold(g); S.ruby.lvl++; S.ruby.on = false;
  banner('Quest Complete', `Ruby Golem paid ${fmt(g)} gold`); musicStinger('victory'); refreshTitle && refreshTitle();
}
function buildCrabCave() {
  const Z = ZONES[13];
  const rock = new THREE.MeshLambertMaterial({ color: 0x4a4658, flatShading: true });
  for (let i = 0; i < 26; i++) { const h = rr(4, 11); const x = rnd() < 0.5 ? Z.x0 + rr(1, 6) : Z.x1 - rr(1, 6); const m = new THREE.Mesh(new THREE.ConeGeometry(rr(1.5, 3), h, 6), rock); m.position.set(x, h / 2, rr(Z.z0 + 4, Z.z1 - 2)); m.castShadow = true; scene.add(m); }
  for (let i = 0; i < 10; i++) { const x = rr(Z.x0 + 10, Z.x1 - 10), z = rr(Z.z0 + 14, Z.z1 - 4); if (Math.abs(x - 540) < 6) continue; const h = rr(2, 4); const m = new THREE.Mesh(new THREE.ConeGeometry(rr(0.6, 1.2), h, 5), rock); m.position.set(x, h / 2, z); scene.add(m); }
  const cm = new THREE.MeshLambertMaterial({ color: 0x5ad8ff, emissive: 0x2a9ac8, emissiveIntensity: 0.8 });
  for (let i = 0; i < 18; i++) { const x = rnd() < 0.5 ? Z.x0 + rr(2, 8) : Z.x1 - rr(2, 8); const c = part(G.oct, 0, rr(0.5, 1), rr(1.4, 2.6), rr(0.5, 1), x, 1, rr(Z.z0 + 5, Z.z1 - 3), scene, cm); c.rotation.z = rr(-0.4, 0.4); }
  const wm = new THREE.MeshLambertMaterial({ color: 0x2a6a9a, emissive: 0x103a5a, emissiveIntensity: 0.6 });
  for (const [x, z, r] of [[522, 90, 5], [560, 70, 4], [556, 104, 4.5]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 20), wm); p.position.set(x, 0.05, z); scene.add(p); }
  // the wrecked crab throne
  part(G.box, 0x6a4a3a, 14, 1, 8, 540, 0.5, 117, scene); part(G.box, 0x8a6a4a, 4, 6, 1.2, 540, 3, 120.5, scene);
  const lbl = makeLabel('KING CRAB LAIR', '#ffffff', 'rgba(140,30,30,0.85)', 30); lbl.position.set(540, 8, 120); scene.add(lbl);
}
function buildRubyGolem() {
  addZonePad({ id: 'ruby', name: 'RUBY GOLEM', x: -74, z: 0, color: 0xe0353b, roof: 0x7a1a1a });
  const av = makeAvatar({ shirt: 0xc8202a, pants: 0x8a1018, skin: 0xe0353b, scale: 1.8, eyes: 0xffe066, armor: true });
  av.root.position.set(-78, 0, 3.5); av.root.rotation.y = Math.PI / 2; scene.add(av.root);
  const nm = makeLabel('Ruby Golem', '#ffffff', 'rgba(140,20,30,0.9)', 28); nm.position.set(-78, 4.8, 3.5); scene.add(nm);
}
// song picker
const SONG_NAMES = { base: 'Home Base', baseremix: 'Home Base (Remix)', forest: 'Forest Path · Anthem', river: 'Riverlands · Current Run', mountain: 'Mountains · Warpath', desert: 'Desert · Sunstrike', atlantis: 'Atlantis · Deep Current', mushroom: 'Mushroom · Bounce', ouroboros: 'Ouroboros · Coil', magic: 'Magic Forest · Spellbound', sky: 'Sky Lands · Updraft', soul: 'Lost Souls · Haunt', jungle: 'Jungle · Stampede', arctic: 'Arctic · Whiteout', mine: 'Mine · Redline', cave: 'Crab Cave · Undertow', boss: 'Boss Battle' };
Object.assign(SONG_NAMES, { volcano: 'Volcano · Eruption', alien: 'Alien Realm · Signal', deep: 'Deep Forest · Ancient', shocked: 'Shocked Forest · Thunder Run', uran: 'Uranian Citadel · Protocol', celestial: 'Celestial Frontier · Starfall' });
let shuffleT = 0;
function pickMusicTheme(autoName, dt) {
  const p = S.musicPick || 'auto';
  if (p === 'auto') return autoName;
  if (p === 'shuffle') { shuffleT -= dt; if (shuffleT <= 0 || !pickMusicTheme.cur) { const k = Object.keys(THEMES).filter((x) => x !== pickMusicTheme.cur); pickMusicTheme.cur = k[Math.floor(rnd() * k.length)]; shuffleT = 150; } return pickMusicTheme.cur; }
  return THEMES[p] ? p : autoName;
}

// ---------------------------------------------------- V10: LEGACY SYSTEM ---
const LEGACY_UPGRADES = [
  { id:'command', name:'Command Training', desc:'+4% troop damage per level', max:10, cost:(l)=>1+l },
  { id:'quartermaster', name:'Quartermaster', desc:'+5% bag capacity per level', max:10, cost:(l)=>1+l },
  { id:'war_chest', name:'War Chest', desc:'+3% gold from all sources per level', max:10, cost:(l)=>1+l },
  { id:'scout', name:"Scout's Eye", desc:'+2% luck and +1.5% material yield per level', max:10, cost:(l)=>1+l },
  { id:'logistics', name:'Fast Logistics', desc:'+2.5% troop movement speed per level', max:10, cost:(l)=>1+l },
];
const LEGACY_MILESTONES = [
  { id:'first_barrack', text:'Build your first barrack', test:()=>S.barracks.length>=1, reward:1 },
  { id:'first_sell', text:'Refine your first load', test:()=> (S.resourcesSold||0)>=1, reward:1 },
  { id:'five_units', text:'Reach 5 units', test:()=>soldiers.length>=5, reward:2 },
  { id:'first_zone', text:'Unlock your first new area', test:()=>maxZoneReached()>=1, reward:3 },
  { id:'ten_units', text:'Reach 10 units', test:()=>soldiers.length>=10, reward:3 },
  { id:'fifty_kills', text:'Defeat 50 enemies', test:()=>S.kills>=50, reward:3 },
  { id:'twentyfive_units', text:'Reach 25 units', test:()=>soldiers.length>=25, reward:5 },
  { id:'ten_barracks', text:'Own 10 barracks', test:()=>S.barracks.length>=10, reward:4 },
  { id:'first_boss', text:'Defeat your first boss', test:()=>Object.keys(S.bossesDown||{}).length>=1, reward:5 },
  { id:'twohundred_kills', text:'Defeat 200 enemies', test:()=>S.kills>=200, reward:6 },
  { id:'all_early_zones', text:'Unlock Atlantis', test:()=>maxZoneReached()>=4, reward:8 },
  { id:'first_rebirth', text:'Rebirth for the first time', test:()=>S.rebirths>=1, reward:8 },
  { id:'volcano', text:'Unlock Volcano', test:()=>maxZoneReached()>=14, reward:10 },
  { id:'alienrealm', text:'Unlock Alien Realm', test:()=>maxZoneReached()>=15, reward:12 },
  { id:'deepforest', text:'Unlock Deep Forest', test:()=>maxZoneReached()>=16, reward:14 },
  { id:'shockedforest', text:'Unlock Shocked Forest', test:()=>maxZoneReached()>=17, reward:16 },
  { id:'urancitadel', text:'Unlock Uranian Citadel', test:()=>maxZoneReached()>=18, reward:18 },
  { id:'celestial', text:'Reach the Celestial Frontier', test:()=>maxZoneReached()>=19, reward:25 },
];
function legacyPoints() { return Number(S.legacy?.points)||0; }
function addLegacyPoints(n, reason='') {
  if (!n) return;
  S.legacy.points = legacyPoints() + n; S.legacy.lifetime = (Number(S.legacy.lifetime)||0) + n;
  toast(`+${n} Command Shard${n===1?'':'s'}${reason ? ` · ${reason}` : ''}`, 'gold', 3000);
  popNumber(player.pos, 4.4, `+${n} SHARD${n===1?'':'S'}`, 'lvl');
  musicStinger('legacy'); sfx('level'); autoSave();
}
function checkLegacyMilestones() {
  if (!S.legacy) S.legacy = { points:0, lifetime:0, upgrades:{}, milestones:{} };
  S.legacy.upgrades = { command:0, quartermaster:0, war_chest:0, scout:0, logistics:0, ...(S.legacy.upgrades||{}) };
  for (const m of LEGACY_MILESTONES) {
    if (S.legacy.milestones[m.id] || !m.test()) continue;
    S.legacy.milestones[m.id] = true; addLegacyPoints(m.reward, m.text);
    banner('COMMAND MILESTONE', `${m.text} · +${m.reward} shard${m.reward===1?'':'s'}`);
  }
}
function legacyUpgradeCost(u) { return u.cost(legacyBonus(u.id)); }
function buyLegacyUpgrade(id) {
  const u = LEGACY_UPGRADES.find(x=>x.id===id); if (!u) return;
  const lv = legacyBonus(id); if (lv >= u.max) { toast('That upgrade is maxed', 'bad'); return; }
  const cost = legacyUpgradeCost(u); if (legacyPoints() < cost) { toast(`Need ${cost} Command Shard${cost===1?'':'s'}`, 'bad'); return; }
  S.legacy.points -= cost; S.legacy.upgrades[id] = lv + 1;
  refreshSoldierStats(); updateHud();
  toast(`${u.name} → Lv ${lv+1}`, 'good', 3200); musicStinger('legacy'); sfx('level'); autoSave();
}

// ------------------------------------------------- V10: SHORT CONTRACTS ---
const CONTRACTS = [
  { id:'rush', name:'Quick Draw', text:'Defeat 7 enemies', metric:()=>S.kills, goal:7, base:2200 },
  { id:'harvest', name:'Harvest Run', text:'Collect 24 resources', metric:()=>Object.values(S.found||{}).reduce((a,n)=>a+n,0), goal:24, base:1800 },
  { id:'refine', name:'Turn It In', text:'Refine 18 resources', metric:()=>S.resourcesSold||0, goal:18, base:2600 },
  { id:'recruit', name:'Build Forward', text:'Build 1 barrack', metric:()=>S.barracks.length, goal:1, base:3200 },
  { id:'hunt', name:'Pressure Point', text:'Reach a 10 kill chain', metric:()=>S.chain?.best||0, goal:10, base:4200 },
];
function chooseContract(force=false) {
  if (S.mode!=='play') return;
  const cur=S.contract||{};
  if (!force && cur.id && !cur.claimed && S.time < cur.ends) return;
  const prev=cur.id; const pool=CONTRACTS.filter(x=>x.id!==prev); const d=pool[Math.floor(rnd()*pool.length)];
  S.contract={ id:d.id, start:d.metric(), goal:d.goal, ends:S.time+115, claimed:false, reward:Math.round(d.base*(1+0.12*maxZoneReached())) };
}
function contractDef(){ chooseContract(); return CONTRACTS.find(x=>x.id===S.contract.id)||CONTRACTS[0]; }
function contractProgress(){ const d=contractDef(); return Math.max(0, d.metric()-Number(S.contract.start||0)); }
function updateContract(dt){
  if(S.mode!=='play') return;
  chooseContract();
  const d=contractDef(), p=Math.min(d.goal, contractProgress());
  if(!S.contract.claimed && p>=d.goal){
    S.contract.claimed=true; const shard=1+Math.floor(Math.min(2, maxZoneReached()/4));
    addGold(S.contract.reward); addLegacyPoints(shard, 'contract complete');
    toast(`${d.name} complete · +${fmt(S.contract.reward)} gold`, 'gold', 4200);
    banner('CONTRACT COMPLETE', `${d.text} · next contract incoming`); musicStinger('combo'); autoSave();
  }
  if(S.contract.claimed && S.time >= S.contract.ends) chooseContract(true);
  if(!S.contract.claimed && S.time >= S.contract.ends){ toast('Contract expired · a new one is ready', ''); chooseContract(true); }
}
function updateContractHud(){
  const el=$('contractBox'); if(!el) return;
  if(S.mode!=='play'){ el.classList.add('hidden'); return; }
  const d=contractDef(), p=Math.min(d.goal, contractProgress()), left=Math.max(0,S.contract.ends-S.time);
  el.classList.remove('hidden');
  el.innerHTML=`<div class="contract-top"><span>${S.contract.claimed?'CONTRACT COMPLETE':'COMMAND CONTRACT'}</span><span>${Math.ceil(left)}s</span></div><div class="contract-name">${d.name}</div><div class="contract-task">${d.text}</div><div class="contract-row"><div class="contract-bar"><i style="width:${p/d.goal*100}%"></i></div><span>${p}/${d.goal}</span></div><div class="contract-reward">${S.contract.claimed?'Next contract soon':`+${fmt(S.contract.reward)} gold · +${1+Math.floor(Math.min(2,maxZoneReached()/4))} shard`}</div>`;
}

// ------------------------------------------------------- V8: REBIRTH, TEAMS ---
const rebirthCost = (r) => Math.round(50e6 * Math.pow(8, r));
const rebirthUnits = (r) => Math.min(75, 30 + 5 * r);
const rebirthDmg = () => 1 + 0.25 * (S.rebirths || 0);
const rebirthGold = () => 1 + 0.5 * (S.rebirths || 0);
function doRebirth() {
  const r = S.rebirths || 0;
  if (soldiers.length < rebirthUnits(r)) { toast(`You need ${rebirthUnits(r)} units to rebirth`, 'bad'); sfx('error'); return; }
  if (S.gold < rebirthCost(r)) { toast(`You need ${fmt(rebirthCost(r))} gold to rebirth`, 'bad'); sfx('error'); return; }
  if (panelState.confirmReb !== true) { panelState.confirmReb = true; toast('Press Rebirth again to confirm', 'bad', 3000); return; }
  panelState.confirmReb = false;
  S.rebirths = r + 1; S.gold = 0; S.pack = {}; S.packCount = 0; addLegacyPoints(8 + r * 2, `Rebirth ${S.rebirths}`);
  unlockBosses();
  while (soldiers.length) removeSoldier(soldiers[0]);
  for (const b of S.barracks) { b.level = 1; b.xp = 0; b.troops = Math.min(b.troops, barrackCap(1)); for (let i = 0; i < b.troops; i++) spawnTroop(b); refreshPlot(b); }
  refreshSoldierStats(); updateHud();
  banner(`Rebirth ${S.rebirths}`, `Now x${rebirthDmg().toFixed(2)} damage and x${rebirthGold().toFixed(1)} gold, forever`);
  musicStinger('victory'); shock(player.pos, 14); burst(player.pos, 0xffc83d, 50);
}
function saveTeam(i) {
  S.teams[i] = { name: `Team ${i + 1}`, gear: Object.fromEntries(S.barracks.map((b) => [b.uid, [b.weapon, b.armor]])) };
  toast(`Saved your gear as Team ${i + 1}`, 'good');
}
function loadTeam(i) {
  const t = S.teams[i]; if (!t) return;
  let n = 0;
  for (const b of S.barracks) { const g = t.gear[b.uid]; if (!g) continue; const [w, a] = g; let ch = false; if (w && S.owned[w] && b.weapon !== w) { b.weapon = w; ch = true; } if (a && S.owned[a] && b.armor !== a) { b.armor = a; ch = true; } if (ch) { rebuildTroops(b); n++; } }
  refreshSoldierStats(); toast(`Loaded Team ${i + 1}: ${n} barracks changed`, 'good');
}


// --------------------------------------------------- V19: GRAND ARCHIVE ---
const ARCHIVE_GOALS = [
  { id:'scout',      name:'Field Scout',        text:'Discover 10 different enemies',                goal:10,   metric:()=>Object.keys(S.disc||{}).length, reward:2 },
  { id:'collector',  name:'Relic Collector',    text:'Discover 20 different loot drops',              goal:20,   metric:()=>Object.keys(S.lootDisc||{}).length, reward:3 },
  { id:'veteran',    name:'Battle Veteran',     text:'Defeat 1,000 enemies',                           goal:1000, metric:()=>S.kills||0, reward:4 },
  { id:'champion',   name:'Boss Champion',      text:'Earn 25 boss clears across the world',           goal:25,   metric:()=>totalBossMastery(), reward:5 },
  { id:'traveler',   name:'World Traveler',     text:'Unlock 10 regions',                               goal:10,   metric:()=>ZONES.reduce((n,_,i)=>n+(zoneUnlocked(i)?1:0),0), reward:4 },
  { id:'secret',     name:'Secret Seeker',      text:'Find 12 hidden secrets',                         goal:12,   metric:()=>Object.keys(S.secrets||{}).length, reward:4 },
  { id:'relics',     name:'Relic Hunter',       text:'Collect all 6 permanent relics',               goal:6,    metric:()=>Object.keys(S.relics||{}).length, reward:5 },
  { id:'commander',  name:'Command Master',     text:'Issue 500 army orders',                          goal:500,  metric:()=>S.command?.orders||0, reward:4 },
  { id:'expedition', name:'Expeditionary',      text:'Clear 10 expeditions',                           goal:10,   metric:()=>S.expedition?.clears||0, reward:4 },
  { id:'bounty',     name:'Bounty Hunter',      text:'Complete 25 bounties',                           goal:25,   metric:()=>S.bounty?.completed||0, reward:4 },
  { id:'arsenal',    name:'Walking Arsenal',    text:'Own 50 different items',                         goal:50,   metric:()=>Object.keys(S.owned||{}).length, reward:5 },
  { id:'stable',     name:'Master Breeder',     text:'Hatch 25 pets',                                  goal:25,   metric:()=>S.hatchCount||0, reward:4 },
  { id:'refiner',    name:'Master Refiner',     text:'Refine 2,500 resources',                         goal:2500, metric:()=>S.resourcesSold||0, reward:4 },
  { id:'warrior',    name:'War Commander',     text:'Capture 25 war flags',                           goal:25,   metric:()=>S.war?.caps||0, reward:5 },
  { id:'rebirth',    name:'Eternal Commander',  text:'Perform 3 rebirths',                             goal:3,    metric:()=>S.rebirths||0, reward:6 },
  { id:'season',     name:'Festival Veteran',   text:'Earn 5,000 Season XP',                           goal:5000, metric:()=>S.season?.xp||0, reward:4 },
];
const ARCHIVE_RANKS = [
  { n:4,  name:'BRONZE ARCHIVE',   reward:4 },
  { n:8,  name:'SILVER ARCHIVE',   reward:6 },
  { n:12, name:'GOLD ARCHIVE',     reward:8 },
  { n:16, name:'PLATINUM ARCHIVE', reward:12 },
];
function archiveMetric(g){ try{return Math.max(0,Math.floor(Number(g.metric())||0));}catch(e){return 0;} }
function archiveDoneCount(){ return ARCHIVE_GOALS.reduce((n,g)=>n+(S.archive?.claimed?.[g.id]?1:0),0); }
function archiveGrade(){const n=archiveDoneCount();if(n>=16)return 'OBSIDIAN';if(n>=12)return 'PLATINUM';if(n>=8)return 'GOLD';if(n>=4)return 'SILVER';if(n>=1)return 'BRONZE';return 'ROOKIE';}
function checkArchiveMilestones(){
  if(!S.archive) S.archive={claimed:{},ranks:{},seenVersion:1};
  for(const g of ARCHIVE_GOALS){
    if(S.archive.claimed[g.id] || archiveMetric(g)<g.goal) continue;
    S.archive.claimed[g.id]=true;
    addLegacyPoints(g.reward, `Archive: ${g.name}`);
    addGold(Math.round((5000+g.reward*1500)*goldMult()));
    toast(`ARCHIVE COMPLETE · ${g.name} · +${g.reward} ◈`,'gold',4200);
    banner('ARCHIVE COMPLETE',`${g.name} · the world remembers your achievement`);
    musicStinger('level');
  }
  const done=archiveDoneCount();
  for(const r of ARCHIVE_RANKS){
    if(done>=r.n && !S.archive.ranks[r.name]){
      S.archive.ranks[r.name]=true;
      addLegacyPoints(r.reward,r.name);
      addGold(Math.round((10000+r.n*2500)*goldMult()));
      toast(`${r.name} reached · +${r.reward} ◈`,'gold',5000);
      musicStinger('legendary');
    }
  }
}
function archiveProgress(){const done=archiveDoneCount();return {done,total:ARCHIVE_GOALS.length,pct:Math.round(done/ARCHIVE_GOALS.length*100)};}

// ------------------------------------------------------------------ UI ---
const $ = (id) => document.getElementById(id);
const fpsEl = $('fps');
function updateRandomEventBox(){const el=$('randomEventBox');if(!el)return;const ev=S.randomEvent;if(S.mode!=='play'||!ev?.active){el.classList.add('hidden');return;}el.classList.remove('hidden');const left=Math.max(0,ev.ends-S.time);const title=ev.label||(ev.kind==='treasure_drop'?'TREASURE DROP':'WORLD EVENT');const sub=ev.kind==='golden_hour'?'Gold x1.75 · stay active!':ev.kind==='treasure_drop'?'Find the glowing chest!':'Roaming boss rewards doubled';el.innerHTML=`<div class="retitle">${title}</div><div class="resub">${sub} · ${Math.ceil(left)}s</div>`;}
function updateHud() {
  $('goldVal').textContent = fmt(S.gold);
  const cap = packCap();
  $('packVal').textContent = `${fmt(S.packCount)}/${fmt(cap)}`;
  $('packFill').style.width = Math.min(100, S.packCount / cap * 100) + '%';
  $('packFill').parentElement.classList.toggle('full', S.packCount >= cap);
  const alive = soldiers.filter((s) => s.alive).length;
  $('armyVal').textContent = `${alive}/${soldiers.length}`;
  const rb = $('rebirthVal'); if (rb) rb.textContent = String(S.rebirths || 0);
  $('armyVal').nextElementSibling.textContent = `units · ${S.barracks.length} barracks`;
  $('hpFill').style.width = (player.hp / player.maxHp * 100) + '%';
  if (panelState.open && !['help', 'save', 'codes'].includes(panelState.kind) && !S.spinning) renderPanel();
  updateMomentumHud(); updateDirectorHud(); updateRandomEventBox(); updateExpeditionHud(); updateContractHud(); updateLegacyHud(); updateCommandHud();
}
const panelState = { open: false, kind: null, tab: 0 };
function openPanel(kind, tab = 0) { panelState.lastHtml = null; panelState.lastTabs = null; panelState.open = true; panelState.kind = kind; panelState.tab = tab; $('panel').classList.remove('hidden'); renderPanel(); }
function closePanel() { panelState.open = false; $('panel').classList.add('hidden'); }
function togglePanel(kind) { if (panelState.open && panelState.kind === kind) closePanel(); else openPanel(kind); }
$('panelClose').onclick = closePanel;
function swatch(color, label = '') { return `<div class="sw" style="background:${hex(color)}">${label}</div>`; }
function clock(sec) { sec = Math.ceil(sec); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
const chip = (t, c) => `<span class="chip"${c ? ` style="color:${c}"` : ''}>${t}</span>`;
const lockTag = (t) => `<span class="tag" style="opacity:.7">${t}</span>`;

function itemStat(it) {
  if (it.type === 'weapon') {
    if (it.cls === 'glove') return `Hits for <b>${Math.round(it.min * 7)}%</b> of max HP`;
    if (it.cls === 'bandage') return `Heals <b>${fmt(it.min * 4)}-${fmt(it.max * 4)}</b>`;
    return `Damage <b>${fmt(it.min)}-${fmt(it.max)}</b>`;
  }
  if (it.type === 'armor') return `Health <b>+${fmt(it.hp)}</b>`;
  if (it.type === 'bag') return `Holds <b>${fmt(it.cap)}</b> items`;
  return `Materials <b>x${it.mult}</b>`;
}
function shopRows(list, equippedId) {
  let html = '';
  const zr = maxZoneReached();
  for (const it of list) {
    const own = S.owned[it.id];
    let act;
    if (equippedId !== undefined && equippedId === it.id) act = '<span class="tag">EQUIPPED</span>';
    else if (own) act = equippedId !== undefined ? `<button class="buy gray" data-act="use" data-id="${it.id}">Equip</button>` : lockTag('OWNED');
    else if (!it.cost) act = lockTag('BOSS DROP');
    else if (!zoneUnlocked(it.zone)) act = lockTag(`Unlock ${ZONES[it.zone].name}`);
    else act = `<button class="buy" data-act="buyitem" data-id="${it.id}" ${S.gold < it.cost ? 'disabled' : ''}>${fmt(it.cost)}</button>`;
    html += `<div class="row ${own ? 'owned' : ''} ${!own && (!zoneUnlocked(it.zone) || !it.cost) ? 'locked' : ''}">${swatch(it.color, '')}<div><div class="nm">${it.name}</div><div class="ds">${itemStat(it)}</div></div><div class="acts">${act}</div></div>`;
  }
  return html;
}
function barrackRow(b) {
  const t = TROOPS[b.type], cap = barrackCap(b.level);
  const need = bXpNeed(b.level);
  const [a, c] = troopDmgRange(b);
  const wOpts = [`<option value="">${t.cls === 'sword' ? 'Fists (2-4)' : 'None'}</option>`].concat(Object.values(ITEMS).filter((it) => it.type === 'weapon' && it.cls === t.cls && S.owned[it.id]).map((it) => `<option value="${it.id}" ${b.weapon === it.id ? 'selected' : ''}>${it.name}</option>`)).join('');
  const aOpts = ['<option value="">No armor</option>'].concat(Object.values(ITEMS).filter((it) => it.type === 'armor' && S.owned[it.id]).map((it) => `<option value="${it.id}" ${b.armor === it.id ? 'selected' : ''}>${it.name} (+${fmt(it.hp)})</option>`)).join('');
  const full = b.troops >= cap;
  return `<div class="row brow">${swatch(t.shirt, b.level)}<div><div class="nm">${t.name} Barrack ${chip('Lv ' + b.level)} ${chip(`${b.troops}/${cap} troops`)}</div>
    <div class="ds">HP <b>${fmt(troopMaxHp(b))}</b> · ${t.healer ? 'Heal' : 'DMG'} <b>${t.healer ? fmt(weaponOf(b).min * 4) : fmt(a) + '-' + fmt(c)}</b> · ${b.level >= BARRACK_MAX_LV ? 'MAX LEVEL' : `XP ${fmt(b.xp)}/${fmt(need)}`}</div>
    <div class="bar xp"><div style="width:${b.level >= BARRACK_MAX_LV ? 100 : b.xp / need * 100}%"></div></div>
    <div class="eq"><select data-b="${b.uid}" data-slot="weapon">${wOpts}</select><select data-b="${b.uid}" data-slot="armor">${aOpts}</select></div></div>
    <div class="acts"><button class="buy gray" data-act="best" data-b="${b.uid}">Equip best</button><button class="buy" data-act="troop" data-b="${b.uid}" ${full || S.gold < t.cost ? 'disabled' : ''}>${full ? 'Full' : '+1 Troop ' + fmt(t.cost)}</button>
    ${b.level < BARRACK_MAX_LV ? `<button class="buy gray" data-act="train" data-b="${b.uid}" ${S.gold < levelPrice(b) ? 'disabled' : ''} title="Instantly gain a level">Train ${fmt(levelPrice(b))}</button>` : ''}
    ${panelState.confirmDel === b.uid ? `<button class="buy red" data-act="delbarrack" data-b="${b.uid}">Confirm: +${fmt((t.bCost + b.troops * t.cost) * 0.5)}</button>` : `<button class="buy gray del" data-act="askdel" data-b="${b.uid}" title="Delete this barrack and get half its cost back">Delete</button>`}</div></div>`;
}
function renderPanel() {
  const body = $('panelBody'), tabs = $('panelTabs'), title = $('panelTitle');
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'SELECT' || ae.type === 'range') && body.contains(ae)) return;
  const k = panelState.kind;
  const scroll = body.scrollTop;
  let html = '', tabHtml = '';
  const zr = maxZoneReached();
  if (k === 'more') {
    title.textContent = 'More';
    html += `<div class=\"note\">Advanced systems are tucked away here so the battlefield stays clean. Use the quick essentials on the HUD and open this menu when you need everything else.</div>`;
    const groups = [
      { title:'Progression', items:[['legacy','Legacy','Permanent upgrades and Command Shards'],['rebirth','Rebirth','Reset for permanent multipliers and unlocks'],['archive','Archive','Long-term mastery and completion goals'],['season','Season','Frontier Festival rewards']] },
      { title:'World', items:[['teleport','Teleport','Travel to unlocked areas'],['gifts','Gifts','Playtime gifts and Shell Hunt'],['bounties','Bounties','Rotating bounty targets'],['expeditions','Expeditions','Timed multi-wave runs'],['war','War','Faction and war systems']] },
      { title:'Collecting', items:[['pets','Pets','Eggs, pets and fusion'],['wheel','Wheel','Lucky Wheel rewards'],['codes','Codes','Redeem codes'],['index','Index','Enemies, loot and discoveries']] },
      { title:'Play Together', items:[['coop','Co-op Raid','Create a private room and fight a boss together']] },
      { title:'Utilities', items:[['save','Save','Save/load and backup'],['help','Help','Controls and gameplay help'],['settings','Settings','Audio, graphics and gameplay options']] },
    ];
    for (const g of groups) {
      html += `<div class=\"sect\">${g.title}</div><div class=\"more-grid\">`;
      for (const [id,n,d] of g.items) html += `<button class=\"more-item\" data-act=\"moreopen\" data-id=\"${id}\"><span class=\"more-name\">${n}</span><span class=\"more-desc\">${d}</span></button>`;
      html += `</div>`;
    }
  } else if (k === 'barracks') {
    title.textContent = 'Barracks';
    const names = ['My Barracks', 'Build Barrack'];
    tabHtml = names.map((n, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('');
    if (panelState.tab === 0) {
      html += `<div class="note">Each barrack holds troops of one type. Barracks level up (max ${BARRACK_MAX_LV}) as their troops fight, and get an extra troop slot at levels 4, 8 and 12. You own <b>${soldiers.length}</b> units.</div>`;
      if (!S.barracks.length) html += `<div class="note">No barracks yet. Build one in the next tab.</div>`;
      for (const b of S.barracks) html += barrackRow(b);
    } else {
      const fee = plotFee(S.barracks.length);
      html += `<div class="note">Plots used <b>${S.barracks.length}/${S.plots}</b> (max ${MAX_PLOTS}). Each new barrack adds a plot fee of <b>${fmt(fee)}</b> gold. Delete a barrack in My Barracks to swap it for a stronger type. New plots are in the west part of the base.</div>`;
      html += `<div class="row">${swatch(0x9a8f7a, '+')}<div><div class="nm">Buy a Plot ${chip(S.plots + '/' + MAX_PLOTS)}</div><div class="ds">Room for one more barrack. Price rises with every plot.</div></div><div class="acts">${S.plots >= MAX_PLOTS ? lockTag('MAXED') : `<button class="buy" data-act="buyplot" ${S.gold < plotPrice(S.plots) ? 'disabled' : ''}>Buy ${fmt(plotPrice(S.plots))}</button>`}</div></div>`;
      TROOPS.forEach((t, i) => {
        const locked = !zoneUnlocked(t.zone), cost = t.bCost + fee, have = S.barracks.filter((b) => b.type === i).length;
        html += `<div class="row ${locked ? 'locked' : ''}">${swatch(t.shirt, t.name[0])}<div><div class="nm">${t.name} ${have ? chip('x' + have) : ''}</div><div class="ds">${t.desc} · Troop cost <b>${fmt(t.cost)}</b></div></div>
          <div class="acts">${locked ? lockTag(`Unlock ${ZONES[t.zone].name}`) : S.barracks.length >= S.plots ? lockTag('NO FREE PLOT') : `<button class="buy" data-act="barrack" data-i="${i}" ${S.gold < cost ? 'disabled' : ''}>Build ${fmt(cost)}</button>`}</div></div>`;
      });
    }
  } else if (k === 'weapons') {
    title.textContent = 'Weapon Shop';
    const classes = Object.keys(CLS_NAME);
    tabHtml = classes.map((c, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${CLS_NAME[c]}</button>`).join('');
    const cls = classes[panelState.tab] || 'sword';
    html += `<div class="note">Weapons you own can be equipped on any barrack that uses ${CLS_NAME[cls].toLowerCase()}. New shop items unlock in later areas; the best gear drops from bosses.</div>`;
    html += shopRows(Object.values(ITEMS).filter((it) => it.type === 'weapon' && it.cls === cls));
  } else if (k === 'armor') {
    title.textContent = 'Armor Shop';
    html += `<div class="note">Armor adds health to every troop in the barrack it is equipped on. Your own health grows with the best armor you own.</div>`;
    html += shopRows(Object.values(ITEMS).filter((it) => it.type === 'armor'));
  } else if (k === 'bags') {
    title.textContent = 'Bag Shop';
    html += `<div class="note">A bigger bag carries more resources between trips to the Sell pad.</div>`;
    html += shopRows(Object.values(ITEMS).filter((it) => it.type === 'bag'), S.bag);
  } else if (k === 'wands') {
    title.textContent = 'Wand Shop';
    html += `<div class="note">Wands multiply the materials you get from trees, flowers, rocks and ores. The Desert Wand drops from the Pharaoh.</div>`;
    html += shopRows(Object.values(ITEMS).filter((it) => it.type === 'wand'), S.wand);
  } else if (k === 'crafter') {
    title.textContent = 'Crafter';
    tabHtml = ['Potions', 'Summons & Items'].map((n, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('');
    if (panelState.tab === 1) {
      html += `<div class="note">Turn materials into boss summons and fragments. Key items are kept safe and never sold.</div>`;
      for (const r of RECIPES) {
        const reqs = Object.entries(r.need).map(([m, n]) => { const have = S.pack[m] || 0; return chip(`${RES[m].name} ${Math.min(have, n)}/${n}`, have >= n ? '#bff5cc' : '#ffb3b6'); }).join('') + Object.entries(r.key || {}).map(([m, n]) => { const have = S.items[m] || 0; return chip(`${KEY[m].name} ${Math.min(have, n)}/${n}`, have >= n ? '#bff5cc' : '#ffb3b6'); }).join('');
        const ok = packHas(r.need) && Object.entries(r.key || {}).every(([m, n]) => (S.items[m] || 0) >= n) && S.gold >= r.gold;
        html += `<div class="row">${swatch(KEY[r.id].color, S.items[r.id] || '')}<div><div class="nm">${r.name} ${chip('x' + (S.items[r.id] || 0))}</div><div class="ds">${KEY[r.id].desc}</div><div class="chips" style="margin-top:6px">${reqs}</div></div><div class="acts"><button class="buy" data-act="recipe" data-id="${r.id}" ${ok ? '' : 'disabled'}>Craft ${fmt(r.gold)}</button></div></div>`;
      }
    } else {
    html += `<div class="note">Craft potions from materials in your bag, then drink them. Each lasts ${POTION_TIME / 60} minutes; drinking another adds time.</div>`;
    for (const [id, p] of Object.entries(POTIONS)) {
      const reqs = Object.entries(p.need).map(([r, n]) => { const have = S.pack[r] || 0; return chip(`${RES[r].name} ${Math.min(have, n)}/${n}`, have >= n ? '#bff5cc' : '#ffb3b6'); }).join('');
      const ok = packHas(p.need) && S.gold >= p.gold;
      const active = S.potions[id] > 0 ? `<span class="tag">${clock(S.potions[id])}</span>` : '';
      html += `<div class="row">${swatch(p.color, S.potInv[id] || '')}<div><div class="nm">${p.name} ${chip('x' + (S.potInv[id] || 0))} ${active}</div><div class="ds">${p.desc}</div><div class="chips" style="margin-top:6px">${reqs}</div></div>
        <div class="acts"><button class="buy gray" data-act="drink" data-id="${id}" ${S.potInv[id] ? '' : 'disabled'}>Drink</button><button class="buy" data-act="craft" data-id="${id}" ${ok ? '' : 'disabled'}>Craft ${fmt(p.gold)}</button></div></div>`;
    }
    }
} else if (k === 'legacy') {
    title.textContent='Command Legacy';
    const pts=legacyPoints(), rank=legacyLevel()+1;
    html += `<div class="legacy-hero"><div class="legacy-big">COMMAND RANK ${rank}</div><div class="legacy-points">◈ ${pts} Command Shard${pts===1?'':'s'}</div><div class="note">Permanent upgrades survive rebirths. Earn shards from milestones, contracts and rebirths.</div></div>`;
    html += `<div class="sect">Permanent Upgrades</div>`;
    for(const u of LEGACY_UPGRADES){ const lv=legacyBonus(u.id), cost=legacyUpgradeCost(u), maxed=lv>=u.max; html += `<div class="row ${maxed?'owned':''}">${swatch(maxed?0x52d273:0xb36bff, lv)}<div><div class="nm">${u.name} ${chip('Lv '+lv+'/'+u.max)}</div><div class="ds">${u.desc}</div><div class="bar xp"><div style="width:${lv/u.max*100}%"></div></div></div><div class="acts">${maxed?lockTag('MAXED'):`<button class="buy" data-act="legacy" data-id="${u.id}" ${pts<cost?'disabled':''}>Buy ${cost} ◈</button>`}</div></div>`; }
    html += `<div class="sect">Command Milestones</div>`;
    for(const m of LEGACY_MILESTONES){ const got=!!S.legacy?.milestones?.[m.id]; html += `<div class="row ${got?'owned':'locked'}">${swatch(got?0x52d273:0x555b78, got?'✓':'?')}<div><div class="nm">${m.text}</div><div class="ds">Reward <b>+${m.reward} shard${m.reward===1?'':'s'}</b></div></div><div class="acts">${got?'<span class="tag">CLAIMED</span>':lockTag('AUTO')}</div></div>`; }
    html += `<div class="note">The core loop still stays focused on collecting resources, refining them at base, and spending gold on soldiers, weapons and armor. Legacy is a permanent layer on top.</div>`;
 } else if (k === 'command') {
    const cm=S.command.mode||'follow',fm=S.command.formation||'line',pr=S.command.priority||'nearest';
    tabHtml = ['Orders','Commander','Trials'].map((n,i)=>`<button class="${panelState.tab===i?'on':''}" data-tab="${i}">${n}</button>`).join('');
    if(panelState.tab===0){
      title.textContent='Army Command';
      html += `<div class="command-panel"><div class="command-hero">${COMMAND_MODES[cm]||'FOLLOW'} · ${FORMATIONS[fm]||'LINE'}</div><div class="command-status">Orders issued: ${fmt(S.command.orders||0)} · ${soldiers.length} units</div></div>`;
      html += `<div class="sect">Battle order</div><div class="command-grid">${Object.entries(COMMAND_MODES).map(([id,n])=>`<button class="buy ${cm===id?'on':'gray'}" data-act="cmdmode" data-id="${id}">${n}</button>`).join('')}</div>`;
      html += `<div class="sect">Formation</div><div class="command-grid">${Object.entries(FORMATIONS).map(([id,n])=>`<button class="buy ${fm===id?'on':'gray'}" data-act="formation" data-id="${id}">${n}</button>`).join('')}</div>`;
      html += `<div class="sect">Target priority</div><div class="command-grid">${Object.entries(TARGET_PRIORITIES).map(([id,n])=>`<button class="buy ${pr===id?'on':'gray'}" data-act="priority" data-id="${id}">${n}</button>`).join('')}</div>`;
      const held=captureObjs.filter(o=>o.root.visible&&o.owner===1).length; const sy=armySynergy(); html += `<div class="sect">Army Synergy</div><div class="chips">${sy?chip(`${sy.name} · ${sy.desc}`,'#bff5cc'):chip('No synergy · diversify your army')}</div>`; html += `<div class="sect">Command posts</div><div class="chips">${chip(`${held} controlled`,'#bff5cc')}${chip(`${captureObjs.filter(o=>o.root.visible).length} discovered`,'#8fe0ff')}${chip('+ income every 30s')}</div>`;
      const bmTotal=totalBossMastery(); html += `<div class="sect">Boss Mastery</div><div class="chips">${chip(`${bmTotal} total boss clears`,'#d08cff')}${chip(`+${Math.round(bossMasteryBonus()*100)}% boss damage`,'#ffc83d')}</div>`; html += `<div class="note">Boss milestones: <b>1 · 3 · 5 · 10 · 25</b> kills each. Hotkeys: <b>1</b> Follow · <b>2</b> Hold · <b>3</b> Rush · <b>4</b> Line · <b>5</b> Wedge · <b>6</b> Circle · <b>O</b> opens Command.</div>`;
    } else if(panelState.tab===1){
      title.textContent='Commander'; const cd=commanderDef();
      html += `<div class="command-hero" style="border-color:${hex(cd.color)}">${cd.name} · RANK ${commanderLevel()}</div>`;
      html += `<div class="note">Commander XP: <b>${fmt(S.commander.xp)}</b> · Next rank in <b>${fmt(commanderLevel()*250-S.commander.xp)}</b> XP. XP comes from enemy kills and boss defeats.</div>`;
      html += `<div class="bar xp"><div style="width:${((S.commander.xp%250)/250)*100}%"></div></div>`;
      for(const c of COMMANDERS){ const ok=commanderUnlocked(c.id), sel=cd.id===c.id; html += `<div class="row ${sel?'owned':''} ${ok?'':'locked'}">${swatch(c.color,c.req)}<div><div class="nm">${c.name} ${sel?chip('EQUIPPED','#bff5cc'):''}</div><div class="ds">Unlocks at Commander Rank <b>${c.req}</b> · ${c.desc}</div></div><div class="acts">${ok ? `<button class="buy ${sel?'gray':''}" data-act="commander" data-id="${c.id}" ${sel?'disabled':''}>${sel?'Active':'Equip'}</button>` : lockTag('LOCKED')}</div></div>`; }
      html += `<div class="sect">Elite Barracks</div>`;
      for(const b of S.barracks){ const e=Number(b.elite)||0, cost=[{g:5e6,s:3},{g:50e6,s:7},{g:500e6,s:15}][e]; const can=b.level>=12&&e<3&&cost&&S.gold>=cost.g&&legacyPoints()>=cost.s; html += `<div class="row ${e?'owned':''}">${swatch(e>=3?0xd08cff:e===2?0xffc83d:0x8fe0ff,e?`E${e}`:'—')}<div><div class="nm">${TROOPS[b.type].name} ${e?chip('ELITE '+e,'#ffc83d'):''}</div><div class="ds">Level <b>${b.level}</b> · Elite grants +15% damage, +12% HP and +4% speed per rank.</div></div><div class="acts">${e>=3?lockTag('MAX'):b.level<12?lockTag('LV 12'): `<button class="buy" data-act="promote" data-b="${b.uid}" ${can?'':'disabled'}>E${e+1} · ${fmt(cost.g)} + ${cost.s} ◈</button>`}</div></div>`; }
    } else {
      title.textContent='Commander Trials'; const t=trialDef(); const active=S.trial.active; const p=trialProgress();
      if(active) html += `<div class="command-hero">${t.name} · ${fmt(p)}/${fmt(t.goal)} · ${clock(Math.max(0,S.trial.ends-S.time))}</div>`;
      else html += `<div class="note">Timed trials give large gold rewards, Command Shards and Commander XP. Only one can run at a time.</div>`;
      for(const tr of TRIALS){ const ready=S.time>=(S.trial.cooldown||0), ok=soldiers.filter(s=>s.alive).length>=tr.units; html += `<div class="row ${active&&t.id===tr.id?'owned':''}">${swatch(tr.boss?0xd08cff:0xff6fd8,tr.units)}<div><div class="nm">${tr.name}</div><div class="ds">${tr.desc} · Needs <b>${tr.units}</b> living units · Reward <b>${fmt(tr.reward)} gold</b> + ${tr.xp} Commander XP</div></div><div class="acts"><button class="buy" data-act="trial" data-id="${tr.id}" ${active||!ready||!ok?'disabled':''}>${active&&t.id===tr.id?'ACTIVE':!ready?'COOLDOWN':'Start'}</button></div></div>`; }
      html += `<div class="note">Trial progress survives nothing except rewards—finish before the timer expires. Boss Hunt counts boss defeats after the trial begins.</div>`;
    }

  } else if (k === 'wheel') {
  const type = panelState.tab === 1 ? 'premium' : 'standard';
  const wheel = WHEELS[type];
  const segments = wheelLayout(type);
  const readyAt = type === 'premium' ? S.premiumWheelAt : S.wheelAt;
  const rotation = type === 'premium'
    ? S.premiumWheelRot
    : S.wheelRot;
  const ready = S.time >= readyAt;
  const canAfford = S.gold >= wheel.cost;

  title.textContent = wheel.name;
  tabHtml = ['Standard · Free', 'Premium · 25K'].map((name, i) =>
    `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${name}</button>`
  ).join('');

  const gradient = segments
    .map(({ color, start, end }) => `${color} ${start}deg ${end}deg`)
    .join(', ');

  const labels = segments.map(({ label, center }) =>
    `<span style="transform:rotate(${center}deg)"><i>${label}</i></span>`
  ).join('');

  html += `
    <div class="note">
      ${type === 'standard'
        ? 'Free spin every 30 minutes of play.'
        : `Costs ${fmt(wheel.cost)} gold. Spin again after 10 minutes.`}
      Prizes are weighted: larger wedges mean better odds.
    </div>
    <div class="wheelWrap">
      <div class="wpin"></div>
      <div class="wheel" id="wheelEl"
           style="background:conic-gradient(${gradient});transform:rotate(${rotation}deg)">
        ${labels}
      </div>
    </div>
    <div style="text-align:center;margin-top:12px">
      <button class="buy" data-act="spin" data-id="${type}"
        ${ready && canAfford && !S.spinning ? '' : 'disabled'}>
        ${S.spinning
          ? 'Spinning...'
          : !ready
            ? `Next spin in ${clock(readyAt - S.time)}`
            : wheel.cost
              ? `Spin · ${fmt(wheel.cost)} gold`
              : 'Spin (free)'}
      </button>
    </div>`;

  } else if (k === 'army') {
    title.textContent = 'Your Army';
    html += `<div class="chips">${chip(`${soldiers.length} units`)}${chip(`${S.barracks.length}/${S.plots} barracks`)}${chip(`Bag: ${ITEMS[S.bag].name}`)}${chip(`Wand: ${ITEMS[S.wand].name}`)}${chip(`Luck x${luckMult().toFixed(2)}`, '#bff5cc')}</div>`;
    html += `<div class="sect">Title</div><div class="chips">`;
    for (const t of TITLES) { const ok = t.ok(); html += ok ? `<button class="buy ${S.title === t.id ? '' : 'gray'}" style="margin:2px" data-act="title" data-id="${t.id}" title="${t.how}">${t.name}</button>` : `<span class="chip" style="opacity:.45" title="${t.how}">${t.name} · ${t.how}</span>`; }
    html += `</div>`;
    html += `<div class="sect">Saved Teams</div><div class="ds" style="margin-bottom:6px">Save the weapons and armor of every barrack, then switch back in one tap (for example a boss team and a farming team).</div><div class="chips">${[0, 1, 2].map((i) => `<span class="chip">Team ${i + 1}${S.teams[i] ? '' : ' (empty)'} <button class="buy gray sm" data-act="teamsave" data-i="${i}">Save</button> <button class="buy sm" data-act="teamload" data-i="${i}" ${S.teams[i] ? '' : 'disabled'}>Load</button></span>`).join('')}</div>`;
    html += `<div class="sect">Gear</div><div class="chips">${['hat', 'boots', 'belt'].map((sl) => chip(`${({ hat: "Hat", boots: "Boots", belt: "Belt" })[sl]}: ${S[sl] ? ITEMS[S[sl]].name : 'none'}`)).join('')}${Object.entries(S.items).filter(([, n]) => n > 0).map(([id, n]) => chip(`${KEY[id].name} x${n}`, hex(KEY[id].color))).join('')}</div>`;
    html += `<div class="sect">Skills (G = slot 1, V = slot 2)</div>`;
    const owned = Object.keys(SKILLS).filter((s) => S.skills[s]);
    if (!owned.length) html += `<div class="note">No skills yet. Bosses like the White Flower drop skills.</div>`;
    for (const [id, sk] of Object.entries(SKILLS)) {
      if (!S.skills[id]) { html += `<div class="row locked">${swatch(0x333a5c, '?')}<div><div class="nm">???</div><div class="ds">Dropped by a boss</div></div><div class="acts"></div></div>`; continue; }
      html += `<div class="row ${S.skill === id || S.skill2 === id ? 'owned' : ''}">${swatch(sk.color, '')}<div><div class="nm">${sk.name}</div><div class="ds">${sk.desc} · Cooldown ${sk.cd}s</div></div><div class="acts">${S.skill === id ? '<span class="tag">SLOT 1</span>' : `<button class="buy gray" data-act="skill" data-id="${id}">Slot 1</button>`}${S.skill2 === id ? '<span class="tag">SLOT 2</span>' : `<button class="buy gray" data-act="skill2" data-id="${id}">Slot 2</button>`}</div></div>`;
    }
    html += `<div class="sect">Troops</div>`;
    for (const b of S.barracks) {
      const list = soldiers.filter((s) => s.barrack === b);
      const dead = list.filter((s) => !s.alive).length;
      html += `<div class="row">${swatch(TROOPS[b.type].shirt, b.level)}<div><div class="nm">${TROOPS[b.type].name} x${list.length} ${dead ? chip(`${dead} respawning`, '#ff9a9d') : ''}</div><div class="ds">${weaponOf(b).name} · ${armorOf(b).name} · HP <b>${fmt(troopMaxHp(b))}</b></div></div><div class="acts"></div></div>`;
    }
    if (Object.keys(S.pack).length) {
      html += `<div class="sect">Bag</div><div class="chips">`;
      for (const r in S.pack) html += chip(`${RES[r].name} x${fmt(S.pack[r])} <span style="color:#ffc83d">(${fmt(S.pack[r] * RES[r].value)})</span>`);
      html += `</div>`;
    }
  } else if (k === 'quests' || k === 'npc') {
    const list = k === 'npc' ? [NPCS[panelState.tab]] : NPCS;
    title.textContent = k === 'npc' ? `${list[0].name}'s Quests` : 'Quests';
    for (const n of list) {
      const qi = S.quests[n.id];
      if (!S.met[n.id]) { html += `<div class="row locked">${swatch(n.shirt, '?')}<div><div class="nm">${n.name}</div><div class="ds">Find ${n.name} in ${ZONES[zoneAt(n.x)].name} to start their quests</div></div><div class="acts"></div></div>`; continue; }
      html += `<div class="sect">${n.name} · ${Math.min(qi, n.quests.length)}/${n.quests.length}</div>`;
      n.quests.forEach((q, i) => {
        if (k === 'quests' && (i < qi - 1 || i > qi + 1)) return;
        const done = i < qi, cur = i === qi;
        const prog = Math.min(questProgress(q), q.n);
        html += `<div class="row ${done ? 'owned' : ''} ${i > qi ? 'locked' : ''}">${swatch(done ? 0x52d273 : cur ? 0xffc83d : 0x555b78, i + 1)}<div><div class="nm">${q.t}</div><div class="ds">Reward <b>${fmt(q.r)} gold</b>${cur ? ` · Progress <b>${fmt(prog)}/${fmt(q.n)}</b>` : ''}</div></div>
          <div class="acts">${done ? '<span class="tag">DONE</span>' : cur ? '<span class="tag" style="color:#ffc83d;border-color:#ffc83d">ACTIVE</span>' : ''}</div></div>`;
      });
    }
  } else if (k === 'index') {
    title.textContent = 'Index';
    const nd = Object.keys(S.disc).length, nl = Object.keys(S.lootDisc).length;
    const lootIds = new Set(Object.values(ENEMIES).flatMap((e) => e.loot.map((l) => l[0])));
    html += `<div class="chips">${chip(`Enemies ${nd}/${Object.keys(ENEMIES).length}`)}${chip(`Loot ${nl}/${lootIds.size}`)}${chip(`Luck x${luckMult().toFixed(2)}`, '#bff5cc')}${chip(`Golden kills ${S.goldenKills}`, '#ffc83d')}</div>`;
    const secretTotal=SECRET_DEFS.length, secretFound=Object.keys(S.secrets||{}).filter(k=>S.secrets[k]).length, relicFound=Object.keys(S.relics||{}).filter(k=>S.relics[k]).length; html += `<div class="chips">${chip(`Secrets ${secretFound}/${secretTotal}`, '#8fe0ff')}${chip(`Relics ${relicFound}/${RELIC_DEFS.length}`, '#d08cff')}</div>`;
    const lname = (id) => id.startsWith('skill:') ? SKILLS[id.slice(6)].name : ITEMS[id] ? ITEMS[id].name : KEY[id] ? KEY[id].name : RES[id].name;
    tabHtml = ['Enemies', 'Materials', 'Key Items', 'Badges'].map((n, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('');
    if (panelState.tab === 1) {
      html += `<div class="note">Turn on <b>Auto-sell</b> for a material and it is sold the moment you collect it, so it never fills your bag.</div>`;
      for (const [id, r] of Object.entries(RES)) {
        const seen = S.found[id];
        html += `<div class="row ${seen ? '' : 'locked'}">${swatch(r.color, '')}<div><div class="nm">${seen ? r.name : '???'}</div><div class="ds">Worth <b>${fmt(r.value)}</b> · Collected <b>${fmt(S.found[id] || 0)}</b></div></div><div class="acts">${seen ? `<button class="buy ${S.autosell[id] ? '' : 'gray'}" data-act="autosell" data-id="${id}">Auto-sell ${S.autosell[id] ? 'ON' : 'OFF'}</button>` : ''}</div></div>`;
      }
    } else if (panelState.tab === 3) {
      const bl = badgeList(), got = bl.filter((b) => S.badges[b.id]).length;
      html += `<div class="note">Badges from the original game. Earned <b>${got}/${bl.length}</b>.</div><div class="badges">${bl.map((b) => `<div class="badge ${S.badges[b.id] ? 'on' : ''}" title="${b.how}"><div class="bdg"></div><b>${b.name}</b><small>${S.badges[b.id] ? 'Earned' : b.how}</small></div>`).join('')}</div>`;
    } else if (panelState.tab === 2) {
      for (const [id, d] of Object.entries(KEY)) html += `<div class="row ${S.found[id] ? '' : 'locked'}">${swatch(d.color, S.items[id] || '')}<div><div class="nm">${S.found[id] ? d.name : '???'} ${chip('x' + (S.items[id] || 0))}</div><div class="ds">${d.desc}</div></div><div class="acts"></div></div>`;
    } else
    for (const [id, d] of Object.entries(ENEMIES)) {
      const seen = S.disc[id];
      const loot = d.loot.map(([r, ch]) => chip(`${S.lootDisc[r] || (r.startsWith('skill:') && S.skills[r.slice(6)]) ? lname(r) : '???'} ${Math.round(Math.min(1, ch * luckMult()) * 1000) / 10}%`)).join('');
      html += `<div class="row ${seen ? '' : 'locked'}">${swatch(seen ? 0xff8a3d : 0x333a5c, seen ? d.name[0] : '?')}<div><div class="nm">${seen ? d.name : '???'} ${d.boss ? chip('BOSS', '#ff9a9d') : ''}</div>
        <div class="ds">${ZONES[d.zone].name}${seen ? ` · HP <b>${fmt(d.hp)}</b> · Gold <b>${fmt(d.gold)}</b> · Defeated <b>${fmt(S.counts[id] || 0)}</b>` : ' · Defeat one to reveal'}</div><div class="chips" style="margin-top:6px">${loot}</div></div><div class="acts"></div></div>`;
    }
  } else if (k === 'codes') {
    title.textContent = 'Codes';
    html += `<div class="note">Enter a code for free rewards. Code signs are hidden around the map, and codes from the original game work too.</div>
      <div class="coderow"><input id="codeIn" placeholder="Enter code" maxlength="20" autocomplete="off" /><button class="buy" data-act="redeem">Redeem</button></div>
      <div class="sect">Redeemed</div><div class="chips">${Object.keys(S.codes).map((c) => chip(c, '#bff5cc')).join('') || '<span class="ds">None yet</span>'}</div>`;
  } else if (k === 'save') {
    title.textContent = 'Save & Load';
    html += `<div class="note">Progress is not stored when you close the page. Copy a save code and paste it here next time.</div>
      <div class="sect">Your save code</div>
      <textarea id="saveOut" readonly rows="3" class="code">${makeSave()}</textarea>
      <div><button class="buy" data-act="copysave">Copy code</button></div>
      <div class="sect">Load a save</div>
      <textarea id="saveIn" rows="3" class="code" placeholder="Paste a save code (AC3-...)"></textarea>
      <div><button class="buy" data-act="loadsave">Load save</button></div>`;
  } else if (k === 'help') {
    title.textContent = 'How to Play';
    html += `<div class="note" style="font-size:15px;line-height:1.55;color:#dfe2f2">
      <b>1.</b> You start with a Sword barrack. Walk onto the blue <b>Barracks</b> pad to buy troops into it and build more barracks on your 10 plots.<br>
      <b>2.</b> <b>Click</b> a tree, flower, rock or enemy and your whole army attacks it. Resources go into your bag, enemies drop gold.<br>
      <b>3.</b> Bring your bag to the gold <b>Sell</b> pad. Spend gold on troops, weapons, armor, bags and wands.<br>
      <b>4.</b> Barracks level up from fighting and gain troop slots at levels 4, 8 and 12. Equip weapons and armor per barrack.<br>
      <b>5.</b> Areas unlock by how many units you own: Riverlands 5, Mountains 10, Desert 15, Atlantis 25.<br>
      <b>6.</b> Regular bosses are available through their normal summons/gates. <b>Roaming bosses</b> awaken after <b>3 rebirths</b> and then begin appearing across unlocked areas.<br>
      <b>7.</b> Talk to Tom, Emma and Mr. File for quests. Spin the Lucky Wheel, craft potions, and redeem codes.<br>
      <b>8.</b> Hidden areas now sit behind rebirth milestones: <b>Mushroom Forest</b> needs 1 rebirth, <b>Ouroboros</b> needs 2, and <b>Magic Forest</b> needs 3 plus its boss requirement.<br>
      <b>9.</b> The <b>Enchanter</b> in Ouroboros enchants weapons and armor with Ancient Fragments. Craft summons for the Spider Queen and the World Eater, and collect 6 gems for the Minotaur.<br>
      <b>10.</b> Every area has a gold <b>Dispenser</b> that refills every 5 minutes. Buy hats, boots and belts at the Riverlands accessory store. Teleport with <b>T</b>.<br>
      <b>11.</b> <b>Command Contracts</b> are short objectives that refresh about every two minutes. Finish them for gold and permanent Command Shards.<br>
      <b>12.</b> <b>Command Legacy</b> (<b>L</b>) is permanent progression. Spend Command Shards on troop damage, bag capacity, gold, luck and movement speed; Legacy survives rebirths.<br>
      <b>13.</b> Roaming bosses awaken after 3 rebirths. The late frontier then unlocks progressively at 4, 5, 6, 7, 8 and 10 rebirths. The game auto-saves in your browser.<br><br>
      <b>WASD</b> move · <b>Click ground</b> walk · <b>Space</b> jump · <b>Right-drag / Q E</b> camera · <b>Wheel</b> zoom · <b>Shift</b> sprint · <b>F</b> rally · <b>G / V</b> skills · <b>T</b> teleport · <b>Tab</b> army · <b>J</b> quests · <b>I</b> index · <b>C</b> codes · <b>M</b> sound</div>`;
  }
  else if (k === 'accessories') {
    title.textContent = 'Accessory Store';
    const slots = Object.keys(ACC);
    tabHtml = slots.map((c, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${ACC_INFO[c].label}</button>`).join('');
    const slot = slots[panelState.tab] || 'hat';
    const stat = ACC_INFO[slot].stat;
    html += `<div class="note">Accessories are worn by you, not your troops. Hats boost <b>luck</b>, boots boost <b>walk speed</b> and belts boost <b>gold</b>. One of each can be worn.</div>`;
    for (const [id] of ACC[slot]) {
      const it = ITEMS[id], own = S.owned[id], worn = S[slot] === id;
      let act;
      if (worn) act = '<span class="tag">WORN</span>';
      else if (own) act = `<button class="buy gray" data-act="wear" data-id="${id}">Wear</button>`;
      else if (!it.cost) act = lockTag('DROP / CODE');
      else if (!zoneUnlocked(it.zone)) act = lockTag(`Unlock ${ZONES[it.zone].name}`);
      else act = `<button class="buy" data-act="buyitem" data-id="${id}" ${S.gold < it.cost ? 'disabled' : ''}>${fmt(it.cost)}</button>`;
      html += `<div class="row ${own ? 'owned' : ''} ${!own && (!it.cost || !zoneUnlocked(it.zone)) ? 'locked' : ''}">${swatch(it.color, '')}<div><div class="nm">${it.name}</div><div class="ds">+${Math.round(it.v * 100)}% ${stat}</div></div><div class="acts">${act}</div></div>`;
    }
  } else if (k === 'enchant') {
    title.textContent = 'The Enchanter';
    const frags = S.items.ancient_fragment || 0;
    tabHtml = ['Weapons', 'Armor', 'Odds'].map((n, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('');
    html += `<div class="chips">${chip(`Ancient Fragments x${frags}`, '#d09bff')}</div><div class="note">Each enchant costs <b>1 Ancient Fragment</b> and rolls a random enchantment. Enchanting again replaces the old one. Fragments drop in the Desert and Ouroboros, can be crafted, and code <b>FORGOTTEN</b> gives some for free.</div>`;
    if (panelState.tab === 2) {
      for (const kind of ['weapon', 'armor']) {
        const tot = ENCHANTS[kind].reduce((a, e) => a + e.w, 0);
        html += `<div class="sect">${kind === 'weapon' ? 'Weapon' : 'Armor'} enchants</div>`;
        for (const e of ENCHANTS[kind]) html += `<div class="row"><div class="sw" style="background:${e.color}"></div><div><div class="nm" style="color:${e.color}">${e.name}</div><div class="ds">${e.desc}</div></div><div class="acts"><span class="tag">${Math.round(e.w / tot * 1000) / 10}%</span></div></div>`;
      }
    } else {
      const kind = panelState.tab === 0 ? 'weapon' : 'armor';
      const list = Object.values(ITEMS).filter((it) => it.type === kind && S.owned[it.id]);
      if (!list.length) html += `<div class="note">You don't own any ${kind === 'weapon' ? 'weapons' : 'armor'} yet.</div>`;
      for (const it of list) {
        const e = S.ench[it.id] ? ENCHANTS[kind].find((x) => x.id === S.ench[it.id]) : null;
        html += `<div class="row ${e ? 'owned' : ''}">${swatch(it.color, '')}<div><div class="nm">${it.name} ${e ? `<span class="ench-tag" style="color:${e.color}">${e.name}</span>` : ''}</div><div class="ds">${itemStat(it)}${e ? ' · ' + e.desc : ''}</div></div>
          <div class="acts"><button class="buy" data-act="enchant" data-id="${it.id}" ${frags ? '' : 'disabled'}>${e ? 'Re-roll' : 'Enchant'}</button></div></div>`;
      }
    }
  } else if (k === 'altar') {
    const a = ALTARS[panelState.tab];
    title.textContent = a.name;
    const opts = [{ boss: a.boss, need: a.need }].concat(a.alt ? [a.alt] : []);
    for (const [i, o] of opts.entries()) {
      const d = ENEMIES[o.boss], boss = entities.find((x) => x.typeId === o.boss);
      const has = Object.entries(o.need).every(([id, n]) => (S.items[id] || 0) >= n);
      const reqs = Object.entries(o.need).map(([id, n]) => chip(`${KEY[id].name} ${Math.min(S.items[id] || 0, n)}/${n}`, (S.items[id] || 0) >= n ? '#bff5cc' : '#ffb3b6')).join('');
      html += `<div class="row">${swatch(d.boss ? 0xff3d6b : 0x888888, 'B')}<div><div class="nm">${d.name} ${chip(fmt(d.hp) + ' HP', '#ff9a9d')}</div><div class="ds">${boss && boss.alive ? 'Already summoned. Defeat it first' : 'Uses up the items below'}</div><div class="chips" style="margin-top:6px">${reqs}</div></div>
        <div class="acts"><button class="buy" data-act="summon" data-i="${i}" ${has && !(boss && boss.alive) ? '' : 'disabled'}>Summon</button></div></div>`;
    }
    if (a.id === 'web') html += `<div class="note">Craft the Spider Queen Summon at the Crafter with Spider Silk and Coloured Mushrooms.</div>`;
    if (a.id === 'throne') html += `<div class="note">Sit on the throne with the Sun and Moon Fragments. Both are made at the Crafter. The World Eater can drop a Primal Core.</div>`;
    if (a.id === 'labyrinth') html += `<div class="note">The Minotaur needs a gem from almost every area: Forest, Riverlands, Mountains, Desert, Atlantis and the Mushroom Forest. Gems drop from enemies and bosses there.</div>`;
  } else if (k === 'annexgate') {
    const g = annexGateObjs[panelState.tab], Z = ZONES[g.zone];
    title.textContent = g.zone === 6 ? 'Mysterious Fragments' : Z.name + ' Toll';
    const bossOk = !g.req.boss || S.bossesDown[g.req.boss];
    html += `<div class="note">${g.zone === 6 ? 'Two mysterious fragments float by the gate. Pour gold into them to open the way to Ouroboros.' : 'The Magic Forest only lets in those who beat the Spider Queen and pay the toll.'}</div>
      <div class="chips">${g.req.boss ? chip(`Defeat ${ENEMIES[g.req.boss].name}`, bossOk ? '#bff5cc' : '#ffb3b6') : ''}${chip(`${fmt(g.req.gold)} gold`, S.gold >= g.req.gold ? '#bff5cc' : '#ffb3b6')}</div>
      <div style="margin-top:12px">${g.open ? '<span class="tag">OPEN</span>' : `<button class="buy" data-act="payannex" data-i="${panelState.tab}" ${bossOk && S.gold >= g.req.gold ? '' : 'disabled'}>Pay ${fmt(g.req.gold)}</button>`}</div>`;
  } else if (k === 'teleport') {
    title.textContent = 'Teleport';
    html += `<div class="note">Teleport you and your whole army to any area you have unlocked. Press <b>T</b> anywhere.</div>`;
    html += `<div class="note">Star an area to pin it to the top as a favourite.</div>`;
    ZONES.map((z, i) => i).sort((a, b) => (S.favTp[b] ? 1 : 0) - (S.favTp[a] ? 1 : 0) || a - b).forEach((i) => {
      const z = ZONES[i], ok = zoneUnlocked(i), here = zoneAt(player.pos.x, player.pos.z) === i;
      html += `<div class="row ${ok ? '' : 'locked'}">${swatch(z.ground, i + 1)}<div><div class="nm">${z.name} ${here ? chip('YOU ARE HERE', '#bff5cc') : ''}</div><div class="ds">${z.sub}</div></div><div class="acts">${ok ? `<button class="buy gray fav ${S.favTp[i] ? 'on' : ''}" data-act="fav" data-i="${i}" aria-label="Favourite">${S.favTp[i] ? '&#9733;' : '&#9734;'}</button><button class="buy" data-act="tp" data-i="${i}" ${here ? 'disabled' : ''}>Go</button>` : lockTag('LOCKED')}</div></div>`;
    });
  } else if (k === 'pets') {
    title.textContent = 'Eggs & Pets';
    tabHtml = ['Hatch Eggs', `My Pets (${S.pets.length}/${MAX_PETS})`].map((n, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('');
    const eq = ['dmg', 'hp', 'gold', 'luck'].map((b) => chip(`${b === 'dmg' ? 'Damage' : b === 'hp' ? 'Health' : b[0].toUpperCase() + b.slice(1)} +${Math.round(petBonus(b) * 100)}%`, '#bff5cc')).join('');
    html += `<div class="chips">${eq}</div>`;
    if (panelState.tab === 0) {
      html += `<div class="note">Hatch eggs with gold. Pets follow you and boost your whole army. Up to 3 pets can be equipped. Luck makes rare pets more likely.</div>`;
      for (const egg of EGGS) {
        const ok = zoneUnlocked(egg.zone);
        const odds = egg.pets.map(([id, nm, r]) => `<span class="chip" style="color:${RARITY[r].color}">${S.hatched[egg.id] && S.pets.some((p) => p.id === id) || ok ? nm : '???'}</span>`).join('');
        html += `<div class="row ${ok ? '' : 'locked'}">${swatch(egg.color, '')}<div><div class="nm">${egg.name} ${S.hatched[egg.id] ? chip('x' + S.hatched[egg.id]) : ''}</div><div class="ds">${ZONES[egg.zone].name} egg</div><div class="chips" style="margin-top:4px">${odds}</div></div>
          <div class="acts">${ok ? `<button class="buy" data-act="hatch" data-id="${egg.id}" data-i="1" ${S.gold < egg.cost ? 'disabled' : ''}>Hatch ${fmt(egg.cost)}</button><button class="buy gray" data-act="hatch" data-id="${egg.id}" data-i="3" ${S.gold < egg.cost * 3 ? 'disabled' : ''}>x3 ${fmt(egg.cost * 3)}</button>` : lockTag(`Unlock ${ZONES[egg.zone].name}`)}</div></div>`;
      }
     } else {
      html += `<div style="margin-bottom:8px">
        <button class="buy" data-act="petbest">Equip best</button>
        <button class="buy gray" data-act="petcommons">Delete unequipped commons</button>
      </div>`;

      if (!S.pets.length) {
        html += `<div class="note">No pets yet. Hatch an egg first.</div>`;
      }

      // Show one fusion button per species and tier when three are available.
      const groups = new Map();
      for (const pet of S.pets) {
        const tier = petTier(pet);
        const key = `${pet.id}:${tier}`;
        groups.set(key, (groups.get(key) || 0) + 1);
      }

      let fusionHtml = '';
      for (const [key, count] of groups) {
        const [id, tierText] = key.split(':');
        const tier = Number(tierText);

        if (count < 3 || tier >= PET_TIERS.length - 1) continue;

        const nextTier = tier + 1;
        const name = PET_BY_ID[id].name;

        fusionHtml += `<div class="row">
          ${swatch(PET_BY_ID[id].color, '3')}
          <div>
            <div class="nm">${name} fusion</div>
            <div class="ds">Combine 3 ${tier ? `${petTierName(tier)} ` : ''}${name} pets into 1 ${petTierName(nextTier)} pet.</div>
          </div>
          <div class="acts">
            <button class="buy" data-act="petfuse" data-id="${id}" data-tier="${tier}">Fuse (${count} available)</button>
          </div>
        </div>`;
      }

      if (fusionHtml) {
        html += `<div class="sect">Pet Fusion</div>${fusionHtml}`;
      }

      const rk = Object.keys(RARITY);
      for (const pet of [...S.pets].sort((a, b) =>
        (S.petEq.includes(b.uid) - S.petEq.includes(a.uid)) ||
        petTier(b) - petTier(a) ||
        rk.indexOf(PET_BY_ID[b.id].rar) - rk.indexOf(PET_BY_ID[a.id].rar)
      )) {
        const pd = PET_BY_ID[pet.id];
        const tier = petTier(pet);
        const tierName = petTierName(tier);
        const equipped = S.petEq.includes(pet.uid);

        html += `<div class="row ${equipped ? 'owned' : ''}">
          ${swatch(pd.color, '')}
          <div>
            <div class="nm">
              ${tierName ? `${tierName} ` : ''}${pd.name}
              <span class="chip" style="color:${RARITY[pd.rar].color}">${RARITY[pd.rar].name}</span>
            </div>
            <div class="ds">${petBonusText(pd.bonus, tier)}</div>
          </div>
          <div class="acts">
            <button class="buy ${equipped ? '' : 'gray'}" data-act="peteq" data-i="${pet.uid}">${equipped ? 'Unequip' : 'Equip'}</button>
            <button class="buy gray del" data-act="petdel" data-i="${pet.uid}">Delete</button>
          </div>
        </div>`;
      }
    }

  } else if (k === 'research') {
    title.textContent = "Scientist's Lab";
    html += `<div class="note">"Ah, a commander! Bring me gold and I will make your army stronger. Forever." Research upgrades are permanent. Each <b>Alien Core</b> from a UFO buys one free level. You have <b>${S.items.alien_core || 0}</b>.</div>`;
    for (const r of RESEARCH) {
      const lv = S.research[r.id] || 0, max = lv >= r.max, c = researchCost(r);
      html += `<div class="row">${swatch(0x39e6ff, lv)}<div><div class="nm">${r.name} ${chip(`Lv ${lv}/${r.max}`)}</div><div class="ds">${r.desc} · Now <b>+${Math.round(lv * r.per * 100)}%</b></div><div class="bar xp"><div style="width:${lv / r.max * 100}%"></div></div></div>
        <div class="acts">${max ? lockTag('MAX') : `<button class="buy" data-act="research" data-id="${r.id}" ${S.gold < c ? 'disabled' : ''}>${fmt(c)}</button><button class="buy gray" data-act="researchcore" data-id="${r.id}" ${(S.items.alien_core || 0) > 0 ? '' : 'disabled'}>Use Core</button>`}</div></div>`;
    }
  } else if (k === 'war') {
    title.textContent = 'War';
    const pts = S.war.pts;
    html += `<div class="note">Three factions are at war. Join one, then walk your army to a <b>War Flag</b> in any area. Beat the guards and stand in the circle to capture it. Flags you hold pay gold every minute, but enemy factions will try to take them back.</div>`;
    FACTIONS.forEach((f, i) => {
      const held = S.war.flags.filter((o) => o === i).length;
      html += `<div class="row ${S.war.side === i ? 'owned' : ''}">${swatch(f.color, held)}<div><div class="nm">${f.name} ${S.war.side === i ? chip('YOUR SIDE', '#bff5cc') : ''}</div><div class="ds">Flags <b>${held}/${WAR_FLAGS.length}</b> · War points <b>${fmt(pts[i])}</b></div></div><div class="acts">${S.war.side === i ? lockTag('JOINED') : `<button class="buy ${S.war.side === null ? '' : 'gray'}" data-act="faction" data-i="${i}">${S.war.side === null ? 'Join' : 'Switch side'}</button>`}</div></div>`;
    });
    if (S.war.side !== null) html += `<div class="note">Income: <b>${fmt(warIncome() * goldMult())}</b> gold per minute · Flags captured: <b>${S.war.caps}</b></div>`;
    html += `<div class="chips">${flagObjs.map((f) => { const o = S.war.flags[f.i]; return `<span class="chip" style="color:${o >= 0 ? FACTIONS[o].css : '#fff'}">${ZONES[f.zi].name}: ${o >= 0 ? FACTIONS[o].name : 'none'}</span>`; }).join('')}</div>`;
  } else if (k === 'rebirth') {
    title.textContent = 'Rebirth';
    const r = S.rebirths || 0, uOk = soldiers.length >= rebirthUnits(r), gOk = S.gold >= rebirthCost(r);
    html += `<div class="note">Rebirth to start your gold and barrack levels again, but stronger. Every rebirth gives your army <b>+25% damage</b> and <b>+50% gold</b> forever. You keep your barracks, items, pets, areas, research and quests. Units go back to the first slot of each barrack.</div>`;
    html += `<div class="chips">${chip(`Rebirths ${r}`, '#ffc83d')}${chip(`Damage x${rebirthDmg().toFixed(2)}`, '#bff5cc')}${chip(`Gold x${rebirthGold().toFixed(1)}`, '#bff5cc')}</div>`;
    html += `<div class="sect">Rebirth Unlocks</div>`;
    for (const [need,name,desc] of REBIRTH_UNLOCKS) { const got=r>=need; html += `<div class="row ${got?'owned':'locked'}">${swatch(got?0x52d273:0x555b78, got?'✓':need)}<div><div class="nm">${name} ${chip(`${need} rebirth${need===1?'':'s'}`)}</div><div class="ds">${desc}</div></div><div class="acts">${got?'<span class="tag">UNLOCKED</span>':lockTag(`${Math.max(0,need-r)} more`)}</div></div>`; }
    html += `<div class="row">${swatch(0xffc83d, r + 1)}<div><div class="nm">Rebirth ${r + 1}</div><div class="ds">Next: damage x${(1 + 0.25 * (r + 1)).toFixed(2)}, gold x${(1 + 0.5 * (r + 1)).toFixed(1)}</div><div class="chips" style="margin-top:4px">${chip(`${soldiers.length}/${rebirthUnits(r)} units`, uOk ? '#bff5cc' : '#ffb3b6')}${chip(`${fmt(rebirthCost(r))} gold`, gOk ? '#bff5cc' : '#ffb3b6')}</div></div>
      <div class="acts"><button class="buy ${panelState.confirmReb ? 'red' : ''}" data-act="rebirth" ${uOk && gOk ? '' : 'disabled'}>${panelState.confirmReb ? 'Confirm' : 'Rebirth'}</button></div></div>`;
  } else if (k === 'ruby') {
    title.textContent = 'Ruby Golem';
    const q = RUBY_QUESTS[S.ruby.lvl];
    html += `<div class="note">"Commander. I test only the strongest armies. Finish my quests and I will give you gold and a title." Quests done: <b>${S.ruby.lvl}/${RUBY_QUESTS.length}</b>.</div>`;
    html += `<div class="bar xp" style="margin:6px 0 12px"><div style="width:${S.ruby.lvl / RUBY_QUESTS.length * 100}%"></div></div>`;
    if (!q) html += `<div class="note">You finished every quest. You are a <b>Ruby Champion</b>.</div>`;
    else {
      const [p, n] = rubyProgress(), done = S.ruby.on && p >= n;
      html += `<div class="row">${swatch(0xe0353b, S.ruby.lvl + 1)}<div><div class="nm">${q.text}</div><div class="ds">${S.ruby.on ? `Progress <b>${fmt(Math.min(p, n))}/${fmt(n)}</b> · ` : ''}Reward <b>${fmt(rubyReward(S.ruby.lvl))} gold</b>${[3, 7, 11].includes(S.ruby.lvl) ? ' + a new title' : ''}</div></div><div class="acts"><button class="buy" data-act="ruby" ${S.ruby.on && !done ? 'disabled' : ''}>${!S.ruby.on ? 'Accept' : done ? 'Turn in' : 'In progress'}</button></div></div>`;
    }
    html += `<div class="chips">${RUBY_QUESTS.map((x, i) => `<span class="chip" style="color:${i < S.ruby.lvl ? '#bff5cc' : i === S.ruby.lvl ? '#ffc83d' : '#8a90a8'}">${i + 1}. ${x.text}</span>`).join('')}</div>`;
  } else if (k === 'bank') {
    title.textContent = 'Atlantis Castle Bank';
    html += `<div class="note">Deposit gold and it earns <b>${BANK_RATE * 100}%</b> interest every minute you play (up to ${fmt(BANK_CAP)} counts toward interest). Withdraw any time.</div>`;
    html += `<div class="row">${swatch(0xffd84a, '$')}<div><div class="nm">Balance ${chip(fmt(S.bank) + ' gold')}</div><div class="ds">Next interest in <b>${clock(Math.max(0, 60 - S.bankT))}</b> · +${fmt(Math.min(S.bank, BANK_CAP) * BANK_RATE)} · Total earned <b>${fmt(S.bankEarned)}</b></div></div>
      <div class="acts"><button class="buy gray" data-act="bankdep" data-i="0.5" ${S.gold >= 2 ? '' : 'disabled'}>Deposit half</button><button class="buy" data-act="bankdep" data-i="1" ${S.gold >= 1 ? '' : 'disabled'}>Deposit all</button><button class="buy gray" data-act="bankwd" ${S.bank > 0 ? '' : 'disabled'}>Withdraw</button></div></div>`;
  } else if (k === 'raid') {
    title.textContent = 'Mine Raid';
    const R = S.raid;
    html += `<div class="note">Fight ${RAID_WAVES} waves of Cave Bats and Mine Golems that pour out of the portal, then beat the Mine Lord. You have 4 minutes and must stay inside the Mine. Higher levels need more units and pay much more. Best cleared: <b>${S.raidBest || 'none'}</b>.</div>`;
    if (R.active) html += `<div class="note"><b>Raid in progress</b> · Level ${R.lvl} · Wave ${R.wave}/${RAID_WAVES} · ${clock(R.end - R.t)} left · ${raidAlive()} enemies left</div>`;
    else if (S.time < S.raidCd) html += `<div class="note">The Mine is resting. Next raid in <b>${clock(S.raidCd - S.time)}</b></div>`;
    RAID_LEVELS.forEach((L, i) => {
      const ok = soldiers.length >= L.units;
      html += `<div class="row ${ok ? '' : 'locked'}">${swatch(0xff8a2a, L.n)}<div><div class="nm">Raid Level ${L.n} ${S.raidBest >= L.n ? chip('CLEARED', '#bff5cc') : ''}</div><div class="ds">Needs <b>${L.units}</b> units · Enemies x${fmt(L.mul)} · Reward <b>${fmt(15000 * L.mul)}</b> gold + ${L.n} Ancient Fragment${L.n > 1 ? 's' : ''}</div></div>
        <div class="acts">${ok ? `<button class="buy" data-act="raid" data-i="${L.n}" ${R.active || S.time < S.raidCd ? 'disabled' : ''}>Start</button>` : lockTag(`${L.units} UNITS`)}</div></div>`;
    });
  } else if (k === 'gifts') {
    title.textContent = 'Gifts & Shell Hunt';
    tabHtml = ['Playtime Gifts', 'Shell Hunt'].map((n, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('');
    if (panelState.tab === 0) {
      html += `<div class="note">Free gifts for playing. Time played: <b>${clock(S.time)}</b></div>`;
      GIFTS.forEach((g, i) => {
        const ready = S.time >= g.t, got = S.gifts[i];
        const what = [g.give.gold ? fmt(g.give.gold) + ' gold' : '', ...Object.entries(g.give.pot || {}).map(([p, n]) => `${POTIONS[p].name} x${n}`), ...Object.entries(g.give.key || {}).map(([p, n]) => `${KEY[p].name} x${n}`), g.give.item ? ITEMS[g.give.item].name : ''].filter(Boolean).join(', ');
        html += `<div class="row ${got ? 'owned' : ''}">${swatch(0xffc83d, i + 1)}<div><div class="nm">${g.label} gift</div><div class="ds">${what}</div></div><div class="acts">${got ? lockTag('CLAIMED') : ready ? `<button class="buy" data-act="gift" data-i="${i}">Claim</button>` : lockTag(clock(g.t - S.time))}</div></div>`;
      });
    } else {
      const n = Object.keys(S.shells).length;
      html += `<div class="note">${SHELLS.length} pink sea shells are hidden around the world, including the hidden areas. Walk over one to pick it up. Found <b>${n}/${SHELLS.length}</b>.</div>`;
      html += `<div class="bar xp" style="margin:6px 0 12px"><div style="width:${n / SHELLS.length * 100}%"></div></div>`;
      for (const [k2, r] of Object.entries(SHELL_REWARDS)) {
        const what = [r.gold ? fmt(r.gold) + ' gold' : '', ...Object.entries(r.pot || {}).map(([p, m]) => `${POTIONS[p].name} x${m}`), ...Object.entries(r.key || {}).map(([p, m]) => `${KEY[p].name} x${m}`), r.item ? ITEMS[r.item].name : ''].filter(Boolean).join(', ');
        html += `<div class="row ${n >= +k2 ? 'owned' : ''}">${swatch(0xffb3a0, k2)}<div><div class="nm">${k2} shells</div><div class="ds">${what}</div></div><div class="acts">${n >= +k2 ? lockTag('DONE') : ''}</div></div>`;
      }
      html += `<div style="margin-top:10px"><button class="buy ${S.shellRadar ? '' : 'gray'}" data-act="radar" ${n >= 10 ? '' : 'disabled'}>Shell Radar ${S.shellRadar ? 'ON' : 'OFF'}</button> <span class="ds">${n >= 10 ? 'Shows the missing shells on the World Map' : 'Unlocks at 10 shells'}</span></div>`;
    }
  } else if (k === 'season') {
    title.textContent=SEASON.name; refreshSeasonCalendar();
    tabHtml=['Pass','Calendar','Event Shop'].map((n,i)=>`<button class="${panelState.tab===i?'on':''}" data-tab="${i}">${n}</button>`).join('');
    const xp=Number(S.season.xp)||0;
    if(panelState.tab===0){
      const tier=seasonTier(); html+=`<div class="season-hero"><div class="season-big">FRONTIER PASS</div><div class="season-points">Tier ${tier}/${SEASON.maxTier} · ✦ ${fmt(S.season.tickets||0)}</div><div class="note">Earn Season XP from normal play. Every tier is free and permanent for this season.</div></div><div class="sect">Reward Track</div>`;
      SEASON.tiers.forEach((r,i)=>{const t=i+1,ok=xp>=t*SEASON.tierSize,got=!!S.season.claimed[`tier:${t}`],parts=[];if(r.gold)parts.push(`${fmt(r.gold)} gold`);if(r.tickets)parts.push(`${r.tickets} Tickets`);if(r.bxp)parts.push(`${fmt(r.bxp)} Barrack XP`);if(r.item&&ITEMS[r.item])parts.push(ITEMS[r.item].name);if(r.pot)parts.push(...Object.entries(r.pot).map(([k,n])=>`${POTIONS[k].name} x${n}`));if(r.key)parts.push(...Object.entries(r.key).map(([k,n])=>`${KEY[k].name} x${n}`));html+=`<div class="row ${got?'owned':ok?'':'locked'}">${swatch(ok?SEASON.color:0x555b78,t)}<div><div class="nm">Tier ${t}</div><div class="ds">${parts.join(' · ')}</div></div><div class="acts">${got?lockTag('CLAIMED'):ok?`<button class="buy" data-act="season-tier" data-i="${t}">Claim</button>`:lockTag(fmt(t*SEASON.tierSize)+' XP')}</div></div>`;});
    } else if(panelState.tab===1){
      const t=seasonToday(),d=SEASON.daily[t.day===0?6:t.day-1],claimed=!!S.season.claimed[`day:${t.key}`],p=seasonWeeklyProgress();html+=`<div class="season-hero"><div class="season-big">DAILY FIELD CALENDAR</div><div class="season-points">Streak ${S.season.streak||0}/7 · ${d.label}</div><div class="note">Claim once per day. Missing a day resets the streak, but never deletes your Season XP.</div></div><div class="row ${claimed?'owned':''}">${swatch(0xffc83d,t.day||7)}<div><div class="nm">Today's reward</div><div class="ds">${d.tickets} Festival Tickets${d.give.gold?` · ${fmt(d.give.gold)} gold`:''}${d.give.pot?' · potion cache':''}${d.give.key?' · fragment':''}</div></div><div class="acts">${claimed?lockTag('CLAIMED'):`<button class="buy" data-act="season-day">Claim</button>`}</div></div><div class="sect">Weekly Frontier Order</div><div class="row ${S.season.weekClaimed?'owned':''}">${swatch(0x8fe0ff,'W')}<div><div class="nm">75 Kills + 150 Refined</div><div class="ds">${p.kills}/75 kills · ${p.sold}/150 refined · Reward <b>12 Tickets + 250 XP + 3 Shards</b></div></div><div class="acts">${S.season.weekClaimed?lockTag('CLAIMED'):`<button class="buy" data-act="season-week" ${p.kills>=75&&p.sold>=150?'':'disabled'}>Claim</button>`}</div></div>`;
    } else {
      html+=`<div class="season-hero"><div class="season-big">EVENT SHOP</div><div class="season-points">✦ ${fmt(S.season.tickets||0)} Festival Tickets</div><div class="note">Spend tickets earned from play. No Robux required.</div></div>`;
      for(const it of SEASON.shop){const ok=(S.season.tickets||0)>=it.cost;html+=`<div class="row"><div class="sw" style="background:${hex(SEASON.color)}">✦</div><div><div class="nm">${it.name}</div><div class="ds">${it.desc}</div></div><div class="acts"><button class="buy" data-act="season-shop" data-id="${it.id}" ${ok?'':'disabled'}>${it.cost} ✦</button></div></div>`;}
    }
  } else if (k === 'bounties') {
    title.textContent = 'Bounty Board';
    const left = Math.max(0, (S.bounty?.ends||0) - S.time);
    html += `<div class="season-hero" style="border-color:#ffc83d"><div class="season-big">LIVE BOUNTIES</div><div class="season-points">${left ? `Refresh in ${clock(left)}` : 'Refreshing...' } · Completed ${fmt(S.bounty?.completed||0)} · Streak ${fmt(S.bounty?.streak||0)}</div><div class="note">Hunt targets across unlocked regions. Finished bounties pay gold, Command Shards, Season XP and Commander XP. Clear the board for an instant bonus rotation.</div></div>`;
    for (let i=0;i<(S.bounty?.slots||[]).length;i++) {
      const b=S.bounty.slots[i], d=ENEMIES[b.target], done=b.progress>=b.goal;
      html += `<div class="row ${b.claimed?'owned':''} ${done&&!b.claimed?'bounty-live':''}">${swatch(d?.shirt||0xffc83d, i+1)}<div><div class="nm">${b.kind.toUpperCase()} · ${d?d.name:b.target}</div><div class="ds">${d?ZONES[d.zone].name:'Unknown'} · <b>${fmt(b.progress)}/${fmt(b.goal)}</b> defeats · Reward <b>${fmt(b.reward)} gold + ${b.shards} ◈</b></div><div class="bar xp"><div style="width:${Math.min(100,b.progress/b.goal*100)}%"></div></div></div><div class="acts">${b.claimed?lockTag('CLAIMED'):done?`<button class="buy" data-act="bounty" data-i="${i}">Claim</button>`:lockTag('IN PROGRESS')}</div></div>`;
    }
    if (!S.bounty?.slots?.length) html += `<div class="note">The board is preparing your first contracts...</div>`;
  } else if (k === 'expeditions') {
    title.textContent = 'Expeditions';
    html += `<div class="season-hero" style="border-color:#ff6fd8"><div class="season-big">FRONTIER EXPEDITIONS</div><div class="season-points">${S.expedition.active ? 'IN PROGRESS' : `${fmt(S.expedition.clears||0)} clears`}</div><div class="note">Timed multi-wave army challenges. Complete all waves for Command Shards, Season XP and a big gold payout. Higher difficulty gives stronger enemies and better rewards.</div></div>`;
    for(const x of EXPEDITIONS){
      const ok=expeditionUnlocked(x), active=S.expedition.active&&S.expedition.id===x.id, cd=Number(S.expedition.cooldowns?.[x.id])||0, ready=S.time>=cd;
      for(const diff of [1,2,3]){
        const mult=diff===1?'Scout':diff===2?'Veteran':'Nightmare'; const can=ok&&ready&&!S.expedition.active;
        html += `<div class="row ${active&&S.expedition.difficulty===diff?'owned':''} ${ok?'':'locked'}"><div class="sw" style="background:${hex(x.color)}">${diff}</div><div><div class="nm">${x.name} · ${mult}</div><div class="ds">${x.desc} · <b>${x.waves}</b> waves · <b>${fmt(x.minUnits)}</b> units · Base reward <b>${fmt(x.baseGold* (diff===1?1:diff===2?1.7:2.7))} gold</b> + ${x.shard} ◈</div></div><div class="acts">${active&&S.expedition.difficulty===diff?lockTag(`WAVE ${S.expedition.wave}/${S.expedition.waves}`):ready?`<button class="buy" data-act="expedition" data-id="${x.id}" data-diff="${diff}" ${can?'':'disabled'}>Start</button>`:lockTag(clock(cd-S.time))}</div></div>`;
      }
    }
    html += `<div class="note">Best clear: <b>${fmt(S.expedition.best||0)}</b> waves. Finish an expedition to build your permanent clear count; the timer is the only thing that can end it early.</div>`;
  } else if (k === 'archive') {
    title.textContent = 'Grand Archive';
    const ap=archiveProgress(), grade=archiveGrade();
    const discovered=Object.keys(S.disc||{}).length, loot=Object.keys(S.lootDisc||{}).length, secrets=Object.keys(S.secrets||{}).length, relics=Object.keys(S.relics||{}).length;
    html += `<div class="archive-hero"><div class="archive-big">GRAND ARCHIVE</div><div class="archive-grade">${grade}</div><div class="archive-score">Mastery <b>${ap.done}/${ap.total}</b> · ${ap.pct}% complete</div><div class="archive-ring"><div class="archive-stat"><b>${discovered}</b><span>Enemies</span></div><div class="archive-stat"><b>${loot}</b><span>Loot</span></div><div class="archive-stat"><b>${secrets+relics}</b><span>Secrets + Relics</span></div></div></div>`;
    html += `<div class="sect">Mastery Goals</div>`;
    for(const g of ARCHIVE_GOALS){const p=Math.min(g.goal,archiveMetric(g)),done=!!S.archive?.claimed?.[g.id],pct=Math.min(100,p/g.goal*100);html+=`<div class="row archive-row ${done?'owned':''}">${swatch(done?0x52d273:0xb36bff,done?'✓':'◆')}<div><div class="nm">${g.name}</div><div class="ds">${g.text} · <b>${fmt(p)}/${fmt(g.goal)}</b> · Reward <b>+${g.reward} ◈</b></div><div class="bar xp"><div style="width:${pct}%"></div></div></div><div class="acts">${done?'<span class="tag archive-check">MASTERED</span>':lockTag(`${Math.round(p/g.goal*100)}%`)}</div></div>`;}
    html += `<div class="sect">Archive Ranks</div>`;
    for(const r of ARCHIVE_RANKS){const got=!!S.archive?.ranks?.[r.name];html+=`<div class="row ${got?'owned':''}">${swatch(got?0xffc83d:0x555b78,r.n)}<div><div class="nm">${r.name}</div><div class="ds">Complete ${r.n} mastery goals · Reward <b>+${r.reward} ◈</b> + gold cache</div></div><div class="acts">${got?'<span class="tag">UNLOCKED</span>':lockTag(`${Math.min(ap.done,r.n)}/${r.n}`)}</div></div>`;}
    html += `<div class="note">Archive rewards are permanent and are earned from the game systems you already play.</div>`;
  } else if (k === 'settings') {
    title.textContent = 'Settings';
    const tg = (key, label, desc) => `<div class="row">${swatch(S[key] ? 0x52d273 : 0x6b7194, '')}<div><div class="nm">${label}</div><div class="ds">${desc}</div></div><div class="acts"><button class="buy ${S[key] ? '' : 'gray'}" data-act="set" data-id="${key}">${S[key] ? 'ON' : 'OFF'}</button></div></div>`;
    html += tg('sound', 'All sound', 'Master switch for music and effects (M)');
    html += tg('musicOn', 'Music', `Now playing: <b>${SONG_NAMES[music.next || music.theme] || music.theme}</b>. Every area has its own song, and it gets louder when you fight`);
    html += `<div class="row">${swatch(0xb36bff, '')}<div><div class="nm">Song</div><div class="ds">Auto plays the song of the area you are in. Pick a song to loop it, or Shuffle</div><div class="songs">${['auto', 'shuffle', ...Object.keys(SONG_NAMES)].map((id) => `<button class="buy ${(S.musicPick || 'auto') === id ? '' : 'gray'}" data-act="song" data-id="${id}">${id === 'auto' ? 'Auto' : id === 'shuffle' ? 'Shuffle' : SONG_NAMES[id]}</button>`).join('')}</div></div></div>`;
    html += `<div class="row">${swatch(0x4aa3ff, '')}<div><div class="nm">Music volume</div><input type="range" min="0" max="1" step="0.05" value="${S.musicVol}" data-range="musicVol" style="width:100%"></div></div>`;
    html += `<div class="row">${swatch(0x4aa3ff, '')}<div><div class="nm">Effects volume</div><input type="range" min="0" max="1" step="0.05" value="${S.sfxVol}" data-range="sfxVol" style="width:100%"></div></div>`;
    html += tg('shadows', 'Shadows', 'Turn off for more FPS on slow devices');
    html += tg('dmgNums', 'Damage numbers', 'Show the floating damage and gold numbers');
    html += tg('smartChain', 'Smart command chain', 'After your selected target falls, your army picks the nearest similar target automatically');
  } else if (k === 'worldmap') {
    title.textContent = 'World Map';
    html += `<canvas id="worldMap" width="900" height="200" style="width:100%;border-radius:10px;display:block"></canvas>
      <div class="note" style="margin-top:8px">Red lines are locked gates. Red dots are bosses, the orange dot is a meteorite${S.shellRadar ? ', pink squares are missing shells' : ''}. Use a Teleport pad (T) to travel fast.</div>`;
  } else if (k === 'mushy') {
    title.textContent = 'Mushy';
    tabHtml = ['Quest', 'Leaderboard'].map((n, i) => `<button class="${panelState.tab === i ? 'on' : ''}" data-tab="${i}">${n}</button>`).join('');
    if (panelState.tab === 0) {
      html += `<div class="note">"Hiii! I'm Mushy. I always need help keeping my forest safe. Every job pays more than the last!" You have helped Mushy <b>${S.mushy.lvl}</b> times.</div>`;
      if (!S.mushy.id) html += `<div><button class="buy" data-act="mushy">Take a job</button></div>`;
      else {
        const prog = Math.min(mushyProgress(), S.mushy.n), done = prog >= S.mushy.n;
        html += `<div class="row">${swatch(0xff5a8a, S.mushy.lvl + 1)}<div><div class="nm">${mushyText()}</div><div class="ds">Progress <b>${prog}/${S.mushy.n}</b> · Reward <b>${fmt(mushyReward())} gold</b>${(S.mushy.lvl + 1) % 5 === 0 ? ' + 1 Ancient Fragment' : ''}</div></div><div class="acts"><button class="buy" data-act="mushy" ${done ? '' : 'disabled'}>${done ? 'Turn in' : 'In progress'}</button></div></div>`;
      }
    } else {
      const rows = LEADERBOARD.map(([n, v]) => [n, v]).concat([['You', S.mushy.lvl]]).sort((a, b) => b[1] - a[1]);
      html += `<div class="note">The people who helped Mushy the most.</div><table class="lb">${rows.map((r, i) => `<tr class="${r[0] === 'You' ? 'me' : ''}"><td>#${i + 1}</td><td>${r[0]}</td><td style="text-align:right">${r[1]}</td></tr>`).join('')}</table>`;
    }
  }
  if (panelState.lastTabs !== tabHtml) { tabs.innerHTML = tabHtml; panelState.lastTabs = tabHtml; }
  if (panelState.lastHtml !== html) { body.innerHTML = html; panelState.lastHtml = html; body.scrollTop = scroll; }
}
$('panelTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { panelState.tab = +b.dataset.tab; renderPanel(); } });
const barrackByUid = (u) => S.barracks.find((b) => b.uid === +u);
$('panelBody').addEventListener('change', (e) => {
  const sel = e.target.closest('select[data-b]'); if (!sel) return;
  const b = barrackByUid(sel.dataset.b); if (!b) return;
  b[sel.dataset.slot] = sel.value || null;
  rebuildTroops(b); refreshSoldierStats(); sel.blur(); sfx('buy'); panelState.lastHtml = null; renderPanel();
});
$('panelBody').addEventListener('keydown', (e) => { if (e.target.id === 'codeIn' && e.key === 'Enter') redeemCode(); });
$('panelBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'moreopen') {
    if (id === 'coop' && typeof window.__coopOpen === 'function') { window.__coopOpen(); return; }
    openPanel(id); return;
  }
  if (act === 'barrack') buyBarrack(+b.dataset.i);
  if (act === 'troop') buyTroop(barrackByUid(b.dataset.b));
  if (act === 'train') trainBarrack(barrackByUid(b.dataset.b));
  if (act === 'askdel') panelState.confirmDel = +b.dataset.b; else if (act !== 'delbarrack') panelState.confirmDel = null;
  if (act === 'delbarrack') { deleteBarrack(barrackByUid(b.dataset.b)); panelState.confirmDel = null; }
  if (act === 'buyplot') buyPlot();
  if (act === 'bankdep') bankDeposit(+b.dataset.i);
  if (act === 'bankwd') bankWithdraw();
  if (act === 'gift') claimGift(+b.dataset.i);
  if (act === 'raid') startRaid(+b.dataset.i);
  if (act === 'set') { const k = b.dataset.id; S[k] = !S[k]; applySettings(); }
  if (act === 'radar') { S.shellRadar = !S.shellRadar; }
  if (act === 'hatch') hatchEgg(id, +b.dataset.i);
  if (act === 'petbest') equipBestPets();
  if (act === 'petcommons') deleteCommons();
    if (act === 'petfuse') fusePets(id, +b.dataset.tier);

  if (act === 'peteq') { const u = +b.dataset.i; if (S.petEq.includes(u)) S.petEq = S.petEq.filter((x) => x !== u); else { if (S.petEq.length >= 3) S.petEq.shift(); S.petEq.push(u); } refreshPets(); }
  if (act === 'petdel') deletePet(+b.dataset.i);
  if (act === 'research') buyResearch(id);
  if (act === 'researchcore') buyResearch(id, true);
  if (act === 'faction') joinFaction(+b.dataset.i);
  if (act === 'ruby') rubyAct();
  if (act === 'rebirth') doRebirth();
  if (act === 'legacy') buyLegacyUpgrade(id);
  if (act === 'commander' && commanderUnlocked(id)) { S.commander.id=id; toast(`${commanderDef().name} equipped`,'gold',2600); sfx('level'); }
  if (act === 'promote') promoteBarrack(barrackByUid(b.dataset.b));
  if (act === 'trial') startTrial(id);
  if (act === 'season-tier') seasonClaimTier(+b.dataset.i);
  if (act === 'season-day') seasonCalendarClaim();
  if (act === 'season-week') seasonClaimWeekly();
  if (act === 'season-shop') seasonBuy(id);
  if (act === 'expedition') startExpedition(id, +b.dataset.diff);
  if (act === 'bounty') claimBounty(+b.dataset.i);
  if (act === 'cmdmode') setCommandMode(id);
  if (act === 'formation') setFormation(id);
  if (act === 'priority') setTargetPriority(id);
  if (act === 'teamsave') saveTeam(+b.dataset.i);
  if (act === 'teamload') loadTeam(+b.dataset.i);
  if (act === 'song') { S.musicPick = id; pickMusicTheme.cur = null; shuffleT = 0; }
  if (act === 'fav') { const i = +b.dataset.i; S.favTp[i] = !S.favTp[i]; }
  if (act === 'best') equipBest(barrackByUid(b.dataset.b));
  if (act === 'buyitem') buyItem(id);
  if (act === 'use') { const it = ITEMS[id]; if (it.type === 'bag') S.bag = id; if (it.type === 'wand') S.wand = id; toast(`Equipped ${it.name}`, 'good'); }
  if (act === 'craft') craft(id);
  if (act === 'drink') drink(id);
if (act === 'spin') spinWheel(id || 'standard');
  if (act === 'skill') { if (S.skill2 === id) S.skill2 = S.skill; S.skill = id; toast(`${SKILLS[id].name} in slot 1`, 'good'); }
  if (act === 'skill2') { if (S.skill === id) S.skill = S.skill2; S.skill2 = id; toast(`${SKILLS[id].name} in slot 2`, 'good'); }
  if (act === 'wear') { S[ITEMS[id].type] = id; toast(`Wearing ${ITEMS[id].name}`, 'good'); }
  if (act === 'enchant') enchantItem(id);
  if (act === 'summon') summonFromAltar(panelState.tab, +b.dataset.i);
  if (act === 'payannex') payAnnex(+b.dataset.i);
  if (act === 'tp') { teleportTo(+b.dataset.i); closePanel(); return; }
  if (act === 'mushy') mushyAct();
  if (act === 'title') { S.title = id; refreshTitle(); toast(`Title: ${TITLES.find((t) => t.id === id).name}`, 'good'); }
  if (act === 'recipe') craftRecipe(id);
  if (act === 'autosell') { S.autosell[id] = !S.autosell[id]; }
  if (act === 'redeem') redeemCode();
  if (act === 'copysave') copySave();
  if (act === 'loadsave') loadSave();
  if (['save', 'codes'].includes(panelState.kind) && act !== 'redeem') return;
  updateHud(); panelState.lastHtml = null; renderPanel();
});
function buyItem(id) {
  const it = ITEMS[id];
  if (S.owned[id] || !it.cost || !zoneUnlocked(it.zone)) return;
  if (!spend(it.cost)) return;
  S.owned[id] = true;
  if (it.type === 'bag') S.bag = id;
  if (it.type === 'wand') S.wand = id;
  if (ACC[it.type]) S[it.type] = id;
  if (it.type === 'weapon' || it.type === 'armor') {
    let n = 0;
    for (const b of S.barracks) { const before = b.weapon + b.armor; equipBest(b, true); if (b.weapon + b.armor !== before) n++; }
    toast(`Bought ${it.name}${n ? `. Equipped on ${n} barrack${n > 1 ? 's' : ''}` : ''}`, 'good');
  } else toast(`Bought ${it.name}`, 'good');
  refreshSoldierStats(); checkQuest();
}
function packHas(need) { return Object.entries(need).every(([r, n]) => (S.pack[r] || 0) >= n); }
function craft(id) {
  const p = POTIONS[id];
  if (!packHas(p.need)) { sfx('error'); toast('Missing materials in your bag', 'bad'); return; }
  if (!spend(p.gold)) return;
  for (const [r, n] of Object.entries(p.need)) { S.pack[r] -= n; S.packCount -= n; if (!S.pack[r]) delete S.pack[r]; }
  S.potInv[id] = (S.potInv[id] || 0) + 1;
  toast(`Crafted a ${p.name}`, 'good');
}
function drink(id) {
  if (!S.potInv[id]) return;
  S.potInv[id]--; S.potions[id] += POTION_TIME;
  toast(`${POTIONS[id].name} active for ${Math.round(S.potions[id] / 60)} min`, 'good');
  burst(player.pos, POTIONS[id].color, 14); sfx('level');
}
function givePrize(g, src) {
  const parts = [];
  if (g.gold) { addGold(g.gold); parts.push(`${fmt(g.gold)} gold`); }
  if (g.bxp) { splitBarrackXp(g.bxp); parts.push(`${fmt(g.bxp)} barrack XP`); }
  if (g.pot) for (const [k, n] of Object.entries(g.pot)) { S.potInv[k] += n; parts.push(`${POTIONS[k].name} x${n}`); }
  if (g.res) for (const [k, n] of Object.entries(g.res)) { addRes(k, n, player.pos); parts.push(`${n} ${RES[k].name}`); }
  if (g.key) for (const [k, n] of Object.entries(g.key)) { addKey(k, n, null); parts.push(`${n} ${KEY[k].name}`); }
  if (g.item) { grantItem(g.item, player.pos); parts.push(ITEMS[g.item].name); }
  toast(`${src}: ${parts.join(', ')}`, 'gold', 4500);
}
function grantEverything() {
  // Currency and progression.
  S.unlockAll = true;
  S.gold = 1e15;
  S.earned = Math.max(S.earned, S.gold);
  S.sold = Math.max(S.sold, 1e9);
  S.won = true;

  // Open every gate and annex, including their visual gate objects.
  for (const gate of gateObjs) {
    gate.open = true;
    gate.anim = 1;
    gate.bars.position.y = -6.5;
    gate.sign.visible = false;
  }

  for (const gate of annexGateObjs) {
    gate.open = true;
    gate.anim = 1;
    gate.bars.position.y = -6.5;
    gate.sign.visible = false;
    S.annexOpen[gate.zone] = true;
  }

  // Own all equipment, accessories, and gear.
  for (const id of Object.keys(ITEMS)) {
    S.owned[id] = true;
  }

  // Select the largest bag, strongest materials wand, and best accessories.
  S.bag = Object.values(ITEMS)
    .filter((item) => item.type === 'bag')
    .sort((a, b) => b.cap - a.cap)[0].id;

  S.wand = Object.values(ITEMS)
    .filter((item) => item.type === 'wand')
    .sort((a, b) => b.mult - a.mult)[0].id;

  for (const slot of Object.keys(ACC)) {
    const best = ACC[slot]
      .map(([id]) => ITEMS[id])
      .sort((a, b) => b.v - a.v)[0];
    S[slot] = best.id;
  }

  // Grant all resources and key items.
  S.pack = {};
  S.packCount = 0;

  for (const [id, resource] of Object.entries(RES)) {
    const amount = 1000;
    S.pack[id] = amount;
    S.packCount += amount;
    S.found[id] = Math.max(S.found[id] || 0, amount);
    S.lootDisc[id] = true;
  }

  for (const id of Object.keys(KEY)) {
    S.items[id] = 99;
    S.found[id] = Math.max(S.found[id] || 0, 99);
    S.lootDisc[id] = true;
  }

  // Grant potions and activate them.
  for (const id of Object.keys(POTIONS)) {
    S.potInv[id] = 99;
    S.potions[id] = POTION_TIME;
  }

  // Grant every skill and fill both skill slots.
  for (const id of Object.keys(SKILLS)) {
    S.skills[id] = true;
  }
  S.skill = 'heal';
  S.skill2 = 'energy';

  // Mark enemies, bosses, loot, quests, and badges as completed/discovered.
  for (const [id, enemy] of Object.entries(ENEMIES)) {
    S.disc[id] = true;
    S.counts[id] = Math.max(S.counts[id] || 0, 999);
    if (enemy.boss) S.bossesDown[id] = true;

    for (const [lootId] of enemy.loot) {
      S.lootDisc[lootId] = true;
    }
  }

  for (const id of Object.keys(NODES)) {
    S.counts[id] = Math.max(S.counts[id] || 0, 999);
  }

  for (const npc of NPCS) {
    S.met[npc.id] = true;
    S.quests[npc.id] = npc.quests.length;
  }

  // Complete special progression systems.
  S.shells = Object.fromEntries(SHELLS.map((_, i) => [i, true]));
  S.gifts = Object.fromEntries(GIFTS.map((_, i) => [i, true]));
  S.raidBest = RAID_LEVELS.length;
  S.raidsWon = Math.max(S.raidsWon || 0, RAID_LEVELS.length);
  S.bank = Math.max(S.bank || 0, BANK_CAP);
  S.bankEarned = Math.max(S.bankEarned || 0, 1e6);
  S.rebirths = Math.max(S.rebirths || 0, 5);
  S.ruby = { lvl: RUBY_QUESTS.length, on: false, base: 0 };
  S.mushy = { lvl: 10, id: null, n: 0, start: 0 };
  S.war.side = 0;
  S.war.flags = WAR_FLAGS.map(() => 0);
  S.war.caps = Math.max(S.war.caps || 0, 5);

  // Complete the seasonal track for the debug-style everything code.
  S.season.xp=SEASON.maxTier*SEASON.tierSize; S.season.tickets=999; for(let i=1;i<=SEASON.maxTier;i++) S.season.claimed[`tier:${i}`]=true;
  // Max out permanent research.
  for (const research of RESEARCH) {
    S.research[research.id] = research.max;
  }

  // Give one of every pet and equip the strongest available pets.
  S.pets = Object.keys(PET_BY_ID).map((id, index) => ({
    uid: index + 1,
    id,
  }));
  S.petUid = S.pets.length + 1;
  S.petEq = [];
  for (const egg of EGGS) {
    S.hatched[egg.id] = Math.max(S.hatched[egg.id] || 0, 1);
  }
  S.hatchCount = Math.max(S.hatchCount || 0, S.pets.length);

  // Ensure every troop type has a barrack, then fill the available plots.
  S.plots = MAX_PLOTS;
  refreshPlotSlabs();

  for (let i = 0; i < TROOPS.length && S.barracks.length < S.plots; i++) {
    if (!S.barracks.some((b) => b.type === i)) {
      buyBarrack(i, true, false);
    }
  }

  let nextType = 0;
  while (S.barracks.length < S.plots) {
    buyBarrack(nextType % TROOPS.length, true, false);
    nextType++;
  }

  // Max out each barrack and spawn its full troop capacity.
  while (soldiers.length) removeSoldier(soldiers[0]);

  for (const barrack of S.barracks) {
    barrack.level = BARRACK_MAX_LV;
    barrack.xp = 0;
    barrack.troops = 0;

    equipBest(barrack, true);

    const count = barrackCap(barrack.level);
    for (let i = 0; i < count; i++) {
      barrack.troops++;
      spawnTroop(barrack);
    }

    refreshPlot(barrack);
  }

  // Mark all badges as earned and select the final title.
  for (const badge of badgeList()) {
    S.badges[badge.id] = true;
  }
  S.title = 'winner';

  refreshFlags();
  refreshPets();
  refreshSoldierStats();
  refreshTitle();
  updateHud();
  checkQuest();

  toast('Everything unlocked and granted!', 'gold', 5000);
}

function redeemCode() {
  const inp = $('codeIn');
  if (!inp) return;

  const code = inp.value.trim().toUpperCase();
  if (!code) return;

  const reward = CODES[code];

  if (!reward) {
    toast('That code is not valid', 'bad');
    sfx('error');
    return;
  }

  if (S.codes[code]) {
    toast('You already redeemed that code', 'bad');
    sfx('error');
    return;
  }

  // Record the code before granting rewards to prevent repeat redemption.
  S.codes[code] = true;
  inp.value = '';

  if (reward.special === 'everything') {
    grantEverything();
  } else {
    givePrize(reward, `Code ${code}`);
  }

  sfx('sell');
  panelState.lastHtml = null;
  renderPanel();
}

function spinWheel(type = 'standard') {
  const wheel = WHEELS[type];
  if (!wheel || S.spinning) return;

  const readyAt = type === 'premium' ? S.premiumWheelAt : S.wheelAt;
  if (S.time < readyAt) {
    toast(`Next spin in ${clock(readyAt - S.time)}`, '');
    return;
  }

  const segments = wheelLayout(type);
  const totalWeight = segments.reduce((sum, segment) => sum + segment.w, 0);

  let roll = rnd() * totalWeight;
  let selected = segments[segments.length - 1];

  for (const segment of segments) {
    roll -= segment.w;
    if (roll < 0) {
      selected = segment;
      break;
    }
  }

  // Set spinning before spend(): spend() updates the HUD, which otherwise
  // could rebuild the panel and remove the wheel element before animation.
  S.spinning = true;

  if (wheel.cost && !spend(wheel.cost)) {
    S.spinning = false;
    return;
  }

  const rotationKey = type === 'premium' ? 'premiumWheelRot' : 'wheelRot';
  const cooldownKey = type === 'premium' ? 'premiumWheelAt' : 'wheelAt';
  const currentRotation = Number(S[rotationKey]) || 0;
  const desiredAngle = normalizeDegrees(360 - selected.center);
  const alignment = normalizeDegrees(
    desiredAngle - normalizeDegrees(currentRotation)
  );
  const targetRotation = currentRotation + 5 * 360 + alignment;
  const duration = 3600;
  const wheelElement = $('wheelEl');

  S[rotationKey] = targetRotation;
  S[cooldownKey] = S.time + wheel.cooldown;

  if (wheelElement) {
    wheelElement.style.transition = 'none';
    wheelElement.style.transform = `rotate(${currentRotation}deg)`;
    void wheelElement.offsetWidth;

    requestAnimationFrame(() => {
      wheelElement.style.transition =
        `transform ${duration}ms cubic-bezier(0.12, 0.75, 0.12, 1)`;
      wheelElement.style.transform = `rotate(${targetRotation}deg)`;
    });
  }

  sfx('command');

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    S.spinning = false;
    givePrize(selected.give, `${wheel.name}`);
    sfx('level');

    panelState.lastHtml = null;
    if (panelState.open && panelState.kind === 'wheel') renderPanel();
  };

  if (wheelElement) {
    wheelElement.addEventListener('transitionend', (event) => {
      if (event.target === wheelElement && event.propertyName === 'transform') {
        finish();
      }
    }, { once: true });
  }

  // Also finish if the panel is closed or the transition is interrupted.
  setTimeout(finish, duration + 250);
}


// Quests
function questProgress(q) {
  if (q.k === 'units') return soldiers.length;
  if (q.k === 'barracks') return S.barracks.length;
  if (q.k === 'blevel') return S.barracks.reduce((m, b) => Math.max(m, b.level), 0);
  if (q.k === 'own') return S.owned[q.id] ? 1 : 0;
  if (q.k === 'sold') return S.sold;
  if (q.k === 'found') return S.found[q.id] || 0;
  return S.counts[q.id] || 0;
}
function checkQuest() {
  for (const n of NPCS) {
    if (!S.met[n.id]) continue;
    let guard = 0;
    while (S.quests[n.id] < n.quests.length && guard++ < 5) {
      const q = n.quests[S.quests[n.id]];
      if (questProgress(q) < q.n) break;
      S.quests[n.id]++;
      addGold(q.r);
      toast(`${n.name}: quest complete, ${q.t}. +${fmt(q.r)} gold`, 'gold', 4000);
      sfx('sell');
      if (S.quests[n.id] >= n.quests.length) toast(`All of ${n.name}'s quests complete`, 'good', 5000);
    }
  }
}

// ------------------------------------------------------- AUTO SAVE V10 ---
let autoSaveT = 5;
function autoSave(){
  try { localStorage.setItem('army_control_auto_v14', makeSave()); } catch(e) {}
}
function autoSaveTick(dt){
  if(S.mode!=='play' || window.__coopInRaid) return;
  autoSaveT -= dt;
  if(autoSaveT<=0){ autoSaveT=8; autoSave(); }
}
function hasAutoSave(){ try { return !!localStorage.getItem('army_control_auto_v14') || !!localStorage.getItem('army_control_auto_v12'); } catch(e){ return false; } }
function loadAutoSave(){ try { const raw=localStorage.getItem('army_control_auto_v14') || localStorage.getItem('army_control_auto_v12'); if(!raw) return false; return loadSave(raw); } catch(e){ return false; } }

// Save codes
function makeSave() {
  const d = {
    v: 3, g: Math.floor(S.gold),ua: S.unlockAll,
 bag: S.bag, wand: S.wand, o: Object.keys(S.owned),
    b: S.barracks.map((b) => [b.type, b.level, Math.floor(b.xp), b.troops, b.weapon, b.armor, b.plot, Number(b.elite)||0]),
    bd: S.bossesDown, k: S.kills,pw: Math.floor(S.premiumWheelAt),
wr0: S.wheelRot,
pwr0: S.premiumWheelRot,
 e: Math.floor(S.earned), t: Math.floor(S.time), so: Math.floor(S.sold), rsold: Math.floor(S.resourcesSold||0), c: S.counts, f: S.found,
    d: S.disc, ld: S.lootDisc, pi: S.potInv, sk: S.skills, s: S.skill, q: S.quests, m: S.met, cd: S.codes, w: Math.floor(S.wheelAt),
    go: gateObjs.map((g) => g.open), won: S.won, p: S.pack, gk: S.goldenKills,
    it: S.items, en: S.ench, as: S.autosell, ac: [S.hat, S.boots, S.belt], ti: S.title, s2: S.skill2, mu: S.mushy, ao: annexGateObjs.map((g) => g.open),
    pl: S.plots, bk: Math.floor(S.bank), be: Math.floor(S.bankEarned), gf: S.gifts, sh: S.shells, rb: S.raidBest, rw: S.raidsWon,
    tu: [S.tutorialDone, S.tutorialStep], mo: [S.momentumBest], ch: S.chain, sc: S.smartChain, dy: S.daily,
    st: [S.musicOn, S.musicVol, S.sfxVol, S.shadows, S.dmgNums],
    se: S.season, ex: {active:false,id:'',difficulty:1,wave:0,waves:0,kills:0,goal:0,start:0,ends:0,nextWaveAt:0,spawned:[],clears:Number(S.expedition?.clears)||0,best:Number(S.expedition?.best)||0,cooldowns:S.expedition?.cooldowns||{}},
    ar: S.archive,
    bm: S.bossMastery, sy: Number(S.synergyToastAt)||-99, pe: S.pets.map((p) => ({ id: p.id, tier: petTier(p) })),
 pq: S.petEq.map((u) => S.pets.findIndex((p) => p.uid === u)), ht: S.hatched, hc: S.hatchCount, rs: S.research, bg: S.badges, fv: S.favTp, wr: S.war, rg: S.ruby, mp: S.musicPick, rbt: S.rebirths, tm: S.teams, lg: S.legacy, ct: S.contract, cmd: S.command, cmdr: S.commander, tr: S.trial, cp: S.capture, we: S.worldEvent, sec: S.secrets, rel: S.relics, re: {active:!!S.randomEvent?.active,kind:S.randomEvent?.kind||'',ends:Number(S.randomEvent?.ends)||0,next:Number(S.randomEvent?.next)||0,reward:Number(S.randomEvent?.reward)||0,label:S.randomEvent?.label||'',zone:Number(S.randomEvent?.zone)||0}, bo: S.bounty, eh: {active:false,type:'',ends:0,next:Number(S.eliteHunt?.next)||70}, cv: {active:false,zone:0,x:0,z:0,tx:0,started:0,ends:0,reward:0},
  };
  return 'AC3-' + btoa(unescape(encodeURIComponent(JSON.stringify(d))));
}
function copySave() {
  const ta = $('saveOut'); ta.value = makeSave(); ta.select();
  try { navigator.clipboard.writeText(ta.value).then(() => toast('Save code copied', 'good'), () => toast('Code selected. Copy it with Ctrl+C', '')); }
  catch (e) { toast('Code selected. Copy it with Ctrl+C', ''); }
}
function clearBarracks() {
  while (soldiers.length) removeSoldier(soldiers[0]);
  for (const p of PLOTS) { if (p.group) scene.remove(p.group); if (p.lbl) scene.remove(p.lbl); p.group = null; p.lbl = null; p.lblText = ''; }
  S.barracks = [];
}
function loadSave(raw) {
  raw = (raw ?? ($('saveIn').value || '')).trim();
  let d;
  try { if (!raw.startsWith('AC2-') && !raw.startsWith('AC3-')) throw 0; d = JSON.parse(decodeURIComponent(escape(atob(raw.slice(4))))); } catch (e) { toast('That save code is not valid (older AC1 codes are not supported)', 'bad', 4000); sfx('error'); return false; }
  clearBarracks();
  S.gold = d.g || 0; S.owned = {};
  S.resourcesSold = d.rsold || 0; for (const id of d.o || []) if (ITEMS[id]) S.owned[id] = true;
  S.owned.starter_bag = true; S.owned.basic_wand = true;
  S.unlockAll = !!d.ua;
S.codes = d.cd || {};
S.wheelAt = d.w || 0;
S.premiumWheelAt = d.pw || 0;
S.wheelRot = Number(d.wr0) || 0;
S.premiumWheelRot = Number(d.pwr0) || 0;

  S.bag = ITEMS[d.bag] ? d.bag : 'starter_bag'; S.wand = ITEMS[d.wand] ? d.wand : 'basic_wand';
  S.bossesDown = d.bd || {}; S.kills = d.k || 0; S.earned = d.e || 0; S.time = d.t || 0; S.sold = d.so || 0;
  S.counts = d.c || {}; S.found = d.f || {}; S.disc = d.d || {}; S.lootDisc = d.ld || {};
  S.potInv = { gold: 0, luck: 0, exp: 0, mat: 0, ...(d.pi || {}) }; S.skills = d.sk || {}; S.skill = d.s || null;
  S.quests = { tom: 0, emma: 0, file: 0, ...(d.q || {}) }; S.met = { tom: true, ...(d.m || {}) }; S.codes = d.cd || {}; S.wheelAt = d.w || 0;
  S.won = !!d.won; S.goldenKills = d.gk || 0; S.bossMastery = d.bm || {}; S.synergyToastAt = Number(d.sy);
  (d.go || []).forEach((o, i) => { if (o && gateObjs[i] && gateRebirthUnlocked(gateObjs[i])) gateObjs[i].open = true; else if (gateObjs[i] && !gateRebirthUnlocked(gateObjs[i])) gateObjs[i].open = false; });
  S.pack = {}; S.packCount = 0;
  S.items = {}; for (const [k, n] of Object.entries(d.it || {})) if (KEY[k]) S.items[k] = n;
  for (const k of ['golden_key', 'ancient_fragment']) if (d.p && d.p[k]) S.items[k] = (S.items[k] || 0) + d.p[k];
  for (const [r, n] of Object.entries(d.p || {})) if (RES[r]) { S.pack[r] = n; S.packCount += n; }
  S.ench = {}; for (const [k, v] of Object.entries(d.en || {})) if (ITEMS[k]) S.ench[k] = v;
  S.autosell = d.as || {};
  const ac = d.ac || []; S.hat = ITEMS[ac[0]] ? ac[0] : null; S.boots = ITEMS[ac[1]] ? ac[1] : null; S.belt = ITEMS[ac[2]] ? ac[2] : null;
  S.title = TITLES.some((t) => t.id === d.ti) ? d.ti : 'recruit';
  S.skill2 = d.s2 || null; S.mushy = { lvl: 0, id: null, n: 0, start: 0, ...(d.mu || {}) };
  annexGateObjs.forEach((g, i) => { g.open = !!(d.ao && d.ao[i]) && gateRebirthUnlocked(g); if (!g.open) { g.anim = 0; g.bars.position.y = 0; g.sign.visible = true; } });
  titleSeen = null;
  S.bank = d.bk || 0; S.bankEarned = d.be || 0; S.gifts = d.gf || {}; S.shells = d.sh || {}; S.raidBest = d.rb || 0; S.raidsWon = d.rw || 0; S.raid = { active: false };
  if (Array.isArray(d.tu)) { S.tutorialDone = !!d.tu[0]; S.tutorialStep = clamp(Number(d.tu[1]) || 0, 0, 5); }
  else { S.tutorialDone = (S.kills > 0 || S.sold > 0 || S.gold > 100); S.tutorialStep = 0; }
  S.momentum = 0; S.momentumAt = S.time; S.momentumBest = Number(d.mo?.[0]) || 0; S.chain = { count:0, lastAt:-99, best:0, ...(d.ch || {}) }; S.smartChain = d.sc !== false; S.daily = { key:'', kind:'', goal:0, start:0, claimed:false, reward:0, streak:0, lastClaim:'', ...(d.dy || {}) }; S.director = { active: false, ends: 0, next: S.time + 55, bonus: 1, label: '', spawned: [] };
  if (d.st) { [S.musicOn, S.musicVol, S.sfxVol, S.shadows, S.dmgNums] = d.st; applySettings(); }
  S.pets = (d.pe || [])
  .map((savedPet) => {
    // Accept the old save format, where each pet was stored as a string ID.
    const id = typeof savedPet === 'string' ? savedPet : savedPet?.id;
    const tier = typeof savedPet === 'string' ? 0 : petTier(savedPet);
    return PET_BY_ID[id] ? { id, tier, uid: 0 } : null;
  })
  .filter(Boolean)
  .map((pet, index) => ({ ...pet, uid: index + 1 }));
 S.petUid = S.pets.length + 1;
  S.petEq = (d.pq || []).filter((i) => i >= 0 && S.pets[i]).map((i) => S.pets[i].uid);
  S.hatched = d.ht || {}; S.hatchCount = d.hc || 0;
  S.legacy = { points:0, lifetime:0, upgrades:{ command:0, quartermaster:0, war_chest:0, scout:0, logistics:0 }, milestones:{}, ...(d.lg||{}) };
  S.season = { id:'frontier_festival', xp:0, tickets:0, claimed:{}, lastDay:'', streak:0, week:'', weekKills:S.kills, weekSold:S.resourcesSold||0, weekClaimed:false, bonusAt:0, bonusId:'gold', ...(d.se||{}) }; S.season.claimed={...(S.season.claimed||{})};
  S.archive = { claimed:{}, ranks:{}, seenVersion:1, ...(d.ar||{}) }; S.archive.claimed={...(S.archive.claimed||{})}; S.archive.ranks={...(S.archive.ranks||{})};
  S.expedition = {active:false,id:'',difficulty:1,wave:0,waves:0,kills:0,goal:0,start:0,ends:0,nextWaveAt:0,spawned:[],clears:0,best:0,cooldowns:{},...(d.ex||{})}; S.expedition.active=false; S.expedition.spawned=[];
  S.legacy.upgrades = { command:0, quartermaster:0, war_chest:0, scout:0, logistics:0, ...(S.legacy.upgrades||{}) };
  S.contract = { id:'', start:0, goal:0, ends:0, claimed:false, reward:0, ...(d.ct||{}) }; S.research = d.rs || {}; S.badges = d.bg || {}; S.favTp = d.fv || {}; S.ruby = { lvl: 0, on: false, base: 0, ...(d.rg || {}) }; S.musicPick = d.mp || 'auto'; S.rebirths = Math.max(0, Number(d.rbt) || 0); S.teams = Array.isArray(d.tm) ? d.tm.concat([null, null, null]).slice(0, 3) : [null, null, null];
  unlockBosses();
  S.command = {mode:'follow',formation:'line',priority:'nearest',orders:0,...(d.cmd||{})}; S.commander = {id:'marshal',xp:0,unlocks:{marshal:true},...(d.cmdr||{})}; if(!commanderUnlocked(S.commander.id)) S.commander.id='marshal'; for(const c of COMMANDERS) if(commanderLevel()>=c.req) S.commander.unlocks[c.id]=true; S.trial={active:false,id:'',start:0,ends:0,baseKills:0,baseBosses:0,reward:0,cooldown:0,...(d.tr||{})}; S.capture=d.cp||{}; S.worldEvent={active:false,kind:'',post:'',ends:0,next:S.time+115,reward:0,...(d.we||{})}; S.secrets=d.sec||{}; S.relics=d.rel||{}; S.randomEvent={active:false,kind:'',ends:0,next:S.time+85,reward:0,label:'',zone:0,...(d.re||{})}; if(S.randomEvent.kind==='treasure_drop'){S.randomEvent.active=false;S.randomEvent.kind='';S.randomEvent.next=S.time+60;}
  S.bounty={slots:[],ends:0,next:S.time+22,completed:0,streak:0,lastRefresh:0,...(d.bo||{})}; S.eliteHunt={active:false,type:'',ends:0,next:S.time+70,...(d.eh||{})};
  if (d.wr && Array.isArray(d.wr.flags) && d.wr.flags.length === WAR_FLAGS.length) S.war = { side: d.wr.side ?? null, flags: d.wr.flags, caps: d.wr.caps || 0, pts: d.wr.pts || [0, 0, 0] };
  refreshFlags(); refreshPets();
  S.plots = clamp(d.pl || 10, 10, MAX_PLOTS); refreshPlotSlabs();
  for (const [type, level, xp, troops, weapon, armor, plot, elite] of (d.b || []).slice(0, S.plots)) {
    if (!TROOPS[type]) continue;
    const b = buyBarrack(type, true, false);
    b.level = clamp(level, 1, BARRACK_MAX_LV); b.xp = xp || 0; b.elite = clamp(Number(elite)||0,0,3);
    b.weapon = weapon && S.owned[weapon] ? weapon : b.weapon; b.armor = armor && S.owned[armor] ? armor : null;
    b.troops = clamp(troops || 0, 0, barrackCap(b.level));
    for (let i = 0; i < b.troops; i++) spawnTroop(b);
    refreshPlot(b);
  }
  player.pos.set(0, 0, 4); player.maxHp = playerMaxHp(); player.hp = player.maxHp;
  armyTarget = null; targetRing.visible = false;
  closePanel(); updateHud(); refreshTitle();
  toast('Save loaded. Welcome back, commander', 'good', 3500);
  return true;
}

function updateBossBar() {
  const el = $('bossBar');
  // Normal bosses always use the boss bar; roaming bosses simply cannot exist
  // before the third rebirth and therefore never enter this scan early.
  let boss = null, bd = 40 * 40;
  for (const e of entities) {
    if (!e.def.boss || !e.alive) continue;
    const dd = dist2(e.pos, player.pos);
    if (dd < bd && (e.state === 'chase' || e.hp < e.maxHp || armyTarget === e || dd < 18 * 18)) { bd = dd; boss = e; }
  }
  if (!boss) { el.classList.add('hidden'); return; }
  maybeSkillBlock(boss);
  el.classList.remove('hidden');
  const phaseName = ['PHASE I', 'PHASE II', 'PHASE III', 'FINAL PHASE'][clamp(Number(boss.bossPhase) || 0, 0, 3)];
  el.dataset.phase = String(clamp(Number(boss.bossPhase) || 0, 0, 3));
  $('bossName').textContent = boss.def.name + (boss.enraged ? ' · ENRAGED' : '') + (boss.charm > 0 ? ' · CHARMED' : '');
  $('bossFill').style.width = (boss.hp / boss.maxHp * 100) + '%';
  $('bossHp').textContent = `${phaseName} · ${fmt(boss.hp)} / ${fmt(boss.maxHp)}${boss.vuln > 0 ? ' · EXPOSED ×1.25' : ''}`;
}
const mm = $('minimap'), mctx = mm.getContext('2d');
function drawMinimap() {
  const W = mm.width, H = mm.height;
  const VW = 173 * W / H, vx0 = clamp(player.pos.x - VW / 2, X_MIN - 1, X_MAX + 1 - VW);
  const sx = (x) => (x - vx0) / VW * W;
  const sz = (z) => (127 - z) / 173 * H;
  mctx.fillStyle = '#1e2433'; mctx.fillRect(0, 0, W, H);
  const rect = (x0, x1, z0, z1) => mctx.fillRect(sx(x0), sz(z1), sx(x1) - sx(x0) + 1, sz(z0) - sz(z1) + 1);
  for (const z of ZONES) { const locked = z.annex && !zoneUnlocked(ZONES.indexOf(z)); mctx.fillStyle = hex(new THREE.Color(z.ground).multiplyScalar(locked ? 0.45 : 0.85).getHex()); rect(z.x0, z.x1, z.z0, z.z1); }
  for (const g of annexGateObjs) { mctx.fillStyle = '#7a6a55'; rect(g.x - 3.5, g.x + 3.5, 44, 57); mctx.fillStyle = g.open ? '#6d6d75' : '#ff4d4d'; rect(g.x - 3.5, g.x + 3.5, 49.5, 51); }
  mctx.fillStyle = 'rgba(58,159,224,.9)'; rect(132, 140, -44, 44);
  mctx.fillStyle = 'rgba(201,166,107,.8)'; rect(X_MIN, X_MAX, -3, 3);
  for (const g of gateObjs) { mctx.fillStyle = g.open ? '#6d6d75' : '#ff4d4d'; rect(g.x - 1.5, g.x + 1.5, -44, 44); }
  for (const p of PADS) { mctx.fillStyle = hex(p.color); mctx.fillRect(sx(p.x) - 1.5, sz(p.z) - 1.5, 3, 3); }
  for (const o of captureObjs) if(o.root.visible){ mctx.fillStyle=o.owner===1?'#52d273':o.owner===2?'#ff5a5f':'#8fe0ff'; mctx.strokeStyle='#1b2140'; mctx.beginPath(); mctx.arc(sx(o.def.x),sz(o.def.z),3,0,7); mctx.fill(); mctx.stroke(); }
  for (const o of secretObjs) if(o.root.visible && !S.secrets[o.def.id] && zoneUnlocked(o.def.zone)){ mctx.fillStyle=o.def.kind==='relic'?'#d08cff':'#ffe066'; mctx.beginPath(); mctx.arc(sx(o.def.x),sz(o.def.z),2.2,0,7); mctx.fill(); }
  for (const e of entities) if(e.roamer && e.alive){ mctx.fillStyle='#ff3d6b'; mctx.strokeStyle='#fff'; mctx.beginPath(); mctx.arc(sx(e.pos.x),sz(e.pos.z),3.5,0,7); mctx.fill(); mctx.stroke(); }
  for (const e of entities) {
    if (!e.alive) continue;
    if (e.kind === 'node') { mctx.fillStyle = e.def.summon ? '#c07bff' : 'rgba(0,0,0,.25)'; mctx.fillRect(sx(e.pos.x) - 1, sz(e.pos.z) - 1, e.def.summon ? 3 : 2, e.def.summon ? 3 : 2); continue; }
    mctx.fillStyle = e.def.passive ? '#ffb3c1' : e.golden ? '#ffd84a' : '#e0353b';
    const r = e.def.boss ? 3.5 : 1.4;
    mctx.beginPath(); mctx.arc(sx(e.pos.x), sz(e.pos.z), r, 0, 7); mctx.fill();
    if (e.def.boss) { mctx.strokeStyle = '#fff'; mctx.lineWidth = 1.2; mctx.stroke(); }
  }
  mctx.fillStyle = '#ffe066';
  for (const n of NPCS) { mctx.fillRect(sx(n.x) - 1.5, sz(n.z) - 1.5, 3, 3); }
  mctx.fillStyle = '#4aa3ff';
  for (const s of soldiers) if (s.alive) mctx.fillRect(sx(s.pos.x) - 1.1, sz(s.pos.z) - 1.1, 2.2, 2.2);
  mctx.fillStyle = '#fff'; mctx.strokeStyle = '#1b2140'; mctx.lineWidth = 2;
  mctx.beginPath(); mctx.arc(sx(player.pos.x), sz(player.pos.z), 3.5, 0, 7); mctx.fill(); mctx.stroke();
  mctx.strokeStyle = 'rgba(255,255,255,.6)'; mctx.lineWidth = 1;
  mctx.strokeRect(sx(player.pos.x - 30), sz(player.pos.z + 22), sx(30) - sx(-30), sz(-22) - sz(22));
  if (meteorEnt && meteorEnt.alive) { mctx.fillStyle = '#ff8a2a'; mctx.beginPath(); mctx.arc(sx(meteorEnt.pos.x), sz(meteorEnt.pos.z), 4, 0, 7); mctx.fill(); }
  mctx.fillStyle = 'rgba(0,0,0,.55)'; mctx.fillRect(W - 92, H - 18, 92, 18); mctx.fillStyle = '#fff'; mctx.font = '800 11px Nunito, sans-serif'; mctx.textAlign = 'center'; mctx.fillText('Click: World Map', W - 46, H - 5); mctx.textAlign = 'left';
  if (panelState.kind === 'worldmap') { const cv = $('worldMap'); if (cv) drawWorldMap(cv); }
}
mm.addEventListener('click', (e) => { e.stopPropagation(); togglePanel('worldmap'); setTimeout(() => { const cv = $('worldMap'); if (cv) drawWorldMap(cv); }, 30); });
function showVictory() {
  const o = $('overlay');
  o.innerHTML = `<div class="title-card"><h1>Victory</h1><p class="sub">The Minotaur has fallen. You are a Legend, commander.</p>
    <p>Time played ${Math.floor(S.time / 60)}m ${Math.floor(S.time % 60)}s · ${fmt(S.kills)} enemies defeated · ${fmt(S.earned)} gold earned · ${soldiers.length} units</p>
    <button class="big" id="keepPlaying">Keep Playing</button></div>`;
  o.classList.remove('hidden');
  $('keepPlaying').onclick = () => o.classList.add('hidden');
}
function updateLegacyHud(){
  const el=$('legacyBox'); if(!el) return;
  if(S.mode!=='play'){el.classList.add('hidden');return;}
  el.classList.remove('hidden');
  const next=LEGACY_UPGRADES.reduce((m,u)=>Math.min(m,legacyUpgradeCost(u)),Infinity);
  el.innerHTML=`<div class="legacy-rank">COMMAND RANK ${legacyLevel()+1}</div><div class="legacy-sub">◈ ${legacyPoints()} shards available · lifetime ${Number(S.legacy?.lifetime)||0}</div>`;
}

function updateExtrasHud() {
  const bf = $('buffs');
  let h = '';
  for (const [id, p] of Object.entries(POTIONS)) if (S.potions[id] > 0) h += `<span class="buff" style="--c:${hex(p.color)}">${p.name.replace(' Potion', '')} ${clock(S.potions[id])}</span>`;
  for (const k of ['shield', 'rage', 'beast', 'chocolate', 'raptor', 'minotaur']) if (S.fx[k] > 0) h += `<span class="buff" style="--c:${hex(SKILLS[k].color)}">${SKILLS[k].name} ${Math.ceil(S.fx[k])}s</span>`;
  if (S.fx.boost > 0) h += `<span class="buff" style="--c:#9fd8ff">Power Boost ${Math.ceil(S.fx.boost)}s</span>`;
  if (S.fx.block > 0) h += `<span class="buff" style="--c:#ff4d4d">Skill BLOCK ${Math.ceil(S.fx.block)}s</span>`;
  if (bf.innerHTML !== h) bf.innerHTML = h;
  let qh = '';
  for (const n of NPCS) {
    if (!S.met[n.id]) continue;
    const q = n.quests[S.quests[n.id]];
    if (!q) continue;
    const prog = Math.min(questProgress(q), q.n);
    qh += `<div class="qline"><div class="ql">${n.name.toUpperCase()} ${S.quests[n.id] + 1}/${n.quests.length}</div><div class="qt">${q.t}</div><div class="bar"><div style="width:${prog / q.n * 100}%"></div></div><div class="qr">${fmt(prog)}/${fmt(q.n)} · ${fmt(q.r)} gold</div></div>`;
  }
  if (S.met.mushy && S.mushy.id) { const prog = Math.min(mushyProgress(), S.mushy.n); qh += `<div class="qline"><div class="ql">MUSHY #${S.mushy.lvl + 1}</div><div class="qt">${mushyText()}</div><div class="bar"><div style="width:${prog / S.mushy.n * 100}%"></div></div><div class="qr">${prog}/${S.mushy.n} · ${fmt(mushyReward())} gold</div></div>`; }
  if (!qh) qh = '<div class="qt">All quests complete</div>';
  const qe = $('questBox'); if (qe.innerHTML !== qh) qe.innerHTML = qh;
  const sb = $('btnSkill');
  sb.textContent = !S.skill ? 'No Skill' : S.skillCd > 0 ? `${SKILLS[S.skill].name.split(' ')[0]} ${Math.ceil(S.skillCd)}s` : SKILLS[S.skill].name;
  sb.classList.toggle('cool', !S.skill || S.skillCd > 0);
  const sb2 = $('btnSkill2');
  sb2.textContent = !S.skill2 ? 'Slot 2' : S.skillCd2 > 0 ? `${SKILLS[S.skill2].name.split(' ')[0]} ${Math.ceil(S.skillCd2)}s` : SKILLS[S.skill2].name;
  sb2.classList.toggle('cool', !S.skill2 || S.skillCd2 > 0);
  $('btnWheel').classList.toggle('ready', S.time >= S.wheelAt);
  const gr = giftsReady(); $('btnGifts').classList.toggle('ready', gr > 0); $('btnGifts').textContent = gr ? `Gifts (${gr})` : 'Gifts';
  checkTitles();
  checkQuest();
}

function toast(text, cls = '', ms = 2500) {
  const box = $('toasts');
  if (box.children.length > 3) box.firstChild.remove();
  const el = document.createElement('div');
  el.className = 'toast ' + cls; el.textContent = text;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms);
}
let bannerTimer = 0;
function banner(title, sub) {
  const el = $('zoneBanner');
  el.innerHTML = `${title}<small>${sub || ''}</small>`;
  el.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
let hintText = '';
function setHint(t) {
  if (t === hintText) return; hintText = t;
  const el = $('hint'); if (t) el.textContent = t; el.classList.toggle('show', !!t);
}


// ------------------------------------------------------------ PLAYER UPD ---
let lastZone = 0;
const skyTarget = new THREE.Color(), fogTarget = { near: 70, far: 170 };
function updatePlayer(dt) {
  if (!player.alive) { player.moving = false; animateModel(player, dt); return; }
  let ix = 0, iz = 0;
  if (keys['w'] || keys['arrowup']) iz += 1;
  if (keys['s'] || keys['arrowdown']) iz -= 1;
  if (keys['a'] || keys['arrowleft']) ix += 1;
  if (keys['d'] || keys['arrowright']) ix -= 1;
  const inWater = player.pos.x > 131.5 && player.pos.x < 140.5 && Math.abs(player.pos.z) > 3 && Math.abs(player.pos.z - 23) > 3;
  const speed = 11 * (keys['shift'] ? 1.45 : 1) * (inWater ? 0.6 : 1) * (1 + accV('boots')) * (S.fx.raptor > 0 ? 1.6 : 1) * (1 + resV('speed'));
  const prev = player.pos.clone();
  player.moving = false;
  if (ix || iz) {
    const l = Math.hypot(ix, iz); ix /= l; iz /= l;
    const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
    const dx = fx * iz + fz * ix, dz = fz * iz - fx * ix;
    player.pos.x += dx * speed * dt; player.pos.z += dz * speed * dt;
    faceDir(player, dx, dz, dt); player.moving = true;
  } else if (player.moveTo) {
    const dx = player.moveTo.x - player.pos.x, dz = player.moveTo.z - player.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.3) { player.moveTo = null; moveMarker.visible = false; }
    else { const st = Math.min(d, speed * dt); player.pos.x += dx / d * st; player.pos.z += dz / d * st; faceDir(player, dx, dz, dt); player.moving = true; }
  }
  player.vy -= 32 * dt; player.pos.y += player.vy * dt;
  if (player.pos.y <= 0) { player.pos.y = 0; player.vy = 0; }
  constrain(player.pos, prev, true);
  pushOutOfNodes(player.pos, player.radius);
  if (player.moveTo && Math.hypot(player.pos.x - prev.x, player.pos.z - prev.z) < speed * dt * 0.1) player.moveTo = null;
  if (player.pos.y > 0.05) player.moving = false;
  animateModel(player, dt);
  if (S.time - player.lastHurt > 4) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.06 * dt);
  const zi = zoneAt(player.pos.x, player.pos.z);
  if (zi !== lastZone) { lastZone = zi; banner(ZONES[zi].name, ZONES[zi].sub); }
  // pads
  let hint = '';
  for (const p of PADS) {
    const dd = Math.hypot(player.pos.x - p.x, player.pos.z - p.z);
    const inside = dd < 2.8;
    if (inside && !p.inside) {
      if (p.id === 'sell') { if (S.packCount > 0) sellAll(); else toast('Bag is empty. Break trees, flowers, rocks and enemies to collect materials', ''); }
      else if (p.id === 'dispenser') claimDispenser(p.idx);
      else openPanel(p.panel || p.id, p.tab || 0);
    }
    if (inside && p.id === 'dispenser') { const left = (S.disp[DISPENSERS[p.idx].zone] || 0) - S.time; if (left > 0) hint = `Dispenser refills in ${clock(left)}`; }
    if (!inside && p.inside && panelState.open && panelState.kind === (p.panel || p.id)) closePanel();
    p.inside = inside;
  }
  // quest NPCs
  for (const o of npcObjs) {
    const dd = Math.hypot(player.pos.x - o.n.x, player.pos.z - o.n.z);
    const near = dd < 3.6;
    if (near && !o.near) {
      if (!S.met[o.n.id]) { S.met[o.n.id] = true; toast(`You met ${o.n.name}. New quests added`, 'gold', 3500); }
      checkQuest();
      openPanel('npc', NPCS.indexOf(o.n));
    }
    if (!near && o.near && panelState.open && panelState.kind === 'npc') closePanel();
    o.near = near;
    o.mark.visible = !S.met[o.n.id] || S.quests[o.n.id] < o.n.quests.length;
    o.mark.position.y = 4.6 + Math.sin(S.time * 3) * 0.15;
    if (dd < 12) faceDir(o.av.root ? { mesh: o.av.root } : o, player.pos.x - o.n.x, player.pos.z - o.n.z, dt);
  }
  if (S.time - dps.last < 3 && Math.hypot(player.pos.x + 24, player.pos.z - 2) < 20) {
    const el = Math.max(1, dps.last - dps.start);
    hint = `DPS test: ${fmt(dps.total / el)} damage per second`;
  }
  const ownTroops = soldiers.length;
  if (!hint && ownTroops === 0) hint = 'Walk to the blue Barracks pad and buy your first troop';
  else if (!hint && S.packCount >= packCap()) hint = 'Bag full. Head back to the gold Sell pad';
  else if (!hint && S.kills === 0 && S.packCount === 0 && S.earned === 0) hint = 'Click a tree, flower or rock and your army will attack it';
  else if (!hint) { const g = gateObjs.find((x) => !x.open && Math.abs(player.pos.x - x.x) < 14 && player.pos.z < 45); if (g) hint = `${ZONES[g.zone].name} needs ${g.req} units${g.boss ? ` and the ${ENEMIES[g.boss].name} defeated${S.bossesDown[g.boss] ? ' (done)' : ''}` : ''} · you have ${ownTroops}`; }
  if (!hint) { const g = annexGateObjs.find((x) => !x.open && Math.abs(player.pos.x - x.x) < 9 && player.pos.z > 30); if (g) hint = annexReqText(g); }
  if (S.raid.active) hint = `Mine Raid L${S.raid.lvl} · Wave ${S.raid.wave}/${RAID_WAVES} · ${raidAlive()} enemies left · ${clock(S.raid.end - S.raid.t)}`;
  setHint(hint);
  // zone mood (Atlantis turns underwater)
  skyTarget.set(ZONES[zi].sky);
  const fg = ZONES[zi].fog || [70, 170];
  fogTarget.near = fg[0]; fogTarget.far = fg[1];
  const bossOn = !$('bossBar').classList.contains('hidden');
  setMusicTheme(pickMusicTheme(bossOn ? 'boss' : S.raid.active ? 'baseremix' : zi === 0 && player.pos.x < 20 ? 'base' : ZONE_THEME[ZONES[zi].id] || 'forest', dt));
}
function updateAmbience(dt) {
  const k = Math.min(1, dt * 1.5);
  scene.background.lerp(skyTarget, k); scene.fog.color.lerp(skyTarget, k);
  scene.fog.near += (fogTarget.near - scene.fog.near) * k; scene.fog.far += (fogTarget.far - scene.fog.far) * k;
}

// ----------------------------------------------------------- MAIN LOOP ---
function sanitizeRuntimePositions() {
  if (!player?.mesh?.position) return false;

  const playerPos = player.mesh.position;
  if (!hasFiniteXZ(playerPos)) playerPos.set(0, 0, 4);

  for (const e of entities) {
    if (!e?.mesh?.position) continue;

    // Entity positions should remain aliases of their mesh positions.
    e.pos = e.mesh.position;

    if (!hasFiniteXZ(e.pos)) {
      const fallback = hasFiniteXZ(e.home) ? e.home : playerPos;
      e.pos.copy(fallback);
    }

    if (!hasFiniteXZ(e.home)) {
      e.home = e.pos.clone();
    }

    if (
      e.target &&
      (!e.target.pos || !hasFiniteXZ(e.target.pos))
    ) {
      e.target = null;
    }
  }

  for (const s of soldiers) {
    if (!s?.mesh?.position) continue;

    // Soldier positions should remain aliases of their mesh positions.
    s.pos = s.mesh.position;

    if (!hasFiniteXZ(s.pos)) {
      s.pos.copy(playerPos);
    }

    if (
      s.target &&
      (!s.target.pos || !hasFiniteXZ(s.target.pos))
    ) {
      s.target = null;
    }
  }

  if (armyTarget && (!armyTarget.pos || !hasFiniteXZ(armyTarget.pos))) {
    armyTarget = null;
    if (targetRing) targetRing.visible = false;
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    if (!p?.target?.pos || !hasFiniteXZ(p.target.pos)) {
      if (p?.mesh) scene.remove(p.mesh);
      projectiles.splice(i, 1);
    }
  }

  return true;
}


function updateBars() {
  for (const e of entities) {
    const show = e.alive && e.hp < e.maxHp && !e.def.dummy;
    e.bar.visible = show && dist2(e.pos, player.pos) < 60 * 60;
    if (e.bar.visible) { e.bar.position.set(e.pos.x, e.barY, e.pos.z); e.bar.quaternion.copy(camera.quaternion); setBar(e.bar, e.hp / e.maxHp); }
  }
  for (const s of soldiers) {
    s.bar.visible = s.alive && s.hp < s.maxHp * 0.999;
    if (s.bar.visible) { s.bar.position.set(s.pos.x, s.barY, s.pos.z); s.bar.quaternion.copy(camera.quaternion); setBar(s.bar, s.hp / s.maxHp); }
  }
}
function claimDispenser(i) {
  const d = DISPENSERS[i];
  if (S.time < (S.disp[d.zone] || 0)) { toast(`Dispenser refills in ${clock(S.disp[d.zone] - S.time)}`, ''); return; }
  S.disp[d.zone] = S.time + DISPENSER_CD;
  const g = Math.round(d.gold * goldMult());
  spawnCoins(new THREE.Vector3(d.x, 0, d.z - 2), g);
  toast(`Dispenser: +${fmt(g)} gold. Come back in 5 minutes`, 'gold', 3500); sfx('sell'); burst(new THREE.Vector3(d.x, 3, d.z - 3), 0xffc83d, 16);
}
function openAnnex(g) {
  if (g.open) return;
  g.open = true; S.annexOpen[g.zone] = true;
  banner(`${ZONES[g.zone].name} Unlocked`, ZONES[g.zone].sub);
  toast(`${ZONES[g.zone].name} is open`, 'good', 4000);
}

// --------------------------------------------------- ULTIMATE LOOP SYSTEMS ---
const MOMENTUM_MAX = 10;
function addMomentum(amount = 1, reason = '') {
  if (S.mode !== 'play') return;
  const now = S.time;
  if (now - (S.momentumAt || 0) > 7) S.momentum = Math.max(0, S.momentum - 2);
  const before = S.momentum || 0;
  S.momentum = clamp(before + amount, 0, MOMENTUM_MAX);
  if (before < 8 && S.momentum >= 8) {
    banner('ON FIRE', '+35% gold while you keep the combo alive');
    sfx('level');
  }
  S.momentumAt = now;
  S.momentumBest = Math.max(S.momentumBest || 0, S.momentum);
  if (reason && S.momentum >= 3) {
    popNumber(player.pos, 3.1, `+${reason}`, 'gold');
  }
  updateMomentumHud(true);
}
function decayMomentum(dt) {
  if (!S.momentum) return;
  const idle = S.time - (S.momentumAt || 0);
  if (idle > 7) S.momentum = Math.max(0, S.momentum - dt * 0.45);
}
function updateMomentumHud(pop = false) {
  const el = $('momentumBox');
  if (!el) return;
  if (S.mode !== 'play' || S.momentum <= 0.05) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const pct = S.momentum / MOMENTUM_MAX * 100;
  const mult = comboGoldMult();
  const chain = Math.floor(S.chain?.count || 0);
  el.innerHTML = `<div class="mtop"><span class="mname">${S.momentum >= 8 ? 'ON FIRE' : S.momentum >= 5 ? 'MOMENTUM' : 'COMBO'}</span><span class="mval">x${mult.toFixed(2)} gold${chain >= 2 ? ` · CHAIN x${chain}` : ''}</span></div><div class="mbar"><i style="width:${pct}%"></i></div>`;
  if (pop) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}
function updateDirectorHud() {
  const el = $('directorBox');
  if (!el) return;
  if (!S.director?.active) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const left = Math.max(0, S.director.ends - S.time);
  const live = S.director.spawned.filter(e => e && e.alive).length;
  el.innerHTML = `<div class="dtitle">${S.director.label || 'ARMY RUSH'}</div><div class="dsub">${live} enemies remaining · +35% enemy gold · ${Math.ceil(left)}s</div>`;
}
function directorCandidates() {
  const zone = zoneAt(player.pos.x);
  return entities.filter(e => e.kind === 'enemy' && !e.def.boss && !e.def.passive && !e.def.raid && !e.def.event && !e.def.war && e.zone === zone && !e.alive);
}
function startArmyRush() {
  if (S.director.active || S.time < (S.director.next || 0) || S.kills < 8) return false;
  const candidates = directorCandidates();
  if (candidates.length < 3) return false;
  const count = Math.min(5, candidates.length);
  const spawned = [];
  const z = ZONES[zoneAt(player.pos.x)];
  for (let i = 0; i < count; i++) {
    const e = candidates[i];
    e.directorHome = e.directorHome || e.home.clone();
    const ang = (i / count) * Math.PI * 2 + rnd() * 0.6;
    const rrng = rr(10, 16);
    e.pos.set(clamp(player.pos.x + Math.cos(ang) * rrng, z.x0 + 3, z.x1 - 3), 0, clamp(player.pos.z + Math.sin(ang) * rrng, z.z0 + 3, z.z1 - 3));
    e.alive = true; e.mesh.visible = true; e.hp = e.maxHp; e.state = 'chase'; e.target = player; e.dying = 0; e.director = true; e.mul = 1.35;
    spawned.push(e);
  }
  S.director.active = true; S.director.ends = S.time + 28; S.director.next = S.time + 75; S.director.bonus = 1.35; S.director.label = 'ARMY RUSH'; S.director.spawned = spawned;
  banner('ARMY RUSH', 'A wave has entered your area — take them down for boosted gold');
  toast('Army Rush started · defeat the wave!', 'gold', 4500); sfx('command');
  updateDirectorHud();
  return true;
}
function updateDirector(dt) {
  if (!S.director.active) { if (S.mode === 'play' && S.time >= (S.director.next || 0)) startArmyRush(); return; }
  const spawned = S.director.spawned || [];
  const live = spawned.filter(e => e && e.alive).length;
  updateDirectorHud();
  if (live === 0 || S.time >= S.director.ends) {
    for (const e of spawned) {
      if (!e) continue;
      e.director = false; e.mul = 1;
      if (e.directorHome) { e.home.copy(e.directorHome); e.directorHome = null; }
      if (e.alive && !e.def.boss) { e.alive = false; e.mesh.visible = false; e.respawnAt = S.time + 1; }
    }
    S.director.active = false; S.director.bonus = 1; S.director.label = ''; S.director.spawned = [];
    toast(live === 0 ? 'Army Rush cleared · bonus secured!' : 'Army Rush ended', 'good', 2800);
    updateDirectorHud();
  }
}

function startRandomWorldEvent(){
  if(S.randomEvent?.active || S.time < (S.randomEvent?.next || 0) || S.kills < 12 || S.worldEvent?.active) return false;
  const zi=zoneAt(player.pos.x); const z=ZONES[zi];
  const kinds=roamingBossUnlocked()?['golden_hour','treasure_drop','hunt']:['golden_hour','treasure_drop']; const kind=kinds[Math.floor(rnd()*kinds.length)];
  S.randomEvent={active:true,kind,ends:S.time+(kind==='golden_hour'?24:34),next:S.time+105,reward:Math.round((zoneStats(zi).gold||1000)*30),label:'',zone:zi};
  if(kind==='golden_hour'){S.randomEvent.label='GOLDEN HOUR';banner('GOLDEN HOUR',`${z.name} · gold is worth 75% more for 24s`);toast('Stay active and cash in!','gold',4000);musicStinger('combo');}
  else if(kind==='treasure_drop'){
    const x=rr(z.x0+8,z.x1-8),zz=rr(z.z0+8,z.z1-8);
    const root=new THREE.Group();root.position.set(x,0,zz);const chest=part(G.box,0xb5782f,2.8,1.6,2,0,.8,0,root);part(G.box,0xffe066,.35,1.7,2.05,0,.8,0,root,new THREE.MeshLambertMaterial({color:0xffe066,emissive:0x8a5d00,emissiveIntensity:.65}));const orb=part(G.oct,0x7affb0,.42,.8,.42,0,3,0,root,new THREE.MeshBasicMaterial({color:0x7affb0,transparent:true,opacity:.95}));scene.add(root);S.randomEvent.chest=root;S.randomEvent.chestOrb=orb;banner('TREASURE DROP',`${z.name} · a bonus chest landed nearby`);toast('Find the glowing chest before time runs out!','gold',4200);musicStinger('legendary');
  } else {S.randomEvent.label='BOSS HUNT';banner('BOSS HUNT',`${z.name} · roaming boss rewards are doubled`);toast('A roaming boss is near the hunting grounds!','bad',4000);musicStinger('combo');}
  return true;
}
function updateRandomWorldEvent(dt){
  if(S.mode!=='play') return;
  const ev=S.randomEvent;
  if(!ev) return;
  if(!ev.active){if(S.time>=ev.next)startRandomWorldEvent();return;}
  if(ev.kind==='treasure_drop' && ev.chest){ev.chest.rotation.y+=dt*.25;if(ev.chestOrb){ev.chestOrb.rotation.y+=dt*3;ev.chestOrb.position.y=3+Math.sin(S.time*5)*.25;}if(dist2(ev.chest.position,player.pos)<6.5*6.5){const g=Math.round(ev.reward*2*goldMult());addGold(g);addLegacyPoints(4,'Treasure Drop');burst(ev.chest.position,0x7affb0,34);shock(ev.chest.position,8);musicStinger('legendary');toast(`Treasure Drop secured · +${fmt(g)} gold`,'gold',4200);scene.remove(ev.chest);ev.chest=null;ev.active=false;ev.kind='';ev.next=S.time+105;autoSave();return;}}
  if(S.time>=ev.ends){if(ev.chest){scene.remove(ev.chest);ev.chest=null;}if(ev.kind==='golden_hour')toast('Golden Hour ended','');else if(ev.kind==='hunt')toast('Boss Hunt ended','');ev.active=false;ev.kind='';ev.next=S.time+105;}
}
function updateRandomEventHud(){
  const el=$('directorBox'); if(!el||!S.randomEvent?.active)return;
  const ev=S.randomEvent,left=Math.max(0,ev.ends-S.time); const label=ev.label|| (ev.kind==='treasure_drop'?'TREASURE DROP':'WORLD EVENT');
  const existing=el.innerHTML; if(!existing || existing.includes('TREASURE DROP') || existing.includes('GOLDEN HOUR') || existing.includes('BOSS HUNT')) return;
  el.innerHTML=`<div class=\"dtitle\">${label}</div><div class=\"dsub\">${Math.ceil(left)}s · ${ZONES[ev.zone]?.name||'Current Area'}</div>`;
}

function tutorialData() {
  return [
    { k:'WELCOME', t:'Command school', d:'This game keeps the classic Control Army loop: build your army, click targets, collect resources, refine them for gold, then push into new areas.', g:'Start by learning the command loop.' },
    { k:'BARRACKS', t:'Build your first squad', d:'Walk to the Barracks pad. New barracks now arrive with a soldier so the opening is immediate.', g:`Current army: ${soldiers.length} unit${soldiers.length === 1 ? '' : 's'}.` },
    { k:'COLLECT', t:'Send the army to work', d:'Click a tree, flower, rock or enemy. Your troops move to the target and keep fighting or collecting until it is destroyed.', g:`Collected: ${fmt(S.packCount)} item${S.packCount === 1 ? '' : 's'}.` },
    { k:'REFINE', t:'Turn loot into gold', d:'Bring resources back to the Sell pad at base. Upgrading your bag and wand makes this loop faster.', g:`Sold items: ${fmt(S.sold)}.` },
    { k:'LEAD', t:'Lead from the front', d:'Rally keeps your army together. Stay close enough to protect ranged units, healers and tanks while the squad levels its barracks.', g:`Enemies defeated: ${fmt(S.kills)}.` },
    { k:'EXPAND', t:'Open the next area', d:'The early progression uses troop-count gates: 5 units for Riverlands, 10 for Mountains, 15 for Desert and 25 for Atlantis.', g:`Current army: ${soldiers.length} / 5 needed for Riverlands.` },
  ];
}
function renderTutorial() {
  const ov = $('overlay');
  if (!ov || S.tutorialDone || S.mode !== 'play') { if (ov && !ov.dataset.keep) ov.classList.add('hidden'); return; }
  const data = tutorialData()[S.tutorialStep] || tutorialData().at(-1);
  ov.dataset.keep = 'tutorial'; ov.classList.remove('hidden','tutorial'); ov.classList.add('tutorial');
  ov.innerHTML = `<div class="tutorial-card"><div class="tutorial-kicker">${data.k}</div><h2>${data.t}</h2><p>${data.d}</p><div class="tutorial-goal">${data.g}</div><div class="tutorial-actions"><button class="tutorial-skip" data-tut="skip">Skip</button><button class="tutorial-next" data-tut="next">${S.tutorialStep >= tutorialData().length - 1 ? 'Finish' : 'Got it'}</button></div></div>`;
}
function tutorialAdvance() {
  if (S.tutorialDone) return;
  S.tutorialStep++;
  if (S.tutorialStep >= tutorialData().length) { S.tutorialDone = true; $('overlay').classList.add('hidden'); delete $('overlay').dataset.keep; toast('Commander tutorial complete · you are cleared for the full map', 'good', 4000); sfx('level'); return; }
  renderTutorial();
}
function updateTutorial() {
  if (S.tutorialDone || S.mode !== 'play') return;
  if (S.tutorialStep === 2 && S.packCount > 0) tutorialAdvance();
  else if (S.tutorialStep === 3 && S.sold > 0) tutorialAdvance();
  else if (S.tutorialStep === 4 && S.kills > 0) tutorialAdvance();
  else if (S.tutorialStep === 5 && soldiers.length >= 5) tutorialAdvance();
}

function updateGates(dt) {
  for (const g of annexGateObjs) {
    if (!g.open && gateRebirthUnlocked(g) && g.req.units && soldiers.length >= g.req.units && Math.abs(player.pos.x - g.x) < 14 && player.pos.z > 25 && S.mode === 'play') openAnnex(g);
    if (g.open && g.anim < 1) { if (g.anim === 0) sfx('gate'); g.anim = Math.min(1, g.anim + dt * 0.6); g.bars.position.y = -6.5 * g.anim; g.sign.visible = false; }
  }
  for (const g of gateObjs) {
    if (!g.open && gateRebirthUnlocked(g) && soldiers.length >= g.req && (!g.boss || S.bossesDown[g.boss]) && Math.abs(player.pos.x - g.x) < 14 && S.mode === 'play') {
      g.open = true;
      banner(`${ZONES[g.zone].name} Unlocked`, ZONES[g.zone].sub);
      toast(`You have ${soldiers.length} units. ${ZONES[g.zone].name} is open`, 'good', 4000); addLegacyPoints(3, `${ZONES[g.zone].name} unlocked`); autoSave();
    }
    if (g.open && g.anim < 1) {
      if (g.anim === 0) sfx('gate');
      g.anim = Math.min(1, g.anim + dt * 0.6);
      g.bars.position.y = -6.5 * g.anim;
      g.sign.visible = false;
    }
  }
}
let hudT = 0;
function update(dt) {
  if (!sanitizeRuntimePositions()) return;
  S.time += dt;
  if (S.mode === 'title') { cam.tYaw += dt * 0.08; cam.tDist = 42; updateEnemies(dt); updateCamera(dt); return; }
  for (const k in S.potions) if (S.potions[k] > 0) { S.potions[k] = Math.max(0, S.potions[k] - dt); if (S.potions[k] === 0) toast(`${POTIONS[k].name} wore off`, ''); }
  for (const k of ['shield', 'rage', 'beast', 'chocolate', 'raptor', 'minotaur', 'block']) if (S.fx[k] > 0) S.fx[k] = Math.max(0, S.fx[k] - dt);
  if (S.skillCd > 0) S.skillCd = Math.max(0, S.skillCd - dt);
  if (S.skillCd2 > 0) S.skillCd2 = Math.max(0, S.skillCd2 - dt);
  updatePlayer(dt);
  updateSoldiers(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateCoins(dt);
  for (let i = effects.length - 1; i >= 0; i--) if (effects[i].update(dt, S.time) === true) effects.splice(i, 1);
  updateGates(dt);
  updateCapturePosts(dt); updateCommandEvent(dt); updateExpedition(dt); updateBounties(dt); updateEliteHunt(dt);
  updateAmbience(dt);
  updateBank(dt); updateShells(); updateMeteor(dt); updateRaid(dt); cullEntities(dt);
  updatePets(dt); updateUfo(dt); updateWar(dt); checkBadges(dt);
  checkArchiveMilestones();
  decayMomentum(dt); decayChain(dt); updateDirector(dt); updateRandomWorldEvent(dt); updateRoamerTimers(); updateSecrets(dt); updateDailyOrder(); updateDailyHud(); updateTutorial(); updateContract(dt); updateContractHud(); updateTrial(dt); checkLegacyMilestones(); updateSeason(); updateSeasonHud(); autoSaveTick(dt);
  if (targetRing.visible) {
    const e = targetRing.userData.ent;
    if (!e || !e.alive) targetRing.visible = false;
    else { targetRing.position.set(e.pos.x, 0.15, e.pos.z); const s = e.radius + 0.6 + Math.sin(S.time * 6) * 0.1; targetRing.scale.set(s, s, s); }
  }
  if (moveMarker.visible) { moveMarker.userData.t += dt; moveMarker.material.opacity = Math.max(0, 1 - moveMarker.userData.t); moveMarker.scale.setScalar(1 + moveMarker.userData.t); if (moveMarker.userData.t > 1) moveMarker.visible = false; }
  for (const p of PADS) p.ring.scale.setScalar(1 + Math.sin(S.time * 3) * 0.04);
  updateCamera(dt);
  hudT -= dt;
  if (hudT <= 0) { hudT = 0.25; updateHud(); updateBossBar(); drawMinimap(); updateExtrasHud(); }
}
function render() { updateBars(); renderer.render(scene, camera); updatePops(0); }
let last = performance.now(), last0 = performance.now(), frames = 0, fpsT = 0, manual = false;
function loop(now) {
  requestAnimationFrame(loop);
  const elapsed = Math.max(0, (now - last0) / 1000);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!manual) { update(dt); updatePops(dt); render(); perfTick(elapsed); }
  last0 = now;
  frames++; fpsT += elapsed;
  if (fpsT >= 1) { fpsEl.textContent = `FPS ${Math.round(frames / fpsT)} · draws ${renderer.info.render.calls} · scale ${perf.scale.toFixed(2)}x`; frames = 0; fpsT = 0; }
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------- TEST HOOKS ---
window.advanceTime = (ms) => {
  manual = true;
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) { update(1 / 60); updatePops(1 / 60); }
  render(); manual = false;
};
window.render_game_to_text = () => JSON.stringify({
  note: 'x east (forest base -> riverlands -> mountains -> desert -> atlantis), z north/south, y up',
  mode: S.mode, gold: Math.floor(S.gold), bag: S.packCount + '/' + packCap(), units: soldiers.length, rebirths: S.rebirths || 0, bossesUnlocked: bossUnlocked(), roamingBossesUnlocked: roamingBossUnlocked(), zone: ZONES[zoneAt(player.pos.x, player.pos.z)].name,
  barracks: S.barracks.map((b) => ({ t: TROOPS[b.type].id, lv: b.level, xp: Math.floor(b.xp), troops: b.troops, cap: barrackCap(b.level), w: b.weapon, a: b.armor })),
  player: { x: +player.pos.x.toFixed(1), z: +player.pos.z.toFixed(1), hp: Math.round(player.hp) },
  army: soldiers.map((s) => ({ t: s.def.id, hp: Math.round(s.hp), st: s.state, x: +s.pos.x.toFixed(1), z: +s.pos.z.toFixed(1) })),
  target: armyTarget ? { name: armyTarget.def.name, hp: Math.round(armyTarget.hp) } : null,
  command: {mode:S.command.mode,formation:S.command.formation,priority:S.command.priority,orders:S.command.orders||0}, commander:{id:S.commander.id,level:commanderLevel(),xp:S.commander.xp}, trial:{active:S.trial.active,id:S.trial.id,progress:trialProgress(),ends:S.trial.ends},
  commandPosts: captureObjs.filter(o=>o.root.visible).map(o=>({id:o.def.id,owner:o.owner,progress:Math.round(o.progress)})),
  expedition:{active:!!S.expedition.active,id:S.expedition.id,difficulty:S.expedition.difficulty,wave:S.expedition.wave,waves:S.expedition.waves,kills:S.expedition.kills,clears:S.expedition.clears||0,best:S.expedition.best||0},
  bounty:{completed:S.bounty?.completed||0,streak:S.bounty?.streak||0,slots:(S.bounty?.slots||[]).map(b=>({target:b.target,progress:b.progress,goal:b.goal,claimed:!!b.claimed}))}, eliteHunt:{active:!!S.eliteHunt?.active,type:S.eliteHunt?.type||'',ends:S.eliteHunt?.ends||0},
  nearby: entities.filter((e) => e.alive && dist2(e.pos, player.pos) < 400).slice(0, 10).map((e) => ({ n: e.def.name, x: +e.pos.x.toFixed(1), z: +e.pos.z.toFixed(1), hp: Math.round(e.hp) })),
  gates: gateObjs.map((g) => g.open), kills: S.kills, skill: S.skill, quests: S.quests,
});
window.__game = { get actx() { return actx; }, get musicGain() { return musicGain; }, S, soldiers, entities, player, armySynergy, bossMasteryBonus, recordBossMastery, commandAttack, setCommandMode, setFormation, setTargetPriority, chooseCommandTarget, discoverSecret, startRandomWorldEvent, startExpedition, updateExpedition, refreshBounties, claimBounty, activateEliteHunt, addGold, buyBarrack, buyTroop,fusePets,
 buyItem, sellAll, gateObjs, cam, makeSave, loadSave, spinWheel, useSkill, giveLoot, startTrial, promoteBarrack, gainCommanderXp, checkSummon, equipBest, drink, craft, redeemCode, annexGateObjs, teleportTo, enchantItem, summonFromAltar, payAnnex, claimDispenser, mushyAct, craftRecipe, addKey, openPanel, refreshTitle, ITEMS, rebuildTroops, refreshSoldierStats, buyPlot, deleteBarrack, trainBarrack, bankDeposit, bankWithdraw, claimGift, startRaid, music, setMusicTheme, PLOTS, raidPool, rubyAct, rubyProgress, doRebirth, saveTeam, loadTeam, pickMusicTheme, get frozenStats() { return frozenStats; }, perf, get meteorEnt() { return meteorEnt; }, get ufoEnt() { return ufoEnt; }, forceUfo: () => { ufoNext = 0; }, hatchEgg, equipBestPets, buyResearch, joinFaction, flagObjs, guardPool, alienPool, petBonus, badgeList, musicStinger, energyBlast, forceMeteor: () => { meteorNext = 0; }, applySettings, drawWorldMap,
 // Multiplayer adapter hooks. Boss options retain the game's local zone, summon and roaming unlock checks.
 getCoopBossOptions: () => Object.entries(ENEMIES).filter(([id,d]) => d && d.boss && !d.raid && !d.event && !d.war && zoneUnlocked(d.zone) && (!d.roaming || roamingBossUnlocked()) && (!d.summoned || entities.some(e => e.typeId === id && e.kind === 'enemy' && e.alive && !e._coopRaid))).map(([id,d]) => ({id, name:d.name, hp:d.hp, zone:d.zone, roaming:!!d.roaming})).sort((a,b) => a.zone-b.zone || a.name.localeCompare(b.name)),
 spawnCoopBoss: (id, maxHp) => {
   const def = ENEMIES[id];
   if (!def || !def.boss || def.raid || def.event || def.war || !zoneUnlocked(def.zone) || (def.roaming && !roamingBossUnlocked()) || (def.summoned && !entities.some(existing => existing.typeId === id && existing.kind === 'enemy' && existing.alive && !existing._coopRaid))) return null;
   const x = -10, z = 0;
   const e = spawnEntity('enemy', id, x, z);
   e.zone = 0; e.home.set(x, 0, z); e.pos.set(x, 0, z); e.alive = true; e.mesh.visible = true; e.respawnAt = Infinity; e.dying = 0;
   e.hp = e.maxHp = Math.max(1, Number.isFinite(Number(maxHp)) ? Number(maxHp) : def.hp);
   e._coopRaid = true; e._coopRaidResolved = false; e.golden = false; e.mul = 1; e.eliteHunt = false; e.eliteEnds = 0;
   e.target = null; e.state = 'idle'; e.bossPhase = 0; e.phaseMul = 1; e.enraged = false; e.bossAttackCount = 0; e.castLockT = 0; e.vuln = 0; e.lastExposeNotice = -99; e.lastSignatureCallout = -99;
   if (e.tag) e.tag.visible = true;
   e.model.body.scale.setScalar(e.model.body.userData.s0 ?? e.model.body.scale.x);
   return e;
 },
 killCoopBoss: e => { if (e && e._coopRaid && e.alive && !e._coopRaidResolved) { e._coopRaidResolved = true; e.hp = 1; killEntity(e, null); return true; } return false; },
 removeCoopBoss: e => { if (!e || !e._coopRaid) return; e.alive = false; e.respawnAt = Infinity; if (armyTarget === e) { armyTarget = null; targetRing.visible = false; } for (const s of soldiers) if (s.target === e) { s.target = null; s.state = 'follow'; } if (e.bar) scene.remove(e.bar); if (e.mesh) scene.remove(e.mesh); for (let i=pickables.length-1;i>=0;i--) if (pickables[i]?.userData?.ent === e) pickables.splice(i,1); const i=entities.indexOf(e); if(i>=0)entities.splice(i,1); },
 createCoopAvatar: (id, name, color) => { const m = makeAvatar({shirt:Number(color)||0x58c8ff,pants:0x2b3a6e,skin:0xffd6a3,scale:1.05}); const tag=makeLabel(String(name||'Ally').slice(0,18),'#ffffff','rgba(20,26,48,.94)',26); tag.position.set(0,m.height+1,0); m.root.add(tag); scene.add(m.root); return {id:String(id),root:m.root,tag}; },
 removeCoopAvatar: avatar => { if (avatar?.root) scene.remove(avatar.root); },
 setCoopArena: () => {
   const saved={player:{x:player.pos.x,y:player.pos.y,z:player.pos.z,rot:player.mesh.rotation.y,hp:player.hp,moveTo:player.moveTo?{x:player.moveTo.x,y:player.moveTo.y,z:player.moveTo.z}:null,vel:{x:player.vel.x,y:player.vel.y,z:player.vel.z}},soldiers:soldiers.map(s=>({ref:s,x:s.pos.x,y:s.pos.y,z:s.pos.z,rot:s.mesh?.rotation?.y||0,state:s.state,target:s.target,holdPos:s.holdPos?{x:s.holdPos.x,y:s.holdPos.y,z:s.holdPos.z}:null})),camera:{target:{x:cam.target.x,y:cam.target.y,z:cam.target.z},yaw:cam.yaw,tYaw:cam.tYaw,dist:cam.dist,tDist:cam.tDist}};
   player.pos.set(-25,0,0); player.mesh.rotation.y=Math.PI/2; player.moveTo=null; player.vel.set(0,0,0); player.vy=0; player.hp=player.maxHp; player.alive=true;
   for(let i=0;i<soldiers.length;i++){const s=soldiers[i];const a=i*2.399;const r=1.5+(i%4)*0.35;s.pos.set(-25+Math.cos(a)*r,0,Math.sin(a)*r);s.moving=false;s.target=null;s.state='follow';}
   if(cam.target)cam.target.copy(player.pos); if(cam.tTarget?.copy)cam.tTarget.copy(player.pos); if(cam.tTarget)cam.tTarget=cam.target.clone();
   if(cam.tYaw!==undefined)cam.tYaw=Math.PI/2+0.2; if(cam.tDist!==undefined)cam.tDist=24;
   window.__coopInRaid=true; return saved;
 },
 restoreCoopArena: saved => {
   if(!saved)return; player.pos.set(saved.player.x,saved.player.y,saved.player.z);player.mesh.rotation.y=saved.player.rot;player.hp=Math.min(player.maxHp,Math.max(1,saved.player.hp));player.alive=true;
   player.moveTo=saved.player.moveTo?new THREE.Vector3(saved.player.moveTo.x,saved.player.moveTo.y,saved.player.moveTo.z):null;player.vel.set(saved.player.vel.x,saved.player.vel.y,saved.player.vel.z);
   for(const data of saved.soldiers||[]){const s=data.ref;if(!s||!soldiers.includes(s))continue;s.pos.set(data.x,data.y,data.z);if(s.mesh?.rotation)s.mesh.rotation.y=data.rot;s.state=data.state;s.target=data.target?.alive?data.target:null;s.holdPos=data.holdPos?new THREE.Vector3(data.holdPos.x,data.holdPos.y,data.holdPos.z):null;s.moving=false;}
   if(saved.camera?.target&&cam.target)cam.target.set(saved.camera.target.x,saved.camera.target.y,saved.camera.target.z);if(saved.camera?.yaw!==undefined)cam.yaw=saved.camera.yaw;if(saved.camera?.tYaw!==undefined)cam.tYaw=saved.camera.tYaw;if(saved.camera?.dist!==undefined)cam.dist=saved.camera.dist;if(saved.camera?.tDist!==undefined)cam.tDist=saved.camera.tDist;
   window.__coopInRaid=false;
 },
 };

// --------------------------------------------------------------- START ---
try { await Promise.race([document.fonts.load('400 40px "Lilita One"'), new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}
buildWorld();
populate();
buildCommandPosts();
buildSecrets();
initRoamers();
normalizeBossLocks();
buyBarrack(0, true);
freezeStatic();
player.maxHp = playerMaxHp(); player.hp = player.maxHp;
try {
  const raw = localStorage.getItem('army_control_auto_v12');
  if (raw) { $('continueBtn')?.classList.remove('hidden'); $('continueBtn').textContent='Continue'; }
} catch(e) {}
updateCamera(1);
updateHud();
requestAnimationFrame(loop);

function beginPlay(){
  initAudio(); applySettings();
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  S.mode = 'play';
  S.momentum = 0; S.momentumAt = S.time; S.chain = { count:0, lastAt:-99, best:Number(S.chain?.best)||0 }; S.director.active = false;
  chooseDailyOrder(); chooseContract(); refreshSeasonCalendar(); refreshBounties(); unlockBosses(); S.command.mode='follow'; updateCommandHud(); updateSeasonHud();
  cam.tYaw = Math.PI * 0.5 + 0.35; cam.yaw = cam.tYaw; cam.tDist = 24;
  cam.target.copy(player.pos);
  banner('Forest', S.tutorialDone ? 'Welcome back, commander' : 'Your base is stocked. Command your first squad');
  sfx('command');
  if (!S.tutorialDone) { S.tutorialStep = Math.max(0, Math.min(5, S.tutorialStep || 0)); renderTutorial(); }
}
$('playBtn').onclick = beginPlay;
$('continueBtn')?.addEventListener('click', () => { if(loadAutoSave()) beginPlay(); });
$('overlay').addEventListener('click', (e) => {
  const a = e.target.closest('[data-tut]'); if (!a) return;
  if (a.dataset.tut === 'skip') { S.tutorialDone = true; $('overlay').classList.add('hidden'); delete $('overlay').dataset.keep; toast('Tutorial skipped · Help has the controls', '', 2600); }
  else tutorialAdvance();
});
$('btnLegacy').onclick = () => togglePanel('legacy');
$('btnCommand').onclick = () => { if(panelState.open && panelState.kind==='command') closePanel(); else openPanel('command',0); };
$('btnArmy').onclick = () => togglePanel('army');
$('btnQuests').onclick = () => togglePanel('quests');
$('btnMore').onclick = () => togglePanel('more');
$('btnIndex').onclick = () => togglePanel('index');
$('btnSave').onclick = () => togglePanel('save');
$('btnHelp').onclick = () => togglePanel('help');
$('btnSound').onclick = () => togglePanel('settings');
$('btnGifts').onclick = () => togglePanel('gifts');
$('btnPets').onclick = () => togglePanel('pets');
$('btnWar').onclick = () => togglePanel('war');
$('btnBounty').onclick = () => togglePanel('bounties');
$('btnSeason').onclick = () => togglePanel('season');
$('btnExpeditions').onclick = () => togglePanel('expeditions');
$('btnArchive').onclick = () => togglePanel('archive');
$('panelBody').addEventListener('input', (e) => { const r = e.target.closest('input[data-range]'); if (!r) return; S[r.dataset.range] = +r.value; applySettings(); });
$('btnCodes').onclick = () => togglePanel('codes');
$('btnWheel').onclick = () => togglePanel('wheel');
$('btnRotL').onclick = () => { cam.tYaw += 0.6; };
$('btnRotR').onclick = () => { cam.tYaw -= 0.6; };
$('btnRally').onclick = () => rally();
$('btnSkill').onclick = () => useSkill(0);
$('btnSkill2').onclick = () => useSkill(1);
$('btnTele').onclick = () => togglePanel('teleport');

// V10 quick-access keys
window.addEventListener('keydown', (e) => {
  if (S.mode !== 'play') return;
  const k=e.key.toLowerCase();
  if (k==='l' && !e.repeat) togglePanel('legacy');
  if (k==='m' && !e.repeat) togglePanel('archive');
});