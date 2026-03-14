import { useEffect, useState } from 'react';
import { UserCheck, UserX, Users, Briefcase, Eye, X, GraduationCap, Code2, MessageCircle, FileText, Copy, Mail } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useReferralStore } from '../store/useReferralStore';
import { useNotificationStore } from '../store/useNotificationStore';
import ChatPanel from '../components/ChatPanel';

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
    const { addToast } = useNotificationStore();
    const [profileModal, setProfileModal] = useState<{ open: boolean; studentName: string; studentId: string; dna: StudentDNA | null }>({ open: false, studentName: '', studentId: '', dna: null });
    const [chatOpen, setChatOpen] = useState<{ referralId: string; partnerName: string } | null>(null);
    const [emailModal, setEmailModal] = useState<{ open: boolean; studentName: string; jobTitle: string; company: string } | null>(null);

    useEffect(() => { reload(); }, [reload]);
    useEffect(() => {
        const interval = setInterval(() => reload(), 2000);
        return () => clearInterval(interval);
    }, [reload]);

    const companyReferrals = user?.verifiedCompany
        ? referrals.filter(r => r.company.toLowerCase() === user.verifiedCompany!.toLowerCase())
        : referrals;

    const pendingCount = companyReferrals.filter(r => r.status === 'pending').length;

    const handleViewProfile = (studentId: string, studentName: string) => {
        const stored = localStorage.getItem(`mock_dna_${studentId}`);
        const dna: StudentDNA | null = stored ? JSON.parse(stored) : null;
        setProfileModal({ open: true, studentName, studentId, dna });
    };

    const handleApprove = (reqId: string, jobId: string, openings: number, studentName: string, jobTitle: string, company: string) => {
        handleAction(reqId, 'accepted', jobId, openings);
        addToast(`Approved referral for ${studentName}`, 'success');
        setEmailModal({ open: true, studentName, jobTitle, company });
    };

    const handleReject = (reqId: string, jobId: string, openings: number, studentName: string) => {
        handleAction(reqId, 'rejected', jobId, openings);
        addToast(`Declined referral for ${studentName}`, 'info');
    };

    const generateEmailTemplate = () => {
        if (!emailModal || !user) return '';
        return `Subject: Referral for ${emailModal.studentName} — ${emailModal.jobTitle} at ${emailModal.company}

Dear Hiring Team,

I am writing to refer ${emailModal.studentName} for the ${emailModal.jobTitle} position at ${emailModal.company}.

Having reviewed their profile on InternHub, I believe they would be an excellent addition to the team. Their technical skills and academic background align well with the requirements of this role.

I would appreciate it if you could consider their application. Please feel free to reach out if you need any additional information.

Best regards,
${user.displayName || 'Alumni'}
${user.email}
${user.verifiedCompany} Alumni`;
    };

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(generateEmailTemplate());
        addToast('Email template copied to clipboard!', 'success');
    };

    // Check if resume file exists for a student
    const getResumeFile = (studentId: string): string | null => {
        return localStorage.getItem(`mock_resume_file_${studentId}`);
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-4 styled-scrollbar flex-1 pb-10">
                    {companyReferrals.map((req) => (
                        <div key={req.id} className="group flex flex-col justify-between glass-card p-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[2.5rem] pointer-events-none" />

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-black truncate">{req.studentName}</h3>
                                        <span className="bg-emerald/10 text-emerald px-3 py-1 rounded-xl text-xs font-bold shrink-0">{req.matchScore}% Match</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-foreground/70 font-medium text-sm">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="truncate">{req.jobTitle}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4 flex-wrap">
                                <button
                                    onClick={() => handleViewProfile(req.studentId, req.studentName)}
                                    className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline transition-all duration-200 cursor-pointer"
                                >
                                    <Eye className="w-4 h-4" /> View Profile
                                </button>
                                {req.status === 'accepted' && (
                                    <>
                                        <button
                                            onClick={() => setChatOpen({ referralId: req.id, partnerName: req.studentName })}
                                            className="flex items-center gap-2 text-emerald font-semibold text-sm hover:underline transition-all duration-200 cursor-pointer"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Chat
                                        </button>
                                        <button
                                            onClick={() => setEmailModal({ open: true, studentName: req.studentName, jobTitle: req.jobTitle, company: req.company })}
                                            className="flex items-center gap-2 text-amber font-semibold text-sm hover:underline transition-all duration-200 cursor-pointer"
                                        >
                                            <Mail className="w-4 h-4" /> Email Template
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="mt-auto pt-6 border-t border-border/50 flex justify-between items-center gap-4">
                                <div className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                                    {req.status === 'pending' ? 'Action Required' : req.status === 'accepted' ? 'Referral Sent' : req.status === 'rejected_elsewhere' ? 'Capacity Reached' : 'Rejected'}
                                </div>
                                <div className="flex gap-3">
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
                                                onClick={() => handleApprove(req.id, req.jobId, req.openings, req.studentName, req.jobTitle, req.company)}
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

            {/* Student Profile Modal */}
            {profileModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setProfileModal({ open: false, studentName: '', studentId: '', dna: null })} />
                    <div className="relative glass-card-static w-full max-w-2xl max-h-[85vh] overflow-y-auto styled-scrollbar p-8 animate-in zoom-in-95 fade-in duration-200">
                        <button onClick={() => setProfileModal({ open: false, studentName: '', studentId: '', dna: null })} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-primary/10 text-foreground/50 hover:text-foreground transition-all duration-200 cursor-pointer z-10">
                            <X className="w-5 h-5" />
                        </button>

                        {profileModal.dna ? (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-primary to-indigo-500 text-white p-6 rounded-[2rem] shadow-indigo relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
                                    <h2 className="text-2xl font-black tracking-widest uppercase mb-2 relative z-10">
                                        {profileModal.dna.extractedName || profileModal.studentName}
                                    </h2>
                                    <p className="text-sm opacity-90 font-medium leading-relaxed max-w-xl relative z-10">
                                        {profileModal.dna.summary || 'No summary available.'}
                                    </p>
                                </div>

                                {/* Resume Preview */}
                                {getResumeFile(profileModal.studentId) && (
                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">Resume File Available</p>
                                            <p className="text-xs text-foreground/50">Student's uploaded resume</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const data = getResumeFile(profileModal.studentId);
                                                if (data) {
                                                    const win = window.open();
                                                    if (win) {
                                                        win.document.write(`<iframe src="${data}" width="100%" height="100%" style="border:none;position:absolute;inset:0"></iframe>`);
                                                    }
                                                }
                                            }}
                                            className="px-3 py-1.5 text-xs btn-primary-gradient cursor-pointer"
                                        >
                                            View Resume
                                        </button>
                                    </div>
                                )}

                                {profileModal.dna.technicalSkills && profileModal.dna.technicalSkills.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold tracking-widest uppercase text-foreground/60 mb-3 flex items-center gap-2">
                                            <Code2 className="w-4 h-4 text-primary" /> Technical Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profileModal.dna.technicalSkills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl font-semibold text-sm border border-primary/20">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profileModal.dna.education && profileModal.dna.education.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold tracking-widest uppercase text-foreground/60 mb-3 flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-emerald" /> Education
                                        </h3>
                                        <div className="space-y-3">
                                            {profileModal.dna.education.map((edu, i) => (
                                                <div key={i}><span className="font-black">{edu.degree}</span><br /><span className="text-foreground/60 text-sm">{edu.institution} &bull; {edu.year}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profileModal.dna.experience && profileModal.dna.experience.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold tracking-widest uppercase text-foreground/60 mb-3 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-amber" /> Experience
                                        </h3>
                                        <div className="space-y-4">
                                            {profileModal.dna.experience.map((exp, i) => (
                                                <div key={i} className="relative pl-5 border-l-2 border-primary/20">
                                                    <div className="absolute w-2.5 h-2.5 bg-gradient-to-r from-primary to-indigo-400 rounded-full -left-[6px] top-1.5" />
                                                    <h4 className="font-black">{exp.role}</h4>
                                                    <p className="text-primary font-bold text-sm">{exp.company} &bull; <span className="text-foreground/60">{exp.period}</span></p>
                                                    <p className="text-foreground/70 text-sm mt-1">{exp.details}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profileModal.dna.projects && profileModal.dna.projects.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold tracking-widest uppercase text-foreground/60 mb-3 flex items-center gap-2">
                                            <Code2 className="w-4 h-4 text-indigo-400" /> Key Projects
                                        </h3>
                                        <div className="grid gap-4">
                                            {profileModal.dna.projects.map((proj, i) => (
                                                <div key={i} className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                    <h4 className="font-black text-lg">{proj.title}</h4>
                                                    <p className="text-primary font-bold text-xs uppercase tracking-wider mb-2">{proj.tech}</p>
                                                    <p className="text-foreground/70 text-sm leading-relaxed italic">"{proj.details}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Eye className="w-12 h-12 text-foreground/20 mb-4" />
                                <h3 className="text-xl font-bold mb-2">No Profile Available</h3>
                                <p className="text-foreground/50 text-sm max-w-sm">This student hasn't uploaded their resume yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Email Template Modal */}
            {emailModal?.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEmailModal(null)} />
                    <div className="relative glass-card-static w-full max-w-lg p-8 animate-in zoom-in-95 fade-in duration-200">
                        <button onClick={() => setEmailModal(null)} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-primary/10 text-foreground/50 hover:text-foreground transition-all duration-200 cursor-pointer z-10">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2 bg-amber/10 rounded-xl"><Mail className="w-5 h-5 text-amber" /></div>
                            <div>
                                <h3 className="font-black text-lg">Referral Email Template</h3>
                                <p className="text-xs text-foreground/50 font-medium">Copy and send to your HR team</p>
                            </div>
                        </div>
                        <pre className="glass-input p-4 text-xs font-medium leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto styled-scrollbar">
                            {generateEmailTemplate()}
                        </pre>
                        <button onClick={handleCopyEmail} className="mt-4 w-full btn-primary-gradient py-3 flex items-center justify-center gap-2 cursor-pointer">
                            <Copy className="w-4 h-4" /> Copy to Clipboard
                        </button>
                    </div>
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
