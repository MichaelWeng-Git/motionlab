"use client";

import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
          AI Swimming Analysis
        </h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto">
          Upload your swimming videos and get professional AI-powered feedback.
          3D skeleton visualization helps you understand form issues, and track your progress over time.
        </p>
        <div className="flex gap-4 justify-center">
          {isSignedIn ? (
            <Link
              href="/analyze"
              className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity"
            >
              Analyze Video
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity">
                Get Started
              </button>
            </SignInButton>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "AI Motion Analysis",
              desc: "GPT-4o Vision analyzes your stroke from multiple dimensions — entry angle, pull frequency, body rotation and more",
              icon: "🤖",
            },
            {
              title: "3D Skeleton View",
              desc: "Real-time 3D skeleton model shows your posture, compare with ideal form, and spot problem areas at a glance",
              icon: "🦴",
            },
            {
              title: "Progress Tracking",
              desc: "Every analysis is recorded automatically. Line charts and radar charts show your improvement over time",
              icon: "📈",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported strokes */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-center mb-8">Supported Strokes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Freestyle", en: "Freestyle" },
            { name: "Breaststroke", en: "Breaststroke" },
            { name: "Butterfly", en: "Butterfly" },
            { name: "Backstroke", en: "Backstroke" },
          ].map((s) => (
            <div
              key={s.en}
              className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] text-center"
            >
              <div className="font-semibold">{s.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
