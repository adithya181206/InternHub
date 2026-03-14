import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    referralId: string;
    senderId: string;
    senderName: string;
    senderRole: 'student' | 'alumnus';
    text: string;
    timestamp: number;
    read: boolean;
}

function loadMessages(): ChatMessage[] {
    const stored = localStorage.getItem('mock_chat_messages');
    return stored ? JSON.parse(stored) : [];
}

function saveMessages(messages: ChatMessage[]) {
    localStorage.setItem('mock_chat_messages', JSON.stringify(messages));
}

interface ChatState {
    messages: ChatMessage[];
    sendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>) => void;
    getMessagesForReferral: (referralId: string) => ChatMessage[];
    getUnreadCount: (referralId: string, userId: string) => number;
    markAsRead: (referralId: string, userId: string) => void;
    reload: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: loadMessages(),

    sendMessage: (msg) => {
        const newMsg: ChatMessage = {
            ...msg,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: Date.now(),
            read: false,
        };
        set((state) => {
            const updated = [...state.messages, newMsg];
            saveMessages(updated);
            return { messages: updated };
        });
    },

    getMessagesForReferral: (referralId) => {
        return get().messages
            .filter(m => m.referralId === referralId)
            .sort((a, b) => a.timestamp - b.timestamp);
    },

    getUnreadCount: (referralId, userId) => {
        return get().messages.filter(
            m => m.referralId === referralId && m.senderId !== userId && !m.read
        ).length;
    },

    markAsRead: (referralId, userId) => {
        set((state) => {
            const updated = state.messages.map(m =>
                (m.referralId === referralId && m.senderId !== userId && !m.read)
                    ? { ...m, read: true }
                    : m
            );
            saveMessages(updated);
            return { messages: updated };
        });
    },

    reload: () => {
        set({ messages: loadMessages() });
    },
}));
