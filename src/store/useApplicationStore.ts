import { create } from 'zustand';

export type ApplicationStage = 'applied' | 'interviewing' | 'accepted' | 'rejected';

export interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    company: string;
    stage: ApplicationStage;
    appliedDate: number;
    notes: string;
    isReferral?: boolean;
}

function loadApplications(): Application[] {
    const stored = localStorage.getItem('mock_applications');
    return stored ? JSON.parse(stored) : [];
}

function saveApplications(apps: Application[]) {
    localStorage.setItem('mock_applications', JSON.stringify(apps));
}

interface ApplicationState {
    applications: Application[];
    addApplication: (app: Omit<Application, 'id' | 'appliedDate'>) => void;
    moveApplication: (id: string, stage: ApplicationStage) => void;
    updateNotes: (id: string, notes: string) => void;
    removeApplication: (id: string) => void;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
    applications: loadApplications(),

    addApplication: (app) => {
        set((state) => {
            const exists = state.applications.some(a => a.jobId === app.jobId);
            if (exists) return state;
            const newApp: Application = {
                ...app,
                id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                appliedDate: Date.now(),
            };
            const updated = [...state.applications, newApp];
            saveApplications(updated);
            return { applications: updated };
        });
    },

    moveApplication: (id, stage) => {
        set((state) => {
            const updated = state.applications.map(a =>
                a.id === id ? { ...a, stage } : a
            );
            saveApplications(updated);
            return { applications: updated };
        });
    },

    updateNotes: (id, notes) => {
        set((state) => {
            const updated = state.applications.map(a =>
                a.id === id ? { ...a, notes } : a
            );
            saveApplications(updated);
            return { applications: updated };
        });
    },

    removeApplication: (id) => {
        set((state) => {
            const updated = state.applications.filter(a => a.id !== id);
            saveApplications(updated);
            return { applications: updated };
        });
    },
}));
