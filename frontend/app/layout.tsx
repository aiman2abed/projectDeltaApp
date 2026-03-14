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
        <nav className="bg-blue-900 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0 font-bold text-xl tracking-wider">
                <Link href="/">⚡ DELTA EE</Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                <Link href="/modules" className="hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium">All Modules</Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}