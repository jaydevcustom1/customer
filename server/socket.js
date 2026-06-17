import { Server } from 'socket.io';

let io = null;

export const initIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow connections from client
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // console.log(`Client connected: ${socket.id}`);

    // Join specific rooms
    socket.on('join-room', (roomName) => {
      socket.join(roomName);
      // console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on('leave-room', (roomName) => {
      socket.leave(roomName);
      // console.log(`Socket ${socket.id} left room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      // console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized! Call initIO(server) first.');
  }
  return io;
};
