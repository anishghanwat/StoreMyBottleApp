import { ArrowLeft, Bell, Moon, Globe, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(true);
    const [expiryAlerts, setExpiryAlerts] = useState(true);

    return (
        <div className="min-h-screen bg-[#09090F] text-white">
            <div className="px-5 pt-12 pb-4 flex items-center sticky top-0 bg-[#09090F]/90 backdrop-blur-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
                </button>
                <h1 className="text-lg font-bold ml-2">Settings</h1>
            </div>

            <div className="px-5 pb-16 space-y-4">

                {/* Notifications */}
                <div className="card-surface p-4 space-y-1">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Notifications</p>

                    <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center">
                                <Bell className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Push Notifications</p>
                                <p className="text-xs text-[#4A4A6A]">Order updates and alerts</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setNotifications(v => !v); toast.success(notifications ? "Notifications disabled" : "Notifications enabled"); }}
                            className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? "bg-violet-600" : "bg-white/10"}`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                <Bell className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Expiry Reminders</p>
                                <p className="text-xs text-[#4A4A6A]">7-day and 1-day warnings</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setExpiryAlerts(v => !v); toast.success(expiryAlerts ? "Expiry alerts disabled" : "Expiry alerts enabled"); }}
                            className={`w-11 h-6 rounded-full transition-colors relative ${expiryAlerts ? "bg-violet-600" : "bg-white/10"}`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${expiryAlerts ? "translate-x-5" : "translate-x-0.5"}`} />
                        </button>
                    </div>
                </div>

                {/* Appearance */}
                <div className="card-surface p-4">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Appearance</p>
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Moon className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Dark Mode</p>
                                <p className="text-xs text-[#4A4A6A]">Always on for best experience</p>
                            </div>
                        </div>
                        <div className="w-11 h-6 rounded-full bg-violet-600 relative opacity-60 cursor-not-allowed">
                            <span className="absolute top-0.5 translate-x-5 w-5 h-5 bg-white rounded-full shadow" />
                        </div>
                    </div>
                </div>

                {/* Language */}
                <div className="card-surface p-4">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Language & Region</p>
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <Globe className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Language</p>
                                <p className="text-xs text-[#4A4A6A]">English (India)</p>
                            </div>
                        </div>
                        <span className="text-xs text-[#4A4A6A]">EN</span>
                    </div>
                </div>

                {/* Danger zone */}
                <div className="card-surface p-4 border border-red-500/10">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Account</p>
                    <button
                        onClick={() => toast.error("To delete your account, contact support@storemybottle.in")}
                        className="flex items-center gap-3 py-2 w-full text-left"
                    >
                        <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center">
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-400">Delete Account</p>
                            <p className="text-xs text-[#4A4A6A]">Permanently remove your data</p>
                        </div>
                    </button>
                </div>

                <p className="text-center text-[#4A4A6A] text-xs pt-2">StoreMyBottle v1.0.0</p>
            </div>
        </div>
    );
}
