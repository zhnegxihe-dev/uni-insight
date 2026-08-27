"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

const MAX_DIMENSION = 1280;
const QUALITY = 0.82;

function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法处理图片"));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      image.onerror = () => reject(new Error("图片解析失败，请换一张"));
      image.src = dataUrl;
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

/** 配图上传：浏览器端压缩为 data URL，最多 6 张 */
export function ImageUploader({ images, onChange, max = 6 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const remaining = max - images.length;
      const list = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, remaining);
      const next: string[] = [];
      for (const file of list) {
        const compressed = await fileToCompressedDataUrl(file);
        next.push(compressed);
      }
      onChange([...images, ...next].slice(0, max));
    } catch (e) {
      setError(e instanceof Error ? e.message : "图片处理失败");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src, index) => (
          <div key={index} className="relative h-20 w-20 overflow-hidden rounded-lg border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`配图 ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              title="移除图片"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-zinc-400 transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px]">{busy ? "处理中" : "配图"}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <p className="text-xs text-zinc-400">
        最多 {max} 张，自动压缩（最长边 1280px）。建议上传课表、校园实拍、录取通知书等（敏感信息请打码）。
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}