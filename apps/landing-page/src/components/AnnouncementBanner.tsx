import * as React from 'react';
import { motion } from 'framer-motion';

export default function AnnouncementBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, x: '-50%', scale: 0.95 }}
      animate={{ opacity: 1, y: '50%', x: '-50%', scale: 1 }}
      transition={{
        delay: 2.2, // Wait for hero title, subtitle, and CTA animations to complete
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1], // Smooth custom ease curve
      }}
      className="absolute bottom-0 left-1/2 z-20 w-[90%] max-w-3xl bg-card border border-border/80 rounded-3xl p-5 md:p-6 flex items-center justify-between gap-6"
    >
      <div className="flex flex-col justify-center text-left">
        <h2 className="text-lg md:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
          Today, Interview Masters<br className="hidden md:inline" /> launches public beta
        </h2>
        <a href="#" className="mt-3 text-xs md:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          Read the Release Notes
        </a>
      </div>
      <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-full overflow-hidden border border-border/40 bg-muted">
        <img src="/announcement-logo.png" alt="Emoji logo" className="w-full h-full object-cover" />
      </div>
    </motion.div>
  );
}
