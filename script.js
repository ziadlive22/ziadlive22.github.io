/**
 * Ziad T. — portfolio enhancements.
 * Vanilla JS, no build step. Everything degrades gracefully without JS.
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ------------------------------------------------------------
     Header: solid background once the page is scrolled
     ------------------------------------------------------------ */
  const header = $(".site-header");
  if (header) {
    let ticking = false;
    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------------
     Mobile menu (full-screen overlay)
     ------------------------------------------------------------ */
  const toggle = $(".nav-toggle");
  const menu = $("#menu");

  if (toggle && menu) {
    let closeTimer = null;

    const setOpen = (open) => {
      clearTimeout(closeTimer);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("menu-open", open);

      if (open) {
        menu.hidden = false;
        // Two frames so the transition from opacity:0 actually runs.
        requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
        const first = $("a", menu);
        if (first) first.focus({ preventScroll: true });
      } else {
        menu.classList.remove("is-open");
        const delay = reduceMotion.matches ? 0 : 350;
        closeTimer = setTimeout(() => {
          menu.hidden = true;
        }, delay);
        if (menu.contains(document.activeElement)) toggle.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    $$("a", menu).forEach((link) => link.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
    });

    // Close if the viewport grows past the mobile breakpoint while open.
    const desktop = window.matchMedia("(min-width: 901px)");
    desktop.addEventListener("change", (e) => {
      if (e.matches && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
    });
  }

  /* ------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------ */
  const revealEls = $$("[data-reveal]");
  if (revealEls.length) {
    if ("IntersectionObserver" in window && !reduceMotion.matches) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-in"));
    }
  }

  /* ------------------------------------------------------------
     Active section in the desktop nav
     ------------------------------------------------------------ */
  const navLinks = $$(".nav-list a");
  const sections = navLinks
    .map((a) => {
      const href = a.getAttribute("href") || "";
      return href.startsWith("#") ? document.getElementById(href.slice(1)) : null;
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => a.removeAttribute("aria-current"));
          const link = byId.get(entry.target.id);
          if (link) link.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
  }

  /* ------------------------------------------------------------
     Hero "signal": a slow, layered waveform on canvas.
     Nods to the music side; static single frame under reduced motion.
     ------------------------------------------------------------ */
  const canvas = $("[data-signal]");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let t = 0;
    let raf = 0;
    let running = false;
    let pointerX = 0.5; // 0..1 across the hero, gently biases the wave

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const wave = (x, time, phase, amp, freq) =>
      Math.sin(x * freq + time + phase) * amp +
      Math.sin(x * freq * 0.5 - time * 0.7 + phase * 1.3) * amp * 0.55;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const mid = h * 0.55;
      const bias = (pointerX - 0.5) * 0.6;
      const layers = [
        { color: "rgba(242, 176, 78, 0.55)", amp: h * 0.16, freq: 0.006, phase: 0, width: 1.4 },
        { color: "rgba(242, 176, 78, 0.22)", amp: h * 0.24, freq: 0.0045, phase: 1.8, width: 1 },
        { color: "rgba(154, 167, 255, 0.28)", amp: h * 0.12, freq: 0.009, phase: 3.1, width: 1 },
      ];

      layers.forEach((layer, i) => {
        ctx.beginPath();
        ctx.lineWidth = layer.width;
        ctx.strokeStyle = layer.color;
        for (let x = 0; x <= w; x += 3) {
          const nx = x / w;
          // Envelope: quiet at the edges, loud in the middle (like a fade).
          const env = Math.sin(nx * Math.PI) ** 0.8;
          const y = mid + wave(x, t * (0.6 + i * 0.15), layer.phase + bias, layer.amp, layer.freq) * env;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Baseline
      ctx.beginPath();
      ctx.strokeStyle = "rgba(243, 236, 224, 0.06)";
      ctx.lineWidth = 1;
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();
    };

    const loop = () => {
      t += 0.012;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduceMotion.matches) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw();

    if (!reduceMotion.matches) {
      // Only animate while the hero is on screen.
      const hero = canvas.closest(".hero") || canvas;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
          { threshold: 0 }
        ).observe(hero);
      } else {
        start();
      }

      hero.addEventListener(
        "pointermove",
        (e) => {
          const rect = hero.getBoundingClientRect();
          pointerX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        },
        { passive: true }
      );

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
      });
    }

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        draw();
      }, 120);
    });

    reduceMotion.addEventListener("change", (e) => {
      if (e.matches) {
        stop();
        draw();
      } else {
        start();
      }
    });
  }

  /* ------------------------------------------------------------
     Local time in Egypt
     ------------------------------------------------------------ */
  const clock = $("[data-clock]");
  if (clock && typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Cairo",
    });
    const iso = new Intl.DateTimeFormat("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Cairo",
    });
    const tick = () => {
      const now = new Date();
      clock.textContent = fmt.format(now);
      clock.setAttribute("datetime", iso.format(now));
    };
    tick();
    // Align updates to the minute boundary.
    setTimeout(() => {
      tick();
      setInterval(tick, 60 * 1000);
    }, (60 - new Date().getSeconds()) * 1000);
  }

  /* ------------------------------------------------------------
     Copy email
     ------------------------------------------------------------ */
  const copyBtn = $("[data-copy]");
  const copyStatus = $("[data-copy-status]");
  if (copyBtn) {
    const label = $(".copy-btn-text", copyBtn);
    const value = copyBtn.getAttribute("data-copy") || "";
    let resetTimer = 0;

    const setState = (text, copied) => {
      if (label) label.textContent = text;
      copyBtn.classList.toggle("is-copied", copied);
      if (copyStatus) copyStatus.textContent = copied ? "Email address copied to clipboard" : "";
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        if (label) label.textContent = "Copy";
        copyBtn.classList.remove("is-copied");
        if (copyStatus) copyStatus.textContent = "";
      }, 2200);
    };

    copyBtn.addEventListener("click", async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const ta = document.createElement("textarea");
          ta.value = value;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setState("Copied", true);
      } catch (err) {
        setState("Failed", false);
      }
    });
  }

  /* ------------------------------------------------------------
     Footer year
     ------------------------------------------------------------ */
  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
