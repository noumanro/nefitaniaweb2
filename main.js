
    // Rellena año del footer (comprobando existencia)
const footerYearEl = document.getElementById('y');
if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();

// Manejo simple de formulario (solo front)
function handleSubmit(e){
  e.preventDefault();
    const ok = document.getElementById('form-ok');
    if (ok) ok.style.display = 'block';
  e.target.reset();
  return false;
}

// ========================================
// MODAL DEL FORMULARIO (defensivo)
// ========================================
const abrirFormBtn = document.getElementById('abrir-form');
const modalForm = document.getElementById('modal-form');
const cerrarFormBtn = document.getElementById('cerrar-form');

if (abrirFormBtn && modalForm) {
    abrirFormBtn.onclick = function() {
        modalForm.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
}

if (cerrarFormBtn && modalForm) {
    cerrarFormBtn.onclick = function() {
        modalForm.style.display = 'none';
        document.body.style.overflow = '';
    };
}

// Cerrar modal al hacer clic en el fondo oscuro
if (modalForm) {
    modalForm.onclick = function(e) {
        if (e.target === this) {
            modalForm.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Evitar scroll de fondo en móviles cuando el modal está abierto
    try {
        modalForm.addEventListener('touchmove', function(e){
            if (getComputedStyle(modalForm).display === 'flex') {
                e.preventDefault();
            }
        }, { passive: false });
    } catch (err) {
        // silently ignore
    }
}

// Cerrar modal con tecla Escape (solo si está abierto)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (modalForm && getComputedStyle(modalForm).display === 'flex') {
            modalForm.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
});

// Helper global: asigna la mejor URL válida a un elemento <img>
function assignBestSrc(imgEl, candidates) {
    const seen = [];
    let i = 0;
    function next() {
        if (i >= candidates.length) {
            imgEl.onerror = null;
            // eliminar imagen rota después de un pequeño retraso
            setTimeout(()=> { if (imgEl && imgEl.parentNode) imgEl.parentNode.removeChild(imgEl); }, 300);
            return;
        }
        const url = candidates[i++];
        if (!url || seen.indexOf(url) !== -1) return next();
        seen.push(url);
        imgEl.onerror = function(){ next(); };
        try { imgEl.src = encodeURI(url); } catch(e){ next(); }
    }
    next();
}

// ========================================
// CARRUSEL PRINCIPAL (QUIÉNES SOMOS)
// ========================================
let currentSlide = 0;
let totalSlides = 0;
const carouselContainer = document.getElementById('carousel-container');
const dotsContainer = document.getElementById('carousel-dots');

// Cargar imágenes dinámicamente de la carpeta nosotros
async function loadMainCarouselImages() {
    // Si los contenedores no existen en esta página, salir sin hacer nada
    if (!carouselContainer || !dotsContainer) return;
    // Preferir ruta local cuando se está desarrollando en localhost/127.0.0.1
    let baseUrl = 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/image/nosotros';
    try {
        const host = (window && window.location && window.location.hostname) ? window.location.hostname : '';
        const isLocal = host === '' || host === 'localhost' || host.startsWith('127.') || host === '::1';
        if (isLocal) {
            // usar ruta relativa al servidor local (carpeta `image/nosotros`)
            baseUrl = 'image/nosotros';
        }
    } catch (e) {
        // en caso de error, seguir usando raw.githubusercontent
    }

    // Intentar usar índice pre-generado `images_index.json` si existe (más rápido y preciso)
    let index = null;
    try {
        const res = await fetch('images_index.json', { cache: 'no-store' });
        if (res.ok) index = await res.json();
    } catch (e) {
        index = null;
    }
    const maxImages = 24; // Limitar intentos para evitar rate limit y flicker
    const validImages = [];

    // Si hay índice y contiene la carpeta 'nosotros', usarlo (los paths en el index son relativos a `image/`)
    if (index && index['nosotros'] && index['nosotros'].length) {
        for (const p of index['nosotros']) {
            // p es 'nosotros/1.webp' etc -> local path 'image/nosotros/1.webp'
            validImages.push(`image/${p}`);
        }
    } else {
        // Buscar imágenes existentes deteniéndonos tras varios fallos seguidos
        let missesInRow = 0;
        for (let i = 1; i <= maxImages; i++) {
            const imgUrl = `${baseUrl}/${i}.webp`;
            try {
                const res = await fetch(imgUrl, { method: 'HEAD', cache: 'no-store' });
                if (res.ok) {
                    validImages.push(imgUrl);
                    missesInRow = 0;
                } else {
                    missesInRow++;
                }
            } catch {
                missesInRow++;
            }
            if (missesInRow >= 5 && validImages.length > 0) break; // cortar pronto
        }
    }
    
    if (validImages.length === 0) {
        console.warn('No se encontraron imágenes en la galería de miembros');
        return;
    }
    
    totalSlides = validImages.length;
    
    // Limpiar contenedor y dots
    carouselContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    // Placeholder de carga mientras detectamos imágenes
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); pointer-events:none;';
    loadingEl.innerHTML = '<div style="padding:8px 12px; background:rgba(0,0,0,0.6); border-radius:8px; font-size:0.9rem;">Cargando imágenes…</div>';
    if (carouselContainer.parentElement && !carouselContainer.parentElement.style.position)
        carouselContainer.parentElement.style.position = 'relative';
    carouselContainer.parentElement.appendChild(loadingEl);

    // Agregar imágenes al carrusel con lazy/async para evitar parpadeos
    validImages.forEach((url, index) => {
        const img = document.createElement('img');
        if (index > 0) img.loading = 'lazy';
        img.decoding = 'async';
        img.style.cssText = 'width:100%; height:auto; object-fit:contain; flex-shrink:0; display:block; cursor:pointer; opacity:0; transition:opacity .28s ease, transform .28s ease;';
        img.classList.add('fade-in');

        // probar varias variantes de ruta: tal cual, con / delante, sin 'image/' y con 'image/' prefijo
        const candidates = [url, `/${url.replace(/^\/+/, '')}`, url.replace(/^image\//, ''), `image/${url.replace(/^\/+/, '').replace(/^image\//, '')}`];
        assignBestSrc(img, candidates);

        img.onload = function(){ this.classList.add('visible'); this.style.opacity = '1'; };
        img.onclick = function() { openImageModal(this.src); };
        carouselContainer.appendChild(img);

        // Crear dot
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.dataset.slide = index;
        dot.style.cssText = `width:8px; height:8px; border-radius:50%; background:${index === 0 ? '#ff6a00' : 'rgba(255,255,255,0.5)'}; cursor:pointer; transition:all 0.2s;`;
        dot.onclick = function() {
            currentSlide = parseInt(this.dataset.slide);
            updateCarousel();
        };
        dotsContainer.appendChild(dot);
    });

    // Quitar loading
    loadingEl.remove();
    
    // Inicializar carrusel
    updateCarousel();
    initMainCarouselDrag();
    
    // Auto-avance del carrusel solo cuando esté visible
    let carouselInterval = null;
    
    const startCarouselAutoplay = () => {
        if (!carouselInterval) {
            carouselInterval = setInterval(function() {
                currentSlide = (currentSlide + 1) % totalSlides;
                updateCarousel();
            }, 5000);
        }
    };
    
    const stopCarouselAutoplay = () => {
        if (carouselInterval) {
            clearInterval(carouselInterval);
            carouselInterval = null;
        }
    };
    
    // Intersection Observer para pausar cuando no esté visible
    const carouselObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCarouselAutoplay();
            } else {
                stopCarouselAutoplay();
            }
        });
    }, { threshold: 0.1 });
    
    if (carouselContainer) {
        carouselObserver.observe(carouselContainer);
    }
}

