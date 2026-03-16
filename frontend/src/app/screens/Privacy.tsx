import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function Privacy() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#09090F] text-white">
            <div className="px-5 pt-12 pb-4 flex items-center sticky top-0 bg-[#09090F]/90 backdrop-blur-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
                </button>
                <h1 className="text-lg font-bold ml-2">Privacy Policy</h1>
            </div>

            <div className="px-6 pb-16 space-y-6 text-sm text-[#A0A0C0] leading-relaxed max-w-2xl mx-auto">
                <p className="text-[#7171A0] text-xs">Last updated: March 2026</p>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">1. Information We Collect</h2>
                    <p>We collect the following information when you create an account or use our service:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-[#A0A0C0]">
                        <li>Name, email address</li>
                        <li>Date of birth (for age verification)</li>
                        <li>Payment information (processed by Razorpay — we do not store card details)</li>
                        <li>Purchase and redemption history</li>
                        <li>Device information and IP address (for security)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">2. How We Use Your Information</h2>
                    <p>Your information is used to:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Verify your age and identity</li>
                        <li>Process purchases and redemptions</li>
                        <li>Send transactional emails (purchase confirmations, expiry reminders)</li>
                        <li>Prevent fraud and ensure platform security</li>
                        <li>Comply with legal obligations</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">3. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong className="text-white">Razorpay</strong> — payment processing. Subject to Razorpay's privacy policy.</li>
                        <li><strong className="text-white">Resend</strong> — transactional email delivery.</li>
                        <li><strong className="text-white">Cloudinary</strong> — image hosting for venue and bottle images.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">4. Data Retention</h2>
                    <p>We retain your account data for as long as your account is active. Purchase and redemption records are retained for 7 years for legal and accounting purposes. You may request deletion of your account by contacting support.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">5. Your Rights</h2>
                    <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at support@storemybottle.in. We will respond within 30 days.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">6. Security</h2>
                    <p>We use industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and HttpOnly cookies. We do not store payment card details.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">7. Contact</h2>
                    <p>For privacy-related queries, contact: support@storemybottle.in</p>
                </section>

                <p className="text-[#4A4A6A] text-xs pt-4 border-t border-white/[0.06]">
                    StoreMyBottle · Pune, Maharashtra, India
                </p>
            </div>
        </div>
    );
}
