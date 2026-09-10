import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

/**
 * 广告词库 + 正则拦截（C 部分：信任与治理）
 * 词库/规则来自仓库根目录 config/ad_keywords.txt 与 config/ad_patterns.json，
 * 支持热更新；在无法读取配置的环境（如 Vercel Serverless）使用内置兜底数据。
 */

interface AdPattern {
  id: string;
  label: string;
  pattern: string;
}

export interface ModerationHit {
  rule: string;
  label: string;
}

export interface ModerationResult {
  ok: boolean;
  hits: ModerationHit[];
}

const EMBEDDED_KEYWORDS = [
  "加微信", "微信号", "vx", "v信", "wechat", "薇信", "微❤",
  "加qq", "QQ群", "企鹅号", "扣扣",
  "保录取", "包录取", "保过", "包过", "内部名额", "关系户", "走后门", "中介",
  "代写", "代做", "代考", "代课", "论文代写", "作业代写",
  "刷单", "刷分", "兼职", "家教", "付费咨询", "收费咨询", "咨询收费",
  "淘宝", "天猫", "店铺", "优惠券", "二维码", "扫码", "公众号",
  "抖音号", "小红书号", "闲鱼", "转账", "收款码", "支付宝", "定金", "返现",
  "立减", "秒杀", "特价", "推广", "广告", "招生代理", "代理招生", "不过退款",
  "出售答案", "内部资料", "真题答案", "留学中介", "移民", "签证代办", "劳务输出",
  "传销", "资金盘", "稳赚", "包赚", "高收益", "注册送", "邀请码", "提现",
];

const EMBEDDED_PATTERNS: AdPattern[] = [
  { id: "wechat_id", label: "微信号/联系方式", pattern: "(?:微信号?|vx|v信|wechat|wx|威信)\\s*[:：]?\\s*[a-zA-Z0-9_-]{5,20}" },
  { id: "qq_number", label: "QQ 号", pattern: "(?:QQ|qq|扣扣|企鹅号)\\s*[:：]?\\s*\\d{5,12}" },
  { id: "phone", label: "手机号", pattern: "1[3-9]\\d{9}" },
  { id: "url", label: "外部链接", pattern: "(?:https?://|www\\.)[^\\s，。；：]+" },
  { id: "domain", label: "外部域名", pattern: "[a-z0-9-]+\\.(?:com|cn|net|org|top|vip|cc|xyz|me)\\b" },
  { id: "contact_add", label: "诱导加联系方式", pattern: "(?:加|添加|联系|私信)\\s*(?:我|vx|微信|qq|Q)" },
  { id: "paid_guarantee", label: "付费包过承诺", pattern: "(?:保过|保录取|包过|包录取|内部名额|不过退款)" },
  { id: "money", label: "转账/收款", pattern: "(?:转账|收款码|支付宝|微信收款|定金|先付|付款后)" },
];

let cache: { keywords: string[]; patterns: AdPattern[] } | null = null;

/** 从当前目录向上查找仓库根目录 config/，适配 monorepo 各工作区。 */
function findConfigDir(): string | null {
  const candidates = [process.cwd()];
  let dir = resolve(process.cwd());
  for (let i = 0; i < 4; i++) {
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
    candidates.push(dir);
  }
  for (const candidate of candidates) {
    const dirPath = join(candidate, "config");
    if (existsSync(join(dirPath, "ad_keywords.txt"))) return dirPath;
  }
  return null;
}

