import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MotionLab - AI 游泳动作分析",
  description: "上传游泳视频，AI 分析动作并给出改进建议",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="zh-CN">
        <body className="min-h-screen">
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
