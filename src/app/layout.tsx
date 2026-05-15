import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "omixsystems — School Management System",
    template: "%s | omixsystems",
  },
  description: "Next-generation school management platform by omixsystems",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-surface antialiased`}>
        <Providers>
          <div className="min-h-screen bg-animate">
            {children}
          </div>
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(18, 18, 42, 0.9)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              color: "#e2e8f0",
              backdropFilter: "blur(12px)",
            },
          }}
        />
      </body>
    </html>
  );
}
