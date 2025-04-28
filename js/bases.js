document.addEventListener('DOMContentLoaded', function() {
  const categoryRadios = document.querySelectorAll('input[name="category"]');
  const levelSelect = document.getElementById('levelSelect');
  const publishBtn = document.getElementById('publishBtn');

  // --- 1. Логика выбора уровней для "основная" и "строитель"
  function populateLevels(category) {
    let start, end;
    if (category === 'основная') {
      start = 4;
      end = 17;
    } else if (category === 'строитель') {
      start = 4;
      end = 10;
    } else if (category === 'столица') {
      levelSelect.innerHTML = '';
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '— нет уровней —';
      levelSelect.appendChild(option);
      return;
    }
    levelSelect.innerHTML = '';
    for (let i = start; i <= end; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      levelSelect.appendChild(option);
    }
  }
  
  const defaultCategory = document.querySelector('input[name="category"]:checked').value;
  populateLevels(defaultCategory);
  
  categoryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      populateLevels(radio.value);
    });
  });
  
  publishBtn.addEventListener('click', function(event) {
    event.preventDefault();
    alert('Публикация отправлена!');
  });
  
  // --- 2. Функции заполнения ленты изображений в каруселях
  function populateFeedByRange(feedId, start, end, prefix) {
    const track = document.querySelector(`#${feedId} .carousel-track`);
    track.innerHTML = '';
    for (let i = start; i <= end; i++) {
      const img = document.createElement('img');
      img.src = `/images/bases/${prefix}${i}.webp`;
      img.alt = `${prefix}${i}`;
      track.appendChild(img);
    }
  }
  
  function populateFeedByNames(feedId, namesArray) {
    const track = document.querySelector(`#${feedId} .carousel-track`);
    track.innerHTML = '';
    namesArray.forEach(name => {
      const img = document.createElement('img');
      img.src = `/images/bases/${name}.webp`;
      img.alt = name;
      track.appendChild(img);
    });
  }
  
  // Заполняем ленты:
  //  - Основная: Main4.webp ... Main17.webp
  populateFeedByRange('feed-main', 4, 17, 'Main');
  
  //  - Строитель: Builder4.webp ... Builder10.webp
  populateFeedByRange('feed-builder', 4, 10, 'Builder');
  
  //  - Столица: уникальные имена файлов
  const capitalNames = [
    'Capital',
    'Barbarian',
    'Wizard',
    'Lagoon',
    'Quarry',
    'Dragon',
    'Workshop',
    'Skeleton',
    'Goblin'
  ];
  populateFeedByNames('feed-capital', capitalNames);
  
  // --- 3. Инициализация бесконечной карусели для каждого блока
  function initializeCarousel(carouselElement) {
    const track = carouselElement.querySelector('.carousel-track');
    let slides = Array.from(track.children);
    
    // Если слайдов мало, пропускаем инициализацию
    if (slides.length < 2) return;
    
    // Вычисляем ширину слайда (с учётом margin-right)
    const firstSlide = slides[0];
    const slideStyle = getComputedStyle(firstSlide);
    const slideWidth = firstSlide.getBoundingClientRect().width + parseFloat(slideStyle.marginRight);
    
    // Клонируем первый и последний слайды
    const firstClone = slides[0].cloneNode(true);
    firstClone.id = 'firstClone';
    const lastClone = slides[slides.length - 1].cloneNode(true);
    lastClone.id = 'lastClone';
    
    track.insertBefore(lastClone, firstSlide);
    track.appendChild(firstClone);
    
    // Обновляем список слайдов и устанавливаем стартовый индекс
    slides = Array.from(track.children);
    let currentIndex = 1;
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    
    // Обработчики для стрелок
    const leftArrow = carouselElement.querySelector('.arrow.left');
    const rightArrow = carouselElement.querySelector('.arrow.right');
    
    leftArrow.addEventListener('click', () => {
      if (currentIndex <= 0) return;
      currentIndex--;
      track.style.transition = 'transform 0.5s ease';
      track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    });
    
    rightArrow.addEventListener('click', () => {
      if (currentIndex >= slides.length - 1) return;
      currentIndex++;
      track.style.transition = 'transform 0.5s ease';
      track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    });
    
    // При окончании перехода (transitionend) проверяем, если мы на клонах — мгновенно перепрыгиваем к оригиналу
    track.addEventListener('transitionend', () => {
      slides = Array.from(track.children);
      if (slides[currentIndex].id === 'lastClone') {
        track.style.transition = 'none';
        currentIndex = slides.length - 2;
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      }
      if (slides[currentIndex].id === 'firstClone') {
        track.style.transition = 'none';
        currentIndex = 1;
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      }
    });
  }
  
  // Инициализируем карусели для всех блоков
  const carouselMain = document.querySelector('#feed-main .carousel');
  const carouselBuilder = document.querySelector('#feed-builder .carousel');
  const carouselCapital = document.querySelector('#feed-capital .carousel');
  
  initializeCarousel(carouselMain);
  initializeCarousel(carouselBuilder);
  initializeCarousel(carouselCapital);
});
