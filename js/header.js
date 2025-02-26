document.addEventListener('DOMContentLoaded', function () {
  const headerTop = document.querySelector('.header-top');
  const dropdownMenuContainer = document.querySelector('.dropdown-menu');
  const dropdownLinks = document.querySelectorAll('.nav-menu .dropdown > a');
  const dropdownItems = document.querySelectorAll('.nav-menu li.dropdown');

  // Подменю для каждого раздела
  const submenus = {
    "bases.html": [
      { text: "Загрузить", href: "upload.html" },
      { text: "Расстановки", href: "layouts.html" }
    ],
    "mix.html": [
      { text: "Поиск", href: "search.html" },
      { text: "Создать", href: "create.html" },
      { text: "Смотреть", href: "view.html" }
    ],
    "advice.html": [
      { text: "Герои", href: "heroes.html" },
      { text: "Подкрепления", href: "reinforcements.html" },
      { text: "Атаки", href: "mistakes.html" },
      { text: "Строительство", href: "build.html" }
    ]
  };

  let currentPanel = null;      // текущая открытая панель
  let hideTimeout = null;       // таймер для запуска скрытия

  // Проверка, находится ли курсор в пределах разрешённых элементов (с запасом 20px)
  function isMouseOverAllowed(e) {
    const margin = 20;
    const allowedElements = Array.from(dropdownLinks);
    if (currentPanel) allowedElements.push(currentPanel);
    for (const el of allowedElements) {
      const rect = el.getBoundingClientRect();
      if (
        e.clientX >= rect.left - margin &&
        e.clientX <= rect.right + margin &&
        e.clientY >= rect.top - margin &&
        e.clientY <= rect.bottom + margin
      ) {
        return true;
      }
    }
    return false;
  }

  // Создание панели с подменю для выбранного раздела
  function createPanel(key) {
    const panel = document.createElement('div');
    panel.classList.add('dropdown-panel');
    panel.dataset.key = key;
    if (submenus[key]) {
      let html = '<ul>';
      submenus[key].forEach(item => {
        html += `<li><a href="${item.href}">${item.text}</a></li>`;
      });
      html += '</ul>';
      panel.innerHTML = html;
    }
    return panel;
  }

  // Открытие панели для выбранного пункта
  function showDropdown(key) {
    clearTimeout(hideTimeout);
    hideTimeout = null;

    // Если текущая панель уже запланирована к удалению – отменяем удаление
    if (currentPanel && currentPanel.dataset.closing === "true") {
      clearTimeout(currentPanel._closeTimer);
      currentPanel.classList.add('active');
      // Принудительный reflow для применения нового состояния
      currentPanel.offsetHeight;
      delete currentPanel.dataset.closing;
    }

    // Подсветка активного пункта
    dropdownItems.forEach(item => item.classList.remove('active'));
    dropdownLinks.forEach(link => {
      if (link.getAttribute('href') === key) {
        link.parentElement.classList.add('active');
      }
    });

    // Если панель для данного ключа уже существует – активируем её, иначе создаём новую
    let existingPanel = dropdownMenuContainer.querySelector(`.dropdown-panel[data-key="${key}"]`);
    if (existingPanel) {
      existingPanel.style.zIndex = 2;
      if (!existingPanel.classList.contains('active')) {
        existingPanel.offsetHeight;
        existingPanel.classList.add('active');
      }
      currentPanel = existingPanel;
    } else {
      const newPanel = createPanel(key);
      newPanel.style.zIndex = 2;
      dropdownMenuContainer.appendChild(newPanel);
      newPanel.offsetHeight;
      newPanel.classList.add('active');
      currentPanel = newPanel;
    }

    // Закрываем все панели, не соответствующие текущему разделу
    const panels = dropdownMenuContainer.querySelectorAll('.dropdown-panel');
    panels.forEach(panel => {
      if (panel.dataset.key !== key) {
        panel.style.zIndex = 1;
        panel.classList.remove('active'); // запускаем анимацию закрытия (scaleY: 1→0)
        panel.offsetHeight;
        panel.dataset.closing = "true";
        // Запланировать удаление панели через 450 мс (анимация 400 мс + небольшой запас)
        panel._closeTimer = setTimeout(() => {
          if (panel.dataset.closing === "true" && panel.parentNode === dropdownMenuContainer) {
            dropdownMenuContainer.removeChild(panel);
          }
        }, 450);
      }
    });
  }

  // Скрытие текущей панели (запускается анимация закрытия, а удаление – по таймеру)
  function hideDropdown() {
    clearTimeout(hideTimeout);
    hideTimeout = null;
    dropdownItems.forEach(item => item.classList.remove('active'));
    if (currentPanel) {
      const panelToHide = currentPanel;
      panelToHide.classList.remove('active');
      panelToHide.offsetHeight;
      panelToHide.dataset.closing = "true";
      panelToHide._closeTimer = setTimeout(() => {
        if (panelToHide.dataset.closing === "true" && panelToHide.parentNode === dropdownMenuContainer) {
          dropdownMenuContainer.removeChild(panelToHide);
        }
        if (currentPanel === panelToHide) {
          currentPanel = null;
        }
      }, 450);
    }
  }

  // Обработчики для ссылок с подменю
  dropdownLinks.forEach(link => {
    link.addEventListener('mouseenter', function () {
      const key = link.getAttribute('href');
      showDropdown(key);
    });
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768 || 'ontouchstart' in window) {
        e.preventDefault();
        const key = link.getAttribute('href');
        if (currentPanel && currentPanel.dataset.key === key) {
          hideDropdown();
        } else {
          showDropdown(key);
        }
      }
    });
  });

  // Обработка движения курсора по шапке
  headerTop.addEventListener('mousemove', function (e) {
    if (!isMouseOverAllowed(e)) {
      if (!hideTimeout) {
        hideTimeout = setTimeout(hideDropdown, 50);
      }
    } else {
      if (currentPanel && currentPanel.dataset.closing !== "true" && hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    }
  });

  // При уходе курсора за пределы шапки – запускаем скрытие через 50 мс
  headerTop.addEventListener('mouseleave', function () {
    hideTimeout = setTimeout(hideDropdown, 50);
  });
});


