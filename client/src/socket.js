import { io } from 'socket.io-client';

function getPlayerId() {
  let id = sessionStorage.getItem('imposter-player-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('imposter-player-id', id);
  }
  return id;
}

export const playerId = getPlayerId();

const URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';
export const socket = io(URL, {
  autoConnect: false,
  auth: { playerId }
});
