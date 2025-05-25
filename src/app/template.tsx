'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CommandPalette } from '@/components/features/command-palette';

export default function Template({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}
