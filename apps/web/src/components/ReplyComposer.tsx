"use client";

import { useRef, useState } from "react";
import { Mic, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";

export function ReplyComposer({ questionId }: { questionId: string }) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  async function submit() {
    const text = content.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/questions/${questionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "发布失败");
      setBusy(false);
      return;
    }
    setContent("");
    setSent(true);
    setBusy(false);
    router.refresh();
    window.setTimeout(() => setSent(false), 1600);
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => { start: () => void; stop: () => void; lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void } }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => { start: () => void; stop: () => void; lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("当前浏览器不支持语音输入，请手动输入");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setContent((prev) => (prev + text).slice(0, 280));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    setError("");
    recognition.start();
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="relative flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 280))}
            placeholder="分享你的真实经验，最多 280 字"
            className="input min-h-[84px] resize-y py-2.5 transition-shadow focus:shadow-[0_0_0_4px_rgba(37,99,235,0.08)]"
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className={cn("text-xs", content.length >= 270 ? "text-red-500" : "text-zinc-400")}>
              {content.length}/280
            </span>
            <button
              type="button"
              onClick={toggleMic}
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                listening ? "text-red-500" : "text-zinc-500 hover:text-ink"
              )}
            >
              <Mic className="h-3.5 w-3.5" />
              {listening ? "录音中，点击结束" : "语音输入"}
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !content.trim()}
          className="btn-primary w-20 transition-all duration-150 active:scale-[0.98]"
        >
          <Send className={cn("h-4 w-4", busy && "animate-pulse")} />
          {busy ? "发送" : sent ? "已发布" : "发布"}
        </button>
      </div>
      {sent && <p className="mt-2 text-xs font-medium text-emerald-600">回复已发布</p>}
    </div>
  );
}
