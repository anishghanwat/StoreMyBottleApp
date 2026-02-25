import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authService } from "../../services/auth.service";
import { toast } from "sonner";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email address");
            return;
        }

        setIsLoading(true);
        try {
            await authService.forgotPassword(email);
            setIsSuccess(true);
            toast.success("Check your email for reset instructions");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to send reset email");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-[-100px] left-[-80px] w-72 h-72 rounded-full bg-violet-700/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

            <AnimatePresence mode="wait">
                {!isSuccess ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md"
                    >
                        {/* Back button */}
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-[#7171A0] hover:text-white transition-colors mb-8"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Back to login</span>
                        </Link>

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-black tracking-tight mb-2">Forgot Password?</h1>
                            <p className="text-[#7171A0] text-sm">
                                No worries! Enter your email and we'll send you reset instructions.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[#B0B0D0] mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="input-nightlife w-full pl-11 pr-4 py-3.5 text-sm"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full py-4 rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>

                        {/* Help text */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-[#4A4A6A]">
                                Remember your password?{" "}
                                <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md text-center"
                    >
                        {/* Success icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
                            className="mb-6 relative inline-block"
                        >
                            <div className="absolute inset-0 bg-emerald-500/25 rounded-full blur-3xl scale-150 animate-pulse" />
                            <div className="relative w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                            </div>
                        </motion.div>

                        {/* Success message */}
                        <h1 className="text-2xl font-black tracking-tight mb-2">Check Your Email</h1>
                        <p className="text-[#7171A0] text-sm mb-8">
                            We've sent password reset instructions to{" "}
                            <span className="text-white font-medium">{email}</span>
                        </p>

                        {/* Instructions */}
                        <div className="card-surface p-5 text-left mb-6">
                            <p className="text-sm text-[#B0B0D0] mb-3">What to do next:</p>
                            <ol className="space-y-2 text-sm text-[#7171A0]">
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-400 font-bold">1.</span>
                                    <span>Check your email inbox (and spam folder)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-400 font-bold">2.</span>
                                    <span>Click the reset link in the email</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-violet-400 font-bold">3.</span>
                                    <span>Create a new password</span>
                                </li>
                            </ol>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link
                                to="/login"
                                className="btn-primary w-full py-3.5 rounded-2xl font-bold text-sm inline-block text-center"
                            >
                                Back to Login
                            </Link>
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="w-full py-3 text-sm text-[#7171A0] hover:text-white transition-colors"
                            >
                                Didn't receive email? Try again
                            </button>
                        </div>

                        {/* Help text */}
                        <p className="text-xs text-[#4A4A6A] mt-6">
                            The reset link expires in 1 hour for security.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
