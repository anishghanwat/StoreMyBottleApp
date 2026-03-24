import { ArrowLeft, Smartphone, LogOut, ExternalLink } from "lucide-react";
import { useNavigate, Link } from "react-router";
import { useState, useEffect } from "react";
import apiClient from "../../services/api";
import { authService } from "../../services/auth.service";
import { toast } from "sonner";
import { parseApiError } from "../../utils/parseApiError";

interface Session {
    id: string;
    device_info: string;
    ip_address: string;
    created_at: string;
    last_active: string;
    is_current: boolean;
}

export default function PrivacySecurityPage() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loggingOutAll, setLoggingOutAll] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const res = await apiClient.get("/auth/sessions");
            setSessions(res.data);
        } catch {
            // sessions endpoint may not exist yet — fail silently
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleLogoutAll = async () => {
        try {
            setLoggingOutAll(true);
            await apiClient.post("/auth/logout-all");
            authService.logout();
            toast.success("Logged out from all devices");
            navigate("/login");
        } catch (err: any) {
            toast.error(parseApiError(err, "Failed to logout all devices"));
        } finally {
            setLoggingOutAll(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090F] text-white">
            <div className="px-5 pt-12 pb-4 flex items-center sticky top-0 bg-[#09090F]/90 backdrop-blur-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
                </button>
                <h1 className="text-lg font-bold ml-2">Privacy & Security</h1>
            </div>

            <div className="px-5 pb-16 space-y-4">

                {/* Active Sessions */}
                <div className="card-surface p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Smartphone className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-sm font-semibold">Active Sessions</p>
                        </div>
                        <button
                            onClick={handleLogoutAll}
                            disabled={loggingOutAll}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-60"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            {loggingOutAll ? "Logging out..." : "Logout all"}
                        </button>
                    </div>

                    {loadingSessions ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
                        </div>
                    ) : sessions.length > 0 ? (
                        <div className="space-y-2">
                            {sessions.map((s) => (
                                <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                                    <div>
                                        <p className="text-sm font-medium">{s.device_info || "Unknown device"}</p>
                                        <p className="text-xs text-[#4A4A6A]">{s.ip_address} · {new Date(s.last_active).toLocaleDateString()}</p>
                                    </div>
                                    {s.is_current && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">Current</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-[#4A4A6A] text-center py-3">No session data available</p>
                    )}
                </div>

                {/* Legal links */}
                <div className="card-surface p-4 space-y-1">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Legal</p>
                    <Link to="/privacy" className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                        <span className="text-sm">Privacy Policy</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#4A4A6A]" />
                    </Link>
                    <Link to="/terms" className="flex items-center justify-between py-2.5">
                        <span className="text-sm">Terms of Service</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#4A4A6A]" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
