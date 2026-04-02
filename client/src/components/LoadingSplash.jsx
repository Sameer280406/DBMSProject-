import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingSplash({ message = "Syncing your portal..." }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors"
    >
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-8">
          {/* Pulsing ring */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl"
          />
          
          <div className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl premium-shadow ring-1 ring-slate-200/50 dark:ring-slate-800/50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={48} className="text-brand-600 dark:text-brand-400 stroke-[1.5]" />
            </motion.div>
          </div>
        </div>

        <motion.h2 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-2"
        >
          vCAMPs
        </motion.h2>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          {message}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
