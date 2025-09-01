/* eslint-env browser */
"use strict";

/* ---------------------------
 * Local TOC: mobile dropdown
 * --------------------------- */
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
    const listEl = li ? li.closest("ul") : null;
    const isLevel2 = !!(listEl && listEl.classList.contains("sectlevel2"));

    const option = document.createElement("option");
    option.value = link.getAttribute("href");
    option.textContent = (isLevel2 ? "\u2003" : "") + link.textContent; // indent level 2
    dropdown.appendChild(option);
  });

  // Smooth scroll on change
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

/* -----------------------------------
 * Version modal + outdated notice bar
 * ----------------------------------- */
document.addEventListener("DOMContentLoaded", async function () {
  const trigger = document.getElementById("browse-version");
  const versionSpan = document.querySelector(".context .version");

  // Helpers
  const getMajorMinor = (v) => {
    if (!v) return null;
    const m = String(v).match(/^(\d+)\.(\d+)/);
    return m ? `${m[1]}.${m[2]}` : null;
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const headOrQuickGetExists = async (url) => {
    try {
      const head = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        cache: "no-cache",
      });
      if (head.ok || head.status === 301 || head.status === 302) return true;
      if (head.status !== 405) return false; // 405 → fall back to GET
    } catch {
      // fall through to GET
    }
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const resp = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: ctrl.signal,
        cache: "no-cache",
      });
      clearTimeout(t);
      try {
        if (resp.body && typeof resp.body.cancel === "function")
          resp.body.cancel();
      } catch {}
      return resp.ok || resp.status === 301 || resp.status === 302;
    } catch {
      return false;
    }
  };

  // Prefer <meta name="doc-version"> (e.g., 1.20.4-commit), fallback to .context .version (e.g., 1.20)
  const metaVerEl = document.querySelector('meta[name="doc-version"]');
  const metaVer =
    metaVerEl && metaVerEl.content ? metaVerEl.content.trim() : "";
  const currentMM =
    getMajorMinor(metaVer) ||
    getMajorMinor(
      versionSpan && versionSpan.textContent
        ? versionSpan.textContent.trim()
        : ""
    );

  // doc-category (e.g., "docs" or another top-level category)
  const docCategoryMeta = document.querySelector('meta[name="doc-category"]');
  const docCategory =
    docCategoryMeta && docCategoryMeta.content
      ? docCategoryMeta.content
      : (function () {
          const segs = window.location.pathname.split("/").filter(Boolean);
          return segs[0] || "docs";
        })();

  // Build same-path URL under a given version by swapping only the version segment
  const samePathUnder = (targetMM) => {
    const url = new URL(window.location.href);
    const pattern = new RegExp(
      `/${escapeRegExp(docCategory)}/\\d+\\.\\d+(?=/|$)`
    );
    url.pathname = url.pathname.replace(pattern, `/${docCategory}/${targetMM}`);
    return url.toString();
  };

  // Modal: only build if trigger exists and we know the current version
  let latestMMFromManifest = null;

  if (trigger && currentMM) {
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
          <li><strong>${currentMM}</strong> (현재 문서)</li>
        </ul>
      </div>
    `;
    document.body.appendChild(modal);

    // Load /versions.json and populate
    try {
      const res = await fetch("/versions.json");
      if (res.ok) {
        const data = await res.json();
        const versions = Array.isArray(data.versions) ? data.versions : [];
        latestMMFromManifest = data.latest || null;

        const listEl = modal.querySelector(".version-list");
        if (listEl) listEl.innerHTML = "";

        versions.forEach((v) => {
          const li = document.createElement("li");
          if (v === currentMM) {
            li.innerHTML = `<strong>${v}</strong> (현재 문서)`;
          } else {
            const link = document.createElement("a");
            link.textContent = v;

            // Pre-resolve candidate URL for cleaner UX
            const candidate = samePathUnder(v);
            const fallback = `/${docCategory}/${v}/`;

            // We resolve on click to avoid many HEADs up front
            link.href = candidate; // default; will be checked on click
            link.addEventListener("click", function (e) {
              e.preventDefault();
              headOrQuickGetExists(candidate)
                .then((ok) => {
                  window.location.href = ok ? candidate : fallback;
                })
                .catch(() => {
                  window.location.href = fallback;
                });
            });

            li.appendChild(link);
          }
          if (listEl) listEl.appendChild(li);
        });

        // --- Outdated notice under #header ---
        if (
          latestMMFromManifest &&
          currentMM &&
          latestMMFromManifest !== currentMM
        ) {
          const header = document.getElementById("header");
          if (header) {
            // Pre-resolve latest link (same path if exists, else latest index)
            const latestCandidate = samePathUnder(latestMMFromManifest);
            const latestIndex = `/${docCategory}/${latestMMFromManifest}/`;
            let latestHref = latestIndex;
            try {
              const ok = await headOrQuickGetExists(latestCandidate);
              if (ok) latestHref = latestCandidate;
            } catch {
              // ignore, keep fallback
            }

            const div = document.createElement("div");
            div.className = "admonitionblock important";
            div.innerHTML = `
              <table>
                <tbody>
                  <tr>
                    <td class="icon"><i class="fa icon-important" title="Important"></i></td>
                    <td class="content">
                      현재 보시는 문서는 오래된 버전 (${currentMM}) 이며,
                      최신 버전 문서는
                      <a href="${latestHref}" class="latest-version-link" style="text-decoration: underline; font-weight: 600;">
                        <strong>${latestMMFromManifest}</strong>
                      </a>
                      입니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            `;
            // Place at the very top of #header
            header.prepend(div);
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load list of versions:", err);
    }

    // Show modal
    trigger.addEventListener("click", () => {
      modal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    });

    // Close modal (button)
    const closeBtn = modal.querySelector(".version-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        document.body.classList.remove("modal-open");
      });
    }

    // Close modal (backdrop)
    const backdrop = modal.querySelector(".version-modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        modal.classList.add("hidden");
        document.body.classList.remove("modal-open");
      });
    }
  }
});
