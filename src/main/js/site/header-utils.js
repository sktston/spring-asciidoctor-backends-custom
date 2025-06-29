function getOrCreateHeaderActions() {
  const header = document.querySelector("#header");
  if (!header) return null;

  let wrapper = header.querySelector(".header-actions");

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "header-actions";

    const h1 = header.querySelector("h1");
    if (h1) {
      h1.insertAdjacentElement("afterend", wrapper);
    } else {
      header.appendChild(wrapper);
    }
  }

  return wrapper;
}

module.exports = { getOrCreateHeaderActions };
