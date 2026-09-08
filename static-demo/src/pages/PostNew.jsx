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
  const [merchantMode, setMerchantMode] = useState("select");
  const [merchantId, setMerchantId] = useState("");
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newMerchantCategory, setNewMerchantCategory] = useState("campus_food");
  const [newMerchantTier, setNewMerchantTier] = useState("street");
  const [newMerchantSchool, setNewMerchantSchool] = useState("");
  const [newMerchantCity, setNewMerchantCity] = useState("");
  const [newMerchantAddress, setNewMerchantAddress] = useState("");
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-10 text-center text-sm text-zinc-400">
          请先登录后发布帖子。<Link to="/login" className="text-accent hover:underline">去登录</Link>
        </div>
      </div>
    );
  }

  function ensureMerchantId() {
    if (merchantMode === "select") {
      if (!merchantId) throw new Error("请选择或新建一个商户");
      return merchantId;
    }
    if (!newMerchantName.trim()) throw new Error("请填写新商户名称");
    const m = act(db.createMerchant, {
      name: newMerchantName,
      category: newMerchantCategory,
      tier: newMerchantTier,
      schoolId: newMerchantSchool || null,
      city: newMerchantCity,
      address: newMerchantAddress,
    });
    return m.id;
  }

  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      let finalMerchantId = null;
      if (postType === "promo") finalMerchantId = ensureMerchantId();
      const post = act(db.createExperiencePost, {
        title,
        content,
        postType,
        scenarioType,
        schoolId,
        majorId,
        courseId,
        teacherId,
        merchantId: finalMerchantId,
        images,
      });
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  const merchants = db.listMerchants(state);
  const tierLabel = (t) => db.MERCHANT_TIERS.find((x) => x.key === t)?.label ?? t;
  const catLabel = (c) => db.MERCHANT_CATEGORIES.find((x) => x.key === c)?.label ?? c;
  const schoolName = (sid) => state.schools.find((s) => s.id === sid)?.name ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">写经验帖 / 避雷帖 / 推广帖</h1>
        <p className="mt-1 text-sm text-zinc-500">分享一段真实经历或推荐一个宝藏去处；受商家委托的推广请选择「推广帖」并关联商户。</p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <div className="flex gap-2">
          {db.POST_TYPES.map((item) => (
            <button key={item.key} type="button" onClick={() => setPostType(item.key)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                postType === item.key
                  ? item.key === "avoid" ? "border-red-300 bg-red-50 text-red-600"
                    : item.key === "promo" ? "border-blue-600 bg-blue-600 text-white"
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
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder={postType === "avoid" ? "例：中大经济学 XX 课的坑，新生必看" : postType === "promo" ? "例：这家店我替老板吆喝一句，晚自习后的快乐老家" : "例：中大经济学大一真实课表与就读体验"} required />
        </div>

        <div>
          <label className="label">正文（必填，≤3000 字）</label>
          <textarea className="input min-h-40 resize-y" value={content} onChange={(e) => setContent(e.target.value.slice(0, 3000))} placeholder="分享真实经历：如果推荐一家店/一个去处，说说为什么值得去、适合什么场景……" required />
        </div>

        <div>
          <label className="label">配图（可选）</label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {postType === "promo" && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">你正在发布商家推广帖</p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-blue-700">
              <li>帖子将列为「推广帖」（带商家推广角标，可在推广帖 tab 查看），获得商家付费推广位与专属曝光；</li>
              <li>可领取商家报酬/佣金（平台担保）；</li>
              <li>诚信分 +5，获得「透明分享者」徽章，你以后的真心经验帖会因诚信分被加权；</li>
              <li>若你并未受商家委托，请勿勾选——虚假标注将被扣诚信分并降权。</li>
            </ul>
            <div className="flex gap-2">
              {["select", "create"].map((m) => (
                <button key={m} type="button" onClick={() => setMerchantMode(m)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${merchantMode === m ? "border-blue-600 bg-blue-600 text-white" : "border-blue-200 bg-white text-blue-700 hover:bg-blue-100"}`}>
                  {m === "select" ? "选择已有商户" : "新建商户"}
                </button>
              ))}
            </div>
            {merchantMode === "select" ? (
              <div>
                <label className="label">商户（必选，推广内容会聚合到它的主页）</label>
                <select className="input" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} required>
                  <option value="">请选择商户</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}（{tierLabel(m.tier)} · {catLabel(m.category)}{schoolName(m.schoolId) ? ` · ${schoolName(m.schoolId)}` : ""}）</option>
                  ))}
                </select>
                {merchants.length === 0 && <p className="mt-1 text-xs text-blue-600">还没有收录的商户，切到「新建商户」添加第一家吧。</p>}
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-blue-200 bg-white p-3">
                <p className="text-xs font-medium text-blue-800">新建商户（路边小店 / 品牌均可，同名自动复用已有商户）</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="label">商户名称（必填）</label>
                    <input className="input" value={newMerchantName} onChange={(e) => setNewMerchantName(e.target.value.slice(0, 80))} placeholder="如：东门老张烧烤" />
                  </div>
                  <div>
                    <label className="label">商户类型</label>
                    <select className="input" value={newMerchantTier} onChange={(e) => setNewMerchantTier(e.target.value)}>
                      {db.MERCHANT_TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}（{t.hint}）</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">分类</label>
                    <select className="input" value={newMerchantCategory} onChange={(e) => setNewMerchantCategory(e.target.value)}>
                      {db.MERCHANT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}（{c.hint}）</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">所在学校（可选）</label>
                    <select className="input" value={newMerchantSchool} onChange={(e) => setNewMerchantSchool(e.target.value)}>
                      <option value="">不关联（如城市级商户）</option>
                      {state.schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">城市/区（可选）</label>
                    <input className="input" value={newMerchantCity} onChange={(e) => setNewMerchantCity(e.target.value.slice(0, 50))} placeholder="如：广州 / 深圳南山区" />
                  </div>
                  <div>
                    <label className="label">位置描述（可选）</label>
                    <input className="input" value={newMerchantAddress} onChange={(e) => setNewMerchantAddress(e.target.value.slice(0, 200))} placeholder="如：中大南门巷子口往里 50 米" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">场景（可选）</label>
            <select className="input" value={scenarioType} onChange={(e) => setScenarioType(e.target.value)}>
              <option value="">不限定</option>
              {db.SCENARIOS.filter((s) => s.type !== "all").map((s) => <option key={s.type} value={s.type}>{s.label}</option>)}
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
