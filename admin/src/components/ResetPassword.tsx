import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/api"
import { toast } from "sonner"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ResetPasswordProps {
    token: string
    onSuccess: () => void
    onBack: () => void
}

export function ResetPassword({ token, onSuccess, onBack }: ResetPasswordProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

    useEffect(() => {
        const verifyToken = async () => {
            try {
                await authService.verifyResetToken(token)
                setIsValidToken(true)
            } catch (error) {
                setIsValidToken(false)
                toast.error("Invalid or expired reset link")
            }
        }

        verifyToken()
    }, [token])

    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return { strength: 0, label: "", color: "" }
        if (password.length < 6) return { strength: 25, label: "Weak", color: "bg-red-500" }
        if (password.length < 10) return { strength: 50, label: "Fair", color: "bg-yellow-500" }
        if (password.length < 14) return { strength: 75, label: "Good", color: "bg-blue-500" }
        return { strength: 100, label: "Strong", color: "bg-green-500" }
    }

    const passwordStrength = getPasswordStrength(newPassword)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match")
            return
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            await authService.resetPassword(token, newPassword)
            setSuccess(true)
            toast.success("Password reset successfully!")
            setTimeout(() => onSuccess(), 2000)
        } catch (error: any) {
            console.error(error)
            const errorMessage = error.response?.data?.detail || "Failed to reset password. Please try again."
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Invalid token state
    if (isValidToken === false) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
                        <CardDescription>
                            This password reset link is invalid or has expired. Please request a new one.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" onClick={onBack}>
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Password Reset!</CardTitle>
                        <CardDescription>
                            Your password has been successfully reset. Redirecting to login...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Loading token verification
    if (isValidToken === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Card className="w-full max-w-sm">
                    <CardContent className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Reset password form
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Create New Password</CardTitle>
                    <CardDescription>
                        Enter a strong password for your admin account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            {newPassword && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Password strength</span>
                                        <span className={`font-semibold ${passwordStrength.strength >= 75 ? 'text-green-600' :
                                                passwordStrength.strength >= 50 ? 'text-blue-600' :
                                                    'text-red-600'
                                            }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <Progress value={passwordStrength.strength} className="h-2" />
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-red-600">Passwords don't match</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            type="submit"
                            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
