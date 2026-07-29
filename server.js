const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Environment & Secret Configuration
const defaultPort = parseInt(process.env.PORT || '3001', 10);
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL || 'https://cuafa-9f3b6-default-rtdb.firebaseio.com';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// API Resilience: Rate Limiter on all incoming requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: 'Too many requests, please try again later.' }
});
app.use(apiLimiter);

// Comprehensive Input Sanitization Helper (XSS & Payload Protection)
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/[\$\{\}]/g, ''); // Neutralize NoSQL / Path injection payload keys
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database of real football stars and managers
const PLAYER_DATABASE = {
  GK: [
    { id: 'gk1', name: 'Thibaut Courtois', rating: 90, club: 'Real Madrid', nation: 'Belgium', photo: '🧤', stats: { div: 89, han: 88, kic: 75, ref: 93, pos: 90 } },
    { id: 'gk2', name: 'Alisson Becker', rating: 89, club: 'Liverpool', nation: 'Brazil', photo: '🧤', stats: { div: 86, han: 87, kic: 85, ref: 89, pos: 90 } },
    { id: 'gk3', name: 'Gianluigi Donnarumma', rating: 88, club: 'PSG', nation: 'Italy', photo: '🧤', stats: { div: 89, han: 84, kic: 76, ref: 89, pos: 86 } },
    { id: 'gk4', name: 'Marc-André ter Stegen', rating: 89, club: 'Barcelona', nation: 'Germany', photo: '🧤', stats: { div: 86, han: 85, kic: 88, ref: 90, pos: 86 } },
    { id: 'gk5', name: 'Emiliano Martínez', rating: 87, club: 'Aston Villa', nation: 'Argentina', photo: '🧤', stats: { div: 85, han: 83, kic: 82, ref: 87, pos: 86 } },
    { id: 'gk6', name: 'Ederson', rating: 88, club: 'Manchester City', nation: 'Brazil', photo: '🧤', stats: { div: 85, han: 82, kic: 92, ref: 86, pos: 86 } },
    { id: 'gk7', name: 'Jan Oblak', rating: 88, club: 'Atletico Madrid', nation: 'Slovenia', photo: '🧤', stats: { div: 88, han: 89, kic: 77, ref: 89, pos: 87 } },
    { id: 'gk8', name: 'Yassine Bounou', rating: 86, club: 'Al-Hilal', nation: 'Morocco', photo: '🧤', stats: { div: 84, han: 84, kic: 78, ref: 88, pos: 85 } }
  ],
  DEF: [
    { id: 'def1', name: 'Virgil van Dijk', rating: 90, club: 'Liverpool', nation: 'Netherlands', photo: '🛡️', stats: { pac: 78, sho: 60, pas: 71, dri: 72, def: 91, phy: 86 } },
    { id: 'def2', name: 'Rúben Dias', rating: 89, club: 'Manchester City', nation: 'Portugal', photo: '🛡️', stats: { pac: 65, sho: 39, pas: 68, dri: 68, def: 89, phy: 87 } },
    { id: 'def3', name: 'Antonio Rüdiger', rating: 87, club: 'Real Madrid', nation: 'Germany', photo: '🛡️', stats: { pac: 82, sho: 54, pas: 71, dri: 67, def: 86, phy: 86 } },
    { id: 'def4', name: 'Achraf Hakimi', rating: 86, club: 'PSG', nation: 'Morocco', photo: '🛡️', stats: { pac: 92, sho: 76, pas: 80, dri: 82, def: 77, phy: 78 } },
    { id: 'def5', name: 'William Saliba', rating: 88, club: 'Arsenal', nation: 'France', photo: '🛡️', stats: { pac: 80, sho: 45, pas: 72, dri: 75, def: 88, phy: 84 } },
    { id: 'def6', name: 'Theo Hernández', rating: 86, club: 'AC Milan', nation: 'France', photo: '🛡️', stats: { pac: 93, sho: 72, pas: 76, dri: 81, def: 79, phy: 84 } },
    { id: 'def7', name: 'Marquinhos', rating: 87, club: 'PSG', nation: 'Brazil', photo: '🛡️', stats: { pac: 79, sho: 56, pas: 75, dri: 74, def: 88, phy: 80 } },
    { id: 'def8', name: 'Trent Alexander-Arnold', rating: 86, club: 'Liverpool', nation: 'England', photo: '🛡️', stats: { pac: 76, sho: 69, pas: 90, dri: 80, def: 80, phy: 73 } }
  ],
  MID: [
    { id: 'mid1', name: 'Jude Bellingham', rating: 90, club: 'Real Madrid', nation: 'England', photo: '⚽', stats: { pac: 80, sho: 87, pas: 83, dri: 88, def: 78, phy: 83 } },
    { id: 'mid2', name: 'Kevin De Bruyne', rating: 91, club: 'Manchester City', nation: 'Belgium', photo: '⚽', stats: { pac: 72, sho: 88, pas: 94, dri: 87, def: 65, phy: 75 } },
    { id: 'mid3', name: 'Rodri', rating: 91, club: 'Manchester City', nation: 'Spain', photo: '⚽', stats: { pac: 66, sho: 75, pas: 86, dri: 81, def: 87, phy: 85 } },
    { id: 'mid4', name: 'Luka Modrić', rating: 87, club: 'Real Madrid', nation: 'Croatia', photo: '⚽', stats: { pac: 72, sho: 76, pas: 89, dri: 88, def: 72, phy: 66 } },
    { id: 'mid5', name: 'Pedri', rating: 86, club: 'Barcelona', nation: 'Spain', photo: '⚽', stats: { pac: 78, sho: 69, pas: 83, dri: 88, def: 68, phy: 67 } },
    { id: 'mid6', name: 'Federico Valverde', rating: 88, club: 'Real Madrid', nation: 'Uruguay', photo: '⚽', stats: { pac: 88, sho: 82, pas: 84, dri: 84, def: 80, phy: 84 } },
    { id: 'mid7', name: 'Jamal Musiala', rating: 88, club: 'Bayern Munich', nation: 'Germany', photo: '⚽', stats: { pac: 85, sho: 78, pas: 81, dri: 92, def: 63, phy: 66 } },
    { id: 'mid8', name: 'Bruno Fernandes', rating: 88, club: 'Manchester Utd', nation: 'Portugal', photo: '⚽', stats: { pac: 73, sho: 84, pas: 89, dri: 82, def: 67, phy: 76 } }
  ],
  ATT: [
    { id: 'att1', name: 'Kylian Mbappé', rating: 91, club: 'Real Madrid', nation: 'France', photo: '🔥', stats: { pac: 97, sho: 90, pas: 80, dri: 92, def: 36, phy: 78 } },
    { id: 'att2', name: 'Erling Haaland', rating: 91, club: 'Manchester City', nation: 'Norway', photo: '🔥', stats: { pac: 89, sho: 93, pas: 66, dri: 80, def: 45, phy: 88 } },
    { id: 'att3', name: 'Vinícius Júnior', rating: 90, club: 'Real Madrid', nation: 'Brazil', photo: '🔥', stats: { pac: 95, sho: 84, pas: 81, dri: 91, def: 29, phy: 69 } },
    { id: 'att4', name: 'Mohamed Salah', rating: 89, club: 'Liverpool', nation: 'Egypt', photo: '🔥', stats: { pac: 89, sho: 87, pas: 81, dri: 88, def: 45, phy: 76 } },
    { id: 'att5', name: 'Harry Kane', rating: 90, club: 'Bayern Munich', nation: 'England', photo: '🔥', stats: { pac: 69, sho: 93, pas: 84, dri: 83, def: 47, phy: 82 } },
    { id: 'att6', name: 'Robert Lewandowski', rating: 88, club: 'Barcelona', nation: 'Poland', photo: '🔥', stats: { pac: 75, sho: 88, pas: 79, dri: 85, def: 44, phy: 82 } },
    { id: 'att7', name: 'Lamine Yamal', rating: 86, club: 'Barcelona', nation: 'Spain', photo: '🔥', stats: { pac: 88, sho: 79, pas: 82, dri: 90, def: 35, phy: 60 } },
    { id: 'att8', name: 'Cristiano Ronaldo', rating: 86, club: 'Al-Nassr', nation: 'Portugal', photo: '🔥', stats: { pac: 77, sho: 88, pas: 75, dri: 80, def: 34, phy: 75 } }
  ],
  MGR: [
    { id: 'mgr1', name: 'Pep Guardiola', rating: 92, club: 'Manchester City', nation: 'Spain', photo: '📋', tactic: 'Tiki-Taka (استحواذ وهجوم كاسح)' },
    { id: 'mgr2', name: 'Carlo Ancelotti', rating: 92, club: 'Real Madrid', nation: 'Italy', photo: '📋', tactic: 'شخصية البطل والريمونتادا' },
    { id: 'mgr3', name: 'Jürgen Klopp', rating: 90, club: 'Free Agent', nation: 'Germany', photo: '📋', tactic: 'Gegenpressing (ضغط عالي ممتد)' },
    { id: 'mgr4', name: 'Mikel Arteta', rating: 88, club: 'Arsenal', nation: 'Spain', photo: '📋', tactic: 'التكتيك المحكم والعرضيات' },
    { id: 'mgr5', name: 'José Mourinho', rating: 87, club: 'Fenerbahçe', nation: 'Portugal', photo: '📋', tactic: 'ركن الحافلة والملعب المغلق' },
    { id: 'mgr6', name: 'Luis Enrique', rating: 88, club: 'PSG', nation: 'Spain', photo: '📋', tactic: 'الضغط السريع والأطراف' },
    { id: 'mgr7', name: 'Xabi Alonso', rating: 89, club: 'Bayer Leverkusen', nation: 'Spain', photo: '📋', tactic: 'كرة القدم الشاملة والسرعة' },
    { id: 'mgr8', name: 'Lionel Scaloni', rating: 89, club: 'Argentina', nation: 'Argentina', photo: '📋', tactic: 'روح الفريق والقتالية' }
  ]
};

