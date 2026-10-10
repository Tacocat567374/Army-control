ARMY CONTROL — CO-OP BOSS RAIDS
================================

WHAT IS INCLUDED
- The existing game, with its single-player mode preserved.
- A Co-op Raid item inside the More menu.
- Private six-character room codes and up to four players per room.
- The host can choose a boss that every player has unlocked in their own save.
- One server-managed boss health pool shared by the entire room, scaling with party size.
- A shared raid arena: player avatars appear for teammates while the raid is active.
- Each player resolves the boss defeat and receives the game's normal local rewards.
- Server-side damage rate limiting and a Rebirth 3 check for roaming bosses.
- The original normal boss unlock/summon checks and roaming-boss progression remain in place.

IMPORTANT FIRST-VERSION LIMITATIONS
This is the first co-op foundation, not a fully synchronized MMO world. Boss health and room state are shared through the server; each browser still simulates the boss movement/attacks and its own army locally. Teammates' player avatars are visible, but their individual troops, health and attack animations are not replicated yet. Saves remain local to each browser; there are no online accounts or persistent cloud saves. Client-supplied progression is not a substitute for a full account/anti-cheat system.

RUN LOCALLY
1. Install Node.js 20 or newer (Node.js 22+ is recommended).
2. Open a terminal in this folder.
3. Run: npm install
4. Run: npm start
5. Open http://localhost:3000/game.html
6. Open the game in a second browser/profile/window, use More > Co-op Raid in both, connect, create a room, and join with the code.
7. The host chooses a boss available in both local saves and starts the raid.

A plain file:// URL will not connect to the multiplayer server. Open the game through the local server URL instead.

LET A FRIEND JOIN OVER THE INTERNET
The server must be reachable by both players. For two devices on the same Wi-Fi, open http://YOUR-COMPUTER-LAN-IP:3000/game.html on the second device (allow the port through the local firewall if prompted). For friends on different networks, deploy this folder to a Node.js host that supports WebSocket upgrades and set its start command to `npm start`. Share the hosted game URL and the six-character room code. A static-only HTML host will not run server.js.

CHECKS
- `npm run check` runs JavaScript syntax checks and does not require installed dependencies.
- `npm test` runs static checks plus a WebSocket smoke test covering create/join, shared boss HP, the damage cap, and the Rebirth 3 roaming-boss gate. Run it after `npm install`.

No complete visual/browser co-op playtest was available in the creation environment. Test with two actual browser sessions before publishing it publicly.
