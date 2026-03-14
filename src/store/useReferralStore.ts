import { create } from 'zustand';

export interface ReferralRequest {
    id: string;
    jobId: string;
    studentId: string;
    studentName: string;
    jobTitle: string;
    company: string;
    status: 'pending' | 'accepted' | 'rejected' | 'rejected_elsewhere';
    matchScore: number;
    openings: number;
}

// Seed data linking to the internships in DiscoveryHub
const INITIAL_REFERRALS: ReferralRequest[] = [];

function loadFromStorage(): ReferralRequest[] {
    const stored = localStorage.getItem('mock_referrals');
    if (stored) return JSON.parse(stored);
    return INITIAL_REFERRALS;
}

function saveToStorage(referrals: ReferralRequest[]) {
    localStorage.setItem('mock_referrals', JSON.stringify(referrals));
}

interface ReferralState {
    referrals: ReferralRequest[];
    requestReferral: (req: Omit<ReferralRequest, 'status'>) => void;
    handleAction: (reqId: string, action: 'accepted' | 'rejected', jobId: string, openings: number) => void;
    getStudentReferrals: (studentId: string) => ReferralRequest[];
    getCompanyReferrals: (company: string) => ReferralRequest[];
    reload: () => void;
}

export const useReferralStore = create<ReferralState>((set, get) => ({
    referrals: loadFromStorage(),

    requestReferral: (req) => {
        set((state) => {
            // Find existing request
            const existing = state.referrals.find(
                r => r.jobId === req.jobId && r.studentId === req.studentId
            );

            // If it exists and is NOT rejected, block it
            if (existing && existing.status !== 'rejected' && existing.status !== 'rejected_elsewhere') {
                return state;
            }

            // Remove the old rejected request if it exists
            const filteredReferrals = state.referrals.filter(
                r => !(r.jobId === req.jobId && r.studentId === req.studentId)
            );

            const newRef: ReferralRequest = { ...req, status: 'pending' };
            const updated = [...filteredReferrals, newRef];
            saveToStorage(updated);
            return { referrals: updated };
        });
    },

    handleAction: (reqId, action, jobId, openings) => {
        set((state) => {
            let newRefs = state.referrals.map(r =>
                r.id === reqId ? { ...r, status: action } : r
            ) as ReferralRequest[];

            // Capacity logic: if accepted count reaches openings, auto-reject remaining
            if (action === 'accepted') {
                const acceptedCount = newRefs.filter(r => r.jobId === jobId && r.status === 'accepted').length;
                if (acceptedCount >= openings) {
                    newRefs = newRefs.map(r =>
                        (r.jobId === jobId && r.status === 'pending')
                            ? { ...r, status: 'rejected_elsewhere' as const }
                            : r
                    );
                }
            }

            saveToStorage(newRefs);
            return { referrals: newRefs };
        });
    },

    getStudentReferrals: (studentId) => {
        return get().referrals.filter(r => r.studentId === studentId);
    },

    getCompanyReferrals: (company) => {
        return get().referrals.filter(r => r.company.toLowerCase() === company.toLowerCase());
    },

    reload: () => {
        set({ referrals: loadFromStorage() });
    },
}));
