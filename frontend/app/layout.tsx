import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

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
        
        {/* Subtle radial gradient to act as a "light source" behind the grid */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.15),rgba(255,255,255,0))]" />

        {/* Smart Global Navigation Bar */}
        <Navbar />

        {/* Main Content Wrapper with Max-Width and Responsive Edge Padding */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col relative">
          {children}
        </main>

      </body>
    </html>
  );
}