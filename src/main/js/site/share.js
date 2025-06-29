const { getOrCreateHeaderActions } = require("./header-utils.js");

document.addEventListener("DOMContentLoaded", function () {
  const wrapper = getOrCreateHeaderActions();
  if (!wrapper) return;

  // Get base url
  const baseUrl = window.location.origin + window.location.pathname;

  // Set title
  const docTitle = document.title || "";
  const pageTitle = document.querySelector("h1")?.textContent?.trim() || "";
  const combinedTitle = pageTitle ? `${docTitle} : ${pageTitle}` : docTitle;

  const container = document.createElement("div");
  container.className = "share-container";

  const label = document.createElement("span");
  label.className = "share-label";
  label.innerHTML = "Share via";

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = "share-btn";
  copyBtn.title = "주소 복사";
  copyBtn.innerHTML = `<i class="fa fa-link"></i>`;

  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(baseUrl);
      showToast("주소가 복사되었습니다.");
    } catch (e) {
      console.warn("Copy failed", e);
      showToast("복사에 실패했습니다.");
    }
  });

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "copy-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  // Share button
  const shareBtn = document.createElement("button");
  shareBtn.className = "share-btn";
  shareBtn.title = "공유하기";
  shareBtn.innerHTML = `<i class="fa fa-share-alt"></i>`;

  shareBtn.addEventListener("click", async () => {
    try {
      await navigator.share({
        title: combinedTitle,
        url: baseUrl,
      });
    } catch (e) {
      console.warn("Share aborted or failed", e);
    }
  });

  // LinkedIn button
  const linkedinBtn = document.createElement("button");
  linkedinBtn.className = "share-btn";
  linkedinBtn.title = "LinkedIn 공유";
  linkedinBtn.innerHTML = `<i class="fa fa-linkedin"></i>`;
  linkedinBtn.addEventListener("click", () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      baseUrl
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  container.appendChild(label);
  container.appendChild(copyBtn);
  container.appendChild(linkedinBtn);
  container.appendChild(shareBtn);

  wrapper.appendChild(container);
});
