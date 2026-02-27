import './globals.css';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ReactQueryProvider } from '../components/react-query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mini Jira Task Manager',
  description: 'Mini Jira-like task manager built with Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

