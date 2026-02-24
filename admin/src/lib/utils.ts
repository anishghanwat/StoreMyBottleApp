import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Consistent date formatting
export function formatDate(date: string | Date, formatStr: string = "MMM dd, yyyy"): string {
    try {
        return format(new Date(date), formatStr)
    } catch {
        return "Invalid date"
    }
}

export function formatDateTime(date: string | Date): string {
    return formatDate(date, "MMM dd, yyyy HH:mm")
}

export function formatTimeAgo(date: string | Date): string {
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
        return "Unknown"
    }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null
            func(...args)
        }

        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, wait)
    }
}

// Format currency
export function formatCurrency(amount: number, currency: string = "INR"): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}

// Truncate text
export function truncate(text: string, length: number = 50): string {
    if (text.length <= length) return text
    return text.substring(0, length) + "..."
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        return false
    }
}
