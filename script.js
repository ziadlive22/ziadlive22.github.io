/**
 * Tiny enhancements — mobile nav, active section highlight.
 * No framework. Easy to extend later.
 */
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("nav-mobile");

  if (toggle && mobileNav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        mobileNav.hidden = false;
      } else {
        mobileNav.hidden = true;
      }
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Soft current-section highlight on desktop nav
  const sections = ["about", "work", "philosophy", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = document.querySelectorAll(".nav-list a");

  if (sections.length && "IntersectionObserver" in window) {
    const map = new Map();
    navLinks.forEach((a) => {
      const href = a.getAttribute("href");
      if (href && href.startsWith("#")) map.set(href.slice(1), a);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((a) => a.removeAttribute("aria-current"));
          const link = map.get(id);
          if (link) link.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
  }
})();
