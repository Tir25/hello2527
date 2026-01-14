
export interface ServerToClientEvents {
    // Connection / Status
    initial_online_users: (data: { userIds: string[] }) => void;
    user_status: (data: { userId: string; status: 'online' | 'offline'; last_seen?: string }) => void;

    // Typing
    user_typing: (data: {
        userId: string;
        receiverId?: string;
        groupId?: string;
        isTyping: boolean;
    }) => void;

    // Messages
    message_receive: (data: any) => void; // Using any for now, ideally strictly typed with Message interface

    // Reactions
    reaction_update: (data: {
        messageId: string;
        conversationId: string;
        emoji: string;
        type: 'add' | 'remove';
        userId: string;
    }) => void;
}

export interface ClientToServerEvents {
    // Status
    request_online_users: () => void;

    // Typing
    typing_start: (data: { receiverId?: string; groupId?: string }) => void;
    typing_stop: (data: { receiverId?: string; groupId?: string }) => void;

    // Rooms
    join_conversation: (data: { conversationId: string }) => void;
    leave_conversation: (data: { conversationId: string }) => void;

    // Messages
    message_send: (data: {
        conversationId: string;
        message: any; // Full message object including reply_to
    }) => void;

    // Reactions
    reaction_send: (data: {
        messageId: string;
        conversationId: string;
        emoji: string;
        type: 'add' | 'remove';
    }) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    userId: string;
}
