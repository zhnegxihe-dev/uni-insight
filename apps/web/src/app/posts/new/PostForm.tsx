"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POST_TYPES, SCENARIOS } from "@/lib/core";
import { cn } from "@/lib/format";
import { ImageUploader } from "@/components/ImageUploader";

interface BaseOption {
  id: string;
  name: string;
}

interface CourseOption extends BaseOption {
  code: string | null;
}

interface TeacherOption extends BaseOption {
  title: string | null;
}

interface PostFormProps {
  schools: BaseOption[];
  majors: BaseOption[];
  courses: CourseOption[];
  teachers: TeacherOption[];
}

export function PostForm({ schools, majors, courses, teachers }: PostFormProps) {
  const router = useRouter();
  const [postType, setPostType] = useState<string>("experience");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scenarioType, setScenarioType] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        postType,
        scenarioType: scenarioType || null,
        schoolId: schoolId || null,
        majorId: majorId || null,
        courseId: courseId || null,
        teacherId: teacherId || null,
        images,
      }),
    });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(`/posts/${data.id}`);
      router.refresh();
    } else {
      setError(data.error || "发布失败，请稍后重试");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="flex gap-2">
        {POST_TYPES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPostType(item.key)}
            className={cn(
              "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition",
              postType === item.key
                ? item.key === "avoid"
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-blue-300 bg-blue-50 text-accent"
                : "border-line text-zinc-500 hover:bg-zinc-50"
            )}
          >
            <span className="block">{item.label}</span>
            <span className="mt-0.5 block text-xs font-normal text-zinc-400">{item.hint}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">标题（必填，≤100 字）</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder={postType === "avoid" ? "例：中大经济学 XX 课的坑，新生必看" : "例：中大经济学大一真实课表与就读体验"}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">正文（必填，≤3000 字）</label>
        <textarea
          className="input min-h-40"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={3000}
          placeholder="分享真实经历：课程、宿舍、实习、导师、申请流程……能帮到后来人的细节都欢迎"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600">配图（可选）</label>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">场景（可选）</label>
          <select className="input" value={scenarioType} onChange={(e) => setScenarioType(e.target.value)}>
            <option value="">不限定</option>
            {SCENARIOS.filter((s) => s.type !== "all").map((s) => (
              <option key={s.type} value={s.type}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">关联学校（可选）</label>
          <select className="input" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
            <option value="">不关联</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">关联专业（可选）</label>
          <select className="input" value={majorId} onChange={(e) => setMajorId(e.target.value)}>
            <option value="">不关联</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">关联课程（可选）</label>
          <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">不关联</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.code ? `（${c.code}）` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600">关联教师/导师（可选）</label>
          <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">不关联</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.title ? `（${t.title}）` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-zinc-400">发布将经过广告/中介内容过滤</span>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "发布中…" : "发布"}
        </button>
      </div>
    </form>
  );
}