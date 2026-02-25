import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { authService } from "../../services/auth.service";
import { toast } from "sonner";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Get token from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get("token");

        if (!tokenParam) {
            toast.error("Invalid reset link");
            navigate("/login");
            return;
        }

        setToken(tokenParam);
        verifyToken(tokenParam);
    }, [location, navigate]);

    const verifyToken = async (tokenToVerify: string) => {
        setIsVerifying(true);
        try {
            const valid = await authService.verifyResetToken(tokenToVerify);
            setIsValidToken(valid);
            if (!valid) {
                toast.error("This reset link is invalid or has expired");
            }
        } catch {
            setIsValidToken(false);
            toast.error("Failed to verify reset link");
        } finally {
            setIsVerifying(false);
        }
    };

    const validatePassword = (): boolean => {
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return false;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) return;

        setIsLoading(true);
        try {
            await authService.resetPassword(token, newPassword);
            setIsSuccess(true);
            toast.success("Password reset successfully!");
            setTimeout(() => navigate("/login"), 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = () => {
        if (!newPassword) return { strength: 0, label: "", color: "" };

        let strength = 0;
        if (newPassword.length >= 8) strength++;
        if (newPassword.length >= 12) strength++;
        if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
        if (/\d/.test(newPassword)) strength++;
        if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

        if (strength <= 2) return { strength, label: "Weak", color: "bg-red-500" };
        if (strength <= 3) return { strength, label: "Fair", color: "bg-amber-500" };
        if (strength <= 4) return { strength, label: "Good", color: "bg-emerald-500" };
        return { strength, label: "Strong", color: "bg-emerald-600" };
    };

    const passwordStrength = getPasswordStrength();

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center">
                <div className="w-14 h-14 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-violet-500/20 mb-4" />
                <p className="text-[#7171A0] text-sm">Verifying reset link...</p>
            </div>
        );
    }

    if (!isValidToken) {
        return (
            <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-md text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-2">Invalid Reset Link</h1>
                    <p className="text-[#7171A0] text-sm mb-8">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <button
                        onClick={() => navigate("/forgot-password")}
                        className="btn-primary px-8 py-3.5 rounded-2xl font-bold text-sm"
                    >
                        Request New Link
                    </button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center"
                >
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
                    <h1 className="text-2xl font-black tracking-tight mb-2">Password Reset!</h1>
                    <p className="text-[#7171A0] text-sm">
                        Your password has been reset successfully. Redirecting to login...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Ambient orbs */}
            <div className="absolute top-[-100px] left-[-80px] w-72 h-72 rounded-full bg-violet-700/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Reset Password</h1>
                    <p className="text-[#7171A0] text-sm">
                        Choose a strong password for your account.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-[#B0B0D0] mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                            <input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="input-nightlife w-full pl-11 pr-12 py-3.5 text-sm"
                                required
                                minLength={8}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A6A] hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Password strength indicator */}
                        {newPassword && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-[#7171A0]">Password strength:</span>
                                    <span className={`text-xs font-medium ${passwordStrength.strength >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#B0B0D0] mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A6A]" />
                            <input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="input-nightlife w-full pl-11 pr-12 py-3.5 text-sm"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A6A] hover:text-white transition-colors"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Match indicator */}
                        {confirmPassword && (
                            <div className="mt-2 flex items-center gap-2">
                                {newPassword === confirmPassword ? (
                                    <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-xs text-emerald-400">Passwords match</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-xs text-amber-400">Passwords don't match</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Password requirements */}
                    <div className="card-surface p-4">
                        <p className="text-xs text-[#7171A0] mb-2">Password must contain:</p>
                        <ul className="space-y-1 text-xs text-[#7171A0]">
                            <li className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-400' : 'bg-[#4A4A6A]'}`} />
                                At least 8 characters
                            </li>
                            <li className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'bg-emerald-400' : 'bg-[#4A4A6A]'}`} />
                                Uppercase and lowercase letters (recommended)
                            </li>
                            <li className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${/\d/.test(newPassword) ? 'bg-emerald-400' : 'bg-[#4A4A6A]'}`} />
                                At least one number (recommended)
                            </li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !newPassword || !confirmPassword}
                        className="btn-primary w-full py-4 rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Resetting...
                            </div>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
