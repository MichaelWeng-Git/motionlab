"use client";

import Link from "next/link";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-[var(--accent)]">
            MotionLab
          </Link>
          {isSignedIn && (
            <div className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                Dashboard
              </Link>
              <Link href="/analyze" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                分析
              </Link>
              <Link href="/progress" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                进步曲线
              </Link>
            </div>
          )}
        </div>
        <div>
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity">
                登录
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}
