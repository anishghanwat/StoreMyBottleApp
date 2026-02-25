import { Link } from "react-router";
import { Home, Wine, User } from "lucide-react";

type Tab = "home" | "bottles" | "profile";

interface BottomNavProps {
    active: Tab;
}

export function BottomNav({ active }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bottom-nav px-6 py-3 z-50">
            <div className="flex items-center justify-around max-w-md mx-auto">

                {/* Home */}
                <Link to="/" className="flex flex-col items-center gap-1 group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${active === "home" ? "bg-violet-500/15" : "group-active:bg-white/5"
                        }`}>
                        <Home className={`w-5 h-5 transition-colors duration-200 ${active === "home" ? "text-violet-400" : "text-[#4A4A6A] group-hover:text-[#7171A0]"
                            }`} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${active === "home" ? "text-violet-400" : "text-[#4A4A6A]"
                        }`}>Home</span>
                </Link>

                {/* My Bottles */}
                <Link to="/my-bottles" className="flex flex-col items-center gap-1 group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${active === "bottles" ? "bg-violet-500/15" : "group-active:bg-white/5"
                        }`}>
                        <Wine className={`w-5 h-5 transition-colors duration-200 ${active === "bottles" ? "text-violet-400" : "text-[#4A4A6A] group-hover:text-[#7171A0]"
                            }`} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${active === "bottles" ? "text-violet-400" : "text-[#4A4A6A]"
                        }`}>My Bottles</span>
                </Link>

                {/* Profile */}
                <Link to="/profile" className="flex flex-col items-center gap-1 group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${active === "profile" ? "bg-violet-500/15" : "group-active:bg-white/5"
                        }`}>
                        <User className={`w-5 h-5 transition-colors duration-200 ${active === "profile" ? "text-violet-400" : "text-[#4A4A6A] group-hover:text-[#7171A0]"
                            }`} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${active === "profile" ? "text-violet-400" : "text-[#4A4A6A]"
                        }`}>Profile</span>
                </Link>

            </div>
        </div>
    );
}
