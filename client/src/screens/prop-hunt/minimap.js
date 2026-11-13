import { jailPoint } from "./world.js";

export function minimapPlayers(players, token, position, yaw) {
  const me = players.find((p) => p.id === token);
  if (!me) return [];
  return players.flatMap((p, index) => {
    if (!p.connected || p.role !== me.role) return [];
    const mine = p.id === token;
    const point = p.caught ? jailPoint(index) : mine && position ? position : p;
    return [{ id: p.id, name: p.name, caught: p.caught, mine,
      x: point.x, z: point.z, yaw: (mine ? yaw : p.yaw) || 0 }];
  });
}
