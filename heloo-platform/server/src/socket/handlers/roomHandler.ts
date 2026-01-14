import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const registerRoomHandlers = (io: Server, socket: AppSocket) => {
    const userId = socket.data.userId;

    socket.on('join_conversation', ({ conversationId }) => {
        if (!conversationId) return;

        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);

        // Optional: Debug log
        // console.log(`User ${userId} joined room ${roomName}`);
    });

    socket.on('leave_conversation', ({ conversationId }) => {
        if (!conversationId) return;

        const roomName = `conversation:${conversationId}`;
        socket.leave(roomName);
    });
};
