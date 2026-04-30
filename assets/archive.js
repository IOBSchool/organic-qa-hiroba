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

  let allItems = [];
  const STORAGE_KEY = "qa_password";

  // 自動ログイン
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

    items.forEach((it) => {
      const li = document.createElement("li");
      li.className = "qa-item";

      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.className = "qa-summary";

      const meta = document.createElement("div");
      meta.className = "qa-meta";
      const dateEl = document.createElement("span");
      dateEl.className = "qa-date";
      dateEl.textContent = it.date || "";
      const badge = document.createElement("span");
      badge.className = "qa-badge";
      badge.textContent = it.category || "";
      meta.appendChild(dateEl);
      meta.appendChild(badge);
      if (!it.published) {
        const draftBadge = document.createElement("span");
        draftBadge.className = "qa-badge draft";
        draftBadge.textContent = "下書き";
        meta.appendChild(draftBadge);
      }

      const q = document.createElement("div");
      q.className = "qa-question";
      q.textContent = "Q. " + (it.question || "");

      summary.appendChild(meta);
      summary.appendChild(q);

      const ans = document.createElement("div");
      ans.className = "qa-answer";
      if (it.answer) {
        ans.textContent = "A. " + it.answer;
      } else {
        ans.classList.add("empty");
        ans.textContent = "（回答準備中）";
      }

      details.appendChild(summary);
      details.appendChild(ans);
      li.appendChild(details);
      qaList.appendChild(li);
    });
  }
})();
