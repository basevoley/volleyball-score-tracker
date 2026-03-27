import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import type { ConnectionStatus } from '../../types';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

interface SocketProviderProps {
  children: React.ReactNode;
  url: string;
  socketKey: string;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (context === undefined || context === null) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, url, socketKey }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Create socket connection with enhanced options
    const socketInstance = io(url, {
      query: { key: socketKey },
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying
      timeout: 20000, // 20 seconds timeout
      autoConnect: true,
      forceNew: false,
    });

    // Connection established
    socketInstance.on('connect', () => {
      console.log(`✅ Socket.io connected - client id: ${socketInstance.id}`);
      if (!mountedRef.current) return;

      setIsConnected(true);
      setConnectionStatus('connected');

      // Start heartbeat to keep connection alive
      // startHeartbeat(socketInstance);
    });

    // Attempting to reconnect
    socketInstance.io.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt #${attempt}`);
      if (!mountedRef.current) return;
      setConnectionStatus('reconnecting');
    });

    // Successfully reconnected
    socketInstance.io.on('reconnect', (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      if (!mountedRef.current) return;
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    // Reconnection failed
    socketInstance.io.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      if (!mountedRef.current) return;
      setConnectionStatus('disconnected');
    });

    // Reconnection error
    socketInstance.io.on('reconnect_error', (error) => {
      console.error('⚠️ Reconnection error:', (error as Error).message);
    });

    // Connection closed
    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
      if (!mountedRef.current) return;

      setIsConnected(false);

      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, manually reconnect
        console.log('🔄 Server disconnected, attempting manual reconnect...');
        setConnectionStatus('reconnecting');
        socketInstance.connect();
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        // Network issue or server went down (Render cold start)
        console.log('🔄 Connection lost, auto-reconnecting...');
        setConnectionStatus('reconnecting');
      } else {
        setConnectionStatus('disconnected');
      }
    });

    // Connection error
    socketInstance.on('connect_error', (error) => {
      console.error('⚠️ Socket.io connection error:', error.message);
      if (!mountedRef.current) return;

      setIsConnected(false);
      setConnectionStatus('reconnecting');

      // If it's a timeout, the server might be cold starting
      if (error.message.includes('timeout')) {
        console.log('⏳ Server might be cold starting, will retry...');
      }
    });

    // Generic error handler
    socketInstance.on('error', (error) => {
      console.error('❌ Socket.io error:', error);
    });

    // Message handler
    socketInstance.on('message', (data) => {
      console.log('📨 Message received:', data);
    });

    // Pong handler (for heartbeat)
    socketInstance.on('pong', () => {
      console.log('💓 Heartbeat pong received');
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      cleanup();
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
    };
  }, [url, socketKey, cleanup]);

  // Heartbeat to keep connection alive and detect server cold starts
  // const startHeartbeat = (socketInstance) => {
  //   // Clear existing interval
  //   if (heartbeatIntervalRef.current) {
  //     clearInterval(heartbeatIntervalRef.current);
  //   }

  //   // Send ping every 25 seconds (Render timeout is ~30s)
  //   heartbeatIntervalRef.current = setInterval(() => {
  //     if (socketInstance.connected) {
  //       socketInstance.emit('ping');
  //       console.log('💓 Heartbeat ping sent');
  //     }
  //   }, 25000); // 25 seconds
  // };

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socket && !socket.connected) {
      console.log('🔄 Manual reconnect triggered');
      setConnectionStatus('reconnecting');
      socket.connect();
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connectionStatus,
        reconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
