import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { resolveLocale } from '@fithub/shared';
import { QueryProvider } from '@/lib/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'FitHub - Gym Admin Dashboard',
  description: 'Manage your gym, track attendance, and monitor member engagement',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const { locale, dir } = resolveLocale(headerList.get('accept-language'));

  return (
    <html lang={locale} dir={dir}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
