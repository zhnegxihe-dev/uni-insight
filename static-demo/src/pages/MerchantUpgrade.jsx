import { Link, useParams } from "react-router-dom";
import { useDb } from "../store";
import * as db from "../db";
import { PlanPicker } from "../components";

export default function MerchantUpgrade() {
  const state = useDb();
  const { id } = useParams();
  const user = db.getCurrentUser(state);
  const merchant = state.merchants.find((m) => m.id === id);

  if (!merchant) return <div className="card p-10 text-center text-sm text-zinc-400">商户不存在</div>;
  const allowed = user && (merchant.ownerId === user.id || (user.role || "user") === "admin");
  if (!allowed) return <div className="card mx-auto max-w-3xl p-10 text-center text-sm text-zinc-400">只有商户主理人可管理套餐{!user && <> · <Link to="/login" className="text-accent hover:underline">去登录</Link></>}</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to={`/merchant/${merchant.id}/dashboard`} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-accent">← 返回商户后台</Link>
      <div>
        <h1 className="text-xl font-semibold text-ink">{merchant.name} · 品牌馆入驻</h1>
        <p className="mt-1 text-sm text-zinc-500">大商家认证入驻与曝光权益；路边小店可继续免费使用基础功能。</p>
      </div>
      <PlanPicker merchantId={merchant.id} currentPlan={merchant.plan || "free"} />
    </div>
  );
}
