/**
 * Extracts a human-readable error message from an Axios error response.
 * Handles FastAPI's {detail: string | array} and generic {message: string} shapes.
 */
export function parseApiError(err: any, fallback = "Something went wrong. Please try again."): string {
    if (!err.response) {
        if (err.message === "Network Error") return "Unable to connect. Check your internet connection.";
        if (err.code === "ECONNABORTED") return "Request timed out. Please try again.";
        return fallback;
    }

    const { status, data } = err.response;

    if (status === 429) return "Too many attempts. Please wait a moment and try again.";
    if (status === 401) return "Session expired. Please log in again.";
    if (status === 403) return "You don't have permission to do that.";
    if (status === 404) return data?.detail || data?.message || "Not found.";
    if (status >= 500) return "Server error. Please try again later.";

    // FastAPI detail field (string or Pydantic array)
    if (data?.detail) {
        const detail = data.detail;
        if (Array.isArray(detail)) return detail.map((e: any) => e.msg || e.message || String(e)).join(", ");
        if (typeof detail === "string") return detail;
    }

    // Generic message field
    if (data?.message && typeof data.message === "string") return data.message;

    return fallback;
}