function updateCarousel() {
    if (!carouselContainer || !dotsContainer || totalSlides === 0) return;

    const translateX = -currentSlide * 100;
    carouselContainer.style.transform = `translateX(${translateX}%)`;

    // Actualizar dots
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.style.background = '#ff6a00';
        } else {
            dot.style.background = 'rgba(255,255,255,0.5)';
        }
    });
}

const nextImgBtn = document.getElementById('next-img');
const prevImgBtn = document.getElementById('prev-img');
if (nextImgBtn) {
    nextImgBtn.onclick = function() {
        if (totalSlides === 0) return;
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    };
}
if (prevImgBtn) {
    prevImgBtn.onclick = function() {
        if (totalSlides === 0) return;
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    };
}

// Cargar imágenes al iniciar (solo si el DOM tiene el carrusel)
if (carouselContainer && dotsContainer) {
    loadMainCarouselImages();
}

// Funcionalidad de arrastrar para el carrusel principal
function initMainCarouselDrag() {
    const container = document.getElementById('carousel-container');
    if (!container) return;
    
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let initialTransform = 0;
    let dragThreshold = 50;

    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';
    container.style.cursor = 'grab';
    
    container.querySelectorAll('img').forEach(img => {
        img.draggable = false;
    });

    function startDrag(e) {
        isDragging = true;
        container.style.cursor = 'grabbing';
        container.style.transition = 'none';
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        startX = clientX;
        currentX = clientX;
        
        const transform = container.style.transform;
        const match = transform.match(/translateX\((-?\d+(?:\.\d+)?)%\)/);
        initialTransform = match ? parseFloat(match[1]) : 0;
        
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        currentX = clientX;
        const deltaX = currentX - startX;
        const containerWidth = container.offsetWidth;
        const deltaPercent = (deltaX / containerWidth) * 100;
        
        const newTransform = initialTransform + deltaPercent;
        container.style.transform = `translateX(${newTransform}%)`;
        
        e.preventDefault();
    }

    function endDrag(e) {
        if (!isDragging) return;
        
        isDragging = false;
        container.style.cursor = 'grab';
        container.style.transition = 'transform 0.3s ease';
        
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > dragThreshold) {
            if (deltaX > 0) {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            } else {
                currentSlide = (currentSlide + 1) % totalSlides;
            }
        }
        
        updateCarousel();
        e.preventDefault();
    }

    container.addEventListener('mousedown', startDrag);
    container.addEventListener('mousemove', drag);
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);
    container.addEventListener('touchstart', startDrag);
    container.addEventListener('touchmove', drag);
    container.addEventListener('touchend', endDrag);
}

// ========================================
// MODAL DE IMAGEN
// ========================================
function openImageModal(imageSrc) {
    try {
        const modalImgContent = document.getElementById('modal-image-content');
        const modalImage = document.getElementById('modal-image');
        if (modalImgContent && modalImage) {
            // Preparar loader
            let loader = modalImage.querySelector('.modal-img-loader');
            if (!loader) {
                loader = document.createElement('div');
                loader.className = 'modal-img-loader';
                loader.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:10001; color:#fff; font-weight:700; background:rgba(0,0,0,0.4);';
                loader.innerHTML = '<div style="text-align:center"><div style="font-size:2rem; margin-bottom:8px">⏳</div><div style="font-size:0.95rem; opacity:0.95">Cargando imagen…</div></div>';
                modalImage.appendChild(loader);
            }

            // abrir modal y bloquear scroll
            modalImage.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Reset src antes de asignar
            modalImgContent.src = '';

            // Handlers
            function onLoaded(){
                if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
                modalImgContent.removeEventListener('load', onLoaded);
                modalImgContent.removeEventListener('error', onError);
            }
            function onError(){
                if (loader) loader.innerHTML = '<div style="text-align:center"><div style="font-size:2rem; margin-bottom:8px">⚠️</div><div style="font-size:0.95rem; opacity:0.95">No se pudo cargar la imagen</div></div>';
                modalImgContent.removeEventListener('load', onLoaded);
                modalImgContent.removeEventListener('error', onError);
            }

            modalImgContent.addEventListener('load', onLoaded);
            modalImgContent.addEventListener('error', onError);

            // asignar src después de montar handlers para capturar eventos
            modalImgContent.src = imageSrc;
        }
    } catch (err) {
        console.error('openImageModal error:', err);
    }
}

