import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MotionLab - AI Swimming Analysis",
  description: "Upload swimming videos, get AI-powered motion analysis and improvement suggestions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen">
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
