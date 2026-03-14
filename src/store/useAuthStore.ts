import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export type UserRole = 'student' | 'alumnus' | null;

export interface AppUser {
    uid: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    verifiedCompany: string | null;
    displayName: string | null;
    dailyApiCount: number;
    hasResume: boolean;
}

interface AuthState {
    user: AppUser | null;
    isLoading: boolean;
    setUser: (user: AppUser | null) => void;
    setRole: (role: UserRole) => void;
    setLoading: (isLoading: boolean) => void;
    updateUser: (data: Partial<AppUser>) => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setRole: (role) =>
        set((state) => ({
            user: state.user ? { ...state.user, role } : null
        })),
    setLoading: (isLoading) => set({ isLoading }),
    updateUser: async (data) => {
        set((state) => {
            const updated = state.user ? { ...state.user, ...data } : null;
            if (updated) {
                // Keep local session storage as backup for multi-tab
                sessionStorage.setItem('mock_user_session', JSON.stringify(updated));
                // Update Firestore
                updateDoc(doc(db, 'users', updated.uid), data as any).catch(console.error);
            }
            return { user: updated };
        });
    },
    logout: async () => {
        sessionStorage.removeItem('mock_user_session');
        await signOut(auth);
        set({ user: null });
    },
}));

// Initialize Firebase Auth Listener
if (typeof window !== 'undefined') {
    // Safety timeout: if Firebase doesn't respond within 5s, stop loading
    const authTimeout = setTimeout(() => {
        if (useAuthStore.getState().isLoading) {
            useAuthStore.getState().setLoading(false);
        }
    }, 5000);

    onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(authTimeout);
        if (firebaseUser) {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data() as AppUser;
                useAuthStore.getState().setUser(userData);
                sessionStorage.setItem('mock_user_session', JSON.stringify(userData));
            } else {
                // If they logged in but don't have a doc, it means we need to wait
                // for LandingPage to create it (e.g. they just signed up via Google)
                // We don't automatically clear them out here.
            }
        } else {
            useAuthStore.getState().setUser(null);
            sessionStorage.removeItem('mock_user_session');
        }
        useAuthStore.getState().setLoading(false);
    });
}
