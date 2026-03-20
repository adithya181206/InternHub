import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useEffect, useRef } from 'react';
import { ArrowLeft, Moon, Sun, Briefcase, LayoutDashboard, ClipboardList, Sparkles, BarChart3, Dna, LogOut, UserCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

export default function DashboardLayout({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) {

    // Global Chat Notifications
    const { user, logout } = useAuthStore();
    const { messages, reload } = useChatStore();
    const { addToast } = useNotificationStore();
    const prevMsgCount = useRef(messages.length);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Poll for new messages globally every 3 seconds
        const interval = setInterval(() => reload(), 3000);
        return () => clearInterval(interval);
    }, [reload]);

    const navItems = user?.role === 'student'
        ? [
            { path: '/dashboard', icon: Dna, label: 'DNA' },
            { path: '/dashboard/discovery', icon: LayoutDashboard, label: 'Discovery' },
            { path: '/dashboard/tracker', icon: ClipboardList, label: 'Tracker' },
            { path: '/dashboard/advisor', icon: Sparkles, label: 'Advisor' },
        ]
        : [
            { path: '/dashboard', icon: Briefcase, label: 'Verify' },
            { path: '/dashboard/referrals', icon: LayoutDashboard, label: 'Referrals' },
            { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
        ];

    const showBackButton = location.pathname !== '/dashboard' && location.pathname !== '/';

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
            <Sidebar theme={theme} toggleTheme={toggleTheme} />
            <main className={cn(
                "flex-1 w-full flex flex-col",
                location.pathname === '/dashboard/advisor' ? "h-screen overflow-hidden p-0 max-w-none" : "min-h-screen overflow-y-auto p-2 md:p-8 max-w-7xl mx-auto"
            )}>
                {/* Mobile Header */}
                <div className="md:hidden flex flex-col gap-1 mb-3 bg-background/60 backdrop-blur-xl py-2 px-3 rounded-2xl border border-white/10 sticky top-0 z-30 shadow-lg">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            {showBackButton && (
                                <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-foreground" />
                                </button>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="bg-gradient-to-br from-primary to-indigo-400 rounded-lg p-1.5 shrink-0 shadow-indigo">
                                    <Briefcase className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-black text-sm tracking-widest uppercase bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">InternHub</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/dashboard/profile')} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <UserCircle className="w-5 h-5 text-foreground" />
                            </button>
                            <button onClick={toggleTheme} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                {theme === 'dark' ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
                            </button>
                            <button 
                                onClick={async () => {
                                    await logout();
                                    navigate('/');
                                }} 
                                className="p-2 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
                            >
                                <LogOut className="w-5 h-5 text-red-500" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Hub Icons Bar */}
                    <div className="flex items-center justify-around py-1 border-t border-white/5">
                        {navItems.map((item) => (
                            <button 
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all duration-200",
                                    location.pathname === item.path 
                                        ? "bg-primary/20 text-primary shadow-indigo-sm" 
                                        : "text-foreground/40 hover:text-primary hover:bg-primary/5"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cn(
                    "flex-1 flex flex-col overflow-hidden",
                    location.pathname === '/dashboard/advisor' ? "h-full" : "glass-card-static p-4 md:p-8"
                )}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
