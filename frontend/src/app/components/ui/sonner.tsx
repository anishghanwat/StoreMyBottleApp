"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "group toast",
          description: "group-[.toast]:text-[#7171A0]",
          actionButton: "group-[.toast]:bg-violet-600 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white",
          error: "group-[.toast]:!bg-red-500/12 group-[.toast]:!border-red-500/30 group-[.toast]:!text-red-400",
          success: "group-[.toast]:!bg-green-500/12 group-[.toast]:!border-green-500/30 group-[.toast]:!text-green-400",
          warning: "group-[.toast]:!bg-yellow-500/12 group-[.toast]:!border-yellow-500/30 group-[.toast]:!text-yellow-400",
          info: "group-[.toast]:!bg-blue-500/12 group-[.toast]:!border-blue-500/30 group-[.toast]:!text-blue-400",
        },
      }}
      expand={false}
      richColors
      closeButton
      duration={4000}
      gap={8}
      visibleToasts={3}
      {...props}
    />
  );
};

export { Toaster };
