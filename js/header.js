document.addEventListener('DOMContentLoaded', function () {
  const headerTop = document.querySelector('.header-top');
  const dropdownMenuContainer = document.querySelector('.dropdown-menu');
  const dropdownLinks = document.querySelectorAll('.nav-menu .dropdown > a');
  const dropdownItems = document.querySelectorAll('.nav-menu li.dropdown');

  const submenus = {
    "/pages/bases.html": [
      { text: "Основная", href: "/pages/base-main.html" },
      { text: "Строитель", href: "/pages/base-builder.html" },
      { text: "Столица", href: "/pages/base-capital.html" },
      { text: "Загрузить", href: "/pages/base-upload.html" }
    ],
    "/pages/armies.html": [
      { text: "Основная", href: "/pages/army-main.html" },
      { text: "Строитель", href: "/pages/army-builder.html" },
      { text: "Столица", href: "/pages/army-capital.html" }
    ],
    "/pages/advices.html": [
      { text: "Герои", href: "/pages/advice-heroes.html" },
      { text: "Подкрепления", href: "/pages/advice-reinforcements.html" },
      { text: "Атаки", href: "/pages/advice-armies.html" },
      { text: "Строительство", href: "/pages/advice-bases.html" },
      { text: "Осадные машины", href: "/pages/advice-machines.html" },
      { text: "Ресурсы", href: "/pages/advice-resources.html" }
    ],
  };
  
  let currentPanel = null;
  let hideTimeout = null;
  
// --- в самом верху вашего DOMContentLoaded ---
let isLoggedIn = false;
const profileContainer = document.querySelector('.profile-container');
const toggleBtn       = document.getElementById('profile-toggle');
const panelUl         = document.querySelector('.profile-panel ul');
const loginModal      = document.getElementById('login-modal');
const btnConfirmLogin = document.getElementById('confirm-login');
const btnCancelLogin  = document.getElementById('cancel-login');

// Функция перерисовки пункта меню профиля
function renderProfileMenu() {
  panelUl.innerHTML = '';  // очищаем

  if (!isLoggedIn) {
    // единственная кнопка "Войти"
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.id = 'login-btn';
    btn.textContent = 'Войти';
    btn.addEventListener('click', e => {
      e.stopPropagation();
      loginModal.classList.remove('hidden');
    });
    li.appendChild(btn);
    panelUl.appendChild(li);

  } else {
    // три пункта: Профиль, Настройки, Выйти
    const items = [
      { type: 'link', text: 'Профиль',   href: '/pages/profile.html' },
      { type: 'link', text: 'Настройки', href: '/pages/settings.html' },
      { type: 'btn',  text: 'Выйти',     id:   'logout-btn' }
    ];

    items.forEach(item => {
      const li = document.createElement('li');
      if (item.type === 'link') {
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.text;
        li.appendChild(a);
      } else {
        const btn = document.createElement('button');
        btn.id = item.id;
        btn.textContent = item.text;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          isLoggedIn = false;
          renderProfileMenu();
          profileContainer.classList.remove('active');
        });
        li.appendChild(btn);
      }
      panelUl.appendChild(li);
    });
  }
}

// Показываем/скрываем панель профиля
toggleBtn.addEventListener('click', e => {
  e.stopPropagation();
  profileContainer.classList.toggle('active');
});

// Клик вне — закрыть панель
document.addEventListener('click', () => {
  profileContainer.classList.remove('active');
});

// Обработчики модалки входа
btnConfirmLogin.addEventListener('click', () => {
  isLoggedIn = true;
  loginModal.classList.add('hidden');
  renderProfileMenu();
});
btnCancelLogin.addEventListener('click', () => {
  loginModal.classList.add('hidden');
});

// Инициализация
renderProfileMenu();

// --- внутри вашего DOMContentLoaded, после инициализации профиля ---

const langContainer = document.querySelector('.lang-container');
const langToggleBtn = document.getElementById('language-toggle');
const langPanel     = document.querySelector('.lang-panel');

// 1) по клику на иконку языка – показать/скрыть панель
langContainer.addEventListener('click', e => {
  e.stopPropagation();
  // при открытии панели языка можно закрыть профиль
  document.querySelector('.profile-container').classList.remove('active');
  langContainer.classList.toggle('active');
});

// 2) по клику в любом другом месте – прятать панель
document.addEventListener('click', () => {
  langContainer.classList.remove('active');
});

