// contexts/SocketContext.js - NEW FILE
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, url, socketKey, onHandshake }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const socketInstance = io(url, {
      query: { key: socketKey },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log(`Socket.io connection established - client id: ${socketInstance.id}`);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket.io connection closed:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setIsConnected(false);
    });

    socketInstance.on('message', (data) => {
      console.log('Message received:', data);
    });

    // Handshake handler
    socketInstance.on('handshake', (data) => {
      console.log('Handshake received:', data);
      if (onHandshake) {
        const response = onHandshake();
        socketInstance.emit('handshake-response', {
          message: 'Hello from ControlApp!',
          ...response,
        });
      }
    });

    socketInstance.on('error', (error) => {
      console.error('Socket.io error:', error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [url, socketKey, onHandshake]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
