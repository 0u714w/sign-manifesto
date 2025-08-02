import type { Metadata } from "next";
import "./globals.css";
import { PrivyProvider } from "@/components/PrivyProvider";
import Script from 'next/script';

export const metadata: Metadata = {
  title: "Sign the Manifesto",
  description: "Sign the manifesto and collect your unique piece of generative art",
  icons: {
    icon: '/images/Checks-Black.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyCdhIQeLcrZQ6CVKJccaT4NsLvgoh1CJNw&libraries=places`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="relative min-h-screen overflow-x-hidden">
        {/* Rotated background */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 w-screen h-screen"
          style={{
            backgroundImage: "url('/images/background.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
            transform: 'rotate(-8deg) scale(1.1)',
          }}
        />
        {/* Main content stays upright */}
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
