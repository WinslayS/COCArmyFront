document.addEventListener("DOMContentLoaded", () => {
  fetch("/data/layouts.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = "";
      data.forEach((item) => {
        const subtagString = Array.isArray(item.subtags)
          ? item.subtags.join(" ")
          : "";
        const newLabelHTML =
          item.status === "new" ? `<span class="new-label">новая</span>` : "";
        const defaultVillageBtn = document.querySelector(
          ".village-links .btn-village-page[data-page='/pages/base-main.html']"
        );
        if (defaultVillageBtn) {
          defaultVillageBtn.classList.add("active");
        }

        if (!currentTH) {
          currentTH = "17";
          const defaultTHBtn = document.querySelector(
            `.filter-townhall[data-th="17"]`
          );
          if (defaultTHBtn) {
            defaultTHBtn.classList.add("active");
          }
        }

        if (!currentSortKey) {
          currentSortKey = "last";
          const defaultSortBtn = document.querySelector(
            `.filter-sort[data-sort="last"]`
          );
          if (defaultSortBtn) {
            defaultSortBtn.classList.add("active");
          }
        }

        const tagHTML = item.tag
          ? `<span class="mini-subtag">${item.tag}</span>`
          : "";
        const subtagHTML = Array.isArray(item.subtags)
          ? item.subtags
              .slice(0, 3)
              .map((subtag) => `<span class="mini-subtag">${subtag}</span>`)
              .join("")
          : "";
        const html = `
            <div class="item"
                 data-id="${item.id}"
                 data-th="${item.th || ""}"
                 data-tag="${item.tag || ""}"
                 data-subtags="${subtagString}"
                 data-views="${item.views || 0}"
                 data-uploaded="${item.uploaded || 0}"
                 data-saved="${item.saved || 0}"
                 data-link="${item.link || ""}">
              <div class="img-wrapper">
                <div class="top-info">
                  ${newLabelHTML}
                  <button class="bookmark-button" title="Закладки">
                    <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#e3e3e3">
                      <path d="M200-120v-665q0-24 18-42t42-18h440q24 0 42 18t18 42v665L480-240 200-120Zm60-91 220-93 220 93v-574H260v574Z"/>
                    </svg>
                  </button>
                </div>
                <img
                  src="${item.thumbnail}"
                  alt="Расстановка ${item.id}"
                  class="zoomable"
                  data-id="${item.id}"
                  data-full-image="${item.fullImage || ""}">
  
                <div class="hover-overlay">
                  <div class="hover-icons">
                    <button class="icon open" title="Открыть">
                      <svg xmlns="http://www.w3.org/2000/svg" height="64px" viewBox="0 -960 960 960" width="64px" fill="#e3e3e3">
                        <path d="m480-165 88-88 43 42L480-80 349-211l43-42 88 88ZM165-480l88 88-42 43L80-480l131-131 42 43-88 88Zm630 0-88-88 42-43 131 131-131 131-42-43 88-88ZM480-795l-88 88-43-42 131-131 131 131-43 42-88-88Z"/>
                      </svg>
                    </button>
                    <button class="icon download" title="Загрузить">
<svg xmlns="http://www.w3.org/2000/svg" height="64px" viewBox="0 -960 960 960" width="64px" fill="#e3e3e3">
<path d="M160-80v-60h640v60H160Zm319-160L199-600h160v-280h240v280h161L479-240Zm0-98 144-185h-84v-297H419v297h-84l144 185Zm0-185Z"/>
</svg>
                    </button>
                    <button class="icon share" title="Поделиться">
<svg xmlns="http://www.w3.org/2000/svg" height="64px" viewBox="0 -960 960 960" width="64px" fill="#e3e3e3">
<path d="M686-80q-47.5 0-80.75-33.25T572-194q0-8 5-34L278-403q-16.28 17.34-37.64 27.17Q219-366 194-366q-47.5 0-80.75-33.25T80-480q0-47.5 33.25-80.75T194-594q24 0 45 9.3 21 9.29 37 25.7l301-173q-2-8-3.5-16.5T572-766q0-47.5 33.25-80.75T686-880q47.5 0 80.75 33.25T800-766q0 47.5-33.25 80.75T686-652q-23.27 0-43.64-9Q622-670 606-685L302-516q3 8 4.5 17.5t1.5 18q0 8.5-1 16t-3 15.5l303 173q16-15 36.09-23.5 20.1-8.5 43.07-8.5Q734-308 767-274.75T800-194q0 47.5-33.25 80.75T686-80Zm.04-60q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5Zm-492-286q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5Zm492-286q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5ZM686-194ZM194-480Zm492-286Z"/>
</svg>
                    </button>
                  </div>
                </div>
      <div class="mobile-controls">
        <button class="icon download" title="Загрузить">
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
<path d="M160-80v-60h640v60H160Zm319-160L199-600h160v-280h240v280h161L479-240Zm0-98 144-185h-84v-297H419v297h-84l144 185Zm0-185Z"/>
</svg>
        </button>
        <button class="icon share" title="Поделиться">
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
<path d="M686-80q-47.5 0-80.75-33.25T572-194q0-8 5-34L278-403q-16.28 17.34-37.64 27.17Q219-366 194-366q-47.5 0-80.75-33.25T80-480q0-47.5 33.25-80.75T194-594q24 0 45 9.3 21 9.29 37 25.7l301-173q-2-8-3.5-16.5T572-766q0-47.5 33.25-80.75T686-880q47.5 0 80.75 33.25T800-766q0 47.5-33.25 80.75T686-652q-23.27 0-43.64-9Q622-670 606-685L302-516q3 8 4.5 17.5t1.5 18q0 8.5-1 16t-3 15.5l303 173q16-15 36.09-23.5 20.1-8.5 43.07-8.5Q734-308 767-274.75T800-194q0 47.5-33.25 80.75T686-80Zm.04-60q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5Zm-492-286q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5Zm492-286q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5ZM686-194ZM194-480Zm492-286Z"/>
</svg>
        </button>
      </div>
    </div>
              <div class="name-category">
                <div class="profile-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#e3e3e3">
                    <path d="M480-481q-66 0-108-42t-42-108q0-66 42-108t108-42q66 0 108 42t42 108q0 66-42 108t-108 42ZM160-160v-94q0-38 19-65t49-41q67-30 128.5-45T480-420q62 0 123 15.5t127.92 44.69q31.3 14.13 50.19 40.97Q800-292 800-254v94H160Zm60-60h520v-34q0-16-9.5-30.5T707-306q-64-31-117-42.5T480-360q-57 0-111 11.5T252-306q-14 7-23 21.5t-9 30.5v34Zm260-321q39 0 64.5-25.5T570-631q0-39-25.5-64.5T480-721q-39 0-64.5 25.5T390-631q0 39 25.5 64.5T480-541Zm0-90Zm0 411Z"/>
                  </svg>
                </div>
                <p class="name">${item.name}</p>
              </div>
              <div class="mini-subtags-line">
  ${tagHTML}
  ${subtagHTML}
</div>
  <div class="item-stats">
    <div class="stats-item">
<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3">
<path d="M480-312q70 0 119-49t49-119q0-70-49-119t-119-49q-70 0-119 49t-49 119q0 70 49 119t119 49Zm0-72q-40 0-68-28t-28-68q0-40 28-68t68-28q40 0 68 28t28 68q0 40-28 68t-68 28Zm0 192q-142.6 0-259.8-78.5Q103-349 48-480q55-131 172.2-209.5Q337.4-768 480-768q142.6 0 259.8 78.5Q857-611 912-480q-55 131-172.2 209.5Q622.6-192 480-192Zm0-288Zm0 216q112 0 207-58t146-158q-51-100-146-158t-207-58q-112 0-207 58T127-480q51 100 146 158t207 58Z"/>
</svg>
      <span class="stat-value">${item.views || 0}</span>
    </div>
    <div class="stats-item">
<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#e3e3e3">
<path d="M192-96v-72h576v72H192Zm288-144L219-576h141v-288h240v288h141L480-240Z"/>
</svg>
      <span class="stat-value">${item.uploaded || 0}</span>
    </div>
    <div class="stats-item">
      <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#e3e3e3">
        <path d="M200-120v-656.67q0-27 19.83-46.83 19.84-19.83 46.84-19.83h426.66q27 0 46.84 19.83Q760-803.67 760-776.67V-120L480-240 200-120Z"/>
      </svg>
      <span class="stat-value">${item.saved || 0}</span>
    </div>
            </div>
          `;
        gallery.innerHTML += html;
      });
      document.dispatchEvent(new Event("layoutsRendered"));
    })
    .catch((err) => {
      console.error("Ошибка при загрузке layouts.json:", err);
    });
});

