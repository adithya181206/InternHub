import { useEffect, useRef } from 'react';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { useReferralStore } from '../store/useReferralStore';
import { useChatStore } from '../store/useChatStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useApplicationStore } from '../store/useApplicationStore';

let isSyncing = false;
let initialized = false;

// We proxy localStorage to instantly sync to Firestore when anything changes locally
export function setupStorageProxy() {
    if (initialized) return;
    initialized = true;

    const originalSetItem = localStorage.setItem;

    localStorage.setItem = function(key: string, value: string) {
        // Execute original write
        originalSetItem.apply(this, [key, value]);
        
        // If the write came from our Firestore listener, don't write it back
        if (isSyncing) return;

        // Otherwise write it to Firestore depending on the key mapping
        const user = useAuthStore.getState().user;
        
        if (typeof value === 'string' && value.length > 0) {
            // Global storage keys
            if (['mock_referrals', 'mock_chat_messages'].includes(key)) {
                setDoc(doc(db, 'global', key), { value }).catch(console.error);
            } 
            // User-specific storage keys
            else if (['mock_applications', 'mock_bookmarks'].includes(key) && user) {
                setDoc(doc(db, 'user_data', `${user.uid}_${key}`), { value }).catch(console.error);
            } 
            // Dynamic User Keys (DNA, Resume File)
            else if ((key.startsWith('mock_dna_') || key.startsWith('mock_resume_file_')) && user) {
                // If the key strictly matches the user's uid
                if (key.includes(user.uid)) {
                    setDoc(doc(db, 'user_data', key), { value }).catch(console.error);
                }
            }
        }
    };
}

// React hook to load in App.tsx layout
export function useFirebaseStorageSync() {
    const { user } = useAuthStore();
    const mounted = useRef(false);

    useEffect(() => {
        setupStorageProxy();
        if (!mounted.current) {
            mounted.current = true;
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const cleanupFns: (() => void)[] = [];

        // 1. Listen Global State
        const globalStores = [
            { key: 'mock_referrals', reload: useReferralStore.getState().reload },
            { key: 'mock_chat_messages', reload: useChatStore.getState().reload }
        ];

        globalStores.forEach(({ key, reload }) => {
            const unsub = onSnapshot(doc(db, 'global', key), (docSnap) => {
                if (docSnap.exists() && docSnap.data().value) {
                    isSyncing = true;
                    localStorage.setItem(key, docSnap.data().value);
                    reload();
                    isSyncing = false;
                }
            });
            cleanupFns.push(unsub);
        });

        // 2. Listen User App State
        const userStores = [
            { key: 'mock_applications', reload: useApplicationStore.getState().reload },
            { key: 'mock_bookmarks', reload: useBookmarkStore.getState().reload }
        ];

        userStores.forEach(({ key, reload }) => {
            const unsub = onSnapshot(doc(db, 'user_data', `${user.uid}_${key}`), (docSnap) => {
                if (docSnap.exists() && docSnap.data().value) {
                    isSyncing = true;
                    localStorage.setItem(key, docSnap.data().value);
                    reload();
                    isSyncing = false;
                }
            });
            cleanupFns.push(unsub);
        });

        // 3. Listen DNA/Resume State
        const dynamicKeys = [`mock_dna_${user.uid}`, `mock_resume_file_${user.uid}`];
        dynamicKeys.forEach(key => {
            const unsub = onSnapshot(doc(db, 'user_data', key), (docSnap) => {
                if (docSnap.exists() && docSnap.data().value) {
                    isSyncing = true;
                    localStorage.setItem(key, docSnap.data().value);
                    isSyncing = false;
                    // For DNA, we can dispatch an event if we want the DNA Hub to re-render instantly, 
                    // though usually the student parses and sees it directly. 
                    window.dispatchEvent(new Event(key));
                }
            });
            cleanupFns.push(unsub);
        });

        return () => {
            cleanupFns.forEach(fn => fn());
        };
    }, [user]);
}
