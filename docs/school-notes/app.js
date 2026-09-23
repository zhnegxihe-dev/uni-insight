const data = window.REAL_PAGE_DATA;
const app = document.querySelector("#app");
const intro = document.querySelector("#intro");

const state = {
  currentSchoolIndex: 0,
  activeTab: "reviews",
  searchTokens: [],
  matches: data.schools,
  wheelLockedUntil: 0,
  lastDraftText: "",
};
let introTimer = null;

const palette = ["#f6d9d7", "#dcebd9", "#f8e9b9", "#d9e8f2", "#eadcf1", "#f5dfc7"];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCurrentSchool() {
  return data.schools[state.currentSchoolIndex] || data.schools[0];
}

function getSearchText(school) {
  return [
    school.name,
    school.province,
    school.city,
    ...(school.majors || []),
    ...(school.reviews || []).flatMap((review) => [
      review.author,
      review.stage,
      review.major,
      review.content,
    ]),
    ...(school.foods || []).flatMap((food) => [
      food.name,
      food.area,
      food.reason,
      food.scene,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

function searchSchools(query) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  state.searchTokens = tokens;
  state.matches = tokens.length
    ? data.schools.filter((school) => {
        const haystack = getSearchText(school);
        return tokens.every((token) => haystack.includes(token));
      })
    : data.schools;

  return state.matches;
}

function chooseSchool(schoolId, options = {}) {
  const index = data.schools.findIndex((school) => school.id === schoolId);
  if (index < 0) {
    return;
  }

  state.currentSchoolIndex = index;
  state.activeTab = "reviews";
  updateCarousel();
  renderDetail();
  renderSearchSuggestions();

  if (options.scroll) {
    document.querySelector("#school-detail")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function render() {
  app.innerHTML = `
    <div class="paper-grain" aria-hidden="true"></div>
    <header class="site-header">
      <a class="brand" href="#top" aria-label="${escapeHtml(data.siteName)}首页">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 46 46" fill="none">
            <path d="M8 33C13 19 18 12 24 9C29 12 35 21 39 33" />
            <path d="M14 32C19 28 29 28 34 33" />
            <path d="M24 9V3" />
          </svg>
        </span>
        <span>
          <strong>${escapeHtml(data.siteName)}</strong>
          <small>真实学校便签与校园小店</small>
        </span>
      </a>

      <button class="submit-top-button" type="button" data-action="open-submit">
        留下真实经历
      </button>
    </header>

    <main id="top">
      <section class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">REAL CAMPUS NOTES</p>
          <p class="hero-kicker">${escapeHtml(data.heroSubtitle)}</p>
          <div class="hero-actions">
            <button class="primary-button" type="button" data-action="focus-search">
              查找一所学校
            </button>
            <button class="text-arrow-button" type="button" data-action="open-submit">
              我也想说一句 <span>↗</span>
            </button>
          </div>
        </div>
        <div class="hero-doodle">
          <img src="./assets/moon-dream.jpg" alt="小人爬上月亮摘星星" />
        </div>
      </section>

      <section class="search-section" aria-labelledby="search-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">FIND A SCHOOL</p>
            <h2 id="search-title">按省份、城市、学校或专业搜索</h2>
          </div>
          <span class="updated-stamp">更新于 ${escapeHtml(data.updatedAt)}</span>
        </div>
        <div class="search-box">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input
            id="school-search"
            type="search"
            autocomplete="off"
            placeholder="例如：广东 深圳 计算机"
            aria-label="搜索学校"
          />
          <button id="clear-search" type="button" aria-label="清空搜索">×</button>
          <div class="search-suggestions" id="search-suggestions"></div>
        </div>
        <p class="search-hint">支持组合检索，例如“广东 深圳 计算机”。</p>
      </section>

      <section class="carousel-section" aria-labelledby="school-carousel-title">
        <div class="section-heading section-heading--center">
          <div>
            <p class="eyebrow">SCHOOL NOTES</p>
            <h2 id="school-carousel-title">滚动鼠标，翻看学校便签</h2>
          </div>
        </div>

        <div class="school-carousel" id="school-carousel">
          <button class="carousel-arrow carousel-arrow--prev" type="button" data-action="prev-school" aria-label="上一所学校">←</button>
          <div class="carousel-track" id="carousel-track">
            ${data.schools.map((school, index) => renderSchoolNote(school, index)).join("")}
          </div>
          <button class="carousel-arrow carousel-arrow--next" type="button" data-action="next-school" aria-label="下一所学校">→</button>
        </div>
        <div class="carousel-dots" id="carousel-dots"></div>
      </section>

      <section class="school-detail" id="school-detail"></section>

      <section class="latest-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">RECENT NOTES</p>
            <h2>最近多出来的几张便签</h2>
          </div>
          <button class="text-arrow-button" type="button" data-action="open-submit">
            继续补充 <span>↗</span>
          </button>
        </div>
        <div class="latest-grid" id="latest-grid"></div>
      </section>
    </main>

    <footer class="site-footer">
      <div>
        <strong>${escapeHtml(data.siteName)}</strong>
        <p>展示内容由项目方统一整理。页面为只读展示，不开放公开发帖、评论和私信。</p>
      </div>
      <button class="primary-button" type="button" data-action="open-submit">写一张便签</button>
    </footer>

    <button class="floating-submit" type="button" data-action="open-submit" aria-label="打开投稿">
      <span>+</span>
      投稿
    </button>

    <div class="submit-overlay" id="submit-overlay" aria-hidden="true">
      <div class="submit-sheet" role="dialog" aria-modal="true" aria-labelledby="submit-title">
        <button class="sheet-close" type="button" data-action="close-submit" aria-label="关闭投稿">×</button>
        <p class="eyebrow">LEAVE A NOTE</p>
        <h2 id="submit-title">留下你的真实经历</h2>
        <p class="submit-intro">不必写得完整，也不必像一篇介绍。你的一句话，可能刚好帮到正在犹豫的人。</p>

        <form id="submission-form">
          <label class="form-field">
            <span>学校 <b>必填</b></span>
            <input name="school" type="text" list="school-list" required placeholder="学校或校区名称" />
            <datalist id="school-list">
              ${data.schools.map((school) => `<option value="${escapeHtml(school.name)}"></option>`).join("")}
            </datalist>
          </label>
          <label class="form-field">
            <span>专业 <em>选填</em></span>
            <input name="major" type="text" placeholder="例如：计算机、经济学" />
          </label>
          <label class="form-field">
            <span>想法 <b>必填</b></span>
            <textarea name="idea" rows="6" required placeholder="真实就读、专业、就业、考研、申请、导师……想到什么就写什么。"></textarea>
          </label>
          <label class="form-field">
            <span>好吃的！ <em>选填</em></span>
            <textarea name="food" rows="4" placeholder="校门口、巷子里、居民楼下都可以。"></textarea>
            <small>${escapeHtml(data.submissionNote)}</small>
          </label>
          <label class="check-field">
            <input name="anonymous" type="checkbox" />
            <span>匿名展示我的内容</span>
          </label>
          <label class="check-field">
            <input name="consent" type="checkbox" required />
            <span>我同意平台整理、编辑并用于本站展示</span>
          </label>
          <button class="primary-button submit-form-button" type="submit">生成投稿卡</button>
        </form>

        <div class="draft-result" id="draft-result" hidden>
          <div class="draft-paper">
            <p class="eyebrow">投稿草稿</p>
            <pre id="draft-text"></pre>
          </div>
          <div class="draft-actions">
            <button class="primary-button" type="button" data-action="copy-draft">复制投稿内容</button>
            <button class="secondary-button" type="button" data-action="share-draft">分享投稿</button>
            ${
              data.externalFormUrl
                ? '<button class="secondary-button" type="button" data-action="open-external-form">打开外部投稿表单</button>'
                : ""
            }
            ${
              data.contactEmail
                ? '<button class="secondary-button" type="button" data-action="mail-draft">邮件发送</button>'
                : ""
            }
          </div>
          <p class="draft-tip" id="draft-tip">
            ${
              data.externalFormUrl || data.contactEmail
                ? "请选择一种方式发送投稿。内容经过审核和整理后，才会公开展示。"
                : "当前网页不直接接收投稿。复制后发送给平台维护者，审核整理后才会公开展示。"
            }
          </p>
        </div>
      </div>
    </div>
  `;

  updateCarousel();
  renderDetail();
  renderSearchSuggestions();
  renderLatest();
  bindEvents();
}

function renderSchoolNote(school, index) {
  const color = palette[index % palette.length];
  const tapeRotation = index % 2 === 0 ? -3 : 2;
  return `
    <button
      class="school-note"
      type="button"
      data-school="${escapeHtml(school.id)}"
      style="--note-color:${color};--tape-rotation:${tapeRotation}deg"
      aria-label="查看${escapeHtml(school.name)}"
    >
      <span class="tape" aria-hidden="true"></span>
      <small>${escapeHtml(school.province)} · ${escapeHtml(school.city)}</small>
      <strong>${escapeHtml(school.name)}</strong>
      <span>${escapeHtml(school.majors.slice(0, 2).join(" / "))}</span>
      <i>${school.reviews.length} 条评价 · ${school.foods.length} 家推荐</i>
    </button>
  `;
}

function updateCarousel() {
  const cards = [...document.querySelectorAll(".school-note")];
  const total = cards.length;
  const viewportWidth = Math.min(window.innerWidth * 0.22, 142);

  cards.forEach((card, index) => {
    let offset = index - state.currentSchoolIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const abs = Math.abs(offset);
    const x = offset * viewportWidth;
    const rotate = offset * 3.4;
    const scale = Math.max(0.7, 1 - abs * 0.12);
    const opacity = abs > 2 ? 0 : 1 - abs * 0.22;

    card.style.transform = `translate3d(calc(-50% + ${x}px), ${abs * 8}px, 0) scale(${scale}) rotate(${rotate}deg)`;
    card.style.opacity = opacity;
    card.style.zIndex = String(20 - abs);
    card.style.pointerEvents = abs > 2 ? "none" : "auto";
    card.classList.toggle("is-active", offset === 0);
  });

  const dots = document.querySelector("#carousel-dots");
  if (dots) {
    dots.innerHTML = data.schools
      .map(
        (school, index) => `
          <button
            class="carousel-dot ${index === state.currentSchoolIndex ? "is-active" : ""}"
            type="button"
            data-action="go-school"
            data-index="${index}"
            aria-label="查看${escapeHtml(school.name)}"
          ></button>
        `,
      )
      .join("");
  }
}

function renderDetail() {
  const school = getCurrentSchool();
  const detail = document.querySelector("#school-detail");
  if (!detail) return;

  const isReviews = state.activeTab === "reviews";
  const items = isReviews ? school.reviews : school.foods;

  detail.innerHTML = `
    <div class="detail-school-heading">
      <div>
        <p class="eyebrow">CURRENT SCHOOL</p>
        <h2>${escapeHtml(school.name)}</h2>
        <p>${escapeHtml(school.province)} · ${escapeHtml(school.city)}</p>
      </div>
      <p class="school-summary">${escapeHtml(school.summary)}</p>
    </div>

    <div class="detail-tabs" role="tablist" aria-label="内容切换">
      <button
        type="button"
        role="tab"
        aria-selected="${isReviews}"
        class="${isReviews ? "is-active" : ""}"
        data-action="detail-tab"
        data-tab="reviews"
      >
        大家的评价
      </button>
      <button
        type="button"
        role="tab"
        aria-selected="${!isReviews}"
        class="${!isReviews ? "is-active" : ""}"
        data-action="detail-tab"
        data-tab="foods"
      >
        附近好吃的
      </button>
      <span class="tab-ink" style="--tab-index:${isReviews ? 0 : 1}"></span>
    </div>

    <div class="detail-notes ${isReviews ? "is-reviews" : "is-foods"}">
      ${
        items.length
          ? items.map((item, index) => renderDetailNote(item, index, isReviews)).join("")
          : '<div class="empty-note">这里还没有便签，欢迎成为第一个补充的人。</div>'
      }
    </div>
  `;
}

function renderDetailNote(item, index, isReview) {
  const color = palette[(index + state.currentSchoolIndex) % palette.length];
  if (isReview) {
    return `
      <article class="detail-note" style="--note-color:${color};--rotate:${index % 2 ? 1.1 : -1.4}deg">
        <p class="note-status">${escapeHtml(item.status)}</p>
        <blockquote>“${escapeHtml(item.content)}”</blockquote>
        <footer>
          <span>${escapeHtml(item.author)}</span>
          <span>${escapeHtml(item.major)} · ${escapeHtml(item.stage)}</span>
          <time>${escapeHtml(item.updatedAt)}</time>
        </footer>
      </article>
    `;
  }

  return `
    <article class="detail-note detail-note--food" style="--note-color:${color};--rotate:${index % 2 ? 1.2 : -1.5}deg">
      <p class="note-status">${escapeHtml(item.status)}</p>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.reason)}</p>
      <dl>
        <div><dt>位置</dt><dd>${escapeHtml(item.area)}</dd></div>
        <div><dt>人均</dt><dd>${escapeHtml(item.price)}</dd></div>
        <div><dt>适合</dt><dd>${escapeHtml(item.scene)}</dd></div>
      </dl>
      <time>${escapeHtml(item.updatedAt)}</time>
    </article>
  `;
}

function renderLatest() {
  const latestGrid = document.querySelector("#latest-grid");
  if (!latestGrid) return;

  const latestReviews = data.schools
    .flatMap((school) =>
      school.reviews.map((review) => ({
        ...review,
        schoolName: school.name,
      })),
    )
    .slice(0, 3);

  latestGrid.innerHTML = latestReviews
    .map(
      (review, index) => `
        <article class="latest-note" style="--rotate:${index % 2 ? 1 : -1}deg">
          <small>${escapeHtml(review.schoolName)} · ${escapeHtml(review.major)}</small>
          <p>“${escapeHtml(review.content)}”</p>
          <span>${escapeHtml(review.status)} · ${escapeHtml(review.updatedAt)}</span>
        </article>
      `,
    )
    .join("");
}

function renderSearchSuggestions() {
  const suggestions = document.querySelector("#search-suggestions");
  if (!suggestions) return;

  if (!state.searchTokens.length) {
    suggestions.classList.remove("is-visible");
    suggestions.innerHTML = "";
    return;
  }

  suggestions.classList.add("is-visible");
  suggestions.innerHTML = state.matches.length
    ? state.matches
        .slice(0, 6)
        .map(
          (school) => `
            <button type="button" data-action="search-school" data-school="${escapeHtml(school.id)}">
              <strong>${escapeHtml(school.name)}</strong>
              <span>${escapeHtml(school.province)} · ${escapeHtml(school.city)} · ${escapeHtml(school.majors.slice(0, 2).join(" / "))}</span>
            </button>
          `,
        )
        .join("")
    : '<p class="no-result">没有匹配结果，可以换个关键词试试。</p>';
}

function moveSchool(step) {
  const total = data.schools.length;
  state.currentSchoolIndex =
    (state.currentSchoolIndex + step + total) % total;
  state.activeTab = "reviews";
  updateCarousel();
  renderDetail();
}

function bindEvents() {
  document.querySelector("#school-carousel")?.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) < 8) return;
      event.preventDefault();

      const now = performance.now();
      if (now < state.wheelLockedUntil) return;
      state.wheelLockedUntil = now + 430;
      moveSchool(event.deltaY > 0 ? 1 : -1);
    },
    { passive: false },
  );

  const searchInput = document.querySelector("#school-search");
  searchInput?.addEventListener("input", () => {
    searchSchools(searchInput.value);
    renderSearchSuggestions();
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const first = state.matches[0];
      if (first) {
        chooseSchool(first.id, { scroll: true });
        searchInput.value = first.name;
      }
    }
  });

  document.querySelector("#clear-search")?.addEventListener("click", () => {
    searchInput.value = "";
    state.searchTokens = [];
    state.matches = data.schools;
    renderSearchSuggestions();
    searchInput.focus();
  });
}

