'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/5',
  error: 'border-red-500/30 bg-red-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  info: 'border-blue-500/30 bg-blue-500/5',
};

const toastVariants = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.15 } },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', action?: ToastAction) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => removeToast(id), action ? 5000 : 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
              className={cn(
                'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg',
                styles[t.type]
              )}
              style={{
                backgroundColor: 'color-mix(in srgb, var(--background) 95%, transparent)',
              }}
            >
              {icons[t.type]}
              <p className="text-sm text-foreground/90 flex-1">{t.message}</p>
              {t.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-semibold rounded-lg px-2 shrink-0"
                  onClick={() => {
                    t.action!.onClick();
                    removeToast(t.id);
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t.action.label}
                </Button>
              )}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-0.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
