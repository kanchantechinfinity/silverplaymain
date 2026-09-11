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
    var targets = $$("[data-reveal],[data-stagger],[data-split]", root || document);
    if (!targets.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
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
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
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
        });
      });
    });
  }

  /* --------------------------------------------------- cinematic hero */
  function initCineHero() {
    var root = $("[data-cinehero]");
    if (!root) return;
    var stage = $(".cinehero__stage", root);
    var video = $("video", root);
    var chapters = $$("[data-chapter]", root);
    var cue = $(".cinehero__cue", root);
    var trimEnd = parseFloat(root.getAttribute("data-trim-end")) || 0;

    if (reduced || !video) {
      chapters.forEach(function (c) { c.style.opacity = 0; });
      var first = chapters[0], last = chapters[chapters.length - 1];
      if (first) first.style.opacity = 1;
      if (last && last !== first) last.style.opacity = 1;
      return;
    }

    // Unlock frame decoding on iOS without ever showing motion.
    var p = video.play();
    if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});

    var duration = 0, target = 0, applied = -1, lastApplied = -1, cueHidden = false;
    var MIN_DELTA = 1 / 30;
    video.addEventListener("loadedmetadata", function () { duration = video.duration || 0; });

    function progress() {
      var rect = root.getBoundingClientRect();
      var travel = root.offsetHeight - window.innerHeight;
      if (travel <= 0) return 0;
      return clamp(-rect.top / travel, 0, 1);
    }
    function applyChapters(pct) {
      chapters.forEach(function (el) {
        var s = parseFloat(el.getAttribute("data-start"));
        var e = parseFloat(el.getAttribute("data-end"));
        var fade = Math.min(2.5, (e - s) / 3);
        var o = 0;
        if (pct >= s && pct <= e) o = clamp(Math.min((pct - s) / fade, (e - pct) / fade), 0, 1);
        el.style.opacity = o;
        el.style.transform = "translateY(" + (14 * (1 - o)) + "px) scale(" + (0.985 + 0.015 * o) + ")";
        el.style.filter = "blur(" + (6 * (1 - o)) + "px)";
        el.style.pointerEvents = o > 0.6 ? "auto" : "none";
      });
    }
    function tick() {
      requestAnimationFrame(tick);
      target = progress();
      applyChapters(target * 100);
      if (!cueHidden && target > 0.01 && cue) { cueHidden = true; cue.style.opacity = 0; }
      if (!duration || video.readyState < 2) return;
      var eff = trimEnd ? Math.min(duration, trimEnd) : duration;
      var tt = target * eff;
      applied = applied < 0 ? tt : applied + (tt - applied) * 0.3;
      if (Math.abs(applied - lastApplied) < MIN_DELTA) return;
      try { video.currentTime = applied; lastApplied = applied; } catch (err) {}
    }
    if (stage) requestAnimationFrame(tick);
  }

  /* ------------------------------------- Royal Simplicity scroll deck */
  function initDeck() {
    $$("[data-deck]").forEach(function (root) {
      var rail = $(".deck__rail", root);
      var cards = $$(".deck__card", rail);
      if (!cards.length) return;
      var last = Math.max(cards.length - 1, 1);
      var step = 0, cardW = 0;

      function measure() {
        var r = cards[0].getBoundingClientRect();
        cardW = r.width;
        var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 24;
        step = cardW + gap;
        rail.style.paddingLeft = "calc(50vw - " + (cardW / 2) + "px)";
      }
      function update() {
        var rect = root.getBoundingClientRect();
        var travel = root.offsetHeight - window.innerHeight;
        var p = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
        rail.style.transform = "translate3d(" + (-p * last * step) + "px,0,0)";
        var active = Math.round(p * last);
        cards.forEach(function (c, i) { c.classList.toggle("is-active", i === active); });
        root.dataset.active = active;
      }
      measure(); update();
      window.addEventListener("resize", function () { measure(); update(); }, { passive: true });
      window.addEventListener("scroll", update, { passive: true });

      function goTo(i) {
        var idx = clamp(i, 0, last);
        var travel = root.offsetHeight - window.innerHeight;
        window.scrollTo({ top: root.offsetTop + (idx / last) * travel, behavior: reduced ? "auto" : "smooth" });
      }
      cards.forEach(function (c, i) { c.addEventListener("click", function () { goTo(i); }); });
      var prev = $("[data-deck-prev]", root), next = $("[data-deck-next]", root);
      if (prev) prev.addEventListener("click", function () {
        var a = parseInt(root.dataset.active || 0, 10); goTo(a === 0 ? last : a - 1);
      });
      if (next) next.addEventListener("click", function () {
        var a = parseInt(root.dataset.active || 0, 10); goTo(a === last ? 0 : a + 1);
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

    // Tilt interaction
    var stage = $(".tilt-stage");
    if (stage) {
      var inner = $(".tilt-stage__inner", stage);
      var zoomed = false;
      stage.addEventListener("mousemove", function (e) {
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = "rotateX(" + (py * -18) + "deg) rotateY(" + (px * 22) + "deg) scale(" + (zoomed ? 1.6 : 1) + ")";
      });
      stage.addEventListener("mouseleave", function () {
        inner.style.transform = "scale(" + (zoomed ? 1.6 : 1) + ")";
      });
      stage.addEventListener("click", function (e) { e.stopPropagation(); zoomed = !zoomed; });
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
      $$("[data-modal].is-open, .cart-drawer.is-open, .mobile-nav.is-open, .shop__drawer.is-open").forEach(function (m) {
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
    if (drawer) {
      $$("[data-cart-close], .cart-drawer__scrim", drawer).forEach(function (b) {
        b.addEventListener("click", function () { drawer.classList.remove("is-open"); document.body.style.overflow = ""; });
      });
    }
    bindCartLines();

    document.addEventListener("submit", function (e) {
      var form = e.target.closest("form.product-form, [data-add-to-cart]");
      if (!form) return;
      e.preventDefault();
      var btn = $('[type="submit"]', form);
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Adding…"; }
      fetch("/cart/add.js", { method: "POST", body: new FormData(form) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
        .then(function (res) {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          if (!res.ok) { alert(res.json.description || res.json.message || "Could not add to bag."); return; }
          if (drawer) { drawer.classList.add("is-open"); document.body.style.overflow = "hidden"; }
          return refreshDrawer();
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
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

  /* ------------------------------------------------------------- boot */
  function boot() {
    initSplit();
    initReveal();
    initHeader();
    initMarquee();
    initTabs();
    initCineHero();
    initDeck();
    initArc();
    initFlip();
    initDisclosures();
    initDragRails();
    initElegance();
    initStones();
    initGallery();
    initModals();
    initQuickView();
    initWishlist();
    initWishlistPage();
    initRecentlyViewed();
    initCart();
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
