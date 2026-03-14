import { useNotificationStore } from '../store/useNotificationStore';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const iconMap = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
};

const colorMap = {
    success: 'bg-emerald/10 border-emerald/30 text-emerald',
    error: 'bg-red-500/10 border-red-500/30 text-red-500',
    warning: 'bg-amber/10 border-amber/30 text-amber',
    info: 'bg-primary/10 border-primary/30 text-primary',
};

export default function ToastContainer() {
    const { toasts, removeToast } = useNotificationStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg animate-in slide-in-from-right fade-in duration-300 ${colorMap[toast.type]}`}
                >
                    <div className="shrink-0">{iconMap[toast.type]}</div>
                    <p className="text-sm font-semibold flex-1">{toast.message}</p>
                    <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
