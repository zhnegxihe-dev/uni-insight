"use client";

import { useState } from "react";
import { X } from "lucide-react";

/** 配图展示：网格 + 点击放大（轻量灯箱） */
export function ImageGallery({ images, className }: { images: string[]; className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <div className={className ?? "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"}>
        {images.map((src, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            className="group relative overflow-hidden rounded-lg border border-line"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`配图 ${index + 1}`}
              className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setActive(null)}>
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setActive(null)}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={`配图 ${active + 1}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}