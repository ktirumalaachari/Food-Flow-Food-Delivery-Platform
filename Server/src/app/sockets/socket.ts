import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from '../config';
import { registerOrderTrackingHandlers } from './orderTracking.socket';

let io: SocketIOServer | null = null;

/** Access the shared Socket.io server instance (null before initialization). */
export const getIO = (): SocketIOServer | null => io;

/** Socket.io CORS origin option (string or resolver callback). */
type CorsOrigin =
  | string
  | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);

/**
 * Build the Socket.io CORS origin configuration.
 * Accepts a comma-separated CLIENT_URL list. Defaults to '*' (matches app.ts).
 */
const buildCorsOrigin = (): CorsOrigin => {
  const configured = config.client_url;
  if (!configured || configured === '*') return '*';

  const allowed = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  };
};

/**
 * Attach and initialize the Socket.io server to the given HTTP server.
 * Configures CORS for the client origin and registers order-tracking handlers.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: buildCorsOrigin(),
      credentials: true,
    },
  });

  registerOrderTrackingHandlers(io);

  console.log('🔌 Socket.io server initialized and attached to HTTP server.');
  return io;
}

/**
 * Startup self-test: confirms socket.io server is initialized and ready.
 */
export async function testSocketStartup(_host?: string, _timeoutMs = 5000): Promise<boolean> {
  const server = getIO();
  const ok = Boolean(server);
  console.log(
    ok
      ? '✅ Socket.io startup test passed: server initialized.'
      : '❌ Socket.io startup test failed: server not initialized.'
  );
  return ok;
}