import { useState } from "react"
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

interface LoginProps {
    onLogin: (user: any) => void
}

export function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = await authService.login(email, password)

            // Verify role (security check on frontend too)
            if (data.user.role !== 'admin') {
                throw new Error("Access denied. Admin privileges required.")
            }

            localStorage.setItem('admin_token', data.access_token)
            localStorage.setItem('admin_user', JSON.stringify(data.user))

            toast.success("Welcome back, Admin")
            onLogin(data.user)
        } catch (error: any) {
            console.error(error)
            let errorMessage = "Login failed"
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    // FastAPI validation error
                    errorMessage = error.response.data.detail.map((e: any) => e.msg).join(', ')
                } else {
                    errorMessage = error.response.data.detail
                }
            } else if (error.message) {
                errorMessage = error.message
            }
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Admin Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access the admin panel.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
