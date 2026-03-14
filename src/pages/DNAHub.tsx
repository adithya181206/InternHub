import { useState, useEffect } from 'react';
import { UploadCloud, FileJson, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DNA {
    extractedName: string | null;
    education: Array<{ degree: string; institution: string; year: string }> | null;
    experience: Array<{ role: string; company: string; period: string; details: string }> | null;
    projects: Array<{ title: string; tech: string; details: string }> | null;
    technicalSkills: string[] | null;
    summary: string | null;
}

export default function DNAHub() {
    const { user, updateUser } = useAuthStore();
    const [file, setFile] = useState<File | null>(null);
    const [dna, setDna] = useState<DNA | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Restore DNA from localStorage on mount if user already uploaded
    useEffect(() => {
        if (user?.uid && user.hasResume) {
            const stored = localStorage.getItem(`mock_dna_${user.uid}`);
            if (stored) {
                setDna(JSON.parse(stored));
            }
        }
    }, [user?.uid, user?.hasResume]);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        try {
            if ((user?.dailyApiCount || 0) >= 5) {
                throw new Error('Daily limit reached (Max 5 parses per day).');
            }

            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            let text = '';
            let base64Data = '';

            if (!isPdf) {
                text = await file.text();
            } else {
                base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                // Fallback mock parsing
                await new Promise(r => setTimeout(r, 1500));
                const mockDna: DNA = {
                    extractedName: user?.displayName || 'Mock User',
                    education: [{ degree: 'B.Tech', institution: 'Mock University', year: '2024' }],
                    experience: [{ role: 'SDE Intern', company: 'Mock Corp', period: 'Summer 2023', details: 'Built mock APIs' }],
                    projects: [{ title: 'Chat App', tech: 'React, Firebase', details: 'A real-time chat application.' }],
                    technicalSkills: ['React', 'TypeScript', 'Node.js'],
                    summary: 'A highly motivated individual looking for mock intern opportunities.'
                };
                setDna(mockDna);
                if (user?.uid) localStorage.setItem(`mock_dna_${user.uid}`, JSON.stringify(mockDna));
                updateUser({ displayName: mockDna.extractedName, dailyApiCount: (user?.dailyApiCount || 0) + 1, hasResume: true });
                setLoading(false);
                return;
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `You are an automated resume parser. Read the resume and extract exactly 5 sections. 
CRITICAL: You must respond ONLY with raw JSON. NO markdown. NO conversational text. Do not wrap in \`\`\`json. Just the absolute raw JSON object.

Keys required in the JSON:
- "Name": string (or null)
- "Education": array of objects with { "degree", "institution", "year" } (or null)
- "Experience": array of objects with { "role", "company", "period", "details" } (or null)
- "Projects": array of objects with { "title", "tech", "description" } (or null). Capture the complete idea: the problem solved, core features, and technical impact.
- "Skills": array of strings (or null)
- "Summary": a 1-sentence string (or null)

${!isPdf ? `Resume Text:\n${text}` : 'The resume is attached as a PDF document.'}`;

            const promptParts: any[] = [prompt];
            if (isPdf) {
                promptParts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: 'application/pdf'
                    }
                });
            }

            const result = await model.generateContent(promptParts);
            let responseText = result.response.text();

            // Defensive cleaning
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                responseText = jsonMatch[0];
            }
            responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

            const parsed = JSON.parse(responseText);

            const newDna: DNA = {
                extractedName: parsed.Name || parsed.name || null,
                education: parsed.Education || parsed.education || null,
                experience: parsed.Experience || parsed.experience || null,
                projects: (parsed.Projects || parsed.projects)?.map((p: any) => ({
                    title: p.title || p.Title,
                    tech: p.tech || p.Tech,
                    details: p.description || p.Description || p.details || p.Details
                })) || null,
                technicalSkills: parsed.Skills || parsed.skills || null,
                summary: parsed.Summary || parsed.summary || null,
            };

            setDna(newDna);
            if (user?.uid) localStorage.setItem(`mock_dna_${user.uid}`, JSON.stringify(newDna));
            // Store resume file as base64 for alumni to preview
            if (user?.uid) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    localStorage.setItem(`mock_resume_file_${user.uid}`, reader.result as string);
                };
                reader.readAsDataURL(file);
            }
            updateUser({
                displayName: newDna.extractedName || user?.displayName,
                dailyApiCount: (user?.dailyApiCount || 0) + 1,
                hasResume: true
            });

        } catch (err: any) {
            setError(err.message || 'Failed to parse resume');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Career DNA Hub</h1>
                    <p className="text-foreground/60 text-sm">Upload your resume and let AI extract your professional identity.</p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl text-sm font-bold border border-primary/20">
                    API Uses: {user?.dailyApiCount || 0} / 5
                </div>
            </div>

            {!dna ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-[2.5rem] bg-primary/5 p-12 transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 relative">
                    <UploadCloud className="w-16 h-16 text-primary/30 mb-6" />
                    <h3 className="text-xl font-bold mb-2">Drop your resume here</h3>
                    <p className="text-foreground/60 mb-6 text-center max-w-sm text-sm">
                        Upload your resume in PDF, TXT, or Markdown format.
                    </p>
                    <input
                        type="file"
                        accept=".txt,.md,.pdf,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {file && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-primary to-indigo-500 text-white rounded-2xl flex items-center gap-4 z-10 w-full max-w-md shadow-indigo">
                            <FileJson className="w-8 h-8 opacity-80" />
                            <div className="flex-1 truncate">
                                <p className="font-bold truncate">{file.name}</p>
                                <p className="text-xs opacity-70">Ready to parse</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                disabled={loading}
                                className="bg-white text-primary px-4 py-2 rounded-xl font-bold hover:bg-white/90 transition-all duration-200 cursor-pointer"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Extract DNA'}
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 mt-4 font-bold text-sm">{error}</p>}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pb-20 pr-4 styled-scrollbar">
                    <div className="bg-gradient-to-br from-primary to-indigo-500 text-white p-8 rounded-[2.5rem] shadow-indigo relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>
                        <h2 className="text-3xl font-black tracking-widest uppercase mb-3 relative z-10">{dna.extractedName || 'Unknown'}</h2>
                        <p className="text-base opacity-90 font-medium leading-relaxed max-w-3xl relative z-10">
                            {dna.summary || 'No summary generated.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold tracking-widest mb-6 flex flex-col gap-1">
                                <span>Technical Skills</span>
                                <span className="w-12 h-1 bg-gradient-to-r from-primary to-indigo-400 rounded-full"></span>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {dna.technicalSkills?.map((skill, i) => (
                                    <span key={i} className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-semibold text-sm border border-primary/20">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold tracking-widest mb-6 flex flex-col gap-1">
                                <span>Education</span>
                                <span className="w-12 h-1 bg-gradient-to-r from-emerald to-green-400 rounded-full"></span>
                            </h3>
                            <div className="space-y-4">
                                {dna.education?.map((edu, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="font-black text-lg">{edu.degree}</span>
                                        <span className="text-foreground/70 text-sm">{edu.institution} &bull; {edu.year}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {dna.experience && dna.experience.length > 0 && (
                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold tracking-widest mb-6 flex flex-col gap-1">
                                <span>Experience</span>
                                <span className="w-12 h-1 bg-gradient-to-r from-amber to-yellow-400 rounded-full"></span>
                            </h3>
                            <div className="space-y-8">
                                {dna.experience.map((exp, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-primary/20">
                                        <div className="absolute w-3 h-3 bg-gradient-to-r from-primary to-indigo-400 rounded-full -left-[7px] top-2"></div>
                                        <h4 className="text-lg font-black">{exp.role}</h4>
                                        <p className="text-primary font-bold mb-2 text-sm">{exp.company} &bull; <span className="text-foreground/60">{exp.period}</span></p>
                                        <p className="text-foreground/80 leading-relaxed font-medium text-sm">{exp.details}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {dna.projects && dna.projects.length > 0 && (
                        <div className="glass-card p-8">
                            <h3 className="text-xl font-bold tracking-widest mb-6 flex flex-col gap-1">
                                <span>Projects</span>
                                <span className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full"></span>
                            </h3>
                            <div className="grid gap-6">
                                {dna.projects.map((proj, i) => (
                                    <div key={i} className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10 hover:border-primary/30 transition-all duration-200">
                                        <h4 className="text-xl font-black mb-1">{proj.title}</h4>
                                        <p className="text-primary font-bold mb-4 text-xs uppercase tracking-wider">{proj.tech}</p>
                                        <p className="text-foreground/80 leading-relaxed font-medium text-sm italic">
                                            "{proj.details}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setDna(null);
                            if (user?.uid) localStorage.removeItem(`mock_dna_${user.uid}`);
                            updateUser({ hasResume: false });
                        }}
                        className="w-full py-4 text-center font-semibold text-foreground/40 hover:text-primary transition-colors duration-200"
                    >
                        Submit Another Resume
                    </button>
                </div>
            )}
        </div>
    );
}
