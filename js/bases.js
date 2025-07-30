// bases.js
document.addEventListener('DOMContentLoaded', () => {
  const lists = {
    'feed-main':    Array.from({ length: 15 }, (_, i) => `main${17 - i}`),
    'feed-builder': Array.from({ length:  8 }, (_, i) => `builder${10 - i}`),
    'feed-capital': [
      'capital','barbarian','wizard','lagoon',
      'quarry','dragon','workshop','skeleton','goblin'
    ]
  };

  function createCard(name) {
    const card = document.createElement('div');
    card.className = 'card';

    const imgW = document.createElement('div');
    imgW.className = 'image-wrapper';
    const img = document.createElement('img');
    img.src = `/images/bases/${name}.webp`;
    img.alt = name;
    img.style.pointerEvents = 'none';
    img.style.userSelect    = 'none';
    imgW.appendChild(img);

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = name;

    card.append(imgW, label);
    return card;
  }

  function initCarousel(feedId, items) {
    const track    = document.getElementById(feedId);
    const windowEl = track.closest('.carousel-window') || track.parentElement;

    // 1) Наполняем оригинальными карточками
    items.forEach(name => track.appendChild(createCard(name)));
    const originals = Array.from(track.children);
    const N         = originals.length;

    // 2) Клонируем N карточек в начало (в обратном order) и в конец (в прямом)
    originals.slice().reverse().forEach(c =>
      track.insertBefore(c.cloneNode(true), track.firstChild)
    );
    originals.forEach(c =>
      track.appendChild(c.cloneNode(true))
    );

    // 3) Вычисляем шаг (= ширина + gap) и общий цикл
    const gap   = parseInt(getComputedStyle(track).gap) || 0;
    const cardW = originals[0].offsetWidth;
    const step  = cardW + gap;
    const total = step * N;

    // 4) Сразу позиционируем на “оригиналах”
    windowEl.scrollLeft = total;

    // 5) Переменные для drag+inertia
    let isDragging   = false;
    let pointerId    = null;
    let startX       = 0;
    let scrollStart  = 0;
    let velocity     = 0;
    let lastTime     = 0;
    let lastPos      = 0;
    let rafId        = null;

    // 7) Маркеры wrap‑around
    function wrap() {
      if (windowEl.scrollLeft <= 0)          windowEl.scrollLeft += total;
      else if (windowEl.scrollLeft >= total*2) windowEl.scrollLeft -= total;
    }

    // 8) Обработчики pointer
    windowEl.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return; // тач — нативно скроллится
      isDragging   = true;
      pointerId    = e.pointerId;
      startX       = e.clientX;
      scrollStart  = windowEl.scrollLeft;
      lastTime     = e.timeStamp;
      lastPos      = e.clientX;
      velocity     = 0;
      cancelAnimationFrame(rafId);
      windowEl.setPointerCapture(pointerId);
      windowEl.classList.add('dragging');
      e.preventDefault();
    });

    windowEl.addEventListener('pointermove', e => {
      if (!isDragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      windowEl.scrollLeft = scrollStart - dx;
      // считаем мгновенную скорость px/ms
      const dt = e.timeStamp - lastTime || 1;
      velocity = (e.clientX - lastPos) / dt;
      lastTime = e.timeStamp;
      lastPos  = e.clientX;
      wrap();
    });

    windowEl.addEventListener('pointerup', e => {
      if (!isDragging || e.pointerId !== pointerId) return;
      isDragging = false;
      windowEl.releasePointerCapture(pointerId);
      windowEl.classList.remove('dragging');

      // немного уменьшаем стартовый импульс
      velocity *= 0.7;
      const decay = 0.92;
      const minV  = 0.02;

      function inertia() {
        if (Math.abs(velocity) > minV) {
          // двигаем на основе скорости
          windowEl.scrollLeft -= velocity * 16; // минус, чтобы направление совпало
          velocity *= decay;
          wrap();
          rafId = requestAnimationFrame(inertia);
        }
      }
      rafId = requestAnimationFrame(inertia);
    });

    // 9) Wrap для нативного scroll (тач / колёсико)
    windowEl.addEventListener('scroll', () => {
      if (isDragging) return;
      wrap();
    });

    // 10) Стрелки ←/→ без автоповтора
    windowEl.tabIndex = 0;
    windowEl.addEventListener('keydown', e => {
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.repeat) return;
      const dir = e.key === 'ArrowLeft' ? -1 : 1;
      windowEl.scrollBy({ left: dir * step, behavior: 'smooth' });
    });
  }

  Object.entries(lists).forEach(([id, arr]) => initCarousel(id, arr));
});
