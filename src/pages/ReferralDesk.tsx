import { useEffect, useState } from 'react';
import { UserCheck, UserX, Users, Briefcase, Eye, MessageCircle, FileText, Copy, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { useReferralStore } from '../store/useReferralStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import ChatPanel from '../components/ChatPanel';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface StudentDNA {
    extractedName: string | null;
    education: Array<{ degree: string; institution: string; year: string }> | null;
    experience: Array<{ role: string; company: string; period: string; details: string }> | null;
    projects: Array<{ title: string; tech: string; details: string }> | null;
    technicalSkills: string[] | null;
    summary: string | null;
}

export default function ReferralDesk() {
    const { user } = useAuthStore();
    const { referrals, handleAction, reload } = useReferralStore();
    const { getUnreadCount } = useChatStore();
    const { addToast } = useNotificationStore();
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
    const [chatOpen, setChatOpen] = useState<{ referralId: string; partnerName: string } | null>(null);
    const [dnaCache, setDnaCache] = useState<Record<string, StudentDNA | null>>({});
    const [resumeCache, setResumeCache] = useState<Record<string, string | null>>({});

    useEffect(() => { reload(); }, [reload]);
    useEffect(() => {
        const interval = setInterval(() => reload(), 2000);
        return () => clearInterval(interval);
    }, [reload]);

    const companyReferrals = user?.verifiedCompany
        ? referrals.filter(r => r.company.toLowerCase() === user.verifiedCompany!.toLowerCase())
        : referrals;

    const pendingCount = companyReferrals.filter(r => r.status === 'pending').length;

    const handleViewProfile = async (reqId: string, studentId: string) => {
        if (activeProfileId === reqId) {
            setActiveProfileId(null);
        } else {
            setActiveProfileId(reqId);
            setActiveEmailId(null);
            
            if (dnaCache[studentId] === undefined) {
                try {
                    const dnaDoc = await getDoc(doc(db, 'user_data', `mock_dna_${studentId}`));
                    setDnaCache(prev => ({ ...prev, [studentId]: dnaDoc.exists() && dnaDoc.data().value ? JSON.parse(dnaDoc.data().value) : null }));
                    
                    const resumeDoc = await getDoc(doc(db, 'user_data', `mock_resume_file_${studentId}`));
                    setResumeCache(prev => ({ ...prev, [studentId]: resumeDoc.exists() ? resumeDoc.data().value : null }));
                } catch(e) { console.error(e); }
            }
        }
    };

    const handleApprove = (reqId: string, jobId: string, openings: number, studentName: string) => {
        handleAction(reqId, 'accepted', jobId, openings);
        addToast(`Approved referral for ${studentName}`, 'success');
        setActiveEmailId(reqId);
        setActiveProfileId(null);
    };

    const handleReject = (reqId: string, jobId: string, openings: number, studentName: string) => {
        handleAction(reqId, 'rejected', jobId, openings);
        addToast(`Declined referral for ${studentName}`, 'info');
    };

    const generateEmailTemplate = (req: any) => {
        if (!req || !user) return '';
        return `Subject: Referral for ${req.studentName} — ${req.jobTitle} at ${req.company}

Dear Hiring Team,

I am writing to refer ${req.studentName} for the ${req.jobTitle} position at ${req.company}.

Having reviewed their profile on InternHub, I believe they would be an excellent addition to the team. Their technical skills and academic background align well with the requirements of this role.

I would appreciate it if you could consider their application. Please feel free to reach out if you need any additional information.

Best regards,
${user.displayName || 'Alumni'}
${user.email}
${user.verifiedCompany} Alumni`;
    };

    const handleCopyEmail = (req: any) => {
        navigator.clipboard.writeText(generateEmailTemplate(req));
        addToast('Email template copied to clipboard!', 'success');
    };

    const getStudentDNA = (studentId: string): StudentDNA | null => {
        return dnaCache[studentId] || null;
    };

    const getResumeFile = (studentId: string): string | null => {
        return resumeCache[studentId] || null;
    };

    return (
        <div className="flex flex-col flex-1 p-4 md:p-8">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2 text-foreground">Referral Desk</h1>
                    <p className="text-foreground/60 text-sm font-medium">Manage incoming requests for <strong className="text-primary">{user?.verifiedCompany}</strong>.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-2xl font-bold border border-primary/20 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{pendingCount} Pending</span>
                </div>
            </div>

            {companyReferrals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                    <Users className="w-14 h-14 mb-4 text-primary/30" />
                    <h3 className="text-xl font-bold mb-2">No Requests Yet</h3>
                    <p className="text-foreground/60 max-w-sm mb-4 text-sm">When students request referrals for positions at <strong>{user?.verifiedCompany}</strong>, they'll appear here.</p>
                    <p className="text-xs text-foreground/40 max-w-sm bg-primary/5 p-3 rounded-xl border border-primary/10">
                        <strong>Hint:</strong> Ensure your verified company matches one of the listed jobs (Google, Vercel, OpenAI, Stripe, Microsoft, Amazon, Meta, Netflix, Apple, Tesla, Adobe, Spotify).
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2 sm:pr-4 styled-scrollbar flex-1 pb-10">
                    {companyReferrals.map((req) => (
                        <div key={req.id} className="group flex flex-col justify-between glass-card p-5 md:p-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[2.5rem] pointer-events-none" />

                            <div className="flex flex-col lg:flex-row justify-between items-start mb-4 gap-3">
                                <div className="flex-1 min-w-0 w-full">
                                    <h3 className="text-lg md:text-2xl font-black truncate">{req.studentName}</h3>
                                    <div className="flex items-center gap-2 text-foreground/70 font-medium text-sm">
                                        <Briefcase className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{req.jobTitle}</span>
                                    </div>
                                </div>
                                <div className="bg-emerald/10 text-emerald px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 shadow-sm border border-emerald/20 self-start lg:self-center">
                                    {req.matchScore}% Match
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4 flex-wrap">
                                <button
                                    onClick={() => handleViewProfile(req.id, req.studentId)}
                                    className={cn(
                                        "flex items-center gap-2 font-semibold text-sm transition-all duration-200 cursor-pointer",
                                        activeProfileId === req.id ? "text-primary bg-primary/10 px-3 py-1.5 rounded-xl shadow-inner" : "text-primary hover:underline"
                                    )}
                                >
                                    <Eye className="w-4 h-4" /> {activeProfileId === req.id ? 'Hide Profile' : 'View Profile'}
                                </button>
                                {req.status === 'accepted' && (
                                    <>
                                        <button
                                            onClick={() => setChatOpen({ referralId: req.id, partnerName: req.studentName })}
                                            className="flex items-center gap-2 text-emerald font-semibold text-sm hover:underline transition-all duration-200 cursor-pointer relative"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Chat
                                            {user && getUnreadCount(req.id, user.uid) > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (activeEmailId === req.id) setActiveEmailId(null);
                                                else {
                                                    setActiveEmailId(req.id);
                                                    setActiveProfileId(null);
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 font-semibold text-sm transition-all duration-200 cursor-pointer",
                                                activeEmailId === req.id ? "text-amber bg-amber/10 px-3 py-1.5 rounded-xl shadow-inner" : "text-amber hover:underline"
                                            )}
                                        >
                                            <Mail className="w-4 h-4" /> {activeEmailId === req.id ? 'Hide Template' : 'Email Template'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Inline Profile View */}
                            {activeProfileId === req.id && (
                                <div className="mt-4 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {getStudentDNA(req.studentId) ? (
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-br from-primary to-indigo-500 text-white p-5 rounded-2xl shadow-indigo relative overflow-hidden">
                                                <p className="text-xs opacity-90 font-medium leading-relaxed italic">
                                                    {getStudentDNA(req.studentId)?.summary || 'No summary available.'}
                                                </p>
                                            </div>

                                            {/* Resume Preview */}
                                            {getResumeFile(req.studentId) && (
                                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold">Resume Available</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const data = getResumeFile(req.studentId);
                                                            if (data) {
                                                                const win = window.open();
                                                                if (win) {
                                                                    win.document.write(`<iframe src="${data}" width="100%" height="100%" style="border:none;position:absolute;inset:0"></iframe>`);
                                                                }
                                                            }
                                                        }}
                                                        className="px-3 py-1 text-[10px] btn-primary-gradient cursor-pointer"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            )}

                                            {getStudentDNA(req.studentId)?.technicalSkills && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {getStudentDNA(req.studentId)?.technicalSkills?.map((skill, i) => (
                                                        <span key={i} className="px-2 py-1 bg-primary/5 text-primary rounded-lg font-bold text-[10px] border border-primary/10">{skill}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {getStudentDNA(req.studentId)?.experience && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Latest Experience</h4>
                                                    {getStudentDNA(req.studentId)?.experience?.slice(0, 1).map((exp, i) => (
                                                        <div key={i} className="pl-3 border-l-2 border-primary/20">
                                                            <h4 className="font-bold text-sm">{exp.role}</h4>
                                                            <p className="text-primary font-bold text-[10px]">{exp.company}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center opacity-50">
                                            <Eye className="w-8 h-8 mx-auto mb-2" />
                                            <p className="text-xs font-bold">No Profile Available</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Inline Email Template */}
                            {activeEmailId === req.id && (
                                <div className="mt-4 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-amber/10 rounded-lg text-amber"><Mail className="w-4 h-4" /></div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Reference Template</p>
                                        </div>
                                        <button onClick={() => handleCopyEmail(req)} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors cursor-pointer" title="Copy Template">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <pre className="glass-input p-4 text-[11px] font-medium leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto styled-scrollbar border border-white/5">
                                        {generateEmailTemplate(req)}
                                    </pre>
                                </div>
                            )}

                            <div className="mt-auto pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                                    {req.status === 'pending' ? 'Action Required' : req.status === 'accepted' ? 'Referral Sent' : req.status === 'rejected_elsewhere' ? 'Capacity Reached' : 'Rejected'}
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto justify-end">
                                    {req.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleReject(req.id, req.jobId, req.openings, req.studentName)}
                                                className="p-3 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
                                                title="Decline"
                                            >
                                                <UserX className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.id, req.jobId, req.openings, req.studentName)}
                                                className="px-6 py-3 btn-primary-gradient text-sm rounded-2xl flex items-center gap-2 cursor-pointer"
                                            >
                                                <UserCheck className="w-4 h-4" /> Approve
                                            </button>
                                        </>
                                    )}
                                    {req.status === 'accepted' && (
                                        <div className="px-6 py-3 bg-emerald/10 text-emerald font-black uppercase tracking-wider text-sm rounded-xl flex items-center gap-2">
                                            <UserCheck className="w-4 h-4" /> Approved
                                        </div>
                                    )}
                                    {(req.status === 'rejected' || req.status === 'rejected_elsewhere') && (
                                        <div className="px-6 py-3 bg-red-500/10 text-red-500 font-bold uppercase tracking-wider text-sm rounded-xl flex items-center gap-2">
                                            <UserX className="w-4 h-4" /> Declined
                                        </div>
                                    )}
                                </div>
                            </div>

                            {req.status === 'rejected_elsewhere' && (
                                <div className="absolute text-[10px] top-6 right-6 text-red-500 font-black tracking-widest uppercase opacity-70">
                                    Auto-rejected (Role Full)
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Chat Panel */}
            {chatOpen && user && (
                <ChatPanel
                    referralId={chatOpen.referralId}
                    currentUserId={user.uid}
                    currentUserName={user.displayName || 'Alumni'}
                    currentUserRole="alumnus"
                    partnerName={chatOpen.partnerName}
                    onClose={() => setChatOpen(null)}
                />
            )}
        </div>
    );
}
