import { create } from 'zustand';

function loadBookmarks(): string[] {
    const stored = localStorage.getItem('mock_bookmarks');
    return stored ? JSON.parse(stored) : [];
}

function saveBookmarks(bookmarks: string[]) {
    localStorage.setItem('mock_bookmarks', JSON.stringify(bookmarks));
}

interface BookmarkState {
    bookmarks: string[]; // array of job IDs
    toggleBookmark: (jobId: string) => void;
    isBookmarked: (jobId: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
    bookmarks: loadBookmarks(),
    toggleBookmark: (jobId) => {
        set((state) => {
            const exists = state.bookmarks.includes(jobId);
            const updated = exists
                ? state.bookmarks.filter(id => id !== jobId)
                : [...state.bookmarks, jobId];
            saveBookmarks(updated);
            return { bookmarks: updated };
        });
    },
    isBookmarked: (jobId) => get().bookmarks.includes(jobId),
}));
