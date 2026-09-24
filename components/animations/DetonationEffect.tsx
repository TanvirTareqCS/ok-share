"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DetonationEffect() {
  return (
    <motion.div initial={{ backgroundColor: "#ffffff" }} animate={{ backgroundColor: "#0f172a" }} transition={{ duration: 1 }} className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <motion.div initial={{ scale: 1, opacity: 1 }} animate={{ scale: [1, 20, 50], opacity: [1, 1, 0] }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute z-0 text-9xl pointer-events-none">💥</motion.div>
      <motion.div animate={{ x: [-20, 20, -20, 20, -10, 10, 0], y: [-20, 20, -20, 20, -10, 10, 0] }} transition={{ duration: 0.5 }} className="z-10 max-w-md w-full bg-surface border border-accent/60 p-8 rounded-xl text-center shadow-2xl mt-8">
        <h1 className="text-4xl font-black text-accent mb-4 tracking-widest">OBLITERATED</h1>
        <p className="text-muted font-mono text-sm">This data has been permanently wiped from the server. It cannot be recovered by anyone.</p>
        <Link href="/" className="inline-block mt-6 bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors">Back to OK-Share</Link>
      </motion.div>
    </motion.div>
  );
}