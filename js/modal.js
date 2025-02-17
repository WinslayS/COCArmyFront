document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    // Работаем со слайдами внутри image-stage:
    const imageStage = modalContent.querySelector('.image-stage');
    const slideCurrent = imageStage.querySelector('.slide.current');
    const slideNext = imageStage.querySelector('.slide.next');
    const slidePrev = imageStage.querySelector('.slide.prev');

    const thumbnailsContainer = document.getElementById('thumbnailsContainer');
    const zoomSlider = document.getElementById('zoomSlider');
    const resetZoom = document.getElementById('resetZoom');
    const closeModal = document.getElementById('closeModal');
    const fullscreenModal = document.getElementById('fullscreenModal');

    const MAX_VELOCITY = 2;

    // Переменные состояния
    let scale = 1;
    let offsetX = 0;  // смещение по X (относительно центра)
    let offsetY = 0;  // смещение по Y

    // Для перемещения при зуме
    let isDragging = false;
    let startX = 0, startY = 0;

    // Для свайпа (при scale == 1)
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

    // Управление указателями (для pinch‑масштабирования)
    let pointers = [];
    let startPinchDist = 0;
    let startPinchScale = 1;
    let startPinchCenter = { x: 0, y: 0 };
    // Новые переменные для сохранения начальных смещений
    let startOffsetX = 0;
    let startOffsetY = 0;

    // Текущий индекс и список изображений
    let currentImageIndex = 0;
    let imagesList = [];
    let layoutsData = [];
    let thumbnailData = {};

    let lastMoveTime = 0;
    let velocityX = 0;
    let velocityY = 0;

    let isSwipeAnimating = false;

    // Загрузка JSON (пример)
    try {
        const layoutsResponse = await fetch('data/layouts.json');
        layoutsData = await layoutsResponse.json();

        const thumbnailsResponse = await fetch('data/thumbnailData.json');
        thumbnailData = await thumbnailsResponse.json();
    } catch (error) {
        console.error('Ошибка загрузки JSON:', error);
        return;
    }

    // Ползунок зума
    zoomSlider.addEventListener('input', (e) => {
        const newScale = parseFloat(e.target.value);
        applyZoomCenterPreserving(newScale);
    });

    resetZoom.addEventListener('click', () => {
        let newScale = (scale === 1) ? 2 : 1;
        // Добавляем класс для анимации
        slideCurrent.classList.add('zoom-animating');
        applyZoomCenterPreserving(newScale);
        // После окончания анимации убираем класс
        slideCurrent.addEventListener('transitionend', function handler() {
            slideCurrent.classList.remove('zoom-animating');
            slideCurrent.removeEventListener('transitionend', handler);
        });
    });

    // Обработчик кнопки полноэкранного режима
    fullscreenModal.addEventListener('click', () => {
        console.log('Fullscreen button clicked');
        if (!document.fullscreenElement) {
            // Запрашиваем fullscreen для модального окна.
            // При необходимости можно заменить modal на modalContent.
            modal.requestFullscreen().catch(err => {
                console.error(`Ошибка перехода в полноэкранный режим: ${err.message}`);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.error(`Ошибка выхода из полноэкранного режима: ${err.message}`);
            });
        }
    });

    // Масштабирование относительно точки (если координаты не заданы – используется центр)
    function applyZoomCenterPreserving(newScale, centerX, centerY) {
        const rect = slideCurrent.getBoundingClientRect();
        // Если координаты не заданы – берём центр контейнера
        if (centerX === undefined || centerY === undefined) {
            centerX = rect.width / 2;
            centerY = rect.height / 2;
        }
        const deltaScale = newScale - scale;
        // Корректируем смещения так, чтобы точка (centerX, centerY) оставалась неподвижной
        offsetX -= (centerX - rect.width / 2) * deltaScale;
        offsetY -= (centerY - rect.height / 2) * deltaScale;

        scale = Math.max(1, Math.min(newScale, 3));
        updateBackground();
        syncZoomSlider();
    }

    function syncZoomSlider() {
        zoomSlider.value = scale.toFixed(1);
        const fillPercent = ((scale - zoomSlider.min) / (zoomSlider.max - zoomSlider.min)) * 100;
        zoomSlider.style.setProperty('--slider-fill', `${fillPercent}%`);
    }

    // Функции обновления слайдов
    // Обновляет фон текущего слайда с учетом зума и смещения
    function updateBackground() {
        constrainOffsets();
        slideCurrent.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    // Ограничение смещений так, чтобы изображение не "выходило" за границы
    function constrainOffsets() {
        const containerWidth = imageStage.offsetWidth;
        const containerHeight = imageStage.offsetHeight;
        const scaledWidth = containerWidth * scale;
        const scaledHeight = containerHeight * scale;
        const maxOffsetX = (scaledWidth - containerWidth) / 2;
        const maxOffsetY = (scaledHeight - containerHeight) / 2;
        offsetX = Math.max(-maxOffsetX, Math.min(offsetX, maxOffsetX));
        offsetY = Math.max(-maxOffsetY, Math.min(offsetY, maxOffsetY));
    }

    // Обновляет фон всех трёх слайдов: current, next и prev
    function updateSlides() {
        // Текущий слайд
        slideCurrent.style.backgroundImage = `url(${imagesList[currentImageIndex]})`;
        // Следующий слайд (циклично)
        const nextIndex = (currentImageIndex + 1) % imagesList.length;
        slideNext.style.backgroundImage = `url(${imagesList[nextIndex]})`;
        // Предыдущий слайд (циклично)
        const prevIndex = (currentImageIndex - 1 + imagesList.length) % imagesList.length;
        slidePrev.style.backgroundImage = `url(${imagesList[prevIndex]})`;

        // Сбрасываем трансформации и переходы
        slideCurrent.style.transition = 'none';
        slideNext.style.transition = 'none';
        slidePrev.style.transition = 'none';
        slideCurrent.style.transform = 'translateX(0)';
        slideNext.style.transform = 'translateX(100%)';
        slidePrev.style.transform = 'translateX(-100%)';
    }

    // Сброс параметров зума (при переходе на новое изображение)
    function resetZoomParams() {
        scale = 1;
        offsetX = 0;
        offsetY = 0;
    }

    // Отображение изображения
    function showImage(index) {
        if (index < 0 || index >= imagesList.length) return;
        currentImageIndex = index;
        resetZoomParams();

        // Сбрасываем фон слайдов перед загрузкой
        slideCurrent.style.backgroundImage = 'none';
        modalContent.classList.add('loading');

        const fullImage = imagesList[index];
        const image = new Image();
        image.src = fullImage;

        image.onload = () => {
            modalContent.classList.remove('loading');
            // Подгоняем размеры modalContent по соотношению сторон
            const aspectRatio = image.width / image.height;
            const containerWidth = modalContent.offsetWidth;
            modalContent.style.height = `${containerWidth / aspectRatio}px`;
            const previewArea = modalContent.querySelector('.preview-area');

            // Устанавливаем фон для текущего слайда и обновляем соседние
            slideCurrent.style.backgroundImage = `url(${fullImage})`;
            updateSlides();
            updateBackground();
            syncZoomSlider();
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

    // Открытие/закрытие модалки
    const images = document.querySelectorAll('.zoomable');
    images.forEach((img) => {
        img.addEventListener('click', (e) => {
            // Задаём transform-origin на основе координат клика относительно окна
            const originX = (e.clientX / window.innerWidth) * 100;
            const originY = (e.clientY / window.innerHeight) * 100;
            modalContent.style.transformOrigin = `${originX}% ${originY}%`;

            const imageId = img.dataset.id;
            imagesList = thumbnailData[imageId] || [];
            if (imagesList.length > 0) {
                showImage(0);
                modal.classList.add('show');
                document.body.classList.add('modal-open');

                thumbnailsContainer.innerHTML = '';
                imagesList.forEach((src, idx) => {
                    const thumb = document.createElement('img');
                    thumb.src = src;
                    thumb.classList.add('thumbnail');
                    if (idx === 0) thumb.classList.add('active');
                    thumb.addEventListener('click', () => showImage(idx));
                    thumbnailsContainer.appendChild(thumb);
                });
            } else {
                console.error('Нет изображений для ID:', imageId);
            }
        });
    });

    closeModal.addEventListener('click', () => {
        // При клике на кнопку закрытия запускается анимация закрытия
        closeModalWindow();
    });

    function closeModalWindow(swipeClose = false) {
        // Если открыт полноэкранный режим, выходим из него
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => {
                console.error(`Ошибка выхода из полноэкранного режима: ${err.message}`);
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
                updateBackground();
                syncZoomSlider();

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
            updateBackground();
            syncZoomSlider();

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

    // Масштабирование колесиком
    slideCurrent.addEventListener('wheel', (e) => {
        e.preventDefault();
        // Получаем координаты курсора относительно элемента
        const rect = slideCurrent.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
      
        // Добавляем класс для анимации
        slideCurrent.classList.add('zoom-animating');
      
        const factor = 0.25; // настройте чувствительность
        const deltaFactor = (e.deltaY > 0) ? (1 - factor) : (1 + factor);
        let newScale = scale * deltaFactor;
        newScale = Math.max(1, Math.min(newScale, 3));
      
        applyZoomCenterPreserving(newScale, cursorX, cursorY);
      
        // Убираем класс анимации после завершения transition
        slideCurrent.addEventListener('transitionend', function handler() {
          slideCurrent.classList.remove('zoom-animating');
          slideCurrent.removeEventListener('transitionend', handler);
        });
    }, { passive: false });

    // Pointer Events (включая обработку pinch‑масштабирования)
    imageStage.addEventListener('pointerdown', onPointerDown);
    imageStage.addEventListener('pointermove', onPointerMove);
    imageStage.addEventListener('pointerup', onPointerUp);
    imageStage.addEventListener('pointercancel', onPointerCancel);

    function onPointerDown(e) {
        // Если анимация свайпа уже идёт, игнорируем новые pointer‑события
        if (isSwipeAnimating) return;
        if (e.target.closest('.control-button, #closeModal, #zoomSliderContainer, .thumbnail')) {
            return;
        }
        imageStage.setPointerCapture(e.pointerId);
        pointers.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
        
        // Если появляется второй палец – запускаем pinch‑масштабирование:
        if (pointers.length === 2) {
            startPinchDist = getPinchDistance(pointers[0], pointers[1]);
            startPinchScale = scale;
            startPinchCenter = getPinchCenter(pointers[0], pointers[1]);
            startOffsetX = offsetX;
            startOffsetY = offsetY;
        }
        
        // Обработка двойного нажатия и начало отслеживания свайпа/перетаскивания
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
        // Обновляем координаты указателей
        for (let i = 0; i < pointers.length; i++) {
            if (pointers[i].id === e.pointerId) {
                pointers[i].x = e.clientX;
                pointers[i].y = e.clientY;
                break;
            }
        }
        
        // Если задействовано два пальца – выполняем pinch‑масштабирование (оставляем без изменений)
        if (pointers.length === 2) {
            let newDist = getPinchDistance(pointers[0], pointers[1]);
            let newPinchCenter = getPinchCenter(pointers[0], pointers[1]);
            let pinchRatio = newDist / startPinchDist;
            let newScale = startPinchScale * pinchRatio;
            newScale = Math.max(1, Math.min(newScale, 3));
            const rect = slideCurrent.getBoundingClientRect();
            offsetX = startOffsetX - (((newPinchCenter.x - rect.left) - rect.width / 2) * (newScale - startPinchScale));
            offsetY = startOffsetY - (((newPinchCenter.y - rect.top) - rect.height / 2) * (newScale - startPinchScale));
            scale = newScale;
            updateBackground();
            syncZoomSlider();
            return;
        }
        
        // Если идёт перетаскивание (drag) – рассчитываем скорость и обновляем смещения:
        if (isDragging) {
            const now = Date.now();
            const dt = now - lastMoveTime || 16;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Вычисляем скорость перемещения
            velocityX = dx / dt;
            velocityY = dy / dt;
            
            // Ограничиваем скорость, чтобы инерция не была слишком сильной
            velocityX = Math.max(-MAX_VELOCITY, Math.min(velocityX, MAX_VELOCITY));
            velocityY = Math.max(-MAX_VELOCITY, Math.min(velocityY, MAX_VELOCITY));
            
            offsetX += dx;
            offsetY += dy;
            startX = e.clientX;
            startY = e.clientY;
            lastMoveTime = now;
            updateBackground();
        }
        // Если потенциальный свайп – оставляем существующую логику
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
            }
            else if (isVerticalSwipe) {
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
            // По окончании перетаскивания запускаем анимацию инерции:
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

    function animateInertia() {
        const friction = 0.95;
        velocityX *= friction;
        velocityY *= friction;
        offsetX += velocityX * 16;
        offsetY += velocityY * 16;
        updateBackground();
        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
            requestAnimationFrame(animateInertia);
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

    // Завершаем свайпы
    function finishHorizontalSwipe(dx) {
        // Если анимация уже идёт, игнорируем повторный свайп
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
                updateSlides();
                updateBackground();
                syncZoomSlider();
                updateThumbnails();
                scrollToActiveThumbnail();
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
                updateSlides();
                updateBackground();
                syncZoomSlider();
                updateThumbnails();
                scrollToActiveThumbnail();
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
        
        // На случай, если событие transitionend не сработает – сбрасываем флаг через timeout
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
    
    // Pinch‑утилиты
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

    // Двойной клик/тап
    function handleDoublePress(e) {
        const rect = slideCurrent.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        let newScale = (scale === 1) ? 2 : 1;
        slideCurrent.classList.add('zoom-animating');
        applyZoomCenterPreserving(newScale, cursorX, cursorY);
        slideCurrent.addEventListener('transitionend', function handler() {
            slideCurrent.classList.remove('zoom-animating');
            slideCurrent.removeEventListener('transitionend', handler);
        });
    }

    // Клавиши управления
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