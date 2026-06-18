(function () {
  const lockScreen = document.getElementById("lockScreen");
  const archiveScreen = document.getElementById("archiveScreen");
  const lockForm = document.getElementById("lockForm");
  const passwordInput = document.getElementById("passwordInput");
  const lockStatus = document.getElementById("lockStatus");
  const searchInput = document.getElementById("searchInput");
  const clrBtn = document.getElementById("clrBtn");
  const chipsEl = document.getElementById("chips");
  const sortOrder = document.getElementById("sortOrder");
  const showDrafts = document.getElementById("showDrafts");
  const listEl = document.getElementById("list");
  const resnumEl = document.getElementById("resnum");
  const emptyState = document.getElementById("emptyState");
  const countEl = document.getElementById("count");
  const yEl = document.getElementById("y");

  // カテゴリの並び順と色（受講生QAと同じトーン）
  const CATEGORY_ORDER = [
    "メールレッスンの内容について",
    "オーガニックの基礎知識",
    "お客様への説明で困ったこと",
    "売場・商品について",
    "その他"
  ];
  const CATEGORY_COLORS = {
    "メールレッスンの内容について": "#1583c4",
    "オーガニックの基礎知識": "#4a9d5b",
    "お客様への説明で困ったこと": "#d4663a",
    "売場・商品について": "#e8973c",
    "その他": "#8a7565"
  };
  const color = (c) => CATEGORY_COLORS[c] || "#8a7565";
  const esc = (s) => (s || "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  let allItems = [];
  let activeCat = "all";
  const STORAGE_KEY = "qa_password";

  yEl.textContent = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric" }).replace(/[^0-9]/g, "");

  // ---- ログイン ----
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
          lockStatus.textContent = "パスワードが違います";
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

  // ---- イベント ----
  searchInput.addEventListener("input", () => {
    clrBtn.style.display = searchInput.value ? "block" : "none";
    render();
  });
  clrBtn.addEventListener("click", () => {
    searchInput.value = "";
    clrBtn.style.display = "none";
    render();
    searchInput.focus();
  });
  sortOrder.addEventListener("change", render);
  showDrafts.addEventListener("change", render);

  // ---- 表示対象の集合（下書きトグルを反映） ----
  function visiblePool() {
    return showDrafts.checked ? allItems.slice() : allItems.filter((it) => it.published);
  }

  // ---- チップ生成 ----
  function buildChips(pool) {
    const counts = {};
    pool.forEach((it) => {
      const c = it.category || "その他";
      counts[c] = (counts[c] || 0) + 1;
    });
    const cats = CATEGORY_ORDER.filter((c) => counts[c]);
    Object.keys(counts).forEach((c) => { if (cats.indexOf(c) === -1) cats.push(c); });

    chipsEl.innerHTML = "";
    chipsEl.appendChild(makeChip("すべて", "all", "#3bb273", pool.length, activeCat === "all"));
    cats.forEach((c) => chipsEl.appendChild(makeChip(c, c, color(c), counts[c], activeCat === c)));
  }

  function makeChip(label, key, dotColor, n, on) {
    const b = document.createElement("button");
    b.className = "chip" + (on ? " on" : "");
    b.innerHTML = '<span class="dot"></span>' + esc(label) + '<span class="n">' + n + "</span>";
    if (on) b.style.background = dotColor;
    else b.querySelector(".dot").style.background = dotColor;
    b.onclick = () => { activeCat = key; render(); };
    return b;
  }

  // ---- 検索ハイライト ----
  function hl(text, q) {
    const e = esc(text);
    if (!q) return e;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return e.replace(new RegExp(safe, "gi"), (m) => "<mark>" + m + "</mark>");
  }

  // ---- 描画 ----
  function render() {
    const pool = visiblePool();
    buildChips(pool);
    countEl.textContent = pool.length + " 件のQ&A";

    const keyword = searchInput.value.trim();
    const kw = keyword.toLowerCase();
    const order = sortOrder.value;

    let rows = pool.slice();
    if (activeCat !== "all") rows = rows.filter((it) => (it.category || "その他") === activeCat);
    if (kw) {
      rows = rows.filter((it) =>
        (it.question || "").toLowerCase().includes(kw) ||
        (it.answer || "").toLowerCase().includes(kw)
      );
    }
    rows.sort((a, b) => {
      const da = a.date || "", db = b.date || "";
      return order === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });

    resnumEl.textContent = rows.length + " 件を表示" +
      (activeCat !== "all" ? "（" + activeCat + "）" : "") +
      (keyword ? "／「" + keyword + "」" : "");

    if (!rows.length) {
      listEl.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    listEl.innerHTML = rows.map((it) => {
      const cat = it.category || "その他";
      const col = color(cat);
      const date = it.date ? '<span class="date">' + esc(it.date) + "</span>" : "";
      const draft = it.published ? "" : '<span class="draftbadge">下書き</span>';
      const ansText = (it.answer || "").trim();
      const ans = ansText
        ? '<span class="atext">' + hl(ansText, keyword) + "</span>"
        : '<span class="atext empty">（回答準備中）</span>';
      return '<details class="qa" style="border-left-color:' + col + '">' +
        '<summary>' +
          '<div class="toprow"><span class="tag" style="background:' + col + '">' + esc(cat) + "</span>" + date + draft + "</div>" +
          '<div class="qz"><span class="qmark">Q.</span><span class="qtext">' + hl(it.question || "", keyword) + "</span></div>" +
        "</summary>" +
        '<div class="ans"><div class="az"><span class="amark">💡</span><span style="font-weight:700;color:' + col + '">A.</span></div>' +
          '<div class="az" style="margin-top:6px">' + ans + "</div></div>" +
      "</details>";
    }).join("");
  }
})();