const cerrarImageBtn = document.getElementById('cerrar-image');
const modalImageRoot = document.getElementById('modal-image');
if (cerrarImageBtn && modalImageRoot) {
    cerrarImageBtn.onclick = function() {
        // limpiar src para detener descargas y liberar memoria
        const img = document.getElementById('modal-image-content');
        if (img) img.src = '';
        modalImageRoot.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Cerrar modal de imagen al hacer clic en el fondo
    modalImageRoot.onclick = function(e) {
        if (e.target === this) {
            const img = document.getElementById('modal-image-content');
            if (img) img.src = '';
            modalImageRoot.style.display = 'none';
            document.body.style.overflow = '';
        }
    };

    // Cerrar modal de imagen con ESC (defensivo)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && getComputedStyle(modalImageRoot).display === 'flex') {
            modalImageRoot.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

// ========================================
// GOOGLE SHEETS LIVE FETCH (GENÉRICO)
// ========================================
(async function initGoogleSheetLive() {
    try {
        const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1P4B6NA_-q9XMxfhmcas9I5xbGFGieyMPUFntimALbzo/edit?usp=sharing';
        if (window.GoogleSheetHelper) {
            const rows = await window.GoogleSheetHelper.fetchSheet({ url: SHEET_URL, prefer: 'auto' });
            // Exponer datos para otras partes de la web si se requiere
            window.__SHEET_ROWS__ = rows;
            console.log('📄 Google Sheet rows:', rows);
        } else {
            console.warn('GoogleSheetHelper no cargado');
        }
    } catch (err) {
        console.warn('No se pudo consultar Google Sheets:', err);
    }
})();

// ========================================
// DESCARGAS: toggle detalles
// ========================================
const downloadInfoBtn = document.getElementById('download-info');
const downloadDetails = document.getElementById('download-details');
if (downloadInfoBtn && downloadDetails) {
    downloadInfoBtn.addEventListener('click', function() {
        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', (!expanded).toString());
        if (expanded) {
            downloadDetails.style.display = 'none';
        } else {
            downloadDetails.style.display = 'block';
        }
    });
}

// Comprobar si el ZIP del texture pack existe; si no, desactivar el enlace
(function checkTexturePack(){
    const dlAnchor = document.getElementById('download-texture');
    if (!dlAnchor) return;
    const localUrl = dlAnchor.getAttribute('href');
    const rawUrl = 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/texturepack/nefitania-texturepack.zip';
    // Probar local primero
    (async function(){
        try {
            const controller = new AbortController();
            const t = setTimeout(()=> controller.abort(), 4000);
            const res = await fetch(localUrl, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
            clearTimeout(t);
            if (res.ok) return; // local available
        } catch (e) {
            // fallthrough to raw
        }

        // Probar raw.githubusercontent
        try {
            const controller2 = new AbortController();
            const t2 = setTimeout(()=> controller2.abort(), 4000);
            const res2 = await fetch(rawUrl, { method: 'HEAD', cache: 'no-store', signal: controller2.signal });
            clearTimeout(t2);
            if (res2.ok) {
                dlAnchor.href = rawUrl; // usar raw como fallback
                return;
            }
        } catch (e) {
            // fallthrough
        }

        // Si llegamos aquí, deshabilitar el enlace
        dlAnchor.classList.add('disabled');
        dlAnchor.style.opacity = '0.6';
        dlAnchor.title = 'Archivo no disponible en el repositorio';
    })();
})();

// Mejora UX: si el enlace está deshabilitado, interceptar clic y ofrecer copiar el enlace raw o mostrar instrucciones
(function enhanceDownloadUX(){
    const dlAnchor = document.getElementById('download-texture');
    if (!dlAnchor) return;
    const rawUrl = 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/texturepack/nefitania-texturepack.zip';

    dlAnchor.addEventListener('click', function(e){
        if (this.classList.contains('disabled')) {
            e.preventDefault();
            // mostrar detalles expandidos con instrucción si existe el panel
            const details = document.getElementById('download-details');
            if (details) {
                details.style.display = 'block';
                // añadir mensaje solo una vez
                if (!document.getElementById('download-missing-note')) {
                    const note = document.createElement('div');
                    note.id = 'download-missing-note';
                    note.style.cssText = 'margin-top:8px; padding:10px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.03); color:var(--muted);';
                    note.innerHTML = `El paquete no está disponible localmente. Puedes intentar descargarlo desde GitHub raw: <code style="word-break:break-all;">${rawUrl}</code> <button id="copy-raw" class="btn" style="margin-left:8px;">Copiar enlace</button>`;
                    details.appendChild(note);

                    const copyBtn = document.getElementById('copy-raw');
                    copyBtn.addEventListener('click', async function(){
                        try {
                            await navigator.clipboard.writeText(rawUrl);
                            this.textContent = 'Copiado ✓';
                            setTimeout(()=> this.textContent = 'Copiar enlace', 2500);
                        } catch (err) {
                            alert('No fue posible copiar el enlace al portapapeles. En su lugar, selecciona y copia manualmente.');
                        }
                    });
                }
            } else {
                alert('El texture pack no está disponible. Revisa la carpeta `texturepack/` en el repositorio o contacta a un administrador.');
            }
        }
    });
})();

// ========================================
// AUDIO FLOTANTE (botón + meter)
// ========================================
;(function initFloatingAudio(){
    const MUSIC_BUTTON_ID = 'music-button';
    const MUSIC_METER_ID = 'music-meter';
    const MUSIC_AUDIO_ID = 'music-player';

    // Crear elementos si no existen en el DOM
    let musicBtn = document.getElementById(MUSIC_BUTTON_ID);
    let musicMeter = document.getElementById(MUSIC_METER_ID);
    let audioEl = document.getElementById(MUSIC_AUDIO_ID);

    if (!musicBtn) {
        musicBtn = document.createElement('button');
        musicBtn.id = MUSIC_BUTTON_ID;
        musicBtn.title = 'Reproducir / Pausar música (tecla M)';
        musicBtn.innerHTML = '<span class="icon">♫</span>';
        document.body.appendChild(musicBtn);
    }

    if (!musicMeter) {
        musicMeter = document.createElement('div');
        musicMeter.id = MUSIC_METER_ID;
        musicMeter.innerHTML = '<i></i>';
        document.body.appendChild(musicMeter);
    }

    if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = MUSIC_AUDIO_ID;
        audioEl.preload = 'auto';
        audioEl.loop = true;
        audioEl.crossOrigin = 'anonymous';
        audioEl.style.display = 'none';
        document.body.appendChild(audioEl);

        // Intentar establecer el audio desde el recurso local primero, luego fallback a raw.githubusercontent
        (async function setAudioSourceWithFallback(){
            // Probar varios candidatos locales (mp3/ogg) dentro de `song/` y `assets/` y luego raw.githubusercontent
            const candidatesLocal = [
                'song/nefitania.ogg',
                'song/nefitania.mp3',
                'song/nefitania-theme.mp3',
                'song/diabla.ogg',
                'assets/nefitania-theme.mp3'
            ];
            const rawPath = 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/assets/nefitania-theme.mp3';
            for (const localPath of candidatesLocal) {
                try {
                    const controller = new AbortController();
                    const t = setTimeout(()=> controller.abort(), 3000);
                    const res = await fetch(localPath, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
                    clearTimeout(t);
                    if (res && res.ok) {
                        audioEl.src = localPath;
                        return;
                    }
                } catch (e) {
                    // seguir probando siguientes candidatos
                }
            }
            // Intentar raw.githubusercontent como último recurso
            try {
                const controller2 = new AbortController();
                const t2 = setTimeout(()=> controller2.abort(), 3000);
                const res2 = await fetch(rawPath, { method: 'HEAD', cache: 'no-store', signal: controller2.signal });
                clearTimeout(t2);
                if (res2 && res2.ok) {
                    audioEl.src = rawPath;
                    return;
                }
            } catch (e) {
                // ninguno disponible
            }
            // Si llegamos aquí, no hay audio disponible: desactivar botón
            musicBtn.disabled = true;
            musicBtn.title = 'Audio no disponible (archivo no encontrado)';
            setPlayingUI(false);
        })();
    }

    // Si el archivo de audio no existe, desactivar el botón y mostrar tooltip (evento de carga fallida)
    audioEl.addEventListener('error', function(){
        musicBtn.disabled = true;
        musicBtn.title = 'Audio no disponible (archivo no encontrado)';
        setPlayingUI(false);
    });

    // Verificar existencia del recurso MP3 mediante HEAD para desactivar antes
    (function checkAudioResource(){
        try {
            const url = audioEl.src;
            const controller = new AbortController();
            const t = setTimeout(()=> controller.abort(), 5000);
            fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
                .then(res => {
                    clearTimeout(t);
                    if (!res.ok) {
                        musicBtn.disabled = true;
                        musicBtn.title = 'Audio no disponible (archivo no encontrado)';
                        setPlayingUI(false);
                    }
                })
                .catch(err => {
                    clearTimeout(t);
                    musicBtn.disabled = true;
                    musicBtn.title = 'Audio no disponible (offline o bloqueado)';
                    setPlayingUI(false);
                });
        } catch (e) {
            musicBtn.disabled = true;
            musicBtn.title = 'Audio no disponible';
            setPlayingUI(false);
        }
    })();

    // Restore play state from localStorage
    const key = 'nefitania_music_playing_v1';
    function setPlayingUI(isPlaying){
        if (isPlaying) {
            musicBtn.classList.add('playing');
            // meter progress full when playing
            const meterSpan = musicMeter.querySelector('i');
            if (meterSpan) meterSpan.style.width = '100%';
        } else {
            musicBtn.classList.remove('playing');
            const meterSpan = musicMeter.querySelector('i');
            if (meterSpan) meterSpan.style.width = '0%';
        }
    }

    let saved = false;
    try { saved = localStorage.getItem(key) === '1'; } catch(e) { saved = false; }
    if (saved) {
        // try to autoplay; may be blocked by browser until user interacts — safe fallback
        audioEl.play().then(()=> setPlayingUI(true)).catch(()=> setPlayingUI(false));
    } else {
        setPlayingUI(false);
    }

    function togglePlay(){
        if (audioEl.paused) {
            audioEl.play().then(()=>{
                setPlayingUI(true);
                try{ localStorage.setItem(key,'1'); }catch{}
            }).catch(()=>{
                // Si la reproducción falla (autoplay bloqueado o recurso faltante), desactivar UI amigable
                setPlayingUI(false);
                musicBtn.classList.remove('playing');
                musicBtn.title = 'Haz clic para reproducir (el navegador puede bloquear autoplay)';
            });
        } else {
            audioEl.pause();
            setPlayingUI(false);
            try{ localStorage.setItem(key,'0'); }catch{}
        }
    }

    musicBtn.addEventListener('click', function(e){
        e.preventDefault();
        togglePlay();
    });

    // Keyboard shortcut 'm' or 'M' to toggle
    document.addEventListener('keydown', function(e){
        if (e.key && (e.key.toLowerCase() === 'm')) {
            // avoid toggling when focus on input/textarea
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
            togglePlay();
        }
    });

    // Update meter on timeupdate to have a small animation (simple)
    audioEl.addEventListener('timeupdate', function(){
        const meterSpan = musicMeter.querySelector('i');
        if (!meterSpan) return;
        // make a soft pulsing width between 60% and 100% based on sine of time
        const t = audioEl.currentTime || 0;
        const w = 60 + Math.abs(Math.sin(t * 0.8)) * 40; // 60-100
        meterSpan.style.width = (audioEl.paused ? 0 : `${w}%`);
    });

})();

// ========================================
// PROYECTOS DINÁMICOS (SIN FETCH)
// ========================================
const projectCarousels = {};

// Utilidad: slug a partir del título
function slugify(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40);
}

// Normaliza y codifica la carpeta (acepta con o sin prefijo image/)
function normalizeFolderPath(path) {
    if (!path) return '';
    const p = String(path).trim().replace(/\\/g, '/');
    const withPrefix = p.startsWith('image/') ? p : `image/${p}`;
    // Codificar cada segmento para soportar espacios y caracteres especiales
    const encodedPath = withPrefix
        .split('/')
        .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg))) // no codificar 'image'
        .join('/');
    // Usar URL de GitHub raw para producción
    try {
        // Si la web se sirve desde localhost/127.0.0.1 o file://, preferir ruta relativa local
        const host = (window && window.location && window.location.hostname) ? window.location.hostname : '';
        const isLocal = host === '' || host === 'localhost' || host.startsWith('127.') || host === '::1';
        if (isLocal) {
            // devolver ruta relativa que apunte a la carpeta `image/...` del servidor local
            return `/${encodedPath}`.replace(/^\/+/, '');
        }
    } catch (e) {
        // ignore
    }
    return `https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/${encodedPath}`;
}

