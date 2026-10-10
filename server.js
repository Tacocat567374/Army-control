'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { WebSocketServer, WebSocket } = require('ws');

const ROOT = __dirname;
const PORT = Math.max(1, Math.min(65535, Number(process.env.PORT) || 3000));
const MAX_PLAYERS_PER_ROOM = 4;
const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MAX_NAME_LENGTH = 18;
const MAX_WS_MESSAGE = 16 * 1024;

// Allowlist is intentionally limited to bosses defined by the game. The client
// also filters by its own zone/summon unlocks; the server rechecks each roster.
const BOSSES = Object.freeze({
  goldengolem:       { name: 'Golden Golem', hp: 4e3, zone: 0 },
  whiteflower:       { name: 'White Flower', hp: 25e3, zone: 1 },
  emeraldgolem:      { name: 'Emerald Golem', hp: 120e3, zone: 2 },
  pharaoh:           { name: 'Pharaoh', hp: 4e5, zone: 3 },
  lordofsands:       { name: 'Lord of Sands', hp: 7e5, zone: 3, summoned: true },
  sapphiregolem:     { name: 'Sapphire Golem', hp: 1.5e6, zone: 4 },
  sirshark:          { name: 'Sir Shark', hp: 3e6, zone: 4, summoned: true },
  wisetree:          { name: 'Wise Tree', hp: 30e6, zone: 5 },
  spiderqueen:       { name: 'Spider Queen', hp: 60e6, zone: 5, summoned: true },
  worldeater:        { name: 'World Eater', hp: 250e6, zone: 6, summoned: true },
  primalworldeater:  { name: 'Primal World Eater', hp: 700e6, zone: 6, summoned: true },
  mutantgnome:       { name: 'Mutant Gnome', hp: 400e6, zone: 7 },
  minotaur:          { name: 'Minotaur', hp: 2e9, zone: 7, summoned: true },
  phoenixboss:       { name: 'Phoenix', hp: 7e9, zone: 8 },
  wisebird:          { name: 'Wise Bird', hp: 5e9, zone: 8 },
  soulking:          { name: 'Ghost King', hp: 12e9, zone: 9 },
  ghostpharaoh:      { name: 'Ghost Pharaoh', hp: 16e9, zone: 9 },
  jungleking:        { name: 'Lord Rex', hp: 28e9, zone: 10 },
  thepenguin:        { name: 'THE Penguin', hp: 45e9, zone: 11 },
  frostgiant:        { name: 'Frost Giant', hp: 65e9, zone: 11 },
  kingcrab:          { name: 'King Crab', hp: 15e9, zone: 13 },
  infernotitan:      { name: 'Inferno Titan', hp: 120e9, zone: 14 },
  ufooverlord:       { name: 'UFO Overlord', hp: 220e9, zone: 15 },
  ancientent:        { name: 'Ancient Ent', hp: 420e9, zone: 16 },
  thunderking:       { name: 'Thunder King', hp: 800e9, zone: 17 },
  citadelcommander:  { name: 'Citadel Commander', hp: 1.4e12, zone: 18 },
  staremperor:       { name: 'Star Emperor', hp: 2.8e12, zone: 19 },
  roamerwarlord:     { name: 'Wandering Warlord', hp: 8e6, zone: 0, roaming: true },
  voidstalker:       { name: 'Void Stalker', hp: 250e6, zone: 0, roaming: true },
  starhunter:        { name: 'Star Hunter', hp: 500e9, zone: 0, roaming: true },
});

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/game.html';
    const filePath = path.resolve(ROOT, `.${pathname}`);
    if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Forbidden'); return;
    }
    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': path.extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=300',
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Bad request');
  }
});

const wss = new WebSocketServer({ server, maxPayload: MAX_WS_MESSAGE });
const rooms = new Map();
const socketsById = new Map();

