// Firebase Realtime Database Engine for "المزاد" (The Auction).
// Separate top-level Firebase path (mazad_rooms/*) and separate player-id
// storage key from Deal or No Deal's firebase-engine.js, so the same room
// code can exist independently in both games with zero collision.

const firebaseConfig = {
  databaseURL: "https://cuafa-9f3b6-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let myPlayerId = sessionStorage.getItem('mazad_tab_player_id');
if (!myPlayerId) {
  myPlayerId = 'm_' + Math.random().toString(36).substring(2, 10);
  sessionStorage.setItem('mazad_tab_player_id', myPlayerId);
}

const PLAYER_DATABASE = window.PLAYER_DATABASE;
const POSITIONS = ['GK', 'DEF', 'MID', 'ATT', 'MGR'];
const POSITION_NAMES_AR = {
  GK: 'حارس المرمى 🧤',
  DEF: 'مدافع 🛡️',
  MID: 'وسط ⚙️',
  ATT: 'مهاجم ⚡',
  MGR: 'مدرب 📋'
};

// Two squad modes, per the owner's exact numbers.
const SQUAD_MODES = {
  quick: {
    label: 'سريع (5 خانات)',
    budget: 250000000,
    slots: { GK: 1, DEF: 1, MID: 1, ATT: 1, MGR: 1 }
  },
  full: {
    label: 'الميزانية الكاملة (12 خانة)',
    budget: 1000000000,
    slots: { GK: 1, DEF: 4, MID: 3, ATT: 3, MGR: 1 }
  }
};

// Preset raise amounts, scaled per mode (avoids free-text bid entry).
const RAISE_STEPS = {
  quick: [5000000, 10000000, 25000000],
  full: [20000000, 50000000, 100000000]
};

function emptySquad() {
  return { GK: [], DEF: [], MID: [], ATT: [], MGR: [] };
}

// Picks a random player from a position pool at or above minRating, excluding
// ids already awarded this game (so no duplicate players across the room).
function drawRandomPlayer(positionKey, minRating, usedIds) {
  const pool = PLAYER_DATABASE[positionKey].filter(p => p.rating >= minRating && !usedIds[p.id]);
  const source = pool.length ? pool : PLAYER_DATABASE[positionKey].filter(p => !usedIds[p.id]);
  if (!source.length) return null; // pool exhausted (extremely unlikely given database size)
  return source[Math.floor(Math.random() * source.length)];
}

function squadCount(squad, positionKey) {
  return (squad[positionKey] || []).length;
}

function hasOpenSlot(squad, slots, positionKey) {
  return squadCount(squad, positionKey) < slots[positionKey];
}

// Finds the next position that still needs filling for at least one side,
// and whether it's a contested (both need it) or uncontested (one side
// already full there) round. Returns null when both squads are complete.
function findNextRound(room) {
  const slots = SQUAD_MODES[room.squadMode].slots;
  for (const posKey of POSITIONS) {
    const hostOpen = hasOpenSlot(room.host.squad, slots, posKey);
    const guestOpen = room.guest ? hasOpenSlot(room.guest.squad, slots, posKey) : false;
    if (hostOpen && guestOpen) return { positionKey: posKey, contested: true };
    if (hostOpen || guestOpen) return { positionKey: posKey, contested: false, soleRole: hostOpen ? 'host' : 'guest' };
  }
  return null;
}

// Bonus/consolation players fill the same position if it still has room after
// the candidate is placed, otherwise the first open slot of the next needed
// position for that recipient (a round can leave a player "ahead of schedule").
function placeAwardedPlayer(room, recipientRole, player) {
  const slots = SQUAD_MODES[room.squadMode].slots;
  const recipient = room[recipientRole];
  let targetPos = null;
  for (const posKey of POSITIONS) {
    if (hasOpenSlot(recipient.squad, slots, posKey)) { targetPos = posKey; break; }
  }
  if (!targetPos) return; // squad already full (shouldn't happen if called correctly)
  recipient.squad[targetPos].push(player);
}

function startRoundData(room) {
  const next = findNextRound(room);
  if (!next) {
    return { finished: true };
  }
  const usedIds = room.usedPlayerIds || {};
  if (!next.contested) {
    // Uncontested: the side that still needs this position gets a random
    // player for free (no one to bid against) — no cost, no bonus/consolation.
    const player = drawRandomPlayer(next.positionKey, 84, usedIds);
    return { finished: false, uncontested: true, positionKey: next.positionKey, soleRole: next.soleRole, player };
  }
  const candidate = drawRandomPlayer(next.positionKey, 90, usedIds);
  const starter = room.lastStarterRole === 'host' ? 'guest' : 'host'; // alternate opener each round
  return {
    finished: false,
    uncontested: false,
    positionKey: next.positionKey,
    candidate,
    currentBid: 0,
    bidderTurn: starter,
    lastRaiserRole: null
  };
}

function applyRoundStart(roomRef, room) {
  const result = startRoundData(room);
  if (result.finished) {
    // Drafting is done — both squads are complete. Show the lineup reveal
    // before the match simulation runs (status becomes 'finished' only once
    // the simulated match itself is over, see startMatchSimulation below).
    roomRef.update({ status: 'lineup', currentRound: null });
    return;
  }
  if (result.uncontested) {
    if (!result.player) { roomRef.update({ status: 'lineup', currentRound: null }); return; }
    room.usedPlayerIds[result.player.id] = true;
    placeAwardedPlayer(room, result.soleRole, result.player);
    roomRef.update({
      status: 'bidding',
      usedPlayerIds: room.usedPlayerIds,
      [result.soleRole + '/squad']: room[result.soleRole].squad,
      currentRound: {
        positionKey: result.positionKey,
        status: 'uncontested',
        soleRole: result.soleRole,
        player: result.player
      }
    });
    // Uncontested rounds resolve instantly (no bidding needed) — after a short
    // reveal pause, cascade forward to whatever round comes after this one.
    setTimeout(() => applyRoundStart(roomRef, room), 2500);
    return;
  }
  if (!result.candidate) { roomRef.update({ status: 'lineup', currentRound: null }); return; }
  room.usedPlayerIds[result.candidate.id] = true;
  roomRef.update({
    status: 'bidding',
    lastStarterRole: result.bidderTurn,
    usedPlayerIds: room.usedPlayerIds,
    currentRound: {
      positionKey: result.positionKey,
      status: 'bidding',
      candidate: result.candidate,
      currentBid: 0,
      bidderTurn: result.bidderTurn,
      lastRaiserRole: null
    }
  });
}

const AuctionEngine = {
  get myPlayerId() {
    return myPlayerId;
  },

  getSquadModes() { return SQUAD_MODES; },
  getRaiseSteps(squadMode) { return RAISE_STEPS[squadMode] || RAISE_STEPS.quick; },
  getPositionNames() { return POSITION_NAMES_AR; },
  getPositions() { return POSITIONS; },

  enterRoom(roomId, playerName, squadMode) {
    const finalRoomId = roomId && roomId.trim().length > 0
      ? roomId.trim()
      : Math.floor(1000 + Math.random() * 9000).toString();

    const roomRef = db.ref('mazad_rooms/' + finalRoomId);

    return roomRef.once('value').then(snapshot => {
      const room = snapshot.val();

      if (!room) {
        const mode = SQUAD_MODES[squadMode] ? squadMode : 'quick';
        const sanitizedHostName = escapeHTML(playerName || 'المستضيف');
        const initialRoom = {
          roomId: finalRoomId,
          status: 'lobby',
          squadMode: mode,
          createdAt: Date.now(),
          usedPlayerIds: {},
          lastStarterRole: 'guest', // so round 1 opens with host (flips to 'host' starter)
          host: {
            id: myPlayerId,
            name: sanitizedHostName,
            remainingBudget: SQUAD_MODES[mode].budget,
            squad: emptySquad()
          },
          guest: null,
          currentRound: null
        };
        return roomRef.set(initialRoom).then(() => finalRoomId);
      } else if (room.host && room.host.id === myPlayerId) {
        return finalRoomId;
      } else if (!room.guest) {
        myPlayerId = 'm_guest_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('mazad_tab_player_id', myPlayerId);

        const sanitizedGuestName = escapeHTML((playerName && playerName !== 'المستضيف') ? playerName : 'الضيف');
        const guestData = {
          id: myPlayerId,
          name: sanitizedGuestName,
          remainingBudget: SQUAD_MODES[room.squadMode].budget,
          squad: emptySquad()
        };
        return roomRef.child('guest').set(guestData).then(() => {
          const updatedRoom = { ...room, guest: guestData };
          applyRoundStart(roomRef, updatedRoom);
          return finalRoomId;
        });
      } else if (room.guest && room.guest.id === myPlayerId) {
        return finalRoomId;
      } else {
        return finalRoomId; // spectator: just watch
      }
    });
  },

  listenToRoom(roomId, onUpdate) {
    const roomRef = db.ref('mazad_rooms/' + roomId);
    roomRef.on('value', snapshot => {
      const room = snapshot.val();
      if (room) onUpdate(room);
    });
  },

  raiseBid(roomId, room, increment) {
    if (room.status !== 'bidding' || !room.currentRound || room.currentRound.status !== 'bidding') return;
    const isHost = room.host.id === myPlayerId;
    const myRole = isHost ? 'host' : 'guest';
    if (room.currentRound.bidderTurn !== myRole) return;

    const newBid = room.currentRound.currentBid + increment;
    if (newBid > room[myRole].remainingBudget) return; // can't bid more than you have

    const roomRef = db.ref('mazad_rooms/' + roomId);
    const otherRole = isHost ? 'guest' : 'host';
    roomRef.child('currentRound').update({
      currentBid: newBid,
      lastRaiserRole: myRole,
      bidderTurn: otherRole
    });
  },

  passBid(roomId, room) {
    if (room.status !== 'bidding' || !room.currentRound || room.currentRound.status !== 'bidding') return;
    if (!room.currentRound.lastRaiserRole) return; // opening bidder can't pass with nothing bid yet
    const isHost = room.host.id === myPlayerId;
    const myRole = isHost ? 'host' : 'guest';
    if (room.currentRound.bidderTurn !== myRole) return;

    const winnerRole = room.currentRound.lastRaiserRole;
    const loserRole = winnerRole === 'host' ? 'guest' : 'host';
    const winPrice = room.currentRound.currentBid;
    const candidate = room.currentRound.candidate;
    const posKey = room.currentRound.positionKey;

    const usedIds = { ...room.usedPlayerIds };
    const bonusPlayer = drawRandomPlayer(posKey, 84, usedIds);
    if (bonusPlayer) usedIds[bonusPlayer.id] = true;
    const consolationPlayer = drawRandomPlayer(posKey, 85, usedIds);
    if (consolationPlayer) usedIds[consolationPlayer.id] = true;

    const roomRef = db.ref('mazad_rooms/' + roomId);
    const nextRoom = {
      ...room,
      usedPlayerIds: usedIds,
      [winnerRole]: {
        ...room[winnerRole],
        remainingBudget: room[winnerRole].remainingBudget - winPrice,
        squad: { ...room[winnerRole].squad, [posKey]: [...room[winnerRole].squad[posKey], candidate] }
      },
      [loserRole]: {
        ...room[loserRole],
        squad: { ...room[loserRole].squad } // consolation placed below via placeAwardedPlayer
      }
    };
    if (bonusPlayer) placeAwardedPlayer(nextRoom, winnerRole, bonusPlayer);
    if (consolationPlayer) placeAwardedPlayer(nextRoom, loserRole, consolationPlayer);

    roomRef.update({
      usedPlayerIds: usedIds,
      [winnerRole + '/remainingBudget']: nextRoom[winnerRole].remainingBudget,
      [winnerRole + '/squad']: nextRoom[winnerRole].squad,
      [loserRole + '/squad']: nextRoom[loserRole].squad,
      'currentRound/status': 'resolved',
      'currentRound/winnerRole': winnerRole,
      'currentRound/winPrice': winPrice,
      'currentRound/bonusPlayer': bonusPlayer,
      'currentRound/consolationPlayer': consolationPlayer
    });

    this.notify(roomId, {
      kind: 'round_result',
      text: `💰 ${nextRoom[winnerRole].name} كسب المزايدة على ${candidate.name} بـ ${winPrice.toLocaleString('en-US')}!`
    });

    // Advance to the next round after a short reveal pause.
    setTimeout(() => {
      applyRoundStart(roomRef, nextRoom);
    }, 4000);
  },

  confirmLineupReady(roomId, room) {
    const roomRef = db.ref('mazad_rooms/' + roomId);
    roomRef.child('lineupReady').transaction(current => current ? current : true)
      .then(result => {
        if (result.committed && room.host.id === myPlayerId) {
          // Only the host client actually starts the simulation (matches ticker ownership below)
          this.startMatchSimulation(roomId, room);
        }
      });
  },

  // Same simulation math as Deal or No Deal's engine (GK-vs-shooter save
  // chance, per-match energy, 10x1000ms ticker) adapted for squads that hold
  // an ARRAY of players per position instead of exactly one.
  startMatchSimulation(roomId, room) {
    const roomRef = db.ref('mazad_rooms/' + roomId);
    const pickRandom = arr => (arr && arr.length) ? arr[Math.floor(Math.random() * arr.length)] : null;

    const calcPower = squad => {
      const all = POSITIONS.flatMap(p => squad[p] || []);
      if (!all.length) return 80;
      return all.reduce((sum, p) => sum + p.rating, 0) / all.length;
    };

    const hostEnergy = 0.9 + Math.random() * 0.15;
    const guestEnergy = 0.9 + Math.random() * 0.15;
    const hostPower = calcPower(room.host.squad) * hostEnergy;
    const guestPower = calcPower(room.guest.squad) * guestEnergy;

    let hostGoals = 0;
    let guestGoals = 0;
    const events = [];
    const minutes = [8, 19, 34, 48, 62, 75, 84, 92];
    const shotTypes = ['صاروخية لا تُصد ولا تُرَد', 'مقوسة R2 في زاوية مستحيلة', 'رأسية متقنة بارتقاء خرافي', 'تسديدة أرضية زاحفة على يمين الحارس', 'ركلة جزاء محكمة في الشباك'];

    const MISS_CHANCE = 0.17;
    const CARD_CHANCE = 0.10;
    const VAR_CHANCE = 0.08;
    const BASE_SAVE = 0.30;
    const GK_WEIGHT = 0.01;

    minutes.forEach(minute => {
      const isHostAttacking = Math.random() * (hostPower + guestPower) < hostPower;
      const attacker = isHostAttacking ? room.host : room.guest;
      const defender = isHostAttacking ? room.guest : room.host;
      const attShooter = (Math.random() < 0.6 ? pickRandom(attacker.squad.ATT) : pickRandom(attacker.squad.MID)) || pickRandom(attacker.squad.ATT) || pickRandom(attacker.squad.MID);
      const assistPlayer = pickRandom(attacker.squad.MID) || pickRandom(attacker.squad.DEF);
      const defGK = defender.squad.GK[0];
      const defDefender = pickRandom(defender.squad.DEF);
      const shotStyle = shotTypes[Math.floor(Math.random() * shotTypes.length)];

      if (!attShooter || !defGK) return; // shouldn't happen once squads are full

      let saveChance = BASE_SAVE + ((defGK.rating || 80) - (attShooter.rating || 80)) * GK_WEIGHT;
      saveChance = Math.max(0.08, Math.min(0.70, saveChance));
      const goalChance = Math.max(0.05, 1 - saveChance - MISS_CHANCE - CARD_CHANCE - VAR_CHANCE);

      const rand = Math.random();

      if (rand < goalChance) {
        if (isHostAttacking) hostGoals++; else guestGoals++;
        events.push({ minute, type: 'GOAL', text: `⚽ GOALLL!! ${attShooter.name} يسجل هدفاً عالمياً! ${shotStyle}! (تمريرة حاسمة: ${assistPlayer?.name || 'مجهود فردي'})`, score: `${hostGoals} - ${guestGoals}` });
      } else if (rand < goalChance + saveChance) {
        events.push({ minute, type: 'SAVE', text: `🧤 تصدي خيالي! الحارس العملاق ${defGK.name} يرتمي بأطراف أصابعه ويبعد تسديدة ${attShooter.name}!`, score: `${hostGoals} - ${guestGoals}` });
      } else if (rand < goalChance + saveChance + MISS_CHANCE) {
        events.push({ minute, type: 'MISS', text: `💥 القائم ينوب عن الحارس! تسديدة ${attShooter.name} تصطدم بالقائم وسط ذهول الجميع!`, score: `${hostGoals} - ${guestGoals}` });
      } else if (rand < goalChance + saveChance + MISS_CHANCE + CARD_CHANCE) {
        events.push({ minute, type: 'CARD', text: `🟨 بطاقة صفراء! الحكم يوجه إنذاراً للمدافع ${defDefender?.name || 'الدفاع'} بعد تدخل قوي لتوقيف خطورة ${attShooter.name}!`, score: `${hostGoals} - ${guestGoals}` });
      } else {
        events.push({ minute, type: 'VAR', text: `🖥️ تقنية الـ VAR تفحص التدخل على ${attShooter.name}... الحكم يشير بمنح ركلة حرة واعدة!`, score: `${hostGoals} - ${guestGoals}` });
      }
    });

    const hostPossession = Math.round((hostPower / (hostPower + guestPower)) * 100);
    const allPlayers = [
      ...POSITIONS.flatMap(p => room.host.squad[p] || []),
      ...POSITIONS.flatMap(p => room.guest.squad[p] || [])
    ];
    const mvpPlayer = allPlayers.sort((a, b) => b.rating - a.rating)[0] || { name: 'المستضيف', rating: 90 };

    const matchSim = {
      status: 'simulating',
      currentTime: 0,
      hostGoals,
      guestGoals,
      events,
      mvpPlayer,
      stats: {
        possession: [hostPossession, 100 - hostPossession],
        shots: [Math.floor(hostPower / 10), Math.floor(guestPower / 10)],
        shotsOnTarget: [hostGoals + 2, guestGoals + 2]
      }
    };

    roomRef.update({ status: 'simulating', matchSimulation: matchSim });

    if (room.host.id === myPlayerId) {
      let sec = 0;
      const interval = setInterval(() => {
        sec++;
        roomRef.child('matchSimulation/currentTime').set(Math.min(sec * 9, 90));
        if (sec >= 10) {
          clearInterval(interval);
          let winner = 'draw';
          if (hostGoals > guestGoals) winner = 'host';
          else if (guestGoals > hostGoals) winner = 'guest';
          roomRef.update({ status: 'finished', 'matchSimulation/status': 'finished', winner });
        }
      }, 1000);
    }
  },

  restartGame(roomId, squadMode) {
    const roomRef = db.ref('mazad_rooms/' + roomId);
    const mode = SQUAD_MODES[squadMode] ? squadMode : 'quick';
    roomRef.update({
      status: 'lobby',
      squadMode: mode,
      usedPlayerIds: {},
      lastStarterRole: 'guest',
      'host/remainingBudget': SQUAD_MODES[mode].budget,
      'host/squad': emptySquad(),
      'guest/remainingBudget': SQUAD_MODES[mode].budget,
      'guest/squad': emptySquad(),
      matchSimulation: null,
      lineupReady: null,
      winner: null,
      currentRound: null
    }).then(() => {
      roomRef.once('value').then(snapshot => {
        const room = snapshot.val();
        if (room && room.guest) applyRoundStart(roomRef, room);
      });
    });
  },

  notify(roomId, notification) {
    if (!roomId) return;
    const roomRef = db.ref('mazad_rooms/' + roomId);
    roomRef.child('lastNotification').set({
      ...notification,
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: myPlayerId,
      timestamp: Date.now()
    });
  }
};

window.AuctionEngine = AuctionEngine;
