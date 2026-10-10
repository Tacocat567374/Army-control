// Co-op raid client for Army Control. Loaded as a module and waits for game.js
// to finish its top-level initialization before attaching the room UI/hooks.
const waitForGame = setInterval(() => {
  if (window.__game?.S && typeof window.__game.getCoopBossOptions === 'function') {
    clearInterval(waitForGame);
    try { initCoop(window.__game); } catch (err) { console.error('Co-op setup failed:', err); }
  }
}, 100);

function initCoop(game) {
  const C = {
    ws: null, connecting: false, connected: false, id: null, room: null,
    serverBosses: [], message: 'Connect to create a private room or join a friend.', messageKind: '',
    localBoss: null, localSave: null, inArena: false, completed: false,
    pendingDamage: 0, damageTimer: null, positionTimer: null,
    remote: new Map(), lastBossId: null, reconnectWanted: false,
  };
  const $ = id => document.getElementById(id);
  const wsOpen = () => C.ws && C.ws.readyState === WebSocket.OPEN;
  const getName = () => (String($('coopName')?.value || localStorage.getItem('army_control_coop_name') || 'Commander').trim().slice(0,18) || 'Commander');
  const getOptions = () => {
    const allowed = C.serverBosses.length ? new Set(C.serverBosses) : null;
    return game.getCoopBossOptions().filter(b => !allowed || allowed.has(b.id));
  };
  const profile = () => ({ name: getName(), rebirths: Math.max(0, Math.floor(Number(game.S.rebirths) || 0)), eligibleBosses: getOptions().map(b => b.id) });
  const fmt = n => {
    const v = Number(n) || 0;
    if (Math.abs(v) >= 1e12) return (v / 1e12).toFixed(v >= 1e13 ? 1 : 2).replace(/\.0+$/, '') + 'T';
    if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(v >= 1e10 ? 1 : 2).replace(/\.0+$/, '') + 'B';
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 1 : 2).replace(/\.0+$/, '') + 'M';
    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(v >= 1e4 ? 1 : 2).replace(/\.0+$/, '') + 'K';
    return Math.floor(v).toLocaleString();
  };
  const send = obj => { if (wsOpen()) C.ws.send(JSON.stringify(obj)); else setMessage('Not connected to a multiplayer server yet.', 'bad'); };
  function setMessage(text, kind = '') { C.message = String(text || ''); C.messageKind = kind; updateUI(); }

  const modal = document.createElement('div');
  modal.id = 'coopModal'; modal.className = 'coop-modal hidden';
  modal.innerHTML = `
    <section class="coop-card" role="dialog" aria-modal="true" aria-labelledby="coopTitle">
      <header class="coop-head"><div><div class="coop-kicker">PLAY TOGETHER</div><h2 id="coopTitle">Co-op Boss Raid</h2></div><button id="coopClose" class="coop-close" aria-label="Close co-op menu">×</button></header>
      <p class="coop-intro">Create a private room, share the six-character code, and take down one boss together. Up to four players can join.</p>
      <div id="coopStatus" class="coop-status">Connect to create a private room or join a friend.</div>
      <div class="coop-profile"><label for="coopName">Commander name</label><input id="coopName" maxlength="18" autocomplete="nickname" placeholder="Your name" /></div>
      <div id="coopConnectionActions" class="coop-actions"><button id="coopConnect" class="coop-btn primary">Connect online</button></div>
      <div id="coopEntry" class="coop-entry">
        <button id="coopCreate" class="coop-btn primary" disabled>Create room</button>
        <div class="coop-join"><input id="coopJoinCode" maxlength="6" aria-label="Room code" placeholder="ROOM CODE" autocomplete="off" /><button id="coopJoin" class="coop-btn" disabled>Join room</button></div>
        <p class="coop-small">Both players need to open the game through the same hosted multiplayer server. A local HTML file by itself cannot connect online.</p>
      </div>
      <div id="coopRoom" class="coop-room hidden">
        <div class="coop-roomline"><div><span class="coop-label">ROOM CODE</span><strong id="coopCode" class="coop-code">------</strong></div><button id="coopCopy" class="coop-btn compact">Copy code</button></div>
        <div class="coop-rosterhead"><span>Raid party</span><span id="coopPlayerCount">0 / 4</span></div>
        <div id="coopRoster" class="coop-roster"></div>
        <div id="coopRaidControls" class="coop-raidcontrols">
          <label for="coopBossSelect">Boss for this raid</label><select id="coopBossSelect"></select>
          <div class="coop-actions"><button id="coopStart" class="coop-btn primary" disabled>Start co-op raid</button><button id="coopRematch" class="coop-btn hidden">Rematch</button><button id="coopReturn" class="coop-btn hidden">Return to base</button></div>
          <p id="coopRaidHint" class="coop-small">The room host chooses the boss. Every player must have unlocked that boss in their own save.</p>
        </div>
        <div id="coopHealthWrap" class="coop-health hidden"><div class="coop-healthtitle"><span id="coopBossName">Boss</span><strong id="coopBossHP">0 / 0</strong></div><div class="coop-healthbar"><i id="coopBossFill"></i></div><div id="coopRaidPhase" class="coop-small">Waiting for the raid to begin…</div></div>
        <div class="coop-actions coop-bottom"><button id="coopLeave" class="coop-btn danger">Leave room / return to base</button></div>
      </div>
      <p class="coop-footer">Room codes are private, temporary, and held in memory by the game server. Your save stays local on your device.</p>
    </section>`;
  document.body.appendChild(modal);
  const savedName = (() => { try { return localStorage.getItem('army_control_coop_name') || ''; } catch { return ''; } })();
  $('coopName').value = savedName;

  $('coopClose').addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  $('coopName').addEventListener('change', () => { try { localStorage.setItem('army_control_coop_name', getName()); } catch {} });
  $('coopConnect').addEventListener('click', connectSocket);
  $('coopCreate').addEventListener('click', () => {
    if (!wsOpen()) return connectSocket();
    const p = profile(); send({ type: 'create_room', ...p });
  });
  $('coopJoinCode').addEventListener('input', () => { $('coopJoinCode').value = $('coopJoinCode').value.toUpperCase().replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g,'').slice(0,6); updateUI(); });
  $('coopJoin').addEventListener('click', () => {
    if (!wsOpen()) return connectSocket();
    const p = profile(); send({ type: 'join_room', code: $('coopJoinCode').value.trim().toUpperCase(), ...p });
  });
  $('coopBossSelect').addEventListener('change', updateUI);
  $('coopStart').addEventListener('click', () => {
    if (!C.room || C.room.hostId !== C.id) return;
    const p = profile(); send({ type: 'start_raid', bossId: $('coopBossSelect').value, ...p });
  });
  $('coopRematch').addEventListener('click', () => send({ type: 'rematch' }));
  $('coopReturn').addEventListener('click', () => leaveRoom(true));
  $('coopLeave').addEventListener('click', () => leaveRoom(true));
  $('coopCopy').addEventListener('click', async () => {
    const code = C.room?.code || '';
    if (!code) return;
    try { await navigator.clipboard.writeText(code); setMessage(`Room code ${code} copied. Send it to your friend.`, 'good'); }
    catch { setMessage(`Your room code is ${code}. Select and copy it manually.`, ''); }
  });

  window.__coopOpen = () => {
    modal.classList.remove('hidden');
    $('coopName').value = getName();
    refreshBossOptions();
    if (!wsOpen() && !C.connecting) connectSocket();
    updateUI();
  };
  window.__coopInterceptBossDamage = (target, amount) => {
    if (!C.inArena || target !== C.localBoss || !target?._coopRaid) return false;
    if (!wsOpen() || C.room?.status !== 'raid') return true;
    if (Number.isFinite(amount) && amount > 0) C.pendingDamage += amount;
    return true;
  };

  function connectSocket() {
    if (wsOpen() || C.connecting) { updateUI(); return; }
    if (location.protocol === 'file:') {
      setMessage('This game is open as a local file. Start the server with npm install and npm start, then open http://localhost:3000/game.html.', 'bad');
      return;
    }
    C.connecting = true; setMessage('Connecting to the co-op server…', ''); updateUI();
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let url = `${scheme}//${location.host}`;
    try { C.ws = new WebSocket(url); }
    catch (err) { C.connecting = false; setMessage('Could not open the WebSocket connection. Check that the Node server is running.', 'bad'); return; }
    C.ws.addEventListener('open', () => { C.connecting = false; C.connected = true; const p = profile(); send({ type: 'hello', ...p }); setMessage('Connected. Create a room or join a friend with their code.', 'good'); updateUI(); });
    C.ws.addEventListener('message', ev => {
      let msg; try { msg = JSON.parse(ev.data); } catch { return; }
      handleServerMessage(msg);
    });
    C.ws.addEventListener('error', () => { setMessage('Connection failed. Check the server URL, hosting logs, and WebSocket support.', 'bad'); });
    C.ws.addEventListener('close', () => {
      C.connecting = false; C.connected = false; C.ws = null;
      endLocalRaid(true); C.room = null; stopSyncTimers(); clearRemotePlayers();
      setMessage('Disconnected from the co-op server. Your single-player save is still available.', 'bad'); updateUI();
    });
  }

  function handleServerMessage(msg) {
    if (msg.type === 'connected') { C.id = msg.id; return; }
    if (msg.type === 'hello_ok') { C.id = msg.id; C.serverBosses = Array.isArray(msg.bosses) ? msg.bosses : []; refreshBossOptions(); updateUI(); return; }
    if (msg.type === 'error') { setMessage(msg.message || 'Multiplayer error.', 'bad'); return; }
    if (msg.type === 'room_created' || msg.type === 'room_joined') {
      C.room = C.room || {}; C.room.code = msg.code; C.room.hostId = msg.hostId; C.room.status = 'lobby';
      setMessage(msg.type === 'room_created' ? `Room ${msg.code} created. Share the code with your friend.` : `Joined room ${msg.code}. Wait for the host to start the raid.`, 'good'); updateUI(); return;
    }
    if (msg.type === 'room_state') {
      const previousStatus = C.room?.status;
      C.room = { ...(C.room || {}), code: msg.code, hostId: msg.hostId, status: msg.status, players: msg.players || [], bossId: msg.bossId, bossName: msg.bossName, hp: msg.hp, maxHp: msg.maxHp, phase: msg.phase };
      if (C.inArena && msg.status !== 'raid' && msg.status !== 'completed' && previousStatus === 'raid') endLocalRaid(false);
      syncRemoteRoster(); updateUI(); return;
    }
    if (msg.type === 'raid_started') {
      C.completed = false; C.lastBossId = msg.bossId;
      beginLocalRaid(msg.bossId, msg.maxHp, msg.hp);
      C.room = { ...(C.room || {}), code: msg.code, status: 'raid', bossId: msg.bossId, bossName: msg.bossName, hp: msg.hp, maxHp: msg.maxHp, phase: 0 };
      setMessage(`${msg.bossName} raid started! Damage dealt by both armies reduces the same boss health.`, 'good');
      startSyncTimers(); syncRemoteRoster(); updateUI(); return;
    }
    if (msg.type === 'raid_state') {
      if (C.localBoss && msg.bossId === C.lastBossId && C.localBoss.alive) {
        C.localBoss.maxHp = Number(msg.maxHp) || C.localBoss.maxHp;
        C.localBoss.hp = Math.max(1, Number(msg.hp) || 1);
        C.localBoss.bossPhase = Number(msg.phase) || 0;
      }
      if (C.room) { C.room.hp = msg.hp; C.room.maxHp = msg.maxHp; C.room.phase = msg.phase; }
      updateUI(); return;
    }
    if (msg.type === 'peer_position') {
      if (!C.inArena || msg.id === C.id) return;
      const avatar = ensureRemoteAvatar(msg.id, msg.name);
      avatar.root.position.set(Number(msg.x) || -25, 0, Number(msg.z) || 0);
      avatar.root.rotation.y = Number(msg.rot) || 0;
      return;
    }
    if (msg.type === 'player_left') {
      removeRemoteAvatar(msg.id);
      if (msg.reason === 'disconnected') setMessage(`${msg.name || 'A player'} disconnected. The remaining party can continue.`, '');
      updateUI(); return;
    }
    if (msg.type === 'raid_completed') {
      C.completed = true;
      if (C.localBoss && C.localBoss.alive) game.killCoopBoss(C.localBoss);
      if (C.room) { C.room.status = 'completed'; C.room.hp = 0; C.room.players = msg.players || C.room.players; }
      setMessage(`${msg.bossName || 'Boss'} defeated! Your own save received the boss-clear rewards.`, 'good');
      stopDamageTimer(); updateUI(); return;
    }
    if (msg.type === 'rematch_ready') {
      if (C.localBoss && !C.localBoss.alive) game.removeCoopBoss(C.localBoss);
      C.localBoss = null; C.completed = false; setMessage('Rematch ready. The host can choose a boss and start again.', ''); updateUI(); return;
    }
    if (msg.type === 'room_left') {
      C.room = null; endLocalRaid(false); clearRemotePlayers(); setMessage('You left the room and returned to your previous location.', ''); updateUI(); return;
    }
    if (msg.type === 'chat') {
      setMessage(`${msg.name}: ${msg.text}`, ''); return;
    }
  }

  function refreshBossOptions() {
    const sel = $('coopBossSelect'); if (!sel) return;
    const before = sel.value;
    const options = getOptions();
    sel.innerHTML = '';
    if (!options.length) {
      const option = document.createElement('option'); option.value = ''; option.textContent = 'No bosses currently unlocked'; sel.appendChild(option); return;
    }
    for (const boss of options) {
      const option = document.createElement('option'); option.value = boss.id;
      option.textContent = `${boss.name}${boss.roaming ? ' · Roaming' : ''}`;
      sel.appendChild(option);
    }
    if (options.some(b => b.id === before)) sel.value = before;
  }

  function beginLocalRaid(bossId, maxHp, hp) {
    if (!C.inArena) { C.localSave = game.setCoopArena(); C.inArena = true; }
    if (C.localBoss) game.removeCoopBoss(C.localBoss);
    C.localBoss = game.spawnCoopBoss(bossId, maxHp);
    if (!C.localBoss) {
      setMessage('This boss is not available in your current save. The room host must choose a boss that every player has unlocked.', 'bad');
      send({ type: 'leave_room' }); endLocalRaid(false); return;
    }
    C.localBoss.hp = Math.max(1, Number(hp) || C.localBoss.maxHp);
    C.localBoss.maxHp = Math.max(1, Number(maxHp) || C.localBoss.maxHp);
    C.localBoss._coopRaid = true;
    game.commandAttack(C.localBoss);
    for (const s of game.soldiers) if (s.alive && !s.def.healer) { s.target = C.localBoss; s.state = 'attack'; }
    startSyncTimers();
  }

  function startSyncTimers() {
    if (C.positionTimer) return;
    C.positionTimer = setInterval(() => {
      if (!C.inArena || C.room?.status !== 'raid' || !wsOpen()) return;
      const p = game.player;
      send({ type: 'position', x: p.pos.x, z: p.pos.z, rot: p.mesh.rotation.y });
    }, 100);
    C.damageTimer = setInterval(() => {
      if (C.pendingDamage <= 0) return;
      const amount = C.pendingDamage; C.pendingDamage = 0;
      if (C.inArena && C.room?.status === 'raid' && wsOpen() && C.localBoss) send({ type: 'damage', bossId: C.lastBossId, amount });
    }, 100);
  }
  function stopDamageTimer() { if (C.damageTimer) clearInterval(C.damageTimer); C.damageTimer = null; C.pendingDamage = 0; }
  function stopSyncTimers() { if (C.positionTimer) clearInterval(C.positionTimer); C.positionTimer = null; stopDamageTimer(); }

  function endLocalRaid(disconnected = false) {
    stopSyncTimers(); C.pendingDamage = 0;
    if (C.localBoss && C.localBoss._coopRaid) {
      if (!C.localBoss.alive || disconnected || !C.completed) game.removeCoopBoss(C.localBoss);
      else game.removeCoopBoss(C.localBoss);
    }
    C.localBoss = null; C.lastBossId = null; C.completed = false;
    clearRemotePlayers();
    if (C.inArena && C.localSave) game.restoreCoopArena(C.localSave);
    C.localSave = null; C.inArena = false;
  }

  function leaveRoom(returnToBase) {
    if (wsOpen() && C.room) send({ type: 'leave_room' });
    endLocalRaid(false); C.room = null; clearRemotePlayers();
    if (returnToBase) setMessage('Left the room. Your character and army returned to their previous locations.', '');
    updateUI();
  }

  function ensureRemoteAvatar(id, name) {
    let avatar = C.remote.get(id);
    if (avatar) {
      if (avatar.name !== name) {
        game.removeCoopAvatar(avatar);
        avatar = null;
      }
    }
    if (!avatar) {
      const palette = [0x58c8ff,0xd08cff,0xff7c9c,0x71df99];
      const index = Math.max(0, (C.room?.players || []).findIndex(p => p.id === id));
      const color = palette[index % palette.length];
      avatar = game.createCoopAvatar(id, name || 'Ally', color); avatar.name = name || 'Ally';
      const offset = (index - 1) * 1.8;
      avatar.root.position.set(-25 + offset, 0, 0.8);
      C.remote.set(id, avatar);
    }
    return avatar;
  }
  function syncRemoteRoster() {
    if (!C.inArena || !C.room?.players) { clearRemotePlayers(); return; }
    const keep = new Set(C.room.players.filter(p => p.id !== C.id).map(p => p.id));
    for (const id of C.remote.keys()) if (!keep.has(id)) removeRemoteAvatar(id);
    for (const p of C.room.players) {
      if (p.id === C.id) continue;
      const avatar = ensureRemoteAvatar(p.id, p.name);
      if (Number.isFinite(p.x) && Number.isFinite(p.z)) { avatar.root.position.set(p.x,0,p.z); avatar.root.rotation.y=Number(p.rot)||0; }
    }
  }
  function removeRemoteAvatar(id) { const avatar=C.remote.get(id); if (avatar) game.removeCoopAvatar(avatar); C.remote.delete(id); }
  function clearRemotePlayers() { for (const id of [...C.remote.keys()]) removeRemoteAvatar(id); }

  function updateUI() {
    if (!$('coopStatus')) return;
    const online = wsOpen();
    $('coopStatus').textContent = C.message || '';
    $('coopStatus').className = 'coop-status' + (C.messageKind ? ` ${C.messageKind}` : '');
    $('coopConnect').textContent = online ? 'Connected' : C.connecting ? 'Connecting…' : 'Connect online';
    $('coopConnect').disabled = online || C.connecting;
    $('coopCreate').disabled = !online || !!C.room;
    $('coopJoin').disabled = !online || !!C.room || $('coopJoinCode').value.length !== 6;
    $('coopEntry').classList.toggle('hidden', !!C.room);
    $('coopRoom').classList.toggle('hidden', !C.room);
    if (!C.room) { refreshBossOptions(); return; }
    $('coopCode').textContent = C.room.code || '------';
    const players = C.room.players || [];
    $('coopPlayerCount').textContent = `${players.length} / 4`;
    const roster = $('coopRoster'); roster.innerHTML = '';
    for (const p of players) {
      const line = document.createElement('div'); line.className = 'coop-rosterrow';
      const who = document.createElement('span'); who.className = 'coop-rostername'; who.textContent = `${p.name || 'Commander'}${p.host ? ' · HOST' : ''}${p.id === C.id ? ' (you)' : ''}`;
      const damage = document.createElement('span'); damage.className = 'coop-rosterdamage'; damage.textContent = C.room.status === 'raid' || C.room.status === 'completed' ? `${fmt(p.damage || 0)} dmg` : `${Math.max(0,Number(p.rebirths)||0)} rebirths`;
      line.append(who, damage); roster.appendChild(line);
    }
    const isHost = C.room.hostId === C.id;
    const inRaid = C.room.status === 'raid';
    const done = C.room.status === 'completed';
    $('coopBossSelect').disabled = !isHost || inRaid;
    refreshBossOptions();
    $('coopStart').classList.toggle('hidden', !isHost || inRaid || done);
    $('coopStart').disabled = !online || !isHost || players.length < 2 || !$('coopBossSelect').value;
    $('coopRematch').classList.toggle('hidden', !isHost || !done);
    $('coopReturn').classList.toggle('hidden', !C.inArena);
    $('coopLeave').textContent = C.inArena ? 'Leave room / return to base' : 'Leave room';
    $('coopHealthWrap').classList.toggle('hidden', !inRaid && !done);
    if (inRaid || done) {
      $('coopBossName').textContent = C.room.bossName || (C.room.bossId ? C.room.bossId : 'Raid boss');
      const hp = Math.max(0,Number(C.room.hp)||0), max = Math.max(1,Number(C.room.maxHp)||1);
      $('coopBossHP').textContent = `${fmt(hp)} / ${fmt(max)}`;
      $('coopBossFill').style.width = `${Math.max(0,Math.min(100,hp/max*100))}%`;
      $('coopRaidPhase').textContent = done ? 'VICTORY · Boss defeated — rewards granted to every raider.' : `PHASE ${['I','II','III','FINAL'][Math.max(0,Math.min(3,Number(C.room.phase)||0))]} · shared health across the room`;
    }
    $('coopRaidHint').textContent = !isHost ? 'The room host chooses the boss. Every player must have unlocked that boss in their own save.' : players.length < 2 ? 'Invite a friend before starting. A co-op raid needs at least two players.' : inRaid ? 'The raid is live! Both armies damage the same server-managed health bar.' : done ? 'Raid complete. Start a rematch or return to your base.' : 'Pick any boss available to every member of this room.';
  }

  // Initial setup. The title screen and solo mode remain unchanged.
  refreshBossOptions(); updateUI();
}
