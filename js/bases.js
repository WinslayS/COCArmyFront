// bases.js
document.addEventListener('DOMContentLoaded', () => {
  // ваши списки
  const lists = {
    'feed-main':    Array.from({ length: 15 }, (_, i) => `main${17 - i}`),
    'feed-builder': Array.from({ length:  8 }, (_, i) => `builder${10 - i}`),
    'feed-capital': ['capital','barbarian','wizard','lagoon','quarry','dragon','workshop','skeleton','goblin']
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
    imgW.appendChild(img);
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = name;
    card.append(imgW, label);
    return card;
  }

  function initCarousel(feedId, items) {
    const track    = document.getElementById(feedId);
    const windowEl = track.parentElement;  // .carousel-window

    // 1) вставляем оригиналы и клонируем по кругу
    items.forEach(name => track.appendChild(createCard(name)));
    const orig = Array.from(track.children);
    const N    = orig.length;
    orig.slice().reverse().forEach(c => track.insertBefore(c.cloneNode(true), track.firstChild));
    orig.forEach(c => track.appendChild(c.cloneNode(true)));

    // 2) готовим размеры
    const gap   = parseInt(getComputedStyle(track).gap) || 0;
    const cardW = orig[0].offsetWidth;
    const step  = cardW + gap;
    const total = step * N;

    // 3) стартовая позиция
    let pos = total;
    track.style.transform = `translateX(${-pos}px)`;

    // 4) переменные для drag+inertia
    let isDown      = false;
    let startX      = 0;
    let basePos     = pos;
    let velocity    = 0;
    let lastTime    = 0;
    let lastPointer = 0;
    let rafId       = null;

    // 5) wrap‑around helper
    function wrap() {
      if (pos < 0)       pos += total;
      else if (pos > total*2) pos -= total;
    }

    // 6) анимация при перетягивании
    function animate() {
      wrap();
      track.style.transform = `translateX(${-pos}px)`;
      if (isDown) rafId = requestAnimationFrame(animate);
    }

    // 7) обработчики
    windowEl.addEventListener('pointerdown', e => {
      // любой указатель — мышь или тач
      isDown      = true;
      startX      = e.clientX;
      basePos     = pos;
      lastTime    = e.timeStamp;
      lastPointer = e.clientX;
      velocity    = 0;
      track.style.transition = 'none';
      windowEl.classList.add('dragging');
      rafId = requestAnimationFrame(animate);
      windowEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

windowEl.addEventListener('pointermove', e => {
  if (!isDown) return;
  const dx = e.clientX - startX;
  // инвертируем направление:
  pos = basePos - dx;

  // пересчёт мгновенной скорости: тоже инвертируем знак
  const dt = e.timeStamp - lastTime || 1;
  velocity = (lastPointer - e.clientX) / dt;
  lastTime    = e.timeStamp;
  lastPointer = e.clientX;
});


    windowEl.addEventListener('pointerup', e => {
      if (!isDown) return;
      isDown = false;
      windowEl.releasePointerCapture(e.pointerId);
      windowEl.classList.remove('dragging');
      cancelAnimationFrame(rafId);

      // уменьшаем стартовый импульс чуть сильнее
      velocity *= 0.5;

      // параметры инерции
      const decay = 0.8;
      const minV  = 0.02;

      // плавная инерция
      function inertiaStep() {
        if (Math.abs(velocity) > minV) {
          pos += velocity * 16;    // 16ms ~ 1 кадр
          velocity *= decay;
          wrap();
          track.style.transition = 'none';
          track.style.transform  = `translateX(${-pos}px)`;
          rafId = requestAnimationFrame(inertiaStep);
        } else {
          // выровнять к ближайшей карточке (опционально)
          const snapTo = Math.round(pos / step) * step;
          track.style.transition = 'transform 0.3s ease';
          pos = snapTo;
          wrap();
          track.style.transform = `translateX(${-pos}px)`;
        }
      }
      rafId = requestAnimationFrame(inertiaStep);
    });

    // 8) клавиши без автоповтора
    windowEl.tabIndex = 0;
windowEl.addEventListener('keydown', e => {
  if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.repeat) return;
  const dir = e.key === 'ArrowLeft' ? -1 : 1;
  // было pos += dir * step
  pos -= dir * step;      // инвертируем знак
  wrap();
  track.style.transition = 'transform 0.3s ease';
  track.style.transform  = `translateX(${-pos}px)`;
});
  }

  // 9) инициализируем
  Object.entries(lists).forEach(([id, arr]) => initCarousel(id, arr));
});
