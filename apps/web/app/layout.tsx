import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ResumeLoop | Research Starter', description: 'Learner recovery after a missed or interrupted class' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;}
