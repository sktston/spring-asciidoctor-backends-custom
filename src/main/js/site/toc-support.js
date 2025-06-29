document.addEventListener("DOMContentLoaded", function () {
  const aside = document.querySelector(".local-toc .toc-menu");
  if (!aside) return;

  const links = aside.querySelectorAll("a[href^='#']");
  if (links.length === 0) return;

  // Create mobile dropdown
  const dropdown = document.createElement("select");
  dropdown.className = "mobile-toc-dropdown";

  const defaultOption = document.createElement("option");
  defaultOption.textContent = "이 페이지의 목차";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  dropdown.appendChild(defaultOption);

  links.forEach((link) => {
    const li = link.closest("li");
    const isLevel2 = li.closest("ul").classList.contains("sectlevel2");
    const option = document.createElement("option");
    option.value = link.getAttribute("href");
    option.textContent = (isLevel2 ? "\u2003" : "") + link.textContent; // Add space
    dropdown.appendChild(option);
  });

  // Scroll on change
  dropdown.addEventListener("change", function () {
    const targetId = this.value;
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      const top = targetEl.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });

  // Insert dropdown at top of #content
  const content = document.querySelector("#content");
  if (content) {
    content.prepend(dropdown);
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  const trigger = document.getElementById("browse-version");
  if (!trigger) return;

  const versionSpan = document.querySelector(".context .version");
  const currentVersion = versionSpan?.textContent?.trim();
  if (!currentVersion) return;

  const docCategoryMeta = document.querySelector('meta[name="doc-category"]');
  if (!docCategoryMeta) {
    console.error("Missing <meta name='doc-category'> in the page.");
    return;
  }
  const docCategory = docCategoryMeta.content;
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // Create modal container
  const modal = document.createElement("div");
  modal.id = "version-modal";
  modal.className = "version-modal hidden";
  modal.innerHTML = `
    <div class="version-modal-backdrop"></div>
    <div class="version-modal-content">
      <button class="version-modal-close" aria-label="Close">&times;</button>
      <h3>문서 버전</h3>
      <ul class="version-list">
        <li><strong>${currentVersion}</strong> (현재 문서)</li>
      </ul>
    </div>
  `;
  document.body.appendChild(modal);

  // Try to fetch version list from /versions.json
  try {
    const res = await fetch("/versions.json");
    if (res.ok) {
      const data = await res.json();
      const listEl = modal.querySelector(".version-list");
      const versions = data.versions;

      // Clear list first
      listEl.innerHTML = "";

      versions.forEach((v) => {
        const li = document.createElement("li");
        if (v === currentVersion) {
          li.innerHTML = `<strong>${v}</strong> (현재 문서)`;
        } else {
          const link = document.createElement("a");
          link.href = `/${docCategory}/${v}/${currentPage}`;
          link.textContent = v;

          link.addEventListener("click", function (e) {
            e.preventDefault();

            fetch(link.href, { method: "HEAD" }).then((res) => {
              if (res.ok) {
                window.location.href = link.href;
              } else {
                window.location.href = `/${docCategory}/${v}/`;
              }
            });
          });

          li.appendChild(link);
        }
        listEl.appendChild(li);
      });
    }
  } catch (err) {
    console.warn("Failed to load list of versions:", err);
  }

  // Show modal
  trigger.addEventListener("click", () => {
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  });

  // Close modal
  modal.querySelector(".version-modal-close").addEventListener("click", () => {
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  });
  modal
    .querySelector(".version-modal-backdrop")
    .addEventListener("click", () => {
      modal.classList.add("hidden");
      document.body.classList.remove("modal-open");
    });
});
