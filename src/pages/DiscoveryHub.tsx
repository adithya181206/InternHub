import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, UserPlus, Star, Building2, MapPin, MessageCircle, Search, SortAsc, Heart, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';
import { useReferralStore } from '../store/useReferralStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import ChatPanel from '../components/ChatPanel';

// Mock Data
const MOCK_INTERNSHIPS = [
    { id: '1', title: 'Software Engineering Intern', company: 'Google', location: 'Mountain View, CA', match: 92, summary: 'Contribute to core search infrastructure and scale highly available systems.', tech: ['C++', 'Python', 'Go'], alumni: 12, openings: 2, jobUrl: 'https://careers.google.com/jobs/results/' },
    { id: '2', title: 'Frontend Developer Intern', company: 'Vercel', location: 'Remote', match: 88, summary: 'Build performant UI components for Next.js enterprise customers.', tech: ['React', 'TypeScript', 'Tailwind'], alumni: 4, openings: 1, jobUrl: 'https://vercel.com/careers' },
    { id: '3', title: 'AI Research Intern', company: 'OpenAI', location: 'San Francisco, CA', match: 76, summary: 'Research alignment techniques for next-generation foundation models.', tech: ['PyTorch', 'Python', 'CUDA'], alumni: 2, openings: 3, jobUrl: 'https://openai.com/careers/search' },
    { id: '4', title: 'Backend Systems Intern', company: 'Stripe', location: 'Seattle, WA', match: 85, summary: 'Optimize low-latency payment gateways for global scale.', tech: ['Ruby', 'Go', 'SQL'], alumni: 8, openings: 1, jobUrl: 'https://stripe.com/jobs/search' },
    { id: '5', title: 'Cloud Solutions Intern', company: 'Microsoft', location: 'Redmond, WA', match: 90, summary: 'Design and implement Azure cloud services powering millions of enterprise users worldwide.', tech: ['C#', '.NET', 'Azure', 'TypeScript'], alumni: 15, openings: 3, jobUrl: 'https://careers.microsoft.com/students/us/en/us-internship' },
    { id: '6', title: 'SDE Intern', company: 'Amazon', location: 'Seattle, WA', match: 87, summary: 'Build distributed systems at massive scale for AWS and consumer products.', tech: ['Java', 'Python', 'AWS', 'DynamoDB'], alumni: 20, openings: 5, jobUrl: 'https://www.amazon.jobs/en/teams/internships-for-students' },
    { id: '7', title: 'ML Engineering Intern', company: 'Meta', location: 'Menlo Park, CA', match: 82, summary: 'Develop machine learning models for recommendation systems across Facebook and Instagram.', tech: ['Python', 'PyTorch', 'SQL', 'Spark'], alumni: 10, openings: 2, jobUrl: 'https://www.metacareers.com/jobs?roles[0]=intern' },
    { id: '8', title: 'Platform Engineering Intern', company: 'Netflix', location: 'Los Gatos, CA', match: 79, summary: 'Build resilient streaming infrastructure serving 250M+ subscribers globally.', tech: ['Java', 'Kotlin', 'Spring Boot', 'Cassandra'], alumni: 3, openings: 1, jobUrl: 'https://jobs.netflix.com/search?team=Intern' },
    { id: '9', title: 'iOS Developer Intern', company: 'Apple', location: 'Cupertino, CA', match: 84, summary: 'Craft innovative features for iOS, macOS, and watchOS platforms used by billions.', tech: ['Swift', 'UIKit', 'SwiftUI', 'Obj-C'], alumni: 7, openings: 2, jobUrl: 'https://jobs.apple.com/en-us/search?team=internships-STDNT-INTRN' },
    { id: '10', title: 'Autopilot Software Intern', company: 'Tesla', location: 'Palo Alto, CA', match: 73, summary: 'Work on autonomous driving perception and planning systems for next-gen vehicles.', tech: ['Python', 'C++', 'TensorFlow', 'ROS'], alumni: 5, openings: 2, jobUrl: 'https://www.tesla.com/careers/search/?type=3' },
    { id: '11', title: 'Creative Cloud Intern', company: 'Adobe', location: 'San Jose, CA', match: 86, summary: 'Enhance creative tools used by millions of designers, photographers, and video creators.', tech: ['JavaScript', 'React', 'Node.js', 'GraphQL'], alumni: 9, openings: 2, jobUrl: 'https://careers.adobe.com/us/en/search-results?keywords=intern' },
    { id: '12', title: 'Data Engineer Intern', company: 'Spotify', location: 'Stockholm, Sweden', match: 81, summary: 'Build data pipelines powering personalized music recommendations for 600M+ users.', tech: ['Python', 'Scala', 'GCP', 'Apache Beam'], alumni: 6, openings: 1, jobUrl: 'https://www.lifeatspotify.com/students' },
];

