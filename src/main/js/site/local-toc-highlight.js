/*
 * Local TOC Handler - Right side panel navigation
 * Follows similar approach to the global TOC handler
 */

(function () {
  "use strict";

  // Controls for debugging the local TOC behavior
  const debugMode = true;

  // Key elements for the local TOC
  let localTocElement;
  let contentElement;

  // Data structures for navigation
  let headingElements;
  let hrefToTocAnchorElement;
  let headingElementToTocElement;

  // State tracking
  let lastActiveTocElement = null;
  let disableOnScroll = false;
  let activeHeadingId = null;
  let suppressHashChange = false;
  let isScrolling = false;

  // Configuration
  const headerOffset = 61; // Set to match your fixed header size
  const topThreshold = 0; // Threshold for determining if a heading is at the top

  // Utility functions
  function throttle(func, wait) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  window.addEventListener("load", initializeLocalToc);

  function initializeLocalToc() {
    localTocElement = document.querySelector(".local-toc");
    contentElement = document.querySelector("#content");

    if (!localTocElement || !contentElement) {
      debug("Local TOC or content element not found");
      return;
    }

    headingElements = findLocalHeadingElements();
    hrefToTocAnchorElement = buildLocalHrefToTocAnchorElement();
    headingElementToTocElement = buildLocalHeadingElementToTocElement();

    debug(`Found ${headingElements.length} headings in the document`);

    window.addEventListener("hashchange", onLocationHashChange);
    window.addEventListener("scroll", onLocalScroll);
    window.addEventListener("scroll", onLocalEndScroll);
    window.addEventListener("resize", onLocalResize);
    localTocElement.addEventListener("click", onLocalTocElementClick);

    onLocationHashChange();
    onLocalScroll();
  }

  function findLocalHeadingElements() {
    const tocLinks = localTocElement.querySelectorAll("ul li a");
    const headings = [];

    tocLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        const heading = document.querySelector(href);
        if (heading) {
          headings.push(heading);
        }
      }
    });

    return Array.from(headings).sort((a, b) => {
      const posA = a.getBoundingClientRect().top + window.scrollY;
      const posB = b.getBoundingClientRect().top + window.scrollY;
      return posA - posB;
    });
  }

  function buildLocalHrefToTocAnchorElement() {
    const result = new Map();
    for (const tocAnchorElement of localTocElement.querySelectorAll("li > a")) {
      const href = tocAnchorElement.getAttribute("href");
      if (href) {
        result.set(href, tocAnchorElement);
      }
    }
    return result;
  }

  function buildLocalHeadingElementToTocElement() {
    const result = new Map();
    for (const headingElement of headingElements) {
      const id = headingElement.id;
      if (id) {
        const href = "#" + id;
        const tocAnchorElement = hrefToTocAnchorElement.get(href);
        if (tocAnchorElement) {
          const tocElement = tocAnchorElement.parentElement;
          result.set(headingElement, tocElement);
        }
      }
    }
    return result;
  }

  function onLocationHashChange() {
    if (suppressHashChange) {
      debug("Suppressed hashchange handling");
      suppressHashChange = false;
      return;
    }

    const hash = window.location.hash;
    if (hash) {
      const tocAnchorElement = hrefToTocAnchorElement.get(hash);
      if (tocAnchorElement) {
        disableOnScroll = true;
        debug(`Activating hash change: ${hash}`);
        activeHeadingId = hash.substring(1);
        activateLocalTocElement(tocAnchorElement.parentElement);
      }
    }

    setTimeout(() => {
      disableOnScroll = false;
    }, 100);
  }

  const onLocalScroll = throttle(function () {
    isScrolling = true;
    if (!disableOnScroll) {
      activateLocalTopHeadingTocElement();
    }
  }, 50);

  const onLocalEndScroll = debounce(function () {
    debug("Local scrolling ended");
    isScrolling = false;
    disableOnScroll = false;

    // Important: Re-evaluate the active heading when scrolling ends
    if (activeHeadingId) {
      const targetHeading = document.getElementById(activeHeadingId);
      if (targetHeading) {
        const tocElement = headingElementToTocElement.get(targetHeading);
        if (tocElement) {
          activateLocalTocElement(tocElement);
          return;
        }
      }
    }

    activateLocalTopHeadingTocElement();
  }, 250); // Increased debounce time for more reliable end-of-scroll detection

  const onLocalResize = throttle(function () {
    headingElements = findLocalHeadingElements();
    headingElementToTocElement = buildLocalHeadingElementToTocElement();
    activateLocalTopHeadingTocElement();
  }, 200);

  function onLocalTocElementClick(event) {
    if (event.target.nodeName === "A") {
      const href = event.target.getAttribute("href");
      if (!href || !href.startsWith("#")) {
        return;
      }

      event.preventDefault();

      const id = href.substring(1);
      const targetHeading = document.getElementById(id);
      if (!targetHeading) {
        return;
      }

      // Immediately activate the clicked TOC element
      const tocElement = event.target.parentElement;
      if (tocElement) {
        activateLocalTocElement(tocElement);
      }

      activeHeadingId = id;
      disableOnScroll = true;
      suppressHashChange = true;
      debug(`TOC link clicked: ${href}`);

      // Scroll to adjusted position
      const scrollY =
        targetHeading.getBoundingClientRect().top +
        window.scrollY -
        headerOffset;
      window.scrollTo({ top: scrollY, behavior: "smooth" });

      // Monitor scroll completion and ensure the right TOC item stays highlighted
      const checkScrollComplete = setInterval(() => {
        if (!isScrolling) {
          clearInterval(checkScrollComplete);

          // Re-activate the correct TOC element after scrolling is complete
          if (tocElement) {
            activateLocalTocElement(tocElement);
          }

          // Allow scroll-based activation after a delay
          setTimeout(() => {
            disableOnScroll = false;
          }, 150);
        }
      }, 100);
    }
  }

  function activateLocalTopHeadingTocElement() {
    debug("Finding top header element");

    if (activeHeadingId && disableOnScroll) {
      const activeElement = document.getElementById(activeHeadingId);
      if (activeElement) {
        const tocElement = headingElementToTocElement.get(activeElement);
        if (tocElement) {
          activateLocalTocElement(tocElement);
          return;
        }
      }
    }

    const topHeadingElement = getLocalTopHeading();
    if (topHeadingElement) {
      const tocElement = headingElementToTocElement.get(topHeadingElement);
      if (tocElement) {
        activateLocalTocElement(tocElement);
      }
    }

    if (!disableOnScroll) {
      activeHeadingId = null;
    }
  }

  function getLocalTopHeading() {
    let headingAbove = null;
    let minDistanceAbove = Infinity;
    let minDistanceBelow = Infinity;

    for (const heading of headingElements) {
      const rect = heading.getBoundingClientRect();
      const headingTop = rect.top;

      if (Math.abs(headingTop - headerOffset) <= topThreshold) {
        debug(`Found heading exactly at viewport top: ${heading.id}`);
        return heading;
      }

      if (headingTop < headerOffset) {
        const distance = headerOffset - headingTop;
        if (distance < minDistanceAbove) {
          minDistanceAbove = distance;
          headingAbove = heading;
        }
      } else {
        const distance = headingTop - headerOffset;
        if (distance < minDistanceBelow) {
          minDistanceBelow = distance;
        }
      }
    }

    if (headingAbove) {
      debug(`Using heading above viewport: ${headingAbove.id}`);
      return headingAbove;
    }

    return headingElements[0];
  }

  function activateLocalTocElement(element) {
    if (!element) {
      return;
    }

    if (element !== lastActiveTocElement) {
      debug(`Activating TOC element: ${element.textContent}`);
      if (lastActiveTocElement) {
        lastActiveTocElement.classList.remove("active");
      }
      element.classList.add("active");
      lastActiveTocElement = element;
    }
  }

  function debug(message) {
    if (debugMode) {
      console.debug("[LocalTOC] " + message);
    }
  }
})();
