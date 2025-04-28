// -------------------------------
// 1) Показ / скрытие панели
// -------------------------------
const filterPanelToggle = document.getElementById("filterPanelToggle");
const filterSection = document.querySelector(".filter-section");
const mainContainer = document.querySelector(".main-container");

const showFiltersButton = document.createElement("button");
showFiltersButton.id = "showFiltersButton";
showFiltersButton.textContent = "Filters";
showFiltersButton.classList.add("filter-toggle-button", "show-filters-button");
showFiltersButton.style.display = "none";
document.body.appendChild(showFiltersButton);

function openFilterPanel() {
  filterSection.classList.remove("hidden");
  filterSection.classList.add("show");
  mainContainer.classList.remove("fullscreen");
  filterPanelToggle.style.display = "block";
  showFiltersButton.style.display = "none";
}
function closeFilterPanel() {
  filterSection.classList.remove("show");
  filterSection.classList.add("hidden");
  mainContainer.classList.add("fullscreen");
  filterPanelToggle.style.display = "none";
  showFiltersButton.style.display = "block";
}

filterPanelToggle.addEventListener("click", () => {
  if (filterSection.classList.contains("show")) {
    closeFilterPanel();
  } else {
    openFilterPanel();
  }
});
showFiltersButton.addEventListener("click", () => {
  openFilterPanel();
});

// Адаптив
function updateFiltersState() {
  const screenWidth = window.innerWidth;
  const filtersHidden = filterSection.classList.contains("hidden");
  if (screenWidth <= 699) {
    if (!filtersHidden) closeFilterPanel();
  } else {
    if (filtersHidden) openFilterPanel();
  }
}
window.addEventListener("resize", updateFiltersState);
document.addEventListener("DOMContentLoaded", updateFiltersState);


// -------------------------------
// 2) ЛОГИКА КНОПОК (Main/Builder/Capital => переход)
// -------------------------------
const villagePageBtns = document.querySelectorAll(".btn-village-page");
villagePageBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const targetPage = btn.dataset.page;
    window.location.href = targetPage; // Переходим на другую страницу
  });
});


// -------------------------------
// 3) Переменные фильтров
// -------------------------------

// Town Hall (3..17) - один
let currentTH = null;

// Tags (war/farm/decor) - допустим, один (или несколько?)
let currentTag = null; 

// Subtags
let currentGeneralSubtags = []; // (anti2, anti3, progress) - много
let currentSpell = null;        // (rage/poison/invis) - один
let currentInferno = null;      // (inferno-single/multi) - один

// Sort
let currentSortKey = null;


// -------------------------------
// 4) Получаем кнопки, вешаем обработчики
// -------------------------------
const townHallBtns = document.querySelectorAll(".filter-townhall");
const tagBtns      = document.querySelectorAll(".filter-tag");
const subtagBtns   = document.querySelectorAll(".filter-subtag");
const sortBtns     = document.querySelectorAll(".filter-sort");

// --- Town Hall ---
townHallBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const clickedTH = btn.dataset.th;
    // Если уже выбран, то отменяем выбор
    if (currentTH === clickedTH) {
      // Если выбранный TH уже активен, ничего не делаем
      return;
    } else {
      townHallBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTH = clickedTH;
    }
    filterGallery();
  });
});
function updateSubtagDisplay() {
  // Получаем все группы сабтегов и кнопки
  const subtagGroups = document.querySelectorAll(".subtag-group");
  const subtagButtons = document.querySelectorAll(".filter-subtag");

  if (!currentTag) {
    // Если ни один тег не выбран, можно оставить видимыми все сабтеги
    subtagGroups.forEach(group => group.style.display = "flex");
    subtagButtons.forEach(btn => btn.style.display = "inline-block");
  } else if (currentTag === "war") {
    // Для войны – показываем всё как сейчас, но скрываем кнопку с data-subtag="progress" в группе general-subtags
    subtagGroups.forEach(group => group.style.display = "flex");
    subtagButtons.forEach(btn => {
      if (btn.dataset.subtag === "progress" && btn.parentElement.classList.contains("general-subtags")) {
        btn.style.display = "none";
      } else {
        btn.style.display = "inline-block";
      }
    });
  } else if (currentTag === "farm") {
    // Для фарма – скрываем все сабтеги
    subtagGroups.forEach(group => group.style.display = "none");
  } else if (currentTag === "decor") {
    // Для декора – показываем только сабтег Progress из группы general-subtags, остальные скрываем
    subtagGroups.forEach(group => {
      if (group.classList.contains("general-subtags")) {
        group.style.display = "flex";
      } else {
        group.style.display = "none";
      }
    });
    subtagButtons.forEach(btn => {
      if (btn.dataset.subtag === "progress") {
        btn.style.display = "inline-block";
      } else {
        btn.style.display = "none";
      }
    });
  }
}