// Datos de proyectos embebidos directamente en el código
function getProjectsData() {
    return [
        {
            title: 'Fortaleza de Sauron',
            state: 'Activo',
            text: 'Construcción colaborativa de la base principal con salas temáticas y sistema de defensa.',
            folder_location: 'ojo sauron'
        },
        {
            title: 'Granja XP',
            state: 'En curso',
            text: 'Proyecto de granja de experiencia para el clan.',
            folder_location: 'granja Xp'
        },
        {
            title: 'La Tortuga Destartalada',
            state: 'Nuevo',
            text: 'Construcción especial: creada apartir de la tortuga destartalada en marbella 3.',
            folder_location: 'la tortuga destartalada'
        },
        {
            title: 'Castillo Medieval',
            state: 'Planificado',
            text: 'Gran proyecto de construcción de un castillo medieval con murallas y torres defensivas.',
            folder_location: 'castillo'
        },
        {
            title: 'Ciudad Submarina',
            state: 'En diseño',
            text: 'Ambiciosa ciudad bajo el agua con cúpulas de cristal y jardines acuáticos.',
            folder_location: 'submarina'
        },
        {
            title: 'Torre de Magos',
            state: 'Activo',
            text: 'Torre mística con laboratorios de alquimia y bibliotecas encantadas.',
            folder_location: 'torre'
        }
    ];
}

