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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="">
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
