/* ==========================================================================
   Silver Play — theme.js
   Vanilla replacements for the Next.js source's React/Framer Motion/GSAP/
   Lenis behaviour. No dependencies, no build step.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  /* ---------------------------------------------------------------- money */
  var money = function (cents) {
    var f = (window.SilverPlay && window.SilverPlay.moneyFormat) || "₹{{amount_no_decimals}}";
    var amount = cents / 100;
    var noDec = Math.round(amount).toLocaleString("en-IN");
    var withDec = amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return f.replace(/\{\{\s*amount_no_decimals[^}]*\}\}/g, noDec)
            .replace(/\{\{\s*amount[^}]*\}\}/g, withDec);
  };

  /* ------------------------------------------------- scroll reveal engine */
  function initReveal(root) {
    window.__spRevealReady = true;
    var targets = $$("[data-reveal],[data-stagger],[data-split]", root || document);
    if (!targets.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        // intersectionRatio is visible area / the ELEMENT's area, so anything
        // taller than the viewport can never reach 0.15. Reveal those as soon
        // as they enter; keep the 15% trigger for normal-sized elements.
        var tall = e.boundingClientRect.height > window.innerHeight * 0.9;
        if (!tall && e.intersectionRatio < 0.15) return;
        var el = e.target;
        if (el.hasAttribute("data-stagger")) {
          var step = parseFloat(el.getAttribute("data-stagger")) || 0.09;
          Array.prototype.forEach.call(el.children, function (child, i) {
            child.style.transitionDelay = (i * step) + "s";
          });
        }
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: [0, 0.15], rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) {
      var d = el.getAttribute("data-delay");
      if (d) el.style.setProperty("--reveal-delay", d + "s");
      io.observe(el);
    });
  }

  /* --------------------------------------------- split text (word masks) */
  function initSplit(root) {
    $$("[data-split]", root || document).forEach(function (el) {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = "1";
      var text = el.textContent.trim();
      var by = el.getAttribute("data-split") === "char" ? "char" : "word";
      var units = by === "word" ? text.split(/\s+/) : Array.from(text);
      var step = by === "word" ? 0.075 : 0.028;
      var base = parseFloat(el.getAttribute("data-delay")) || 0;
      el.setAttribute("aria-label", text);
      var span = document.createElement("span");
      span.className = "split";
      span.setAttribute("aria-hidden", "true");
      units.forEach(function (u, i) {
        var mask = document.createElement("span");
        mask.className = "split__mask";
        var inner = document.createElement("span");
        inner.className = "split__unit";
        inner.textContent = by === "word" && i < units.length - 1 ? u + " " : u;
        inner.style.transitionDelay = (base + i * step) + "s";
        mask.appendChild(inner);
        span.appendChild(mask);
      });
      el.textContent = "";
      el.appendChild(span);
    });
  }

  /* ---------------------------------------------------- cinehero slider */
  function initCineheroSlider() {
    $$("[data-cinehero-slider]").forEach(function (root) {
      var slides = $$("[data-cinehero-slide]", root);
      if (slides.length < 2) return;
      var dotsWrap = $("[data-cinehero-dots]", root);
      var active = 0, timer;

      function setActive(i) {
        active = (i + slides.length) % slides.length;
        slides.forEach(function (s, j) { s.classList.toggle("is-active", j === active); });
        if (dots.length) dots.forEach(function (d, j) { d.classList.toggle("is-active", j === active); });
      }
      function next() { setActive(active + 1); }
      function restart() {
        clearInterval(timer);
        if (!reduced) timer = setInterval(next, 6000);
      }

      var dots = [];
      if (dotsWrap) {
        slides.forEach(function (_, i) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "cinehero__dot" + (i === 0 ? " is-active" : "");
          dot.setAttribute("aria-label", "Show slide " + (i + 1));
          dot.addEventListener("click", function () { setActive(i); restart(); });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        });
      }
      restart();
    });
  }

  /* ------------------------------------------------------------- header */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;
    var hasHero = !!$("[data-page-hero]");
    if (!hasHero) header.classList.add("header--nohero");

    function threshold() {
      var hero = $("[data-page-hero]");
      if (!hero) return 60;
      var r = hero.getBoundingClientRect();
      return r.top + window.scrollY + hero.offsetHeight - 1;
    }
    var t = threshold();
    function onScroll() { header.classList.toggle("is-pinned", window.scrollY > t); }
    function onResize() { t = threshold(); onScroll(); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    var drawer = $("[data-mobile-nav]");
    $$("[data-mobile-nav-open]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (drawer) { drawer.classList.add("is-open"); document.body.style.overflow = "hidden"; }
      });
    });
    $$("[data-mobile-nav-close]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (drawer) { drawer.classList.remove("is-open"); document.body.style.overflow = ""; }
      });
    });

    /* Nav items with a mega panel or dropdown: clicking the label toggles the
       panel (instead of navigating straight to its href), matching the
       hover-or-click pattern on vamas.in. Hover keeps working via CSS. */
    var panelItems = $$(".header__navitem").filter(function (item) {
      return $(".meganav", item) || $(".header__dropdown", item);
    });
    function closeAllPanels(except) {
      panelItems.forEach(function (item) {
        if (item !== except) item.classList.remove("is-open");
      });
    }
    panelItems.forEach(function (item) {
      var link = $(".header__link", item);
      if (!link) return;
      link.addEventListener("click", function (e) {
        /* Always opens — never toggles closed on a second click, matching
           the reference site: the only ways to close it are moving the
           cursor away or clicking outside. */
        e.preventDefault();
        closeAllPanels(item);
        item.classList.add("is-open");
      });
      /* A click only opens it — the mouse is already over the item at that
         point, so :hover is showing it too. Once the cursor actually leaves
         the item (trigger AND panel, since the panel is nested inside it in
         the DOM, hovering it doesn't count as "leaving"), drop the sticky
         class so it closes instead of staying open until an unrelated click
         elsewhere on the page. A short delay (cancelled if the pointer comes
         straight back) tolerates the real-world gap between the trigger link
         and the panel below it — without it, moving the mouse diagonally
         from the link down into the panel can clip a sliver of unrelated
         page in between and close the menu before it arrives. */
      /* Hover also sets is-open (not just click) so the panel is covered by
         the same sticky class + grace-timer as a click-open. Plain CSS
         :hover has no tolerance for the visual gap between the trigger link
         and the panel below it -- it unmatches the instant the cursor
         leaves the item's own box, closing the menu before it reaches the
         panel. Driving it through is-open instead means the panel stays
         open across that gap and only closes after the real mouseleave. */
      var closeTimer;
      item.addEventListener("mouseenter", function () {
        clearTimeout(closeTimer);
        item.classList.add("is-open");
      });
      item.addEventListener("mouseleave", function () {
        closeTimer = setTimeout(function () { item.classList.remove("is-open"); }, 200);
      });
    });
    document.addEventListener("click", function (e) {
      panelItems.forEach(function (item) {
        if (!item.contains(e.target)) item.classList.remove("is-open");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllPanels(null);
    });
  }

  /* ------------------------------------------------------------ marquee */
  function initMarquee() {
    $$("[data-marquee]").forEach(function (el) {
      var rail = $(".marquee__rail", el);
      var speed = parseFloat(el.getAttribute("data-marquee")) || 42;
      if (rail) rail.style.animationDuration = speed + "s";
    });
  }

  /* --------------------------------------------------------------- tabs */
  function initTabs() {
    $$("[data-tabs]").forEach(function (root) {
      var btns = $$("[data-tab-btn]", root);
      var panels = $$("[data-tab-panel]", root);
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-tab-btn");
          btns.forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
          panels.forEach(function (p) {
            var on = p.getAttribute("data-tab-panel") === key;
            p.hidden = !on;
            if (on) { p.classList.remove("is-in"); void p.offsetWidth; p.classList.add("is-in"); }
          });
          var label = $("[data-tab-label]", root);
          if (label) label.textContent = btn.textContent.trim();
          /* "Shop Now"-style CTA below the grid: no explicit link configured,
             so it should always point at whichever tab is currently showing
             (link AND label), not stay stuck on the first tab's collection
             while still reading "Shop New Arrivals" on every other tab. */
          var cta = $("[data-tab-cta]", root);
          var url = btn.getAttribute("data-tab-url");
          if (cta && url) cta.href = url;
          var ctaText = $("[data-tab-cta-text]", root);
          var ctaLabel = btn.getAttribute("data-tab-cta-label");
          if (ctaText && ctaLabel) ctaText.textContent = ctaLabel;
        });
      });
    });
  }

  /* --------------------------------------------------- cinematic hero */
  function initCineHero() {
    var root = $("[data-cinehero]");
    if (!root) return;
    var video = $("video", root);
    if (!video) return;

    if (reduced) {
      video.pause();
      return;
    }

    var p = video.play();
    if (p && p.then) p.catch(function () {});
  }

  /* ------------------------------------- Royal Simplicity card rail */
  function initDeck() {
    $$("[data-deck]").forEach(function (root) {
      var viewport = $(".deck__viewport", root);
      var rail = $(".deck__rail", root);
      var cards = $$(".deck__card", rail);
      if (!cards.length) return;
      var last = cards.length - 1;
      var setSize = parseInt(rail.dataset.setSize, 10) || cards.length;
      var sets = Math.round(cards.length / setSize);
      var loopable = sets >= 3 && setSize > 0;

      /* offsetLeft is pure layout (untouched by the active card's transform:
         scale), so — unlike getBoundingClientRect — it gives a step size that
         stays correct no matter which cards are currently scaled up/down. */
      function step() {
        if (cards.length < 2) return cards[0].offsetWidth;
        return cards[1].offsetLeft - cards[0].offsetLeft;
      }
      function center(i) { return cards[i].offsetLeft + cards[i].offsetWidth / 2; }
      function setActive(i) {
        cards.forEach(function (c, idx) { c.classList.toggle("is-active", idx === i); });
        root.dataset.active = i;
      }
      function scrollToIndex(i, smooth) {
        viewport.scrollTo({ left: center(i) - viewport.clientWidth / 2, behavior: smooth && !reduced ? "smooth" : "auto" });
      }

      /* Which card is "active" is decided ONLY once scrolling has settled
         (debounced below) by picking whichever card's centre is nearest the
         viewport's centre — never reactively while a scroll is in flight.
         An IntersectionObserver-based approach (tried earlier) fires
         continuously as ratios cross a threshold, and during a scroll two
         neighbouring cards can straddle that threshold back and forth,
         each crossing toggling is-active (and its scale/opacity
         transition) repeatedly — that rapid toggling was the card "shake".
         Settling once, after the fact, makes exactly one clean transition
         happen per scroll. */
      function nearestIndex() {
        var target = viewport.scrollLeft + viewport.clientWidth / 2;
        var best = 0, bestDist = Infinity;
        cards.forEach(function (c, idx) {
          var d = Math.abs(center(idx) - target);
          if (d < bestDist) { bestDist = d; best = idx; }
        });
        return best;
      }

      var manual = false;
      var manualTimer;
      function releaseManual() { manual = false; clearTimeout(manualTimer); }
      function goTo(i, smooth) {
        var idx = clamp(i, 0, last);
        manual = true;
        setActive(idx);
        scrollToIndex(idx, smooth);
        clearTimeout(manualTimer);
        manualTimer = setTimeout(releaseManual, 1200);
      }

      var startIdx = loopable ? setSize + Math.floor(setSize / 2) : 0;
      goTo(startIdx, false);

      var jumping = false;
      function settle() {
        if (jumping) return;
        var a = parseInt(root.dataset.active || 0, 10);
        if (loopable && (a < setSize || a >= setSize * 2)) {
          jumping = true;
          var delta = a < setSize ? setSize : -setSize;
          viewport.scrollLeft += delta * step();
          setActive(a + delta);
          requestAnimationFrame(function () { jumping = false; });
          return;
        }
        if (manual) return;
        setActive(nearestIndex());
      }
      var scrollTimer;
      viewport.addEventListener("scroll", function () {
        if (jumping) return;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(settle, 120);
      }, { passive: true });

      cards.forEach(function (c, i) {
        if (c.hasAttribute("aria-hidden")) return;
        c.addEventListener("click", function () { goTo(i, true); });
      });
      var prev = $("[data-deck-prev]", root), next = $("[data-deck-next]", root);
      if (prev) prev.addEventListener("click", function () {
        var a = parseInt(root.dataset.active || 0, 10); goTo(a - 1, true);
      });
      if (next) next.addEventListener("click", function () {
        var a = parseInt(root.dataset.active || 0, 10); goTo(a + 1, true);
      });
    });
  }

  /* ------------------------------------------- Journal showcase 3D arc */
  function initArc() {
    $$("[data-arc]").forEach(function (root) {
      var cards = $$(".arc__card", root);
      var n = cards.length;
      if (!n) return;
      var DEPTH = 160, ANGLE = 8, STEP_VW = 40, STEP_MAX = 480;
      var stepPx = Math.min(window.innerWidth * (STEP_VW / 100), STEP_MAX);
      window.addEventListener("resize", function () {
        stepPx = Math.min(window.innerWidth * (STEP_VW / 100), STEP_MAX);
      }, { passive: true });

      function ringOffset(i, p) { var raw = i - p; return raw - n * Math.round(raw / n); }
      function update() {
        var rect = root.getBoundingClientRect();
        var travel = root.offsetHeight - window.innerHeight;
        var prog = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
        var pos = prog * n;
        var active = ((Math.round(pos) % n) + n) % n;
        root.dataset.active = active;
        cards.forEach(function (card, i) {
          var o = ringOffset(i, pos);
          var scale = 1 - Math.min(Math.abs(o), 2) * 0.16;
          var opacity = Math.max(0, 1 - Math.min(Math.abs(o), 2.4) * 0.42);
          card.style.transform = "translateX(" + (o * stepPx) + "px) translateZ(" + (-Math.abs(o) * DEPTH) + "px) rotateY(" + (o * -ANGLE) + "deg) scale(" + scale + ")";
          card.style.opacity = opacity;
          card.style.zIndex = String(100 - Math.round(Math.abs(o) * 10));
          var link = $("a", card);
          if (link) { link.tabIndex = i === active ? 0 : -1; }
        });
      }
      update();
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update, { passive: true });

      function goTo(i) {
        var wrapped = ((i % n) + n) % n;
        var travel = root.offsetHeight - window.innerHeight;
        window.scrollTo({ top: root.offsetTop + (wrapped / n) * travel, behavior: reduced ? "auto" : "smooth" });
      }
      var prev = $("[data-arc-prev]", root), next = $("[data-arc-next]", root);
      if (prev) prev.addEventListener("click", function () { goTo(parseInt(root.dataset.active || 0, 10) - 1); });
      if (next) next.addEventListener("click", function () { goTo(parseInt(root.dataset.active || 0, 10) + 1); });
    });
  }

  /* ------------------------------------------------------- flip cards */
  function initFlip() {
    $$(".flipcard").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        card.classList.toggle("is-flipped");
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("is-flipped"); }
      });
    });
  }

  /* ------------------------------------------------------- FAQ / accordion */
  function initDisclosures() {
    $$("[data-faq-row]").forEach(function (row) {
      var btn = $("[data-faq-btn]", row);
      if (!btn) return;
      function open() { row.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); }
      function close() { row.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
      row.addEventListener("mouseenter", open);
      row.addEventListener("mouseleave", close);
      btn.addEventListener("click", function () {
        row.classList.contains("is-open") ? close() : open();
      });
      btn.addEventListener("focus", open);
    });
    $$("[data-accordion-row]").forEach(function (row) {
      var btn = $("[data-accordion-btn]", row);
      if (!btn) return;
      btn.addEventListener("click", function () {
        var on = row.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(on));
      });
    });
  }

  /* --------------------------------------------------- drag rails (x) */
  function initDragRails() {
    $$("[data-drag-rail]").forEach(function (rail) {
      var down = false, startX = 0, startScroll = 0, moved = false;
      var vp = rail.parentElement;
      vp.style.overflowX = "auto";
      rail.classList.add("drag-rail");
      rail.addEventListener("pointerdown", function (e) {
        down = true; moved = false; startX = e.clientX; startScroll = vp.scrollLeft;
        rail.classList.add("is-dragging");
      });
      window.addEventListener("pointerup", function () {
        down = false; rail.classList.remove("is-dragging");
        setTimeout(function () { moved = false; }, 0);
      });
      window.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        vp.scrollLeft = startScroll - dx;
      });
      rail.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    });
  }

  /* ---------------------------------------------------------- kavach */
  function initKavach() {
    $$("[data-kavach]").forEach(function (root) {
      var viewport = $("[data-kavach-viewport]", root);
      var rail = $("[data-kavach-rail]", root);
      var dotsWrap = $("[data-kavach-dots]", root);
      var picks = $$(".kavach__pick", rail);
      if (picks.length < 2) return;

      /* How many whole circles actually fit is measured from real layout
         (stride = one pick's width + gap) rather than assumed, and pages
         are scrolled by exactly pageSize * stride — never by clientWidth,
         which is rarely an exact multiple of the circle size and would
         leave a sliver of the next one showing. */
      var stride = picks[1].offsetLeft - picks[0].offsetLeft;
      /* Never show more than 6 at once, but still adapt down (never up) for
         a viewport too narrow to fit 6 -- capped either way at exactly
         pageSize * stride so no partial circle is ever in the box. */
      var fitCount = Math.max(1, Math.floor(viewport.clientWidth / stride));
      var pageSize = Math.min(6, fitCount);
      var pages = Math.ceil(picks.length / pageSize);
      if (pages < 2) { dotsWrap.innerHTML = ""; return; }
      var pageWidth = pageSize * stride;
      viewport.style.maxWidth = pageWidth + "px";
      viewport.style.marginInline = "auto";

      dotsWrap.innerHTML = "";
      var dots = [];
      for (var i = 0; i < pages; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "kavach__dot" + (i === 0 ? " is-active" : "");
        var from = i * pageSize + 1, to = Math.min((i + 1) * pageSize, picks.length);
        dot.setAttribute("aria-label", "Show picks " + from + " to " + to);
        (function (idx) { dot.addEventListener("click", function () { goTo(idx, true); }); })(i);
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
      function setActive(i) {
        dots.forEach(function (d, j) { d.classList.toggle("is-active", j === i); });
      }
      function goTo(i, smooth) {
        viewport.scrollTo({ left: i * pageWidth, behavior: smooth && !reduced ? "smooth" : "auto" });
        setActive(i);
      }
      var scrollTimer;
      viewport.addEventListener("scroll", function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          var page = clamp(Math.round(viewport.scrollLeft / pageWidth), 0, pages - 1);
          setActive(page);
        }, 120);
      }, { passive: true });
    });
  }

  /* ------------------------------------------- Effortless Elegance swap */
  function initElegance() {
    $$("[data-elegance]").forEach(function (root) {
      var thumbs = $$("[data-eleg-thumb]", root);
      var previews = $$("[data-eleg-preview]", root);
      thumbs.forEach(function (t, i) {
        function activate() {
          thumbs.forEach(function (x, j) { x.classList.toggle("is-active", i === j); });
          previews.forEach(function (p, j) { p.classList.toggle("is-active", i === j); });
        }
        t.addEventListener("mouseenter", activate);
        t.addEventListener("focus", activate);
      });
    });
  }

  /* -------------------------------------------------- stone explorer */
  function initStones() {
    $$("[data-stones]").forEach(function (root) {
      var thumbs = $$("[data-stone-thumb]", root);
      var panels = $$("[data-stone-panel]", root);
      thumbs.forEach(function (t) {
        function activate() {
          var h = t.getAttribute("data-stone-thumb");
          thumbs.forEach(function (x) {
            var on = x === t;
            x.classList.toggle("is-active", on);
            x.setAttribute("aria-pressed", String(on));
          });
          panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-stone-panel") === h); });
        }
        t.addEventListener("mouseenter", activate);
        t.addEventListener("focus", activate);
        t.addEventListener("click", activate);
      });
    });
  }

  /* --------------------------------------------------- product gallery */
  function initGallery() {
    $$("[data-gallery]").forEach(function (root) {
      var thumbs = $$("[data-gallery-thumb]", root);
      var slides = $$("[data-gallery-slide]", root);
      function show(i) {
        slides.forEach(function (s, j) { s.classList.toggle("is-active", i === j); });
        thumbs.forEach(function (t, j) { t.classList.toggle("is-active", i === j); });
        root.dataset.active = i;
      }
      thumbs.forEach(function (t, i) { t.addEventListener("click", function () { show(i); }); });
      show(0);

      /* Swipe / drag / keyboard through the slides. Thumbnails alone are a poor
         target on mobile, and horizontal drag is what a product gallery implies.
         Only acts on a mostly-horizontal gesture so vertical page scrolling and
         the sticky media column are never hijacked. */
      if (slides.length > 1) {
        var stage = $("[data-gallery-stage]", root) || $(".gallery__stage", root);
        if (stage) {
          var down = false, sx = 0, sy = 0, locked = false;
          var step = function (dir) {
            var i = parseInt(root.dataset.active || 0, 10) + dir;
            show(clamp(i, 0, slides.length - 1));
          };
          stage.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "mouse" && e.button !== 0) return;
            down = true; locked = false; sx = e.clientX; sy = e.clientY;
          });
          stage.addEventListener("pointermove", function (e) {
            if (!down || locked) return;
            var dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
            locked = true; down = false;
            step(dx < 0 ? 1 : -1);
          });
          window.addEventListener("pointerup", function () { down = false; });
          window.addEventListener("pointercancel", function () { down = false; });

          stage.setAttribute("tabindex", "0");
          stage.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
          });
        }
      }

      var open3d = $("[data-gallery-3d]", root);
      var modal = $("[data-tilt-modal]");
      if (open3d && modal) {
        open3d.addEventListener("click", function () {
          var i = parseInt(root.dataset.active || 0, 10);
          var src = slides[i] ? $("img", slides[i]).currentSrc || $("img", slides[i]).src : "";
          var img = $("img", modal);
          if (img) img.src = src;
          openModal(modal);
        });
      }
    });

    // Click-to-zoom interaction: click toggles a magnified view that pans
    // to follow the cursor, instead of the old 3D tilt/rotate effect.
    var stage = $(".tilt-stage");
    if (stage) {
      var inner = $(".tilt-stage__inner", stage);
      var zoomed = false;
      var ZOOM = 2.2;
      function pan(e) {
        if (!zoomed) return;
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = "scale(" + ZOOM + ") translate(" + (px * -100 / ZOOM) + "%, " + (py * -100 / ZOOM) + "%)";
      }
      stage.addEventListener("mousemove", pan);
      stage.addEventListener("mouseleave", function () {
        if (!zoomed) inner.style.transform = "scale(1)";
      });
      stage.addEventListener("click", function (e) {
        e.stopPropagation();
        zoomed = !zoomed;
        stage.classList.toggle("is-zoomed", zoomed);
        inner.style.transform = zoomed ? "scale(" + ZOOM + ")" : "scale(1)";
      });
    }
  }

  /* -------------------------------------------------------- modals */
  function openModal(m) { m.classList.add("is-open"); document.body.style.overflow = "hidden"; }
  function closeModal(m) { m.classList.remove("is-open"); document.body.style.overflow = ""; }
  function initModals() {
    $$("[data-modal]").forEach(function (m) {
      $$("[data-modal-close], .modal__scrim, .note-modal__scrim", m).forEach(function (b) {
        b.addEventListener("click", function () { closeModal(m); });
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      $$("[data-modal].is-open, .cart-drawer.is-open, .search-drawer.is-open, .mobile-nav.is-open, .shop__drawer.is-open").forEach(function (m) {
        m.classList.remove("is-open");
      });
      document.body.style.overflow = "";
    });
  }

  /* ----------------------------------------------------- quick view */
  function initQuickView() {
    var modal = $("[data-quickview]");
    if (!modal) return;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-quickview-open]");
      if (!btn) return;
      e.preventDefault(); e.stopPropagation();
      var url = btn.getAttribute("data-quickview-open");
      var body = $("[data-quickview-body]", modal);
      body.innerHTML = '<p class="lede" style="padding:2rem">Loading…</p>';
      openModal(modal);
      fetch(url + (url.indexOf("?") > -1 ? "&" : "?") + "view=quickview", { headers: { "X-Requested-With": "fetch" } })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          var frag = doc.querySelector("[data-quickview-content]");
          body.innerHTML = frag ? frag.innerHTML : html;
          initReveal(body); initSplit(body); initGallery();
        })
        .catch(function () { body.innerHTML = '<p class="lede" style="padding:2rem">Could not load this piece.</p>'; });
    });
  }

  /* --------------------------------------------------------- wishlist */
  var WISH_KEY = "sp_wishlist";
  function readStore(key) {
    try { var v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeStore(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function initWishlist() {
    var list = readStore(WISH_KEY);
    $$("[data-wishlist]").forEach(function (btn) {
      if (btn.dataset.wishBound) return; // avoid stacking duplicate listeners on repeat init calls
      btn.dataset.wishBound = "1";
      var h = btn.getAttribute("data-wishlist");
      btn.setAttribute("aria-pressed", String(list.indexOf(h) > -1));
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var cur = readStore(WISH_KEY);
        var i = cur.indexOf(h);
        if (i > -1) cur.splice(i, 1); else cur.push(h);
        writeStore(WISH_KEY, cur);
        btn.setAttribute("aria-pressed", String(i === -1));
      });
    });
  }

  /* ------------------------------------------------------ wishlist page */
  function initWishlistPage() {
    var grid = $("[data-wishlist-grid]");
    if (!grid) return;
    var empty = $("[data-wishlist-empty]");
    var handles = readStore(WISH_KEY);
    if (!handles.length) { if (empty) empty.hidden = false; return; }
    var done = 0;
    function settle() {
      done++;
      if (done === handles.length && !grid.children.length && empty) empty.hidden = false;
    }
    handles.forEach(function (h) {
      fetch("/products/" + h + "?view=card")
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (html) {
          if (html) {
            var wrap = document.createElement("div");
            wrap.innerHTML = html.trim();
            var card = wrap.firstElementChild;
            if (card) grid.appendChild(card);
          }
          settle();
        })
        .catch(settle);
    });
    // Unwishing a card while on this page should drop it from view immediately,
    // rather than requiring a reload — delegate so it also covers cards
    // appended above after the initial fetches resolve.
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-wishlist]");
      if (!btn) return;
      requestAnimationFrame(function () {
        if (btn.getAttribute("aria-pressed") === "false") {
          var card = btn.closest("[data-product-card]");
          if (card) card.remove();
          if (!grid.children.length && empty) empty.hidden = false;
        }
      });
    });
    initReveal(grid);
    initWishlist();
  }

  /* -------------------------------------------------- recently viewed */
  function initRecentlyViewed() {
    var KEY = "sp_recently_viewed", MAX = 12;
    var meta = $("[data-recently-viewed-current]");
    var holder = $("[data-recently-viewed]");
    var stored = readStore(KEY);
    if (holder) {
      var handles = stored.filter(function (h) { return !meta || h !== meta.getAttribute("data-recently-viewed-current"); }).slice(0, 5);
      if (handles.length) {
        holder.hidden = false;
        var grid = $("[data-recently-viewed-grid]", holder);
        handles.forEach(function (h) {
          fetch("/products/" + h + "?view=card")
            .then(function (r) { return r.ok ? r.text() : null; })
            .then(function (html) {
              if (!html) return;
              var wrap = document.createElement("div");
              wrap.innerHTML = html.trim();
              grid.appendChild(wrap.firstElementChild);
              initReveal(grid); initWishlist();
            }).catch(function () {});
        });
      }
    }
    if (meta) {
      var cur = meta.getAttribute("data-recently-viewed-current");
      var next = [cur].concat(stored.filter(function (h) { return h !== cur; })).slice(0, MAX);
      writeStore(KEY, next);
    }
  }

  /* ------------------------------------------------------ cart (AJAX) */
  function cartCountUpdate(count) {
    $$("[data-cart-count]").forEach(function (el) { el.textContent = count; });
  }
  function refreshDrawer() {
    var drawer = $("[data-cart-drawer]");
    if (!drawer) return Promise.resolve();
    return fetch("/?section_id=cart-drawer")
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var fresh = doc.querySelector("[data-cart-drawer-inner]");
        var target = $("[data-cart-drawer-inner]", drawer);
        if (fresh && target) target.innerHTML = fresh.innerHTML;
        var c = doc.querySelector("[data-cart-count]");
        if (c) cartCountUpdate(c.textContent.trim());
        bindCartLines();
        bindCartClose(drawer);
      });
  }
  function bindCartLines() {
    $$("[data-cart-change]").forEach(function (el) {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var line = el.getAttribute("data-line");
        var qty = el.getAttribute("data-cart-change");
        fetch("/cart/change.js", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ line: Number(line), quantity: Number(qty) })
        }).then(function () { refreshDrawer(); if (document.body.classList.contains("template-cart")) location.reload(); });
      });
    });
  }
  function bindCartClose(drawer) {
    // refreshDrawer() replaces [data-cart-drawer-inner]'s whole innerHTML
    // (to pull fresh totals) every time the cart opens, which destroys and
    // recreates the header's close button -- so this has to be re-run after
    // every refresh, not just once at boot, or the new button has no listener.
    $$("[data-cart-close], .cart-drawer__scrim", drawer).forEach(function (b) {
      if (b.dataset.closeBound) return;
      b.dataset.closeBound = "1";
      b.addEventListener("click", function () { drawer.classList.remove("is-open"); document.body.style.overflow = ""; });
    });
  }
  function initCart() {
    var drawer = $("[data-cart-drawer]");
    $$("[data-cart-open]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        if (!drawer) return;
        e.preventDefault();
        drawer.classList.add("is-open");
        document.body.style.overflow = "hidden";
        refreshDrawer();
      });
    });
    if (drawer) bindCartClose(drawer);
    bindCartLines();

    document.addEventListener("submit", function (e) {
      var form = e.target.closest("form.product-form, [data-add-to-cart]");
      if (!form) return;
      e.preventDefault();
      // e.submitter is which of the form's (possibly several) submit buttons
      // was actually clicked -- Add to Cart vs. Buy Now both submit the same
      // form, so this is how we tell them apart.
      var submitter = e.submitter || null;
      var buyNow = !!(submitter && submitter.hasAttribute("data-buy-now"));
      var btn = submitter && submitter.type === "submit" ? submitter : $('[type="submit"]', form);
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = buyNow ? "Redirecting…" : "Adding…"; }
      fetch("/cart/add.js", { method: "POST", body: new FormData(form) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
        .then(function (res) {
          if (!res.ok) {
            if (btn) { btn.disabled = false; btn.textContent = label; }
            alert(res.json.description || res.json.message || "Could not add to bag.");
            return;
          }
          if (buyNow) { window.location.href = "/checkout"; return; }
          if (btn) { btn.disabled = false; btn.textContent = label; }
          if (drawer) { drawer.classList.add("is-open"); document.body.style.overflow = "hidden"; }
          return refreshDrawer();
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          if (buyNow) { form.submit(); return; }
          form.submit();
        });
    });
  }

  /* ------------------------------------------------- variant selection */
  function initVariants() {
    $$("[data-variant-picker]").forEach(function (root) {
      var data = JSON.parse($("[data-variant-json]", root).textContent);
      var form = root.closest("form.product-form") || $("form.product-form") || $("[data-add-to-cart]");
      var idInput = form ? $('[name="id"]', form) : null;
      var priceEl = $("[data-variant-price]");
      var wasEl = $("[data-variant-compare]");
      var btn = form ? $('[type="submit"]', form) : null;

      function selected() {
        return $$('input[type="radio"]:checked', root).map(function (i) { return i.value; });
      }
      function update() {
        var opts = selected();
        var match = null;
        for (var i = 0; i < data.length; i++) {
          var v = data[i];
          var ok = true;
          for (var j = 0; j < opts.length; j++) { if (v.options[j] !== opts[j]) { ok = false; break; } }
          if (ok) { match = v; break; }
        }
        if (!match) return;
        if (idInput) idInput.value = match.id;
        if (priceEl) priceEl.textContent = money(match.price);
        if (wasEl) {
          if (match.compare_at_price && match.compare_at_price > match.price) {
            wasEl.textContent = money(match.compare_at_price); wasEl.hidden = false;
          } else { wasEl.hidden = true; }
        }
        if (btn) {
          btn.disabled = !match.available;
          btn.textContent = match.available ? btn.getAttribute("data-label-add") : btn.getAttribute("data-label-sold");
        }
        if (history.replaceState) {
          var url = new URL(window.location.href);
          url.searchParams.set("variant", match.id);
          history.replaceState({}, "", url.toString());
        }
      }
      $$('input[type="radio"]', root).forEach(function (i) { i.addEventListener("change", update); });
      update();
    });
  }

  /* ------------------------------------------------------ sort dropdown */
  function initSort() {
    $$("[data-sortmenu]").forEach(function (menu) {
      var btn = $("[data-sortmenu-btn]", menu);
      btn.addEventListener("click", function () { menu.classList.toggle("is-open"); });
      document.addEventListener("mousedown", function (e) {
        if (!menu.contains(e.target)) menu.classList.remove("is-open");
      });
    });
  }

  /* ------------------------------------------------------ shop filters */
  function initFilters() {
    var drawer = $("[data-filter-drawer]");
    $$("[data-filter-open]").forEach(function (b) {
      b.addEventListener("click", function () { if (drawer) drawer.classList.add("is-open"); });
    });
    $$("[data-filter-close], [data-filter-drawer] > .shop__drawer-scrim").forEach(function (b) {
      b.addEventListener("click", function () { if (drawer) drawer.classList.remove("is-open"); });
    });
    if (drawer) drawer.addEventListener("click", function (e) { if (e.target === drawer) drawer.classList.remove("is-open"); });

    $$("[data-filter-form]").forEach(function (form) {
      form.addEventListener("change", function () { form.submit(); });
      var range = $('input[type="range"]', form);
      if (range) {
        var out = $("[data-range-output]", form);
        range.addEventListener("input", function () {
          if (out) out.textContent = "₹" + Number(range.value).toLocaleString("en-IN");
        });
      }
    });
  }

  /* ------------------------------------------------------ note modal */
  function initNotes() {
    var modal = $("[data-note-modal]");
    if (!modal) return;
    $$("[data-note-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var q = btn.getAttribute("data-note-quote");
        var a = btn.getAttribute("data-note-by");
        $("[data-note-quote-out]", modal).textContent = "“" + q + "”";
        $("[data-note-by-out]", modal).textContent = a;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      });
    });
    $$("[data-note-close], .note-modal__scrim", modal).forEach(function (b) {
      b.addEventListener("click", function () { modal.classList.remove("is-open"); document.body.style.overflow = ""; });
    });
  }

  /* --------------------------------------------------- reel/video modal */
  function initReels() {
    var modal = $("[data-reel-modal]");
    if (!modal) return;
    var video = $("video", modal);
    $$("[data-reel-open]").forEach(function (b) {
      b.addEventListener("click", function () {
        openModal(modal);
        if (video) { try { video.currentTime = 0; video.play(); } catch (e) {} }
      });
    });
    $$("[data-modal-close], .modal__scrim", modal).forEach(function (b) {
      b.addEventListener("click", function () { if (video) video.pause(); });
    });
  }

  /* -------------------------------------------------------- PIN check */
  function initPin() {
    var root = $("[data-pincheck]");
    if (!root) return;
    var input = $("input", root), btn = $("button", root), out = $("[data-pin-out]", root);
    btn.addEventListener("click", function () {
      var v = (input.value || "").replace(/\D/g, "");
      if (v.length !== 6) { out.textContent = "Enter a 6-digit PIN code."; return; }
      out.textContent = "Estimated delivery to " + v + ": 5–7 business days. Dispatched within 2–3 days of order.";
    });
  }

  /* --------------------------------------------------------- gift note */
  function initGift() {
    $$("[data-gift-toggle]").forEach(function (cb) {
      var note = $("[data-gift-note]");
      cb.addEventListener("change", function () { if (note) note.hidden = !cb.checked; });
    });
  }


  /* ------------------------------------------------------ search drawer */
  function initSearchDrawer() {
    var drawer = $("[data-search-drawer]");
    if (!drawer) return;
    var input   = $("[data-search-input]", drawer);
    var results = $("[data-search-results]", drawer);
    var foot    = $("[data-search-foot]", drawer);
    var allLink = $("[data-search-all]", drawer);
    var hint    = results ? results.innerHTML : "";
    var base    = (window.SilverPlay && window.SilverPlay.routes && window.SilverPlay.routes.search) || "/search";
    var timer, lastQuery = "", controller;

    function open(e) {
      if (e) e.preventDefault();
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (input) setTimeout(function () { input.focus(); }, 120);
    }
    function close() {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    $$("[data-search-open]").forEach(function (b) { b.addEventListener("click", open); });
    $$("[data-search-close], .search-drawer__scrim", drawer).forEach(function (b) {
      b.addEventListener("click", close);
    });

    function esc(t) {
      return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function row(item, meta) {
      var img = item.featured_image && item.featured_image.url ? item.featured_image.url : (item.image || "");
      return '<a class="sresult" href="' + esc(item.url) + '">' +
        (img ? '<span class="sresult__img"><img src="' + esc(img) + '" alt="" loading="lazy"></span>' : "") +
        '<span><span class="sresult__title">' + esc(item.title) + "</span>" +
        (meta ? '<span class="sresult__meta">' + meta + "</span>" : "") +
        "</span></a>";
    }
    function group(label, items, metaFor) {
      if (!items || !items.length) return "";
      return '<div class="search-drawer__group"><p class="search-drawer__label">' + esc(label) + "</p>" +
             items.map(function (i) { return row(i, metaFor ? metaFor(i) : ""); }).join("") + "</div>";
    }

    /* Shopify's predictive search matches substrings/prefixes, not spelling
       -- "pandent" simply never matches "Pendant" server-side, no matter
       how many results are asked for. This corrects the query client-side
       against the store's own product vocabulary before searching, and
       merges results from both the typed and corrected query so a typo
       still surfaces every match a correct spelling would have. */
    var VOCAB = [
      "pendant", "pendants", "earring", "earrings", "necklace", "necklaces",
      "bracelet", "bracelets", "ring", "rings", "anklet", "anklets",
      "chain", "chains", "bali", "jhumka", "jhumkas", "hoop", "hoops",
      "rakhi", "kavach", "silver", "sterling", "gemstone", "gemstones",
      "stone", "stones", "collection", "collections", "wedding", "festive",
      "ganpati", "moonlight", "lakshmi", "shakti", "tiger", "eye", "agate",
      "pyrite", "garnet", "ruby", "emerald", "amethyst", "quartz", "druzy",
      "peacock", "feather", "butterfly", "flower", "floral", "vintage",
      "designer", "handmade", "oxidised", "oxidized", "jewellery", "jewelry"
    ];
    function editDistance(a, b) {
      var m = a.length, n = b.length;
      var d = [];
      for (var i = 0; i <= m; i++) d[i] = [i];
      for (var j = 0; j <= n; j++) d[0][j] = j;
      for (i = 1; i <= m; i++) {
        for (j = 1; j <= n; j++) {
          d[i][j] = a[i - 1] === b[j - 1]
            ? d[i - 1][j - 1]
            : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
        }
      }
      return d[m][n];
    }
    function correctQuery(q) {
      return q.split(/\s+/).map(function (token) {
        var lc = token.toLowerCase();
        if (lc.length < 3) return token;
        var exact = VOCAB.indexOf(lc) !== -1;
        if (exact) return token;
        var best = null, bestDist = Infinity;
        VOCAB.forEach(function (word) {
          if (Math.abs(word.length - lc.length) > 2) return;
          var dist = editDistance(lc, word);
          if (dist < bestDist) { bestDist = dist; best = word; }
        });
        var maxAllowed = lc.length <= 5 ? 1 : 2;
        return best && bestDist <= maxAllowed ? best : token;
      }).join(" ");
    }

    function render(data, q) {
      var r = (data && data.resources && data.resources.results) || {};
      var html = group("Products", r.products, function (p) {
            /* suggest.json's price is a decimal string in the shop's main
               currency unit (e.g. "24999.00"), not cents — money() expects
               cents, so it has to be scaled up first or it divides an
               already-whole-rupee price by 100 again. */
            return p.price ? money(Math.round(parseFloat(p.price) * 100)) : "";
          }) +
          group("Collections", r.collections) +
          group("Journal", r.articles) +
          group("Pages", r.pages);
      if (!html) {
        results.innerHTML = '<p class="search-drawer__hint">No results for &ldquo;' + esc(q) + '&rdquo;.</p>';
        if (foot) foot.hidden = true;
        return;
      }
      results.innerHTML = html;
      if (foot) foot.hidden = false;
      if (allLink) allLink.href = base + "?q=" + encodeURIComponent(q);
    }

    function suggest(q, signal) {
      var url = base + "/suggest.json?q=" + encodeURIComponent(q) +
                "&resources[type]=product,collection,article,page&resources[limit]=5" +
                "&resources[options][unavailable_products]=last";
      return fetch(url, signal ? { signal: signal } : undefined).then(function (res) { return res.json(); });
    }
    function mergeResults(a, b) {
      var ra = (a && a.resources && a.resources.results) || {};
      var rb = (b && b.resources && b.resources.results) || {};
      function merge(listA, listB) {
        var seen = {}, out = [];
        (listA || []).concat(listB || []).forEach(function (item) {
          if (!item || seen[item.url]) return;
          seen[item.url] = true;
          out.push(item);
        });
        return out;
      }
      return {
        resources: { results: {
          products: merge(ra.products, rb.products),
          collections: merge(ra.collections, rb.collections),
          articles: merge(ra.articles, rb.articles),
          pages: merge(ra.pages, rb.pages)
        } }
      };
    }
    function run(q) {
      if (controller) controller.abort();
      controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      var signal = controller ? controller.signal : undefined;
      var corrected = correctQuery(q);
      var requests = [suggest(q, signal)];
      if (corrected !== q) requests.push(suggest(corrected, signal));
      Promise.all(requests)
        .then(function (all) { render(all.length > 1 ? mergeResults(all[0], all[1]) : all[0], q); })
        .catch(function (err) {
          if (err && err.name === "AbortError") return;
          // network or endpoint failure: fall back to the full search page
          results.innerHTML = '<p class="search-drawer__hint">' +
            '<a class="link-cta" href="' + base + "?q=" + encodeURIComponent(q) + '">Search for &ldquo;' +
            esc(q) + '&rdquo; &rarr;</a></p>';
          if (foot) foot.hidden = true;
        });
    }

    if (input) {
      input.addEventListener("input", function () {
        var q = input.value.trim();
        if (q === lastQuery) return;
        lastQuery = q;
        clearTimeout(timer);
        if (q.length < 2) {
          results.innerHTML = hint;
          if (foot) foot.hidden = true;
          return;
        }
        timer = setTimeout(function () { run(q); }, 220);
      });
    }
  }

  /* ------------------------------------------------------------- boot */
  function boot() {
    initSplit();
    initReveal();
    initHeader();
    initCineheroSlider();
    initMarquee();
    initTabs();
    initCineHero();
    initDeck();
    initFlip();
    initArc();
    initDisclosures();
    initDragRails();
    initKavach();
    initElegance();
    initStones();
    initGallery();
    initModals();
    initQuickView();
    initWishlist();
    initWishlistPage();
    initRecentlyViewed();
    initCart();
    initSearchDrawer();
    initVariants();
    initSort();
    initFilters();
    initNotes();
    initReels();
    initPin();
    initGift();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Theme editor support
  document.addEventListener("shopify:section:load", function (e) {
    initSplit(e.target); initReveal(e.target); boot();
  });
})();
