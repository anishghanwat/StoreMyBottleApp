import * as React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default"
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// Hook for easier usage
// Uses a ref for onConfirm to avoid stale closure bugs when storing async callbacks
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [config, setConfig] = React.useState<{
        title: string
        description: string
        confirmText?: string
        variant?: "default" | "destructive"
    }>({
        title: "",
        description: "",
    })

    // Store onConfirm in a ref so it always has the latest closure
    const onConfirmRef = React.useRef<() => void>(() => { })

    // Also support promise-based usage: const confirmed = await confirm({...})
    const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

    const confirm = (options: {
        title: string
        description: string
        onConfirm?: () => void
        confirmText?: string
        variant?: "default" | "destructive"
    }): Promise<boolean> => {
        onConfirmRef.current = options.onConfirm ?? (() => { })
        setConfig({
            title: options.title,
            description: options.description,
            confirmText: options.confirmText,
            variant: options.variant,
        })
        setIsOpen(true)

        // Return promise for await-based usage
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve
        })
    }

    const handleConfirm = () => {
        onConfirmRef.current()
        resolveRef.current?.(true)
        resolveRef.current = null
        setIsOpen(false)
    }

    const handleCancel = () => {
        resolveRef.current?.(false)
        resolveRef.current = null
        setIsOpen(false)
    }

    const dialog = (
        <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{config.title}</AlertDialogTitle>
                    <AlertDialogDescription>{config.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={config.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                    >
                        {config.confirmText ?? "Confirm"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )

    return { confirm, dialog }
}
