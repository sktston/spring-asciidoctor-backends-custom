const { getOrCreateHeaderActions } = require("./header-utils.js");

document.addEventListener("DOMContentLoaded", function () {
  const wrapper = getOrCreateHeaderActions();
  if (!wrapper) return;

  const baseUrl = window.location.origin + window.location.pathname;
  const promptText = `${baseUrl} 문서를 읽고 질문에 답변해주세요.`;

  const aiContainer = document.createElement("div");
  aiContainer.className = "ask-ai-container";

  const aiButton = document.createElement("button");
  aiButton.className = "dropdown-btn";
  aiButton.innerHTML = `
    <span class="ai-icon ask-ai-icon" aria-hidden="true"></span>
    <span class="dropdown-label">Explain with AI</span>
    <span class="dropdown-arrow-icon"></span>
  `;

  const aiMenu = document.createElement("div");
  aiMenu.className = "ai-dropdown";

  // ChatGPT option
  const chatGptLink = document.createElement("a");
  chatGptLink.href = `https://chat.openai.com/?model=gpt-4o&q=${encodeURIComponent(
    promptText
  )}`;
  chatGptLink.target = "_blank";
  chatGptLink.innerHTML = `
  <span class="ai-icon chatgpt-icon" aria-hidden="true"></span>
  <span class="ai-icon-label">Open in ChatGPT</span>
  <span class="external-link-icon" aria-hidden="true"></span>`;

  // Claude option
  const claudeLink = document.createElement("a");
  claudeLink.href = `https://claude.ai/new?q=${encodeURIComponent(promptText)}`;
  claudeLink.target = "_blank";
  claudeLink.innerHTML = `
  <span class="ai-icon claude-icon" aria-hidden="true"></span>
  <span class="ai-icon-label">Open in Claude</span>
  <span class="external-link-icon" aria-hidden="true"></span>`;

  aiMenu.appendChild(chatGptLink);
  aiMenu.appendChild(claudeLink);

  aiButton.addEventListener("click", () => {
    const isOpen = aiMenu.style.display === "block";
    aiMenu.style.display = isOpen ? "none" : "block";
    aiButton.classList.toggle("open", !isOpen);
  });

  document.addEventListener("click", (e) => {
    if (!aiContainer.contains(e.target)) {
      aiMenu.style.display = "none";
      aiButton.classList.remove("open");
    }
  });

  aiContainer.appendChild(aiButton);
  aiContainer.appendChild(aiMenu);

  wrapper.appendChild(aiContainer);
});
