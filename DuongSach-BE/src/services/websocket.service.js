import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../config/logger.js';

let wss = null;
let heartbeatInterval = null;
const clients = new Map(); // ws -> { sessionId, isAlive, connectedAt }

/**
 * Tính số lượng người trực tuyến theo thời gian thực:
 * Đếm số lượng sessionId duy nhất (nếu có), hoặc số lượng socket đang kết nối.
 */
export function getLiveOnlineCount() {
  if (!wss || clients.size === 0) return 0;
  
  const uniqueSessions = new Set();
  let anonymousCount = 0;

  for (const [ws, data] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (data.sessionId) {
        uniqueSessions.add(data.sessionId);
      } else {
        anonymousCount++;
      }
    }
  }

  // Tổng số phiên thực tế (mỗi trình duyệt/thiết bị tính 1 người dù mở nhiều tab)
  const total = uniqueSessions.size + anonymousCount;
  return Math.max(total, 0);
}

/**
 * Phát tin nhắn tới tất cả client WebSocket đang mở
 */
export function broadcastToAll(payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  for (const [ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (err) {
        logger.warn(`[WebSocket] Failed to send message to client: ${err.message}`);
      }
    }
  }
}

/**
 * Phát cập nhật số người online theo thời gian thực
 */
export function broadcastOnlineCount() {
  const count = getLiveOnlineCount();
  broadcastToAll({
    type: 'ONLINE_COUNT',
    onlineCount: count,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Khởi tạo WebSocket Server gắn vào HTTP Server
 */
export function initWebSocketServer(server) {
  if (wss) return wss;

  wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  logger.info('[WebSocket] Real-time WebSocket server initialized on path /ws');

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress || 'unknown';
    clients.set(ws, {
      sessionId: null,
      isAlive: true,
      connectedAt: new Date(),
      ip: clientIp,
    });

    logger.info(`[WebSocket] Client connected from ${clientIp}. Total live sockets: ${clients.size}`);

    // Gửi ngay số người trực tuyến hiện tại cho client vừa kết nối
    ws.send(JSON.stringify({
      type: 'ONLINE_COUNT',
      onlineCount: getLiveOnlineCount(),
      timestamp: new Date().toISOString(),
    }));

    // Báo cho tất cả các client khác biết có người vừa vào
    broadcastOnlineCount();

    // Lắng nghe pong từ client để kiểm tra kết nối sống
    ws.on('pong', () => {
      const data = clients.get(ws);
      if (data) data.isAlive = true;
    });

    // Lắng nghe thông điệp từ client (ví dụ định danh sessionId từ sessionStorage)
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'IDENTIFY' && msg.sessionId) {
          const data = clients.get(ws);
          if (data) {
            data.sessionId = String(msg.sessionId);
            broadcastOnlineCount();
          }
        } else if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch {
        // Bỏ qua tin nhắn không đúng định dạng JSON
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      logger.info(`[WebSocket] Client disconnected. Remaining sockets: ${clients.size}`);
      broadcastOnlineCount();
    });

    ws.on('error', (err) => {
      logger.warn(`[WebSocket] Client socket error: ${err.message}`);
      clients.delete(ws);
      broadcastOnlineCount();
    });
  });

  // Heartbeat ping định kỳ 25 giây một lần để phát hiện client ngắt kết nối
  heartbeatInterval = setInterval(() => {
    if (!wss) return;
    for (const [ws, data] of clients.entries()) {
      if (!data.isAlive) {
        logger.info('[WebSocket] Terminating inactive client socket');
        clients.delete(ws);
        ws.terminate();
        broadcastOnlineCount();
        continue;
      }
      data.isAlive = false;
      try {
        ws.ping();
      } catch {
        clients.delete(ws);
        ws.terminate();
        broadcastOnlineCount();
      }
    }
  }, 25000);

  return wss;
}

/**
 * Đóng WebSocket Server khi tắt hệ thống
 */
export function closeWebSocketServer() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (wss) {
    for (const [ws] of clients.entries()) {
      try {
        ws.close(1000, 'Server shutting down');
      } catch {}
    }
    clients.clear();
    wss.close();
    wss = null;
    logger.info('[WebSocket] WebSocket server closed.');
  }
}

