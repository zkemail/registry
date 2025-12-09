import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Fustat } from 'next/font/google';
import AuthHandler from './components/AuthHandler';
import GoogleAuthProvider from './contexts/GoogleAuthProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ToastProvider from './contexts/ToastProvider';
import { Suspense } from 'react';
import { CSPostHogProvider } from './providers';
import PostHogPageView from './pageview';
import HelpFab from '@/components/HelpFab';

const fustat = Fustat({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZK Email Registry',
  description: 'Create email blueprints to create proofs about emails.',
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/favicon-dark.svg',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/favicon-light.svg',
      },
    ],
  },
  openGraph: {
    title: 'ZK Email Registry',
    description: 'Create email blueprints to create proofs about emails.',
    url: 'https://registry.zk.email', // your site URL
    siteName: 'ZK Email Registry',
    images: [
      {
        url: '/og-image.png', // or full URL: 'https://registry.zk.email/og-image.png'
        width: 1200,
        height: 630,
        alt: 'ZK Email Registry',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZK Email Registry',
    description: 'Create email blueprints to create proofs about emails.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="" suppressHydrationWarning>
      <body className={`${fustat.className} flex min-h-screen flex-col bg-[#F5F3EF] antialiased`}>
        <Suspense>
          <ThemeProvider attribute="class">
            <CSPostHogProvider>
              <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ''}>
                <GoogleAuthProvider>
                  <ToastProvider>
                    <AuthHandler />
                    <PostHogPageView />
                    {children}
                    <HelpFab />
                  </ToastProvider>
                </GoogleAuthProvider>
              </GoogleOAuthProvider>
            </CSPostHogProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
