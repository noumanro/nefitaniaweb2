// ========================================
// CARRUSEL DE SKINS 3D DE MIEMBROS - OPTIMIZADO
// ========================================
let currentSkinIndex = 0;
let skinViewers = [];
let skinsData = [];

// Carga dinámica de la librería skinview3d con fallback local y CDNs
async function ensureSkinview3dLoaded() {
    if (typeof window.skinview3d !== 'undefined') return true;

    function inject(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => resolve(true);
            s.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(s);
        });
    }

    // Pequeña espera para dar tiempo al loader de index.html
    for (let i = 0; i < 5; i++) {
        if (typeof window.skinview3d !== 'undefined') return true;
        await new Promise(r => setTimeout(r, 100));
    }

    // 1) Intentar local
    try {
        await inject('vendor/skinview3d.min.js');
        if (typeof window.skinview3d !== 'undefined') return true;
    } catch (_) { /* continúa */ }

    // 2) Intentar CDN jsDelivr (bundle correcto)
    try {
        await inject('https://cdn.jsdelivr.net/npm/skinview3d@3/bundles/skinview3d.bundle.js');
        if (typeof window.skinview3d !== 'undefined') return true;
    } catch (_) { /* continúa */ }

    // 3) Intentar CDN unpkg (bundle correcto)
    try {
        await inject('https://unpkg.com/skinview3d@3/bundles/skinview3d.bundle.js');
        if (typeof window.skinview3d !== 'undefined') return true;
    } catch (_) { /* continúa */ }

    return false;
}

