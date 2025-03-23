import type { Metadata } from "next";
import localFont from "next/font/local";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-500 to-purple-600 min-h-screen`}
      >
          <Nav />
          <main className="container mx-auto p-4 pb-16">
            {children}
          </main>
      </body>
    </html>
  );
}