// Parser de proyecto.txt con formato de bloques { ... }
function parseProjectsTxt(txt) {
    const projects = [];
    if (!txt || typeof txt !== 'string') return projects;

    // Extraer bloques entre llaves
    const blocks = txt.split(/\{\s*[\r\n]?/).slice(1).map(b => b.split(/\}\s*/)[0]);
    for (const block of blocks) {
        const obj = {};
        // Soportar líneas con 'key: value' y texto multi-línea para 'text:' hasta nueva key o fin del bloque
        const lines = block.split(/\r?\n/);
        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            if (!line) { i++; continue; }
            const m = line.match(/^(title|state|text|folder_location)\s*:\s*(.*)$/i);
            if (m) {
                const key = m[1].toLowerCase();
                let val = m[2] || '';
                if (key === 'text') {
                    // Acumular líneas siguientes que no parezcan nuevas keys
                    const parts = [val];
                    let j = i + 1;
                    while (j < lines.length) {
                        const l2 = lines[j];
                        if (/^(title|state|text|folder_location)\s*:/i.test(l2.trim())) break;
                        parts.push(l2.trim());
                        j++;
                    }
                    val = parts.join(' ').trim();
                    i = j - 1;
                }
                obj[key] = val;
            }
            i++;
        }
        if (Object.keys(obj).length) projects.push(obj);
    }
    return projects;
}

