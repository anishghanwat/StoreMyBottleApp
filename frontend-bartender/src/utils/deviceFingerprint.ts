/**
 * Generate a device fingerprint for QR code security
 * This creates a unique identifier based on browser/device characteristics
 */
export function generateDeviceFingerprint(): string {
    const components: string[] = [];

    // Browser info
    components.push(navigator.userAgent);
    components.push(navigator.language);
    components.push(String(navigator.hardwareConcurrency || 0));
    components.push(String(navigator.maxTouchPoints || 0));

    // Screen info
    components.push(String(screen.width));
    components.push(String(screen.height));
    components.push(String(screen.colorDepth));
    components.push(String(window.devicePixelRatio || 1));

    // Timezone
    components.push(String(new Date().getTimezoneOffset()));

    // Platform
    components.push(navigator.platform);

    // Create hash from components
    const fingerprint = components.join('|');

    // Simple hash function (not cryptographic, just for fingerprinting)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to hex string
    return Math.abs(hash).toString(36);
}
