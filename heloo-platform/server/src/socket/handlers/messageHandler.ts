import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const registerMessageHandlers = (io: Server, socket: AppSocket) => {
    const userId = socket.data.userId;

    socket.on('message_send', ({ conversationId, message }) => {
        if (!conversationId || !message) return;

        const roomName = `conversation:${conversationId}`;

        // Broadcast to everyone ELSE in the room
        // The sender already has the message in their store optimistically or via mutations
        socket.to(roomName).emit('message_receive', message);

        // console.log(`User ${userId} relayed message to room ${roomName}`);
    });
};
