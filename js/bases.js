document.addEventListener('DOMContentLoaded', function() {
  const categoryRadios = document.querySelectorAll('input[name="category"]');
  const levelSelect = document.getElementById('levelSelect');
  const publishBtn = document.getElementById('publishBtn');
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
  
  populateFeedByRange('feed-main', 4, 17, 'Main');
  
  populateFeedByRange('feed-builder', 4, 10, 'Builder');
  
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
  
  function initializeCarousel(carouselElement) {
    const track = carouselElement.querySelector('.carousel-track');
    let slides = Array.from(track.children);
    
    if (slides.length < 2) return;
    
    const firstSlide = slides[0];
    const slideStyle = getComputedStyle(firstSlide);
    const slideWidth = firstSlide.getBoundingClientRect().width + parseFloat(slideStyle.marginRight);
    
    const firstClone = slides[0].cloneNode(true);
    firstClone.id = 'firstClone';
    const lastClone = slides[slides.length - 1].cloneNode(true);
    lastClone.id = 'lastClone';
    
    track.insertBefore(lastClone, firstSlide);
    track.appendChild(firstClone);
    
    slides = Array.from(track.children);
    let currentIndex = 1;
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    
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
  
  const carouselMain = document.querySelector('#feed-main .carousel');
  const carouselBuilder = document.querySelector('#feed-builder .carousel');
  const carouselCapital = document.querySelector('#feed-capital .carousel');
  
  initializeCarousel(carouselMain);
  initializeCarousel(carouselBuilder);
  initializeCarousel(carouselCapital);
});