async function loadMinecraftSkins() {
    console.log('🚀 loadMinecraftSkins() iniciada');
    
    // Detectar si estamos en local o producción
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal 
        ? 'image/skin' 
        : 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/image/skin';
    
    const container = document.getElementById('skins-container');
    const skinInfo = document.getElementById('skin-info');
    console.log('📦 Contenedor de skins:', container);
    
    // Verificar que el contenedor exista
    if (!container) {
        console.warn('❌ Contenedor de skins no encontrado');
        return;
    }

    // Intentar cargar manifest de nombres (skins.json)
    let manifestSkins = null;
    try {
        const res = await fetch(`${baseUrl}/skins.json`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            console.log('📄 skins.json cargado:', data);
            if (Array.isArray(data)) {
                manifestSkins = data
                    .filter(e => e && typeof e.file === 'string' && e.file.toLowerCase().endsWith('.png') && !String(e.file).includes('/'))
                    .map((e, i) => {
                        const file = String(e.file).trim();
                        const fileEncoded = encodeURIComponent(file);
                        const url = `${baseUrl}/${fileEncoded}`;
                        const basename = file.replace(/\.[^.]+$/, '');
                        const inferred = basename.replace(/[\-_]+/g, ' ').trim();
                        const name = typeof e.name === 'string' && e.name.trim() ? e.name.trim() : (inferred || `Miembro ${i + 1}`);
                        const numMatch = basename.match(/(\d+)/);
                        const number = numMatch ? parseInt(numMatch[1], 10) : (i + 1);
                        return { url, number, name, file };
                    });
                console.log('✅ manifestSkins procesado:', manifestSkins);
                if (manifestSkins.length === 0) manifestSkins = null;
            }
        }
    } catch (e) {
        console.warn('⚠️ No se pudo cargar skins.json:', e);
    }

    // Asegurar que la librería esté cargada
    const ok = await ensureSkinview3dLoaded();
    console.log('🎨 skinview3d disponible:', ok);
    
    if (!ok || typeof window.skinview3d === 'undefined') {
        console.error('❌ No se pudo cargar skinview3d; no se mostrarán skins 3D');
        container.innerHTML = `
            <div class="skin-loading" style="text-align:center; padding:60px 20px;">
                <div style="font-size:3rem; margin-bottom:16px;">⚠️</div>
                <p style="color:var(--muted);">No se pudo cargar el visor 3D</p>
                <p style="color:var(--muted); font-size:0.9rem; margin-top:12px;">Revisa tu conexión a internet</p>
            </div>
        `;
        return;
    }
    
    // Usar manifest si existe, si no probar numeración 1-30
    let validSkins = [];
    if (manifestSkins) {
        console.log('✅ Usando manifestSkins:', manifestSkins.length, 'skins');
        validSkins = manifestSkins;
    } else {
        console.log('🔍 No hay manifest, probando numeración 1-30...');
        const maxSkins = 30;
        const promises = [];
        for (let i = 1; i <= maxSkins; i++) {
            const skinUrl = `${baseUrl}/${i}.png`;
            promises.push(
                fetch(skinUrl, { method: 'HEAD', cache: 'no-store' })
                    .then(res => res.ok ? { url: skinUrl, number: i, name: `Miembro ${i}`, file: `${i}.png` } : null)
                    .catch(() => null)
            );
        }
        const results = await Promise.all(promises);
        validSkins = results.filter(Boolean);
    }
    
    if (validSkins.length === 0) {
        console.warn('❌ No se encontraron skins');
        container.innerHTML = `
            <div class="skin-loading" style="text-align:center; padding:60px 20px;">
                <div style="font-size:3rem; margin-bottom:16px;">📦</div>
                <p style="color:var(--muted);">No se encontraron skins de miembros</p>
                <p style="color:var(--muted); font-size:0.9rem; margin-top:12px;">
                    Agrega archivos .png numerados (1.png, 2.png, etc.) a la carpeta <code>/image/skin/</code>
                </p>
            </div>
        `;
        return;
    }
    
    console.log('🎮 Creando visores 3D para', validSkins.length, 'skins');
    skinsData = validSkins;
    container.innerHTML = '';
    
    // Función auxiliar para crear un viewer 3D optimizado
    function createSkinViewer(skin, index, isClone = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'skin-viewer-wrapper';
        if (isClone) wrapper.setAttribute('data-clone', isClone);
        
        // Nombre arriba
        const nameEl = document.createElement('div');
        nameEl.className = 'skin-member-name';
        nameEl.textContent = skin.name || `Miembro #${skin.number}`;
        wrapper.appendChild(nameEl);
        
        // Visor 3D
        const viewerDiv = document.createElement('div');
        viewerDiv.className = 'skin-viewer';
        viewerDiv.id = `skin-viewer-${index}${isClone ? '-clone-' + isClone : ''}`;
        wrapper.appendChild(viewerDiv);

        // Crear el visor 3D
        const skinViewer = new window.skinview3d.SkinViewer({
            canvas: document.createElement('canvas'),
            width: 420,
            height: 420,
            skin: skin.url
        });

        // Configurar el visor
        skinViewer.controls.enableRotate = true;
        skinViewer.controls.enableZoom = false;
        skinViewer.controls.enablePan = false;

        // Animaciones más ligeras
        skinViewer.animation = new window.skinview3d.IdleAnimation();
        skinViewer.animation.speed = 0.2; // Más lento
        skinViewer.animation.paused = true; // Iniciar pausado

        // Configurar cámara
        skinViewer.camera.position.set(0, 18, 35);

        // Control de animación
        let isVisible = false;
        let isAnimating = false;
        let animationId = null;
        let autoRotate = false; // Desactivar auto-rotación por defecto
        
        skinViewer.controls.addEventListener('start', () => autoRotate = false);
        skinViewer.controls.addEventListener('end', () => autoRotate = false);

        function animate() {
            if (isAnimating && isVisible) {
                if (autoRotate) {
                    skinViewer.playerObject.rotation.y += 0.002; // Muy lento
                }
                animationId = requestAnimationFrame(animate);
            } else {
                animationId = null;
            }
        }

        // Insertar el canvas
        viewerDiv.appendChild(skinViewer.canvas);
        
        return { 
            viewer: skinViewer, 
            wrapper, 
            skinNumber: skin.number, 
            name: skin.name,
            viewerDiv,
            setVisible: (visible) => {
                isVisible = visible;
                
                if (visible) {
                    // Reanudar animación idle
                    if (skinViewer.animation) {
                        skinViewer.animation.paused = false;
                    }
                    // Iniciar loop de animación
                    if (!animationId) {
                        isAnimating = true;
                        animate();
                    }
                } else {
                    // Pausar animación idle
                    if (skinViewer.animation) {
                        skinViewer.animation.paused = true;
                    }
                    // Detener loop
                    isAnimating = false;
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                }
            }
        };
    }
    
    // Crear visualizadores 3D (todos renderizados pero pausados)
    validSkins.forEach((skin, index) => {
        const viewerData = createSkinViewer(skin, index);
        container.appendChild(viewerData.wrapper);
        skinViewers.push(viewerData);
    });
    
    console.log('✅ Visores 3D creados:', skinViewers.length);
    
    // Crear clones para el efecto infinito
    const allViewers = [...skinViewers];
    
    if (skinViewers.length > 1) {
        const lastSkin = validSkins[validSkins.length - 1];
        const lastClone = createSkinViewer(lastSkin, validSkins.length - 1, 'last');
        container.insertBefore(lastClone.wrapper, container.firstChild);
        allViewers.push(lastClone);
        
        const firstSkin = validSkins[0];
        const firstClone = createSkinViewer(firstSkin, 0, 'first');
        container.appendChild(firstClone.wrapper);
        allViewers.push(firstClone);
    }
    
    // Optimización: Activar animación SOLO cuando las skins están realmente en viewport
    const observerOptions = {
        root: null, // null = viewport completo (toda la ventana)
        rootMargin: '0px', // Sin margen extra
        threshold: 0.3 // Al menos 30% visible en pantalla
    };
    
    const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const wrapper = entry.target;
            const viewerData = allViewers.find(v => v.wrapper === wrapper);
            
            if (viewerData && viewerData.setVisible) {
                // Solo activar si está realmente en el viewport de la página
                const isInViewport = entry.isIntersecting && entry.intersectionRatio > 0.2;
                viewerData.setVisible(isInViewport);
                
                if (isInViewport) {
                    console.log('🎮 Skin animándose:', viewerData.name);
                } else {
                    console.log('⏸️ Skin pausada:', viewerData.name);
                }
            }
        });
    }, observerOptions);
    
    // Observar todos los wrappers
    allViewers.forEach(viewerData => {
        if (viewerData.wrapper) {
            visibilityObserver.observe(viewerData.wrapper);
        }
    });
    
    // NO activar ningún viewer por defecto - esperar a que el usuario haga scroll
    console.log('⏸️ Todos los viewers pausados hasta que entren en viewport');
    
    // Mostrar información del primer miembro
    updateSkinInfo();
    
    // Configurar navegación infinita
    const containerEl = document.getElementById('skins-container');
    const prevBtn = document.getElementById('prev-skin');
    const nextBtn = document.getElementById('next-skin');
    
    let isScrolling = false;
    
    function scrollToSkin(index, smooth = true) {
        const realIndex = index % skinViewers.length;
        const offset = skinViewers.length > 1 ? 1 : 0; // Offset por el clon al inicio
        const target = container.children[realIndex + offset];
        if (target) {
            isScrolling = true;
            target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', inline: 'center', block: 'nearest' });
            setTimeout(() => isScrolling = false, 600);
        }
    }
    
    function goToNextSkin() {
        const nextIndex = (currentSkinIndex + 1) % skinViewers.length;
        currentSkinIndex = nextIndex;
        scrollToSkin(nextIndex);
        updateSkinInfo();
    }
    
    function goToPrevSkin() {
        const prevIndex = (currentSkinIndex - 1 + skinViewers.length) % skinViewers.length;
        currentSkinIndex = prevIndex;
        scrollToSkin(prevIndex);
        updateSkinInfo();
    }
    
    // Centrar el primer elemento real (no el clon)
    setTimeout(() => scrollToSkin(0, false), 100);
    
    if (prevBtn) prevBtn.onclick = goToPrevSkin;
    if (nextBtn) nextBtn.onclick = goToNextSkin;
}