const HELPER_CARDS = [
  { id: 'steal', name: 'سرقة لاعب 🥷', desc: 'يمكنك تبديل لاعب من تشكيلتك بآخر من تشكيلة الخصم قبل المباراة!' },
  { id: 'protection', name: 'درع الحماية 🛡️', desc: 'يمنح تشكيلتك حماية وقوة دفاعية +15% أثناء المحاكاة!' },
  { id: 'extra_chance', name: 'فرصة إضافية 🎲', desc: 'تتيح لك تجربة 3 بطاقات بدلاً من بطاقتين عند الاختيار!' }
];

const POSITIONS = ['GK', 'DEF', 'MID', 'ATT', 'MGR'];
const POSITION_NAMES_AR = {
  GK: 'حارس المرمى 🧤',
  DEF: 'المدافع 🛡️',
  MID: 'خط الوسط ⚽',
  ATT: 'المهاجم 🔥',
  MGR: 'المدرب 📋'
};

// Rooms state in memory
const rooms = {};

// Helper functions
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateBriefcases(positionKey, hasPlayerGivenHelper) {
  const available = PLAYER_DATABASE[positionKey];
  const selected4 = getRandomItems(available, 4);

  // Randomly assign 1 helper card to 1 of the 4 items if player hasn't received helper yet
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

function createNewRoom(roomId, hostSocketId, hostName) {
  return {
    roomId,
    status: 'drafting', // 'drafting', 'simulating', 'finished'
    host: {
      socketId: hostSocketId,
      name: hostName || 'المستضيف (Player 1)',
      squad: { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
      helperCard: null,
      picksCount: 0
    },
    guest: null, // Filled when guest joins
    spectators: [], // [{ socketId, name }]
    currentTurn: 'host', // 'host' or 'guest'
    positionIndex: 0, // 0 to 4 (GK -> MGR)
    turnState: {
      pickedBriefcaseIndex: null, // index 0..3
      pickNumber: 0, // 1 or 2
      briefcases: null, // 4 briefcases generated for active turn
      status: 'waiting_pick_1' // 'waiting_pick_1', 'picked_1_pending_deal', 'finished_turn'
    },
    matchSimulation: null
  };
}

function initTurn(room) {
  const isHost = room.currentTurn === 'host';
  const playerObj = isHost ? room.host : room.guest;
  const positionKey = POSITIONS[room.positionIndex];
  const hasHelper = !!playerObj.helperCard;

  const briefcases = generateBriefcases(positionKey, hasHelper);

  room.turnState = {
    positionKey: positionKey,
    positionNameAr: POSITION_NAMES_AR[positionKey],
    briefcases: briefcases,
    pickedBriefcaseIndex: null,
    pickNumber: 0,
    status: 'waiting_pick_1'
  };
}

// Socket communication
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create room
  socket.on('create_room', ({ roomId, playerName }) => {
    let finalRoomId = roomId && roomId.trim().length > 0 
      ? roomId.trim() 
      : Math.floor(1000 + Math.random() * 9000).toString();

    // Create fresh room state
    const newRoom = createNewRoom(finalRoomId, socket.id, playerName);
    rooms[finalRoomId] = newRoom;
    
    socket.join(finalRoomId);
    socket.roomId = finalRoomId;
    socket.role = 'host';

    socket.emit('role_assigned', { role: 'host' });
    socket.emit('room_created', {
      roomId: finalRoomId,
      role: 'host',
      roomState: getPublicRoomState(newRoom)
    });
  });

  // Join room
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (!room) {
      return socket.emit('error_message', 'عفواً، الغرفة غير موجودة! التأكد من الكود.');
    }

    socket.join(roomId);
    socket.roomId = roomId;

    if (!room.guest && room.host.socketId !== socket.id) {
      // Become Guest
      room.guest = {
        socketId: socket.id,
        name: playerName || 'الضيف (Player 2)',
        squad: { GK: null, DEF: null, MID: null, ATT: null, MGR: null },
        helperCard: null,
        picksCount: 0
      };
      socket.role = 'guest';

      socket.emit('role_assigned', { role: 'guest' });
      
      // Initialize first turn (Host picks GK)
      initTurn(room);

      io.to(roomId).emit('room_updated', getPublicRoomState(room));
      io.to(roomId).emit('game_started', { message: 'بدأت اللعبة! حظ سعيد للطرفين.' });
    } else if (room.host.socketId === socket.id) {
      // Reconnect host
      socket.role = 'host';
      socket.emit('role_assigned', { role: 'host' });
      socket.emit('room_updated', getPublicRoomState(room));
    } else if (room.guest && room.guest.socketId === socket.id) {
      // Reconnect guest
      socket.role = 'guest';
      socket.emit('role_assigned', { role: 'guest' });
      socket.emit('room_updated', getPublicRoomState(room));
    } else {
      // Room is full with Host & Guest -> Join as Spectator!
      socket.role = 'spectator';
      const spectatorObj = { socketId: socket.id, name: playerName || `مراقب #${room.spectators.length + 1}` };
      room.spectators.push(spectatorObj);

      socket.emit('role_assigned', { role: 'spectator' });
      socket.emit('assigned_spectator', {
        roomId,
        role: 'spectator',
        message: 'الغرفة ممتلئة باللاعبين. لقد دخلت الآن بصفة (مراقب 👁️) لمشاهدة المباراة!'
      });

      io.to(roomId).emit('room_updated', getPublicRoomState(room));
    }
  });

  // Action: Pick 1st Briefcase
  socket.on('pick_briefcase', ({ briefcaseIndex }) => {
    const room = rooms[socket.roomId];
    if (!room || room.status !== 'drafting') return;

    const isHostTurn = room.currentTurn === 'host';
    if ((isHostTurn && socket.role !== 'host') || (!isHostTurn && socket.role !== 'guest')) {
      return socket.emit('error_message', 'ليس دورك الآن!');
    }

    if (room.turnState.status !== 'waiting_pick_1' && room.turnState.status !== 'waiting_pick_2') {
      return;
    }

    const briefcase = room.turnState.briefcases[briefcaseIndex];
    if (!briefcase || briefcase.isRevealed) return;

    briefcase.isRevealed = true;
    room.turnState.pickedBriefcaseIndex = briefcaseIndex;

    if (room.turnState.status === 'waiting_pick_1') {
      // First Pick
      room.turnState.pickNumber = 1;
      room.turnState.status = 'picked_1_pending_deal';

      io.to(room.roomId).emit('briefcase_opened', {
        briefcaseIndex,
        item: briefcase.item,
        helperCard: briefcase.helperCard,
        pickNumber: 1,
        canDeal: true,
        roomState: getPublicRoomState(room)
      });
    } else if (room.turnState.status === 'waiting_pick_2') {
      // Second Pick -> AUTO DEAL!
      room.turnState.pickNumber = 2;
      room.turnState.status = 'finished_turn';

      // Auto deal!
      finalizeSelection(room, briefcase);
    }
  });

  // Action: Deal (Accept 1st Pick)
  socket.on('confirm_deal', () => {
    const room = rooms[socket.roomId];
    if (!room || room.status !== 'drafting') return;

    const isHostTurn = room.currentTurn === 'host';
    if ((isHostTurn && socket.role !== 'host') || (!isHostTurn && socket.role !== 'guest')) {
      return socket.emit('error_message', 'ليس دورك الآن!');
    }

    if (room.turnState.status !== 'picked_1_pending_deal') return;

    const selectedBriefcase = room.turnState.briefcases[room.turnState.pickedBriefcaseIndex];
    finalizeSelection(room, selectedBriefcase);
  });

  // Action: No Deal (Reject 1st Pick, move to pick 2)
  socket.on('reject_deal', () => {
    const room = rooms[socket.roomId];
    if (!room || room.status !== 'drafting') return;

    const isHostTurn = room.currentTurn === 'host';
    if ((isHostTurn && socket.role !== 'host') || (!isHostTurn && socket.role !== 'guest')) {
      return socket.emit('error_message', 'ليس دورك الآن!');
    }

    if (room.turnState.status !== 'picked_1_pending_deal') return;

    room.turnState.status = 'waiting_pick_2';

    io.to(room.roomId).emit('deal_rejected', {
      rejectedIndex: room.turnState.pickedBriefcaseIndex,
      message: 'تم رفض الصفقة الأولى! يجب اختيار بطاقة أخرى وتأكيدها تلقائياً.',
      roomState: getPublicRoomState(room)
    });
  });

  // Helper Card Action (Steal Player)
  socket.on('use_steal_helper', ({ myPosToReplace, oppPosToSteal }) => {
    const room = rooms[socket.roomId];
    if (!room || room.status !== 'simulating') return;
    const playerObj = socket.role === 'host' ? room.host : room.guest;
    const oppObj = socket.role === 'host' ? room.guest : room.host;

    if (playerObj.helperCard && playerObj.helperCard.id === 'steal') {
      const temp = playerObj.squad[myPosToReplace];
      playerObj.squad[myPosToReplace] = oppObj.squad[oppPosToSteal];
      oppObj.squad[oppPosToSteal] = temp;
      playerObj.helperCard = null; // used!

      io.to(room.roomId).emit('helper_used', {
        userName: playerObj.name,
        helperName: 'سرقة لاعب 🥷',
        message: `قام ${playerObj.name} بتبادل ${myPosToReplace} بـ ${oppPosToSteal} الخاص بخصمه!`,
        roomState: getPublicRoomState(room)
      });
    }
  });

  // Restart / Rematch
  socket.on('restart_game', () => {
    const room = rooms[socket.roomId];
    if (!room) return;

    room.status = 'drafting';
    room.positionIndex = 0;
    room.currentTurn = 'host';
    room.host.squad = { GK: null, DEF: null, MID: null, ATT: null, MGR: null };
    room.host.helperCard = null;
    if (room.guest) {
      room.guest.squad = { GK: null, DEF: null, MID: null, ATT: null, MGR: null };
      room.guest.helperCard = null;
    }
    room.matchSimulation = null;

    initTurn(room);
    io.to(room.roomId).emit('room_updated', getPublicRoomState(room));
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const room = rooms[socket.roomId];
    if (room) {
      if (room.spectators) {
        room.spectators = room.spectators.filter(s => s.socketId !== socket.id);
      }
      io.to(room.roomId).emit('room_updated', getPublicRoomState(room));
    }
  });
});

