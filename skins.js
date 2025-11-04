// ========================================
// CARRUSEL DE SKINS 3D DE MIEMBROS - COVERFLOW
// ========================================
let currentSkinIndex = 0;
let skinsData = [];
let current3DViewer = null; // Solo un visor 3D activo a la vez

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
                    .filter(e => e && typeof e.file === 'string' && (e.file.toLowerCase().endsWith('.png') || e.file.toLowerCase().endsWith('.webp')) && !String(e.file).includes('/'))
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
    
    // Usar manifest si existe, si no probar numeración automática
    let validSkins = [];
    if (manifestSkins) {
        console.log('✅ Usando manifestSkins:', manifestSkins.length, 'skins');
        validSkins = manifestSkins;
    } else {
        console.log('🔍 No hay manifest, detectando skins automáticamente...');
        const maxSkins = 100; // Intentar hasta 100 skins
        const promises = [];
        for (let i = 1; i <= maxSkins; i++) {
            // Probar primero .webp, luego .png
            const skinUrlWebp = `${baseUrl}/${i}.webp`;
            const skinUrlPng = `${baseUrl}/${i}.png`;
            
            promises.push(
                fetch(skinUrlWebp, { method: 'HEAD', cache: 'no-store' })
                    .then(res => {
                        if (res.ok) return { url: skinUrlWebp, number: i, name: `Miembro ${i}`, file: `${i}.webp` };
                        // Si no existe webp, probar png
                        return fetch(skinUrlPng, { method: 'HEAD', cache: 'no-store' })
                            .then(res2 => res2.ok ? { url: skinUrlPng, number: i, name: `Miembro ${i}`, file: `${i}.png` } : null);
                    })
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
                    Agrega archivos .png o .webp numerados (1.png, 2.png, etc.) a la carpeta <code>/image/skin/</code>
                </p>
            </div>
        `;
        return;
    }
    
    console.log('🎮 Creando galería de skins para', validSkins.length, 'skins');
    skinsData = validSkins;
    container.innerHTML = '';
    
    // Función para renderizar solo la cabeza de una skin
    function renderSkinHead(skinUrl, size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Deshabilitar suavizado para mantener píxeles nítidos
        ctx.imageSmoothingEnabled = false;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            // Renderizar la cara (primeros 8x8 píxeles de la textura)
            // En una skin de Minecraft, la cara está en x:8, y:8, ancho:8, alto:8
            ctx.drawImage(img, 8, 8, 8, 8, 0, 0, size, size);
            
            // Renderizar la capa externa de la cabeza (overlay) si existe
            // La capa overlay está en x:40, y:8
            ctx.drawImage(img, 40, 8, 8, 8, 0, 0, size, size);
        };
        img.src = skinUrl;
        
        return canvas;
    }
    
    // Crear todas las skins como contenedores
    validSkins.forEach((skin, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'skin-item';
        wrapper.dataset.index = index;
        // Asegurar tamaño uniforme y snap estable
        wrapper.style.cssText = 'min-width:300px; width:300px; flex:0 0 300px; scroll-snap-align:center; padding:10px;';
        
        // Crear contenedor para la imagen/visor
        const viewerContainer = document.createElement('div');
        viewerContainer.className = 'skin-content';
        viewerContainer.style.cssText = 'width:100%; height:280px; display:flex; align-items:center; justify-content:center;';
        
        // Inicialmente mostrar solo la cabeza renderizada
        const headCanvas = renderSkinHead(skin.url, 300);
        headCanvas.style.cssText = 'width:80%; height:80%; object-fit:contain; image-rendering:pixelated;';
        
        viewerContainer.appendChild(headCanvas);
        wrapper.appendChild(viewerContainer);
        container.appendChild(wrapper);
    });
    
    console.log('✅ Galería creada:', validSkins.length, 'skins');
    
    // Agregar clones al inicio y al final para efecto infinito
    if (validSkins.length > 1) {
        // Clonar la última skin al inicio
        const lastSkin = validSkins[validSkins.length - 1];
        const lastClone = document.createElement('div');
        lastClone.className = 'skin-item';
        lastClone.dataset.clone = 'last';
        lastClone.dataset.index = validSkins.length - 1;
        
        const lastContainer = document.createElement('div');
        lastContainer.className = 'skin-content';
        lastContainer.style.cssText = 'width:100%; height:280px; display:flex; align-items:center; justify-content:center;';
        
        const lastHead = renderSkinHead(lastSkin.url, 300);
        lastHead.style.cssText = 'width:80%; height:80%; object-fit:contain; image-rendering:pixelated;';
        
        lastContainer.appendChild(lastHead);
        lastClone.appendChild(lastContainer);
        container.insertBefore(lastClone, container.firstChild);
        
        // Clonar la primera skin al final
        const firstSkin = validSkins[0];
        const firstClone = document.createElement('div');
        firstClone.className = 'skin-item';
        firstClone.dataset.clone = 'first';
        firstClone.dataset.index = 0;
        
        const firstContainer = document.createElement('div');
        firstContainer.className = 'skin-content';
        firstContainer.style.cssText = 'width:100%; height:280px; display:flex; align-items:center; justify-content:center;';
        
        const firstHead = renderSkinHead(firstSkin.url, 300);
        firstHead.style.cssText = 'width:80%; height:80%; object-fit:contain; image-rendering:pixelated;';
        
        firstContainer.appendChild(firstHead);
        firstClone.appendChild(firstContainer);
        container.appendChild(firstClone);
    }
    
    console.log('✅ Clones agregados para efecto infinito');
    
    // Función para actualizar qué skin está en 3D
    function updateCarousel() {
        const items = container.querySelectorAll('.skin-item');
        
        // Calcular cuál es la skin central visible
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        
        let centerIndex = currentSkinIndex;
        let minDist = Infinity;
        let centerItem = null;
        
        items.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const itemCenter = rect.left + rect.width / 2;
            const dist = Math.abs(itemCenter - centerX);
            
            if (dist < minDist) {
                minDist = dist;
                centerItem = item;
                const isClone = item.dataset.clone;
                if (!isClone) {
                    centerIndex = parseInt(item.dataset.index);
                }
            }
        });
        
        // Actualizar visualización
        items.forEach((item) => {
            const skinIndex = parseInt(item.dataset.index);
            const isClone = item.dataset.clone;
            const viewerContainer = item.querySelector('.skin-content');
            
            // Determinar si este item es el central
            const isCentral = item === centerItem;
            
            if (isCentral && !isClone) {
                // Skin central: convertir a 3D si no lo está ya
                item.classList.add('active');
                
                // Verificar si ya tiene un visor 3D (buscando canvas de skinview3d)
                const hasThreeJSCanvas = viewerContainer.querySelector('canvas') && 
                                        !viewerContainer.querySelector('canvas').style.imageRendering;
                
                if (!hasThreeJSCanvas) {
                    // Destruir el visor 3D anterior si existe
                    if (current3DViewer) {
                        current3DViewer.skinViewer.dispose();
                        current3DViewer = null;
                    }
                    
                    // Crear nuevo visor 3D
                    const skin = skinsData[skinIndex];
                    viewerContainer.innerHTML = '';
                    
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
                    
                    // Animación idle
                    skinViewer.animation = new window.skinview3d.IdleAnimation();
                    skinViewer.animation.speed = 0.3;
                    
                    // Configurar cámara
                    skinViewer.camera.position.set(0, 18, 35);
                    
                    viewerContainer.appendChild(skinViewer.canvas);
                    current3DViewer = { skinViewer, viewerContainer };
                    
                    console.log('🎮 Visor 3D activo:', skin.name);
                }
            } else {
                // Skin lateral o clon: mostrar solo la cabeza
                item.classList.remove('active');
                
                // Verificar si tiene un canvas de Three.js (skinview3d) para reemplazar
                const canvas = viewerContainer.querySelector('canvas');
                const hasThreeJSCanvas = canvas && !canvas.style.imageRendering;
                
                if (hasThreeJSCanvas) {
                    // Es un canvas de skinview3d, reemplazar por canvas de cabeza
                    const skin = skinsData[skinIndex];
                    viewerContainer.innerHTML = '';
                    
                    const headCanvas = renderSkinHead(skin.url, 300);
                    headCanvas.style.cssText = 'width:80%; height:80%; object-fit:contain; image-rendering:pixelated;';
                    viewerContainer.appendChild(headCanvas);
                    
                    console.log('👤 Cabeza renderizada para:', skin.name);
                }
            }
        });
        
        currentSkinIndex = centerIndex;
        updateSkinInfo();
    }
    
    // Configurar navegación con botones
    const prevBtn = document.getElementById('prev-skin');
    const nextBtn = document.getElementById('next-skin');
    
    function scrollToSkin(skinIndex, smooth = true) {
        // skinIndex es el índice en skinsData (0 a length-1)
        // En el DOM tenemos: [clon última] [skin 0] [skin 1] ... [skin n] [clon primera]
        // Por lo tanto, el elemento DOM correcto está en posición skinIndex + 1
        const domIndex = skinIndex + 1;
        const target = container.children[domIndex];
        if (target) {
            console.log(`📍 Navegando a skin ${skinIndex} (DOM index ${domIndex})`);
            target.scrollIntoView({ 
                behavior: smooth ? 'smooth' : 'instant', 
                inline: 'center', 
                block: 'nearest' 
            });
        }
    }
    
    function goToNextSkin() {
        if (currentSkinIndex === skinsData.length - 1) {
            // Estamos en la última skin, navegar al clon de la primera (smooth)
            const firstCloneDomIndex = skinsData.length + 1; // Último elemento del DOM
            const cloneTarget = container.children[firstCloneDomIndex];
            if (cloneTarget) {
                cloneTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                // Después de la animación, saltar instantáneamente a la skin real 0
                setTimeout(() => {
                    currentSkinIndex = 0;
                    scrollToSkin(0, false); // false = instant
                    setTimeout(updateCarousel, 50);
                }, 500); // Esperar a que termine el smooth scroll
            }
        } else {
            // Navegación normal
            currentSkinIndex = currentSkinIndex + 1;
            scrollToSkin(currentSkinIndex);
        }
    }
    
    function goToPrevSkin() {
        if (currentSkinIndex === 0) {
            // Estamos en la primera skin, navegar al clon de la última (smooth)
            const lastCloneDomIndex = 0; // Primer elemento del DOM
            const cloneTarget = container.children[lastCloneDomIndex];
            if (cloneTarget) {
                cloneTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                // Después de la animación, saltar instantáneamente a la skin real última
                setTimeout(() => {
                    currentSkinIndex = skinsData.length - 1;
                    scrollToSkin(currentSkinIndex, false); // false = instant
                    setTimeout(updateCarousel, 50);
                }, 500); // Esperar a que termine el smooth scroll
            }
        } else {
            // Navegación normal
            currentSkinIndex = currentSkinIndex - 1;
            scrollToSkin(currentSkinIndex);
        }
    }
    
    if (prevBtn) prevBtn.onclick = goToPrevSkin;
    if (nextBtn) nextBtn.onclick = goToNextSkin;
    
    // Detectar cuando el scroll termina para actualizar 3D
    let scrollTimeout;
    container.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateCarousel, 120);
    }, { passive: true });
    
    // Habilitar scroll manual
    container.style.overflowX = 'auto';
    container.style.scrollSnapType = 'x mandatory';
    
    // Centrar la primera skin y activarla
    setTimeout(() => {
        scrollToSkin(0);
        setTimeout(updateCarousel, 300);
    }, 100);
}

function updateSkinInfo() {
    const skinInfo = document.getElementById('skin-info');
    if (!skinInfo || !skinsData.length) return;
    
    const currentSkin = skinsData[currentSkinIndex];
    if (currentSkin) {
        skinInfo.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#ff6a00; margin-bottom:8px;">${currentSkin.name}</h3>
                <p style="color:var(--muted); font-size:0.9rem;">Miembro ${currentSkin.number}</p>
                <p style="color:var(--muted); font-size:0.85rem; margin-top:8px;">${currentSkinIndex + 1} / ${skinsData.length}</p>
            </div>
        `;
    }
}

// Inicializar cuando el DOM esté listo
console.log('⚡ skins.js cargado');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOM listo, iniciando skins...');
        loadMinecraftSkins();
    });
} else {
    console.log('✅ DOM ya listo, iniciando skins...');
    loadMinecraftSkins();
}
