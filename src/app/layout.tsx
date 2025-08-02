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
  openGraph: {
    title: "Sign the Digital Maverick Manifesto",
    description: "Join the new Internet revolution and receive a one-of-a-kind generative artwork.",
    images: [
      {
        url: '/images/splashimage.png',
        width: 1200,
        height: 630,
        alt: 'Digital Maverick Manifesto',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sign the Digital Maverick Manifesto",
    description: "Join the new Internet revolution and receive a one-of-a-kind generative artwork.",
    images: ['/images/splashimage.png'],
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