function finalizeSelection(room, briefcase) {
  const isHostTurn = room.currentTurn === 'host';
  const activePlayerObj = isHostTurn ? room.host : room.guest;
  const positionKey = POSITIONS[room.positionIndex];

  // Assign chosen player/manager to squad
  activePlayerObj.squad[positionKey] = briefcase.item;

  // Check if player picked helper card
  if (briefcase.helperCard && !activePlayerObj.helperCard) {
    activePlayerObj.helperCard = briefcase.helperCard;
  }

  // Reveal all other briefcases with animation ("عرض ما فاته")
  room.turnState.briefcases.forEach(b => { b.isRevealed = true; });

  const chosenItem = briefcase.item;
  const acquiredHelper = briefcase.helperCard;

  // Broadcast deal finalized and unrevealed cards
  io.to(room.roomId).emit('deal_finalized', {
    playerName: activePlayerObj.name,
    chosenItem: chosenItem,
    helperCard: acquiredHelper,
    allBriefcases: room.turnState.briefcases,
    positionName: POSITION_NAMES_AR[positionKey],
    roomState: getPublicRoomState(room)
  });

  // Transition turn or position index after 3.5 seconds delay for reveal animation
  setTimeout(() => {
    if (room.currentTurn === 'host') {
      room.currentTurn = 'guest';
    } else {
      room.currentTurn = 'host';
      room.positionIndex++;
    }

    if (room.positionIndex >= POSITIONS.length) {
      // Draft finished -> Start Match Simulation!
      startMatchSimulation(room);
    } else {
      initTurn(room);
      io.to(room.roomId).emit('turn_changed', getPublicRoomState(room));
    }
  }, 3500);
}

