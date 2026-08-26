"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";
import type { ReviewTarget } from "@/lib/core";

interface ReviewFormProps {
  schoolId?: string;
  schoolName?: string;
  schoolOptions?: { id: string; name: string }[];
  target: ReviewTarget;
  dimensions: { key: string; label: string }[];
  majorId?: string;
  courseId?: string;
  teacherId?: string;
  canReview?: boolean;
  verifiedSchools?: string[];
}

export function ReviewForm({
  schoolId,
  schoolName,
  schoolOptions,
  target,
  dimensions,
  majorId,
  courseId,
  teacherId,
  canReview = false,
  verifiedSchools = [],
}: ReviewFormProps) {
  const router = useRouter();
  const [selectedSchoolId, setSelectedSchoolId] = useState(schoolId ?? schoolOptions?.[0]?.id ?? "");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [content, setContent] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("bachelor");
  const [enrolledYear, setEnrolledYear] = useState("");
  const [isAlumni, setIsAlumni] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedSchool = schoolOptions?.find((school) => school.id === selectedSchoolId);
  const currentSchoolName = selectedSchool?.name ?? schoolName ?? "";
  const verified = canReview || verifiedSchools.includes(currentSchoolName);
  const allRated = dimensions.every((dim) => typeof ratings[dim.key] === "number");

  function setRating(key: string, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!selectedSchoolId || !verified || !allRated || !content.trim()) return;
    setBusy(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: selectedSchoolId,
        majorId,
        courseId,
        teacherId,
        ratings,
        content: content.trim(),
        degreeLevel,
        enrolledYear: enrolledYear ? Number(enrolledYear) : null,
        isAlumni,
      }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "评价发布失败");
      setBusy(false);
      return;
    }
    setRatings({});
    setContent("");
    setEnrolledYear("");
    setIsAlumni(false);
    setSuccess(true);
    setBusy(false);
    router.refresh();
    window.setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {schoolOptions && schoolOptions.length > 0 && (
        <div>
          <label className="label" htmlFor="review-school">
            所在学校
          </label>
          <select
            id="review-school"
            className="input"
            value={selectedSchoolId}
            onChange={(e) => {
              setSelectedSchoolId(e.target.value);
              setError("");
            }}
          >
            {schoolOptions.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <p className="label">维度评分</p>
        <div className="space-y-2 rounded-lg border border-line bg-zinc-50/60 p-3">
          {dimensions.map((dim) => (
            <div key={dim.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-600">{dim.label}</span>
              <StarRating
                label={dim.label}
                value={ratings[dim.key] ?? 0}
                onChange={(value) => setRating(dim.key, value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="review-degree">
            学位层次
          </label>
          <select
            id="review-degree"
            className="input"
            value={degreeLevel}
            onChange={(e) => setDegreeLevel(e.target.value)}
          >
            <option value="bachelor">本科</option>
            <option value="master">硕士</option>
            <option value="phd">博士</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="review-year">
            入学/就读年份（可选）
          </label>
          <input
            id="review-year"
            className="input"
            type="number"
            min={1980}
            max={2030}
            value={enrolledYear}
            onChange={(e) => setEnrolledYear(e.target.value.slice(0, 4))}
            placeholder="如：2023"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={isAlumni}
          onChange={(e) => setIsAlumni(e.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
        我已毕业，以校友身份评价
      </label>

      <div>
        <label className="label" htmlFor="review-content">
          短评（≤500 字）
        </label>
        <textarea
          id="review-content"
          className="input min-h-[96px] resize-y"
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          placeholder="说说真实体验：课程/导师/就业/氛围都可以"
          required
        />
        <p className="mt-1 text-right text-xs text-zinc-400">{content.length}/500</p>
      </div>

      {!verified && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {currentSchoolName ? `需要完成${currentSchoolName}邮箱认证后才能发表评价` : "请先登录并完成学校邮箱认证"}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm font-medium text-emerald-600">评价已发布</p>}

      <button
        type="submit"
        disabled={busy || !verified || !allRated || !content.trim()}
        className="btn-primary transition-all duration-150 active:scale-[0.98]"
      >
        {busy ? "发布中…" : "发布结构化评价"}
      </button>
    </form>
  );
}

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${label} ${star} 星`}
          className={cn("rounded p-0.5 transition-transform active:scale-90", star <= value ? "" : "opacity-60 hover:opacity-100")}
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              star <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