document.addEventListener("DOMContentLoaded", function () {
  const themeToggle = document.getElementById("theme-toggle");

  function setTheme(mode) {
    document.body.dataset.theme = mode;
    localStorage.setItem("theme", mode);
  }

  themeToggle.addEventListener("click", function () {
    const currentTheme = localStorage.getItem("theme") || "dark";
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });

  // Устанавливаем тему при загрузке страницы
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
});


document.addEventListener("DOMContentLoaded", function () {
  const langToggle = document.getElementById("language-toggle");

  function setLanguage(lang) {
    localStorage.setItem("language", lang);
    applyTranslations(lang);
  }

  function applyTranslations(lang) {
    fetch("/translations.json")
      .then(response => response.json())
      .then(data => {
        if (!data[lang]) return;

        document.documentElement.lang = lang;
        document.title = data[lang].title;

        document.querySelectorAll("[data-i18n]").forEach(element => {
          const key = element.getAttribute("data-i18n");
          if (data[lang][key]) {
            if (element.tagName === "IMG") {
              element.setAttribute("alt", data[lang][key]);
            } else {
              element.innerText = data[lang][key];
            }
          }
        });
      });
  }

  // Обработчик переключения языка
  langToggle.addEventListener("click", function () {
    const currentLang = localStorage.getItem("language") || "ru";
    const newLang = currentLang === "ru" ? "en" : "ru";
    setLanguage(newLang);
  });

  // Устанавливаем язык при загрузке
  const savedLang = localStorage.getItem("language") || navigator.language.slice(0, 2) || "ru";
  setLanguage(savedLang);
});

document.addEventListener('DOMContentLoaded', function() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mainNav = document.getElementById('mainNav');

  // Находим сами SVG: три полоски и крест
  const hamburgerLines = hamburgerBtn.querySelector('.hamburger-lines');
  const hamburgerClose = hamburgerBtn.querySelector('.hamburger-close');

  hamburgerBtn.addEventListener('click', () => {
    // Переключаем меню
    mainNav.classList.toggle('open');
    // Если меню открыто, показываем крестик, прячем полоски
    if (mainNav.classList.contains('open')) {
      hamburgerLines.style.display = 'none';
      hamburgerClose.style.display = 'block';
    } else {
      // Если меню закрыто, показываем полоски, прячем крестик
      hamburgerLines.style.display = 'block';
      hamburgerClose.style.display = 'none';
    }
  });
});

