import type {Metadata} from 'next';
import './globals.css';
import './journey.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {title: 'ResumeLoop', description: 'Find your way back to learning after a missed or interrupted class'};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning><body><AppShell>{children}</AppShell></body></html>;
}
