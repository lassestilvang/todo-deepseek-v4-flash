'use client';

import { useLinkStatus } from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function NavigationProgress() {
  const { pending } = useLinkStatus();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (pending) {
      setVisible(true);
      setProgress(0);
      const t1 = setTimeout(() => { setProgress(30); }, 50);
      const t2 = setTimeout(() => { setProgress(60); }, 300);
      const t3 = setTimeout(() => { setProgress(85); }, 800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        setProgress(100);
      };
    } else if (visible) {
      setProgress(100);
      const t = setTimeout(() => { setVisible(false); setProgress(0); }, 400);
      return () => clearTimeout(t);
    }
  }, [pending, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] h-1 pointer-events-none"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 rounded-full"
            style={{ width: `${progress}%` }}
            animate={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full"
            style={{
              width: `${progress}%`,
              opacity: progress === 100 ? 0 : 0.6,
              transition: 'width 0.3s ease-out, opacity 0.2s ease-out',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
