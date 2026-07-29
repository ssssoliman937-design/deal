// Socket.io Client Handler

const socket = io();

const SocketClient = {
  get id() {
    return socket.id;
  },

  createRoom(roomId, playerName) {
    socket.emit('create_room', { roomId, playerName });
  },

  joinRoom(roomId, playerName) {
    socket.emit('join_room', { roomId, playerName });
  },

  pickBriefcase(briefcaseIndex) {
    socket.emit('pick_briefcase', { briefcaseIndex });
  },

  confirmDeal() {
    socket.emit('confirm_deal');
  },

  rejectDeal() {
    socket.emit('reject_deal');
  },

  useStealHelper(myPosToReplace, oppPosToSteal) {
    socket.emit('use_steal_helper', { myPosToReplace, oppPosToSteal });
  },

  restartGame() {
    socket.emit('restart_game');
  },

  on(eventName, callback) {
    socket.on(eventName, callback);
  }
};

window.SocketClient = SocketClient;
