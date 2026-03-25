import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Spirelay | Engineering Mastery",
  description: "Algorithmic Spaced Repetition for Exact Sciences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased selection:bg-sky-500/30">
        {/* Global background layer that sits behind all routes via negative z-index. */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.15),rgba(255,255,255,0))]" />

        {/* AuthGuard owns route access; child pages own their own loading and data logic. */}
        <AuthGuard>
          {/* Navigation shell stays outside page content so every private route shares one header. */}
          <Navbar />

          {/* Main viewport region for page-level content; individual pages control internal layout only. */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col relative">
            {children}
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}