function safeText(value, max = MAX_NAME_LENGTH) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}
function validCode(value) { return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(String(value || '').toUpperCase()); }
function send(ws, message) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}
function broadcast(room, message, exceptId = null) {
  for (const member of room.members.values()) {
    if (member.id !== exceptId) send(member.ws, message);
  }
}
function randomCode() {
  for (let attempt = 0; attempt < 80; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) code += ROOM_CODE_CHARS[crypto.randomInt(ROOM_CODE_CHARS.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error('Unable to allocate a room code');
}
function currentRoom(player) { return player?.roomCode ? rooms.get(player.roomCode) || null : null; }
function roomPlayers(room) {
  return [...room.members.values()].map(p => ({
    id: p.id, name: p.name, rebirths: p.rebirths, host: p.id === room.hostId,
    damage: Math.floor(room.contributions.get(p.id) || 0), online: p.ws.readyState === WebSocket.OPEN,
    x: Number.isFinite(p.position?.x) ? p.position.x : null,
    z: Number.isFinite(p.position?.z) ? p.position.z : null,
    rot: Number.isFinite(p.position?.rot) ? p.position.rot : 0,
  }));
}
function roomState(room) {
  return {
    type: 'room_state', code: room.code, hostId: room.hostId, status: room.status,
    players: roomPlayers(room), bossId: room.bossId, bossName: room.bossId ? BOSSES[room.bossId]?.name : null,
    hp: room.hp, maxHp: room.maxHp, phase: room.maxHp > 0 ? (room.hp / room.maxHp <= .25 ? 3 : room.hp / room.maxHp <= .5 ? 2 : room.hp / room.maxHp <= .75 ? 1 : 0) : 0,
  };
}
function emitRoomState(room) { broadcast(room, roomState(room)); }
function removeFromRoom(player, reason = 'left') {
  const room = currentRoom(player);
  if (!room) { player.roomCode = null; return; }
  room.members.delete(player.id);
  room.contributions.delete(player.id);
  player.roomCode = null;
  if (room.members.size === 0) { rooms.delete(room.code); return; }
  if (room.hostId === player.id) room.hostId = room.members.keys().next().value;
  broadcast(room, { type: 'player_left', id: player.id, name: player.name, reason });
  emitRoomState(room);
}
function eligibleForBoss(player, bossId) {
  const boss = BOSSES[bossId];
  if (!boss || !Array.isArray(player.eligibleBosses) || !player.eligibleBosses.includes(bossId)) return false;
  if (boss.roaming && player.rebirths < 3) return false;
  return true;
}
function startRaid(room, host, bossId) {
  const boss = BOSSES[bossId];
  if (!boss) return send(host.ws, { type: 'error', message: 'That boss is not available for co-op raids.' });
  if (room.hostId !== host.id) return send(host.ws, { type: 'error', message: 'Only the room host can start the raid.' });
  if (room.members.size < 2) return send(host.ws, { type: 'error', message: 'Invite at least one other player before starting a co-op raid.' });
  if (room.status === 'raid') return send(host.ws, { type: 'error', message: 'A raid is already in progress.' });
  for (const member of room.members.values()) {
    if (!eligibleForBoss(member, bossId)) return send(host.ws, { type: 'error', message: `${member.name} has not unlocked ${boss.name} in their own save yet.` });
  }
  room.status = 'raid'; room.bossId = bossId;
  // Shared boss HP scales with the players in the room. Individual local clients
  // render the same raid boss and the server owns this health value.
  room.maxHp = Math.max(1, Math.floor(boss.hp * (1 + Math.max(0, room.members.size - 1) * 0.65)));
  room.hp = room.maxHp; room.contributions = new Map([...room.members.keys()].map(id => [id, 0]));
  room.lastDamageWindow = new Map(); room.completedAt = 0;
  for (const member of room.members.values()) member.position = null;
  broadcast(room, { type: 'raid_started', code: room.code, bossId, bossName: boss.name, hp: room.hp, maxHp: room.maxHp, playerCount: room.members.size, arena: true });
  emitRoomState(room);
}
function handleMessage(ws, raw) {
  let msg;
  try { msg = JSON.parse(raw.toString()); } catch { return send(ws, { type: 'error', message: 'Invalid message format.' }); }
  if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.type !== 'string') return;
  const player = ws.player;
  if (!player) return;
  if (msg.type === 'hello') {
    player.name = safeText(msg.name, MAX_NAME_LENGTH) || `Commander-${player.id.slice(0, 4)}`;
    player.rebirths = Math.max(0, Math.floor(Number(msg.rebirths) || 0));
    player.eligibleBosses = Array.isArray(msg.eligibleBosses) ? msg.eligibleBosses.filter(id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(BOSSES, id)).slice(0, 80) : [];
    send(ws, { type: 'hello_ok', id: player.id, name: player.name, roomCode: player.roomCode, bosses: Object.keys(BOSSES) });
    const room = currentRoom(player); if (room) emitRoomState(room);
    return;
  }
  if (!player.name) return send(ws, { type: 'error', message: 'Please connect your player profile first.' });
  if (msg.type === 'create_room') {
    if (currentRoom(player)) return send(ws, { type: 'error', message: 'Leave your current room before creating another.' });
    const code = randomCode();
    player.name = safeText(msg.name, MAX_NAME_LENGTH) || player.name;
    player.rebirths = Math.max(0, Math.floor(Number(msg.rebirths) || 0));
    player.eligibleBosses = Array.isArray(msg.eligibleBosses) ? msg.eligibleBosses.filter(id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(BOSSES, id)).slice(0, 80) : player.eligibleBosses;
    const room = { code, hostId: player.id, members: new Map([[player.id, player]]), status: 'lobby', bossId: null, hp: 0, maxHp: 0, contributions: new Map(), lastDamageWindow: new Map(), createdAt: Date.now(), completedAt: 0 };
    player.roomCode = code; rooms.set(code, room);
    send(ws, { type: 'room_created', code, hostId: player.id }); emitRoomState(room); return;
  }
  if (msg.type === 'join_room') {
    if (currentRoom(player)) return send(ws, { type: 'error', message: 'Leave your current room before joining another.' });
    const code = safeText(msg.code, 6).toUpperCase();
    if (!validCode(code)) return send(ws, { type: 'error', message: 'Enter a valid six-character room code.' });
    const room = rooms.get(code);
    if (!room) return send(ws, { type: 'error', message: 'Room not found. Ask the host for a fresh code.' });
    if (room.status === 'raid') return send(ws, { type: 'error', message: 'That raid has already started. Join the next room or ask the host to rematch.' });
    if (room.members.size >= MAX_PLAYERS_PER_ROOM) return send(ws, { type: 'error', message: 'That room is full (maximum 4 players).' });
    player.name = safeText(msg.name, MAX_NAME_LENGTH) || player.name;
    player.rebirths = Math.max(0, Math.floor(Number(msg.rebirths) || 0));
    player.eligibleBosses = Array.isArray(msg.eligibleBosses) ? msg.eligibleBosses.filter(id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(BOSSES, id)).slice(0, 80) : player.eligibleBosses;
    player.roomCode = code; player.position = null; room.members.set(player.id, player); room.contributions.set(player.id, 0);
    send(ws, { type: 'room_joined', code, hostId: room.hostId }); emitRoomState(room); return;
  }
  const room = currentRoom(player);
  if (msg.type === 'leave_room') {
    if (!room) return send(ws, { type: 'room_left' });
    const code = room.code; removeFromRoom(player, 'left'); send(ws, { type: 'room_left', code }); return;
  }
  if (!room) return send(ws, { type: 'error', message: 'Join or create a room first.' });
  if (msg.type === 'start_raid') {
    if (Array.isArray(msg.eligibleBosses)) player.eligibleBosses = msg.eligibleBosses.filter(id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(BOSSES, id)).slice(0, 80);
    player.rebirths = Math.max(0, Math.floor(Number(msg.rebirths) || player.rebirths || 0));
    startRaid(room, player, safeText(msg.bossId, 40)); return;
  }
  if (msg.type === 'damage') {
    if (room.status !== 'raid' || room.hp <= 0 || msg.bossId !== room.bossId) return;
    const amount = Number(msg.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const now = Date.now();
    const window = room.lastDamageWindow.get(player.id) || { start: now, used: 0 };
    if (now - window.start >= 1000) { window.start = now; window.used = 0; }
    // Lightweight rate limit against accidental duplicate packets/extreme client values.
    const cap = Math.max(500, Math.min(Number.MAX_SAFE_INTEGER, room.maxHp * 0.12));
    const applied = Math.min(amount, Math.max(0, cap - window.used));
    if (applied <= 0) { room.lastDamageWindow.set(player.id, window); return; }
    window.used += applied; room.lastDamageWindow.set(player.id, window);
    const realDamage = Math.min(room.hp, Math.floor(applied));
    if (realDamage <= 0) return;
    room.hp = Math.max(0, room.hp - realDamage);
    room.contributions.set(player.id, (room.contributions.get(player.id) || 0) + realDamage);
    broadcast(room, { type: 'raid_state', code: room.code, bossId: room.bossId, hp: room.hp, maxHp: room.maxHp, phase: room.maxHp > 0 ? (room.hp / room.maxHp <= .25 ? 3 : room.hp / room.maxHp <= .5 ? 2 : room.hp / room.maxHp <= .75 ? 1 : 0) : 0, lastHitBy: player.id });
    if (room.hp <= 0 && room.status === 'raid') {
      room.status = 'completed'; room.completedAt = now;
      broadcast(room, { type: 'raid_completed', code: room.code, bossId: room.bossId, bossName: BOSSES[room.bossId]?.name, contributions: Object.fromEntries(room.contributions), players: roomPlayers(room) });
    } else if (now - (room.lastRosterBroadcast || 0) > 1000) {
      room.lastRosterBroadcast = now; emitRoomState(room);
    }
    return;
  }
  if (msg.type === 'position') {
    if (room.status !== 'raid') return;
    const x = Number(msg.x), z = Number(msg.z), rot = Number(msg.rot);
    if (![x,z,rot].every(Number.isFinite) || Math.abs(x) > 2000 || Math.abs(z) > 200) return;
    player.position = { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, rot: Math.round(rot * 100) / 100 };
    broadcast(room, { type: 'peer_position', id: player.id, name: player.name, x: player.position.x, z: player.position.z, rot: player.position.rot }, player.id);
    return;
  }
  if (msg.type === 'chat') {
    const text = safeText(msg.text, 120); if (!text) return;
    broadcast(room, { type: 'chat', id: player.id, name: player.name, text, at: Date.now() }); return;
  }
  if (msg.type === 'rematch') {
    if (room.hostId !== player.id) return send(ws, { type: 'error', message: 'Only the room host can start a rematch.' });
    room.status = 'lobby'; room.bossId = null; room.hp = 0; room.maxHp = 0; room.contributions = new Map([...room.members.keys()].map(id => [id, 0]));
    broadcast(room, { type: 'rematch_ready', code: room.code }); emitRoomState(room); return;
  }
  send(ws, { type: 'error', message: 'Unknown multiplayer action.' });
}

wss.on('connection', ws => {
  const id = crypto.randomBytes(8).toString('hex');
  const player = { id, ws, name: '', rebirths: 0, eligibleBosses: [], roomCode: null, position: null };
  ws.player = player; socketsById.set(id, ws);
  send(ws, { type: 'connected', id, maxPlayers: MAX_PLAYERS_PER_ROOM });
  ws.on('message', raw => handleMessage(ws, raw));
  ws.on('error', () => {});
  ws.on('close', () => {
    removeFromRoom(player, 'disconnected'); socketsById.delete(id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Army Control co-op server listening on http://localhost:${PORT}`);
  console.log('For friends outside your network, deploy this folder to a Node.js host with WebSocket support.');
});

function shutdown() {
  for (const ws of wss.clients) { try { ws.close(1001, 'Server shutting down'); } catch {} }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
