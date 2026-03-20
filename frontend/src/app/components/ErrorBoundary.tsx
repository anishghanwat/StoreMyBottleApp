import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#09090F] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
                        ⚠️
                    </div>
                    <h2 className="text-lg font-bold">Something went wrong</h2>
                    <p className="text-[#7171A0] text-sm max-w-xs">
                        An unexpected error occurred. Please refresh the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-6 py-3 rounded-2xl bg-violet-600 text-white text-sm font-bold"
                    >
                        Refresh
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
