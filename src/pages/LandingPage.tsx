import { useState } from 'react';
import { Briefcase, UserCircle, Moon, Sun, MonitorSmartphone, ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, type UserRole, type AppUser } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../lib/firebase';
import ParticleBackground from '../components/ParticleBackground';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function LandingPage({ toggleTheme, theme }: { toggleTheme: () => void, theme: 'light' | 'dark' }) {
    const navigate = useNavigate();

    const [selectedRole, setSelectedRole] = useState<UserRole>(null);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await setPersistence(auth, browserSessionPersistence);
            let userCredential;
            let mockUser;

            if (authMode === 'signup') {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);

                mockUser = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email || email,
                    role: selectedRole,
                    isVerified: false,
                    verifiedCompany: null,
                    displayName: selectedRole === 'student' ? 'Student Demo' : 'Alumnus Demo',
                    dailyApiCount: 0,
                    hasResume: false
                };

                await setDoc(doc(db, 'users', userCredential.user.uid), mockUser);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

                if (userDoc.exists()) {
                    mockUser = userDoc.data();
                } else {
                    // Fallback if they somehow skip signup logic
                    mockUser = {
                        uid: userCredential.user.uid,
                        email: userCredential.user.email || email,
                        role: selectedRole,
                        isVerified: false,
                        verifiedCompany: null,
                        displayName: 'Demo User',
                        dailyApiCount: 0,
                        hasResume: false
                    };
                    await setDoc(doc(db, 'users', userCredential.user.uid), mockUser);
                }
            }

            sessionStorage.setItem('mock_user_session', JSON.stringify(mockUser));
            useAuthStore.getState().setUser(mockUser as AppUser);
            navigate('/dashboard');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                alert('Invalid email or password.\n\nNote: If you registered using "Continue with Google", you must use the Google button below to sign in. Your Google password will not work here.');
            } else if (error.code === 'auth/email-already-in-use') {
                alert('An account already exists with this email.\n\nIf you originally signed up with Google, please switch to "Sign In" and click "Continue with Google".');
            } else if (error.code === 'auth/operation-not-allowed') {
                alert('Email and Password login is not enabled for this application. Please use "Continue with Google".');
            } else {
                alert(error.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        try {
            await setPersistence(auth, browserSessionPersistence);
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

            let mockUser;
            if (userDoc.exists()) {
                mockUser = userDoc.data();
            } else {
                mockUser = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email || 'google@example.com',
                    role: selectedRole,
                    isVerified: false,
                    verifiedCompany: null,
                    displayName: userCredential.user.displayName || (selectedRole === 'student' ? 'Google Student' : 'Google Alumnus'),
                    dailyApiCount: 0,
                    hasResume: false
                };
                await setDoc(doc(db, 'users', userCredential.user.uid), mockUser);
            }

            sessionStorage.setItem('mock_user_session', JSON.stringify(mockUser));
            useAuthStore.getState().setUser(mockUser as AppUser);
            navigate('/dashboard');
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
            <ParticleBackground />

            {/* Animated gradient orbs */}
            <div className="glass-orb-1 z-0 -top-20 -left-20" />
            <div className="glass-orb-2 z-0 top-1/3 -right-16" />
            <div className="glass-orb-3 z-0 -bottom-10 left-1/3" />

            <button
                onClick={toggleTheme}
                className="absolute top-8 right-8 p-3 rounded-2xl hover:bg-primary/10 transition-all duration-200 z-50 backdrop-blur-sm border border-transparent hover:border-primary/20"
            >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>

            <AnimatePresence mode="wait">
                {!selectedRole ? (
                    <motion.div
                        key="role-selection"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ duration: 0.4 }}
                        className="max-w-4xl w-full flex flex-col items-center gap-12 relative z-20"
                    >
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary to-indigo-400 text-white rounded-3rem mb-8 shadow-indigo">
                                <Briefcase className="w-12 h-12" />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground">
                                Intern<span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">Hub</span>
                            </h1>
                            <p className="text-lg text-foreground/60 max-w-2xl font-medium tracking-wide">
                                The premium network connecting ambitious students with verified professionals at top-tier companies.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
                            <button
                                onClick={() => setSelectedRole('student')}
                                className="group relative flex flex-col items-center p-8 md:p-12 glass-card cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[2.5rem]" />
                                <MonitorSmartphone className="w-14 h-14 mb-6 text-primary group-hover:scale-110 transition-transform duration-200" />
                                <h2 className="text-xl font-bold tracking-widest mb-2">Student DNA</h2>
                                <p className="text-foreground/60 text-center text-sm">Uncover your Career DNA and get referred by top Alumni.</p>
                            </button>

                            <button
                                onClick={() => setSelectedRole('alumnus')}
                                className="group relative flex flex-col items-center p-8 md:p-12 bg-gradient-to-br from-primary to-indigo-500 text-white rounded-[2.5rem] shadow-indigo hover:shadow-indigo-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[2.5rem]" />
                                <UserCircle className="w-14 h-14 mb-6 group-hover:scale-110 transition-transform duration-200" />
                                <h2 className="text-xl font-bold tracking-widest mb-2">Alumnus Desk</h2>
                                <p className="text-white/80 text-center text-sm">Refer verified talent and manage your company requests.</p>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="auth-form"
                        initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-md relative z-20"
                    >
                        <button
                            onClick={() => { setSelectedRole(null); setEmail(''); setPassword(''); }}
                            className="flex items-center gap-2 text-foreground/60 hover:text-primary font-semibold mb-8 transition-colors duration-200 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                            Back to Roles
                        </button>

                        <div
                            className="glass-card-static p-6 md:p-10 relative overflow-hidden z-20 w-full"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-emerald/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                            <div className="text-center mb-8 relative z-10">
                                <h2 className="text-3xl font-black mb-2">
                                    {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                                </h2>
                                <p className="text-foreground/60 font-medium">
                                    Continuing as <span className="text-primary font-bold uppercase tracking-wider">{selectedRole}</span>
                                </p>
                            </div>

                            <form onSubmit={handleEmailAuth} className="space-y-5 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold text-foreground/60 mb-2 uppercase tracking-widest pl-1">Email</label>
                                    <div className="relative group/input">
                                        <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within/input:text-primary transition-colors duration-200" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full glass-input py-3 pl-12 pr-4 font-medium outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-foreground/60 mb-2 uppercase tracking-widest pl-1">Password</label>
                                    <div className="relative group/input">
                                        <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within/input:text-primary transition-colors duration-200" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full glass-input py-3 pl-12 pr-12 font-medium outline-none font-mono tracking-wider"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary-gradient py-4 flex justify-center items-center mt-2"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
                                </button>
                            </form>

                            <div className="relative my-8 z-10">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <div className="relative flex justify-center text-sm font-bold">
                                    <span className="px-4 text-foreground/40 uppercase tracking-widest" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>Or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleAuth}
                                disabled={loading}
                                className="w-full glass-input hover:border-primary text-foreground font-semibold py-3.5 flex justify-center items-center gap-3 relative z-10 cursor-pointer"
                            >
                                <GoogleIcon />
                                Continue with Google
                            </button>

                            <div className="mt-8 text-center text-sm font-semibold relative z-10">
                                <span className="text-foreground/60">
                                    {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                                    className="text-primary hover:underline transition-all duration-200"
                                >
                                    {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
