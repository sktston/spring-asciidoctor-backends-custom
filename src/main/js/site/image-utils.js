document.addEventListener("DOMContentLoaded", function () {
  // Disable if the width is less than 800
  if (window.innerWidth <= 800) return;

  // Image zoom functionality
  // Create zoom overlay element
  const zoomOverlay = document.createElement("div");
  zoomOverlay.className = "zoom-overlay";
  zoomOverlay.id = "zoomOverlay";
  document.body.insertBefore(zoomOverlay, document.body.firstChild);

  // Add zoomable-image class to all images (or specific selector)
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    img.classList.add("zoomable-image");
  });

  // Add zoom functionality
  const zoomableImages = document.querySelectorAll(".zoomable-image");
  const body = document.body;

  zoomableImages.forEach((image) => {
    image.addEventListener("click", function () {
      if (this.classList.contains("zoomed")) {
        // Zoom out
        this.classList.remove("zoomed");
        this.style.top = "";
        this.style.left = "";
        this.style.transform = "";
        zoomOverlay.classList.remove("active");
        body.classList.remove("zoom-active");
      } else {
        // Zoom in
        // First, close any other zoomed images
        zoomableImages.forEach((img) => {
          img.classList.remove("zoomed");
          img.style.top = "";
          img.style.left = "";
          img.style.transform = "";
        });

        // Get current image position
        const rect = this.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate final position (center of viewport)
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;

        // Calculate translation needed
        const translateX = viewportCenterX - centerX;
        const translateY = viewportCenterY - centerY;

        // Apply zoom
        this.classList.add("zoomed");
        this.style.top = rect.top + "px";
        this.style.left = rect.left + "px";
        this.style.width = rect.width + "px";
        this.style.height = rect.height + "px";

        // Force reflow then apply transform
        this.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.8)`;

        zoomOverlay.classList.add("active");
        body.classList.add("zoom-active");
      }
    });
  });

  // Click overlay to close zoomed image
  zoomOverlay.addEventListener("click", function () {
    zoomableImages.forEach((img) => {
      img.classList.remove("zoomed");
      img.style.top = "";
      img.style.left = "";
      img.style.transform = "";
    });
    this.classList.remove("active");
    body.classList.remove("zoom-active");
  });

  // ESC key to close zoomed image
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      zoomableImages.forEach((img) => {
        img.classList.remove("zoomed");
        img.style.top = "";
        img.style.left = "";
        img.style.transform = "";
      });
      zoomOverlay.classList.remove("active");
      body.classList.remove("zoom-active");
    }
  });
});
