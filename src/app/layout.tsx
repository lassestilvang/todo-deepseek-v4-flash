import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast-provider';
import { NavigationProgress } from '@/components/navigation-progress';
import { Sidebar } from '@/components/features/sidebar';
import { MobileNav } from '@/components/features/mobile-nav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Daily Planner',
  description: 'A warm, beautiful daily task planner',
  icons: { icon: '/favicon.ico' },
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
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <NavigationProgress />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:text-sm focus:font-medium focus:shadow-lg"
            >
              Skip to main content
            </a>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main id="main-content" className="flex-1 overflow-y-auto bg-background focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 contain-layout" tabIndex={-1}>
                <Suspense fallback={null}>
                  {children}
                </Suspense>
              </main>
            </div>
            <MobileNav />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