// Intenta cargar proyectos desde proyecto.txt, con fallback a datos embebidos
async function fetchProjectsFromTxt() {
    try {
        const res = await fetch('proyecto.txt', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const projects = parseProjectsTxt(text);
        console.log(`proyecto.txt parseado: ${projects.length} proyectos`);
        return projects;
    } catch (err) {
        console.warn('No se pudo cargar proyecto.txt, usando datos embebidos. Motivo:', err);
        return getProjectsData();
    }
}

// Crea el HTML de un proyecto y lo inserta
function renderProjectCard(project) {
    console.log('Renderizando proyecto:', project.title);
    const slug = slugify(project.title || project.folder_location);
    console.log('Slug generado:', slug);
    const wrapper = document.createElement('article');
    wrapper.className = 'project';

    // Contenido principal con estructura consistente
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = project.state || 'Proyecto';

    const h3 = document.createElement('h3');
    h3.textContent = project.title || 'Proyecto';
    h3.style.cssText = 'margin: 8px 0 12px 0; height: 2.4em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;';

    const p = document.createElement('p');
    p.textContent = project.text || '';
    p.style.cssText = 'flex-grow: 1; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;';

    // Carrusel con altura fija
    const outer = document.createElement('div');
    outer.id = `carousel-${slug}`;
    outer.style.cssText = 'margin-top: auto; min-height: 200px;';

    const shell = document.createElement('div');
    shell.style.cssText = 'position:relative; max-width:900px; width:100%; margin:auto; overflow:hidden; border-radius:12px; box-shadow:0 6px 36px rgba(0,0,0,.28);';

    const container = document.createElement('div');
    container.id = `carousel-container-${slug}`;
    container.style.cssText = 'display:flex; transition:transform 0.3s ease; height:auto;';

    const prev = document.createElement('button');
    prev.className = 'carousel-prev';
    prev.dataset.carousel = slug;
    prev.textContent = '‹';
    prev.style.cssText = 'position:absolute; left:12px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.75); color:#fff; border:none; border-radius:50%; width:56px; height:56px; font-size:1.6rem; cursor:pointer; transition:all 0.18s; z-index:10; box-shadow:0 8px 20px rgba(0,0,0,0.45);';

    const next = document.createElement('button');
    next.className = 'carousel-next';
    next.dataset.carousel = slug;
    next.textContent = '›';
    next.style.cssText = 'position:absolute; right:12px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.75); color:#fff; border:none; border-radius:50%; width:56px; height:56px; font-size:1.6rem; cursor:pointer; transition:all 0.18s; z-index:10; box-shadow:0 8px 20px rgba(0,0,0,0.45);';

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    dotsContainer.dataset.carousel = slug;
    dotsContainer.style.cssText = 'position:absolute; bottom:14px; left:50%; transform:translateX(-50%); display:flex; gap:10px;';

    shell.appendChild(container);
    shell.appendChild(prev);
    shell.appendChild(next);
    shell.appendChild(dotsContainer);

    outer.appendChild(shell);

    wrapper.appendChild(tag);
    wrapper.appendChild(h3);
    wrapper.appendChild(p);
    wrapper.appendChild(outer);

    const projectsList = document.getElementById('projects-list');
    console.log('Agregando proyecto al contenedor:', projectsList);
    projectsList.appendChild(wrapper);

    // Cargar imágenes del carrusel
    console.log('Cargando imágenes para:', project.folder_location, 'con slug:', slug);
    
    // Si no hay folder_location, mostrar placeholder directamente
    if (!project.folder_location || project.folder_location.trim() === '') {
        console.warn('Proyecto sin folder_location definida:', project.title);
        showNoImagesPlaceholder(slug, 'Sin carpeta configurada');
        return;
    }
    
    const folder = normalizeFolderPath(project.folder_location);
    loadProjectCarouselFromFolder(folder, slug);
}

// Función auxiliar para mostrar placeholder cuando no hay imágenes
function showNoImagesPlaceholder(carouselName, reason = 'Sin imágenes disponibles') {
    const container = document.getElementById(`carousel-container-${carouselName}`);
    const dotsContainer = document.querySelector(`.carousel-dots[data-carousel="${carouselName}"]`);
    
    if (!container) return;
    
    // Limpiar contenido existente
    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    // Crear placeholder
    const placeholder = document.createElement('div');
    placeholder.style.cssText = 'width:100%; height:100%; background:linear-gradient(135deg, rgba(255,106,0,0.08), rgba(255,106,0,0.02)); display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:0.9rem; flex-shrink:0; flex-direction:column; gap:12px; border-radius:8px; border:1px dashed rgba(255,106,0,0.2);';
    
    let icon = '📷';
    let subtitle = '';
    // Si es sin carpeta, mostrar el mensaje de configuración
    if (reason.includes('carpeta')) {
        icon = '📁';
        subtitle = 'Agrega <code>folder_location:</code> en proyecto.txt';
    } else {
        // Si es sin fotos, solo mostrar el ícono y texto
        subtitle = '';
        reason = 'Sin foto';
    }
    placeholder.innerHTML = `
        <div style="font-size:2.5rem; opacity:0.7;">${icon}</div>
        <div style="font-weight:600; text-align:center;">${reason}</div>
        ${subtitle ? `<div style=\"font-size:0.8rem; text-align:center; opacity:0.8; line-height:1.4;\">${subtitle}</div>` : ''}
    `;
    
    container.appendChild(placeholder);
    
    // Ocultar botones de navegación
    const prevBtn = container.parentElement.querySelector('.carousel-prev');
    const nextBtn = container.parentElement.querySelector('.carousel-next');
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
}

// Carga todas las imágenes disponibles en la carpeta de forma más eficiente
function loadProjectCarouselFromFolder(folderPath, carouselName) {
    console.log('Iniciando carga de imágenes para:', carouselName, 'en carpeta:', folderPath);
    const container = document.getElementById(`carousel-container-${carouselName}`);
    const dotsContainer = document.querySelector(`.carousel-dots[data-carousel="${carouselName}"]`);
    
    if (!container) {
        console.error('No se encontró el contenedor del carrusel:', `carousel-container-${carouselName}`);
        return;
    }
    
    if (!dotsContainer) {
        console.error('No se encontró el contenedor de dots:', carouselName);
        return;
    }
    
    // Crear overlay de carga sobre el carrusel
    const shellEl = container.parentElement;
    let overlayEl = shellEl && shellEl.querySelector('.carousel-loading');
    if (!overlayEl && shellEl) {
        overlayEl = document.createElement('div');
        overlayEl.className = 'carousel-loading';
        overlayEl.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.2)); color:#fff; font-weight:600; font-size:0.9rem; z-index:5;';
        overlayEl.innerHTML = '<span style="opacity:.9">Cargando…</span>';
        shellEl.appendChild(overlayEl);
    }
    const removeOverlay = () => { if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl); };

    // Si no hay carpeta definida, mostrar placeholder y salir
    if (!folderPath) {
        console.warn('Proyecto sin folder_location válida. Mostrando placeholder para:', carouselName);
        removeOverlay();
        showNoImagesPlaceholder(carouselName, 'Sin carpeta configurada');
        return;
    }
    

    const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    // Intentar usar images_index.json si está disponible (mapa generado por script)
    async function tryIndexLoad() {
        try {
            const res = await fetch('images_index.json', { cache: 'no-store' });
            if (!res.ok) return false;
            const idx = await res.json();

            // Derivar clave de carpeta: eliminar prefijo hasta 'image/' si existe
            let key = folderPath;
            try {
                // Si folderPath es una URL raw, extraer segmento después 'image/'
                const m = String(folderPath).match(/image\/(.*)$/i);
                if (m && m[1]) key = decodeURIComponent(m[1]);
                else {
                    // si es ruta relativa 'image/...' o solo folder, limpiar
                    key = String(folderPath).replace(/^image\//, '');
                    key = decodeURIComponent(key);
                }
            } catch (e) { key = String(folderPath).replace(/^image\//, ''); }

            // keys in index may use '' or '/'
            if (idx[key] && idx[key].length) {
                idx[key].forEach((p, i) => addImageToCarousel(`image/${p}`, loadedCount++));
                removeOverlay();
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    let loadedCount = 0;

    // Función para agregar una imagen al carrusel
    function addImageToCarousel(imageSrc, index) {
        console.log('Agregando imagen:', imageSrc, 'en índice:', index);
        const imgElement = document.createElement('img');
        imgElement.loading = 'lazy';
        imgElement.style.cssText = 'width:100%; height:auto; object-fit:contain; flex-shrink:0; display:block; cursor:grab; opacity:0; transition:opacity .28s ease;';
        imgElement.classList.add('fade-in');
        // Probar varias variantes de ruta para mayor robustez
        const candidates = [imageSrc, `/${imageSrc.replace(/^\/+/, '')}`, imageSrc.replace(/^image\//, ''), `image/${imageSrc.replace(/^\/+/, '').replace(/^image\//, '')}`];
        assignBestSrc(imgElement, candidates);
        imgElement.onload = function(){ this.classList.add('visible'); this.style.opacity = '1'; };
        
        // Apertura de modal gestionada por la lógica de click/drag en initSingleCarouselDrag
        
        imgElement.draggable = false; // Prevenir arrastrar imagen como archivo
        container.appendChild(imgElement);

        // Crear dot
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.dataset.slide = index;
        dot.dataset.carousel = carouselName;
        dot.style.cssText = `width:8px; height:8px; border-radius:50%; background:${index === 0 ? '#ff6a00' : 'rgba(255,255,255,0.5)'}; cursor:pointer; transition:all 0.2s;`;
        dotsContainer.appendChild(dot);

        // Agregar evento click al dot
        dot.onclick = function () {
            updateProjectCarousel(carouselName, parseInt(this.dataset.slide), container.children.length);
        };

        // Re-inicializar drag cuando se agrega la primera imagen
        if (index === 0) {
            setTimeout(() => {
                initSingleCarouselDrag(carouselName);
            }, 100);
        }
    }

    // Función para mostrar placeholder si no hay imágenes
    function showPlaceholder() {
        console.log('Mostrando placeholder para:', carouselName, 'Imágenes cargadas:', loadedCount);
        if (loadedCount === 0) {
            removeOverlay();
            showNoImagesPlaceholder(carouselName, 'Sin fotos');
        }
    }

    // Primero, intentar usar index y si no, leer el listado del directorio (si el servidor lo permite)
    async function tryDirectoryListing() {
        const usedIndex = await tryIndexLoad();
        if (usedIndex) return true;
        try {
            // Para GitHub raw, intentamos cargar imágenes numeradas (1.webp, 2.webp, etc.)
            const maxImages = 30; // Intentar hasta 30 imágenes
            // Buscar imágenes de forma secuencial para cortar pronto si no hay más
            const validImages = [];
            let missesInRow = 0;
            for (let i = 1; i <= maxImages; i++) {
                const imgUrl = `${folderPath}/${i}.webp`;
                try {
                    const res = await fetch(imgUrl, { method: 'HEAD', cache: 'no-store' });
                    if (res.ok) {
                        validImages.push(imgUrl);
                        missesInRow = 0;
                    } else {
                        missesInRow++;
                    }
                } catch {
                    missesInRow++;
                }
                if (missesInRow >= 5 && validImages.length > 0) break;
            }
            
            if (validImages.length === 0) throw new Error('No se encontraron imágenes');
            
            validImages.forEach((url, idx) => addImageToCarousel(url, loadedCount++));

            // Quitar overlay y preparar estado
            removeOverlay();

            // Inicializar drag si cargamos imágenes
            setTimeout(() => initSingleCarouselDrag(carouselName), 50);

            // Inicializar estado del carrusel y autoplay (comportamiento igual al carrusel principal)
            const total = container.children.length;
            if (!projectCarousels[carouselName]) projectCarousels[carouselName] = { current: 0, total: total };
            projectCarousels[carouselName].total = total;

            let carouselInterval = null;
            const startCarouselAutoplay = () => {
                if (!carouselInterval && total > 1) {
                    carouselInterval = setInterval(() => {
                        projectCarousels[carouselName].current = (projectCarousels[carouselName].current + 1) % projectCarousels[carouselName].total;
                        updateProjectCarousel(carouselName, projectCarousels[carouselName].current, projectCarousels[carouselName].total);
                    }, 5000);
                }
            };
            const stopCarouselAutoplay = () => {
                if (carouselInterval) {
                    clearInterval(carouselInterval);
                    carouselInterval = null;
                }
            };

            // Observer para pausar el autoplay cuando el carrusel no esté visible
            try {
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) startCarouselAutoplay(); else stopCarouselAutoplay();
                    });
                }, { threshold: 0.1 });
                observer.observe(container);
            } catch (e) {
                // Si IntersectionObserver no disponible, iniciar autoplay por defecto
                startCarouselAutoplay();
            }

            return true;
        } catch (e) {
            console.info('No se pudieron cargar imágenes de', folderPath, '-', e.message || e);
            return false;
        }
    }

    // Iniciar: intentar cargar imágenes y si falla, mostrar placeholder
    tryDirectoryListing().then(ok => {
        if (!ok) showPlaceholder();
    });
}

