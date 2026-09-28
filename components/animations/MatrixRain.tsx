"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

const COLUMN_COUNT = 50;
const GLYPH_COUNT = 25;
const LEAD_GLYPH_STYLE = "text-white opacity-100 shadow-[0_0_8px_#fff]";
const TRAIL_GLYPH_STYLE = "text-green-500 opacity-60";

interface RainColumn {
  leftPercent: number;
  duration: number;
  delay: number;
  glyphs: string[];
}

/**
 * Randomised once per mount so the effect stays decorative without re-rolling
 * 1,250 random values on every render.
 */
function buildColumns(): RainColumn[] {
  return Array.from({ length: COLUMN_COUNT }, (_, index) => ({
    leftPercent: index * 2.5,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    glyphs: Array.from({ length: GLYPH_COUNT }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 93)),
    ),
  }));
}

export default function MatrixRain({ isVisible }: { isVisible: boolean }) {
  const columns = useMemo(() => buildColumns(), []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-bg"
        >
          <div className="absolute inset-0 bg-black/60" />
          {columns.map((column, index) => (
            <motion.div
              key={index}
              initial={{ y: "-100%" }}
              animate={{ y: "100vh" }}
              transition={{
                duration: column.duration,
                repeat: Infinity,
                ease: "linear",
                delay: column.delay,
              }}
              className="absolute flex flex-col font-mono text-xl"
              style={{ left: `${column.leftPercent}%` }}
            >
              {column.glyphs.map((glyph, glyphIndex) => (
                <div
                  key={glyphIndex}
                  className={glyphIndex === 0 ? LEAD_GLYPH_STYLE : TRAIL_GLYPH_STYLE}
                >
                  {glyph}
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
