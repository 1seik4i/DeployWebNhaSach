/**
 * Real-time WebSocket Client for Book Street Website
 * Manages WebSocket connection, handles auto-reconnect, and distributes live online count
 */

export interface VisitStatsSnapshot {
  onlineCount: number;
  todayVisits: number;
  monthVisits: number;
  totalVisits: number;
  generatedAt: string;
}

type OnlineCountListener = (count: number) => void;

class RealtimeWebSocketService {
  private statsListeners = new Set<(stats: VisitStatsSnapshot) => void>();
  private currentStats: VisitStatsSnapshot | null = null;

  public subscribeStats(listener: (stats: VisitStatsSnapshot) => void): () => void {
    this.statsListeners.add(listener);
    if (this.currentStats) listener(this.currentStats);
    return () => { this.statsListeners.delete(listener); };
  }

  public getCurrentStats() { return this.currentStats; }

  private socket: WebSocket | null = null;
  private listeners = new Set<OnlineCountListener>();
  private currentOnlineCount: number | null = null;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private reconnectAttempts = 0;
  private isExplicitlyClosed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
            this.connect();
          }
        }
      });
    }
  }

  private getWebSocketUrl(): string {
    const customWs = import.meta.env.VITE_WS_URL;
    if (customWs) return customWs;

    const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL || '/api', window.location.href);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    // If in dev with different port, fallback through Vite proxy at /ws or direct to 4000
    return `${protocol}//${apiUrl.host}/ws`;
  }

  public init() {
    this.isExplicitlyClosed = false;
    this.connect();
  }

  private connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = this.getWebSocketUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Send session identifier
        const sessionKey = 'duongsach_visit_session';
        let sessionId = sessionStorage.getItem(sessionKey);
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem(sessionKey, sessionId);
        }
        if (sessionId && this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'IDENTIFY', sessionId }));
        }

        // Start ping heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = window.setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'PING' }));
          }
        }, 20000);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'VISIT_STATS' && data.stats &&
              ['onlineCount', 'todayVisits', 'monthVisits', 'totalVisits'].every(key =>
                Number.isFinite(data.stats[key]) && data.stats[key] >= 0)) {
            this.currentStats = data.stats;
            this.currentOnlineCount = data.stats.onlineCount;
            this.notifyListeners(data.stats.onlineCount);
            this.statsListeners.forEach(listener => listener(data.stats));
          }
          if (data.type === 'ONLINE_COUNT' && typeof data.onlineCount === 'number') {
            if (this.currentStats) this.currentStats = { ...this.currentStats, onlineCount: data.onlineCount };
            this.currentOnlineCount = data.onlineCount;
            this.notifyListeners(data.onlineCount);
          }
        } catch {
          // Ignore non-json frames
        }
      };

      this.socket.onclose = () => {
        this.currentStats = null;
        this.currentOnlineCount = null;
        this.cleanupSocket();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        // Will trigger onclose and attempt reconnect
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private cleanupSocket() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.socket = null;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private notifyListeners(count: number) {
    this.listeners.forEach((listener) => {
      try {
        listener(count);
      } catch (err) {
        console.error('Error in onlineCount listener:', err);
      }
    });
  }

  public subscribe(listener: OnlineCountListener): () => void {
    this.listeners.add(listener);
    if (this.currentOnlineCount !== null) {
      listener(this.currentOnlineCount);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getCurrentOnlineCount(): number | null {
    return this.currentOnlineCount;
  }
}

export const realtimeWebSocket = new RealtimeWebSocketService();