// Get all unique tech tags
const ALL_TECH = Array.from(new Set(MOCK_INTERNSHIPS.flatMap(j => j.tech))).sort();

type SortOption = 'match' | 'company' | 'openings';

export default function DiscoveryHub() {
    const { user } = useAuthStore();
    const { referrals, requestReferral, reload } = useReferralStore();
    const { bookmarks, toggleBookmark } = useBookmarkStore();
    const { getUnreadCount } = useChatStore();
    const { addToast } = useNotificationStore();
    const [chatOpen, setChatOpen] = useState<{ referralId: string; partnerName: string } | null>(null);

    // Search & Filter state
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('match');
    const [selectedTech, setSelectedTech] = useState<string[]>([]);
    const [showSaved, setShowSaved] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    useEffect(() => { reload(); }, [reload]);
    useEffect(() => {
        const interval = setInterval(() => reload(), 2000);
        return () => clearInterval(interval);
    }, [reload]);

    const getStatusForJob = (jobId: string): string | null => {
        if (!user) return null;
        return referrals.find(r => r.jobId === jobId && r.studentId === user.uid)?.status ?? null;
    };

    const getReferralForJob = (jobId: string) => {
        if (!user) return null;
        return referrals.find(r => r.jobId === jobId && r.studentId === user.uid) ?? null;
    };

    const handleRequest = (jobId: string, jobTitle: string, company: string, openings: number) => {
        if (!user) return;
        requestReferral({
            id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            jobId,
            studentId: user.uid,
            studentName: user.displayName || 'Unknown Student',
            jobTitle,
            company,
            matchScore: MOCK_INTERNSHIPS.find(j => j.id === jobId)?.match || 0,
            openings,
        });
        addToast(`Referral requested for ${jobTitle} at ${company}`, 'success');
    };

    // Filtered & sorted jobs
    const filteredJobs = useMemo(() => {
        let jobs = [...MOCK_INTERNSHIPS];

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            jobs = jobs.filter(j =>
                j.title.toLowerCase().includes(q) ||
                j.company.toLowerCase().includes(q) ||
                j.location.toLowerCase().includes(q)
            );
        }

        // Tech filter
        if (selectedTech.length > 0) {
            jobs = jobs.filter(j => selectedTech.some(t => j.tech.includes(t)));
        }

        // Bookmarks filter
        if (showSaved) {
            jobs = jobs.filter(j => bookmarks.includes(j.id));
        }

        // Sort
        if (sortBy === 'match') jobs.sort((a, b) => b.match - a.match);
        else if (sortBy === 'company') jobs.sort((a, b) => a.company.localeCompare(b.company));
        else if (sortBy === 'openings') jobs.sort((a, b) => b.openings - a.openings);

        return jobs;
    }, [search, selectedTech, sortBy, showSaved, bookmarks]);

    return (
        <div className="flex flex-col flex-1 pb-10">
            <div className="mb-6">
                <h1 className="text-3xl font-black tracking-tight mb-1">Discovery Hub</h1>
                <p className="text-foreground/60 text-sm">Find top tier roles and request referrals from your network.</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-card-static p-4 mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full glass-input py-2 px-10 text-sm font-medium outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <div className="relative">
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/30 hover:bg-secondary/70 transition-all duration-200 cursor-pointer"
                            >
                                <SortAsc className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-sm font-semibold capitalize text-foreground">
                                    {sortBy === 'match' ? 'Match %' : sortBy}
                                </span>
                            </button>

                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-40 glass-card-static p-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                        {(['match', 'company', 'openings'] as SortOption[]).map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    setSortBy(option);
                                                    setIsSortOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200",
                                                    sortBy === option 
                                                        ? "bg-primary/10 text-primary" 
                                                        : "text-foreground/60 hover:bg-white/5 hover:text-foreground"
                                                )}
                                            >
                                                {option === 'match' ? 'Match %' : option}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => setShowSaved(!showSaved)}
                            className={cn(
                                "p-2.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 border",
                                showSaved
                                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                                    : "border-border/50 text-foreground/40 hover:text-red-500 hover:border-red-500/30"
                            )}
                            title="Show saved jobs"
                        >
                            <Heart className={cn("w-4 h-4", showSaved && "fill-current")} />
                        </button>
                    </div>
                </div>

                {/* Tech Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-3 h-3 text-foreground/40 shrink-0" />
                    {ALL_TECH.map(tech => (
                        <button
                            key={tech}
                            onClick={() => setSelectedTech(prev =>
                                prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
                            )}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer border",
                                selectedTech.includes(tech)
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "bg-transparent text-foreground/50 border-border/30 hover:border-primary/30 hover:text-primary"
                            )}
                        >
                            {tech}
                        </button>
                    ))}
                    {selectedTech.length > 0 && (
                        <button onClick={() => setSelectedTech([])} className="text-[10px] text-foreground/40 hover:text-red-500 font-bold cursor-pointer ml-1">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count */}
            <p className="text-xs text-foreground/50 font-semibold mb-4">
                {filteredJobs.length} of {MOCK_INTERNSHIPS.length} roles
                {showSaved && ` • Showing saved only`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-4 content-start">
                {filteredJobs.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-foreground/40">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-bold">No roles found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                ) : filteredJobs.map((job) => {
                    const status = getStatusForJob(job.id);
                    const referral = getReferralForJob(job.id);
                    const isSaved = bookmarks.includes(job.id);
                    return (
                        <div key={job.id} className="group flex flex-col justify-between glass-card p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-emerald/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-6 gap-3 pt-2">
                                <div className="flex-1 min-w-0">
                                    {status === 'accepted' && (
                                        <div className="inline-flex mb-3 bg-emerald/10 text-emerald px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            ✓ Referral Approved
                                        </div>
                                    )}
                                    {(status === 'rejected' || status === 'rejected_elsewhere') && (
                                        <div className="inline-flex mb-3 bg-red-500/10 text-red-500 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            ✗ Declined
                                        </div>
                                    )}

                                    <h3 className="text-xl font-black mb-1 truncate">{job.title}</h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold opacity-70">
                                        <span className="flex items-center gap-1 shrink-0"><Building2 className="w-4 h-4" /> {job.company}</span>
                                        <span className="hidden sm:inline">&bull;</span>
                                        <span className="flex items-center gap-1 shrink-0"><MapPin className="w-4 h-4" /> {job.location}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {/* Bookmark button moved here to prevent overlap */}
                                    <button
                                        onClick={() => {
                                            toggleBookmark(job.id);
                                            addToast(isSaved ? 'Removed from saved' : 'Saved to bookmarks', isSaved ? 'info' : 'success');
                                        }}
                                        className="p-2 rounded-xl bg-background/50 hover:bg-red-500/10 transition-all duration-200 cursor-pointer border border-border/30"
                                    >
                                        <Heart className={cn("w-4 h-4 transition-colors", isSaved ? "fill-red-500 text-red-500" : "text-foreground/30 hover:text-red-500")} />
                                    </button>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 shadow-md",
                                        job.match >= 85
                                            ? "bg-gradient-to-r from-emerald to-green-400 text-white"
                                            : "bg-gradient-to-r from-amber to-yellow-400 text-white"
                                    )}>
                                        {job.match}% Match
                                    </div>
                                </div>
                            </div>

                            <p className="text-foreground/70 font-medium leading-relaxed mb-6 flex-1 italic text-sm">
                                "{job.summary}"
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {job.tech.map((t) => (
                                    <span key={t} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg border border-primary/20">
                                        {t}
                                    </span>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-border pt-6 gap-4">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                    <div className="bg-primary/10 p-2 rounded-xl">
                                        <Star className="w-4 h-4" />
                                    </div>
                                    <span>{job.alumni} Alumni Here</span>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    {status === 'accepted' && referral && (
                                        <button
                                            onClick={() => setChatOpen({ referralId: referral.id, partnerName: `${job.company} Alumni` })}
                                            className="px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all duration-200 text-sm bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/20 hover:-translate-y-0.5 cursor-pointer relative"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Chat
                                            {user && getUnreadCount(referral.id, user.uid) > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRequest(job.id, job.title, job.company, job.openings)}
                                        disabled={status === 'pending' || status === 'accepted'}
                                        className={cn(
                                            "px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all duration-200 text-sm",
                                            status === 'pending' ? "bg-amber/10 text-amber opacity-70 cursor-not-allowed" :
                                                status === 'accepted' ? "bg-emerald/10 text-emerald opacity-70 cursor-not-allowed" :
                                                    "btn-primary-gradient hover:-translate-y-0.5 cursor-pointer"
                                        )}
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        {status === 'pending' ? 'Requested' :
                                            status === 'accepted' ? 'Approved!' :
                                                'Request'}
                                    </button>
                                    <a
                                        href={job.jobUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 border-2 border-primary/20 hover:border-primary text-primary rounded-xl font-bold flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 text-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Apply
                                    </a>
                                </div>
                            </div>
                            {/* Removed rejected text message so user can clearly re-request */}
                            {status === 'pending' && (
                                <p className="text-amber text-xs font-bold mt-3 text-right animate-pulse">Waiting for Alumni review...</p>
                            )}
                            {status === 'accepted' && (
                                <p className="text-emerald text-xs font-bold mt-3 text-right">🎉 An alumnus has approved your referral!</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {chatOpen && user && (
                <ChatPanel
                    referralId={chatOpen.referralId}
                    currentUserId={user.uid}
                    currentUserName={user.displayName || 'Student'}
                    currentUserRole="student"
                    partnerName={chatOpen?.partnerName || 'Alumni'}
                    onClose={() => setChatOpen(null)}
                />
            )}
        </div>
    );
}
