// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('📱 PWA Service Worker Registered!');
  }).catch(err => console.log('SW Registration error:', err));
}

document.addEventListener('DOMContentLoaded', () => {

  // State
  let myRole = 'spectator';
  let myPlayerName = 'لاعب';
  let roomState = null;
  let currentRoomId = null;
  let turnTimerInterval = null;
  let turnTimerSeconds = 15;
  let lastProcessedEmojiTimestamp = 0;
  let lastProcessedNotificationId = null;
  let hasReceivedFirstState = false;

  // Haptic Feedback for Mobile
  function triggerHaptic(pattern = [30, 50, 30]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // DOM Elements
  const viewLobby = document.getElementById('view-lobby');
  const viewDraft = document.getElementById('view-draft');
  const viewLineup = document.getElementById('view-lineup');
  const viewMatch = document.getElementById('view-match');

  const lineupHostName = document.getElementById('lineup-host-name');
  const lineupGuestName = document.getElementById('lineup-guest-name');
  const lineupHostList = document.getElementById('lineup-host-list');
  const lineupGuestList = document.getElementById('lineup-guest-list');
  const btnStartSimulation = document.getElementById('btn-start-simulation');
  const stealActionBox = document.getElementById('steal-action-box');
  const btnTriggerSteal = document.getElementById('btn-trigger-steal');
  const stealConfirmOverlay = document.getElementById('steal-confirm-overlay');
  const stealConfirmText = document.getElementById('steal-confirm-text');
  const btnStealConfirmYes = document.getElementById('btn-steal-confirm-yes');
  const btnStealConfirmDifferent = document.getElementById('btn-steal-confirm-different');
  const btnStealConfirmCancel = document.getElementById('btn-steal-confirm-cancel');

  const roomInfoBar = document.getElementById('room-info-bar');
  const displayRoomId = document.getElementById('display-room-id');
  const userRoleBadge = document.getElementById('user-role-badge');
  const spectatorsCount = document.getElementById('spectators-count');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const notificationBanner = document.getElementById('notification-banner');
  const spectatorBanner = document.getElementById('spectator-banner');

  // Timer & Emoji Elements
  const turnTimerRing = document.getElementById('turn-timer-ring');
  const turnTimerNum = document.getElementById('turn-timer-num');
  const timerCircleProgress = document.getElementById('timer-circle-progress');
  const emojiFloatingContainer = document.getElementById('emoji-floating-container');
  const emojiBtns = document.querySelectorAll('.emoji-btn');

  // Lobby Inputs
  const playerNameInput = document.getElementById('player-name-input');
  const createRoomIdInput = document.getElementById('create-room-id');
  const joinRoomIdInput = document.getElementById('join-room-id');
  const btnCreateRoom = document.getElementById('btn-create-room');
  const btnJoinRoom = document.getElementById('btn-join-room');

  // Draft Elements
  const currentPositionTitle = document.getElementById('current-position-title');
  const currentTurnDesc = document.getElementById('current-turn-desc');
  const hostNameTag = document.getElementById('host-name-tag');
  const guestNameTag = document.getElementById('guest-name-tag');
  const briefcasesContainer = document.getElementById('briefcases-container');
  const decisionPanel = document.getElementById('decision-panel');
  const pickedCardPreview = document.getElementById('picked-card-preview');
  const btnDeal = document.getElementById('btn-deal');
  const btnNoDeal = document.getElementById('btn-no-deal');
  const missedCardsReveal = document.getElementById('missed-cards-reveal');
  const missedCardsGrid = document.getElementById('missed-cards-grid');

  const hostSquadName = document.getElementById('host-squad-name');
  const hostHelperBadge = document.getElementById('host-helper-badge');
  const hostSquadList = document.getElementById('host-squad-list');
  const guestSquadName = document.getElementById('guest-squad-name');
  const guestHelperBadge = document.getElementById('guest-helper-badge');
  const guestSquadList = document.getElementById('guest-squad-list');

  // Match Simulation Elements
  const simHostName = document.getElementById('sim-host-name');
  const simGuestName = document.getElementById('sim-guest-name');
  const simHostScore = document.getElementById('sim-host-score');
  const simGuestScore = document.getElementById('sim-guest-score');
  const simTimer = document.getElementById('sim-timer');
  const commentaryFeed = document.getElementById('commentary-feed');
  const matchResultsOverlay = document.getElementById('match-results-overlay');
  const winnerAnnouncement = document.getElementById('winner-announcement');
  const finalScoreText = document.getElementById('final-score-text');
  const statHostPos = document.getElementById('stat-host-pos');
  const statGuestPos = document.getElementById('stat-guest-pos');
  const statHostShots = document.getElementById('stat-host-shots');
  const statGuestShots = document.getElementById('stat-guest-shots');
  const statHostOntarget = document.getElementById('stat-host-ontarget');
  const statGuestOntarget = document.getElementById('stat-guest-ontarget');
  const btnRematch = document.getElementById('btn-rematch');

  // VIEW SWITCHER
  function showView(viewId) {
    [viewLobby, viewDraft, viewLineup, viewMatch].forEach(view => {
      if (view.id === viewId) {
        view.classList.remove('hidden');
        view.classList.add('active');
      } else {
        view.classList.add('hidden');
        view.classList.remove('active');
      }
    });
  }

  function showNotification(msg, duration = 4000) {
    notificationBanner.textContent = msg;
    notificationBanner.classList.remove('hidden');
    setTimeout(() => {
      notificationBanner.classList.add('hidden');
    }, duration);
  }

  // LOBBY EVENT LISTENERS
  btnCreateRoom.addEventListener('click', () => {
    const nameVal = playerNameInput.value.trim();
    if (!nameVal || nameVal.length < 3) {
      alert('⚠️ يرجى كتابة اسمك في اللعبة أولاً (3 حروف على الأقل)!');
      playerNameInput.focus();
      return;
    }
    myPlayerName = nameVal;
    const roomId = createRoomIdInput.value.trim();
    window.soundFX.playClick();

    FirebaseEngine.enterRoom(roomId, myPlayerName)
      .then(finalId => {
        currentRoomId = finalId;
        showNotification(`تم الدخول للغرفة بنجاح! كود الغرفة: ${finalId}`);
        FirebaseEngine.listenToRoom(finalId, handleRoomStateUpdate);
      })
      .catch(err => {
        console.error('Firebase Room Error:', err);
        alert('حدث خطأ أثناء الاتصال بسيرفر الغرف! يرجى المحاولة مرة أخرى.');
      });
  });

  btnJoinRoom.addEventListener('click', () => {
    const nameVal = playerNameInput.value.trim();
    if (!nameVal || nameVal.length < 3) {
      alert('⚠️ يرجى كتابة اسمك في اللعبة أولاً (3 حروف على الأقل)!');
      playerNameInput.focus();
      return;
    }
    myPlayerName = nameVal;
    const roomId = joinRoomIdInput.value.trim();
    if (!roomId) {
      alert('يرجى إدخال كود الغرفة!');
      return;
    }
    window.soundFX.playClick();

    FirebaseEngine.enterRoom(roomId, myPlayerName)
      .then(finalId => {
        currentRoomId = finalId;
        showNotification(`تم الدخول للغرفة بنجاح! كود الغرفة: ${finalId}`);
        FirebaseEngine.listenToRoom(finalId, handleRoomStateUpdate);
      })
      .catch(err => {
        console.error('Firebase Room Error:', err);
        alert('حدث خطأ أثناء الاتصال بسيرفر الغرف! يرجى المحاولة مرة أخرى.');
      });
  });

  btnCopyCode.addEventListener('click', () => {
    if (roomState && roomState.roomId) {
      navigator.clipboard.writeText(roomState.roomId);
      showNotification(`تم نسخ كود الغرفة: ${roomState.roomId}`);
    }
  });

  const btnWhatsappShare = document.getElementById('btn-whatsapp-share');
  if (btnWhatsappShare) {
    btnWhatsappShare.addEventListener('click', () => {
      if (roomState && roomState.roomId) {
        const text = encodeURIComponent(`🎮 تحديتك في لعبة Deal or No Deal Football Draft! أدخل الكود [${roomState.roomId}] والعب معي الآن أونلاين عبر الرابط: ${window.location.origin}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    });
  }

  btnSoundToggle.addEventListener('click', () => {
    const isMuted = window.soundFX.toggleMute();
    btnSoundToggle.textContent = isMuted ? '🔇' : '🔊';
    showNotification(isMuted ? 'تم كتم الصوت 🔇' : 'تم تشغيل الصوت 🔊');
  });

  emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      triggerHaptic([20, 30]);
      if (currentRoomId) {
        FirebaseEngine.sendEmoji(currentRoomId, emoji);
      }
    });
  });

  function renderFloatingEmoji(symbol) {
    const el = document.createElement('div');
    el.className = 'floating-emoji-item';
    el.textContent = symbol;
    el.style.left = `${15 + Math.random() * 70}%`;
    emojiFloatingContainer.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // DRAFT ACTION LISTENERS
  btnDeal.addEventListener('click', () => {
    triggerHaptic([40, 60, 40]);
    window.soundFX.playDeal();
    FirebaseEngine.confirmDeal(currentRoomId, roomState);
  });

  btnNoDeal.addEventListener('click', () => {
    triggerHaptic([30, 40]);
    window.soundFX.playClick();
    FirebaseEngine.rejectDeal(currentRoomId, roomState);
  });

  btnStartSimulation.addEventListener('click', () => {
    triggerHaptic([30, 40]);
    window.soundFX.playClick();
    FirebaseEngine.confirmLineupReady(currentRoomId, roomState);
  });

  btnRematch.addEventListener('click', () => {
    triggerHaptic([30, 40]);
    window.soundFX.playClick();
    matchResultsOverlay.classList.add('hidden');
    FirebaseEngine.restartGame(currentRoomId);
  });

  // REALTIME FIREBASE STATE LISTENER

  function handleRoomStateUpdate(updatedState) {
    roomState = updatedState;
    if (!roomState) return;

    // Determine myRole dynamically with 100% precision from Firebase Player IDs
    if (roomState.host && roomState.host.id === FirebaseEngine.myPlayerId) {
      myRole = 'host';
    } else if (roomState.guest && roomState.guest.id === FirebaseEngine.myPlayerId) {
      myRole = 'guest';
    } else {
      myRole = 'spectator';
    }

    if (!hasReceivedFirstState) {
      // Don't replay old emoji/notifications on first load or reconnect
      hasReceivedFirstState = true;
      if (roomState.lastEmoji) lastProcessedEmojiTimestamp = roomState.lastEmoji.timestamp;
      if (roomState.lastNotification) lastProcessedNotificationId = roomState.lastNotification.id;
    } else {
      if (roomState.lastEmoji && roomState.lastEmoji.timestamp > lastProcessedEmojiTimestamp) {
        lastProcessedEmojiTimestamp = roomState.lastEmoji.timestamp;
        renderFloatingEmoji(roomState.lastEmoji.symbol);
      }
      if (roomState.lastNotification && roomState.lastNotification.id !== lastProcessedNotificationId) {
        lastProcessedNotificationId = roomState.lastNotification.id;
        showNotification(roomState.lastNotification.text, 5000);
      }
    }

    updateRoomUI();
  }

  // UI RENDER FUNCTIONS

  function updateRoomUI() {
    if (!roomState) return;

    // Header info bar
    roomInfoBar.classList.remove('hidden');
    displayRoomId.textContent = roomState.roomId;
    spectatorsCount.textContent = `👁️ ${roomState.spectatorsCount || 0}`;

    // Role pill badge
    if (myRole === 'host') {
      userRoleBadge.textContent = 'المستضيف 👑';
      userRoleBadge.style.background = 'var(--neon-blue)';
      spectatorBanner.classList.add('hidden');
    } else if (myRole === 'guest') {
      userRoleBadge.textContent = 'الضيف ⚽';
      userRoleBadge.style.background = 'var(--neon-green)';
      spectatorBanner.classList.add('hidden');
    } else {
      userRoleBadge.textContent = 'مراقب 👁️';
      userRoleBadge.style.background = 'var(--gold-primary)';
      spectatorBanner.classList.remove('hidden');
    }

    if (roomState.status === 'drafting') {
      showView('view-draft');
      renderDraftView();
      renderSquads();
    } else if (roomState.status === 'lineup') {
      showView('view-lineup');
      renderLineupView();
    } else if (roomState.status === 'simulating' || roomState.status === 'finished') {
      showView('view-match');
      renderMatchView();
    }
  }

  function renderLineupView() {
    lineupHostName.textContent = roomState.host.name;
    lineupGuestName.textContent = roomState.guest ? roomState.guest.name : 'الضيف';
    renderSquadList(lineupHostList, roomState.host.squad);
    renderSquadList(lineupGuestList, roomState.guest ? roomState.guest.squad : null);
    renderStealBox();
  }

  function renderDraftView() {
    const isHostTurn = roomState.currentTurn === 'host';
    const activePlayerName = isHostTurn ? roomState.host.name : (roomState.guest ? roomState.guest.name : 'الضيف');

    currentPositionTitle.textContent = roomState.turnState.positionNameAr || 'حارس المرمى';

    hostNameTag.textContent = roomState.host.name;
    guestNameTag.textContent = roomState.guest ? roomState.guest.name : 'في الانتظار...';

    if (isHostTurn) {
      hostNameTag.classList.add('active-turn');
      guestNameTag.classList.remove('active-turn');
      document.querySelector('.host-squad')?.classList.add('active-turn-box');
      document.querySelector('.guest-squad')?.classList.remove('active-turn-box');
    } else {
      guestNameTag.classList.add('active-turn');
      hostNameTag.classList.remove('active-turn');
      document.querySelector('.guest-squad')?.classList.add('active-turn-box');
      document.querySelector('.host-squad')?.classList.remove('active-turn-box');
    }

    // Turn description
    const isMyTurn = (myRole === 'host' && isHostTurn) || (myRole === 'guest' && !isHostTurn);
    const posName = roomState.turnState.positionNameAr || 'اللاعبين';

    if (isMyTurn) {
      const attemptLabel = roomState.turnState.pickNumber === 2 ? 'المحاولة الثالثة - فرصة إضافية 🎲'
        : roomState.turnState.pickNumber === 1 ? 'المحاولة الثانية - إجبارية'
        : 'المحاولة الأولى';
      currentTurnDesc.textContent = `🎯 دورك الآن لاختيار ${posName}! (${attemptLabel})`;
      currentTurnDesc.style.color = 'var(--neon-green)';
    } else if (myRole === 'spectator') {
      currentTurnDesc.textContent = `👁️ بث مباشر: متابعة اختيار ${posName} بواسطة اللاعب (${activePlayerName})...`;
      currentTurnDesc.style.color = 'var(--gold-primary)';
    } else {
      currentTurnDesc.textContent = `⏳ دور الخصم (${activePlayerName}) اختيار ${posName}... ستتحول لك الدورة فوراً عند انتهائه!`;
      currentTurnDesc.style.color = 'var(--neon-blue)';
    }

    // Briefcases Rendering
    briefcasesContainer.innerHTML = '';
    const briefcases = roomState.turnState.briefcases || [];

    // Add lock waiting notice if not my turn
    let waitingNotice = document.getElementById('waiting-turn-notice');
    if (!waitingNotice) {
      waitingNotice = document.createElement('div');
      waitingNotice.id = 'waiting-turn-notice';
      waitingNotice.className = 'waiting-notice hidden';
      briefcasesContainer.parentNode.insertBefore(waitingNotice, briefcasesContainer);
    }

    if (myRole === 'host' && !roomState.guest) {
      waitingNotice.classList.remove('hidden');
      waitingNotice.innerHTML = `👑 <strong>أنت المستضيف!</strong> كود الغرفة الخاص بك هو [<strong>${roomState.roomId}</strong>]. افتح نافذة جديدة واضغط <strong>"الانضمام كـ ضيف ⚽"</strong> وأدخل الكود [<strong>${roomState.roomId}</strong>] لتبدأ اللعبة بينكما فوراً!`;
    } else if (!isMyTurn && myRole !== 'spectator') {
      waitingNotice.classList.remove('hidden');
      waitingNotice.innerHTML = `👁️ <strong>متابعة سريعة (دور الخصم):</strong> اللاعب (<strong>${activePlayerName}</strong>) يختار الآن <strong>${posName}</strong>... ستنقل لك الدورة والاختيارات فور انتهائه!`;
    } else if (myRole === 'spectator') {
      waitingNotice.classList.remove('hidden');
      waitingNotice.innerHTML = `👁️ <strong>بث مباشر (مراقب):</strong> اللاعب (<strong>${activePlayerName}</strong>) يحدد اختيار <strong>${posName}</strong> حالياً...`;
    } else {
      waitingNotice.classList.add('hidden');
    }

    const myHelper = myRole === 'host' ? roomState.host?.helperCard : (myRole === 'guest' ? roomState.guest?.helperCard : null);
    const isForcedPickerTurn = !isMyTurn && myRole !== 'spectator' && myHelper?.id === 'force_pick'
      && roomState.turnState.status === 'waiting_pick_1' && roomState.turnState.forcedIndex == null;

    briefcases.forEach((b, index) => {
      const bCard = document.createElement('div');
      bCard.className = `briefcase-card ${b.isRevealed ? 'revealed' : ''} ${!isMyTurn ? 'disabled-turn' : ''}`;

      if (!b.isRevealed) {
        bCard.innerHTML = `
          <div class="mystery-card-wrapper">
            <div class="mystery-badge">SPECIAL CARD</div>
            <div class="mystery-qmark">?</div>
            <div class="briefcase-num">بطاقة غامضة #${index + 1}</div>
          </div>
        `;

        const pendingDeal = roomState.turnState.status === 'picked_1_pending_deal' || roomState.turnState.status === 'picked_2_pending_deal';
        const forcedIndex = roomState.turnState.forcedIndex;
        const isForcedOut = forcedIndex != null && index !== forcedIndex;

        if (isForcedPickerTurn) {
          bCard.style.cursor = 'pointer';
          bCard.classList.add('steal-selectable');
          bCard.onclick = () => {
            window.soundFX.playClick();
            showNotification('🎯 تم إجبار الخصم على فتح الحقيبة دي!');
            FirebaseEngine.setForcedPick(currentRoomId, roomState, index);
          };
        } else if (isMyTurn && !pendingDeal && !isForcedOut) {
          bCard.style.cursor = 'pointer';
          bCard.onclick = () => {
            window.soundFX.playClick();
            FirebaseEngine.pickBriefcase(currentRoomId, index, roomState);
          };
        } else {
          bCard.style.cursor = 'not-allowed';
          bCard.onclick = null;
        }
      } else {
        // Revealed FIFA Card item
        const item = b.item;
        const rarityPct = FirebaseEngine.getRarityPct(item, roomState.turnState.positionKey);
        bCard.innerHTML = `
          ${b.helperCard ? `<div class="helper-tag">${b.helperCard.name}</div>` : ''}
          <div class="fifa-card ${FirebaseEngine.isIconLegend(item.name) ? 'icon-legend' : ''}">
            <div class="fifa-rating">${item.rating}</div>
            <div class="fifa-name">${item.name}</div>
            <div class="fifa-meta">${item.club} | ${item.nation}</div>
            <div class="fifa-rarity">⭐ ندرة تقريبية: ${rarityPct}%</div>
          </div>
        `;
      }

      briefcasesContainer.appendChild(bCard);
    });

    // Decision Panel (Deal / No Deal)
    if (isMyTurn && (roomState.turnState.status === 'picked_1_pending_deal' || roomState.turnState.status === 'picked_2_pending_deal')) {
      decisionPanel.classList.remove('hidden');
      const pickedB = briefcases[roomState.turnState.pickedBriefcaseIndex];
      if (pickedB && pickedB.item) {
        pickedCardPreview.innerHTML = `
          <div class="fifa-card inline">
            <span class="fifa-rating">${pickedB.item.rating}</span> - 
            <span class="fifa-name">${pickedB.item.name}</span> (${pickedB.item.club})
            ${pickedB.helperCard ? `<div class="helper-tag inline">${pickedB.helperCard.name}</div>` : ''}
          </div>
        `;
      }
    } else {
      decisionPanel.classList.add('hidden');
    }
  }

  function helperBadgeText(playerObj) {
    return playerObj.helperCard ? playerObj.helperCard.name : 'بدون مساعدة';
  }

  function renderSquads() {
    // Host Squad
    hostSquadName.textContent = roomState.host.name;
    hostHelperBadge.textContent = helperBadgeText(roomState.host, 'host');
    hostHelperBadge.style.background = roomState.host.helperCard ? 'var(--neon-red)' : '';

    renderSquadList(hostSquadList, roomState.host.squad, 'host');

    // Guest Squad
    if (roomState.guest) {
      guestSquadName.textContent = roomState.guest.name;
      guestHelperBadge.textContent = helperBadgeText(roomState.guest, 'guest');
      guestHelperBadge.style.background = roomState.guest.helperCard ? 'var(--neon-red)' : '';
      renderSquadList(guestSquadList, roomState.guest.squad, 'guest');
    } else {
      guestSquadName.textContent = 'الضيف';
      guestSquadList.innerHTML = '<div class="squad-slot"><span class="slot-pos">في انتظار انضمام الضيف...</span></div>';
    }
  }

  function renderSquadList(container, squad, ownerRole) {
    container.innerHTML = '';
    const posKeys = ['GK', 'DEF', 'MID', 'ATT', 'MGR'];
    const posNames = { GK: 'حارس', DEF: 'مدافع', MID: 'وسط', ATT: 'مهاجم', MGR: 'مدرب' };

    posKeys.forEach((key) => {
      const slot = document.createElement('div');
      const item = squad ? squad[key] : null;

      if (item) {
        slot.className = 'squad-slot filled';
        slot.innerHTML = `
          <span class="slot-pos">${posNames[key]}</span>
          <span class="slot-player">${item.name}</span>
          <span class="slot-rating">${item.rating}</span>
        `;

        const isMyPickStep = stealStep === 'pick_mine' && ownerRole === myRole;
        const isOppPickStep = stealStep === 'pick_theirs' && ownerRole === opponentRole();
        if (isMyPickStep || isOppPickStep) {
          slot.classList.add('steal-selectable');
          slot.onclick = () => {
            if (isMyPickStep) {
              stealMyPos = key;
              stealStep = 'pick_theirs';
              renderStealBox();
              renderSquads();
              if (typeof renderLineupView === 'function' && roomState.status === 'lineup') renderLineupView();
            } else {
              openStealConfirm(key, item);
            }
          };
        }
      } else {
        slot.className = 'squad-slot';
        slot.innerHTML = `
          <span class="slot-pos">${posNames[key]}</span>
          <span class="slot-player" style="color:var(--text-muted);">---</span>
          <span class="slot-rating">-</span>
        `;
      }
      container.appendChild(slot);
    });
  }

  // STEAL CARD FLOW
  let stealStep = 'idle'; // idle | pick_mine | pick_theirs
  let stealMyPos = null;

  function opponentRole() {
    if (myRole === 'host') return 'guest';
    if (myRole === 'guest') return 'host';
    return null;
  }

  function myHelperCard() {
    if (myRole === 'host') return roomState?.host?.helperCard;
    if (myRole === 'guest') return roomState?.guest?.helperCard;
    return null;
  }

  function renderStealBox() {
    const hasSteal = myHelperCard()?.id === 'steal';
    const canSteal = hasSteal && roomState && roomState.status === 'lineup' && roomState.guest;
    stealActionBox.classList.toggle('hidden', !canSteal);
    if (!canSteal && stealStep !== 'idle') {
      stealStep = 'idle';
      stealMyPos = null;
    }
  }

  btnTriggerSteal.addEventListener('click', () => {
    stealStep = 'pick_mine';
    stealMyPos = null;
    showNotification('🥷 اضغط على لاعب من تشكيلتك عايز تبدله');
    renderSquads();
    if (roomState.status === 'lineup') renderLineupView();
  });

  function openStealConfirm(oppPos, oppItem) {
    const myItem = roomState[myRole].squad[stealMyPos];
    stealConfirmText.textContent = `عايز تبدل لاعب ${myItem.name} بـ ${oppItem.name}؟`;
    stealConfirmOverlay.dataset.oppPos = oppPos;
    stealConfirmOverlay.classList.remove('hidden');
  }

  btnStealConfirmYes.addEventListener('click', () => {
    const oppPos = stealConfirmOverlay.dataset.oppPos;
    FirebaseEngine.requestSteal(currentRoomId, roomState, stealMyPos, oppPos);
    stealConfirmOverlay.classList.add('hidden');
    stealStep = 'idle';
    stealMyPos = null;
  });

  btnStealConfirmDifferent.addEventListener('click', () => {
    stealConfirmOverlay.classList.add('hidden');
    // stealStep stays 'pick_theirs', stealMyPos unchanged — pick a different opponent player
  });

  btnStealConfirmCancel.addEventListener('click', () => {
    stealConfirmOverlay.classList.add('hidden');
    stealStep = 'idle';
    stealMyPos = null;
    renderSquads();
    if (roomState && roomState.status === 'lineup') renderLineupView();
  });

  function renderMatchView() {
    simHostName.textContent = roomState.host.name;
    simGuestName.textContent = roomState.guest ? roomState.guest.name : 'الضيف';

    if (roomState.matchSimulation) {
      simHostScore.textContent = roomState.matchSimulation.hostGoals;
      simGuestScore.textContent = roomState.matchSimulation.guestGoals;
      simTimer.textContent = `${roomState.matchSimulation.currentTime || 0}'`;

      renderCommentaryFeed(roomState.matchSimulation.events, roomState.matchSimulation.currentTime || 0);

      if (roomState.status === 'finished') {
        setTimeout(() => {
          matchResultsOverlay.classList.remove('hidden');

          const sim = roomState.matchSimulation;
          finalScoreText.textContent = `${sim.hostGoals} - ${sim.guestGoals}`;

          if (sim.mvpPlayer) {
            const mvpElem = document.getElementById('mvp-player-name');
            if (mvpElem) {
              mvpElem.textContent = `${sim.mvpPlayer.name} (${sim.mvpPlayer.rating || 90})`;
            }
          }

          if (roomState.winner === 'host') {
            winnerAnnouncement.textContent = `👑 فاز ${roomState.host.name} بالمباراة!`;
          } else if (roomState.winner === 'guest') {
            winnerAnnouncement.textContent = `⚽ فاز ${roomState.guest ? roomState.guest.name : 'الضيف'} بالمباراة!`;
          } else {
            winnerAnnouncement.textContent = `🤝 تعادل حماسي بين الطرفين!`;
          }

          statHostPos.textContent = `${sim.stats.possession[0]}%`;
          statGuestPos.textContent = `${sim.stats.possession[1]}%`;
          statHostShots.textContent = sim.stats.shots[0];
          statGuestShots.textContent = sim.stats.shots[1];
          statHostOntarget.textContent = sim.stats.shotsOnTarget[0];
          statGuestOntarget.textContent = sim.stats.shotsOnTarget[1];
        }, 1000);
      }
    }
  }

  function renderCommentaryFeed(events, currentMinute) {
    commentaryFeed.innerHTML = '';
    
    const initEvt = document.createElement('div');
    initEvt.className = 'feed-event init';
    initEvt.innerHTML = `<span class="time">00'</span><span class="text">🎙️ البداية! صافرة حكم المباراة انطلقت والكرة في الملعب!</span>`;
    commentaryFeed.appendChild(initEvt);

    let lastGoalCount = 0;

    events.forEach(evt => {
      if (evt.minute <= currentMinute) {
        const div = document.createElement('div');
        div.className = `feed-event ${evt.type.toLowerCase()}`;
        div.innerHTML = `
          <span class="time">${evt.minute}'</span>
          <span class="text">${evt.text}</span>
        `;
        commentaryFeed.appendChild(div);

        if (evt.type === 'GOAL' && evt.minute === currentMinute) {
          window.soundFX?.playCheer();
        }
      }
    });

    commentaryFeed.scrollTop = commentaryFeed.scrollHeight;
  }

});
