/* =========================================================
   Mihir Trivedi · A note for Shopify · PS Engineering
   ---------------------------------------------------------
   Slim. Only what the page actually needs.
   ========================================================= */

(function () {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));

  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Letter date ---------------- */

  const dateEl = $("#letter-date");
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  /* ---------------- Mobile nav ---------------- */

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
      navToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("is-open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      closeMenu();
    });
  }

  /* ---------------- Smooth scroll for in-page links ---------------- */

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      let target = null;
      try {
        target = document.querySelector(targetId);
      } catch (_) {
        return;
      }
      if (!target) return;

      e.preventDefault();
      closeMenu();
      target.scrollIntoView({
        behavior: motionAllowed ? "smooth" : "auto",
        block: "start"
      });
      history.pushState(null, "", targetId);
    });
  });

  /* ---------------- Active section highlight ---------------- */

  const navLinks = $$("[data-nav]");
  const sectionMap = navLinks
    .map((link) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return null;
      const section = document.querySelector(href);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sectionMap.length) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        const activeId = visible[0].target.id;
        sectionMap.forEach(({ link }) => {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === `#${activeId}`
          );
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    sectionMap.forEach(({ section }) => activeObserver.observe(section));
  }

  /* ---------------- Header shadow on scroll ---------------- */

  const header = $(".site-header");
  if (header) {
    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------------- Reveal on scroll ---------------- */

  const revealTargets = $$(".reveal");

  if (!motionAllowed) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.12 }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------- Code-block copy ---------------- */

  async function writeToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      ta.remove();
    }
  }

  function markCopied(btn, original) {
    btn.classList.add("copied");
    btn.textContent = "Copied";
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.textContent = original;
    }, 1400);
  }

  $$("[data-copy-target]").forEach((btn) => {
    const original = btn.textContent;
    btn.addEventListener("click", async () => {
      const target = btn.dataset.copyTarget
        ? document.querySelector(btn.dataset.copyTarget)
        : null;
      if (!target) return;
      try {
        await writeToClipboard(target.textContent.trim());
        markCopied(btn, original);
      } catch (err) {
        console.error("Copy failed", err);
      }
    });
  });

  /* ---------------- Back to top ---------------- */

  const backToTop = $("[data-back-to-top]");
  if (backToTop) {
    const update = () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 640);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });

    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: motionAllowed ? "smooth" : "auto" });
    });
  }
})();