import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import './globals.css';

// 1. PWA METADATA (Allowed because this is now a Server Component)
export const metadata = {
  title: 'Spirelay',
  description: 'Engineered Mastery',
  manifest: '/manifest.json',
};

// 2. MOBILE VIEWPORT CONFIG
export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/spirelay_logo_noBg.png" />
      </head>
      <body className="bg-black text-white min-h-screen flex flex-col">
        
        {/* 3. SERVICE WORKER REGISTRATION */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />

        {/* 4. CLIENT NAVIGATION WRAPPER */}
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
        
      </body>
    </html>
  );
}