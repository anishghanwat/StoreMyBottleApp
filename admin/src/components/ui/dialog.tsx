"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog@1.1.6";
import { XIcon } from "lucide-react@0.487.0";

import { cn } from "./utils";

// Contexts for open state and close callback
const DialogOpenContext = React.createContext<boolean>(false);
const DialogCloseContext = React.createContext<() => void>(() => { });

function Dialog({
  open,
  onOpenChange,
  defaultOpen,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (open === undefined) setUncontrolledOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [open, onOpenChange],
  );

  const handleClose = React.useCallback(
    () => handleOpenChange(false),
    [handleOpenChange],
  );

  return (
    <DialogOpenContext.Provider value={isOpen}>
      <DialogCloseContext.Provider value={handleClose}>
        {/* Keep Primitive.Root for trigger wiring */}
        <DialogPrimitive.Root
          open={isOpen}
          onOpenChange={handleOpenChange}
          {...props}
        >
          {children}
        </DialogPrimitive.Root>
      </DialogCloseContext.Provider>
    </DialogOpenContext.Provider>
  );
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ onClick, ...props }: React.ComponentProps<"button">) {
  const handleClose = React.useContext(DialogCloseContext);
  return (
    <button
      data-slot="dialog-close"
      onClick={(e) => {
        handleClose();
        onClick?.(e);
      }}
      {...props}
    />
  );
}

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const handleClose = React.useContext(DialogCloseContext);
  return (
    <div
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(className)}
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: "0",
        zIndex: 9998,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

// Pure HTML dialog — bypasses ALL Radix Content positioning internals
const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const isOpen = React.useContext(DialogOpenContext);
  const handleClose = React.useContext(DialogCloseContext);

  // Block body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: "0",
          zIndex: 9998,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />
      {/* Centering shell — scrollable so tall dialogs don't go off-screen */}
      <div
        style={{
          position: "fixed",
          inset: "0",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          padding: "1rem",
          pointerEvents: "none",
        }}
      >
        {/* Actual dialog box */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          data-slot="dialog-content"
          onClick={(e) => e.stopPropagation()}
          className={cn(className)}
          style={{
            pointerEvents: "auto",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            boxShadow:
              "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.08)",
            padding: "1.5rem",
            width: "100%",
            maxWidth: "32rem",
            position: "relative",
            flex: "none",
            marginTop: "auto",
            marginBottom: "auto",
          }}
          {...props}
        >
          {children}
          {/* × close button */}
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              opacity: 0.7,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            <XIcon style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    data-slot="dialog-title"
    className={cn("text-lg leading-none font-semibold text-gray-900", className)}
    {...props}
  />
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    data-slot="dialog-description"
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
);
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
