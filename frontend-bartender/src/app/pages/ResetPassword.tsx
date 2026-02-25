import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Wine, Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { authService } from "../../services/api";
import { toast } from "sonner";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    useEffect(() => {
        if (!token) {
            setIsValidToken(false);
            return;
        }

        // Verify token on mount
        const verifyToken = async () => {
            try {
                await authService.verifyResetToken(token);
                setIsValidToken(true);
            } catch (err) {
                setIsValidToken(false);
                toast.error("Invalid or expired reset link");
            }
        };

        verifyToken();
    }, [token]);

    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return { strength: 0, label: "", color: "" };
        if (password.length < 6) return { strength: 1, label: "Weak", color: "bg-red-500" };
        if (password.length < 10) return { strength: 2, label: "Fair", color: "bg-yellow-500" };
        if (password.length < 14) return { strength: 3, label: "Good", color: "bg-blue-500" };
        return { strength: 4, label: "Strong", color: "bg-green-500" };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (!token) {
            toast.error("Invalid reset token");
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword(token, newPassword);
            setIsSuccess(true);
            toast.success("Password reset successfully!");
            setTimeout(() => navigate("/"), 2000);
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Failed to reset password. Please try again.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Invalid token state
    if (isValidToken === false) {
        return (
            <div className="min-h-screen bg-[#06060D] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
                <div className="absolute top-[-100px] left-[-80px] w-72 h-72 rounded-full bg-violet-700/15 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-red-900 mb-6 shadow-lg shadow-red-700/40">
                        <AlertCircle className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-3">Invalid Reset Link</h1>
                    <p className="text-[#6B6B9A] text-sm leading-relaxed max-w-sm mb-8">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <button
                        onClick={() => navigate("/forgot-password")}
                        className="btn-bar-primary px-8 py-3 text-sm"
                    >
                        Request New Link
                    </button>
                </motion.div>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#06060D] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
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
                    <h1 className="text-2xl font-black tracking-tight mb-3">Password Reset!</h1>
                    <p className="text-[#6B6B9A] text-sm leading-relaxed max-w-sm mb-8">
                        Your password has been successfully reset. Redirecting to login...
                    </p>
                </motion.div>
            </div>
        );
    }

    // Loading token verification
    if (isValidToken === null) {
        return (
            <div className="min-h-screen bg-[#06060D] text-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Reset password form
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
                        Create New Password
                    </h1>
                    <p className="text-[#6B6B9A] text-sm leading-relaxed">
                        Enter a strong password for your account
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password"
                                required
                                minLength={6}
                                className="input-bar w-full py-4 pl-11 pr-4"
                            />
                        </div>
                        {newPassword && (
                            <div className="mt-2 px-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-[#6B6B9A]">Password strength</span>
                                    <span className={`text-xs font-semibold ${passwordStrength.strength >= 3 ? 'text-green-400' : passwordStrength.strength >= 2 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            required
                            minLength={6}
                            className="input-bar w-full py-4 pl-11 pr-4"
                        />
                    </div>

                    {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-red-400 text-xs px-1">Passwords don't match</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
                        className="btn-bar-primary w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}
