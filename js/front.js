// Обработчик скролла для декоративных элементов
document.addEventListener('scroll', function() {
  const scrollY = window.scrollY;
  document.querySelectorAll('.decor').forEach(function(elem) {
    elem.style.transform = 'translateY(' + (scrollY * 0.1) + 'px)';
  });
});

// IntersectionObserver для появления элементов при прокрутке (для всех разрешений)
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

// Функция для сброса inline-стилей у слайсов
function resetSlices(card) {
  const slices = card.querySelectorAll('.slice');
  slices.forEach(slice => {
    // Удаляем все inline-стили, чтобы не накапливались изменения
    slice.removeAttribute('style');
    // Если у слайда есть обработчики, лучше заменить его клоном
    const clone = slice.cloneNode(true);
    slice.parentNode.replaceChild(clone, slice);
  });
}

// Основная функция перераспределения карточек в зависимости от ширины экрана
function applyCardLayout() {
  const screenWidth = window.innerWidth;
  const cards = document.querySelectorAll('.card.diagonal-slices');
  
  cards.forEach(card => {
    // Сбросим все ранее назначенные inline-стили и обработчики
    resetSlices(card);
    // После сброса получаем актуальный список слайсов
    const slices = card.querySelectorAll('.slice');
    if (slices.length < 4) return;
    
    // ===== Режим для экранов ≥ 1100px (оригинальный 1×4) =====
    if (screenWidth >= 1100) {
      const hoverOffset = 8;
      const initialClipPaths = [
        { tl: 0,    tr: 25.5, br: 20,   bl: 0   },
        { tl: 24.5, tr: 50.5, br: 45,   bl: 20  },
        { tl: 49.5, tr: 75.5, br: 70,   bl: 45  },
        { tl: 74.5, tr: 100,  br: 100,  bl: 70  }
      ];
      
      function setClipPath(sliceElem, cp) {
        sliceElem.style.clipPath = `polygon(${cp.tl}% 0%, ${cp.tr}% 0%, ${cp.br}% 100%, ${cp.bl}% 100%)`;
      }
      
      function getOffset(distance) {
        const scaleFactors = [1.2, 0.9, 0.7, 0.5];
        const index = Math.min(distance, scaleFactors.length - 1);
        return hoverOffset * scaleFactors[index];
      }
      
      function updateCardSlices(hoveredIndex) {
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
      
      function updateUniqueSliceLabels(hoveredIndex) {
        slices.forEach((slice, i) => {
          const label = slice.querySelector('.slice-label' + (i + 1));
          if (!label) return;
          if (i === hoveredIndex) {
            label.style.bottom = '0';
            label.style.opacity = '1';
            label.style.height = '50px';
          } else {
            label.style.bottom = '-30px';
            label.style.opacity = '0';
          }
        });
      }
      
      // Устанавливаем исходные clip-path и добавляем обработчики
      slices.forEach((slice, i) => {
        setClipPath(slice, initialClipPaths[i]);
        slice.addEventListener('mouseenter', () => {
          updateCardSlices(i);
          updateUniqueSliceLabels(i);
        });
      });
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
    }
// ===== Режим для экранов от 700 до 1099px (2×2) =====
else if (screenWidth >= 700 && screenWidth <= 1099) {
  const hoverOffset = 7;

  // Начальные clip-path для 4-х слайсов (2 строки по 2 слайда):
  // Строка 0: slice[0] (левый верх), slice[1] (правый верх)
  // Строка 1: slice[2] (левый низ),  slice[3] (правый низ)
  const initialClip = [
    'polygon(0 0, 55% 0, 50% 100%, 0% 100%)',    // slice 0
    'polygon(55% 0, 100% 0, 100% 100%, 50% 100%)', // slice 1
    'polygon(0 0, 50% 0, 45% 100%, 0% 100%)',      // slice 2
    'polygon(50% 0, 100% 0, 100% 100%, 45% 100%)'   // slice 3
  ];

  // Функция для сброса clip-path всех слайсов в исходное состояние
  function reset2x2(slices) {
    for (let i = 0; i < 4; i++) {
      slices[i].style.clipPath = initialClip[i];
    }
  }

  // Функция обновления clip-path для верхней строки (slice 0 и 1)
  function updateTopRow(slices, hoveredIndex) {
    if (hoveredIndex === 0) {
      // При наведении на левый верх (slice 0)
      slices[0].style.clipPath = 
        `polygon(0 0, ${55 + hoverOffset}% 0, ${50 + hoverOffset}% 100%, 0% 100%)`;
      slices[1].style.clipPath = 
        `polygon(${55 + hoverOffset}% 0, 100% 0, 100% 100%, ${50 + hoverOffset}% 100%)`;
    } else {
      // При наведении на правый верх (slice 1)
      slices[0].style.clipPath = 
        `polygon(0 0, ${55 - hoverOffset}% 0, ${50 - hoverOffset}% 100%, 0% 100%)`;
      slices[1].style.clipPath = 
        `polygon(${55 - hoverOffset}% 0, 100% 0, 100% 100%, ${50 - hoverOffset}% 100%)`;
    }
  }

  // Функция обновления clip-path для нижней строки (slice 2 и 3)
  function updateBottomRow(slices, hoveredIndex) {
    if (hoveredIndex === 2) {
      // При наведении на левый низ (slice 2)
      slices[2].style.clipPath =
        `polygon(0 0, ${50 + hoverOffset}% 0, ${45 + hoverOffset}% 100%, 0% 100%)`;
      slices[3].style.clipPath =
        `polygon(${50 + hoverOffset}% 0, 100% 0, 100% 100%, ${45 + hoverOffset}% 100%)`;
    } else {
      // При наведении на правый низ (slice 3)
      slices[2].style.clipPath =
        `polygon(0 0, ${50 - hoverOffset}% 0, ${45 - hoverOffset}% 100%, 0% 100%)`;
      slices[3].style.clipPath =
        `polygon(${50 - hoverOffset}% 0, 100% 0, 100% 100%, ${45 - hoverOffset}% 100%)`;
    }
  }

  // Получаем все слайды
  const slices = card.querySelectorAll('.slice');

  // Устанавливаем базовые стили для разбиения 2×2
  slices.forEach((slice, i) => {
    slice.style.position = 'absolute';
    slice.style.left = '0';
    slice.style.width = '100%';
    slice.style.height = '50%';
    slice.style.top = (i < 2 ? '0' : '50%');
    slice.style.clipPath = initialClip[i];
  });

  // Добавляем обработчики наведения для каждого слайда
  slices.forEach((slice, i) => {
    slice.addEventListener('mouseenter', () => {
      // Скрываем текст у всех слайсов
      slices.forEach((s, j) => {
        const lbl = s.querySelector('.slice-label' + (j + 1));
        if (lbl) {
          lbl.style.bottom = '-30px';
          lbl.style.opacity = '0';
        }
      });
      // Показываем label текущего слайда и задаем высоту 30px
      const label = slice.querySelector('.slice-label' + (i + 1));
      if (label) {
        label.style.bottom = '0';
        label.style.opacity = '1';
        label.style.height = '30px';
      }
      reset2x2(slices);
      if (i < 2) {
        updateTopRow(slices, i);
      } else {
        updateBottomRow(slices, i);
      }
    });
  });
    
  card.addEventListener('mouseleave', () => {
    reset2x2(slices);
    slices.forEach((slice, i) => {
      const label = slice.querySelector('.slice-label' + (i + 1));
      if (label) {
        label.style.bottom = '-30px';
        label.style.opacity = '0';
        label.style.height = ''; // сброс высоты (или можно задать другое значение по умолчанию)
      }
    });
  });  

  // При уходе курсора с карточки сбрасываем clip-path и скрываем все label
  card.addEventListener('mouseleave', () => {
    reset2x2(slices);
    slices.forEach((slice, i) => {
      const label = slice.querySelector('.slice-label' + (i + 1));
      if (label) {
        label.style.bottom = '-30px';
        label.style.opacity = '0';
      }
    });
  });
}

// ===== Режим для экранов ≤ 699px (вертикальное 1×4 без диагональных разделений) =====
    else {
      // Задаём исходное положение: каждый слайс занимает 25% высоты
      slices.forEach((slice, i) => {
        slice.style.position = 'absolute';
        slice.style.left = '0';
        slice.style.width = '100%';
        slice.style.height = '25%';
        slice.style.top = (i * 25) + '%';
        // Убираем любые clip-path
        slice.style.clipPath = 'none';
        // Добавляем плавную анимацию для высоты и top
        slice.style.transition = 'height 0.3s ease, top 0.3s ease';
      });
      
      // Функция для вертикального расширения слайсов при наведении с использованием scaleFactors
      function updateVerticalSlices(hoveredIndex) {
        const scaleFactors = [1.2, 0.9, 0.7, 0.5];
        const totalSlices = slices.length;
        let factors = [];
        let totalFactor = 0;
        for (let i = 0; i < totalSlices; i++) {
          const distance = Math.abs(i - hoveredIndex);
          const factor = scaleFactors[Math.min(distance, scaleFactors.length - 1)];
          factors[i] = factor;
          totalFactor += factor;
        }
        // Рассчитываем новую высоту для каждого слайда
        slices.forEach((slice, i) => {
          const newHeight = (factors[i] / totalFactor) * 100; // в %
          slice.style.height = newHeight + '%';
        });
        // Пересчитываем положение top для всех слайсов
        let currentTop = 0;
        slices.forEach(slice => {
          slice.style.top = currentTop + '%';
          currentTop += parseFloat(slice.style.height);
        });
        // Обновляем отображение label с нужной высотой
        slices.forEach((slice, i) => {
          const label = slice.querySelector('.slice-label' + (i + 1));
          if (label) {
            if (i === hoveredIndex) {
              label.style.bottom = '0';
              label.style.opacity = '1';
              label.style.height = '20px';
            } else {
              label.style.bottom = '-30px';
              label.style.opacity = '0';
            }
          }
        });
      }
        
      slices.forEach((slice, i) => {
        slice.addEventListener('mouseenter', () => {
          updateVerticalSlices(i);
        });
      });
        
      card.addEventListener('mouseleave', () => {
        slices.forEach((slice, i) => {
          slice.style.height = '25%';
          slice.style.top = (i * 25) + '%';
          const label = slice.querySelector('.slice-label' + (i + 1));
          if (label) {
            label.style.bottom = '-30px';
            label.style.opacity = '0';
            label.style.height = ''; // сброс высоты
          }
        });
      });
      
    }
  });
}

// Применяем раскладку при загрузке и при изменении размера окна
document.addEventListener('DOMContentLoaded', applyCardLayout);
window.addEventListener('resize', applyCardLayout);
