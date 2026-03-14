import { useState, useMemo } from 'react';
import { useApplicationStore, type ApplicationStage, type Application } from '../store/useApplicationStore';
import { useReferralStore } from '../store/useReferralStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import { Plus, X, ChevronRight, GripVertical, StickyNote, Trash2, Send, MessageCircle } from 'lucide-react';
import ChatPanel from '../components/ChatPanel';

const STAGES: { key: ApplicationStage; label: string; color: string }[] = [
    { key: 'applied', label: 'Applied', color: 'from-primary to-indigo-400' },
    { key: 'interviewing', label: 'Interviewing', color: 'from-amber to-yellow-400' },
    { key: 'accepted', label: 'Accepted', color: 'from-emerald to-teal-400' },
    { key: 'rejected', label: 'Rejected', color: 'from-red-500 to-rose-400' },
];

export default function ApplicationTracker() {
    const { user } = useAuthStore();
    const { getStudentReferrals } = useReferralStore();
    const { getUnreadCount } = useChatStore();
    const { applications: manualApplications, addApplication, moveApplication, updateNotes, removeApplication } = useApplicationStore();
    const { addToast } = useNotificationStore();
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCompany, setNewCompany] = useState('');
    const [editNotes, setEditNotes] = useState<string | null>(null);
    const [notesText, setNotesText] = useState('');
    const [chatOpen, setChatOpen] = useState<{ referralId: string; partnerName: string } | null>(null);

    const handleAdd = () => {
        if (!newTitle.trim() || !newCompany.trim()) return;
        addApplication({
            jobId: `manual_${Date.now()}`,
            jobTitle: newTitle.trim(),
            company: newCompany.trim(),
            stage: 'applied',
            notes: '',
        });
        setNewTitle('');
        setNewCompany('');
        setShowAdd(false);
        addToast(`Added ${newTitle} to tracker`, 'success');
    };

    const handleMove = (id: string, direction: 'next' | 'prev') => {
        // Can only move manual applications
        if (id.startsWith('ref_')) return;

        const app = manualApplications.find(a => a.id === id);
        if (!app) return;
        const idx = STAGES.findIndex(s => s.key === app.stage);
        const newIdx = direction === 'next' ? idx + 1 : idx - 1;
        if (newIdx < 0 || newIdx >= STAGES.length) return;
        moveApplication(id, STAGES[newIdx].key);
        addToast(`Moved to ${STAGES[newIdx].label}`, 'info');
    };

    const handleSaveNotes = (id: string) => {
        updateNotes(id, notesText);
        setEditNotes(null);
        addToast('Notes saved', 'success');
    };

    // Dynamically merge manual applications and incoming referrals
    const allApplications = useMemo(() => {
        if (!user) return manualApplications;

        const myReferrals = getStudentReferrals(user.uid);

        // Map ReferralRequest into Application shape for the board
        const mappedReferrals: (Application & { isReferral?: boolean })[] = myReferrals.map(ref => {
            let colStage: ApplicationStage = 'applied'; // pending
            if (ref.status === 'accepted') colStage = 'accepted';
            if (ref.status === 'rejected' || ref.status === 'rejected_elsewhere') colStage = 'rejected';

            return {
                id: `ref_${ref.id}`, // prefix to identify it's a referral
                jobId: ref.jobId,
                jobTitle: ref.jobTitle,
                company: ref.company,
                stage: colStage,
                appliedDate: Date.now(),
                notes: `Match Score: ${ref.matchScore}%`,
                isReferral: true
            };
        });

        return [...manualApplications, ...mappedReferrals];
    }, [user, manualApplications, getStudentReferrals]);

    return (
        <div className="flex flex-col flex-1 pb-10">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Application Tracker</h1>
                    <p className="text-foreground/60 text-sm">Track your applications across all stages.</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="btn-primary-gradient px-4 py-2 text-sm flex items-center gap-2 cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            {/* Add Application Form */}
            {showAdd && (
                <div className="glass-card-static p-5 mb-6 space-y-3">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Job Title"
                            className="w-full md:flex-1 glass-input py-2 px-4 text-sm font-medium outline-none"
                            autoFocus
                        />
                        <input
                            type="text"
                            value={newCompany}
                            onChange={(e) => setNewCompany(e.target.value)}
                            placeholder="Company"
                            className="w-full md:flex-1 glass-input py-2 px-4 text-sm font-medium outline-none"
                        />
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={handleAdd} className="flex-1 md:flex-none btn-primary-gradient px-4 py-2 text-sm cursor-pointer">Add</button>
                            <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-primary/10 rounded-xl cursor-pointer text-foreground/50"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 styled-scrollbar flex-1">
                {STAGES.map((stage) => {
                    const stageApps = allApplications.filter(a => a.stage === stage.key);
                    return (
                        <div key={stage.key} className="min-w-[240px] flex-1 flex flex-col">
                            {/* Column Header */}
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${stage.color} text-white text-sm font-black uppercase tracking-wider mb-3`}>
                                <span className="flex-1">{stage.label}</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{stageApps.length}</span>
                            </div>

                            {/* Cards */}
                            <div className="space-y-3 flex-1">
                                {stageApps.map((app) => (
                                    <div key={app.id} className="glass-card-static p-4 space-y-2 group relative">
                                        <div className="flex items-start gap-2">
                                            {app.isReferral ? (
                                                <Send className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                            ) : (
                                                <GripVertical className="w-4 h-4 text-foreground/20 mt-0.5 shrink-0" />
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-bold text-sm truncate">{app.jobTitle}</h4>
                                                    {app.isReferral && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">Referral</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-foreground/50 font-semibold">{app.company}</p>
                                            </div>

                                            {!app.isReferral && (
                                                <button
                                                    onClick={() => removeApplication(app.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg text-red-500 transition-all cursor-pointer"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {editNotes === app.id ? (
                                            <div className="space-y-1">
                                                <textarea
                                                    value={notesText}
                                                    onChange={(e) => setNotesText(e.target.value)}
                                                    className="w-full glass-input p-2 text-xs font-medium outline-none resize-none h-16"
                                                    placeholder="Add notes..."
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleSaveNotes(app.id)} className="text-xs text-primary font-bold cursor-pointer">Save</button>
                                                    <button onClick={() => setEditNotes(null)} className="text-xs text-foreground/50 font-bold cursor-pointer">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            !app.isReferral && (
                                                <button
                                                    onClick={() => { setEditNotes(app.id); setNotesText(app.notes); }}
                                                    className="flex items-center gap-1 text-[10px] text-foreground/40 hover:text-primary font-semibold cursor-pointer transition-colors"
                                                >
                                                    <StickyNote className="w-3 h-3" />
                                                    {app.notes ? 'Edit Notes' : 'Add Notes'}
                                                </button>
                                            )
                                        )}
                                        {app.notes && editNotes !== app.id && (
                                            <p className="text-[11px] text-foreground/50 italic leading-snug">{app.notes}</p>
                                        )}

                                        {/* Move Buttons */}
                                        {!app.isReferral ? (
                                            <div className="flex justify-between pt-1">
                                                {STAGES.findIndex(s => s.key === app.stage) > 0 && (
                                                    <button
                                                        onClick={() => handleMove(app.id, 'prev')}
                                                        className="text-[10px] text-foreground/40 hover:text-primary font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                                                    >
                                                        <ChevronRight className="w-3 h-3 rotate-180" /> Back
                                                    </button>
                                                )}
                                                <div className="flex-1" />
                                                {STAGES.findIndex(s => s.key === app.stage) < STAGES.length - 1 && (
                                                    <button
                                                        onClick={() => handleMove(app.id, 'next')}
                                                        className="text-[10px] text-foreground/40 hover:text-primary font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                                                    >
                                                        Next <ChevronRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : app.stage === 'accepted' ? (
                                            <div className="pt-2 border-t border-border/50">
                                                <button
                                                    onClick={() => setChatOpen({ referralId: app.id.replace('ref_', ''), partnerName: `${app.company} Alumni` })}
                                                    className="w-full py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 text-xs bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/20 cursor-pointer relative"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    Chat with Alumnus
                                                    {user && getUnreadCount(app.id.replace('ref_', ''), user.uid) > 0 && (
                                                        <span className="absolute top-1 right-2 flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                                {stageApps.length === 0 && (
                                    <div className="text-center py-8 text-foreground/20 text-xs font-bold">
                                        No cards
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chat Panel */}
            {chatOpen && user && (
                <ChatPanel
                    referralId={chatOpen.referralId}
                    currentUserId={user.uid}
                    currentUserName={user.displayName || 'Student'}
                    currentUserRole="student"
                    partnerName={chatOpen.partnerName}
                    onClose={() => setChatOpen(null)}
                />
            )}
        </div>
    );
}
