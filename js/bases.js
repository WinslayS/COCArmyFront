document.addEventListener('DOMContentLoaded', () => {
  // ==== 1) Логика выбора категории и уровней ====
  const categoryButtons = document.querySelectorAll('.category-btn');
  const levelSelect      = document.getElementById('levelSelect');
  const publishBtn       = document.getElementById('publishBtn');

  function populateLevels(category) {
    levelSelect.innerHTML = '';
    let start, end;

    if (category === 'основная') {
      start = 3; end = 17;
    } else if (category === 'строитель') {
      start = 4; end = 10;
    } else if (category === 'столица') {
      // для столицы — нет уровней
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '— нет уровней —';
      levelSelect.appendChild(opt);
      return;
    }

    for (let i = start; i <= end; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      levelSelect.appendChild(opt);
    }
  }

  // стартовая категория
  const activeBtn = document.querySelector('.category-btn.active');
  if (activeBtn) populateLevels(activeBtn.dataset.category);

  // переключение по клику
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      populateLevels(btn.dataset.category);
    });
  });

  publishBtn.addEventListener('click', e => {
    e.preventDefault();
    alert('Публикация отправлена!');
  });


  // ==== 2) Заполнение лент картинок ====
  function populateFeedByRange(feedId, start, end, prefix) {
    const track = document.querySelector(`#${feedId} .carousel-track`);
    track.innerHTML = '';

    for (let i = start; i <= end; i++) {
      const card = document.createElement('div');
      card.className = 'card';
      const img = document.createElement('img');
      img.src = `/images/bases/${prefix}${i}.webp`; 
      img.alt = `${prefix}${i}`;
      card.appendChild(img);
      track.appendChild(card);
    }
  }

  function populateFeedByNames(feedId, names) {
    const track = document.querySelector(`#${feedId} .carousel-track`);
    track.innerHTML = '';

    names.forEach(name => {
      const card = document.createElement('div');
      card.className = 'card';
      const img = document.createElement('img');
      img.src = `/images/bases/${name}.webp`;
      img.alt = name;
      card.appendChild(img);
      track.appendChild(card);
    });
  }

  // Основная (Main3.webp и т.д.)
  populateFeedByRange('feed-main', 3, 17, 'Main');
  // Строитель
  populateFeedByRange('feed-builder', 4, 10, 'Builder');
  // Столица
  populateFeedByNames('feed-capital', [
    'Capital','Barbarian','Wizard','Lagoon',
    'Quarry','Dragon','Workshop','Skeleton','Goblin'
  ]);
});
