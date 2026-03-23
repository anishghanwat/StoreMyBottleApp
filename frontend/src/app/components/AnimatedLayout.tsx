import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";

/**
 * Wraps every page in a shared AnimatePresence so route changes
 * produce a smooth fade + 8px upward slide transition.
 */
export function AnimatedLayout() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{ minHeight: "100dvh" }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
