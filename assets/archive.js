(function () {
  const lockScreen = document.getElementById("lockScreen");
  const archiveScreen = document.getElementById("archiveScreen");
  const lockForm = document.getElementById("lockForm");
  const passwordInput = document.getElementById("passwordInput");
  const lockStatus = document.getElementById("lockStatus");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortOrder = document.getElementById("sortOrder");
  const showDrafts = document.getElementById("showDrafts");
  const qaList = document.getElementById("qaList");
  const emptyState = document.getElementById("emptyState");

  const PREVIEW_LENGTH = 80;
  const CATEGORY_ORDER = [
    "メールレッスンの内容について",
    "オーガニックの基礎知識",
    "お客様への説明で困ったこと",
    "売場・商品について",
    "その他"
  ];
  const CATEGORY_ICONS = {
    "メールレッスンの内容について": "📩",
    "オーガニックの基礎知識": "🌱",
    "お客様への説明で困ったこと": "💬",
    "売場・商品について": "🛒",
    "その他": "📂"
  };

  let allItems = [];
  const STORAGE_KEY = "qa_password";

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) tryLogin(saved, true);

  lockForm.addEventListener("submit", (e) => {
    e.preventDefault();
    tryLogin(passwordInput.value, false);
  });

  async function tryLogin(password, silent) {
    if (!silent) {
      lockStatus.textContent = "確認中...";
      lockStatus.className = "status loading";
    }
    try {
      const url = window.QA_CONFIG.GET_URL + "?password=" + encodeURIComponent(password);
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data.ok) {
        if (!silent) {
          lockStatus.textContent = "合言葉が違います";
          lockStatus.className = "status error";
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        return;
      }
      localStorage.setItem(STORAGE_KEY, password);
      allItems = data.items || [];
      lockScreen.classList.add("hidden");
      archiveScreen.classList.remove("hidden");
      render();
    } catch (err) {
      console.error(err);
      if (!silent) {
        lockStatus.textContent = "通信エラー。もう一度お試しください。";
        lockStatus.className = "status error";
      }
    }
  }

  searchInput.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  sortOrder.addEventListener("change", render);
  showDrafts.addEventListener("change", render);

  function render() {
    const keyword = searchInput.value.trim().toLowerCase();
    const cat = categoryFilter.value;
    const order = sortOrder.value;
    const draftsVisible = showDrafts.checked;

    let items = allItems.slice();

    if (!draftsVisible) items = items.filter((it) => it.published);
    if (cat) items = items.filter((it) => it.category === cat);
    if (keyword) {
      items = items.filter((it) => {
        return (it.question || "").toLowerCase().includes(keyword)
          || (it.answer || "").toLowerCase().includes(keyword);
      });
    }

    items.sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      return order === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });

    qaList.innerHTML = "";
    if (items.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    const groups = groupByCategory(items);
    groups.forEach((group) => {
      qaList.appendChild(renderCategorySection(group));
    });
  }

  function groupByCategory(items) {
    const map = new Map();
    items.forEach((it) => {
      const c = it.category || "その他";
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(it);
    });
    const ordered = [];
    CATEGORY_ORDER.forEach((c) => {
      if (map.has(c)) ordered.push({ category: c, items: map.get(c) });
    });
    map.forEach((items, c) => {
      if (CATEGORY_ORDER.indexOf(c) === -1) {
        ordered.push({ category: c, items: items });
      }
    });
    return ordered;
  }

  function renderCategorySection(group) {
    const section = document.createElement("section");
    section.className = "qa-category";

    const header = document.createElement("button");
    header.className = "qa-category-header";
    header.type = "button";
    header.setAttribute("aria-expanded", "true");

    const icon = CATEGORY_ICONS[group.category] || "📂";
    const title = document.createElement("span");
    title.className = "qa-category-title";
    title.textContent = icon + " " + group.category;

    const count = document.createElement("span");
    count.className = "qa-category-count";
    count.textContent = group.items.length + "件";

    const chevron = document.createElement("span");
    chevron.className = "qa-category-chevron";
    chevron.textContent = "▼";

    header.appendChild(title);
    header.appendChild(count);
    header.appendChild(chevron);

    const body = document.createElement("div");
    body.className = "qa-category-body";

    group.items.forEach((it) => {
      body.appendChild(renderQaItem(it));
    });

    header.addEventListener("click", () => {
      const open = body.classList.toggle("collapsed") === false;
      header.setAttribute("aria-expanded", String(open));
      chevron.textContent = open ? "▼" : "▶";
    });

    section.appendChild(header);
    section.appendChild(body);
    return section;
  }

  function renderQaItem(it) {
    const card = document.createElement("article");
    card.className = "qa-item";

    const meta = document.createElement("div");
    meta.className = "qa-meta";
    if (it.date) {
      const dateEl = document.createElement("span");
      dateEl.className = "qa-date";
      dateEl.textContent = it.date;
      meta.appendChild(dateEl);
    }
    if (!it.published) {
      const draftBadge = document.createElement("span");
      draftBadge.className = "qa-badge draft";
      draftBadge.textContent = "下書き";
      meta.appendChild(draftBadge);
    }

    const q = document.createElement("div");
    q.className = "qa-question";
    q.textContent = "Q. " + (it.question || "");

    card.appendChild(meta);
    card.appendChild(q);

    if (it.answer) {
      card.appendChild(renderAnswer(it.answer));
    } else {
      const ans = document.createElement("div");
      ans.className = "qa-answer empty";
      ans.textContent = "（回答準備中）";
      card.appendChild(ans);
    }

    return card;
  }

  function renderAnswer(answerText) {
    const wrap = document.createElement("div");
    wrap.className = "qa-answer-wrap";

    const label = document.createElement("div");
    label.className = "qa-answer-label";
    label.textContent = "💡 A.";
    wrap.appendChild(label);

    const text = answerText.trim();
    if (text.length <= PREVIEW_LENGTH) {
      const ans = document.createElement("div");
      ans.className = "qa-answer";
      ans.textContent = text;
      wrap.appendChild(ans);
      return wrap;
    }

    const preview = document.createElement("div");
    preview.className = "qa-answer qa-answer-preview";
    preview.textContent = text.slice(0, PREVIEW_LENGTH) + "…";

    const full = document.createElement("div");
    full.className = "qa-answer hidden";
    full.textContent = text;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qa-readmore";
    btn.textContent = "▼ 続きを読む";
    btn.addEventListener("click", () => {
      const opened = full.classList.toggle("hidden") === false;
      preview.classList.toggle("hidden", opened);
      btn.textContent = opened ? "▲ 閉じる" : "▼ 続きを読む";
    });

    wrap.appendChild(preview);
    wrap.appendChild(full);
    wrap.appendChild(btn);
    return wrap;
  }
})();