function loadConfig(): { keywords: string[]; patterns: AdPattern[] } {
  if (cache) return cache;
  let keywords = EMBEDDED_KEYWORDS;
  let patterns = EMBEDDED_PATTERNS;

  const configDir = findConfigDir();
  if (configDir) {
    try {
      const loaded = readFileSync(join(configDir, "ad_keywords.txt"), "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
      if (loaded.length > 0) keywords = loaded;
    } catch {
      // 保持内置兜底
    }
    try {
      const loaded = JSON.parse(readFileSync(join(configDir, "ad_patterns.json"), "utf8")) as AdPattern[];
      if (Array.isArray(loaded) && loaded.length > 0) patterns = loaded;
    } catch {
      // 保持内置兜底
    }
  }

  cache = { keywords, patterns };
  return cache;
}

/** 检测文本是否命中广告词库/正则规则；ok=false 表示应拦截。 */
export function checkModeration(text: string): ModerationResult {
  const normalized = String(text ?? "").toLowerCase();
  const { keywords, patterns } = loadConfig();
  const hits: ModerationHit[] = [];

  for (const keyword of keywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      hits.push({ rule: `keyword:${keyword}`, label: `广告词「${keyword}」` });
      if (hits.length >= 5) break;
    }
  }

  if (hits.length < 5) {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.pattern, "i");
        if (regex.test(text)) {
          hits.push({ rule: `pattern:${pattern.id}`, label: pattern.label });
          if (hits.length >= 5) break;
        }
      } catch {
        // 忽略无效规则
      }
    }
  }

  return { ok: hits.length === 0, hits };
}

/** 新用户（L0）使用更严格的过滤：正文 + 标题一并检查。 */
export function checkContentForUser(text: string, level: number): ModerationResult {
  const result = checkModeration(text);
  if (result.ok && level === 0) {
    // L0 用户额外拦截纯联系方式类文本（防止新号注册后立即发广告）
    const contactOnly = /^[\s\w\d\-_.+@:：,，。;；]+$/.test(text) && /\d{5,}/.test(text);
    if (contactOnly) {
      return { ok: false, hits: [{ rule: "l0_contact_only", label: "疑似纯联系方式内容" }] };
    }
  }
  return result;
}

/** 中性营销词（推广/广告/宣传/种草/商家等）：仅在推广帖（promo）场景放行，硬信号仍全拦 */
const SOFT_AD_HINTS = ["推广", "广告", "宣传", "种草", "商家", "推荐", "种草文"];

export function isSoftAdHit(hit: ModerationHit): boolean {
  return hit.rule.startsWith("keyword:") && SOFT_AD_HINTS.some((word) => hit.rule.includes(word));
}

/** 判断一组命中是否全部为中性营销词（用于 promo 帖放行） */
export function allSoftAdHits(hits: ModerationHit[]): boolean {
  return hits.length > 0 && hits.every(isSoftAdHit);
}

export function moderationErrorMessage(result: ModerationResult): string {
  const labels = result.hits.slice(0, 3).map((hit) => hit.label).join("、");
  return `内容疑似广告/中介，已拦截（命中：${labels}）。请移除联系方式、链接或营销内容后重试。`;
}

export function resetModerationCache(): void {
  cache = null;
}

/** 教育 / 学业服务类商户的进阶合规检查（v4.7 §8.17 Phase C）：承诺性宣传与贩卖焦虑 */
const EDU_COMPLIANCE_KEYWORDS = [
  "包过", "包录取", "保录取", "保过", "保证录取", "稳过", "必过",
  "100%上岸", "百分百上岸", "确保上岸", "保上岸", "百分之百上岸",
  "内部渠道", "内部名额", "内部指标", "关系户", "走后门",
  "不过退款", "保offer", "保Offer", "保OFFER",
];
const EDU_ANXIETY_KEYWORDS = [
  "再不报就来不及", "输在起跑线", "不报就落后", "别人都在报",
];

export function checkEduCompliance(text: string): { ok: boolean; hit?: string } {
  const t = String(text || "").toLowerCase();
  for (const w of EDU_COMPLIANCE_KEYWORDS) if (t.includes(w.toLowerCase())) return { ok: false, hit: w };
  for (const w of EDU_ANXIETY_KEYWORDS) if (t.includes(w.toLowerCase())) return { ok: false, hit: w };
  return { ok: true };
}
