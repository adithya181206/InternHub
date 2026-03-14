import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

export default function DashboardLayout({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Global Chat Notifications
    const { user } = useAuthStore();
    const { messages, reload } = useChatStore();
    const { addToast } = useNotificationStore();
    const prevMsgCount = useRef(messages.length);

    useEffect(() => {
        // Poll for new messages globally every 3 seconds
        const interval = setInterval(() => reload(), 3000);
        return () => clearInterval(interval);
    }, [reload]);

    useEffect(() => {
        if (!user) return;

        // Compare old messages length with new length
        if (messages.length > prevMsgCount.current) {
            const newMessages = messages.slice(prevMsgCount.current);
            const incoming = newMessages.filter(m => m.senderId !== user.uid);

            // If there's an incoming message not sent by us, trigger toast
            if (incoming.length > 0) {
                const latest = incoming[incoming.length - 1];
                addToast(`New message from ${latest.senderName}`, 'info');
            }
        }
        prevMsgCount.current = messages.length;
    }, [messages.length, user, addToast]);

    return (
        <div className="flex w-full min-h-screen bg-background relative">
            <Sidebar theme={theme} toggleTheme={toggleTheme} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="flex-1 p-3 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto min-h-screen">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-4 bg-background/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 sticky top-3 z-30 shadow-lg">
                    <span className="font-black tracking-widest uppercase bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">InternHub</span>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <Menu className="w-6 h-6 text-foreground" />
                    </button>
                </div>

                <div className="glass-card-static min-h-[calc(100vh-4rem)] flex flex-col p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
