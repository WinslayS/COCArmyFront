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

const villagePageBtns = document.querySelectorAll(".btn-village-page");
villagePageBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetPage = btn.dataset.page;
    window.location.href = targetPage;
  });
});

let currentTH = null;

let currentTag = null;

let currentGeneralSubtags = [];
let currentSpell = null;
let currentInferno = null;

let currentSortKey = null;

const townHallBtns = document.querySelectorAll(".filter-townhall");
const tagBtns = document.querySelectorAll(".filter-tag");
const subtagBtns = document.querySelectorAll(".filter-subtag");
const sortBtns = document.querySelectorAll(".filter-sort");

townHallBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const clickedTH = btn.dataset.th;
    if (currentTH === clickedTH) {
      return;
    } else {
      townHallBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTH = clickedTH;
    }
    filterGallery();
  });
});
function updateSubtagDisplay() {
  const subtagGroups = document.querySelectorAll(".subtag-group");
  const subtagButtons = document.querySelectorAll(".filter-subtag");

  if (!currentTag) {
    subtagGroups.forEach((group) => (group.style.display = "flex"));
    subtagButtons.forEach((btn) => (btn.style.display = "inline-block"));
  } else if (currentTag === "war") {
    subtagGroups.forEach((group) => (group.style.display = "flex"));
    subtagButtons.forEach((btn) => {
      if (
        btn.dataset.subtag === "progress" &&
        btn.parentElement.classList.contains("general-subtags")
      ) {
        btn.style.display = "none";
      } else {
        btn.style.display = "inline-block";
      }
    });
  } else if (currentTag === "farm") {
    subtagGroups.forEach((group) => (group.style.display = "none"));
  } else if (currentTag === "decor") {
    subtagGroups.forEach((group) => {
      if (group.classList.contains("general-subtags")) {
        group.style.display = "flex";
      } else {
        group.style.display = "none";
      }
    });
    subtagButtons.forEach((btn) => {
      if (btn.dataset.subtag === "progress") {
        btn.style.display = "inline-block";
      } else {
        btn.style.display = "none";
      }
    });
  }
}

tagBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const clickedTag = btn.dataset.tag;
    if (currentTag === clickedTag) {
      currentTag = null;
      btn.classList.remove("active");
    } else {
      tagBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTag = clickedTag;
    }
    updateSubtagDisplay();
    filterGallery();
  });
});

subtagBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tag = btn.dataset.subtag;
    if (["rage", "poison", "invis"].includes(tag)) {
      if (currentSpell === tag) {
        currentSpell = null;
        btn.classList.remove("active");
      } else {
        if (currentSpell) {
          const oldBtn = document.querySelector(
            `.filter-subtag[data-subtag="${currentSpell}"]`
          );
          if (oldBtn) oldBtn.classList.remove("active");
        }
        currentSpell = tag;
        btn.classList.add("active");
      }
    } else if (["inferno-single", "inferno-multi"].includes(tag)) {
      if (currentInferno === tag) {
        currentInferno = null;
        btn.classList.remove("active");
      } else {
        if (currentInferno) {
          const oldBtn = document.querySelector(
            `.filter-subtag[data-subtag="${currentInferno}"]`
          );
          if (oldBtn) oldBtn.classList.remove("active");
        }
        currentInferno = tag;
        btn.classList.add("active");
      }
    } else {
      const isActive = btn.classList.contains("active");
      if (isActive) {
        btn.classList.remove("active");
        currentGeneralSubtags = currentGeneralSubtags.filter((t) => t !== tag);
      } else {
        btn.classList.add("active");
        currentGeneralSubtags.push(tag);
      }
    }
    filterGallery();
  });
});

sortBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const clickedSort = btn.dataset.sort;
    if (currentSortKey === clickedSort) {
      return;
    } else {
      sortBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentSortKey = clickedSort;
      applySort();
    }
  });
});

function filterGallery() {
  const items = document.querySelectorAll(".gallery .item");
  items.forEach((item) => {
    const itemTH = item.dataset.th;
    const itemTag = item.dataset.tag;
    const itemStags = (item.dataset.subtags || "").split(" ");

    let passTH = true;
    if (currentTH) {
      passTH = itemTH === currentTH;
    }
    let passTag = true;
    if (currentTag) {
      passTag = itemTag === currentTag;
    }
    let passSpell = true;
    if (currentSpell) {
      passSpell = itemStags.includes(currentSpell);
    }
    let passInferno = true;
    if (currentInferno) {
      passInferno = itemStags.includes(currentInferno);
    }
    let passGeneral = true;
    if (currentGeneralSubtags.length > 0) {
      passGeneral = currentGeneralSubtags.every((st) => itemStags.includes(st));
    }

    if (passTH && passTag && passSpell && passInferno && passGeneral) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}

function applySort() {
  if (!currentSortKey) return;
  const gallery = document.querySelector(".gallery");
  const arr = Array.from(gallery.querySelectorAll(".item"));
  arr.sort((a, b) => {
    if (currentSortKey === "last") {
      return +b.dataset.id - +a.dataset.id;
    } else if (currentSortKey === "views") {
      return (+b.dataset.views || 0) - (+a.dataset.views || 0);
    } else if (currentSortKey === "uploaded") {
      return (+b.dataset.uploaded || 0) - (+a.dataset.uploaded || 0);
    } else if (currentSortKey === "saved") {
      return (+b.dataset.saved || 0) - (+a.dataset.saved || 0);
    }
    return 0;
  });
  arr.forEach((i) => gallery.appendChild(i));
}
