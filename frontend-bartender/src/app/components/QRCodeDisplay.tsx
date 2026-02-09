import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 240 }: QRCodeDisplayProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div className="bg-white p-6 rounded-3xl shadow-[0_0_40px_rgba(147,51,234,0.6)]">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={false}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl -z-10" />
    </motion.div>
  );
}
