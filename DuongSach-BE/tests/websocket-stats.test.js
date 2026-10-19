import { afterEach, describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { once } from 'node:events';
import WebSocket from 'ws';
import { initWebSocketServer, closeWebSocketServer, setVisitStatsProvider, broadcastVisitStats, getLiveOnlineCount } from '../src/services/websocket.service.js';

let server;
const sockets = [];
afterEach(async () => {
  sockets.forEach(socket => socket.terminate());
  sockets.length = 0;
  closeWebSocketServer();
  if (server) await new Promise(resolve => server.close(resolve));
});
function receive(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off('message', handler); reject(new Error('Missing websocket update')); }, 3000);
    function handler(raw) {
      const message = JSON.parse(raw.toString());
      if (predicate(message)) { clearTimeout(timer); socket.off('message', handler); resolve(message); }
    }
    socket.on('message', handler);
  });
}
async function connect() {
  const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/ws`);
  sockets.push(socket);
  const initial = receive(socket, message => message.type === 'VISIT_STATS');
  await once(socket, 'open');
  await initial;
  return socket;
}
describe('shared traffic websocket', () => {
  it('sends initial totals, synchronizes two clients after a recorded visit, and tracks disconnects', async () => {
    let total = 10;
    setVisitStatsProvider(async () => ({ onlineCount: getLiveOnlineCount(), todayVisits: total, monthVisits: total, totalVisits: total, generatedAt: new Date().toISOString() }));
    server = createServer();
    initWebSocketServer(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const landing = await connect();
    const admin = await connect();
    const landingUpdate = receive(landing, message => message.type === 'VISIT_STATS' && message.stats.totalVisits === 11);
    const adminUpdate = receive(admin, message => message.type === 'VISIT_STATS' && message.stats.totalVisits === 11);
    total++;
    await broadcastVisitStats();
    const [a, b] = await Promise.all([landingUpdate, adminUpdate]);
    expect(a.stats).toEqual(b.stats);
    expect(a.stats).toMatchObject({ totalVisits: 11, onlineCount: 2 });
    const disconnected = receive(landing, message => message.type === 'ONLINE_COUNT' && message.onlineCount === 1);
    admin.close();
    await disconnected;
    expect(getLiveOnlineCount()).toBe(1);
  });
  it('deduplicates identified sessions and sends a fresh snapshot after reconnect', async () => {
    setVisitStatsProvider(async () => ({ onlineCount: getLiveOnlineCount(), todayVisits: 7, monthVisits: 9, totalVisits: 20, generatedAt: new Date().toISOString() }));
    server = createServer();
    initWebSocketServer(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const first = await connect();
    const second = await connect();
    const deduplicated = receive(first, message => message.type === 'ONLINE_COUNT' && message.onlineCount === 1);
    first.send(JSON.stringify({ type: 'IDENTIFY', sessionId: 'same-session' }));
    second.send(JSON.stringify({ type: 'IDENTIFY', sessionId: 'same-session' }));
    await deduplicated;
    expect(getLiveOnlineCount()).toBe(1);
    const closed = once(second, 'close');
    second.close();
    await closed;
    const reconnected = await connect();
    const snapshot = receive(reconnected, message => message.type === 'VISIT_STATS' && message.stats.onlineCount === 1);
    reconnected.send(JSON.stringify({ type: 'IDENTIFY', sessionId: 'same-session' }));
    expect((await snapshot).stats).toMatchObject({ totalVisits: 20, onlineCount: 1 });
  });

});
