'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const floatingAnimation = {
  animate: {
    y: [0, -8, 0],
    rotate: [0, 2, -2, 0],
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const todayIcon = (
  <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
    <motion.circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" className="text-primary/15" fill="currentColor" fillOpacity="0.03" />
    <motion.circle
      cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2" className="text-primary/25"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 }}
      strokeDasharray="0 1"
    />
    <motion.circle
      cx="40" cy="40" r="20" stroke="currentColor" strokeWidth="1.5" className="text-primary/20"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: 'easeInOut', delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
      strokeDasharray="0 1"
    />
    <motion.circle cx="40" cy="40" r="3" fill="currentColor" className="text-primary/40" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const angle = (i * 45 * Math.PI) / 180;
      return (
        <motion.circle
          key={i}
          cx={40 + 12 * Math.cos(angle)}
          cy={40 + 12 * Math.sin(angle)}
          r="2" fill="currentColor" className="text-primary/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
        />
      );
    })}
  </svg>
);
const defaultIcon = (
  <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
    <motion.rect x="16" y="20" width="48" height="12" rx="6" stroke="currentColor" strokeWidth="2" className="text-primary/20" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
    <motion.rect x="16" y="38" width="48" height="12" rx="6" stroke="currentColor" strokeWidth="2" className="text-primary/15" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }} />
    <motion.rect x="16" y="56" width="32" height="12" rx="6" stroke="currentColor" strokeWidth="2" className="text-primary/10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.4 }} />
    <motion.circle cx="24" cy="26" r="2" fill="currentColor" className="text-primary/40" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} />
    <motion.circle cx="24" cy="44" r="2" fill="currentColor" className="text-primary/30" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }} />
  </svg>
);

const inboxIcon = (
  <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
    <motion.path
      d="M16 40 L24 28 L56 28 L64 40 L64 56 Q64 60 60 60 L20 60 Q16 60 16 56 Z"
      stroke="currentColor" strokeWidth="2" className="text-primary/20"
      fill="currentColor" fillOpacity="0.03"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5 }}
    />
    <motion.line x1="16" y1="40" x2="34" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary/30" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
    <motion.line x1="64" y1="40" x2="46" y2="40" stroke="currentColor" strokeWidth="2" className="text-primary/30" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.5 }} />
    <motion.circle cx="40" cy="34" r="3" fill="currentColor" className="text-primary/40" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.8, type: 'spring' }} />
  </svg>
);

const iconMap: Record<string, React.ReactNode> = {
  today: todayIcon,
  default: defaultIcon,
  inbox: inboxIcon,
};

interface EmptyStateProps {
  icon?: keyof typeof iconMap | string;
  message: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'default', message, hint, actionLabel, onAction }: EmptyStateProps) {
  const IconComponent = iconMap[icon] || iconMap.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
    >
      <motion.div
        className="h-32 w-32 sm:h-40 sm:w-40 mb-6 sm:mb-8"
        variants={floatingAnimation}
        animate="animate"
      >
        <div className="w-full h-full text-primary/30">
          {IconComponent}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-foreground/80 font-semibold text-lg sm:text-xl"
      >
        {message}
      </motion.p>

      {hint && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground/50 mt-1.5 mb-6 max-w-xs leading-relaxed"
        >
          {hint}
        </motion.p>
      )}

      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button variant="outline" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-shadow" onClick={onAction}>
            <Plus className="h-4 w-4 mr-1.5" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
