import { useState } from "react";
import { Link } from "react-router-dom";
import { useDb } from "../store";
import * as db from "../db";
import { MerchantCard } from "../components";

const TABS = [
  { key: "campus", label: "校园周边", hint: "校门口与大学城的好去处" },
  { key: "city", label: "城市周末", hint: "小众景区与休闲去处" },
  { key: "promo", label: "推广热榜", hint: "明示标注的商家推广" },
];

export default function Places() {
  const state = useDb();
  const [tab, setTab] = useState("campus");
  const [schoolId, setSchoolId] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const postCountOf = (m) => state.experiencePosts.filter((x) => x.status !== "hidden" && (x.merchantId === m.id || x.merchantName === m.name)).length;
  let merchants = state.merchants.filter((m) => m.status !== "removed");
  if (tab === "campus") merchants = merchants.filter((m) => m.schoolId);
  else if (tab === "city") merchants = merchants.filter((m) => m.city);
  else merchants = merchants.filter((m) => state.experiencePosts.some((x) => x.merchantId === m.id && x.postType === "promo" && x.status !== "hidden"));
  if (schoolId) merchants = merchants.filter((m) => m.schoolId === schoolId);
  if (city) merchants = merchants.filter((m) => m.city === city);
  if (category) merchants = merchants.filter((m) => m.category === category);
  if (tab === "promo") merchants = [...merchants].sort((a, b) => postCountOf(b) - postCountOf(a));
  const ratings = db.loadMerchantRatings(state, merchants.map((m) => m.id));
  const schools = state.schools.filter((s) => state.merchants.some((m) => m.schoolId === s.id && m.status !== "removed"));
  const cities = Array.from(new Set(state.merchants.filter((m) => m.status !== "removed" && m.city).map((m) => m.city)));

  const chip = (active, label, onClick) => (
    <button key={label} type="button" onClick={onClick} className={"rounded-md px-2.5 py-1 text-xs transition " + (active ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}>
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">校园生活 · 发现好去处</h1>
        <p className="mt-1 text-sm text-zinc-500">学生视角的吃玩逛推荐：校园周边的小店、城市周末的小众去处，以及明示标注的商家推广。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => { setTab(t.key); setSchoolId(""); setCity(""); }}
            className={"rounded-lg border px-3 py-2 text-left text-sm transition " + (tab === t.key ? "border-accent bg-blue-50 text-accent" : "border-line text-zinc-600 hover:bg-zinc-50")}>
            <span className="block font-medium">{t.label}</span>
            <span className="mt-0.5 block text-[11px] text-zinc-400">{t.hint}</span>
          </button>
        ))}
      </div>

      {tab === "campus" && schools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chip(!schoolId, "全部学校", () => setSchoolId(""))}
          {schools.map((s) => chip(schoolId === s.id, s.name, () => setSchoolId(s.id)))}
        </div>
      )}
      {tab === "city" && cities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chip(!city, "全部城市", () => setCity(""))}
          {cities.map((c) => chip(city === c, c, () => setCity(c)))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {chip(!category, "全部分类", () => setCategory(""))}
        {db.MERCHANT_CATEGORIES.map((c) => chip(category === c.key, c.label, () => setCategory(c.key)))}
      </div>

      {merchants.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-400">这里还没有收录的商户，去发一条推广帖把它带进来吧</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {merchants.map((m) => (
            <MerchantCard key={m.id} merchant={m} rating={ratings.get(m.id) ?? { rating: 0, scoredCount: 0, reviewCount: 0, insufficient: true }} postCount={postCountOf(m)} />
          ))}
        </div>
      )}
    </div>
  );
}
