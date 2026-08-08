document.addEventListener('DOMContentLoaded', () => {

  // State
  let myRole = 'spectator';
  let myPlayerName = 'لاعب';
  let roomState = null;
  let currentRoomId = null;
  let lastProcessedNotificationId = null;
  let hasReceivedFirstState = false;

  const POSITION_NAMES_AR = AuctionEngine.getPositionNames();
  const POSITIONS = AuctionEngine.getPositions();
  const SQUAD_MODES = AuctionEngine.getSquadModes();

  function fmtMoney(n) {
    return (n || 0).toLocaleString('en-US');
  }

  // DOM Elements
  const viewLobby = document.getElementById('view-lobby');
  const viewAuction = document.getElementById('view-auction');
  const viewFinal = document.getElementById('view-final');

  const roomInfoBar = document.getElementById('room-info-bar');
  const displayRoomId = document.getElementById('display-room-id');
  const userRoleBadge = document.getElementById('user-role-badge');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const notificationBanner = document.getElementById('notification-banner');

  const playerNameInput = document.getElementById('player-name-input');
  const createRoomIdInput = document.getElementById('create-room-id');
  const joinRoomIdInput = document.getElementById('join-room-id');
  const btnCreateRoom = document.getElementById('btn-create-room');
  const btnJoinRoom = document.getElementById('btn-join-room');

  const auctionHostName = document.getElementById('auction-host-name');
  const auctionGuestName = document.getElementById('auction-guest-name');
  const auctionHostBudget = document.getElementById('auction-host-budget');
  const auctionGuestBudget = document.getElementById('auction-guest-budget');
  const auctionPositionLabel = document.getElementById('auction-position-label');

  const biddingPanel = document.getElementById('auction-bidding-panel');
  const candidateCard = document.getElementById('auction-candidate-card');
  const bidCurrentAmount = document.getElementById('bid-current-amount');
  const bidTurnIndicator = document.getElementById('bid-turn-indicator');
  const bidControls = document.getElementById('bid-controls');
  const btnPassBid = document.getElementById('btn-pass-bid');

  const uncontestedPanel = document.getElementById('auction-uncontested-panel');
  const uncontestedCandidateCard = document.getElementById('uncontested-candidate-card');
  const uncontestedText = document.getElementById('uncontested-text');

  const resultPanel = document.getElementById('auction-result-panel');
  const resultTitle = document.getElementById('result-title');
  const resultCandidateCard = document.getElementById('result-candidate-card');
  const resultBonusCard = document.getElementById('result-bonus-card');
  const resultConsolationCard = document.getElementById('result-consolation-card');

  const miniHostTitle = document.getElementById('mini-host-title');
  const miniGuestTitle = document.getElementById('mini-guest-title');
  const miniHostSquad = document.getElementById('mini-host-squad');
  const miniGuestSquad = document.getElementById('mini-guest-squad');

  const finalHostName = document.getElementById('final-host-name');
  const finalGuestName = document.getElementById('final-guest-name');
  const finalHostBudget = document.getElementById('final-host-budget');
  const finalGuestBudget = document.getElementById('final-guest-budget');
  const finalHostSquad = document.getElementById('final-host-squad');
  const finalGuestSquad = document.getElementById('final-guest-squad');
  const btnRestartAuction = document.getElementById('btn-restart-auction');

  function showView(viewId) {
    [viewLobby, viewAuction, viewFinal].forEach(view => {
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
    setTimeout(() => notificationBanner.classList.add('hidden'), duration);
  }

  // LOBBY
  btnCreateRoom.addEventListener('click', () => {
    const nameVal = playerNameInput.value.trim();
    if (!nameVal || nameVal.length < 3) {
      alert('⚠️ يرجى كتابة اسمك أولاً (3 حروف على الأقل)!');
      playerNameInput.focus();
      return;
    }
    myPlayerName = nameVal;
    const mode = document.querySelector('input[name="squadMode"]:checked').value;
    const roomId = createRoomIdInput.value.trim();
    window.soundFX.playClick();

    AuctionEngine.enterRoom(roomId, myPlayerName, mode)
      .then(finalId => {
        currentRoomId = finalId;
        showNotification(`تم إنشاء المزاد! كود الغرفة: ${finalId}`);
        AuctionEngine.listenToRoom(finalId, handleRoomStateUpdate);
      })
      .catch(err => {
        console.error('Firebase Room Error:', err);
        alert('حدث خطأ أثناء الاتصال! حاول مرة أخرى.');
      });
  });

  btnJoinRoom.addEventListener('click', () => {
    const nameVal = playerNameInput.value.trim();
    if (!nameVal || nameVal.length < 3) {
      alert('⚠️ يرجى كتابة اسمك أولاً (3 حروف على الأقل)!');
      playerNameInput.focus();
      return;
    }
    myPlayerName = nameVal;
    const roomId = joinRoomIdInput.value.trim();
    if (!roomId) { alert('يرجى إدخال كود الغرفة!'); return; }
    window.soundFX.playClick();

    AuctionEngine.enterRoom(roomId, myPlayerName)
      .then(finalId => {
        currentRoomId = finalId;
        showNotification(`تم الدخول للمزاد! كود الغرفة: ${finalId}`);
        AuctionEngine.listenToRoom(finalId, handleRoomStateUpdate);
      })
      .catch(err => {
        console.error('Firebase Room Error:', err);
        alert('حدث خطأ أثناء الاتصال! حاول مرة أخرى.');
      });
  });

  btnCopyCode.addEventListener('click', () => {
    if (roomState && roomState.roomId) {
      navigator.clipboard.writeText(roomState.roomId);
      showNotification(`تم نسخ كود الغرفة: ${roomState.roomId}`);
    }
  });

  btnPassBid.addEventListener('click', () => {
    window.soundFX.playClick();
    AuctionEngine.passBid(currentRoomId, roomState);
  });

  btnRestartAuction.addEventListener('click', () => {
    window.soundFX.playClick();
    AuctionEngine.restartGame(currentRoomId, roomState.squadMode);
  });

  // REALTIME STATE
  function handleRoomStateUpdate(updatedState) {
    roomState = updatedState;
    if (!roomState) return;

    if (roomState.host && roomState.host.id === AuctionEngine.myPlayerId) {
      myRole = 'host';
    } else if (roomState.guest && roomState.guest.id === AuctionEngine.myPlayerId) {
      myRole = 'guest';
    } else {
      myRole = 'spectator';
    }

    if (!hasReceivedFirstState) {
      hasReceivedFirstState = true;
      if (roomState.lastNotification) lastProcessedNotificationId = roomState.lastNotification.id;
    } else if (roomState.lastNotification && roomState.lastNotification.id !== lastProcessedNotificationId) {
      lastProcessedNotificationId = roomState.lastNotification.id;
      showNotification(roomState.lastNotification.text, 4500);
    }

    updateRoomUI();
  }

  function updateRoomUI() {
    if (!roomState) return;

    roomInfoBar.classList.remove('hidden');
    displayRoomId.textContent = roomState.roomId;

    if (myRole === 'host') {
      userRoleBadge.textContent = 'المستضيف 👑';
      userRoleBadge.style.background = 'var(--neon-blue)';
    } else if (myRole === 'guest') {
      userRoleBadge.textContent = 'الضيف ⚽';
      userRoleBadge.style.background = 'var(--neon-green)';
    } else {
      userRoleBadge.textContent = 'مراقب 👁️';
      userRoleBadge.style.background = 'var(--gold-primary)';
    }

    if (roomState.status === 'finished') {
      showView('view-final');
      renderFinalView();
    } else {
      showView('view-auction');
      renderAuctionView();
    }
  }

  function fifaCardHTML(player, small) {
    if (!player) return '<div class="auction-fifa-card-empty">—</div>';
    return `
      <div class="fifa-rating">${player.rating}</div>
      <div class="fifa-name">${player.name}</div>
      <div class="fifa-meta">${player.club} | ${player.nation}</div>
    `;
  }

  function renderAuctionView() {
    auctionHostName.textContent = roomState.host.name;
    auctionHostBudget.textContent = fmtMoney(roomState.host.remainingBudget);
    if (roomState.guest) {
      auctionGuestName.textContent = roomState.guest.name;
      auctionGuestBudget.textContent = fmtMoney(roomState.guest.remainingBudget);
    } else {
      auctionGuestName.textContent = 'في انتظار الضيف...';
      auctionGuestBudget.textContent = fmtMoney(SQUAD_MODES[roomState.squadMode].budget);
    }

    biddingPanel.classList.add('hidden');
    uncontestedPanel.classList.add('hidden');
    resultPanel.classList.add('hidden');

    if (!roomState.guest) {
      auctionPositionLabel.textContent = '⏳ في انتظار انضمام الضيف';
      showNotification(`👑 أنت المستضيف! ابعت كود الغرفة [${roomState.roomId}] لصاحبك يدخل يلعب معاك.`, 8000);
      return;
    }

    if (!roomState.currentRound) return;
    const round = roomState.currentRound;
    auctionPositionLabel.textContent = POSITION_NAMES_AR[round.positionKey] || round.positionKey;

    if (round.status === 'bidding') {
      renderBiddingPanel(round);
    } else if (round.status === 'uncontested') {
      renderUncontestedPanel(round);
    } else if (round.status === 'resolved') {
      renderResultPanel(round);
    }

    renderMiniSquads();
  }

  function renderBiddingPanel(round) {
    biddingPanel.classList.remove('hidden');
    candidateCard.innerHTML = fifaCardHTML(round.candidate);
    bidCurrentAmount.textContent = fmtMoney(round.currentBid);

    const isMyTurn = myRole === round.bidderTurn;
    if (myRole === 'spectator') {
      bidTurnIndicator.textContent = `👁️ دور ${round.bidderTurn === 'host' ? roomState.host.name : roomState.guest.name} يزايد الآن`;
    } else if (isMyTurn) {
      bidTurnIndicator.textContent = '🎯 دورك تزايد أو تنسحب!';
      bidTurnIndicator.style.color = 'var(--neon-green)';
    } else {
      bidTurnIndicator.textContent = `⏳ دور ${round.bidderTurn === 'host' ? roomState.host.name : roomState.guest.name}...`;
      bidTurnIndicator.style.color = 'var(--neon-blue)';
    }

    const myBudget = myRole === 'host' ? roomState.host.remainingBudget : (myRole === 'guest' ? roomState.guest.remainingBudget : 0);
    const steps = AuctionEngine.getRaiseSteps(roomState.squadMode);
    bidControls.innerHTML = '';
    steps.forEach(step => {
      const btn = document.createElement('button');
      btn.className = 'btn gold-btn sm';
      btn.textContent = `+${fmtMoney(step)}`;
      const wouldExceed = (round.currentBid + step) > myBudget;
      if (!isMyTurn || wouldExceed) {
        btn.disabled = true;
        btn.classList.add('disabled-btn');
      } else {
        btn.onclick = () => {
          window.soundFX.playClick();
          AuctionEngine.raiseBid(currentRoomId, roomState, step);
        };
      }
      bidControls.appendChild(btn);
    });

    const canPass = isMyTurn && round.lastRaiserRole;
    btnPassBid.disabled = !canPass;
    btnPassBid.classList.toggle('disabled-btn', !canPass);
    btnPassBid.title = (isMyTurn && !round.lastRaiserRole) ? 'لازم تزايد الأول قبل ما تقدر تنسحب' : '';
  }

  function renderUncontestedPanel(round) {
    uncontestedPanel.classList.remove('hidden');
    uncontestedCandidateCard.innerHTML = fifaCardHTML(round.player);
    const recipientName = round.soleRole === 'host' ? roomState.host.name : roomState.guest.name;
    uncontestedText.textContent = `🎁 خانة ${POSITION_NAMES_AR[round.positionKey]} عند ${recipientName} كانت آخر واحدة فاضية عنده بس — فياخدها مجانًا من غير مزايدة!`;
  }

  function renderResultPanel(round) {
    resultPanel.classList.remove('hidden');
    const winnerName = round.winnerRole === 'host' ? roomState.host.name : roomState.guest.name;
    resultTitle.textContent = `🏆 ${winnerName} كسب المزايدة بـ ${fmtMoney(round.winPrice)}!`;
    resultCandidateCard.innerHTML = fifaCardHTML(round.candidate);
    resultBonusCard.innerHTML = fifaCardHTML(round.bonusPlayer);
    resultConsolationCard.innerHTML = fifaCardHTML(round.consolationPlayer);
  }

  function renderMiniSlots(container, squad) {
    container.innerHTML = '';
    const slots = SQUAD_MODES[roomState.squadMode].slots;
    POSITIONS.forEach(pos => {
      const filled = (squad[pos] || []).length;
      const total = slots[pos];
      const chip = document.createElement('div');
      chip.className = 'mini-slot-chip' + (filled >= total ? ' full' : '');
      chip.textContent = `${POSITION_NAMES_AR[pos].split(' ')[0]} ${filled}/${total}`;
      container.appendChild(chip);
    });
  }

  function renderMiniSquads() {
    miniHostTitle.textContent = roomState.host.name;
    renderMiniSlots(miniHostSquad, roomState.host.squad);
    if (roomState.guest) {
      miniGuestTitle.textContent = roomState.guest.name;
      renderMiniSlots(miniGuestSquad, roomState.guest.squad);
    }
  }

  function renderFullSquadList(container, squad) {
    container.innerHTML = '';
    POSITIONS.forEach(pos => {
      (squad[pos] || []).forEach(player => {
        const slot = document.createElement('div');
        slot.className = 'squad-slot filled';
        slot.innerHTML = `
          <span class="slot-pos">${POSITION_NAMES_AR[pos].split(' ')[0]}</span>
          <span class="slot-player">${player.name}</span>
          <span class="slot-rating">${player.rating}</span>
        `;
        container.appendChild(slot);
      });
    });
  }

  function renderFinalView() {
    finalHostName.textContent = roomState.host.name;
    finalHostBudget.textContent = `💰 الباقي: ${fmtMoney(roomState.host.remainingBudget)}`;
    renderFullSquadList(finalHostSquad, roomState.host.squad);

    if (roomState.guest) {
      finalGuestName.textContent = roomState.guest.name;
      finalGuestBudget.textContent = `💰 الباقي: ${fmtMoney(roomState.guest.remainingBudget)}`;
      renderFullSquadList(finalGuestSquad, roomState.guest.squad);
    }
  }

});
