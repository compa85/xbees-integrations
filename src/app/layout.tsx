import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'X-Bees Integrations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
