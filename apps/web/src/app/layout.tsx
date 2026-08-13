import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniInsight 升学问问",
  description: "去中介化的真实升学信息社区",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-zinc-400">
          UniInsight 升学问问 · 真实经验，理性参考
        </footer>
      </body>
    </html>
  );
}
