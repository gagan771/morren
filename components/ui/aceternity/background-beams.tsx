"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute h-full w-full inset-0 bg-neutral-950 overflow-hidden",
                className
            )}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute h-full w-full inset-0 pointer-events-none"
            >
                <div className="absolute h-[100%] w-full inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]" />
                <div className="absolute h-[100%] w-full inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 [mask-image:radial-gradient(farthest-side_at_bottom,white,transparent)]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
            </motion.div>
        </div>
    );
};