function calculateTeamPower(squad, helperCard) {
  let totalRating = 0;
  totalRating += (squad.GK?.rating || 80);
  totalRating += (squad.DEF?.rating || 80);
  totalRating += (squad.MID?.rating || 80);
  totalRating += (squad.ATT?.rating || 80);
  totalRating += (squad.MGR?.rating || 80);

  let power = totalRating / 5;

  if (helperCard && helperCard.id === 'protection') {
    power += 3; // Protection boost
  }

  return power;
}

function startMatchSimulation(room) {
  room.status = 'simulating';

  const hostPower = calculateTeamPower(room.host.squad, room.host.helperCard);
  const guestPower = calculateTeamPower(room.guest.squad, room.guest.helperCard);

  // Generate realistic events over 10 real seconds (representing 90 mins match)
  const events = [];
  let hostGoals = 0;
  let guestGoals = 0;

  const totalMinEvents = 6;
  const attackChances = [12, 28, 41, 58, 74, 88];

  attackChances.forEach((minute) => {
    const rand = Math.random();
    const isHostAttacking = Math.random() * (hostPower + guestPower) < hostPower;
    const attackerObj = isHostAttacking ? room.host : room.guest;
    const defenderObj = isHostAttacking ? room.guest : room.host;
    const teamKey = isHostAttacking ? 'host' : 'guest';

    if (rand < 0.45) {
      // Goal!
      if (teamKey === 'host') hostGoals++; else guestGoals++;
      const scorer = attackerObj.squad.ATT.name;
      const assister = attackerObj.squad.MID.name;
      events.push({
        minute,
        type: 'GOAL',
        teamKey,
        teamName: attackerObj.name,
        text: `⚽ GOAL!!! تسديدة صاروخية من ${scorer} بعد تمريرة حاسمة من ${assister}!`,
        score: `${hostGoals} - ${guestGoals}`
      });
    } else if (rand < 0.75) {
      // Save by GK!
      const gk = defenderObj.squad.GK.name;
      events.push({
        minute,
        type: 'SAVE',
        teamKey,
        teamName: attackerObj.name,
        text: `🧤 تصدي خرافي! الحارس ${gk} ينقذ مرماه من هدف محقق من ${attackerObj.squad.ATT.name}!`,
        score: `${hostGoals} - ${guestGoals}`
      });
    } else {
      // Miss or Woodwork
      events.push({
        minute,
        type: 'MISS',
        teamKey,
        teamName: attackerObj.name,
        text: `💥 القائم ينوب عن الحارس! تسديدة قوية من ${attackerObj.squad.MID.name} ترتطم بالعارضة!`,
        score: `${hostGoals} - ${guestGoals}`
      });
    }
  });

  const hostPossession = Math.round((hostPower / (hostPower + guestPower)) * 100);

  room.matchSimulation = {
    status: 'simulating',
    currentTime: 0, // 0 to 90
    hostGoals,
    guestGoals,
    events,
    stats: {
      possession: [hostPossession, 100 - hostPossession],
      shots: [Math.floor(hostPower / 10), Math.floor(guestPower / 10)],
      shotsOnTarget: [hostGoals + 2, guestGoals + 2]
    }
  };

  io.to(room.roomId).emit('simulation_started', getPublicRoomState(room));

  // Ticker over 10 seconds (10 ticks, 1 sec each = 9 mins match per sec)
  let currentSec = 0;
  const simInterval = setInterval(() => {
    currentSec++;
    room.matchSimulation.currentTime = Math.min(currentSec * 9, 90);

    io.to(room.roomId).emit('simulation_tick', {
      currentTime: room.matchSimulation.currentTime,
      roomState: getPublicRoomState(room)
    });

    if (currentSec >= 10) {
      clearInterval(simInterval);
      room.matchSimulation.status = 'finished';
      room.status = 'finished';

      let winner = 'draw';
      if (hostGoals > guestGoals) winner = 'host';
      else if (guestGoals > hostGoals) winner = 'guest';

      io.to(room.roomId).emit('simulation_finished', {
        finalScore: `${hostGoals} - ${guestGoals}`,
        winner,
        roomState: getPublicRoomState(room)
      });
    }
  }, 1000);
}

