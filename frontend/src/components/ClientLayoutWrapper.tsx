"use client";

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/update-password';

  return (
    <>
      {!isAuthPage && <Navbar />}
      
      <main className={`flex-grow ${!isAuthPage ? 'pb-16 md:pb-0' : ''}`}>
        {children}
      </main>

      {!isAuthPage && <BottomNav />}
    </>
  );
}