document.addEventListener("layoutsRendered", () => {
  const gallery = document.querySelector(".gallery");
  const items = gallery.querySelectorAll(".item");
  const minItemsPerRow = 4;
  const currentRowCount = Math.ceil(items.length / minItemsPerRow);
  const totalItemsNeeded = currentRowCount * minItemsPerRow;
  if (items.length < totalItemsNeeded) {
    for (let i = items.length; i < totalItemsNeeded; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "item placeholder";
      placeholder.style.visibility = "hidden";
      gallery.appendChild(placeholder);
    }
  }
});

document.addEventListener("layoutsRendered", () => {
  const defaultBookmarkSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#e3e3e3">
        <path d="M200-120v-665q0-24 18-42t42-18h440q24 0 42 18t18 42v665L480-240 200-120Zm60-91 220-93 220 93v-574H260v574Z"/>
      </svg>`;
  const filledBookmarkSVG = `
      <svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="#e3e3e3">
        <path d="M200-120v-656.67q0-27 19.83-46.83 19.84-19.83 46.84-19.83h426.66q27 0 46.84 19.83Q760-803.67 760-776.67V-120L480-240 200-120Z"/>
      </svg>`;

  document.querySelectorAll(".bookmark-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (button.classList.contains("active")) {
        button.classList.remove("active");
        button.innerHTML = defaultBookmarkSVG;
      } else {
        button.classList.add("active");
        button.innerHTML = filledBookmarkSVG;
      }
    });
  });
});

document.addEventListener("layoutsRendered", () => {
  document.addEventListener("click", (event) => {
    const openBtn = event.target.closest(".icon.open");
    if (openBtn) {
      const itemEl = openBtn.closest(".item");
      if (!itemEl) return;
      const zoomableImage = itemEl.querySelector("img.zoomable");
      if (zoomableImage) {
        zoomableImage.click();
      }
      return;
    }

    const downloadBtn = event.target.closest(".icon.download");
    if (downloadBtn) {
      const itemEl = downloadBtn.closest(".item");
      if (!itemEl) return;
      const linkUrl = itemEl.dataset.link;
      if (linkUrl) {
        window.open(linkUrl, "_blank");
      }
      return;
    }

    const shareBtn = event.target.closest(".icon.share");
    if (shareBtn) {
      const itemEl = shareBtn.closest(".item");
      if (!itemEl) return;
      const shareLink = itemEl.dataset.link || window.location.href;
      const shareTitle =
        itemEl.querySelector(".name")?.textContent || "Моя база";
      if (navigator.share) {
        navigator
          .share({
            title: `База: ${shareTitle}`,
            text: `Смотри, какая классная база!`,
            url: shareLink,
          })
          .then(() => {
            console.log("Успешно поделились");
          })
          .catch((err) => {
            console.error("Ошибка при шаринге:", err);
          });
      } else {
        alert(`Поделитесь ссылкой: ${shareLink}`);
      }
      return;
    }
  });
});