function getPublicRoomState(room) {
  return {
    roomId: room.roomId,
    status: room.status,
    host: {
      socketId: room.host.socketId,
      name: room.host.name,
      squad: room.host.squad,
      helperCard: room.host.helperCard
    },
    guest: room.guest ? {
      socketId: room.guest.socketId,
      name: room.guest.name,
      squad: room.guest.squad,
      helperCard: room.guest.helperCard
    } : null,
    spectatorsCount: room.spectators ? room.spectators.length : 0,
    currentTurn: room.currentTurn,
    positionIndex: room.positionIndex,
    turnState: {
      positionKey: room.turnState.positionKey,
      positionNameAr: room.turnState.positionNameAr,
      pickedBriefcaseIndex: room.turnState.pickedBriefcaseIndex,
      pickNumber: room.turnState.pickNumber,
      status: room.turnState.status,
      // Hide unrevealed contents from payload until revealed!
      briefcases: room.turnState.briefcases ? room.turnState.briefcases.map(b => ({
        cardId: b.cardId,
        isRevealed: b.isRevealed,
        item: b.isRevealed ? b.item : null,
        helperCard: b.isRevealed ? b.helperCard : null
      })) : []
    },
    matchSimulation: room.matchSimulation
  };
}

function startServer(portToUse) {
  server.listen(portToUse, () => {
    console.log(`\n=================================================`);
    console.log(` ⚽ Deal Or No Deal Football Server is Running!`);
    console.log(` 👉 Open in browser: http://localhost:${portToUse}`);
    console.log(`=================================================\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${portToUse} is in use, trying port ${portToUse + 1}...`);
      startServer(portToUse + 1);
    } else {
      console.error(err);
    }
  });
}

if (!process.env.VERCEL) {
  startServer(defaultPort);
}

module.exports = app;
