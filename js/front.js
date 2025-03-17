document.addEventListener('scroll', function() {
  const scrollY = window.scrollY;
  document.querySelectorAll('.decor').forEach(function(elem) {
    elem.style.transform = 'translateY(' + (scrollY * 0.1) + 'px)';
  });
});

// Функция для создания наблюдателя
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('in-view');
      }, index * 100);
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.2
});

document.querySelectorAll('.card, .decor').forEach(elem => {
  observer.observe(elem);
});

document.addEventListener('DOMContentLoaded', function() {
  const hoverOffset = 8;
  
  // Исходные clip-path для каждого слайда
  const initialClipPaths = [
    { tl: 0,    tr: 25.5, br: 20,   bl: 0   },
    { tl: 24.5, tr: 50.5, br: 45,   bl: 20  },
    { tl: 49.5, tr: 75.5, br: 70,   bl: 45  },
    { tl: 74.5, tr: 100,  br: 100,  bl: 70  }
  ];

  function setClipPath(sliceElem, cp) {
    sliceElem.style.clipPath = 
      `polygon(${cp.tl}% 0%, ${cp.tr}% 0%, ${cp.br}% 100%, ${cp.bl}% 100%)`;
  }

  function getOffset(distance) {
    const scaleFactors = [1.2, 0.9, 0.7, 0.5];
    const index = Math.min(distance, scaleFactors.length - 1);
    return hoverOffset * scaleFactors[index];
  }

  function updateCardSlices(card, hoveredIndex) {
    const slices = card.querySelectorAll('.slice');
    slices.forEach((slice, i) => {
      let cp = { ...initialClipPaths[i] };
      const distance = Math.abs(i - hoveredIndex);
      const currentOffset = getOffset(distance);
      
      if (i === hoveredIndex) {
        cp.tl = Math.max(cp.tl - currentOffset, 0);
        cp.tr = Math.min(cp.tr + currentOffset, 100);
        cp.br = Math.min(cp.br + currentOffset, 100);
        cp.bl = Math.max(cp.bl - currentOffset, 0);
      } else if (i > hoveredIndex) {
        cp.tl = Math.min(cp.tl + currentOffset, 100);
        cp.tr = Math.min(cp.tr + currentOffset, 100);
        cp.br = Math.min(cp.br + currentOffset, 100);
        cp.bl = Math.min(cp.bl + currentOffset, 100);
      } else {
        cp.tl = Math.max(cp.tl - currentOffset, 0);
        cp.tr = Math.max(cp.tr - currentOffset, 0);
        cp.br = Math.max(cp.br - currentOffset, 0);
        cp.bl = Math.max(cp.bl - currentOffset, 0);
      }
      setClipPath(slice, cp);
    });
  }

  // Функция для обновления уникальных лейблов (прямоугольников) для каждого слайда
  function updateUniqueSliceLabels(card, hoveredIndex) {
    const slices = card.querySelectorAll('.slice');
    slices.forEach((slice, i) => {
      // Конструируем класс для лейбла, например, "slice-label1", "slice-label2", ...
      const label = slice.querySelector('.slice-label' + (i + 1));
      if (!label) return;
      
      if (i === hoveredIndex) {
        label.style.bottom = '0';
        label.style.opacity = '1';
        label.style.height = '50px'; // можно настроить высоту по вкусу
      } else {
        label.style.bottom = '-30px';
        label.style.opacity = '0';
      }
    });
  }

  // Обрабатываем каждую карточку с классом diagonal-slices
  const cards = document.querySelectorAll('.card.diagonal-slices');
  cards.forEach(card => {
    const slices = card.querySelectorAll('.slice');
    slices.forEach((slice, i) => {
      // Устанавливаем исходный clip-path для слайда
      setClipPath(slice, initialClipPaths[i]);

      // При наведении на слайс обновляем клип-путь и отображаем соответствующий лейбл
      slice.addEventListener('mouseenter', () => {
        updateCardSlices(card, i);
        updateUniqueSliceLabels(card, i);
      });
    });
    
    // При уходе курсора с карточки сбрасываем стили для всех слайсов и лейблов
    card.addEventListener('mouseleave', () => {
      slices.forEach((slice, i) => {
        setClipPath(slice, initialClipPaths[i]);
        const label = slice.querySelector('.slice-label' + (i + 1));
        if (label) {
          label.style.bottom = '-30px';
          label.style.opacity = '0';
          label.style.backgroundColor = 'transparent';
        }
      });
    });
  });
});
