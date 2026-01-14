import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const registerReactionHandlers = (io: Server, socket: AppSocket) => {
    const userId = socket.data.userId;

    socket.on('reaction_send', ({ messageId, conversationId, emoji, type }) => {
        if (!messageId || !conversationId || !emoji) return;

        // Broadcast to the specifically joined conversation room
        const roomName = `conversation:${conversationId}`;

        // Broadcast to everyone in the room (including sender, for simple optimistic confirmation if needed, 
        // though client usually handles optimistic UI)
        // Using io.to().emit() sends to everyone including sender? No, io.to sends to everyone.
        // Use socket.to(room).emit() to send to everyone EXCEPT sender.
        // Client already does optimistic update, so we send to others.

        socket.to(roomName).emit('reaction_update', {
            messageId,
            conversationId,
            emoji,
            type,
            userId: userId!
        });

        //console.log(`User ${userId} ${type} reaction ${emoji} in active room ${roomName}`);
    });
};
