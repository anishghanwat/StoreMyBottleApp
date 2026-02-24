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
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [config, setConfig] = React.useState<{
        title: string
        description: string
        onConfirm: () => void
        confirmText?: string
        variant?: "default" | "destructive"
    }>({
        title: "",
        description: "",
        onConfirm: () => { },
    })

    const confirm = (options: {
        title: string
        description: string
        onConfirm: () => void
        confirmText?: string
        variant?: "default" | "destructive"
    }) => {
        setConfig(options)
        setIsOpen(true)
    }

    const dialog = (
        <ConfirmDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            title={config.title}
            description={config.description}
            onConfirm={config.onConfirm}
            confirmText={config.confirmText}
            variant={config.variant}
        />
    )

    return { confirm, dialog }
}
