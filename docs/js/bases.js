document.addEventListener("DOMContentLoaded", () => {
  const lists = {
    "feed-main": Array.from({ length: 15 }, (_, i) => `main${17 - i}`),
    "feed-builder": Array.from({ length: 8 }, (_, i) => `builder${10 - i}`),
    "feed-capital": [
      "capital",
      "barbarian",
      "wizard",
      "lagoon",
      "quarry",
      "dragon",
      "workshop",
      "skeleton",
      "goblin",
    ],
  };

  function createCard(name) {
    const card = document.createElement("div");
    card.className = "card";

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "image-wrapper";
    const img = document.createElement("img");
    img.src = `/images/bases/${name}.webp`;
    img.alt = name;
    img.style.pointerEvents = "none";
    imgWrapper.appendChild(img);

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = name;

    card.append(imgWrapper, label);
    return card;
  }

  function initCarousel(feedId, items) {
    const track = document.getElementById(feedId);
    const windowEl = track.parentElement;

    items.forEach((name) => track.appendChild(createCard(name)));
    const originals = Array.from(track.children);
    const N = originals.length;
    originals
      .slice()
      .reverse()
      .forEach((c) => track.insertBefore(c.cloneNode(true), track.firstChild));
    originals.forEach((c) => track.appendChild(c.cloneNode(true)));

    const gap = parseInt(getComputedStyle(track).gap) || 0;
    const cardW = originals[0].offsetWidth;
    const step = cardW + gap;
    const total = step * N;

    windowEl.scrollLeft = total;

    let lockAxis = null;
    let pointerId = null;
    let isDragging = false;
    let startX = 0,
      startY = 0,
      scrollStart = 0;
    let velocity = 0,
      lastTime = 0,
      lastPos = 0;
    let rafId;
    let wasHorizontal = false;

    windowEl.style.touchAction = "pan-y";

    function wrap() {
      if (windowEl.scrollLeft <= 0) windowEl.scrollLeft += total;
      else if (windowEl.scrollLeft >= total * 2) windowEl.scrollLeft -= total;
    }

    function animate() {
      if (!isDragging) return;
      wrap();
      rafId = requestAnimationFrame(animate);
    }

    function endDrag(e) {
      if (pointerId === null || e.pointerId !== pointerId) return;
      windowEl.releasePointerCapture(pointerId);
      windowEl.classList.remove("dragging");
      cancelAnimationFrame(rafId);
      pointerId = null;
      lockAxis = null;
      if (wasHorizontal) {
        let v = velocity * 0.7;
        const decay = 0.9,
          minV = 0.02;
        (function inertia() {
          if (Math.abs(v) > minV) {
            windowEl.scrollLeft -= v * 16;
            v *= decay;
            wrap();
            rafId = requestAnimationFrame(inertia);
          }
        })();
      }
      wasHorizontal = false;
      isDragging = false;
    }

    windowEl.addEventListener("pointerdown", (e) => {
      lockAxis = null;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      scrollStart = windowEl.scrollLeft;
      lastTime = e.timeStamp;
      lastPos = e.clientX;
      velocity = 0;
      wasHorizontal = false;
      isDragging = false;
      windowEl.setPointerCapture(pointerId);
    });

    windowEl.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!lockAxis) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
          lockAxis = "x";
          wasHorizontal = true;
          isDragging = true;
          windowEl.classList.add("dragging");
          cancelAnimationFrame(rafId);
          animate();
        } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          lockAxis = "y";
          windowEl.releasePointerCapture(pointerId);
          pointerId = null;
          return;
        } else {
          return;
        }
      }
      if (lockAxis === "x") {
        e.preventDefault();
        windowEl.scrollLeft = scrollStart - dx;
        const dt = e.timeStamp - lastTime || 1;
        velocity = (e.clientX - lastPos) / dt;
        lastTime = e.timeStamp;
        lastPos = e.clientX;
      }
    });

    windowEl.addEventListener("pointerup", endDrag);
    windowEl.addEventListener("pointercancel", endDrag);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);

    windowEl.addEventListener("scroll", () => {
      if (lockAxis === "x") return;
      wrap();
    });

    windowEl.tabIndex = 0;
    windowEl.addEventListener("keydown", (e) => {
      if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || e.repeat) return;
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      windowEl.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  }

  Object.entries(lists).forEach(([id, arr]) => initCarousel(id, arr));
});
