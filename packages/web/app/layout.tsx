import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Professional Sports Intelligence',
  description: 'Real-time sports data and analytics platform filling ESPN gaps with complete college baseball box scores and advanced predictive models.',
  keywords: [
    'sports analytics',
    'college baseball',
    'MLB',
    'NFL',
    'NBA',
    'NCAA football',
    'real-time scores',
    'sports intelligence',
  ],
  authors: [{ name: 'Blaze Sports Intel' }],
  openGraph: {
    title: 'Blaze Sports Intel',
    description: 'Professional Sports Intelligence Platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
