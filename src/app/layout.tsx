import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aviator — The Sky-High Crash Game",
  description: "Watch the multiplier rise, cash out before it crashes. A thrilling real-time multiplayer game with liquid glass design.",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✈️</text></svg>" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              borderRadius: '0.75rem',
            },
          }}
        />
      </body>
    </html>
  );
}