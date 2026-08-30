import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDb, act } from "../store";
import * as db from "../db";
import { ImageUploader } from "../components";

export default function PostNew() {
  const state = useDb();
  const navigate = useNavigate();
  const user = db.getCurrentUser(state);
  const [postType, setPostType] = useState("experience");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scenarioType, setScenarioType] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [images, setImages] = useState([]);
  const [merchantName, setMerchantName] = useState("");
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-10 text-center text-sm text-zinc-400">
          请先登录后发布经验帖。<Link to="/login" className="text-accent hover:underline">去登录</Link>
        </div>
      </div>
    );
  }

  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const post = act(db.createExperiencePost, {
        title,
        content,
        postType,
        scenarioType,
        schoolId,
        majorId,
        courseId,
        teacherId,
        merchantName: postType === "promo" ? merchantName : "",
        images,
      });
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">写经验帖 / 避雷帖</h1>
        <p className="mt-1 text-sm text-zinc-500">分享一段真实经历，或提醒后来人避开的坑</p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div className="flex gap-2">
          {db.POST_TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPostType(item.key)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                postType === item.key
                  ? item.key === "avoid"
                    ? "border-red-300 bg-red-50 text-red-600"
                    : item.key === "promo"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-blue-300 bg-blue-50 text-accent"
                  : "border-line text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <span className="block">{item.label}</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">{item.hint}</span>
            </button>
          ))}
        </div>

        <div>
          <label className="label">标题（必填，≤100 字）</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder={postType === "avoid" ? "例：中大经济学 XX 课的坑，新生必看" : "例：中大经济学大一真实课表与就读体验"} required />
        </div>

        <div>
          <label className="label">正文（必填，≤3000 字）</label>
          <textarea className="input min-h-40 resize-y" value={content} onChange={(e) => setContent(e.target.value.slice(0, 3000))} placeholder="分享真实经历：课程、宿舍、实习、导师、申请流程……" required />
        </div>

        <div>
          <label className="label">配图（可选）</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {postType === "promo" && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">你正在发布商家推广帖</p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-blue-700">
              <li>帖子将进入独立的「推广池」，获得商家付费推广位与专属曝光；</li>
              <li>可领取商家报酬/佣金（平台担保）；</li>
              <li>诚信分 +5，获得「透明分享者」徽章，你以后的真心经验帖会因诚信分被加权；</li>
              <li>若你并未受商家委托，请勿勾选——虚假标注将被扣诚信分并降权。</li>
            </ul>
            <div>
              <label className="label">商户名称（必填）</label>
              <input className="input" value={merchantName} onChange={(e) => setMerchantName(e.target.value.slice(0, 50))} placeholder="如：东门老张烧烤、XX 考研机构" required />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">场景（可选）</label>
            <select className="input" value={scenarioType} onChange={(e) => setScenarioType(e.target.value)}>
              <option value="">不限定</option>
              {db.SCENARIOS.filter((s) => s.type !== "all").map((s) => (
                <option key={s.type} value={s.type}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">关联学校（可选）</label>
            <select className="input" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              <option value="">不关联</option>
              {state.schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">关联专业（可选）</label>
            <select className="input" value={majorId} onChange={(e) => setMajorId(e.target.value)}>
              <option value="">不关联</option>
              {state.majors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">关联课程（可选）</label>
            <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">不关联</option>
              {state.courses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.code ? `（${c.code}）` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="label">关联教师/导师（可选）</label>
            <select className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">不关联</option>
              {state.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}{t.title ? `（${t.title}）` : ""}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-zinc-400">发布将经过广告/中介内容过滤</span>
          <button type="submit" className="btn-primary">发布</button>
        </div>
      </form>
    </div>
  );
}