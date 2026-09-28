"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function FlyingPlane({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: "-70vw", y: 40, scale: 0.6, rotate: -12, opacity: 0 }}
          animate={{
            x: ["-70vw", "70vw"],
            y: [40, -50, 40],
            scale: [0.6, 1.1, 1.4],
            rotate: [-12, 8, -4],
            opacity: [0, 1, 1, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center text-9xl drop-shadow-[0_0_35px_rgba(239,68,68,0.8)]"
        >
          ✈️
        </motion.div>
      )}
    </AnimatePresence>
  );
}