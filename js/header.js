document.addEventListener('DOMContentLoaded', function () {
  const headerTop = document.querySelector('.header-top');
  const dropdownMenuContainer = document.querySelector('.dropdown-menu');
  const dropdownLinks = document.querySelectorAll('.nav-menu .dropdown > a');
  const dropdownItems = document.querySelectorAll('.nav-menu li.dropdown');

  // Список подменю для десктопной панели
  const submenus = {
    "/pages/bases.html": [
      { text: "Загрузить", href: "/pages/base-upload.html" },
      { text: "Основная", href: "/pages/base-main.html" },
      { text: "Строитель", href: "/pages/base-builder.html" },
      { text: "Столица", href: "/pages/base-capital.html" }
    ],
    "/pages/armies.html": [
      { text: "Создать", href: "/pages/army-create.html" },
      { text: "Основная", href: "/pages/army-main.html" },
      { text: "Строитель", href: "/pages/army-builder.html" },
      { text: "Столица", href: "/pages/army-capital.html" }
    ],
    "/pages/advices.html": [
      { text: "Герои", href: "/pages/advice-heroes.html" },
      { text: "Подкрепления", href: "/pages/advice-reinforcements.html" },
      { text: "Атаки", href: "/pages/advice-armies.html" },
      { text: "Строительство", href: "/pages/advice-bases.html" }
    ]
  };

  let currentPanel = null; // для десктопа
  let hideTimeout = null;

  // ======== Десктопная логика (hover) ========

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

  function showDropdown(key) {
    clearTimeout(hideTimeout);
    hideTimeout = null;

    if (currentPanel && currentPanel.dataset.closing === "true") {
      clearTimeout(currentPanel._closeTimer);
      currentPanel.classList.add('active');
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

    // Закрываем остальные панели
    const panels = dropdownMenuContainer.querySelectorAll('.dropdown-panel');
    panels.forEach(panel => {
      if (panel.dataset.key !== key) {
        panel.style.zIndex = 1;
        panel.classList.remove('active');
        panel.offsetHeight;
        panel.dataset.closing = "true";
        panel._closeTimer = setTimeout(() => {
          if (panel.dataset.closing === "true" && panel.parentNode === dropdownMenuContainer) {
            dropdownMenuContainer.removeChild(panel);
          }
        }, 450);
      }
    });
  }

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

  // Функция для планирования закрытия панели
  function scheduleClose(panel) {
    panel.dataset.closing = "true";
    panel._closeTimer = setTimeout(() => {
      if (panel.dataset.closing === "true" && panel.parentNode === dropdownMenuContainer) {
        dropdownMenuContainer.removeChild(panel);
      }
      if (currentPanel === panel) {
        currentPanel = null;
      }
    }, 450);
  }

  // ======== Обновлённый обработчик mousemove для десктопа ========
  document.addEventListener('mousemove', function (e) {
    if (isMouseOverAllowed(e)) {
      // Если курсор в допустимой зоне – отменяем запланированное закрытие
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      if (currentPanel && currentPanel.dataset.closing === "true") {
        clearTimeout(currentPanel._closeTimer);
        delete currentPanel.dataset.closing;
        currentPanel.classList.add('active');
      }
    } else {
      if (!hideTimeout) {
        hideTimeout = setTimeout(() => {
          if (currentPanel && !currentPanel.dataset.closing) {
            currentPanel.classList.remove('active');
            scheduleClose(currentPanel);
          }
          hideTimeout = null;
        }, 150); // задержка 150 мс для плавного закрытия
      }
    }
  });

  // ======== Мобильная логика (клик) ========
  dropdownLinks.forEach(link => {
    // Десктоп — hover
    link.addEventListener('mouseenter', function () {
      if (!window.matchMedia("(max-width:699px)").matches) {
        const key = link.getAttribute('href');
        showDropdown(key);
      }
    });
  
    // Мобильный — клик с закрытием остальных подменю
    link.addEventListener('click', function (e) {
      if (window.matchMedia("(max-width:699px)").matches) {
        e.preventDefault();
        const parentDropdown = link.parentElement;
        const submenu = parentDropdown.querySelector('.submenu');
        if (submenu) {
          if (!submenu.classList.contains('open')) {
            // Закрываем все открытые подменю, отличные от текущего
            document.querySelectorAll('.nav-menu .dropdown').forEach(item => {
              if (item !== parentDropdown) {
                const otherSubmenu = item.querySelector('.submenu');
                if (otherSubmenu && otherSubmenu.classList.contains('open')) {
                  otherSubmenu.classList.remove('open');
                  item.classList.remove('open');
                }
              }
            });
            // Открываем текущее подменю и добавляем класс для анимации стрелочки
            submenu.classList.add('open');
            parentDropdown.classList.add('open');
          } else {
            // Если уже открыто — закрываем
            submenu.classList.remove('open');
            parentDropdown.classList.remove('open');
          }
        }
        // Если открыта десктопная панель — закрываем её
        if (currentPanel) {
          hideDropdown();
        }
      }
    });
  });
});

// ==== Остальная часть (тема, язык, гамбургер) без изменений ====
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

  langToggle.addEventListener("click", function () {
    const currentLang = localStorage.getItem("language") || "ru";
    const newLang = currentLang === "ru" ? "en" : "ru";
    setLanguage(newLang);
  });

  const savedLang = localStorage.getItem("language") || navigator.language.slice(0, 2) || "ru";
  setLanguage(savedLang);
});

// ==== Гамбургер + сброс подменю ====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');

hamburgerBtn.addEventListener('click', () => {
  const isMenuOpen = mainNav.classList.contains('open');
  mainNav.classList.toggle('open');
  hamburgerBtn.classList.toggle('open');

  if (window.matchMedia("(max-width:699px)").matches) {
    if (!isMenuOpen) {
      // Меню открывается – добавляем overlay
      const overlay = document.createElement("div");
      overlay.classList.add("nav-overlay");
      overlay.addEventListener("click", () => {
        mainNav.classList.remove("open");
        hamburgerBtn.classList.remove("open");
        overlay.remove();
      });
      document.body.appendChild(overlay);
    } else {
      // Меню закрывается – удаляем overlay, если он есть
      const overlay = document.querySelector(".nav-overlay");
      if (overlay) overlay.remove();
    }
  }

  // Если меню закрывается на мобильном, сбрасываем открытые подменю
  if (isMenuOpen && window.matchMedia("(max-width:699px)").matches) {
    document.querySelectorAll('.nav-menu .submenu.open, .nav-menu .dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});

function disableTransitionTemporarily(el, duration = 50) {
  el.classList.add('no-transition');
  setTimeout(() => {
    el.classList.remove('no-transition');
  }, duration);
}

window.addEventListener('resize', () => {
  if (window.matchMedia("(max-width:699px)").matches) {
    disableTransitionTemporarily(mainNav, 50);
    mainNav.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    // Сбрасываем состояние всех открытых подменю и родительских .dropdown
    document.querySelectorAll('.nav-menu .submenu.open, .nav-menu .dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  } else {
    mainNav.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    // Также сбрасываем мобильные раскрытия при переходе на десктоп
    document.querySelectorAll('.nav-menu .submenu.open, .nav-menu .dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});
