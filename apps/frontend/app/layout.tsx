import type { Metadata } from 'next';
import './globals.css';
import { AuthProviderWrapper } from './auth-provider-wrapper';

export const metadata: Metadata = {
  title: 'Document Manager',
  description: 'Internal Document Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
