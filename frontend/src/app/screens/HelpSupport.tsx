import { ArrowLeft, ChevronDown, Mail, ExternalLink, MessageCircle } from "lucide-react";
import { useNavigate, Link } from "react-router";
import { useState } from "react";

const FAQS = [
    {
        q: "How do I redeem my bottle at a venue?",
        a: "Go to My Bottles, tap the bottle you want to redeem, then tap 'Redeem a Peg'. Show the QR code to the bartender and they'll scan it to pour your drink.",
    },
    {
        q: "When does my bottle expire?",
        a: "Bottles expire 1 year from the date of purchase. You'll receive email reminders 7 days and 1 day before expiry.",
    },
    {
        q: "Can I use my bottle at any venue?",
        a: "No — each bottle is tied to the specific venue where you purchased it. You can only redeem it at that venue.",
    },
    {
        q: "What happens if I lose my phone?",
        a: "Your bottles are saved to your account, not your device. Log in from any device to access them. You can also log out all other sessions from Privacy & Security settings.",
    },
    {
        q: "Can I get a refund?",
        a: "Refunds are subject to the venue's policy. Contact support with your order details and we'll help facilitate the process.",
    },
    {
        q: "How do I change my phone number?",
        a: "Phone number changes require identity verification. Please contact support at support@storemybottle.in with your request.",
    },
];

export default function HelpSupport() {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-[#09090F] text-white">
            <div className="px-5 pt-12 pb-4 flex items-center sticky top-0 bg-[#09090F]/90 backdrop-blur-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
                </button>
                <h1 className="text-lg font-bold ml-2">Help & Support</h1>
            </div>

            <div className="px-5 pb-16 space-y-4">

                {/* Contact card */}
                <div className="card-surface p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-600 to-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Contact Support</p>
                        <p className="text-xs text-[#7171A0] truncate">support@storemybottle.in</p>
                    </div>
                    <a
                        href="mailto:support@storemybottle.in"
                        className="flex items-center gap-1.5 text-xs bg-violet-600/20 text-violet-400 px-3 py-1.5 rounded-xl font-medium"
                    >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                    </a>
                </div>

                {/* FAQ */}
                <div className="card-surface p-4">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Frequently Asked Questions</p>
                    <div className="space-y-1">
                        {FAQS.map((faq, i) => (
                            <div key={i} className="border-b border-white/[0.05] last:border-0">
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full flex items-center justify-between py-3 text-left gap-3"
                                >
                                    <span className="text-sm font-medium">{faq.q}</span>
                                    <ChevronDown className={`w-4 h-4 text-[#4A4A6A] flex-shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                                </button>
                                {openIndex === i && (
                                    <p className="text-sm text-[#7171A0] pb-3 leading-relaxed">{faq.a}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legal */}
                <div className="card-surface p-4 space-y-1">
                    <p className="text-[11px] text-[#7171A0] font-semibold uppercase tracking-widest mb-3">Legal</p>
                    <Link to="/terms" className="flex items-center justify-between py-2.5 border-b border-white/[0.05]">
                        <span className="text-sm">Terms of Service</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#4A4A6A]" />
                    </Link>
                    <Link to="/privacy" className="flex items-center justify-between py-2.5">
                        <span className="text-sm">Privacy Policy</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#4A4A6A]" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
