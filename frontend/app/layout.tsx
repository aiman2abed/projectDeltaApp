import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Delta EE Microlearning",
  description: "Spaced repetition for Electrical Engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* Top Navigation Bar */}
        <nav className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0 font-bold text-xl tracking-wider">
                <Link href="/">⚡ DELTA EE</Link>
              </div>
              
              {/* --- NAVIGATION LINKS --- */}
              <div className="flex space-x-4 items-center">
                <Link href="/" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>

                {/* 🔥 NEW DISCOVER BUTTON 🔥 */}
                <Link 
                  href="/discover" 
                  className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  <span>🔥</span> Discover
                </Link>

                <Link href="/modules" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">
                  All Modules
                </Link>
              </div>
              {/* ------------------------- */}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        {/* Note: We keep the main container, but the Discover page 
            will handle its own full-screen height inside its own file */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}