// Eliminar la función loadProjectCarousel ya que no se necesita
function initProjectCarousels() {
    // Inicializar controles para todos los carruseles
    document.querySelectorAll('.carousel-prev').forEach(btn => {
        btn.onclick = function () {
            const carouselName = this.dataset.carousel;
            if (!projectCarousels[carouselName]) projectCarousels[carouselName] = { current: 0, total: 0 };

            const container = document.getElementById(`carousel-container-${carouselName}`);
            const total = container.children.length;
            if (total > 0) {
                projectCarousels[carouselName].current = (projectCarousels[carouselName].current - 1 + total) % total;
                updateProjectCarousel(carouselName, projectCarousels[carouselName].current, total);
            }
        };
    });

    document.querySelectorAll('.carousel-next').forEach(btn => {
        btn.onclick = function () {
            const carouselName = this.dataset.carousel;
            if (!projectCarousels[carouselName]) projectCarousels[carouselName] = { current: 0, total: 0 };

            const container = document.getElementById(`carousel-container-${carouselName}`);
            const total = container.children.length;
            if (total > 0) {
                projectCarousels[carouselName].current = (projectCarousels[carouselName].current + 1) % total;
                updateProjectCarousel(carouselName, projectCarousels[carouselName].current, total);
            }
        };
    });

    // Inicializar funcionalidad de arrastrar para cada carrusel
    initCarouselDragFunctionality();
}

// Funcionalidad de arrastrar carruseles con mouse
function initCarouselDragFunctionality() {
    document.querySelectorAll('[id^="carousel-container-"]').forEach(container => {
        const carouselName = container.id.replace('carousel-container-', '');
        initSingleCarouselDrag(carouselName);
    });
}

