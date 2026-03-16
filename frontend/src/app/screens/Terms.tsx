import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function Terms() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#09090F] text-white">
            <div className="px-5 pt-12 pb-4 flex items-center sticky top-0 bg-[#09090F]/90 backdrop-blur-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-[#7171A0]" />
                </button>
                <h1 className="text-lg font-bold ml-2">Terms & Conditions</h1>
            </div>

            <div className="px-6 pb-16 space-y-6 text-sm text-[#A0A0C0] leading-relaxed max-w-2xl mx-auto">
                <p className="text-[#7171A0] text-xs">Last updated: March 2026</p>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">1. Eligibility</h2>
                    <p>You must be at least 25 years of age to use StoreMyBottle. By creating an account, you confirm that you meet this age requirement. This restriction exists in compliance with the Maharashtra Prohibition Act and applicable Indian state laws governing the sale and consumption of alcohol.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">2. Service Description</h2>
                    <p>StoreMyBottle is a bottle storage and management platform that allows customers to purchase and store bottles at partner venues. The service facilitates the purchase, storage, and redemption of alcoholic beverages at licensed venues.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">3. Responsible Use</h2>
                    <p>You agree to use this service responsibly. StoreMyBottle promotes responsible drinking. Do not drink and drive. Do not purchase alcohol for minors. Excessive alcohol consumption is harmful to health.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">4. Payments & Refunds</h2>
                    <p>All payments are processed securely. Refund requests must be submitted within 7 days of purchase. Refunds are subject to review and may be declined if the bottle has been partially redeemed. Refunds are processed to the original payment method within 5–7 business days.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">5. Bottle Expiry</h2>
                    <p>Stored bottles expire 90 days from the date of purchase. Unredeemed bottles after expiry are forfeited. You will receive email reminders before expiry.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">6. Account Termination</h2>
                    <p>We reserve the right to suspend or terminate accounts that violate these terms, provide false age information, or engage in fraudulent activity.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">7. Limitation of Liability</h2>
                    <p>StoreMyBottle is not liable for any indirect, incidental, or consequential damages arising from the use of this service. Our total liability is limited to the amount paid for the specific transaction in question.</p>
                </section>

                <section>
                    <h2 className="text-white font-semibold text-base mb-2">8. Governing Law</h2>
                    <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra.</p>
                </section>

                <p className="text-[#4A4A6A] text-xs pt-4 border-t border-white/[0.06]">
                    For questions, contact us at support@storemybottle.in
                </p>
            </div>
        </div>
    );
}
