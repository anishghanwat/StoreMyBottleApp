import { useEffect } from "react";
import { useNavigate } from "react-router";
import { sessionManager } from "../../utils/session";

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * Protects bartender routes — redirects to login if no valid session exists.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
    const navigate = useNavigate();

    useEffect(() => {
        if (!sessionManager.isLoggedIn()) {
            navigate("/", { replace: true });
        }
    }, [navigate]);

    if (!sessionManager.isLoggedIn()) return null;

    return <>{children}</>;
}
