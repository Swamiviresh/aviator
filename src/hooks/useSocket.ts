'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketOptions {
  port?: number;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

const DEFAULT_PORT = 3003;

export function useSocket(options: SocketOptions = {}): UseSocketReturn {
  const {
    port = DEFAULT_PORT,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = io(`/?XTransformPort=${port}`, {
        transports: ['websocket'],
        autoConnect,
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.1,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        console.log('[Socket] Connected');
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('[Socket] Disconnected:', reason);
      });

      socket.on('connect_error', (err) => {
        setError(err);
        setIsConnected(false);
        console.error('[Socket] Connection error:', err);
      });

      socket.on('error', (err) => {
        console.error('[Socket] Error:', err);
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      console.error('[Socket] Setup error:', err);
    }
  }, [port, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnect,
  };
}
