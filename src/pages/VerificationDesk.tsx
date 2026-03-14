import { useState } from 'react';
import { Mail, Briefcase, FileText, CheckCircle2, Loader2, RefreshCw, XCircle, ShieldCheck, Building2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ChangeCompanyStep = 'idle' | 'uploading' | 'verifying' | 'success' | 'failed';

export default function VerificationDesk() {
    const { user, updateUser } = useAuthStore();
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('Google');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Company change state
    const [changeDoc, setChangeDoc] = useState<File | null>(null);
    const [changeStep, setChangeStep] = useState<ChangeCompanyStep>('idle');
    const [aiResult, setAiResult] = useState<{ isValid: boolean; detectedCompany: string | null; employeeName: string | null; reason: string } | null>(null);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        setStep(2);
        setLoading(false);
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp !== '1234') return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        updateUser({ isVerified: true, verifiedCompany: company });
        setLoading(false);
    };

    const handleChangeCompanySubmit = async () => {
        if (!changeDoc) return;
        setChangeStep('verifying');
        setAiResult(null);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                // Fallback mock for demo
                await new Promise(r => setTimeout(r, 2000));
                const mockCompanies = ['Google', 'Vercel', 'OpenAI', 'Stripe'];
                const detected = mockCompanies.find(c => c.toLowerCase() !== user?.verifiedCompany?.toLowerCase()) || 'Vercel';
                setAiResult({ isValid: true, detectedCompany: detected, employeeName: user?.displayName || 'Mock User', reason: 'Mock: Document appears to be a valid relieving letter.' });
                setChangeStep('success');
                return;
            }

            const isPdf = changeDoc.type === 'application/pdf' || changeDoc.name.toLowerCase().endsWith('.pdf');
            const isImage = changeDoc.type.startsWith('image/');

            if (!isPdf && !isImage) {
                const text = await changeDoc.text();
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const prompt = `You are a document verifier for a professional networking platform. A user is trying to switch their verified company by submitting proof of employment transition.

Analyze the following document text and determine:
1. Is this a valid relieving letter, experience letter, or official company email confirming the user has left or joined a company?
2. What company is the user transitioning to (the NEW company they now work for or have joined)?
3. What is the full name of the employee mentioned in the document?

Respond ONLY in this exact JSON format:
{
  "isValid": true or false,
  "detectedCompany": "Company Name or null",
  "employeeName": "Employee Name or null",
  "reason": "brief explanation"
}

Document text:
${text}`;
                const result = await model.generateContent(prompt);

                let responseText = result.response.text();
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) responseText = jsonMatch[0];
                responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

                let parsed = JSON.parse(responseText);

                // Check name match
                if (parsed.isValid && parsed.employeeName && user?.displayName) {
                    const docName = parsed.employeeName.toLowerCase();
                    const userName = user.displayName.toLowerCase();
                    // Basic loose match: checking if any part of the user's display name is in the doc name, or vice versa
                    if (!docName.includes(userName) && !userName.includes(docName)) {
                        parsed.isValid = false;
                        parsed.reason = `Name mismatch: The document is for "${parsed.employeeName}", but your account name is "${user.displayName}".`;
                    }
                }

                setAiResult(parsed);
                setChangeStep(parsed.isValid ? 'success' : 'failed');
                return;
            }

            // For PDF or image - send inline
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(changeDoc);
            });

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `You are a document verifier for a professional networking platform. A user is trying to switch their verified company by submitting proof of employment transition.

Analyze the attached document and determine:
1. Is this a valid relieving letter, experience letter, or official company email confirming the user has left or joined a company?
2. What company is the user transitioning to (the NEW company they now work for or have joined)?
3. What is the full name of the employee mentioned in the document?

Respond ONLY in this exact JSON format:
{
  "isValid": true or false,
  "detectedCompany": "Company Name or null",
  "employeeName": "Employee Name or null",
  "reason": "brief explanation"
}`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: isPdf ? 'application/pdf' : changeDoc.type,
                    }
                }
            ]);

            let responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) responseText = jsonMatch[0];
            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            let parsed = JSON.parse(responseText);

            // Check name match
            if (parsed.isValid && parsed.employeeName && user?.displayName) {
                const docName = parsed.employeeName.toLowerCase();
                const userName = user.displayName.toLowerCase();
                if (!docName.includes(userName) && !userName.includes(docName)) {
                    parsed.isValid = false;
                    parsed.reason = `Name mismatch: The document is for "${parsed.employeeName}", but your account name is "${user.displayName}".`;
                }
            }

            setAiResult(parsed);
            setChangeStep(parsed.isValid ? 'success' : 'failed');

        } catch (err: any) {
            setAiResult({ isValid: false, detectedCompany: null, employeeName: null, reason: err.message || 'Failed to analyze document.' });
            setChangeStep('failed');
        }
    };

    const handleConfirmCompanyChange = () => {
        if (!aiResult?.detectedCompany) return;
        updateUser({ verifiedCompany: aiResult.detectedCompany });
        setChangeDoc(null);
        setAiResult(null);
        setChangeStep('idle');
    };

    const handleResetVerification = () => {
        updateUser({ isVerified: false, verifiedCompany: null });
        setChangeDoc(null);
        setAiResult(null);
        setChangeStep('idle');
        setStep(1);
        setEmail('');
        setOtp('');
    };

    return (
        <div className="flex flex-col h-full px-4">
            <div className="mb-10 mt-6 text-center max-w-2xl mx-auto">
                <div className="inline-flex p-4 bg-gradient-to-br from-primary to-indigo-400 text-white rounded-[2rem] mb-6 shadow-indigo">
                    <Briefcase className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-3">Alumnus Verification</h1>
                <p className="text-lg text-foreground/60 font-medium">
                    {user?.isVerified
                        ? `Verified at ${user?.verifiedCompany}. Ready to help top talent.`
                        : 'Verify your work email to access the referral desk and connect with students.'}
                </p>
            </div>

            <div className="flex-1 max-w-lg mx-auto w-full">
                {!user?.isVerified ? (
                    <div className="glass-card-static p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-emerald/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                        {step === 1 ? (
                            <form onSubmit={handleSendOtp} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-widest">Select Mock Company</label>
                                    <div className="relative group mb-4">
                                        <select
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            className="w-full glass-input py-4 px-4 font-semibold outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="Google">Google</option>
                                            <option value="Vercel">Vercel</option>
                                            <option value="OpenAI">OpenAI</option>
                                            <option value="Stripe">Stripe</option>
                                            <option value="Microsoft">Microsoft</option>
                                            <option value="Amazon">Amazon</option>
                                            <option value="Meta">Meta</option>
                                            <option value="Netflix">Netflix</option>
                                            <option value="Apple">Apple</option>
                                            <option value="Tesla">Tesla</option>
                                            <option value="Adobe">Adobe</option>
                                            <option value="Spotify">Spotify</option>
                                        </select>
                                    </div>
                                    <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-widest">Work Email</label>
                                    <div className="relative group">
                                        <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within:text-primary transition-colors duration-200" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full glass-input py-4 pl-12 pr-4 font-medium outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-foreground/50 mt-2 font-semibold px-1">
                                        Select your company from the dropdown, then enter any work email.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary-gradient py-4 flex justify-center items-center"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Request OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-6 relative z-10 animate-in slide-in-from-right fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-foreground/70 mb-2 uppercase tracking-widest">Enter OTP (Use 1234)</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            required
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={4}
                                            placeholder="• • • •"
                                            className="w-full text-center text-3xl tracking-[1em] glass-input py-4 font-black outline-none"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 4}
                                    className="w-full btn-primary-gradient py-4 flex justify-center items-center disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify Status'}
                                </button>
                                <div className="flex justify-center flex-col text-sm text-foreground/60 text-center space-y-2 font-semibold cursor-pointer hover:text-primary transition-colors duration-200" onClick={() => setStep(1)}>
                                    <p>Wrong email? Go back</p>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Verified badge */}
                        <div className="glass-card-static p-10 flex flex-col items-center text-center space-y-4">
                            <CheckCircle2 className="w-16 h-16 text-emerald" />
                            <h2 className="text-3xl font-black">Verified</h2>
                            <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold border border-primary/20">
                                <Building2 className="w-5 h-5" />
                                {user.verifiedCompany}
                            </div>
                            <p className="text-foreground/60 font-medium text-sm">You are verified as an alumnus at <strong className="text-primary">{user.verifiedCompany}</strong>.</p>
                        </div>

                        {/* Change Company card */}
                        <div className="glass-card-static p-8 space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <RefreshCw className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg">Change Company</h3>
                                    <p className="text-xs text-foreground/50 font-medium">Upload a relieving letter or official email to verify your transition.</p>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border" />

                            {changeStep === 'idle' && (
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-foreground/60 uppercase tracking-widest">
                                        Upload Document (PDF, Image, or TXT)
                                    </label>
                                    <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group">
                                        <FileText className="w-10 h-10 text-foreground/30 group-hover:text-primary/50 mb-3 transition-colors duration-200" />
                                        <span className="text-sm font-semibold text-foreground/50 group-hover:text-foreground transition-colors duration-200">
                                            {changeDoc ? changeDoc.name : 'Click to select or drag file here'}
                                        </span>
                                        {changeDoc && <span className="text-xs text-primary mt-1 font-bold">{(changeDoc.size / 1024).toFixed(1)} KB</span>}
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/*"
                                            onChange={(e) => { setChangeDoc(e.target.files?.[0] || null); setAiResult(null); setChangeStep('idle'); }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </label>
                                    {changeDoc && (
                                        <button
                                            onClick={handleChangeCompanySubmit}
                                            className="w-full btn-primary-gradient py-3 flex justify-center items-center gap-2"
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                            Verify with AI
                                        </button>
                                    )}
                                </div>
                            )}

                            {changeStep === 'verifying' && (
                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    <p className="font-bold text-foreground/60 text-sm">Analyzing document with AI...</p>
                                    <p className="text-xs text-foreground/40">Verifying authenticity of your relieving letter</p>
                                </div>
                            )}

                            {changeStep === 'success' && aiResult && (
                                <div className="space-y-4">
                                    <div className="bg-emerald/10 border border-emerald/20 rounded-2xl p-5 space-y-2">
                                        <div className="flex items-center gap-2 text-emerald font-black">
                                            <CheckCircle2 className="w-5 h-5" />
                                            Document Verified
                                        </div>
                                        <p className="text-sm text-foreground/70 font-medium">{aiResult.reason}</p>
                                        {aiResult.detectedCompany && (
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald/20">
                                                <Building2 className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-bold">New Company Detected: <span className="text-primary">{aiResult.detectedCompany}</span></span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setChangeStep('idle'); setChangeDoc(null); setAiResult(null); }}
                                            className="flex-1 py-3 rounded-xl font-bold glass-input text-sm cursor-pointer text-center"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirmCompanyChange}
                                            className="flex-1 btn-primary-gradient py-3 text-sm flex items-center justify-center gap-2"
                                        >
                                            <Building2 className="w-4 h-4" />
                                            Confirm Switch
                                        </button>
                                    </div>
                                </div>
                            )}

                            {changeStep === 'failed' && aiResult && (
                                <div className="space-y-4">
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-2">
                                        <div className="flex items-center gap-2 text-red-500 font-black">
                                            <XCircle className="w-5 h-5" />
                                            Verification Failed
                                        </div>
                                        <p className="text-sm text-foreground/70 font-medium">{aiResult.reason}</p>
                                        <p className="text-xs text-foreground/50">Please upload a clear, official relieving letter or HR email showing your transition.</p>
                                    </div>
                                    <button
                                        onClick={() => { setChangeStep('idle'); setChangeDoc(null); setAiResult(null); }}
                                        className="w-full py-3 rounded-xl font-bold glass-input text-sm cursor-pointer"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Danger zone: full reset */}
                        <button
                            onClick={handleResetVerification}
                            className="w-full py-3 text-center font-semibold text-foreground/30 hover:text-red-500 transition-colors duration-200 text-sm"
                        >
                            Reset Verification Entirely
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
