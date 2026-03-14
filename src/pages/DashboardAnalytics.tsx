import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useReferralStore, type ReferralRequest } from '../store/useReferralStore';
import { useChatStore } from '../store/useChatStore';
import { BarChart3, TrendingUp, Users, CheckCircle2, XCircle, Clock, Briefcase, X } from 'lucide-react';

export default function DashboardAnalytics() {
    const { user } = useAuthStore();
    const { referrals } = useReferralStore();
    const { messages } = useChatStore();
    const [selectedStat, setSelectedStat] = useState<{ title: string; data: ReferralRequest[] } | null>(null);

    // Shared Modal Component Helper
    const renderSharedModal = () => {
        if (!selectedStat) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedStat(null)} />
                <div className="relative w-full max-w-2xl glass-card-static flex flex-col max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-6 border-b border-border/50 shrink-0">
                        <div>
                            <h2 className="text-xl font-black">{selectedStat.title}</h2>
                            <p className="text-sm text-foreground/50">{selectedStat.data.length} request(s) found</p>
                        </div>
                        <button onClick={() => setSelectedStat(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-foreground/50 hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-6 space-y-4 styled-scrollbar flex-1">
                        {selectedStat.data.length === 0 ? (
                            <p className="text-center text-foreground/50 py-8 font-semibold">No requests in this list.</p>
                        ) : (
                            selectedStat.data.map(req => (
                                <div key={req.id} className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                    <div>
                                        <h4 className="font-bold text-lg">
                                            {user?.role === 'student' ? req.company : req.studentName}
                                        </h4>
                                        <p className="text-xs font-semibold text-foreground/60">{req.jobTitle}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest mb-1">
                                            {req.matchScore}% MATCH
                                        </div>
                                        <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-black mt-1">
                                            {req.status === 'pending' ? 'Pending' : req.status === 'accepted' ? 'Approved' : 'Declined'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (user?.role === 'student') {
        const myReferrals = referrals.filter(r => r.studentId === user.uid);
        const accepted = myReferrals.filter(r => r.status === 'accepted').length;
        const rejected = myReferrals.filter(r => r.status === 'rejected' || r.status === 'rejected_elsewhere').length;
        const pending = myReferrals.filter(r => r.status === 'pending').length;
        const total = myReferrals.length;
        const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
        const avgMatch = total > 0 ? Math.round(myReferrals.reduce((sum, r) => sum + r.matchScore, 0) / total) : 0;
        const myChats = messages.filter(m => m.senderId === user.uid).length;

        // Top companies by referral count
        const companyCounts: Record<string, number> = {};
        myReferrals.forEach(r => { companyCounts[r.company] = (companyCounts[r.company] || 0) + 1; });
        const topCompanies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxCount = topCompanies.length > 0 ? topCompanies[0][1] : 1;

        return (
            <div className="flex flex-col flex-1 pb-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-1">Analytics</h1>
                    <p className="text-foreground/60 text-sm">Track your referral journey and career progress.</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <StatCard icon={<Briefcase className="w-5 h-5" />} label="Total Requests" value={total} color="primary" onClick={() => setSelectedStat({ title: 'Total Requests', data: myReferrals })} />
                    <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Accepted" value={accepted} color="emerald" onClick={() => setSelectedStat({ title: 'Accepted Internships', data: myReferrals.filter(r => r.status === 'accepted') })} />
                    <StatCard icon={<XCircle className="w-5 h-5" />} label="Rejected" value={rejected} color="red" onClick={() => setSelectedStat({ title: 'Rejected Applications', data: myReferrals.filter(r => r.status === 'rejected' || r.status === 'rejected_elsewhere') })} />
                    <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={pending} color="amber" onClick={() => setSelectedStat({ title: 'Pending Applications', data: myReferrals.filter(r => r.status === 'pending') })} />
                    <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Success Rate" value={`${successRate}%`} color="primary" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Mini Stats */}
                    <div className="glass-card-static p-6 space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" /> Quick Stats
                        </h3>
                        <div className="space-y-3">
                            <MiniStat label="Average Match Score" value={`${avgMatch}%`} />
                            <MiniStat label="Rejected / Declined" value={String(rejected)} />
                            <MiniStat label="Messages Sent" value={String(myChats)} />
                            <MiniStat label="Resume Uploaded" value={user.hasResume ? 'Yes' : 'No'} />
                        </div>
                    </div>

                    {/* Top Companies Chart */}
                    <div className="glass-card-static p-6 space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald" /> Top Requested Companies
                        </h3>
                        {topCompanies.length > 0 ? (
                            <div className="space-y-3">
                                {topCompanies.map(([company, count]) => (
                                    <div key={company} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold">{company}</span>
                                            <span className="text-foreground/50 font-bold">{count}</span>
                                        </div>
                                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-500"
                                                style={{ width: `${(count / maxCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-foreground/40 text-sm">No referrals requested yet.</p>
                        )}
                    </div>
                </div>

                {renderSharedModal()}
            </div>
        );
    }

    // Alumni View
    const companyReferrals = user?.verifiedCompany
        ? referrals.filter(r => r.company.toLowerCase() === user.verifiedCompany!.toLowerCase())
        : [];
    const accepted = companyReferrals.filter(r => r.status === 'accepted').length;
    const rejected = companyReferrals.filter(r => r.status === 'rejected').length;
    const autoRejected = companyReferrals.filter(r => r.status === 'rejected_elsewhere').length;
    const pending = companyReferrals.filter(r => r.status === 'pending').length;
    const total = companyReferrals.length;
    const successRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const avgMatch = total > 0 ? Math.round(companyReferrals.reduce((sum, r) => sum + r.matchScore, 0) / total) : 0;
    const myChats = messages.filter(m => m.senderId === user?.uid).length;

    // Top requested roles
    const roleCounts: Record<string, number> = {};
    companyReferrals.forEach(r => { roleCounts[r.jobTitle] = (roleCounts[r.jobTitle] || 0) + 1; });
    const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxRoleCount = topRoles.length > 0 ? topRoles[0][1] : 1;

    return (
        <div className="flex flex-col flex-1 pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-1">Referral Analytics</h1>
                <p className="text-foreground/60 text-sm">Your impact as a mentor at <strong className="text-primary">{user?.verifiedCompany}</strong>.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total Requests" value={total} color="primary" onClick={() => setSelectedStat({ title: 'All Requests', data: companyReferrals })} />
                <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Approved" value={accepted} color="emerald" onClick={() => setSelectedStat({ title: 'Approved Students', data: companyReferrals.filter(r => r.status === 'accepted') })} />
                <StatCard icon={<XCircle className="w-5 h-5" />} label="Declined" value={rejected + autoRejected} color="red" onClick={() => setSelectedStat({ title: 'Declined Students', data: companyReferrals.filter(r => r.status === 'rejected' || r.status === 'rejected_elsewhere') })} />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={pending} color="amber" onClick={() => setSelectedStat({ title: 'Pending Review', data: companyReferrals.filter(r => r.status === 'pending') })} />
                <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Approval Rate" value={`${successRate}%`} color="primary" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card-static p-6 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" /> Quick Stats
                    </h3>
                    <div className="space-y-3">
                        <MiniStat label="Avg Match Score" value={`${avgMatch}%`} />
                        <MiniStat label="Still Pending" value={String(pending)} />
                        <MiniStat label="Auto-Rejected (Full)" value={String(autoRejected)} />
                        <MiniStat label="Messages Sent" value={String(myChats)} />
                    </div>
                </div>

                <div className="glass-card-static p-6 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/60 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-amber" /> Top Requested Roles
                    </h3>
                    {topRoles.length > 0 ? (
                        <div className="space-y-3">
                            {topRoles.map(([role, count]) => (
                                <div key={role} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-semibold truncate mr-2">{role}</span>
                                        <span className="text-foreground/50 font-bold shrink-0">{count}</span>
                                    </div>
                                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald to-green-400 rounded-full transition-all duration-500"
                                            style={{ width: `${(count / maxRoleCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-foreground/40 text-sm">No referral requests yet.</p>
                    )}
                </div>
            </div>

            {renderSharedModal()}
        </div>
    );
}

function StatCard({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value: string | number; color: string; onClick?: () => void }) {
    const colorMap: Record<string, string> = {
        primary: 'from-primary to-indigo-400',
        emerald: 'from-emerald to-green-400',
        amber: 'from-amber to-yellow-400',
        red: 'from-red-500 to-rose-400',
    };
    return (
        <div
            onClick={onClick}
            className={`glass-card-static p-5 flex flex-col gap-3 transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-primary/50' : ''}`}
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-md`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-black">{value}</p>
                <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
            <span className="text-sm text-foreground/70">{label}</span>
            <span className="text-sm font-bold">{value}</span>
        </div>
    );
}
