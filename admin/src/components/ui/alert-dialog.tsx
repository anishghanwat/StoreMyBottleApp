"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "./utils";
import { buttonVariants } from "./button";

// ---------------------------------------------------------------------------
// Root / Trigger / Portal – thin pass-throughs
// ---------------------------------------------------------------------------

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal
      data-slot="alert-dialog-portal"
      container={document.body}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Overlay – darkens the background
// ---------------------------------------------------------------------------

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    data-slot="alert-dialog-overlay"
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    }}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

// ---------------------------------------------------------------------------
// Content – the dialog box itself, rendered via a React portal
// ---------------------------------------------------------------------------

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  // We need to know whether the dialog is open so we can portal-render it.
  // AlertDialogPrimitive.Root controls this; we use the Portal + Overlay approach.
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      {/* Centering shell */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <AlertDialogPrimitive.Content
          data-slot="alert-dialog-content"
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200",
            className,
          )}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            boxShadow:
              "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.08)",
            padding: "1.5rem",
            width: "100%",
            maxWidth: "28rem",
            position: "relative",
            display: "grid",
            gap: "1rem",
          }}
          {...props}
        >
          {children}
        </AlertDialogPrimitive.Content>
      </div>
    </AlertDialogPortal>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Footer – right-aligned buttons
// ---------------------------------------------------------------------------

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-row justify-end gap-2", className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      style={{ color: "#111827" }}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm", className)}
      style={{ color: "#6b7280" }}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Cancel button
// ---------------------------------------------------------------------------

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      style={{
        backgroundColor: "transparent",
        borderColor: "#d1d5db",
        color: "#374151",
      }}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