// Actualizar índice al hacer scroll con detección de extremos para loop infinito
function initScrollListener() {
    const containerEl = document.getElementById('skins-container');
    if (!containerEl || skinViewers.length <= 1) return;
    
    let scrollTimeout;
    let isAdjusting = false;
    
    function checkAndJumpIfNeeded() {
        if (isAdjusting || isScrolling) return;
        
        const children = Array.from(containerEl.children);
        const scrollLeft = containerEl.scrollLeft;
        const scrollWidth = containerEl.scrollWidth;
        const clientWidth = containerEl.clientWidth;
        
        // Encontrar el elemento visible en el centro
        const containerRect = containerEl.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        
        let centerElement = null;
        let centerIdx = -1;
        let minDist = Infinity;
        
        children.forEach((child, idx) => {
            const rect = child.getBoundingClientRect();
            const elemCenter = rect.left + rect.width / 2;
            const dist = Math.abs(elemCenter - centerX);
            if (dist < minDist) {
                minDist = dist;
                centerElement = child;
                centerIdx = idx;
            }
        });
        
        if (!centerElement) return;
        
        const cloneType = centerElement.getAttribute('data-clone');
        
        // Si el elemento central es un clon, hacer el salto
        if (cloneType) {
            isAdjusting = true;
            
            if (cloneType === 'last') {
                // Estamos en el clon del último (posición 0), saltar al último real
                console.log('🔄 Saltando del clon inicio → último real');
                currentSkinIndex = skinViewers.length - 1;
                const realElement = skinViewers[skinViewers.length - 1].wrapper;
                const targetLeft = realElement.offsetLeft - (clientWidth - realElement.offsetWidth) / 2;
                containerEl.scrollLeft = targetLeft;
                setTimeout(() => {
                    isAdjusting = false;
                    updateSkinInfo();
                }, 100);
            } else if (cloneType === 'first') {
                // Estamos en el clon del primero (última posición), saltar al primero real
                console.log('🔄 Saltando del clon final → primero real');
                currentSkinIndex = 0;
                const realElement = skinViewers[0].wrapper;
                const targetLeft = realElement.offsetLeft - (clientWidth - realElement.offsetWidth) / 2;
                containerEl.scrollLeft = targetLeft;
                setTimeout(() => {
                    isAdjusting = false;
                    updateSkinInfo();
                }, 100);
            }
        } else {
            // Elemento real, actualizar índice
            const offset = 1; // Hay un clon al inicio
            const newIndex = centerIdx - offset;
            if (newIndex >= 0 && newIndex < skinViewers.length && newIndex !== currentSkinIndex) {
                currentSkinIndex = newIndex;
                updateSkinInfo();
            }
        }
    }
    
    containerEl.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(checkAndJumpIfNeeded, 150);
    }, { passive: true });
}

function updateSkinInfo() {
    const skinInfo = document.getElementById('skin-info');
    if (!skinInfo) return;
    skinInfo.innerHTML = '';
}

// Inicializar cuando el DOM esté listo
console.log('⚡ skins.js cargado');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOM listo, iniciando skins...');
        loadMinecraftSkins();
        initScrollListener();
    });
} else {
    console.log('✅ DOM ya listo, iniciando skins...');
    loadMinecraftSkins();
    initScrollListener();
}
