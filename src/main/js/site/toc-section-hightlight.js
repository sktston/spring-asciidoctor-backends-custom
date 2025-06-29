document.addEventListener("DOMContentLoaded", function () {
  // Get current page filename from browser URL (without anchor)
  const currentPage = window.location.pathname.split("/").pop().split("#")[0];

  // Get all TOC links
  const tocLinks = document.querySelectorAll("#toc ul.sectlevel1 li a");

  // Find and highlight the matching link
  tocLinks.forEach((link) => {
    const linkHref = link.getAttribute("href").split("#")[0];

    // If current page matches the link href (both without anchors)
    if (currentPage === linkHref) {
      // Add "active" class to the parent li element
      link.parentElement.classList.add("active");
    }
  });
});
