import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/toast';

// Inter is the closest free match to Apple's SF Pro, so the UI looks the same on Windows and Mac.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// Monospace for the airport-style boards and small labels.
const board = JetBrains_Mono({ subsets: ['latin'], variable: '--font-board', display: 'swap' });

export const metadata: Metadata = {
  title: 'LAOT — Seafood Trading EDM',
  description: 'LAOT Seafood Trading Corporation — integrated operations and data quality management',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${board.variable}`}>
      <body className="font-sans text-slate-900 antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
