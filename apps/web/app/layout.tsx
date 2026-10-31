import type {Metadata} from 'next';
import {Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Sans} from 'next/font/google';
import './globals.css';
import './journey.css';
import './theme.css';
import './screens.css';
import AppShell from '@/components/AppShell';

const display = Bricolage_Grotesque({subsets: ['latin'], variable: '--font-display', display: 'swap'});
const body = Instrument_Sans({subsets: ['latin'], variable: '--font-body', display: 'swap'});
const mono = IBM_Plex_Mono({subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap'});

export const metadata: Metadata = {title: 'ResumeLoop', description: 'Find your way back to learning after a missed or interrupted class'};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" data-theme="dark" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning><body><AppShell>{children}</AppShell></body></html>;
}
