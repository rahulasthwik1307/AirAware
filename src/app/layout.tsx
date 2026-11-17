import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AirAware — Global Environmental Intelligence',
  description:
    'Real-time, hyperlocal environmental intelligence and actionable health guidance powered by open public science.',
  keywords: [
    'air quality',
    'AQI',
    'environmental health',
    'particulate matter',
    'wildfire smoke',
    'pollution forecast',
  ],
  authors: [{ name: 'AirAware Team' }],
};

export const viewport: Viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className="flex min-h-screen flex-col bg-[var(--surface-ground)] text-[var(--ink-primary)]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
