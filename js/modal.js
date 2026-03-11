document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("modal");
  const modalContent = modal.querySelector(".modal-content");
  const imageStage = modalContent.querySelector(".image-stage");
  const slideCurrent = imageStage.querySelector(".slide.current");
  const slideNext = imageStage.querySelector(".slide.next");
  const slidePrev = imageStage.querySelector(".slide.prev");

  const thumbnailsContainer = document.getElementById("thumbnailsContainer");
  const zoomSlider = document.getElementById("zoomSlider");
  const resetZoomButton = document.getElementById("resetZoom");
  const closeModal = document.getElementById("closeModal");
  const fullscreenModal = document.getElementById("fullscreenModal");

  const TAP_MOVEMENT_THRESHOLD = 10;

  let scale = 1;

  let rawOffsetX = 0;
  let rawOffsetY = 0;

  let offsetX = 0;
  let offsetY = 0;

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const MID_SCALE = 2.5;

  const ELASTIC_PULL = 0.3;

  let baseWidth = 0;
  let baseHeight = 0;

  let isDragging = false;
  let startX = 0,
    startY = 0;

  let isPotentialSwipe = false;
  let isHorizontalSwipe = false;
  let isVerticalSwipe = false;
  let swipeStartX = 0;
  let swipeStartY = 0;
  const SWIPE_THRESHOLD = 80;
  const SWIPE_CLOSE_THRESHOLD = 80;
  const SWIPE_DEADZONE = 10;

  let clickCount = 0;
  let doubleClickTimer = null;
  const DOUBLE_CLICK_DELAY = 300;
  let doubleTapLock = false;

  let pointers = [];
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let pinchStartOffsetX = 0;
  let pinchStartOffsetY = 0;
  let pinchStartCenter = { x: 0, y: 0 };

  let currentImageIndex = 0;
  let imagesList = [];
  let layoutsData = [];
  let thumbnailData = {};

  let isSwipeAnimating = false;
  let isSnapBackActive = false;

  let lastMoveTime = 0;
  let velocityX = 0;
  let velocityY = 0;
  const MAX_VELOCITY = 2;
  const INERTIA_MULTIPLIER = 8;

  let inertiaAnimationFrame = null;

  try {
    const layoutsResponse = await fetch("/data/layouts.json");
    layoutsData = await layoutsResponse.json();
    const thumbnailsResponse = await fetch("/data/thumbnailData.json");
    thumbnailData = await thumbnailsResponse.json();
  } catch (error) {
    console.error("Ошибка загрузки JSON:", error);
  }

  function startZoomAnimation() {
    slideCurrent.classList.add("zoom-animating");
    slideCurrent.addEventListener("transitionend", function handler() {
      slideCurrent.classList.remove("zoom-animating");
      slideCurrent.removeEventListener("transitionend", handler);
    });
  }

  function computeBaseSize() {
    const containerW = imageStage.offsetWidth;
    const containerH = imageStage.offsetHeight;
    const containerRatio = containerW / containerH;
    if (currentImageAspectRatio > containerRatio) {
      baseWidth = containerW;
      baseHeight = containerW / currentImageAspectRatio;
    } else {
      baseHeight = containerH;
      baseWidth = containerH * currentImageAspectRatio;
    }
  }

  function updateBackground(isPointerMove = false) {
    const finalW = baseWidth * scale;
    const finalH = baseHeight * scale;
    const containerW = imageStage.offsetWidth;
    const containerH = imageStage.offsetHeight;
    const maxOffsetX = (finalW - containerW) / 2;
    const maxOffsetY = (finalH - containerH) / 2;

    let dispX = rawOffsetX;
    let dispY = rawOffsetY;

    if (isPointerMove && finalW > containerW) {
      if (rawOffsetX > maxOffsetX) {
        let excess = rawOffsetX - maxOffsetX;
        dispX = maxOffsetX + excess * ELASTIC_PULL;
      } else if (rawOffsetX < -maxOffsetX) {
        let excess = -maxOffsetX - rawOffsetX;
        dispX = -maxOffsetX - excess * ELASTIC_PULL;
      }
    }
    if (isPointerMove && finalH > containerH) {
      if (rawOffsetY > maxOffsetY) {
        let excess = rawOffsetY - maxOffsetY;
        dispY = maxOffsetY + excess * ELASTIC_PULL;
      } else if (rawOffsetY < -maxOffsetY) {
        let excess = -maxOffsetY - rawOffsetY;
        dispY = -maxOffsetY - excess * ELASTIC_PULL;
      }
    }

    if (!isPointerMove) {
      if (finalW > containerW) {
        dispX = Math.max(-maxOffsetX, Math.min(dispX, maxOffsetX));
      } else {
        dispX = 0;
      }
      if (finalH > containerH) {
        dispY = Math.max(-maxOffsetY, Math.min(dispY, maxOffsetY));
      } else {
        dispY = 0;
      }
      rawOffsetX = dispX;
      rawOffsetY = dispY;
    }

    offsetX = dispX;
    offsetY = dispY;

    slideCurrent.style.backgroundSize = `${finalW}px ${finalH}px`;
    slideCurrent.style.backgroundPosition = `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`;
    syncZoomSlider();
  }

  function syncZoomSlider() {
    zoomSlider.value = scale.toFixed(2);
    const min = parseFloat(zoomSlider.min);
    const max = parseFloat(zoomSlider.max);
    const fillPercent = ((scale - min) / (max - min)) * 100;
    zoomSlider.style.setProperty("--slider-fill", `${fillPercent}%`);
  }

  resetZoomButton.addEventListener("pointerdown", () => {
    startZoomAnimation();
    if (scale === 1) {
      scale = MID_SCALE;
    } else {
      scale = 1;
    }
    updateBackground(false);
  });

  zoomSlider.addEventListener("input", (e) => {
    startZoomAnimation();
    let newScale = parseFloat(e.target.value);
    newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
    scale = newScale;
    updateBackground(false);
  });

  function resetZoomParams() {
    scale = 1;
    rawOffsetX = 0;
    rawOffsetY = 0;
    offsetX = 0;
    offsetY = 0;
  }

  function showImage(index) {
    if (index < 0 || index >= imagesList.length) return;
    currentImageIndex = index;
    resetZoomParams();
    slideCurrent.style.backgroundImage = "none";
    modalContent.classList.add("loading");
    const fullImage = imagesList[index];
    const image = new Image();
    image.src = fullImage;
    image.onload = () => {
      modalContent.classList.remove("loading");
      currentImageAspectRatio = image.width / image.height;
      computeBaseSize();
      slideCurrent.style.backgroundImage = `url(${fullImage})`;
      updateSlides();
      updateBackground(false);
      recalcModalHeight();
      updateThumbnails();
      scrollToActiveThumbnail();
    };
    image.onerror = () => {
      console.error("Не удалось загрузить:", fullImage);
      modalContent.classList.remove("loading");
    };
  }

  function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % imagesList.length;
    showImage(currentImageIndex);
  }
  function showPreviousImage() {
    currentImageIndex =
      (currentImageIndex - 1 + imagesList.length) % imagesList.length;
    showImage(currentImageIndex);
  }

  function updateSlides() {
    const nextIndex = (currentImageIndex + 1) % imagesList.length;
    slideNext.style.backgroundImage = `url(${imagesList[nextIndex]})`;
    const prevIndex =
      (currentImageIndex - 1 + imagesList.length) % imagesList.length;
    slidePrev.style.backgroundImage = `url(${imagesList[prevIndex]})`;
    slideCurrent.style.transition = "none";
    slideNext.style.transition = "none";
    slidePrev.style.transition = "none";
    slideCurrent.style.transform = "translateX(0)";
    slideNext.style.transform = "translateX(100%)";
    slidePrev.style.transform = "translateX(-100%)";
  }

  function recalcModalHeight() {
    if (modal.classList.contains("show")) {
      const containerWidth = modalContent.offsetWidth;
      const thumbnailPanelHeight = 120;
      const verticalMargin = 20;
      const availableHeight =
        window.innerHeight - thumbnailPanelHeight - verticalMargin;
      const computedHeight = containerWidth / currentImageAspectRatio;
      const finalHeight = Math.min(computedHeight, availableHeight);
      modalContent.style.setProperty("--modal-height", `${finalHeight}px`);
    }
  }
  window.addEventListener("resize", recalcModalHeight);

  function updateThumbnails() {
    const thumbs = thumbnailsContainer.querySelectorAll(".thumbnail");
    thumbs.forEach((thumb, idx) => {
      if (idx === currentImageIndex) thumb.classList.add("active");
      else thumb.classList.remove("active");
    });
  }

  function scrollToActiveThumbnail() {
    const activeThumb = thumbnailsContainer.querySelector(".thumbnail.active");
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }

  const images = document.querySelectorAll(".zoomable");
  images.forEach((img) => {
    img.addEventListener("click", () => {
      modal.classList.add("show");
      document.body.classList.add("modal-open");
      thumbnailsContainer.innerHTML = "";
      imagesList = thumbnailData[img.dataset.id] || [];
      if (imagesList.length > 0) {
        imagesList.forEach((src, idx) => {
          const thumb = document.createElement("img");
          thumb.src = src;
          thumb.classList.add("thumbnail");
          if (idx === 0) thumb.classList.add("active");
          thumb.addEventListener("click", () => showImage(idx));
          thumbnailsContainer.appendChild(thumb);
        });
        requestAnimationFrame(() => {
          showImage(0);
        });
      } else {
        console.error("Нет изображений для ID:", img.dataset.id);
      }
    });
  });

  closeModal.addEventListener("click", () => {
    closeModalWindow();
  });

  function resetSwipeState() {
    isSwipeAnimating = false;
    isSnapBackActive = false;
    isPotentialSwipe = false;
    isHorizontalSwipe = false;
    isVerticalSwipe = false;
    pointers = [];
  }

  function closeModalWindow(swipeClose = false) {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error(`Ошибка выхода из fullscreen: ${err.message}`);
      });
    }
    resetZoomParams();
    resetSwipeState();
    modalContent.classList.remove("loading");
    if (!swipeClose) {
      modal.classList.add("closing");
      modalContent.addEventListener("animationend", function handler() {
        modalContent.removeEventListener("animationend", handler);
        slideCurrent.style.backgroundImage = "none";
        modal.classList.remove("show", "closing");
        document.body.classList.remove("modal-open");
        modalContent.style.transition = "none";
        modalContent.style.transform = "translateY(0)";
        modalContent.style.opacity = "1";
        computeBaseSize();
        updateBackground(false);
        document.body.style.setProperty("--overlay-opacity", 1);
        document.body.style.setProperty("--gallery-blur", "4px");
        modalContent.style.setProperty("--modal-dimming", 0);
      });
    } else {
      modal.classList.remove("show");
      document.body.classList.remove("modal-open");
      slideCurrent.style.backgroundImage = "none";
      modalContent.style.transition = "none";
      modalContent.style.transform = "translateY(0)";
      modalContent.style.opacity = "1";
      computeBaseSize();
      updateBackground(false);
      document.body.style.setProperty("--overlay-opacity", 1);
      document.body.style.setProperty("--gallery-blur", "4px");
      modalContent.style.setProperty("--modal-dimming", 0);
    }
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModalWindow();
    }
  });

  fullscreenModal.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      modal.requestFullscreen().catch((err) => {
        console.error(`Ошибка fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error(`Ошибка выхода: ${err.message}`);
      });
    }
  });

  slideCurrent.addEventListener(
    "wheel",
    (e) => {
      if (isPotentialSwipe || isHorizontalSwipe || isVerticalSwipe) return;
      e.preventDefault();
      startZoomAnimation();
      const factor = 0.25;
      const deltaFactor = e.deltaY > 0 ? 1 - factor : 1 + factor;
      let newScale = scale * deltaFactor;
      newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
      const ds = newScale - scale;
      const rect = imageStage.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const cursorX = e.clientX;
      const cursorY = e.clientY;
      const dx = cursorX - centerX;
      const dy = cursorY - centerY;
      rawOffsetX -= dx * ds;
      rawOffsetY -= dy * ds;
      scale = newScale;
      updateBackground(false);
    },
    { passive: false }
  );

  imageStage.addEventListener("pointerdown", onPointerDown);
  imageStage.addEventListener("pointermove", onPointerMove);
  imageStage.addEventListener("pointerup", onPointerUp);
  imageStage.addEventListener("pointercancel", onPointerCancel);

  function onPointerDown(e) {
    lastMoveTime = Date.now();
    velocityX = 0;
    velocityY = 0;
    if (isSwipeAnimating) {
      return;
    }
    if (isSnapBackActive) {
      slideCurrent.classList.remove("snap-back-transition");
      slideCurrent.style.transition = "none";
      isSnapBackActive = false;
    }
    if (
      e.target.closest(
        ".control-button, #closeModal, #zoomSliderContainer, .thumbnail"
      )
    ) {
      return;
    }
    imageStage.setPointerCapture(e.pointerId);
    pointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });

    if (pointers.length === 2) {
      isPotentialSwipe = false;
      isDragging = false;
      pinchStartDistance = getPinchDistance(pointers[0], pointers[1]);
      pinchStartScale = scale;
      pinchStartOffsetX = rawOffsetX;
      pinchStartOffsetY = rawOffsetY;
      pinchStartCenter = getPinchCenter(pointers[0], pointers[1]);
      return;
    }

    if (scale > 1) {
      isDragging = true;
      isPotentialSwipe = false;
    } else {
      isDragging = false;
      isPotentialSwipe = true;
      isHorizontalSwipe = false;
      isVerticalSwipe = false;
      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
      slideCurrent.style.transition = "none";
      slideNext.style.transition = "none";
      slidePrev.style.transition = "none";
      slideCurrent.style.transform = "translateX(0)";
      slideNext.style.transform = "translateX(100%)";
      slidePrev.style.transform = "translateX(-100%)";
    }
    startX = e.clientX;
    startY = e.clientY;
  }

  function onPointerMove(e) {
    if (doubleTapLock) return;
    for (let i = 0; i < pointers.length; i++) {
      if (pointers[i].id === e.pointerId) {
        pointers[i].x = e.clientX;
        pointers[i].y = e.clientY;
        break;
      }
    }
    if (
      pointers.length === 2 &&
      !(isPotentialSwipe || isHorizontalSwipe || isVerticalSwipe)
    ) {
      const currentDistance = getPinchDistance(pointers[0], pointers[1]);
      const currentPinchCenter = getPinchCenter(pointers[0], pointers[1]);
      let newScale = pinchStartScale * (currentDistance / pinchStartDistance);
      newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
      const rect = imageStage.getBoundingClientRect();
      const containerCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const deltaCenter = {
        x: currentPinchCenter.x - pinchStartCenter.x,
        y: currentPinchCenter.y - pinchStartCenter.y,
      };
      const scaleFactor = newScale / pinchStartScale;
      rawOffsetX =
        pinchStartOffsetX +
        deltaCenter.x +
        (1 - scaleFactor) * (pinchStartCenter.x - containerCenter.x);
      rawOffsetY =
        pinchStartOffsetY +
        deltaCenter.y +
        (1 - scaleFactor) * (pinchStartCenter.y - containerCenter.y);
      scale = newScale;
      updateBackground(true);
      return;
    }
    if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      rawOffsetX += dx;
      rawOffsetY += dy;

      const now = Date.now();
      const dt = now - lastMoveTime;
      if (dt > 0) {
        velocityX = dx / dt;
        velocityY = dy / dt;
      }
      lastMoveTime = now;

      startX = e.clientX;
      startY = e.clientY;

      updateBackground(true);
    } else if (isPotentialSwipe) {
      const dx = e.clientX - swipeStartX;
      const dy = e.clientY - swipeStartY;
      if (!isHorizontalSwipe && !isVerticalSwipe) {
        if (Math.abs(dx) > SWIPE_DEADZONE || Math.abs(dy) > SWIPE_DEADZONE) {
          if (Math.abs(dx) > Math.abs(dy)) {
            isHorizontalSwipe = true;
          } else {
            isVerticalSwipe = true;
          }
          velocityX = 0;
          velocityY = 0;
        }
      }
      if (isHorizontalSwipe) {
        if (dx < 0) {
          slideCurrent.style.transform = `translateX(${dx}px)`;
          slideNext.style.transform = `translateX(calc(100% + ${dx}px))`;
        } else {
          slideCurrent.style.transform = `translateX(${dx}px)`;
          slidePrev.style.transform = `translateX(calc(-100% + ${dx}px))`;
        }
      } else if (isVerticalSwipe) {
        const absDY = Math.abs(dy);
        const maxDist = 300;
        let newOpacity = 1 - absDY / maxDist;
        if (newOpacity < 0) newOpacity = 0;
        modalContent.style.transform = `translateY(${dy}px)`;
        modalContent.style.opacity = newOpacity.toString();
        document.body.style.setProperty("--overlay-opacity", newOpacity);
        document.body.style.setProperty(
          "--gallery-blur",
          `${4 * newOpacity}px`
        );
      }
    }
  }

  function onPointerUp(e) {
    imageStage.releasePointerCapture(e.pointerId);
    pointers = pointers.filter((p) => p.id !== e.pointerId);
    if (pointers.length < 2) {
      pinchStartDistance = 0;
    }

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const moveDistance = Math.sqrt(dx * dx + dy * dy);

    if (moveDistance < TAP_MOVEMENT_THRESHOLD) {
      clickCount++;
      if (clickCount === 1) {
        doubleClickTimer = setTimeout(() => {
          clickCount = 0;
        }, DOUBLE_CLICK_DELAY);
      } else if (clickCount === 2) {
        clearTimeout(doubleClickTimer);
        clickCount = 0;
        handleDoublePress(e);
        doubleTapLock = true;
        setTimeout(() => {
          doubleTapLock = false;
        }, 300);
        return;
      }
    }

    if (isDragging) {
      isDragging = false;
      const limitedVelX = Math.max(
        -MAX_VELOCITY,
        Math.min(velocityX, MAX_VELOCITY)
      );
      const limitedVelY = Math.max(
        -MAX_VELOCITY,
        Math.min(velocityY, MAX_VELOCITY)
      );
      const momentumX = limitedVelX * INERTIA_MULTIPLIER * 24;
      const momentumY = limitedVelY * INERTIA_MULTIPLIER * 24;
      rawOffsetX += momentumX;
      rawOffsetY += momentumY;
      updateBackground(false);
      snapBackToBounds();
    } else if (isPotentialSwipe) {
      const dxSwipe = e.clientX - swipeStartX;
      const dySwipe = e.clientY - swipeStartY;
      if (isHorizontalSwipe) {
        finishHorizontalSwipe(dxSwipe);
      } else if (isVerticalSwipe) {
        finishVerticalSwipe(dySwipe);
      }
      isPotentialSwipe = false;
      isHorizontalSwipe = false;
      isVerticalSwipe = false;
    } else {
      snapBackToBounds();
    }
  }

  function onPointerCancel(e) {
    imageStage.releasePointerCapture(e.pointerId);
    pointers = pointers.filter((p) => p.id !== e.pointerId);
    isDragging = false;
    isPotentialSwipe = false;
    isHorizontalSwipe = false;
    isVerticalSwipe = false;
    snapBackToBounds();
  }

  function snapBackToBounds() {
    slideCurrent.style.transition = "background-position 0.3s ease";
    updateBackground(false);
    slideCurrent.addEventListener(
      "transitionend",
      function handler() {
        slideCurrent.removeEventListener("transitionend", handler);
        slideCurrent.style.transition = "none";
        isSnapBackActive = false;
      },
      { once: true }
    );
    isSnapBackActive = true;
  }

  function finishHorizontalSwipe(dx) {
    if (isSwipeAnimating) return;
    isSwipeAnimating = true;
    const duration = 300;
    let transitionElement;
    if (dx < -SWIPE_THRESHOLD) {
      slideCurrent.style.transition = `transform ${duration}ms ease`;
      slideNext.style.transition = `transform ${duration}ms ease`;
      slideCurrent.style.transform = "translateX(-100%)";
      slideNext.style.transform = "translateX(0)";
      transitionElement = slideNext;
      transitionElement.addEventListener("transitionend", function handler() {
        transitionElement.removeEventListener("transitionend", handler);
        currentImageIndex = (currentImageIndex + 1) % imagesList.length;
        resetZoomParams();
        showImage(currentImageIndex);
        isSwipeAnimating = false;
      });
    } else if (dx > SWIPE_THRESHOLD) {
      slideCurrent.style.transition = `transform ${duration}ms ease`;
      slidePrev.style.transition = `transform ${duration}ms ease`;
      slideCurrent.style.transform = "translateX(100%)";
      slidePrev.style.transform = "translateX(0)";
      transitionElement = slidePrev;
      transitionElement.addEventListener("transitionend", function handler() {
        transitionElement.removeEventListener("transitionend", handler);
        currentImageIndex =
          (currentImageIndex - 1 + imagesList.length) % imagesList.length;
        resetZoomParams();
        showImage(currentImageIndex);
        isSwipeAnimating = false;
      });
    } else {
      slideCurrent.style.transition = `transform ${duration}ms ease`;
      if (dx < 0) {
        slideCurrent.style.transform = "translateX(0)";
        slideNext.style.transition = `transform ${duration}ms ease`;
        slideNext.style.transform = "translateX(100%)";
        transitionElement = slideNext;
      } else {
        slideCurrent.style.transform = "translateX(0)";
        slidePrev.style.transition = `transform ${duration}ms ease`;
        slidePrev.style.transform = "translateX(-100%)";
        transitionElement = slidePrev;
      }
      transitionElement.addEventListener("transitionend", function handler() {
        transitionElement.removeEventListener("transitionend", handler);
        isSwipeAnimating = false;
      });
    }
    setTimeout(() => {
      isSwipeAnimating = false;
    }, duration + 50);
  }

  function finishVerticalSwipe(dy) {
    modalContent.style.transition =
      "transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease";
    if (dy > SWIPE_CLOSE_THRESHOLD || dy < -SWIPE_CLOSE_THRESHOLD) {
      modalContent.style.transform =
        dy > 0 ? "translateY(100%)" : "translateY(-100%)";
      modalContent.style.opacity = "0";
      modalContent.addEventListener("transitionend", function _close() {
        modalContent.removeEventListener("transitionend", _close);
        closeModalWindow(true);
      });
    } else {
      modalContent.style.transform = "translateY(0)";
      modalContent.style.opacity = "1";
      document.body.style.setProperty("--overlay-opacity", 1);
      document.body.style.setProperty("--gallery-blur", "4px");
      modalContent.style.setProperty("--modal-dimming", 0);
    }
  }

  function getPinchDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function getPinchCenter(p1, p2) {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  function handleDoublePress(e) {
    startZoomAnimation();
    const rect = imageStage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let newScale;
    if (scale === 1) {
      newScale = MID_SCALE;
      const ds = newScale - scale;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      rawOffsetX -= dx * ds;
      rawOffsetY -= dy * ds;
    } else {
      newScale = 1;
      resetZoomParams();
      isDragging = false;
    }
    scale = newScale;
    updateBackground(false);
    resetSwipeState();
  }

  document.addEventListener("fullscreenchange", () => {
    if (modal.classList.contains("show")) {
      if (document.fullscreenElement) {
        modalContent.classList.add("fullscreen");
      } else {
        modalContent.classList.remove("fullscreen");
      }
      resetZoomParams();
      computeBaseSize();
      updateBackground(false);
      recalcModalHeight();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (modal.classList.contains("show")) {
      if (e.key === "ArrowRight") {
        showNextImage();
      } else if (e.key === "ArrowLeft") {
        showPreviousImage();
      } else if (e.key === "Escape") {
        closeModalWindow();
      }
    }
  });
});
