import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { callGemini } from '../lib/gemini';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

export default function CareerAdvisor() {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load student DNA for context
    const dnaRaw = localStorage.getItem(`mock_dna_${user?.uid}`);
    const dna = dnaRaw ? JSON.parse(dnaRaw) : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    useEffect(() => {
        // Initial greeting
        if (messages.length === 0) {
            const greeting: Message = {
                id: 'greeting',
                role: 'ai',
                text: dna
                    ? `Hi ${dna.extractedName || user?.displayName || 'there'}! 👋 I've analyzed your Career DNA. I can suggest roles you'd be a great fit for, skills to learn next, or help you prepare for interviews. What would you like help with?`
                    : `Hi ${user?.displayName || 'there'}! 👋 I'm your AI Career Advisor. Upload your resume in Career DNA first for personalized advice, but I can still help with general career questions!`,
            };
            setMessages([greeting]);
        }
    }, []);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = { id: `user_${Date.now()}`, role: 'user', text: trimmed };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            let aiText: string;

            const systemPrompt = `You are an AI Career Advisor for a professional career platform called InternHub. You help students find the right career path, suggest skills to learn, recommend internship strategies, and provide interview tips.

${dna ? `Here is the student's Career DNA profile:
- Name: ${dna.extractedName || 'Unknown'}
- Summary: ${dna.summary || 'N/A'}
- Technical Skills: ${dna.technicalSkills?.join(', ') || 'N/A'}
- Education: ${dna.education?.map((e: any) => `${e.degree} at ${e.institution}`).join('; ') || 'N/A'}
- Experience: ${dna.experience?.map((e: any) => `${e.role} at ${e.company}`).join('; ') || 'N/A'}` : 'The student has not uploaded their resume yet.'}

Keep responses concise (3-5 sentences max), practical, and encouraging. Use bullet points when listing suggestions. Be specific based on their profile.`;

            const conversationHistory = messages
                .filter(m => m.id !== 'greeting')
                .map(m => `${m.role === 'user' ? 'Student' : 'Advisor'}: ${m.text}`)
                .join('\n');

            const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nStudent: ${trimmed}\n\nAdvisor:`;
            aiText = await callGemini([{ role: 'user', parts: [{ text: fullPrompt }] }]);

            const aiMsg: Message = { id: `ai_${Date.now()}`, role: 'ai', text: aiText };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            const errMsg: Message = {
                id: `err_${Date.now()}`,
                role: 'ai',
                text: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please try again.`,
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const suggestions = dna
        ? ['What roles match my skills?', 'What skills should I learn next?', 'Help me prepare for interviews', 'Review my career strategy']
        : ['How to build a strong resume?', 'Top skills for tech internships', 'Interview preparation tips', 'How to network effectively'];

    return (
        <div className="flex flex-col flex-1 h-full p-4 md:p-8 overflow-hidden">
            <div className="mb-6 shrink-0">
                <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
                    <Sparkles className="w-7 h-7 text-primary" />
                    AI Career Advisor
                </h1>
                <p className="text-foreground/60 text-sm">Personalized career guidance powered by AI.</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-card-static p-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 styled-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                            {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white shrink-0 mt-1">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-primary to-indigo-500 text-white rounded-br-md'
                                    : 'bg-secondary text-foreground border border-border/50 rounded-bl-md'
                                }`}>
                                {msg.text}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-xl bg-emerald/20 flex items-center justify-center text-emerald shrink-0 mt-1">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-secondary border border-border/50 px-4 py-3 rounded-2xl rounded-bl-md">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions */}
                {messages.length <= 1 && (
                    <div className="px-6 pb-3 flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                            <button
                                key={s}
                                onClick={() => { setInput(s); }}
                                className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-xl font-semibold border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Ask me anything about your career..."
                            className="flex-1 glass-input py-3 px-4 text-sm font-medium outline-none"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="p-3 btn-primary-gradient rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

