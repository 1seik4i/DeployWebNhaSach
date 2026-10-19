# Traffic statistics contract

Connect to `/ws` (WSS over HTTPS). The public landing page and Admin share these messages:

- `ONLINE_COUNT`: `{ type, onlineCount, timestamp }`, sent on connect, identify, disconnect and heartbeat expiration. Online means currently open WebSocket sessions, deduplicated by `IDENTIFY.sessionId`; unidentified sockets each count once. Zero is authoritative; no five-minute HTTP fallback.
- `VISIT_STATS`: `{ type, stats: { onlineCount, todayVisits, monthVisits, totalVisits, generatedAt, definition, onlineWindowSeconds } }`. Initial snapshot on connection, refreshed after successful `POST /api/public/visits`, presence changes, and every 25 seconds. Only public aggregate counters are broadcast. `onlineWindowSeconds` is retained for HTTP compatibility and does not define live presence.
- Client `IDENTIFY`: `{ type: "IDENTIFY", sessionId }`; client `PING` receives `PONG`.

Visit totals count one session per Vietnam calendar day. Repeated visit heartbeats update lastSeenAt without increasing totals. Public and authenticated Admin HTTP counters use the same database and live presence source. Admin history remains behind admin authentication; WebSocket updates trigger refresh of the selected history range.

Clients reconnect with backoff, receive a fresh snapshot, and merge the latest WebSocket counters over HTTP responses to prevent older HTTP results overwriting live values. HTTP refresh is retained for recovery when WebSocket is unavailable. Set VITE_WS_URL to override; otherwise the WebSocket host follows VITE_API_BASE_URL, or the current host with the development /ws proxy. Production builds using relative /api derive the direct backend WebSocket URL from vercel.json.

Presence is process-local. Multiple backend replicas require a shared presence store and pub/sub before these guarantees apply across replicas.
