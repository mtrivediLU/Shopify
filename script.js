(function () {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      if (event.key === "Escape") closeMenu();
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
      target.scrollIntoView({ behavior: motionAllowed ? "smooth" : "auto", block: "start" });
      history.pushState(null, "", targetId);
    });
  });

  const navLinks = $$("[data-nav]");
  const sectionMap = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      return href && href.startsWith("#") ? { link, section: document.querySelector(href) } : null;
    })
    .filter((item) => item && item.section);

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
      { rootMargin: "-24% 0px -66% 0px", threshold: 0 }
    );

    sectionMap.forEach(({ section }) => activeObserver.observe(section));
  }

  function animateMetric(element) {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";

    const target = Number(element.dataset.value || 0);
    const decimals = Number(element.dataset.decimals || 0);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const duration = 1150;
    const start = performance.now();

    function render(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      element.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(render);
      } else {
        element.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      }
    }

    if (!motionAllowed) {
      element.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }

    requestAnimationFrame(render);
  }

  const metricTargets = $$(".metric-value");

  if ("IntersectionObserver" in window) {
    const metricObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateMetric(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    metricTargets.forEach((metric) => metricObserver.observe(metric));
  } else {
    metricTargets.forEach(animateMetric);
  }

  const revealTargets = $$(".reveal");

  if (!motionAllowed) {
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
      { rootMargin: "0px 0px -90px 0px", threshold: 0.12 }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  $$("[data-tabs]").forEach((tabGroup) => {
    const buttons = $$("[data-tab-target]", tabGroup);
    const panels = $$(".tab-panel", tabGroup);

    function activateTab(button) {
      const targetId = button.dataset.tabTarget;

      buttons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle("is-active", isActive);

        if (isActive) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "");
        }
      });
    }

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => activateTab(button));

      button.addEventListener("keydown", (event) => {
        const keyMap = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1
        };

        if (!(event.key in keyMap)) return;

        event.preventDefault();
        const nextIndex = (index + keyMap[event.key] + buttons.length) % buttons.length;
        buttons[nextIndex].focus();
        activateTab(buttons[nextIndex]);
      });
    });
  });

  const filterButtons = $$("[data-filter]");
  const evidenceCards = $$(".evidence-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));

      evidenceCards.forEach((card) => {
        const categories = (card.dataset.category || "").split(" ");
        const shouldShow = filter === "all" || categories.includes(filter);
        card.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });

  async function writeToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999px";
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

  $$("[data-copy-text]").forEach((button) => {
    const originalText = button.textContent;

    button.addEventListener("click", async () => {
      const text = button.dataset.copyText || originalText;

      try {
        await writeToClipboard(text);
        markCopied(button, originalText);
      } catch (error) {
        console.error("Copy failed", error);
      }
    });
  });

  $$("[data-copy-target]").forEach((button) => {
    const originalText = button.textContent;

    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copyTarget);
      if (!target) return;

      try {
        await writeToClipboard(target.textContent.trim());
        markCopied(button, originalText);
      } catch (error) {
        console.error("Copy failed", error);
      }
    });
  });

  const backToTop = $("[data-back-to-top]");

  if (backToTop) {
    window.addEventListener(
      "scroll",
      () => {
        backToTop.classList.toggle("is-visible", window.scrollY > 640);
      },
      { passive: true }
    );

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: motionAllowed ? "smooth" : "auto" });
    });
  }
})();