function openSubmit() {
  const overlay = document.querySelector("#submit-overlay");
  overlay?.classList.add("is-open");
  overlay?.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  window.setTimeout(() => {
    document.querySelector('input[name="school"]')?.focus();
  }, 260);
}

function closeSubmit() {
  const overlay = document.querySelector("#submit-overlay");
  overlay?.classList.remove("is-open");
  overlay?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openExternalForm() {
  if (!data.externalFormUrl) return;
  window.open(data.externalFormUrl, "_blank", "noopener,noreferrer");
}

function mailDraft() {
  if (!data.contactEmail || !state.lastDraftText) return;
  const subject = encodeURIComponent("真实的一页投稿");
  const body = encodeURIComponent(state.lastDraftText);
  window.location.href = `mailto:${data.contactEmail}?subject=${subject}&body=${body}`;
}

function generateDraft(form) {
  const formData = new FormData(form);
  const school = String(formData.get("school") || "").trim();
  const major = String(formData.get("major") || "").trim();
  const idea = String(formData.get("idea") || "").trim();
  const food = String(formData.get("food") || "").trim();
  const anonymous = formData.get("anonymous") === "on";

  if (!school || !idea) return "";

  const lines = [
    `【学校】${school}`,
    `【专业】${major || "未填写"}`,
    `【我想说的话】${idea}`,
    `【好吃的】${food || "暂未填写"}`,
    `【署名】${anonymous ? "匿名" : "可联系平台确认后展示"}`,
  ];
  return lines.join("\n\n");
}

async function copyDraft() {
  if (!state.lastDraftText) return;
  const tip = document.querySelector("#draft-tip");
  try {
    await navigator.clipboard.writeText(state.lastDraftText);
    if (tip) tip.textContent = "已复制。可以发送给平台维护者或粘贴到投稿表单。";
  } catch {
    if (tip) tip.textContent = "复制失败，请手动选择上方文字复制。";
  }
}

async function shareDraft() {
  if (!state.lastDraftText) return;
  try {
    if (navigator.share) {
      await navigator.share({
        title: "真实的一页 · 投稿",
        text: state.lastDraftText,
      });
      return;
    }
  } catch {
    return;
  }
  await copyDraft();
}

function dismissIntro() {
  if (!intro || intro.classList.contains("is-hidden")) return;
  if (introTimer) window.clearTimeout(introTimer);
  intro.classList.add("is-hidden");
  sessionStorage.setItem("real-page-intro-seen", "1");
  window.setTimeout(() => {
    intro.hidden = true;
  }, 700);
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-school]");
  if (!target) return;

  if (target.dataset.school) {
    chooseSchool(target.dataset.school);
    return;
  }

  const action = target.dataset.action;

  if (action === "prev-school") moveSchool(-1);
  if (action === "next-school") moveSchool(1);
  if (action === "go-school") moveSchool(Number(target.dataset.index) - state.currentSchoolIndex);
  if (action === "focus-search") {
    const search = document.querySelector("#school-search");
    search?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => search?.focus(), 400);
  }
  if (action === "detail-tab") {
    state.activeTab = target.dataset.tab;
    renderDetail();
  }
  if (action === "open-submit") openSubmit();
  if (action === "close-submit") closeSubmit();
  if (action === "copy-draft") copyDraft();
  if (action === "share-draft") shareDraft();
  if (action === "open-external-form") openExternalForm();
  if (action === "mail-draft") mailDraft();
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "submission-form") return;
  event.preventDefault();

  const draft = generateDraft(event.target);
  if (!draft) return;

  state.lastDraftText = draft;
  const result = document.querySelector("#draft-result");
  const draftText = document.querySelector("#draft-text");
  if (draftText) draftText.textContent = draft;
  result.hidden = false;

  const drafts = JSON.parse(localStorage.getItem("real-page-drafts") || "[]");
  drafts.unshift({
    id: Date.now(),
    text: draft,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem("real-page-drafts", JSON.stringify(drafts.slice(0, 50)));

  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector('[data-action="close-intro"]')?.addEventListener("click", dismissIntro);
window.addEventListener("wheel", dismissIntro, { passive: true, once: true });
window.addEventListener("resize", updateCarousel);

const skipIntro = new URLSearchParams(window.location.search).get("intro") === "0";

if (skipIntro || sessionStorage.getItem("real-page-intro-seen")) {
  intro.hidden = true;
} else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  dismissIntro();
} else {
  introTimer = window.setTimeout(dismissIntro, 5600);
}

render();

if (new URLSearchParams(window.location.search).get("submit") === "1") {
  window.setTimeout(openSubmit, 120);
}
