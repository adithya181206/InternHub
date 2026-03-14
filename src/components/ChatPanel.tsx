import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageCircle } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

interface ChatPanelProps {
    referralId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserRole: 'student' | 'alumnus';
    partnerName: string;
    onClose: () => void;
}

export default function ChatPanel({ referralId, currentUserId, currentUserName, currentUserRole, partnerName, onClose }: ChatPanelProps) {
    const { messages, sendMessage, markAsRead, reload } = useChatStore();
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const chatMessages = messages
        .filter(m => m.referralId === referralId)
        .sort((a, b) => a.timestamp - b.timestamp);

    // Poll for new messages every 1.5s
    useEffect(() => {
        const interval = setInterval(() => reload(), 1500);
        return () => clearInterval(interval);
    }, [reload]);

    // Mark as read when messages change or on mount
    useEffect(() => {
        markAsRead(referralId, currentUserId);
    }, [referralId, currentUserId, chatMessages.length, markAsRead]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages.length]);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        sendMessage({
            referralId,
            senderId: currentUserId,
            senderName: currentUserName,
            senderRole: currentUserRole,
            text: trimmed,
        });
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none sm:p-0 sm:items-end sm:justify-end sm:pointer-events-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto sm:hidden" onClick={onClose} />
            {/* Chat window */}
            <div className="relative glass-card-static w-full sm:w-[400px] h-[500px] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden shadow-2xl border border-white/10 rounded-2xl animate-in zoom-in-95 fade-in slide-in-from-bottom-8 duration-300 pointer-events-auto sm:mr-8 sm:mb-8">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white font-black text-sm">
                            {partnerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-foreground">{partnerName}</h3>
                            <p className="text-xs text-foreground/50">Referral Chat</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-primary/10 text-foreground/50 hover:text-foreground transition-all duration-200 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 styled-scrollbar">
                    {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                            <MessageCircle className="w-10 h-10 mb-3 text-primary/50" />
                            <p className="text-sm font-semibold text-foreground/80">No messages yet</p>
                            <p className="text-xs text-foreground/60 mt-1">Start the conversation!</p>
                        </div>
                    ) : (
                        chatMessages.map((msg) => {
                            const isMine = msg.senderId === currentUserId;
                            return (
                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] ${isMine ? 'order-2' : 'order-1'}`}>
                                        {!isMine && (
                                            <p className="text-[10px] font-bold text-foreground/60 mb-1 ml-1 uppercase tracking-wider">
                                                {msg.senderName}
                                            </p>
                                        )}
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${isMine
                                                ? 'bg-gradient-to-r from-primary to-indigo-500 text-white rounded-br-md'
                                                : 'bg-white/5 dark:bg-white/10 text-foreground rounded-bl-md border border-black/10 dark:border-white/10 shadow-sm'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        <p className={`text-[10px] text-foreground/50 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 glass-input py-3 px-4 text-sm font-medium outline-none text-foreground placeholder:text-foreground/50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!text.trim()}
                            className="p-3 btn-primary-gradient rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
