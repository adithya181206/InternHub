import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useReferralStore } from '../store/useReferralStore';
import { useChatStore } from '../store/useChatStore';
import { UserCircle, Mail, Shield, Briefcase, FileText, MessageCircle, Save, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const { referrals } = useReferralStore();
    const { messages } = useChatStore();
    const { addToast } = useNotificationStore();
    const [editName, setEditName] = useState(user?.displayName || '');
    const [editing, setEditing] = useState(false);

    if (!user) return null;

    const myReferrals = user.role === 'student'
        ? referrals.filter(r => r.studentId === user.uid)
        : referrals.filter(r => user.verifiedCompany && r.company.toLowerCase() === user.verifiedCompany.toLowerCase());

    const myMessages = messages.filter(m => m.senderId === user.uid).length;
    const accepted = myReferrals.filter(r => r.status === 'accepted').length;

    const handleSave = () => {
        if (editName.trim()) {
            updateUser({ displayName: editName.trim() });
            setEditing(false);
            addToast('Display name updated!', 'success');
        }
    };

    const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="flex flex-col flex-1 pb-10 max-w-2xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight mb-1">Profile</h1>
                <p className="text-foreground/60 text-sm">Manage your account and view your activity.</p>
            </div>

            {/* Profile Card */}
            <div className="glass-card-static p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/15 to-emerald/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white text-3xl font-black shadow-indigo shrink-0">
                        {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                        {editing ? (
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="glass-input py-2 px-4 font-bold text-lg outline-none flex-1"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                                <button onClick={handleSave} className="p-2 btn-primary-gradient rounded-xl cursor-pointer">
                                    <Save className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black truncate">{user.displayName || 'No Name'}</h2>
                                <button
                                    onClick={() => setEditing(true)}
                                    className="text-xs text-primary font-bold hover:underline cursor-pointer shrink-0"
                                >
                                    Edit
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-foreground/60 mt-1">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm font-medium truncate">{user.email}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${user.role === 'student' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-emerald/10 text-emerald border border-emerald/20'
                                }`}>
                                <UserCircle className="w-3 h-3" />
                                {user.role}
                            </span>
                            {user.isVerified && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald/10 text-emerald border border-emerald/20">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Summary */}
            <div className="glass-card-static p-6 mb-6">
                <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/60 mb-4">Activity Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                    <ActivityItem icon={<Briefcase className="w-4 h-4" />} label={user.role === 'student' ? 'Referrals Requested' : 'Referrals Managed'} value={myReferrals.length} />
                    <ActivityItem icon={<CheckCircle2 className="w-4 h-4" />} label={user.role === 'student' ? 'Accepted' : 'Approved'} value={accepted} />
                    <ActivityItem icon={<MessageCircle className="w-4 h-4" />} label="Messages Sent" value={myMessages} />
                    <ActivityItem icon={<FileText className="w-4 h-4" />} label={user.role === 'student' ? 'Resume' : 'Company'} value={user.role === 'student' ? (user.hasResume ? 'Uploaded' : 'Not Yet') : (user.verifiedCompany || 'Not Verified')} />
                </div>
            </div>

            {/* Account Details */}
            <div className="glass-card-static p-6">
                <h3 className="font-bold text-sm uppercase tracking-widest text-foreground/60 mb-4">Account Details</h3>
                <div className="space-y-3">
                    <DetailRow icon={<Shield className="w-4 h-4" />} label="User ID" value={user.uid} />
                    <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={user.email} />
                    {user.verifiedCompany && (
                        <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Verified Company" value={user.verifiedCompany} />
                    )}
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="text-primary">{icon}</div>
            <div>
                <p className="text-lg font-black">{value}</p>
                <p className="text-[10px] text-foreground/50 font-semibold uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <div className="flex items-center gap-2 text-foreground/60">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-sm font-bold truncate max-w-[60%] text-right">{value}</span>
        </div>
    );
}
