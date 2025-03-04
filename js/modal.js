document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    const imageStage = modalContent.querySelector('.image-stage');
    const slideCurrent = imageStage.querySelector('.slide.current');
    const slideNext = imageStage.querySelector('.slide.next');
    const slidePrev = imageStage.querySelector('.slide.prev');

    const thumbnailsContainer = document.getElementById('thumbnailsContainer');
    const zoomSlider = document.getElementById('zoomSlider');
    const resetZoomButton = document.getElementById('resetZoom');
    const closeModal = document.getElementById('closeModal');
    const fullscreenModal = document.getElementById('fullscreenModal');

    // -------------------------------
    // ПАРАМЕТРЫ ДЛЯ ЗУМА
    // -------------------------------
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;    // теперь максимум x5

    // При дабл-тапе или кнопке если scale=1 => ставим 2.5 (среднее между 1 и 5)
    const MID_SCALE = 2.5;

    // Управление «пружиной»
    const ALLOW_ELASTIC_EDGES = true;
    const ELASTIC_FACTOR = 0.7; // базовый коэффициент эластичности
    const DAMPENING_CONSTANT = 100; // константа для нелинейного затухания

    // Базовые размеры фоновой картинки (scale=1)
    let baseWidth = 0;
    let baseHeight = 0;

    // Для перетаскивания
    let isDragging = false;
    let startX = 0, startY = 0;

    // Свайпы (при scale=1)
    let isPotentialSwipe = false;
    let isHorizontalSwipe = false;
    let isVerticalSwipe = false;
    let swipeStartX = 0;
    let swipeStartY = 0;
    const SWIPE_THRESHOLD = 80;
    const SWIPE_CLOSE_THRESHOLD = 80;
    const SWIPE_DEADZONE = 10;

    // Двойной клик
    let clickCount = 0;
    let doubleClickTimer = null;
    const DOUBLE_CLICK_DELAY = 300;

    // Pinch
    let pointers = [];
    let startPinchDist = 0;
    let startPinchScale = 1;
    let startPinchCenter = { x: 0, y: 0 };
    let startOffsetX = 0;
    let startOffsetY = 0;

    // Список изображений
    let currentImageIndex = 0;
    let imagesList = [];
    let layoutsData = [];
    let thumbnailData = {};

    // Инерция
    let lastMoveTime = 0;
    let velocityX = 0;
    let velocityY = 0;
    const MAX_VELOCITY = 2;
    // Множитель для расчёта инерции (уменьшен для плавности)
    const INERTIA_MULTIPLIER = 8;

    // Флаг анимации свайпа
    let isSwipeAnimating = false;

    // Флаг, указывающий, что сейчас идёт snap-back анимация
    let isSnapBackActive = false;

    // Соотношение сторон загруженного изображения
    let currentImageAspectRatio = 1;

    // -------------------------------
    // ЗАГРУЗКА ДАННЫХ (пример, если нужно)
    // -------------------------------
    try {
        const layoutsResponse = await fetch('data/layouts.json');
        layoutsData = await layoutsResponse.json();
        const thumbnailsResponse = await fetch('data/thumbnailData.json');
        thumbnailData = await thumbnailsResponse.json();
    } catch (error) {
        console.error('Ошибка загрузки JSON:', error);
    }

    // -------------------------------
    // ФУНКЦИИ ДЛЯ ЗУМА
    // -------------------------------

    // Включаем CSS-анимацию (transition) на background-size/position
    function startZoomAnimation() {
        slideCurrent.classList.add('zoom-animating');
        slideCurrent.addEventListener('transitionend', function handler() {
            slideCurrent.classList.remove('zoom-animating');
            slideCurrent.removeEventListener('transitionend', handler);
        });
    }

    // Считаем базовые размеры фоновой картинки (scale=1) «по contain»
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

    // При drag (pointermove = true) используем "резинку" с нелинейным затуханием
    // При отпускании/инерции (pointermove = false) – жёстко clamp
    function constrainOffsets(finalW, finalH, isPointerMove = false) {
        const containerW = imageStage.offsetWidth;
        const containerH = imageStage.offsetHeight;

        // Горизонталь
        if (finalW <= containerW) {
            offsetX = 0;
        } else {
            const maxOffsetX = (finalW - containerW) / 2;
            if (isPointerMove && ALLOW_ELASTIC_EDGES) {
                if (offsetX < -maxOffsetX) {
                    let extra = -maxOffsetX - offsetX; // дополнительное смещение (положительное)
                    extra = (extra * ELASTIC_FACTOR) / (1 + extra / DAMPENING_CONSTANT);
                    offsetX = -maxOffsetX - extra;
                    // ограничиваем максимальное отклонение (заменили 1.5 на 1.2)
                    if (offsetX < -maxOffsetX * 1.2) offsetX = -maxOffsetX * 1.2;
                } else if (offsetX > maxOffsetX) {
                    let extra = offsetX - maxOffsetX;
                    extra = (extra * ELASTIC_FACTOR) / (1 + extra / DAMPENING_CONSTANT);
                    offsetX = maxOffsetX + extra;
                    if (offsetX > maxOffsetX * 1.2) offsetX = maxOffsetX * 1.2;
                }
            } else {
                offsetX = Math.max(-maxOffsetX, Math.min(offsetX, maxOffsetX));
            }
        }

        // Вертикаль
        if (finalH <= containerH) {
            offsetY = 0;
        } else {
            const maxOffsetY = (finalH - containerH) / 2;
            if (isPointerMove && ALLOW_ELASTIC_EDGES) {
                if (offsetY < -maxOffsetY) {
                    let extra = -maxOffsetY - offsetY;
                    extra = (extra * ELASTIC_FACTOR) / (1 + extra / DAMPENING_CONSTANT);
                    offsetY = -maxOffsetY - extra;
                    if (offsetY < -maxOffsetY * 1.2) offsetY = -maxOffsetY * 1.2;
                } else if (offsetY > maxOffsetY) {
                    let extra = offsetY - maxOffsetY;
                    extra = (extra * ELASTIC_FACTOR) / (1 + extra / DAMPENING_CONSTANT);
                    offsetY = maxOffsetY + extra;
                    if (offsetY > maxOffsetY * 1.2) offsetY = maxOffsetY * 1.2;
                }
            } else {
                offsetY = Math.max(-maxOffsetY, Math.min(offsetY, maxOffsetY));
            }
        }
    }

    // Обновляем фон (с ограничением, используется при отпускании или для анимации инерции)
    function updateBackground(isPointerMove = false) {
        const finalW = baseWidth * scale;
        const finalH = baseHeight * scale;

        // Ограничиваем смещения
        constrainOffsets(finalW, finalH, isPointerMove);

        // background-size
        slideCurrent.style.backgroundSize = `${finalW}px ${finalH}px`;

        // background-position
        const posX = `calc(50% + ${offsetX}px)`;
        const posY = `calc(50% + ${offsetY}px)`;
        slideCurrent.style.backgroundPosition = `${posX} ${posY}`;

        // Синхронизация ползунка
        syncZoomSlider();
    }

    // Новая функция для обновления фона во время перетаскивания без жёсткого ограничения
    function updateBackgroundDragging() {
        const finalW = baseWidth * scale;
        const finalH = baseHeight * scale;
        slideCurrent.style.backgroundSize = `${finalW}px ${finalH}px`;
        const posX = `calc(50% + ${offsetX}px)`;
        const posY = `calc(50% + ${offsetY}px)`;
        slideCurrent.style.backgroundPosition = `${posX} ${posY}`;
        syncZoomSlider();
    }

    // Синхронизация значения на ползунке
    function syncZoomSlider() {
        zoomSlider.value = scale.toFixed(2);
        const min = parseFloat(zoomSlider.min);
        const max = parseFloat(zoomSlider.max);
        const fillPercent = ((scale - min) / (max - min)) * 100;
        zoomSlider.style.setProperty('--slider-fill', `${fillPercent}%`);
    }

    // -------------------------------
    // Кнопка зума
    // -------------------------------
    resetZoomButton.addEventListener('click', () => {
        startZoomAnimation();
        if (scale === 1) {
            scale = MID_SCALE;
        } else {
            scale = 1;
        }
        updateBackground(false);
    });

    // -------------------------------
    // Ползунок зума
    // -------------------------------
    zoomSlider.addEventListener('input', (e) => {
        startZoomAnimation();
        let newScale = parseFloat(e.target.value);
        if (newScale < MIN_SCALE) newScale = MIN_SCALE;
        if (newScale > MAX_SCALE) newScale = MAX_SCALE;

        scale = newScale;
        updateBackground(false);
    });

    // -------------------------------
    // ЗАГРУЗКА/ОТОБРАЖЕНИЕ ИЗОБРАЖЕНИЙ
    // -------------------------------
    function resetZoomParams() {
        scale = 1;
        offsetX = 0;
        offsetY = 0;
    }

    function showImage(index) {
        if (index < 0 || index >= imagesList.length) return;
        currentImageIndex = index;
        resetZoomParams();
        slideCurrent.style.backgroundImage = 'none';
        modalContent.classList.add('loading');

        const fullImage = imagesList[index];
        const image = new Image();
        image.src = fullImage;
        image.onload = () => {
            modalContent.classList.remove('loading');
            currentImageAspectRatio = image.width / image.height;

            computeBaseSize();
            slideCurrent.style.backgroundImage = `url(${fullImage})`;
            updateSlides();

            updateBackground();
            recalcModalHeight();
            updateThumbnails();
            scrollToActiveThumbnail();
        };
        image.onerror = () => {
            console.error("Не удалось загрузить:", fullImage);
            modalContent.classList.remove('loading');
        };
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % imagesList.length;
        showImage(currentImageIndex);
    }
    function showPreviousImage() {
        currentImageIndex = (currentImageIndex - 1 + imagesList.length) % imagesList.length;
        showImage(currentImageIndex);
    }

    function updateSlides() {
        const nextIndex = (currentImageIndex + 1) % imagesList.length;
        slideNext.style.backgroundImage = `url(${imagesList[nextIndex]})`;
        const prevIndex = (currentImageIndex - 1 + imagesList.length) % imagesList.length;
        slidePrev.style.backgroundImage = `url(${imagesList[prevIndex]})`;

        slideCurrent.style.transition = 'none';
        slideNext.style.transition = 'none';
        slidePrev.style.transition = 'none';

        slideCurrent.style.transform = 'translateX(0)';
        slideNext.style.transform = 'translateX(100%)';
        slidePrev.style.transform = 'translateX(-100%)';
    }

    function recalcModalHeight() {
        if (modal.classList.contains('show')) {
            const containerWidth = modalContent.offsetWidth;
            const thumbnailPanelHeight = 120;
            const verticalMargin = 20;
            const availableHeight = window.innerHeight - thumbnailPanelHeight - verticalMargin;
            const computedHeight = containerWidth / currentImageAspectRatio;
            const finalHeight = Math.min(computedHeight, availableHeight);
            modalContent.style.setProperty('--modal-height', `${finalHeight}px`);
        }
    }
    window.addEventListener('resize', recalcModalHeight);

    function updateThumbnails() {
        const thumbs = thumbnailsContainer.querySelectorAll('.thumbnail');
        thumbs.forEach((thumb, idx) => {
            if (idx === currentImageIndex) thumb.classList.add('active');
            else thumb.classList.remove('active');
        });
    }

    function scrollToActiveThumbnail() {
        const activeThumb = thumbnailsContainer.querySelector('.thumbnail.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }

    // -------------------------------
    // Открытие модалки
    // -------------------------------
    const images = document.querySelectorAll('.zoomable');
    images.forEach((img) => {
        img.addEventListener('click', () => {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            thumbnailsContainer.innerHTML = '';
            imagesList = thumbnailData[img.dataset.id] || [];
            if (imagesList.length > 0) {
                imagesList.forEach((src, idx) => {
                    const thumb = document.createElement('img');
                    thumb.src = src;
                    thumb.classList.add('thumbnail');
                    if (idx === 0) thumb.classList.add('active');
                    thumb.addEventListener('click', () => showImage(idx));
                    thumbnailsContainer.appendChild(thumb);
                });
                requestAnimationFrame(() => {
                    showImage(0);
                });
            } else {
                console.error('Нет изображений для ID:', img.dataset.id);
            }
        });
    });

    closeModal.addEventListener('click', () => {
        closeModalWindow();
    });

    function closeModalWindow(swipeClose = false) {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
                console.error(`Ошибка выхода из fullscreen: ${err.message}`);
            });
        }
        resetZoomParams();
        modalContent.classList.remove('loading');

        if (!swipeClose) {
            modal.classList.add('closing');
            modalContent.addEventListener('animationend', function handler() {
                modalContent.removeEventListener('animationend', handler);
                slideCurrent.style.backgroundImage = 'none';
                modal.classList.remove('show', 'closing');
                document.body.classList.remove('modal-open');

                modalContent.style.transition = 'none';
                modalContent.style.transform = 'translateY(0)';
                modalContent.style.opacity = '1';
                computeBaseSize();
                updateBackground();

                document.body.style.setProperty('--overlay-opacity', 1);
                document.body.style.setProperty('--gallery-blur', '4px');
                modalContent.style.setProperty('--modal-dimming', 0);
            });
        } else {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            slideCurrent.style.backgroundImage = 'none';

            modalContent.style.transition = 'none';
            modalContent.style.transform = 'translateY(0)';
            modalContent.style.opacity = '1';
            computeBaseSize();
            updateBackground();

            document.body.style.setProperty('--overlay-opacity', 1);
            document.body.style.setProperty('--gallery-blur', '4px');
            modalContent.style.setProperty('--modal-dimming', 0);
        }
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModalWindow();
        }
    });

    fullscreenModal.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            modal.requestFullscreen().catch(err => {
                console.error(`Ошибка fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.error(`Ошибка выхода: ${err.message}`);
            });
        }
    });

    // -------------------------------
    // Колёсико (wheel) — зум в точку
    // -------------------------------
    slideCurrent.addEventListener('wheel', (e) => {
        e.preventDefault();

        startZoomAnimation();

        const factor = 0.25;
        const deltaFactor = (e.deltaY > 0) ? (1 - factor) : (1 + factor);
        let newScale = scale * deltaFactor;
        newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));

        const ds = newScale - scale;
        const containerRect = imageStage.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        const centerY = containerRect.top + containerRect.height / 2;

        const cursorX = e.clientX;
        const cursorY = e.clientY;

        const dx = cursorX - centerX;
        const dy = cursorY - centerY;

        offsetX -= dx * ds;
        offsetY -= dy * ds;

        scale = newScale;
        updateBackground();
    }, { passive: false });

    // -------------------------------
    // Pointer Events (drag, pinch) + свайпы
    // -------------------------------
    imageStage.addEventListener('pointerdown', onPointerDown);
    imageStage.addEventListener('pointermove', onPointerMove);
    imageStage.addEventListener('pointerup', onPointerUp);
    imageStage.addEventListener('pointercancel', onPointerCancel);

    function onPointerDown(e) {
        if (isSwipeAnimating) return;
        if (e.target.closest('.control-button, #closeModal, #zoomSliderContainer, .thumbnail')) {
            return;
        }
        // Если идёт snap-back анимация, прерываем её
        if (isSnapBackActive) {
            slideCurrent.classList.remove('snap-back-transition');
            slideCurrent.style.transition = 'none';
            isSnapBackActive = false;
        }
        imageStage.setPointerCapture(e.pointerId);
        pointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });

        if (pointers.length === 2) {
            startPinchDist = getPinchDistance(pointers[0], pointers[1]);
            startPinchScale = scale;
            startPinchCenter = getPinchCenter(pointers[0], pointers[1]);
            startOffsetX = offsetX;
            startOffsetY = offsetY;
        }

        if (pointers.length === 1) {
            clickCount++;
            if (clickCount === 1) {
                doubleClickTimer = setTimeout(() => { clickCount = 0; }, DOUBLE_CLICK_DELAY);
            } else if (clickCount === 2) {
                clearTimeout(doubleClickTimer);
                clickCount = 0;
                handleDoublePress(e);
            }

            startX = e.clientX;
            startY = e.clientY;
            lastMoveTime = Date.now();
            velocityX = 0;
            velocityY = 0;

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

                slideCurrent.style.transition = 'none';
                slideNext.style.transition = 'none';
                slidePrev.style.transition = 'none';
                slideCurrent.style.transform = 'translateX(0)';
                slideNext.style.transform = 'translateX(100%)';
                slidePrev.style.transform = 'translateX(-100%)';
            }
        }
    }

    function onPointerMove(e) {
        for (let i = 0; i < pointers.length; i++) {
            if (pointers[i].id === e.pointerId) {
                pointers[i].x = e.clientX;
                pointers[i].y = e.clientY;
                break;
            }
        }

        if (pointers.length === 2) {
            const newDist = getPinchDistance(pointers[0], pointers[1]);
            const newPinchCenter = getPinchCenter(pointers[0], pointers[1]);
            const pinchRatio = newDist / startPinchDist;
            let newScale = startPinchScale * pinchRatio;
            newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));

            const rect = imageStage.getBoundingClientRect();
            const slideCenterX = rect.left + rect.width / 2;
            const slideCenterY = rect.top + rect.height / 2;
            const ds = newScale - startPinchScale;

            offsetX = startOffsetX - ((newPinchCenter.x - slideCenterX) * ds);
            offsetY = startOffsetY - ((newPinchCenter.y - slideCenterY) * ds);

            scale = newScale;
            updateBackground(true);
            return;
        }

        if (isDragging) {
            const now = Date.now();
            const dt = now - lastMoveTime || 16;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            velocityX = dx / dt;
            velocityY = dy / dt;
            velocityX = Math.max(-MAX_VELOCITY, Math.min(velocityX, MAX_VELOCITY));
            velocityY = Math.max(-MAX_VELOCITY, Math.min(velocityY, MAX_VELOCITY));

            offsetX += dx;
            offsetY += dy;

            startX = e.clientX;
            startY = e.clientY;
            lastMoveTime = now;

            // Обновляем фон во время перетаскивания без жёсткого clamp
            updateBackgroundDragging();
        }
        else if (isPotentialSwipe) {
            const dx = e.clientX - swipeStartX;
            const dy = e.clientY - swipeStartY;
            if (!isHorizontalSwipe && !isVerticalSwipe) {
                if (Math.abs(dx) > SWIPE_DEADZONE || Math.abs(dy) > SWIPE_DEADZONE) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        isHorizontalSwipe = true;
                    } else {
                        isVerticalSwipe = true;
                    }
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
                let newOpacity = 1 - (absDY / maxDist);
                if (newOpacity < 0) newOpacity = 0;
                modalContent.style.transform = `translateY(${dy}px)`;
                modalContent.style.opacity = newOpacity.toString();
                document.body.style.setProperty('--overlay-opacity', newOpacity);
                document.body.style.setProperty('--gallery-blur', `${4 * newOpacity}px`);
            }
        }
    }

    function onPointerUp(e) {
        imageStage.releasePointerCapture(e.pointerId);
        pointers = pointers.filter(p => p.id !== e.pointerId);
        if (pointers.length < 2) {
            startPinchDist = 0;
        }
        if (isDragging) {
            isDragging = false;
            // Запускаем анимацию инерции с эффектом подпрыгивания
            animateInertia();
        } else if (isPotentialSwipe) {
            const dx = e.clientX - swipeStartX;
            const dy = e.clientY - swipeStartY;
            if (isHorizontalSwipe) {
                finishHorizontalSwipe(dx);
            } else if (isVerticalSwipe) {
                finishVerticalSwipe(dy);
            }
            isPotentialSwipe = false;
            isHorizontalSwipe = false;
            isVerticalSwipe = false;
        }
    }

    function onPointerCancel(e) {
        imageStage.releasePointerCapture(e.pointerId);
        pointers = pointers.filter(p => p.id !== e.pointerId);
        isDragging = false;
        isPotentialSwipe = false;
        isHorizontalSwipe = false;
        isVerticalSwipe = false;
    }

    // -------------------------------
    // Инерция + «подпрыгивание»
    // -------------------------------
    function animateInertia() {
        const friction = 0.95;
        velocityX *= friction;
        velocityY *= friction;
        offsetX += velocityX * INERTIA_MULTIPLIER;
        offsetY += velocityY * INERTIA_MULTIPLIER;

        const finalW = baseWidth * scale;
        const finalH = baseHeight * scale;
        const containerW = imageStage.offsetWidth;
        const containerH = imageStage.offsetHeight;

        if (finalW <= containerW) {
            offsetX = 0;
            velocityX = 0;
        } else {
            const maxOffsetX = (finalW - containerW) / 2;
            if (offsetX < -maxOffsetX) {
                offsetX = -maxOffsetX;
                velocityX = -velocityX * 0.3; // сниженный коэффициент отскока
            } else if (offsetX > maxOffsetX) {
                offsetX = maxOffsetX;
                velocityX = -velocityX * 0.3;
            }
        }
        if (finalH <= containerH) {
            offsetY = 0;
            velocityY = 0;
        } else {
            const maxOffsetY = (finalH - containerH) / 2;
            if (offsetY < -maxOffsetY) {
                offsetY = -maxOffsetY;
                velocityY = -velocityY * 0.3;
            } else if (offsetY > maxOffsetY) {
                offsetY = maxOffsetY;
                velocityY = -velocityY * 0.3;
            }
        }

        slideCurrent.style.backgroundSize = `${finalW}px ${finalH}px`;
        const posX = `calc(50% + ${offsetX}px)`;
        const posY = `calc(50% + ${offsetY}px)`;
        slideCurrent.style.backgroundPosition = `${posX} ${posY}`;

        syncZoomSlider();

        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
            requestAnimationFrame(animateInertia);
        } else {
            // Если инерция закончилась и пользователь не удерживает перетаскивание, запускаем snap-back
            if (!isDragging) {
                isSnapBackActive = true;
                slideCurrent.classList.add('snap-back-transition');
                updateBackground(false);
                slideCurrent.addEventListener('transitionend', function handler() {
                    slideCurrent.classList.remove('snap-back-transition');
                    slideCurrent.removeEventListener('transitionend', handler);
                    isSnapBackActive = false;
                });
            }
        }
    }

    // -------------------------------
    // Свайпы на слайды
    // -------------------------------
    function finishHorizontalSwipe(dx) {
        if (isSwipeAnimating) return;
        isSwipeAnimating = true;
        const duration = 300;
        let transitionElement;

        if (dx < -SWIPE_THRESHOLD) {
            slideCurrent.style.transition = `transform ${duration}ms ease`;
            slideNext.style.transition = `transform ${duration}ms ease`;
            slideCurrent.style.transform = 'translateX(-100%)';
            slideNext.style.transform = 'translateX(0)';
            transitionElement = slideNext;
            transitionElement.addEventListener('transitionend', function handler() {
                transitionElement.removeEventListener('transitionend', handler);
                currentImageIndex = (currentImageIndex + 1) % imagesList.length;
                resetZoomParams();
                showImage(currentImageIndex);
                isSwipeAnimating = false;
            });
        } else if (dx > SWIPE_THRESHOLD) {
            slideCurrent.style.transition = `transform ${duration}ms ease`;
            slidePrev.style.transition = `transform ${duration}ms ease`;
            slideCurrent.style.transform = 'translateX(100%)';
            slidePrev.style.transform = 'translateX(0)';
            transitionElement = slidePrev;
            transitionElement.addEventListener('transitionend', function handler() {
                transitionElement.removeEventListener('transitionend', handler);
                currentImageIndex = (currentImageIndex - 1 + imagesList.length) % imagesList.length;
                resetZoomParams();
                showImage(currentImageIndex);
                isSwipeAnimating = false;
            });
        } else {
            slideCurrent.style.transition = `transform ${duration}ms ease`;
            if (dx < 0) {
                slideCurrent.style.transform = 'translateX(0)';
                slideNext.style.transition = `transform ${duration}ms ease`;
                slideNext.style.transform = 'translateX(100%)';
                transitionElement = slideNext;
            } else {
                slideCurrent.style.transform = 'translateX(0)';
                slidePrev.style.transition = `transform ${duration}ms ease`;
                slidePrev.style.transform = 'translateX(-100%)';
                transitionElement = slidePrev;
            }
            transitionElement.addEventListener('transitionend', function handler() {
                transitionElement.removeEventListener('transitionend', handler);
                isSwipeAnimating = false;
            });
        }
        setTimeout(() => { isSwipeAnimating = false; }, duration + 50);
    }

    function finishVerticalSwipe(dy) {
        modalContent.style.transition = 'transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease';
        if (dy > SWIPE_CLOSE_THRESHOLD || dy < -SWIPE_CLOSE_THRESHOLD) {
            modalContent.style.transform = dy > 0 ? 'translateY(100%)' : 'translateY(-100%)';
            modalContent.style.opacity = '0';
            modalContent.addEventListener('transitionend', function _close() {
                modalContent.removeEventListener('transitionend', _close);
                closeModalWindow(true);
            });
        } else {
            modalContent.style.transform = 'translateY(0)';
            modalContent.style.opacity = '1';
            document.body.style.setProperty('--overlay-opacity', 1);
            document.body.style.setProperty('--gallery-blur', '4px');
            modalContent.style.setProperty('--modal-dimming', 0);
        }
    }

    // -------------------------------
    // Pinch-утилиты, double click
    // -------------------------------
    function getPinchDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    function getPinchCenter(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    }

    // Двойной клик => при scale=1 => scale=2.5
    function handleDoublePress(e) {
        startZoomAnimation();

        const rect = imageStage.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const cursorX = e.clientX;
        const cursorY = e.clientY;

        let newScale = (scale === 1) ? MID_SCALE : 1;
        if (newScale > MAX_SCALE) newScale = MAX_SCALE;

        const ds = newScale - scale;
        const dx = cursorX - centerX;
        const dy = cursorY - centerY;
        offsetX -= dx * ds;
        offsetY -= dy * ds;

        scale = newScale;
        updateBackground(false);
    }

    // -------------------------------
    // Клавиши: стрелки, ESC
    // -------------------------------
    window.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) {
            if (e.key === 'ArrowRight') {
                showNextImage();
            } else if (e.key === 'ArrowLeft') {
                showPreviousImage();
            } else if (e.key === 'Escape') {
                closeModalWindow();
            }
        }
    });
});
