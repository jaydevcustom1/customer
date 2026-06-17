import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Establish connection to backend
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(backendUrl, {
      autoConnect: true,
      transports: ['websocket']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to backend Socket.IO server');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = (roomName) => {
    if (socket) {
      socket.emit('join-room', roomName);
    }
  };

  const leaveRoom = (roomName) => {
    if (socket) {
      socket.emit('leave-room', roomName);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
