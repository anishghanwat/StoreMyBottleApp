import { useState } from "react";
import { useNavigate } from "react-router";
import { Wine, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { authService } from "../../services/api";
import { toast } from "sonner";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await authService.forgotPassword(email);
            setIsSuccess(true);
            toast.success("Reset link sent! Check your email.");
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Failed to send reset link. Please try again.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#06060D] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
                {/* Ambient orbs */}
                <div className="absolute top-[-100px] left-[-80px] w-72 h-72 rounded-full bg-violet-700/15 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-600 to-green-900 mb-6 shadow-lg shadow-green-700/40">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-3">Check Your Email</h1>
                    <p className="text-[#6B6B9A] text-sm leading-relaxed max-w-sm mb-8">
                        If an account exists with <span className="text-white font-semibold">{email}</span>, you'll receive a password reset link shortly.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="btn-bar-primary px-8 py-3 text-sm"
                    >
                        Back to Login
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06060D] text-white flex flex-col relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-[-100px] left-[-80px] w-72 h-72 rounded-full bg-violet-700/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

            {/* Back Button */}
            <div className="px-5 pt-12 pb-4 flex items-center relative z-10">
                <button
                    onClick={() => navigate("/")}
                    className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-[#6B6B9A]" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Wine className="w-5 h-5 text-white" strokeWidth={1.8} />
                        </div>
                        <span className="text-sm font-semibold tracking-wider text-[#6B6B9A] uppercase">StoreMyBottle</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Reset Password
                    </h1>
                    <p className="text-[#6B6B9A] text-sm leading-relaxed">
                        Enter your email and we'll send you a link to reset your password
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            required
                            className="input-bar w-full py-4 pl-11 pr-4"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-bar-primary w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </button>
                </motion.form>

                <div className="text-center pt-8 mt-2 border-t border-white/[0.06]">
                    <button
                        onClick={() => navigate("/")}
                        className="text-[#4A4A6A] text-sm hover:text-[#6B6B9A] transition-colors"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