// --- Tags (war/farm/decor) ---
tagBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const clickedTag = btn.dataset.tag;
    if (currentTag === clickedTag) {
      // Сброс
      currentTag = null;
      btn.classList.remove('active');
    } else {
      // Убираем active со всех и ставим для выбранного
      tagBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTag = clickedTag;
    }
    // Обновляем отображение сабтегов согласно выбранному тегу
    updateSubtagDisplay();
    filterGallery();
  });
});

// --- Subtags ---
subtagBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const tag = btn.dataset.subtag;
    // spells?
    if (["rage","poison","invis"].includes(tag)) {
      if (currentSpell === tag) {
        currentSpell = null;
        btn.classList.remove("active");
      } else {
        // сбрасываем старый
        if (currentSpell) {
          const oldBtn = document.querySelector(`.filter-subtag[data-subtag="${currentSpell}"]`);
          if (oldBtn) oldBtn.classList.remove("active");
        }
        currentSpell = tag;
        btn.classList.add("active");
      }
    }
    // inferno?
    else if (["inferno-single","inferno-multi"].includes(tag)) {
      if (currentInferno === tag) {
        currentInferno = null;
        btn.classList.remove("active");
      } else {
        // сбрасываем старый
        if (currentInferno) {
          const oldBtn = document.querySelector(`.filter-subtag[data-subtag="${currentInferno}"]`);
          if (oldBtn) oldBtn.classList.remove("active");
        }
        currentInferno = tag;
        btn.classList.add("active");
      }
    }
    // иначе general
    else {
      const isActive = btn.classList.contains("active");
      if (isActive) {
        // убираем
        btn.classList.remove("active");
        currentGeneralSubtags = currentGeneralSubtags.filter(t => t !== tag);
      } else {
        // добавляем
        btn.classList.add("active");
        currentGeneralSubtags.push(tag);
      }
    }
    filterGallery();
  });
});

// --- Sort ---
sortBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const clickedSort = btn.dataset.sort;
    if (currentSortKey === clickedSort) {
      // Если выбранный тип сортировки уже активен, ничего не делаем
      return;
    } else {
      sortBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSortKey = clickedSort;
      applySort();
    }
  });
});

// -------------------------------
// 5) Фильтрация
// -------------------------------
function filterGallery() {
  const items = document.querySelectorAll(".gallery .item");
  items.forEach(item => {
    // Допустим, вы при рендере пишете:
    // data-th="..."
    // data-tag="..." (war/farm/decor)
    // data-subtags="anti2 rage ..." (строка)
    const itemTH    = item.dataset.th;
    const itemTag   = item.dataset.tag;
    const itemStags = (item.dataset.subtags || "").split(" ");

    let passTH = true;
    if (currentTH) {
      passTH = (itemTH === currentTH);
    }
    let passTag = true;
    if (currentTag) {
      passTag = (itemTag === currentTag);
    }
    // spells
    let passSpell = true;
    if (currentSpell) {
      passSpell = itemStags.includes(currentSpell);
    }
    // inferno
    let passInferno = true;
    if (currentInferno) {
      passInferno = itemStags.includes(currentInferno);
    }
    // general
    let passGeneral = true;
    if (currentGeneralSubtags.length > 0) {
      passGeneral = currentGeneralSubtags.every(st => itemStags.includes(st));
    }

    if (passTH && passTag && passSpell && passInferno && passGeneral) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}

// -------------------------------
// 6) Сортировка
// -------------------------------
function applySort() {
  if (!currentSortKey) return;
  const gallery = document.querySelector(".gallery");
  const arr = Array.from(gallery.querySelectorAll(".item"));
  arr.sort((a,b) => {
    // например:
    if (currentSortKey === "last") {
      return +b.dataset.id - +a.dataset.id;
    } else if (currentSortKey === "views") {
      return (+b.dataset.views||0) - (+a.dataset.views||0);
    } else if (currentSortKey === "uploaded") {
      return (+b.dataset.uploaded||0) - (+a.dataset.uploaded||0);
    } else if (currentSortKey === "saved") {
      return (+b.dataset.saved||0) - (+a.dataset.saved||0);
    }
    return 0;
  });
  arr.forEach(i => gallery.appendChild(i));
}
