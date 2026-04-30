(function () {
  const form = document.getElementById("qaForm");
  const status = document.getElementById("status");
  const submitBtn = document.getElementById("submitBtn");
  const thanks = document.getElementById("thanks");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: form.name.value.trim(),
      department: form.department.value.trim(),
      category: form.category.value,
      question: form.question.value.trim()
    };

    if (!data.category || !data.question) {
      status.textContent = "カテゴリと質問内容は必須です";
      status.className = "status error";
      return;
    }

    submitBtn.disabled = true;
    status.textContent = "送信中...";
    status.className = "status loading";

    try {
      // GASのdoPostは text/plain で送るとCORSプリフライト不要
      const res = await fetch(window.QA_CONFIG.POST_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "送信に失敗しました");

      form.classList.add("hidden");
      thanks.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      status.textContent = "送信できませんでした。少し時間をおいて再度お試しください。";
      status.className = "status error";
      submitBtn.disabled = false;
    }
  });
})();
