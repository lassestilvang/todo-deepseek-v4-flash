'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const CommandPalette = dynamic(() => import('@/components/features/command-palette').then(m => m.CommandPalette), {
  loading: () => null,
});

const KeyboardShortcuts = dynamic(() => import('@/components/features/keyboard-shortcuts').then(m => m.KeyboardShortcuts), {
  loading: () => null,
});

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutsKey, setShortcutsKey] = useState(0);
  const shortcutsOpenRef = useRef(shortcutsOpen);

  // Handle PWA shortcut — open quick-add form on page load
  useEffect(() => {
    if (searchParams?.get('quick') === '1') {
      const url = new URL(window.location.href);
      url.searchParams.delete('quick');
      window.history.replaceState({}, '', url.toString());
      // Focus the quick add input after a short delay for the page to mount
      setTimeout(() => {
        const quickAdd = document.querySelector<HTMLInputElement>('[data-quick-add]');
        quickAdd?.focus();
      }, 100);
    }
  }, [searchParams]);

  useEffect(() => {
    shortcutsOpenRef.current = shortcutsOpen;
  }, [shortcutsOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsKey(k => k + 1);
        setShortcutsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && shortcutsOpenRef.current) {
        setShortcutsOpen(false);
      }
      
      // Navigation
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key) {
          case '1': router.push('/today'); break;
          case '2': router.push('/next-7-days'); break;
          case '3': router.push('/upcoming'); break;
          case '4': router.push('/all'); break;
          case '5': router.push('/calendar'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <>
      <div key={pathname} className="animate-fade-in" style={{ viewTransitionName: 'page-content' }}>
        {children}
      </div>

      {shortcutsOpen && <KeyboardShortcuts key={shortcutsKey} open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />}

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}

