import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast-provider';
import { NavigationProgress } from '@/components/navigation-progress';
import { NotificationProvider } from '@/components/notification-provider';
import { OnlineStatus } from '@/components/online-status';
import { FocusModeProvider } from '@/components/focus-mode-provider';
import { LayoutClient } from '@/components/layout-client';
import { MobileNav } from '@/components/features/mobile-nav';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Daily Planner',
  description: 'A warm, beautiful daily task planner',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Planner',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'theme-color': '#fbf8f4',
    'dark:theme-color': '#1a1612',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fbf8f4" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1612" media="(prefers-color-scheme: dark)" />
        <meta name="application-name" content="Planner" />
        <meta name="apple-mobile-web-app-title" content="Planner" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('planner-theme') || 'system';
                  var root = document.documentElement;
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }
                } catch (e) {}
              })();
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <NotificationProvider>
            <NavigationProgress />
            <OnlineStatus />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:text-sm focus:font-medium focus:shadow-lg"
            >
              Skip to main content
            </a>
            <FocusModeProvider>
            <LayoutClient>
              {children}
            </LayoutClient>
            </FocusModeProvider>
            <MobileNav />
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