// Inicializar drag para un carrusel específico
function initSingleCarouselDrag(carouselName) {
    const container = document.getElementById(`carousel-container-${carouselName}`);
    if (!container || container.dataset.dragInitialized) return;
    
    container.dataset.dragInitialized = 'true';
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let initialTransform = 0;
    let dragThreshold = 3; // Distancia mínima para considerar como drag (muy sensible)
    let slideThreshold = 50; // Distancia mínima para cambiar slide
    let hasDragged = false; // Flag para saber si hubo drag

    // Configurar el contenedor para drag
    container.style.userSelect = 'none';
    container.style.webkitUserSelect = 'none';
    container.style.cursor = 'grab';
    
    // Configurar imágenes para que no se arrastren como archivos
    container.querySelectorAll('img').forEach(img => {
        img.draggable = false;
        img.style.userSelect = 'none';
        img.style.webkitUserSelect = 'none';
    
        // Variables para detectar click vs drag en cada imagen
        let imgStartX = 0;
        let imgStartY = 0;
        let imgClickTime = 0;
    
        // Click para abrir modal - solo si no hay movimiento
        img.addEventListener('mousedown', function(e) {
            imgStartX = e.clientX;
            imgStartY = e.clientY;
            imgClickTime = Date.now();
        });
    
        img.addEventListener('mouseup', function(e) {
            const deltaX = Math.abs(e.clientX - imgStartX);
            const deltaY = Math.abs(e.clientY - imgStartY);
            const clickDuration = Date.now() - imgClickTime;
        
            // Solo abrir si no hubo movimiento Y fue un click rápido
            if (deltaX < 2 && deltaY < 2 && clickDuration < 300) {
                e.preventDefault();
                e.stopPropagation();
                openImageModal(this.src);
            }
        });
    });

    // Limpiar event listeners previos
    container.removeEventListener('mousedown', container._startDrag);
    container.removeEventListener('mousemove', container._drag);
    container.removeEventListener('mouseup', container._endDrag);
    container.removeEventListener('mouseleave', container._endDrag);
    container.removeEventListener('touchstart', container._startDrag);
    container.removeEventListener('touchmove', container._drag);
    container.removeEventListener('touchend', container._endDrag);

    // Funciones de drag
    function startDrag(e) {
        isDragging = true;
        hasDragged = false;
        container.style.cursor = 'grabbing';
        container.style.transition = 'none';
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        currentX = clientX;
        currentY = clientY;
        
        // Obtener transform actual
        const transform = container.style.transform;
        const match = transform.match(/translateX\((-?\d+(?:\.\d+)?)%\)/);
        initialTransform = match ? parseFloat(match[1]) : 0;
        
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        currentX = clientX;
        currentY = clientY;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Marcar que hubo drag si hay movimiento
        if (totalMovement > dragThreshold) {
            hasDragged = true;
        }
        
        // Solo aplicar transformación si hay movimiento horizontal significativo
        if (Math.abs(deltaX) > dragThreshold) {
            const containerWidth = container.offsetWidth;
            const deltaPercent = (deltaX / containerWidth) * 100;
            
            // Aplicar transformación temporal
            const newTransform = initialTransform + deltaPercent;
            container.style.transform = `translateX(${newTransform}%)`;
        }
        
        e.preventDefault();
    }

    function endDrag(e) {
        if (!isDragging) return;
        
        isDragging = false;
        container.style.cursor = 'grab';
        container.style.transition = 'transform 0.3s ease';
        
        const deltaX = currentX - startX;
        const total = container.children.length;
        
        if (!projectCarousels[carouselName]) {
            projectCarousels[carouselName] = { current: 0, total: total };
        }
        
        let newSlide = projectCarousels[carouselName].current;
        
        // Solo cambiar slide si realmente se arrastró horizontalmente
        if (Math.abs(deltaX) > slideThreshold) {
            if (deltaX > 0) {
                // Arrastrar hacia la derecha - ir a slide anterior
                newSlide = (projectCarousels[carouselName].current - 1 + total) % total;
            } else {
                // Arrastrar hacia la izquierda - ir a slide siguiente
                newSlide = (projectCarousels[carouselName].current + 1) % total;
            }
        }
        
        // Aplicar el nuevo slide
        projectCarousels[carouselName].current = newSlide;
        updateProjectCarousel(carouselName, newSlide, total);
        
        // Resetear el flag de drag después de un tiempo
        if (hasDragged) {
            setTimeout(() => {
                hasDragged = false;
            }, 200);
        }
        
        e.preventDefault();
    }

    // Guardar referencias para poder limpiarlas después
    container._startDrag = startDrag;
    container._drag = drag;
    container._endDrag = endDrag;

    // Mouse events
    container.addEventListener('mousedown', startDrag);
    container.addEventListener('mousemove', drag);
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);

    // Touch events para móviles
    container.addEventListener('touchstart', startDrag);
    container.addEventListener('touchmove', drag);
    container.addEventListener('touchend', endDrag);
}

function updateProjectCarousel(carouselName, currentSlide, totalSlides) {
    const container = document.getElementById(`carousel-container-${carouselName}`);
    const dots = document.querySelectorAll(`.carousel-dots[data-carousel="${carouselName}"] .dot`);

    // Actualizar posición
    const translateX = -currentSlide * 100;
    container.style.transform = `translateX(${translateX}%)`;

    // Actualizar dots
    dots.forEach((dot, index) => {
        dot.style.background = index === currentSlide ? '#ff6a00' : 'rgba(255,255,255,0.5)';
    });

    // Guardar estado
    if (!projectCarousels[carouselName]) projectCarousels[carouselName] = {};
    projectCarousels[carouselName].current = currentSlide;
    projectCarousels[carouselName].total = totalSlides;
}

function loadProjects() {
    console.log('Cargando proyectos desde datos embebidos...');
    const projects = getProjectsData();
    console.log('Proyectos encontrados:', projects.length);

    const list = document.getElementById('projects-list');
    if (!list) {
        console.error('No se encontró el contenedor #projects-list');
        return;
    }
    
    list.innerHTML = '';
    projects.forEach((p, index) => {
        console.log(`Renderizando proyecto ${index + 1}: ${p.title}`);
        renderProjectCard(p);
    });

    // Inicializar controles tras renderizar
    initProjectCarousels();
    console.log('Proyectos cargados correctamente');
}

// ========================================
// NAVEGACIÓN ACTIVA
// ========================================
function initActiveNavigation() {
    const navLinks = document.querySelectorAll('.nav .btn[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    const logoHome = document.getElementById('logo-home');
    
    function updateActiveNav() {
        let currentSection = '';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                currentSection = section.id;
            }
        });
        
        // Actualizar links
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentSection}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Logo home activo cuando estamos arriba
        if (logoHome) {
            if (currentSection === '' || currentSection === 'hero') {
                logoHome.classList.add('active');
            } else {
                logoHome.classList.remove('active');
            }
        }
    }
    
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', async function() {
    const projects = await fetchProjectsFromTxt();
    console.log('Cargando proyectos...', projects);
    const list = document.getElementById('projects-list');
    if (!list) {
        console.error('No se encontró #projects-list');
    } else {
        list.innerHTML = '';
        projects.forEach(p => renderProjectCard(p));
        initProjectCarousels();
    }
    initActiveNavigation();
    
    // Inicializar drag para el carrusel principal después de un breve delay
    setTimeout(() => {
        initMainCarouselDrag();
    }, 500);
    
    // Toggle menú móvil
    const toggle = document.getElementById('nav-toggle');
    const actions = document.getElementById('nav-actions');
    if (toggle && actions) {
        toggle.addEventListener('click', () => {
            const isOpen = actions.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        // Cerrar al hacer click en un link
        actions.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            actions.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }));
    }
});
