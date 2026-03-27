import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PawAlert — The 911 for India's Strays",
  description:
    "AI-powered rescue coordination platform. Report an injured animal in 60 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-paw-bg text-paw-text`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0C0C20",
                color: "#FFFFFF",
                border: "1px solid rgba(228,127,66,0.3)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