// 3) по клику на кнопку выбора языка внутри панели
langPanel.querySelectorAll('button[data-lang]').forEach(btn => {
  btn.addEventListener('click', e => {
    const newLang = btn.dataset.lang;    // "ru", "en" или "de"
    setLanguage(newLang);                // ваша функция из второго блока
    langContainer.classList.remove('active');
  });
});

// текущий язык (из localStorage или вариант по умолчанию)
let currentLang = localStorage.getItem('lang') || 'ru';
let translations = {};

// 1) Функция загрузки JSON‑файла через динамический import
async function loadTranslations(lang) {
  try {
    const res = await fetch(`/data/lang/${lang}.json`);
    if (!res.ok) throw new Error(res.statusText);
    translations = await res.json();
  } catch (err) {
    console.error(`Ошибка загрузки переводов для "${lang}":`, err);
    translations = {};  // на случай ошибки
  }
}

// 2) Утилита для получения перевода по ключу
function t(key) {
  return translations[key] ?? key;
}

// 3) Функция обхода DOM и вставки переводов
async function applyTranslations() {
  await loadTranslations(currentLang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // 3b) Если нужно перевести placeholder, title и пр.
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    // формат: data-i18n-attr="placeholder:input.name;title:button.save"
    el.dataset.i18nAttr
      .split(';')
      .forEach(pair => {
        const [attr, mapKey] = pair.split(':');
        if (attr && mapKey) el.setAttribute(attr, t(mapKey));
      });
  });
}

// 4a) Обработчик клика по выбору языка
document.querySelectorAll('button[data-lang]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const newLang = btn.dataset.lang;         // 'ru' или 'en'
    if (newLang === currentLang) return;
    currentLang = newLang;
    localStorage.setItem('lang', newLang);
    await applyTranslations();
    document.querySelector('.lang-container').classList.remove('active');
  });
});

// 4b) Вызвать первоначальный рендер при загрузке
window.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  // … ваша остальная инициализация (меню, профиль и т.д.)
});

function isMouseOverAllowed(e) {
  const margin = -20;

  for (const link of dropdownLinks) {
    const rect = link.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      return true;
    }
  }
  if (currentPanel) {
    const rect = currentPanel.getBoundingClientRect();
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

  document.addEventListener('mousemove', function (e) {
    if (isMouseOverAllowed(e)) {
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
        }, 150);
      }
    }
  });

  dropdownLinks.forEach(link => {
    link.addEventListener('mouseenter', function () {
      if (!window.matchMedia("(max-width:699px)").matches) {
        const key = link.getAttribute('href');
        showDropdown(key);
      }
    });
  
    link.addEventListener('click', function (e) {
      if (window.matchMedia("(max-width:699px)").matches) {
        e.preventDefault();
        const parentDropdown = link.parentElement;
        const submenu = parentDropdown.querySelector('.submenu');
        if (submenu) {
          if (!submenu.classList.contains('open')) {
            document.querySelectorAll('.nav-menu .dropdown').forEach(item => {
              if (item !== parentDropdown) {
                const otherSubmenu = item.querySelector('.submenu');
                if (otherSubmenu && otherSubmenu.classList.contains('open')) {
                  otherSubmenu.classList.remove('open');
                  item.classList.remove('open');
                }
              }
            });
            submenu.classList.add('open');
            parentDropdown.classList.add('open');
          } else {
            submenu.classList.remove('open');
            parentDropdown.classList.remove('open');
          }
        }
        if (currentPanel) {
          hideDropdown();
        }
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.body.dataset.theme = "dark";
  localStorage.setItem("theme", "dark");
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

  const savedLang = localStorage.getItem("language") || navigator.language.slice(0, 2) || "ru";
  setLanguage(savedLang);
});

const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');

hamburgerBtn.addEventListener('click', () => {
  const isMenuOpen = mainNav.classList.contains('open');
  mainNav.classList.toggle('open');
  hamburgerBtn.classList.toggle('open');

  if (window.matchMedia("(max-width:699px)").matches) {
    if (!isMenuOpen) {
      const overlay = document.createElement("div");
      overlay.classList.add("nav-overlay");
      overlay.addEventListener("click", () => {
        mainNav.classList.remove("open");
        hamburgerBtn.classList.remove("open");
        overlay.remove();
      });
      document.body.appendChild(overlay);
    } else {
      const overlay = document.querySelector(".nav-overlay");
      if (overlay) overlay.remove();
    }
  }

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
    document.querySelectorAll('.nav-menu .submenu.open, .nav-menu .dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  } else {
    mainNav.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    document.querySelectorAll('.nav-menu .submenu.open, .nav-menu .dropdown.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});
