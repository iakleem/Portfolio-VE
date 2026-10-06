/* ═══════════════════════════════════════════════════════════
   Akleem Khan Portfolio — script.js
   Custom cursor (spring follow) · Lazy hover-play videos ·
   Tick ring · Word reveal · Scroll reveals · Contact modal
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  /* ─────────────────────────────────────────
     1.  CUSTOM CURSOR  (creatoroly style)
     ───────────────────────────────────────── */
  const cursor     = document.getElementById("cursor");
  const cursorDot  = document.getElementById("cursorDot");
  const cursorBadge = document.getElementById("cursorBadge");
  const cbLabel    = document.getElementById("cbLabel");
  const cbIco      = document.getElementById("cbIco");
  const cbPause    = cbIco ? cbIco.querySelector(".cb-pause") : null;
  const cbPlay     = cbIco ? cbIco.querySelector(".cb-play")  : null;

  if (!isTouch && cursor) {
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2; // target
    let x = tx, y = ty;                                          // spring pos
    let vx = 0, vy = 0;                                          // spring vel
    let last = performance.now();

    const STIFFNESS = 380;
    const DAMPING   = 28;

    document.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });

    document.addEventListener("mouseleave", () => (cursor.style.opacity = "0"));
    document.addEventListener("mouseenter", () => (cursor.style.opacity = "1"));

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.033) || 0.016;
      last = now;

      const ax = -STIFFNESS * (x - tx) - DAMPING * vx;
      const ay = -STIFFNESS * (y - ty) - DAMPING * vy;
      vx += ax * dt;
      vy += ay * dt;
      x  += vx * dt;
      y  += vy * dt;

      const tilt = Math.max(-9, Math.min(9, vx * 0.05));
      cursor.style.transform =
        `translate3d(${x}px, ${y}px, 0) rotate(${tilt}deg)`;

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* Cursor modes */
    function setBadge(label, withIcon, playing) {
      cbLabel.textContent = label;
      cbIco.style.display = withIcon ? "" : "none";
      if (withIcon && cbPause && cbPlay) {
        cbPause.style.display = playing ? "" : "none";
        cbPlay.style.display  = playing ? "none" : "";
      }
    }

    document.addEventListener("mouseover", (e) => {
      const t = e.target;

      const showreel = t.closest('[data-cursor="showreel"]');
      if (showreel) {
        const v = showreel.querySelector("video");
        setBadge(showreel.dataset.badge || "SHOWREEL", true, v ? !v.paused : true);
        cursor.classList.add("is-badge");
        cursor.classList.remove("is-link");
        return;
      }

      const card = t.closest(".vcard");
      if (card && t.closest(".vcard-media")) {
        const v = card.querySelector("video");
        setBadge((card.dataset.label || "PLAY").toUpperCase(), true, v ? !v.paused : true);
        cursor.classList.add("is-badge");
        cursor.classList.remove("is-link");
        return;
      }

      const view = t.closest('[data-cursor="view"]');
      if (view) {
        setBadge("VIEW", false, true);
        cursor.classList.add("is-badge");
        cursor.classList.remove("is-link");
        return;
      }

      if (t.closest("a, button")) {
        cursor.classList.add("is-link");
        cursor.classList.remove("is-badge");
        return;
      }

      cursor.classList.remove("is-link", "is-badge");
    });
  }

  /* ─────────────────────────────────────────
     2.  ICON HELPERS + GLOBAL SOLO AUDIO
     ───────────────────────────────────────── */
  const allVideos = [...document.querySelectorAll("video")];

  function syncMuteIcon(btn, muted) {
    if (!btn) return;
    const m = btn.querySelector(".ico-muted");
    const s = btn.querySelector(".ico-sound");
    if (m) m.style.display = muted ? "" : "none";
    if (s) s.style.display = muted ? "none" : "";
  }

  // Only one video unmuted at a time
  function soloAudio(activeVideo) {
    allVideos.forEach((v) => {
      v.muted = v !== activeVideo;
    });
    document.querySelectorAll(".vcard").forEach((card) => {
      syncMuteIcon(card.querySelector(".vcard-mute-btn"), card.querySelector("video").muted);
    });
    const hv = document.getElementById("heroVideo");
    if (hv) syncMuteIcon(document.getElementById("heroMuteBtn"), hv.muted);
    const vv = document.getElementById("vslVideo");
    if (vv) syncMuteIcon(document.getElementById("vslMuteBtn"), vv.muted);
  }

  /* ─────────────────────────────────────────
     2b. LAZY VIDEO SOURCES
     Off-screen card videos keep their URL in data-src
     so they only load when scrolled near the viewport.
     (No-JS fallback: plain src stays in the HTML.)
     ───────────────────────────────────────── */
  allVideos.forEach((v) => {
    if (v.id === "heroVideo") return;
    const s = v.getAttribute("src");
    if (!s) return;
    v.dataset.src = s;
    v.removeAttribute("src");
    v.load();
  });

  const lazyObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const v = e.target;
      lazyObs.unobserve(v);
      if (v.dataset.src && !v.getAttribute("src")) v.src = v.dataset.src;
    });
  }, { rootMargin: "700px 0px" });

  allVideos.forEach((v) => { if (v.dataset.src) lazyObs.observe(v); });

  /* ─────────────────────────────────────────
     3.  HERO VIDEO — autoplay, pause + mute
     ───────────────────────────────────────── */
  const heroVideo   = document.getElementById("heroVideo");
  const heroPlayBtn = document.getElementById("heroPlayBtn");
  const heroMuteBtn = document.getElementById("heroMuteBtn");

  function syncHeroPlayIcon() {
    if (!heroPlayBtn || !heroVideo) return;
    const p = heroPlayBtn.querySelector(".ico-pause");
    const pl = heroPlayBtn.querySelector(".ico-play");
    if (p)  p.style.display  = heroVideo.paused ? "none" : "";
    if (pl) pl.style.display = heroVideo.paused ? "" : "none";
  }

  if (heroVideo) {
    // Play only while on screen
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { heroVideo.play().catch(() => {}); }
        else                  { heroVideo.pause(); }
      });
    }, { threshold: 0.2 });
    obs.observe(heroVideo);

    heroVideo.addEventListener("play",  syncHeroPlayIcon);
    heroVideo.addEventListener("pause", syncHeroPlayIcon);
  }

  if (heroPlayBtn && heroVideo) {
    heroPlayBtn.addEventListener("click", () => {
      if (heroVideo.paused) { heroVideo.play().catch(() => {}); }
      else                  { heroVideo.pause(); }
    });
  }

  if (heroMuteBtn && heroVideo) {
    heroMuteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (heroVideo.muted) { soloAudio(heroVideo); }
      else                 { heroVideo.muted = true; syncMuteIcon(heroMuteBtn, true); }
    });
  }

  /* ─────────────────────────────────────────
     4.  VIDEO CARDS — hover to play / stop
     ───────────────────────────────────────── */
  document.querySelectorAll(".vcard").forEach((card) => {
    const media   = card.querySelector(".vcard-media");
    const video   = card.querySelector("video");
    const muteBtn = card.querySelector(".vcard-mute-btn");

    if (media && video) {
      if (!isTouch) {
        media.addEventListener("mouseenter", () => {
          video.play().catch(() => {});
          media.classList.add("playing");
        });

        media.addEventListener("mouseleave", () => {
          video.pause();
          try { video.currentTime = 0; } catch (err) {}
          media.classList.remove("playing");
        });
      }

      // Touch only: tap toggles play/pause (desktop clicks must not
      // pause the video — that made hover previews stop "after a few seconds")
      if (isTouch) {
        media.addEventListener("click", () => {
          if (video.paused) { video.play().catch(() => {}); media.classList.add("playing"); }
          else              { video.pause(); media.classList.remove("playing"); }
        });
      }
    }

    if (muteBtn && video) {
      muteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (video.muted) { soloAudio(video); }
        else             { video.muted = true; syncMuteIcon(muteBtn, true); }
      });
    }
  });

  /* ─────────────────────────────────────────
     4b. VSL — long-form video
     Plays while on screen; click toggles play/pause
     ───────────────────────────────────────── */
  const vslVideo   = document.getElementById("vslVideo");
  const vslPlayBtn = document.getElementById("vslPlayBtn");
  const vslMuteBtn = document.getElementById("vslMuteBtn");

  function syncVslPlayIcon() {
    if (!vslPlayBtn || !vslVideo) return;
    const p  = vslPlayBtn.querySelector(".ico-pause");
    const pl = vslPlayBtn.querySelector(".ico-play");
    if (p)  p.style.display  = vslVideo.paused ? "none" : "";
    if (pl) pl.style.display = vslVideo.paused ? "" : "none";
  }

  if (vslVideo) {
    let vslWantedOn = false;

    const vslObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        vslWantedOn = e.isIntersecting;
        if (vslWantedOn) {
          vslVideo.play().catch(() => {
            // First scroll-in can race the lazy src assignment (huge file
            // starts loading) — retry once it settles
            setTimeout(() => {
              if (vslWantedOn && vslVideo.paused) vslVideo.play().catch(() => {});
            }, 700);
          });
        } else {
          vslVideo.pause();
        }
      });
    }, { threshold: 0.35 });
    vslObs.observe(vslVideo);

    vslVideo.addEventListener("play",  syncVslPlayIcon);
    vslVideo.addEventListener("pause", syncVslPlayIcon);

    const toggleVsl = () => {
      if (vslVideo.paused) { vslVideo.play().catch(() => {}); }
      else                 { vslVideo.pause(); }
    };
    if (vslPlayBtn) vslPlayBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleVsl(); });
    vslVideo.addEventListener("click", toggleVsl);
  }

  if (vslMuteBtn && vslVideo) {
    vslMuteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (vslVideo.muted) { soloAudio(vslVideo); }
      else                { vslVideo.muted = true; syncMuteIcon(vslMuteBtn, true); }
    });
  }

  /* ─────────────────────────────────────────
     5.  TICK RING SVG  (clock-face ticks)
     ───────────────────────────────────────── */
  const svg = document.getElementById("tickSvg");
  if (svg) {
    const CX = 350, CY = 350, R = 305, TICKS = 72;
    for (let i = 0; i < TICKS; i++) {
      const angle  = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
      const isLong = i % 9 === 0;
      const inner  = R - (isLong ? 20 : 11);
      const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", (CX + Math.cos(angle) * inner).toFixed(2));
      ln.setAttribute("y1", (CY + Math.sin(angle) * inner).toFixed(2));
      ln.setAttribute("x2", (CX + Math.cos(angle) * R).toFixed(2));
      ln.setAttribute("y2", (CY + Math.sin(angle) * R).toFixed(2));
      ln.setAttribute("stroke", "#d5d5d5");
      ln.setAttribute("stroke-width", isLong ? "1.5" : "1");
      ln.setAttribute("stroke-linecap", "round");
      svg.appendChild(ln);
    }
  }

  const tickWrap = document.getElementById("tickRingWrap");
  window.addEventListener("scroll", () => {
    if (tickWrap) tickWrap.style.transform = `rotate(${window.scrollY * 0.018}deg)`;
  }, { passive: true });

  /* ─────────────────────────────────────────
     6.  WORD-BY-WORD SCROLL REVEAL
     ───────────────────────────────────────── */
  const words     = [...document.querySelectorAll(".statement .w")];
  const statement = document.querySelector(".statement");

  function revealWords() {
    if (!statement || words.length === 0) return;
    const rect     = statement.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / (rect.height * 0.7), 0), 1);
    const litCount = Math.floor(progress * (words.length + 1));
    words.forEach((w, i) => w.classList.toggle("lit", i < litCount));
  }

  setTimeout(() => {
    words.slice(0, 4).forEach((w) => w.classList.add("lit"));
  }, 400);

  window.addEventListener("scroll", revealWords, { passive: true });
  revealWords();

  /* ─────────────────────────────────────────
     7.  SCROLL REVEAL  (sections & cards)
     ───────────────────────────────────────── */
  document
    .querySelectorAll(".work-head, .bracket-head, .variety, .varieties, .vcard, .contact, .hero-head, .hero-card, .bg-words")
    .forEach((el) => el.classList.add("reveal"));

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.06, rootMargin: "0px 0px -30px 0px" });

  document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

  /* ─────────────────────────────────────────
     8.  GET IN TOUCH — modal + form automation
     ───────────────────────────────────────── */
  const modal = document.getElementById("contactModal");
  if (modal) {
    const form      = document.getElementById("contactForm");
    const statusEl  = document.getElementById("formStatus");
    const submitBtn = document.getElementById("formSubmitBtn");
    let lastFocus = null;

    function openModal() {
      lastFocus = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");

      // Pause whatever is playing while the visitor is typing
      allVideos.forEach((v) => {
        if (!v.paused) { v.dataset.wasPlaying = "1"; v.pause(); }
      });

      const firstField = form && form.querySelector("input, select");
      setTimeout(() => {
        if (firstField) firstField.focus({ preventScroll: true });
      }, 160);
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");

      // Resume only the hero / VSL if playing and still on screen
      const hv = document.getElementById("heroVideo");
      if (hv && hv.dataset.wasPlaying) {
        const r = hv.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) hv.play().catch(() => {});
      }
      const vv = document.getElementById("vslVideo");
      if (vv && vv.dataset.wasPlaying) {
        const r = vv.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) vv.play().catch(() => {});
      }
      allVideos.forEach((v) => { delete v.dataset.wasPlaying; });

      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    document.querySelectorAll("[data-open-contact]").forEach((el) => {
      el.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
    });
    modal.querySelectorAll("[data-close-contact]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    /* Email automation — formsubmit.co relays to gamerrdlegnd@gmail.com.
       First submission triggers a one-time activation e-mail to the owner;
       after that every submission lands in the inbox. Falls back to the
       visitor's mail app (mailto) if the network request fails. */
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fd    = new FormData(form);
        const name  = String(fd.get("name")  || "").trim();
        const email = String(fd.get("email") || "").trim();

        if (!name || !email) {
          statusEl.textContent = "Please add your name and email so I can reply.";
          return;
        }

        submitBtn.disabled = true;
        statusEl.textContent = "Sending…";

        const payload = {
          name: name,
          email: email,
          contact: fd.get("contact") || "—",
          company: fd.get("company") || "—",
          budget:  fd.get("budget")  || "Not specified",
          rush_delivery: fd.get("rush") ? "Yes (under 10 days)" : "No",
          _subject: "New project inquiry — " + name,
          _template: "table",
          _captcha: "false"
        };

        try {
          const res = await fetch("https://formsubmit.co/ajax/gamerrdlegnd@gmail.com", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error("send failed");
          statusEl.textContent = "Sent — I'll get back to you soon.";
          form.reset();
        } catch (err) {
          statusEl.textContent = "Couldn't send — opening your mail app instead…";
          const bodyTxt = [
            "Name: " + name,
            "Email: " + email,
            "Contact: " + (fd.get("contact") || "—"),
            "Company/Domain: " + (fd.get("company") || "—"),
            "Budget: " + (fd.get("budget") || "—"),
            "Rush delivery: " + (fd.get("rush") ? "Yes" : "No")
          ].join("\n");
          window.location.href =
            "mailto:gamerrdlegnd@gmail.com" +
            "?subject=" + encodeURIComponent("New project inquiry — " + name) +
            "&body=" + encodeURIComponent(bodyTxt);
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  }

})();
