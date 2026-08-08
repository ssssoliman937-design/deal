// Firebase Realtime Database Engine for Deal or No Deal Football Draft

// Firebase Init using provided Database URL
const firebaseConfig = {
  databaseURL: "https://cuafa-9f3b6-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// HTML Sanitizer to prevent XSS injection
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Persistent Unique Player ID
let myPlayerId = sessionStorage.getItem('dond_tab_player_id');
if (!myPlayerId) {
  myPlayerId = 'p_' + Math.random().toString(36).substring(2, 10);
  sessionStorage.setItem('dond_tab_player_id', myPlayerId);
}

// Database of real football stars, icons, legends and managers — shared with
// المزاد (see public/js/player-database.js, loaded before this script).
const PLAYER_DATABASE = window.PLAYER_DATABASE;

// Rarity/probability display: % of players at-or-above this rating, within its
// own position pool — grounded in the real data instead of an invented number.
function computeRarityTable() {
  const table = {};
  Object.keys(PLAYER_DATABASE).forEach(posKey => {
    const pool = PLAYER_DATABASE[posKey];
    const total = pool.length;
    table[posKey] = {};
    pool.forEach(p => {
      if (table[posKey][p.id] !== undefined) return;
      const atOrAbove = pool.filter(q => q.rating >= p.rating).length;
      table[posKey][p.id] = Math.max(1, Math.round((atOrAbove / total) * 100));
    });
  });
  return table;
}
const RARITY_TABLE = computeRarityTable();

function isIconLegend(name) {
  return /[👑🌟]/.test(name || '');
}

const HELPER_CARDS = [
  { id: 'steal', name: 'سرقة لاعب 🥷', desc: 'تبديل لاعب من تشكيلتك بآخر من الخصم!' },
  { id: 'protection', name: 'درع الحماية 🛡️', desc: 'قوة دفاعية +15% أثناء المحاكاة، وتقدر تحمي لاعب واحد من تشكيلتك من السرقة!' },
  { id: 'extra_chance', name: 'فرصة إضافية 🎲', desc: 'تتيح تجربة 3 بطاقات بدلاً من بطاقتين!' },
  { id: 'force_pick', name: 'إجبار الاختيار 🎯', desc: 'طلعلك لاعب مش عايزه؟ جبّر خصمك ياخده بدل مركزه، وياخدلك إنت فرصة تختار لاعب تاني!' },
  { id: 'random_pick', name: 'حظ عشوائي 🎰', desc: 'تكشف البطاقات الأربعة كلها وتاخد واحدة عشوائي فورًا من غير ما تختار بنفسك!' },
  { id: 'free_pick', name: 'اختيار حر 👁️', desc: 'تكشف البطاقات الأربعة كلها وتختار إنت بنفسك أي واحدة عايزها، مضمونة 100%!' }
];

const POSITIONS = ['GK', 'DEF', 'MID', 'ATT', 'MGR'];
const POSITION_NAMES_AR = {
  GK: 'حارس المرمى 🧤',
  DEF: 'المدافع 🛡️',
  MID: 'خط الوسط ⚽',
  ATT: 'المهاجم 🔥',
  MGR: 'المدرب 📋'
};

function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateBriefcases(positionKey, hasPlayerGivenHelper) {
  const available = PLAYER_DATABASE[positionKey];
  const selected4 = getRandomItems(available, 4);

  let helperAssignedIndex = -1;
  if (!hasPlayerGivenHelper && Math.random() < 0.7) {
    helperAssignedIndex = Math.floor(Math.random() * 4);
  }

  return selected4.map((item, index) => {
    let helper = null;
    if (index === helperAssignedIndex) {
      helper = HELPER_CARDS[Math.floor(Math.random() * HELPER_CARDS.length)];
    }
    return {
      cardId: index,
      item: item,
      helperCard: helper,
      isRevealed: false
    };
  });
}

const FirebaseEngine = {
  get myPlayerId() {
    return myPlayerId;
  },

  getRarityPct(item, posKey) {
    return (item && posKey && RARITY_TABLE[posKey] && RARITY_TABLE[posKey][item.id]) || 50;
  },

  isIconLegend(name) {
    return isIconLegend(name);
  },

  enterRoom(roomId, playerName) {
    const finalRoomId = roomId && roomId.trim().length > 0
      ? roomId.trim()
      : Math.floor(1000 + Math.random() * 9000).toString();

    const roomRef = db.ref('dond_rooms/' + finalRoomId);

    return roomRef.once('value').then(snapshot => {
      const room = snapshot.val();

      if (!room || !room.host) {
        // Tab 1 -> Automatically Become Host!
        myPlayerId = 'p_host_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('dond_tab_player_id', myPlayerId);

        const sanitizedHostName = escapeHTML(playerName || 'المستضيف');
        const initialRoom = {
          roomId: finalRoomId,
          status: 'drafting',
          createdAt: Date.now(),
          host: {
            id: myPlayerId,
            name: sanitizedHostName,
            squad: { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
            helperCard: null,
            protectedPos: null
          },
          guest: null,
          spectatorsCount: 0,
          currentTurn: 'host',
          positionIndex: 0,
          turnState: {
            positionKey: 'GK',
            positionNameAr: POSITION_NAMES_AR['GK'],
            briefcases: generateBriefcases('GK', false),
            pickedBriefcaseIndex: null,
            pickNumber: 0,
            status: 'waiting_pick_1'
          },
          matchSimulation: null
        };

        return roomRef.set(initialRoom).then(() => finalRoomId);
      } else if (room.host && room.host.id === myPlayerId) {
        // Host reconnecting
        return finalRoomId;
      } else if (!room.guest) {
        // Tab 2 -> Automatically Become Guest!
        myPlayerId = 'p_guest_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('dond_tab_player_id', myPlayerId);

        const sanitizedGuestName = escapeHTML((playerName && playerName !== 'المستضيف') ? playerName : 'الضيف');
        const guestData = {
          id: myPlayerId,
          name: sanitizedGuestName,
          squad: { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
          helperCard: null,
          protectedPos: null
        };
        return roomRef.child('guest').set(guestData).then(() => finalRoomId);
      } else if (room.guest && room.guest.id === myPlayerId) {
        // Guest reconnecting
        return finalRoomId;
      } else {
        // Tab 3+ -> Become Spectator!
        myPlayerId = 'p_spec_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('dond_tab_player_id', myPlayerId);

        const currentSpecs = room.spectatorsCount || 0;
        return roomRef.child('spectatorsCount').set(currentSpecs + 1).then(() => finalRoomId);
      }
    });
  },

  createRoom(roomId, playerName) {
    return this.enterRoom(roomId, playerName);
  },

  joinRoom(roomId, playerName, onError) {
    return this.enterRoom(roomId, playerName);
  },

  listenToRoom(roomId, onUpdate) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.on('value', snapshot => {
      const room = snapshot.val();
      if (room) {
        onUpdate(room);
      }
    });
  },

  pickBriefcase(roomId, briefcaseIndex, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    const briefcases = [...roomState.turnState.briefcases];

    if (!briefcases[briefcaseIndex] || briefcases[briefcaseIndex].isRevealed) return;

    briefcases[briefcaseIndex].isRevealed = true;

    const isHost = roomState.currentTurn === 'host';
    const activePlayer = isHost ? roomState.host : roomState.guest;
    const hasExtraChance = activePlayer?.helperCard?.id === 'extra_chance';

    if (roomState.turnState.status === 'waiting_pick_1') {
      roomRef.child('turnState').update({
        briefcases: briefcases,
        pickedBriefcaseIndex: briefcaseIndex,
        pickNumber: 1,
        status: 'picked_1_pending_deal'
      });
    } else if (roomState.turnState.status === 'waiting_pick_2') {
      if (hasExtraChance) {
        // Extra-chance card grants a 3rd attempt instead of auto-finalizing
        roomRef.child('turnState').update({
          briefcases: briefcases,
          pickedBriefcaseIndex: briefcaseIndex,
          pickNumber: 2,
          status: 'picked_2_pending_deal'
        });
      } else {
        roomRef.child('turnState').update({
          briefcases: briefcases,
          pickedBriefcaseIndex: briefcaseIndex,
          pickNumber: 2,
          status: 'finished_turn'
        });
        this.finalizeSelection(roomId, roomState, briefcases[briefcaseIndex]);
      }
    } else if (roomState.turnState.status === 'waiting_pick_3') {
      roomRef.child('turnState').update({
        briefcases: briefcases,
        pickedBriefcaseIndex: briefcaseIndex,
        pickNumber: 3,
        status: 'finished_turn'
      });
      this.finalizeSelection(roomId, roomState, briefcases[briefcaseIndex], 'extra_chance');
    }
  },

  confirmDeal(roomId, roomState) {
    // Card is only consumed if the 3rd attempt is actually taken (see pickBriefcase's
    // waiting_pick_3 branch) — dealing after pick 2 keeps the card unused for next turn.
    const selectedB = roomState.turnState.briefcases[roomState.turnState.pickedBriefcaseIndex];
    this.finalizeSelection(roomId, roomState, selectedB);
  },

  rejectDeal(roomId, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    const nextStatus = roomState.turnState.status === 'picked_2_pending_deal' ? 'waiting_pick_3' : 'waiting_pick_2';
    roomRef.child('turnState').update({
      status: nextStatus
    });
  },

  finalizeSelection(roomId, roomState, briefcase, consumeCardId) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    const isHost = roomState.currentTurn === 'host';
    const playerKey = isHost ? 'host' : 'guest';
    const posKey = POSITIONS[roomState.positionIndex];

    // Reveal all remaining briefcases
    const allRevealedBriefcases = roomState.turnState.briefcases.map(b => ({
      ...b,
      isRevealed: true
    }));

    // Update squad item & helper
    const playerObj = roomState[playerKey];
    const newSquad = { ...playerObj.squad, [posKey]: briefcase.item };
    let newHelper = playerObj.helperCard || null;
    let helperJustDrawn = null;
    if (briefcase.helperCard && !newHelper) {
      newHelper = briefcase.helperCard;
      helperJustDrawn = briefcase.helperCard;
    } else if (consumeCardId && playerObj.helperCard && playerObj.helperCard.id === consumeCardId) {
      // Card consumed only for the acting player (playerKey), e.g. extra_chance
      // after its 3rd pick, or random_pick/free_pick right after they're used.
      newHelper = null;
    }

    roomRef.child(playerKey).update({
      squad: newSquad,
      helperCard: newHelper
    });

    roomRef.child('turnState/briefcases').set(allRevealedBriefcases);

    if (helperJustDrawn) {
      this.notify(roomId, {
        kind: 'helper_drawn',
        text: `🎁 حصل ${playerObj.name} على كارت مساعدة: ${helperJustDrawn.name}! (${helperJustDrawn.desc})`
      });
    }

    // Local patched snapshot so the delayed turn-transition below always sees
    // THIS pick's own update, even though `roomState` is a stale param frozen
    // at click time (fixes MGR/last-pick being dropped from the match simulation).
    const patchedRoomState = {
      ...roomState,
      [playerKey]: { ...playerObj, squad: newSquad, helperCard: newHelper }
    };

    // Transition turn after 3.5 seconds
    setTimeout(() => {
      let nextTurn = patchedRoomState.currentTurn;
      let nextPosIndex = patchedRoomState.positionIndex;

      if (roomState.turnState.dumpedThisPosition) {
        // The opponent's slot for this position was already force-filled by
        // dumpOnOpponent() — the position is fully resolved either way, so
        // skip straight to the next one instead of passing the turn.
        nextTurn = 'host';
        nextPosIndex++;
      } else if (isHost) {
        nextTurn = 'guest';
      } else {
        nextTurn = 'host';
        nextPosIndex++;
      }

      if (nextPosIndex >= POSITIONS.length) {
        // Draft complete — show both lineups before the simulation starts
        roomRef.update({ status: 'lineup' });
      } else {
        const nextPosKey = POSITIONS[nextPosIndex];
        const hasHelperObj = isHost ? !!patchedRoomState.guest?.helperCard : !!patchedRoomState.host?.helperCard;
        const newBriefcases = generateBriefcases(nextPosKey, hasHelperObj);

        roomRef.update({
          currentTurn: nextTurn,
          positionIndex: nextPosIndex,
          turnState: {
            positionKey: nextPosKey,
            positionNameAr: POSITION_NAMES_AR[nextPosKey],
            briefcases: newBriefcases,
            pickedBriefcaseIndex: null,
            pickNumber: 0,
            status: 'waiting_pick_1'
          }
        });
      }
    }, 3500);
  },

  startMatchSimulation(roomId, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);

    // Power calculations — team rating average, boosted by helper card + a
    // per-match energy roll (freshness on the day, not a persisted stat)
    const calcPower = (squad, helper) => {
      let r = 0;
      ['GK', 'DEF', 'MID', 'ATT', 'MGR'].forEach(k => { r += (squad[k]?.rating || 80); });
      let p = r / 5;
      if (helper && helper.id === 'protection') p += 3;
      return p;
    };

    const hostEnergy = 0.9 + Math.random() * 0.15;   // 0.90–1.05, ephemeral per match
    const guestEnergy = 0.9 + Math.random() * 0.15;
    const hostPower = calcPower(roomState.host.squad, roomState.host.helperCard) * hostEnergy;
    const guestPower = calcPower(roomState.guest.squad, roomState.guest.helperCard) * guestEnergy;

    let hostGoals = 0;
    let guestGoals = 0;
    const events = [];
    const minutes = [8, 19, 34, 48, 62, 75, 84, 92];
    const shotTypes = ['صاروخية لا تُصد ولا تُرَد', 'مقوسة R2 في زاوية مستحيلة', 'رأسية متقنة بارتقاء خرافي', 'تسديدة أرضية زاحفة على يمين الحارس', 'ركلة جزاء محكمة في الشباك'];

    // Outcome shares that don't hinge on goalkeeper skill — save% is computed
    // per-event below from the actual GK-vs-shooter rating gap.
    const MISS_CHANCE = 0.17;
    const CARD_CHANCE = 0.10;
    const VAR_CHANCE = 0.08;
    const BASE_SAVE = 0.30;
    const GK_WEIGHT = 0.01; // each rating point of (GK - shooter) swings save% by 1pt

    minutes.forEach((minute, index) => {
      const isHostAttacking = Math.random() * (hostPower + guestPower) < hostPower;
      const attacker = isHostAttacking ? roomState.host : roomState.guest;
      const defender = isHostAttacking ? roomState.guest : roomState.host;
      const attShooter = (Math.random() < 0.6) ? attacker.squad.ATT : attacker.squad.MID;
      const assistPlayer = (attShooter === attacker.squad.ATT) ? attacker.squad.MID : attacker.squad.DEF;
      const defGK = defender.squad.GK;
      const shotStyle = shotTypes[Math.floor(Math.random() * shotTypes.length)];

      let saveChance = BASE_SAVE + ((defGK?.rating || 80) - (attShooter?.rating || 80)) * GK_WEIGHT;
      saveChance = Math.max(0.08, Math.min(0.70, saveChance));
      const goalChance = Math.max(0.05, 1 - saveChance - MISS_CHANCE - CARD_CHANCE - VAR_CHANCE);

      const rand = Math.random();

      if (rand < goalChance) {
        if (isHostAttacking) hostGoals++; else guestGoals++;
        events.push({
          minute,
          type: 'GOAL',
          text: `⚽ GOALLL!! ${attShooter.name} يسجل هدفاً عالمياً! ${shotStyle}! (تمريرة حاسمة: ${assistPlayer?.name || 'مجهود فردي'})`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else if (rand < goalChance + saveChance) {
        events.push({
          minute,
          type: 'SAVE',
          text: `🧤 تصدي خيالي! الحارس العملاق ${defGK.name} يرتمي بأطراف أصابعه ويبعد تسديدة ${attShooter.name}!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else if (rand < goalChance + saveChance + MISS_CHANCE) {
        events.push({
          minute,
          type: 'MISS',
          text: `💥 القائم ينوب عن الحارس! تسديدة ${attShooter.name} تصطدم بالقائم وسط ذهول الجميع!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else if (rand < goalChance + saveChance + MISS_CHANCE + CARD_CHANCE) {
        events.push({
          minute,
          type: 'CARD',
          text: `🟨 بطاقة صفراء! الحكم يوجه إنذاراً للمدافع ${defender.squad.DEF.name} بعد تدخل قوي لتوقيف خطورة ${attShooter.name}!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      } else {
        events.push({
          minute,
          type: 'VAR',
          text: `🖥️ تقنية الـ VAR تفحص التدخل على ${attShooter.name}... الحكم يشير بمنح ركلة حرة واعدة!`,
          score: `${hostGoals} - ${guestGoals}`
        });
      }
    });

    const hostPossession = Math.round((hostPower / (hostPower + guestPower)) * 100);

    // MVP Determination
    const allPlayers = [
      ...Object.values(roomState.host.squad).filter(Boolean),
      ...Object.values(roomState.guest.squad).filter(Boolean)
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

    roomRef.update({
      status: 'simulating',
      matchSimulation: matchSim
    });

    // Run 10-second ticker on host client
    if (roomState.host.id === myPlayerId) {
      let sec = 0;
      const interval = setInterval(() => {
        sec++;
        const timeVal = Math.min(sec * 9, 90);
        roomRef.child('matchSimulation/currentTime').set(timeVal);

        if (sec >= 10) {
          clearInterval(interval);
          let winner = 'draw';
          if (hostGoals > guestGoals) winner = 'host';
          else if (guestGoals > hostGoals) winner = 'guest';

          roomRef.update({
            status: 'finished',
            'matchSimulation/status': 'finished',
            winner: winner
          });
        }
      }, 1000);
    }
  },

  confirmLineupReady(roomId, roomState) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('lineupReady').transaction(current => current ? current : true)
      .then(result => {
        if (result.committed && roomState.host.id === myPlayerId) {
          // Only the host client actually starts the simulation (matches ticker ownership below)
          this.startMatchSimulation(roomId, roomState);
        }
      });
  },

  requestSteal(roomId, roomState, myPos, oppPos) {
    // Restricted to the lineup-reveal screen: both squads are complete there,
    // and the match outcome is pre-computed synchronously once simulation starts.
    if (roomState.status !== 'lineup') return;
    if (myPos !== oppPos) return; // same-position swap only, keeps squads structurally valid
    const isHost = roomState.host.id === myPlayerId;
    const myKey = isHost ? 'host' : 'guest';
    const oppKey = isHost ? 'guest' : 'host';
    const me = roomState[myKey];
    const opp = roomState[oppKey];
    if (!me || !opp) return;
    if (!me.helperCard || me.helperCard.id !== 'steal') return;
    if (opp.protectedPos && opp.protectedPos === oppPos) return; // shielded by درع الحماية
    const givenPlayer = me.squad[myPos];
    const takenPlayer = opp.squad[oppPos];
    if (!givenPlayer || !takenPlayer) return;

    const roomRef = db.ref('dond_rooms/' + roomId);
    const updates = {};
    updates[`${myKey}/squad/${myPos}`] = takenPlayer;
    updates[`${oppKey}/squad/${oppPos}`] = givenPlayer;
    updates[`${myKey}/helperCard`] = null;

    return roomRef.update(updates).then(() => {
      this.notify(roomId, {
        kind: 'steal',
        text: `🥷 تم سرقة ${takenPlayer.name} منك واستبداله بـ ${givenPlayer.name}!`
      });
    });
  },

  setProtection(roomId, roomState, posKey) {
    // Usable on the lineup-reveal screen, before the opponent can steal: shields
    // one of your own players so requestSteal refuses to take them.
    if (roomState.status !== 'lineup') return;
    const isHost = roomState.host.id === myPlayerId;
    const myKey = isHost ? 'host' : 'guest';
    const me = roomState[myKey];
    if (!me || !me.helperCard || me.helperCard.id !== 'protection') return;
    if (!me.squad[posKey]) return;

    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child(myKey + '/protectedPos').set(posKey);
    this.notify(roomId, {
      kind: 'protection',
      text: `🛡️ ${me.name} حمى ${me.squad[posKey].name} من السرقة!`
    });
  },

  useRandomPick(roomId, roomState) {
    // Usable right before picking (waiting_pick_1): instantly assigns a random
    // one of the 4 current cards, skipping the manual pick/deal flow entirely.
    if (roomState.turnState.status !== 'waiting_pick_1') return;
    const isHost = roomState.currentTurn === 'host';
    const activePlayer = isHost ? roomState.host : roomState.guest;
    if (!activePlayer?.helperCard || activePlayer.helperCard.id !== 'random_pick') return;
    const idx = Math.floor(Math.random() * roomState.turnState.briefcases.length);
    this.finalizeSelection(roomId, roomState, roomState.turnState.briefcases[idx], 'random_pick');
  },

  useFreePick(roomId, roomState) {
    // Reveals all 4 cards face-up so the active player can pick whichever
    // one they actually want (see confirmFreePick).
    if (roomState.turnState.status !== 'waiting_pick_1') return;
    const isHost = roomState.currentTurn === 'host';
    const activePlayer = isHost ? roomState.host : roomState.guest;
    if (!activePlayer?.helperCard || activePlayer.helperCard.id !== 'free_pick') return;
    const revealedBriefcases = roomState.turnState.briefcases.map(b => ({ ...b, isRevealed: true }));
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('turnState').update({ briefcases: revealedBriefcases, status: 'free_pick_active' });
  },

  confirmFreePick(roomId, roomState, briefcaseIndex) {
    if (roomState.turnState.status !== 'free_pick_active') return;
    const briefcase = roomState.turnState.briefcases[briefcaseIndex];
    if (!briefcase) return;
    this.finalizeSelection(roomId, roomState, briefcase, 'free_pick');
  },

  dumpOnOpponent(roomId, roomState) {
    // Usable right when you reveal a player you don't want, at the same
    // decision point as Deal/No Deal: forces that player onto the OPPONENT's
    // squad for this position (they skip their own pick for it), then gives
    // the active player a fresh pick for the same position instead.
    if (!['picked_1_pending_deal', 'picked_2_pending_deal'].includes(roomState.turnState.status)) return;
    const isHost = roomState.currentTurn === 'host';
    const activeKey = isHost ? 'host' : 'guest';
    const oppKey = isHost ? 'guest' : 'host';
    const activePlayer = roomState[activeKey];
    const opp = roomState[oppKey];
    if (!opp) return;
    if (!activePlayer.helperCard || activePlayer.helperCard.id !== 'force_pick') return;

    const posKey = POSITIONS[roomState.positionIndex];
    const briefcase = roomState.turnState.briefcases[roomState.turnState.pickedBriefcaseIndex];
    if (!briefcase || !briefcase.item) return;

    const roomRef = db.ref('dond_rooms/' + roomId);
    const newOppSquad = { ...opp.squad, [posKey]: briefcase.item };
    const allRevealed = roomState.turnState.briefcases.map(b => ({ ...b, isRevealed: true }));

    roomRef.child(oppKey).update({ squad: newOppSquad });
    roomRef.child(activeKey + '/helperCard').set(null);
    roomRef.child('turnState/briefcases').set(allRevealed);

    this.notify(roomId, {
      kind: 'dump',
      text: `🎯 ${activePlayer.name} أجبر ${opp.name} ياخد ${briefcase.item.name} في مركز ${POSITION_NAMES_AR[posKey]}! و${activePlayer.name} بياخد فرصة يختار لاعب تاني.`
    });

    setTimeout(() => {
      const newBriefcases = generateBriefcases(posKey, false);
      roomRef.child('turnState').set({
        positionKey: posKey,
        positionNameAr: POSITION_NAMES_AR[posKey],
        briefcases: newBriefcases,
        pickedBriefcaseIndex: null,
        pickNumber: 0,
        status: 'waiting_pick_1',
        dumpedThisPosition: true
      });
    }, 3500);
  },

  sendEmoji(roomId, emojiSymbol) {
    if (!roomId) return;
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('lastEmoji').set({
      symbol: emojiSymbol,
      senderId: myPlayerId,
      timestamp: Date.now()
    });
  },

  notify(roomId, notification) {
    if (!roomId) return;
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.child('lastNotification').set({
      ...notification,
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      senderId: myPlayerId,
      timestamp: Date.now()
    });
  },

  restartGame(roomId) {
    const roomRef = db.ref('dond_rooms/' + roomId);
    roomRef.update({
      status: 'drafting',
      currentTurn: 'host',
      positionIndex: 0,
      'host/squad': { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
      'host/helperCard': null,
      'host/protectedPos': null,
      'guest/squad': { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
      'guest/helperCard': null,
      'guest/protectedPos': null,
      turnState: {
        positionKey: 'GK',
        positionNameAr: POSITION_NAMES_AR['GK'],
        briefcases: generateBriefcases('GK', false),
        pickedBriefcaseIndex: null,
        pickNumber: 0,
        status: 'waiting_pick_1'
      },
      matchSimulation: null,
      lineupReady: null
    });
  }
};

window.FirebaseEngine = FirebaseEngine;
