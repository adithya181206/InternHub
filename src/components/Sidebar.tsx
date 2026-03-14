import { Dna, LayoutDashboard, Briefcase, Moon, Sun, LogOut, Lock, BarChart3, UserCircle, ClipboardList, Sparkles, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import type { Dispatch, SetStateAction } from 'react';

export default function Sidebar({ theme, toggleTheme, isOpen, setIsOpen }: { theme: 'light' | 'dark', toggleTheme: () => void, isOpen?: boolean, setIsOpen?: Dispatch<SetStateAction<boolean>> }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('mock_user_session');
        logout();
        navigate('/');
    };

    const hasResume = user?.hasResume ?? false;

    const navItems = user?.role === 'student'
        ? [
            { path: '/dashboard', icon: Dna, label: 'Career DNA', locked: false },
            { path: '/dashboard/discovery', icon: LayoutDashboard, label: 'Discovery', locked: !hasResume },
            { path: '/dashboard/tracker', icon: ClipboardList, label: 'Tracker', locked: !hasResume },
            { path: '/dashboard/advisor', icon: Sparkles, label: 'AI Advisor', locked: !hasResume },
            { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', locked: false },
            { path: '/dashboard/profile', icon: UserCircle, label: 'Profile', locked: false },
        ]
        : [
            { path: '/dashboard', icon: Briefcase, label: 'Verification', locked: false },
            { path: '/dashboard/referrals', icon: LayoutDashboard, label: 'Referrals', locked: false },
            { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', locked: false },
            { path: '/dashboard/profile', icon: UserCircle, label: 'Profile', locked: false },
        ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen?.(false)}
                />
            )}

            <div className={cn(
                "glass-sidebar w-64 min-h-screen fixed md:sticky top-0 h-screen flex flex-col justify-between py-10 px-4 transition-transform duration-300 z-50 overflow-y-auto md:translate-x-0 md:w-24 lg:w-64 shrink-0 shadow-2xl md:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col items-center lg:items-start gap-12 w-full">
                    <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-primary to-indigo-400 rounded-2xl p-2.5 shrink-0 shadow-indigo">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <span className="block md:hidden lg:block font-black text-xl tracking-widest uppercase bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                                InternHub
                            </span>
                        </div>
                        <button
                            className="md:hidden p-2 text-foreground/60 hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"
                            onClick={() => setIsOpen?.(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex flex-col gap-3 w-full px-1">
                        {navItems.map((item) =>
                            item.locked ? (
                                <div
                                    key={item.path}
                                    className="group flex items-center gap-4 p-3 rounded-2xl cursor-not-allowed opacity-40 select-none relative"
                                    title="Upload your resume first to unlock"
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    <span className="block md:hidden lg:block font-semibold tracking-wide text-sm">{item.label}</span>
                                    <Lock className="w-4 h-4 shrink-0 ml-auto block md:hidden lg:block" />
                                </div>
                            ) : (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen?.(false)}
                                    end={item.path === '/dashboard'}
                                    className={({ isActive }) => cn(
                                        "group flex items-center gap-4 p-3 rounded-2xl transition-all duration-200",
                                        isActive
                                            ? "bg-gradient-to-r from-primary to-indigo-400 text-white shadow-indigo"
                                            : "hover:bg-primary/10 text-foreground/70 hover:text-primary"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    <span className="block md:hidden lg:block font-semibold tracking-wide text-sm">{item.label}</span>
                                </NavLink>
                            )
                        )}
                    </nav>
                </div>

                <div className="flex flex-col gap-3 px-1">
                    <button
                        onClick={toggleTheme}
                        className="group flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 hover:bg-primary/10 text-foreground/60 hover:text-primary"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
                        <span className="block md:hidden lg:block font-semibold tracking-wide text-sm">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 hover:bg-red-500/10 text-red-400 hover:text-red-500"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className="block md:hidden lg:block font-semibold tracking-wide text-sm">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
}
