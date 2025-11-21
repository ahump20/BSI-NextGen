import type { Metadata } from 'next';
import './globals.css';
import { CookieConsent } from '@/components/CookieConsent';
import { getAssetUrl } from '@/app/lib/cdn';

// Using system fonts as fallback to avoid network dependency during build
const fontClass = 'font-sans';

const defaultOgImage = getAssetUrl(
  'branding/og-default.png',
  'https://images.unsplash.com/photo-1587280501635-6850370e306d?q=80&w=1200&auto=format&fit=crop'
);

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
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: 'Blaze Sports Intel Intelligence Grid',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={fontClass}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
