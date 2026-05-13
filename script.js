(function () {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const reducedMotionQuery = typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  const motionAllowed = () => !reducedMotionQuery.matches;

  const navToggle = $(".nav-toggle");
  const navMenu = $("#nav-menu");

  function closeMenu() {
    if (!navToggle || !navMenu) return;

    navMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");

      document.body.classList.toggle("menu-open", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;
      if (!document.body.classList.contains("menu-open")) return;
      if (target.closest(".nav")) return;

      closeMenu();
    });
  }

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();
      closeMenu();

      target.scrollIntoView({
        behavior: motionAllowed() ? "smooth" : "auto",
        block: "start"
      });

      history.pushState(null, "", targetId);
    });
  });

  const navLinks = $$("[data-nav]");

  const sectionMap = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      const section = href && href.startsWith("#") ? document.querySelector(href) : null;

      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sectionMap.length) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (!visibleEntries.length) return;

        const activeId = visibleEntries[0].target.id;

        sectionMap.forEach(({ link }) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${activeId}`);
        });
      },
      {
        rootMargin: "-24% 0px -66% 0px",
        threshold: 0
      }
    );

    sectionMap.forEach(({ section }) => activeObserver.observe(section));
  }

  const revealTargets = $$(".reveal");

  revealTargets.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 45}ms`);
  });

  if (!motionAllowed()) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -90px 0px",
        threshold: 0.12
      }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  async function writeToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");

    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "-9999px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    document.execCommand("copy");
    textArea.remove();
  }

  function markCopied(button, originalText) {
    button.classList.add("copied");
    button.textContent = "Copied";

    window.setTimeout(() => {
      button.classList.remove("copied");
      button.textContent = originalText;
    }, 1400);
  }

  $$("[data-copy-target]").forEach((button) => {
    const originalText = button.textContent.trim();

    button.addEventListener("click", async () => {
      const selector = button.getAttribute("data-copy-target");
      const target = selector ? document.querySelector(selector) : null;

      if (!target) return;

      try {
        await writeToClipboard(target.textContent.trim());
        markCopied(button, originalText);
      } catch (error) {
        console.error("Unable to copy text", error);
      }
    });
  });

  $$("[data-copy-text]").forEach((button) => {
    const originalText = button.textContent.trim();
    const text = button.getAttribute("data-copy-text") || "";

    button.addEventListener("click", async () => {
      if (!text) return;

      try {
        await writeToClipboard(text);
        markCopied(button, originalText);
      } catch (error) {
        console.error("Unable to copy text", error);
      }
    });
  });

  // const aiNodes = $$("[data-ai-node]");

  // if (aiNodes.length && motionAllowed()) {
  //   let activeIndex = 0;

  //   function activateAiNode(index) {
  //     aiNodes.forEach((node, nodeIndex) => {
  //       node.classList.toggle("is-active", nodeIndex === index);
  //     });
  //   }

  //   activateAiNode(activeIndex);

  //   window.setInterval(() => {
  //     activeIndex = (activeIndex + 1) % aiNodes.length;
  //     activateAiNode(activeIndex);
  //   }, 1800);
  // }

  const backToTop = $("[data-back-to-top]");

  if (backToTop) {
    const updateBackToTop = () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 640);
    };

    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: motionAllowed() ? "smooth" : "auto"
      });
    });
  }
})();
