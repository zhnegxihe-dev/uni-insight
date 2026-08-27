const fs = require("fs");
const path = require("path");

const TOKEN = process.env.GH_TOKEN;
const REPO = "zhnegxihe-dev/uni-insight";
const BRANCH = "static-demo";
const BASE = "https://api.github.com/repos/" + REPO + "/contents/";
// docs 位于仓库根目录（scripts 在 static-demo/scripts，上两级到仓库根）
const DOCS_ROOT = path.resolve(__dirname, "..", "..", "docs");

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 404) {
    throw new Error(`${method} ${url} -> ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return { status: res.status, data };
}

async function getSha(filePath) {
  const { status, data } = await api("GET", BASE + filePath + "?ref=" + BRANCH);
  return status === 200 && data.sha ? data.sha : null;
}

async function putFile(filePath, localRel, sha) {
  const local = path.join(DOCS_ROOT, localRel);
  const content = fs.readFileSync(local).toString("base64");
  const body = { message: `deploy(static-demo): update ${filePath}`, content, branch: BRANCH };
  if (sha) body.sha = sha;
  const { status, data } = await api("PUT", BASE + filePath, body);
  console.log(`${status === 200 || status === 201 ? "OK" : "FAIL"} ${filePath}`);
  if (status !== 200 && status !== 201) throw new Error(JSON.stringify(data).slice(0, 300));
}

async function listDir(filePath) {
  const { status, data } = await api("GET", BASE + filePath + "?ref=" + BRANCH);
  return status === 200 && Array.isArray(data) ? data : [];
}

async function deleteFile(filePath, sha) {
  const body = { message: `deploy(static-demo): remove ${filePath}`, sha, branch: BRANCH };
  const { status } = await api("DELETE", BASE + filePath, body);
  console.log(`${status === 200 || status === 204 ? "DEL" : "SKIP"} ${filePath}`);
}

function walk(dir, base) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.join(base, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) results.push(...walk(full, rel));
    else results.push(rel.replace(/\\/g, "/"));
  }
  return results;
}

(async () => {
  if (!TOKEN) throw new Error("请设置 GH_TOKEN 环境变量");
  const files = walk(DOCS_ROOT, "");
  // 先同步 index.html 与 assets 下的文件
  for (const rel of files) {
    const filePath = "docs/" + rel;
    const sha = await getSha(filePath);
    await putFile(filePath, rel, sha);
  }
  // 清理远端 docs/assets 中已不存在于本地的旧产物
  const remoteAssets = await listDir("docs/assets");
  const localAssets = files.filter((f) => f.startsWith("assets/"));
  for (const item of remoteAssets) {
    const rel = "assets/" + item.name;
    if (!localAssets.includes(rel)) {
      await deleteFile("docs/" + rel, item.sha);
    }
  }
  console.log("done");
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});