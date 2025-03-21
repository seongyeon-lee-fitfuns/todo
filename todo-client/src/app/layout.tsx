import type { Metadata } from "next";
import localFont from "next/font/local";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import Nav from './components/Nav';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Todo Application",
  description: "투두 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <Nav />
          <main className="container mx-auto p-4">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
