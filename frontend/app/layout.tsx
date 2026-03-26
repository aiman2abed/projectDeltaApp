"use client";

import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import BottomNav from '@/components/BottomNav';
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Protect auth screens from navigation bleed
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/update-password';

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased selection:bg-sky-500/30">
        {/* Global background layer that sits behind all routes via negative z-index. */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.15),rgba(255,255,255,0))]" />
          {/* Only render Top Nav if NOT on an auth page */}
          {!isAuthPage && <Navbar />}
        

          {/* Main viewport region for page-level content; individual pages control internal layout only. */}
          <main className="flex-grow ${!isAuthPage ? 'pb-16 md:pb-0' : ''}  px-4 md:px-8 lg:px-16 py-6  max-w-7xl mx-auto w-full  flex flex-col gap-6">
            {children}
          </main>
        {/* Only render Bottom Nav if NOT on an auth page */}
        {!isAuthPage && <BottomNav />}
      </body>
    </html>
  );
}
