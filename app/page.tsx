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
          AI 游泳动作分析
        </h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8 max-w-2xl mx-auto">
          上传游泳视频，AI 分析你的动作并给出专业改进建议。
          3D 骨骼模型帮你直观理解问题，追踪你的进步曲线。
        </p>
        <div className="flex gap-4 justify-center">
          {isSignedIn ? (
            <Link
              href="/analyze"
              className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity"
            >
              上传视频分析
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg text-lg font-medium hover:opacity-90 transition-opacity">
                开始使用
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
              title: "AI 动作分析",
              desc: "GPT-4o Vision 分析你的泳姿，从入水角度、划频、身体旋转等多维度评分",
              icon: "🤖",
            },
            {
              title: "3D 骨骼可视化",
              desc: "实时 3D 骨骼模型展示你的姿态，与理想姿态对比，问题部位一目了然",
              icon: "🦴",
            },
            {
              title: "进步追踪",
              desc: "每次分析自动记录，折线图和雷达图展示你的进步曲线",
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
        <h2 className="text-2xl font-bold text-center mb-8">支持的泳姿</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "自由泳", en: "Freestyle" },
            { name: "蛙泳", en: "Breaststroke" },
            { name: "蝶泳", en: "Butterfly" },
            { name: "仰泳", en: "Backstroke" },
          ].map((s) => (
            <div
              key={s.en}
              className="p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] text-center"
            >
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{s.en}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
