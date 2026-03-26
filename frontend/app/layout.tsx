import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import "./globals.css";

/**
 * Root server layout that declares PWA metadata and mounts the client shell.
 */
export const metadata = {
  title: "Spirelay",
  description: "Engineered Mastery",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function registerSpirelayServiceWorker() {
                  navigator.serviceWorker.register('/sw.js').catch(function noop() {});
                }, { once: true });
              }
            `,
          }}
        />

        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
