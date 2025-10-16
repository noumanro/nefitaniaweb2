
    // Rellena año del footer
document.getElementById('y').textContent = new Date().getFullYear();

// Manejo simple de formulario (solo front)
function handleSubmit(e){
  e.preventDefault();
  const ok = document.getElementById('form-ok');
  ok.style.display = 'block';
  e.target.reset();
  return false;
}

// ========================================
// MODAL DEL FORMULARIO
// ========================================
document.getElementById('abrir-form').onclick = function() {
    document.getElementById('modal-form').style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

document.getElementById('cerrar-form').onclick = function() {
    document.getElementById('modal-form').style.display = 'none';
    document.body.style.overflow = '';
};

// Cerrar modal al hacer clic en el fondo oscuro
document.getElementById('modal-form').onclick = function(e) {
    if (e.target === this) {
        document.getElementById('modal-form').style.display = 'none';
        document.body.style.overflow = '';
    }
};

// Cerrar modal con tecla Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('modal-form').style.display === 'flex') {
        document.getElementById('modal-form').style.display = 'none';
        document.body.style.overflow = '';
    }
});

// ========================================
// CARRUSEL PRINCIPAL (QUIÉNES SOMOS)
// ========================================
let currentSlide = 0;
let totalSlides = 0;
const carouselContainer = document.getElementById('carousel-container');
const dotsContainer = document.getElementById('carousel-dots');

// Cargar imágenes dinámicamente de la carpeta nosotros
async function loadMainCarouselImages() {
    const baseUrl = 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/image/nosotros';
    const maxImages = 50; // Intentar hasta 50 imágenes
    const promises = [];
    
    for (let i = 1; i <= maxImages; i++) {
        const imgUrl = `${baseUrl}/${i}.webp`;
        promises.push(
            fetch(imgUrl, { method: 'HEAD', cache: 'no-store' })
                .then(res => res.ok ? imgUrl : null)
                .catch(() => null)
        );
    }
    
    const results = await Promise.all(promises);
    const validImages = results.filter(url => url !== null);
    
    if (validImages.length === 0) {
        console.warn('No se encontraron imágenes en la galería de miembros');
        return;
    }
    
    totalSlides = validImages.length;
    
    // Limpiar contenedor y dots
    carouselContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    // Agregar imágenes al carrusel
    validImages.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'width:100%; height:100%; object-fit:cover; flex-shrink:0; display:block; cursor:pointer;';
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
    
    // Inicializar carrusel
    updateCarousel();
    initMainCarouselDrag();
    
    // Auto-avance del carrusel cada 5 segundos
    setInterval(function() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);
}

function updateCarousel() {
    if (totalSlides === 0) return;
    
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

document.getElementById('next-img').onclick = function() {
    if (totalSlides === 0) return;
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
};

document.getElementById('prev-img').onclick = function() {
    if (totalSlides === 0) return;
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
};

// Cargar imágenes al iniciar
loadMainCarouselImages();

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
    document.getElementById('modal-image-content').src = imageSrc;
    document.getElementById('modal-image').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

document.getElementById('cerrar-image').onclick = function() {
    document.getElementById('modal-image').style.display = 'none';
    document.body.style.overflow = '';
};

// Cerrar modal de imagen al hacer clic en el fondo
document.getElementById('modal-image').onclick = function(e) {
    if (e.target === this) {
        document.getElementById('modal-image').style.display = 'none';
        document.body.style.overflow = '';
    }
};

// Cerrar modal de imagen con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('modal-image').style.display === 'flex') {
        document.getElementById('modal-image').style.display = 'none';
        document.body.style.overflow = '';
    }
});

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
    shell.style.cssText = 'position:relative; max-width:100%; margin:auto; overflow:hidden; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,.25);';

    const container = document.createElement('div');
    container.id = `carousel-container-${slug}`;
    container.style.cssText = 'display:flex; transition:transform 0.3s ease; height:200px;';

    const prev = document.createElement('button');
    prev.className = 'carousel-prev';
    prev.dataset.carousel = slug;
    prev.textContent = '‹';
    prev.style.cssText = 'position:absolute; left:5px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.7); color:#fff; border:none; border-radius:50%; width:30px; height:30px; font-size:1rem; cursor:pointer; transition:all 0.2s; z-index:10;';

    const next = document.createElement('button');
    next.className = 'carousel-next';
    next.dataset.carousel = slug;
    next.textContent = '›';
    next.style.cssText = 'position:absolute; right:5px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.7); color:#fff; border:none; border-radius:50%; width:30px; height:30px; font-size:1rem; cursor:pointer; transition:all 0.2s; z-index:10;';

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    dotsContainer.dataset.carousel = slug;
    dotsContainer.style.cssText = 'position:absolute; bottom:8px; left:50%; transform:translateX(-50%); display:flex; gap:4px;';

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
    
    // Si no hay carpeta definida, mostrar placeholder y salir
    if (!folderPath) {
        console.warn('Proyecto sin folder_location válida. Mostrando placeholder para:', carouselName);
        showNoImagesPlaceholder(carouselName, 'Sin carpeta configurada');
        return;
    }
    
    const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

    let loadedCount = 0;

    // Función para agregar una imagen al carrusel
    function addImageToCarousel(imageSrc, index) {
        console.log('Agregando imagen:', imageSrc, 'en índice:', index);
        const imgElement = document.createElement('img');
        imgElement.src = imageSrc;
        imgElement.loading = 'lazy';
        imgElement.style.cssText = 'width:100%; height:100%; object-fit:cover; flex-shrink:0; display:block; cursor:grab;';
        
        // Agregar doble click para abrir modal
        imgElement.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openImageModal(this.src);
        });
        
        imgElement.draggable = false; // Prevenir arrastrar imagen como archivo
        container.appendChild(imgElement);

        // Crear dot
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.dataset.slide = index;
        dot.dataset.carousel = carouselName;
        dot.style.cssText = `width:6px; height:6px; border-radius:50%; background:${index === 0 ? '#ff6a00' : 'rgba(255,255,255,0.5)'}; cursor:pointer; transition:all 0.2s;`;
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
            showNoImagesPlaceholder(carouselName, 'Sin fotos');
        }
    }

    // Primero, intentar leer el listado del directorio (si el servidor lo permite)
    async function tryDirectoryListing() {
        try {
            // Para GitHub raw, intentamos cargar imágenes numeradas (1.webp, 2.webp, etc.)
            const maxImages = 30; // Intentar hasta 30 imágenes
            const promises = [];
            
            for (let i = 1; i <= maxImages; i++) {
                const imgUrl = `${folderPath}/${i}.webp`;
                promises.push(
                    fetch(imgUrl, { method: 'HEAD', cache: 'no-store' })
                        .then(res => res.ok ? imgUrl : null)
                        .catch(() => null)
                );
            }
            
            const results = await Promise.all(promises);
            const validImages = results.filter(url => url !== null);
            
            if (validImages.length === 0) throw new Error('No se encontraron imágenes');
            
            validImages.forEach((url, idx) => addImageToCarousel(url, loadedCount++));
            
            // Inicializar drag si cargamos imágenes
            setTimeout(() => initSingleCarouselDrag(carouselName), 50);
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
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href').substring(1);
            if (href === currentSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Actualizar al hacer scroll
    window.addEventListener('scroll', updateActiveNav);
    
    // Actualizar inicialmente
    updateActiveNav();
    
    // Logo lleva al inicio (solo si existe)
    if (logoHome) {
        logoHome.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Limpiar navegación activa
            navLinks.forEach(link => link.classList.remove('active'));
        });
    }
    
    // Smooth scroll al hacer clic en nav
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// CARRUSEL DE SKINS 3D DE MIEMBROS
// ========================================
let currentSkinIndex = 0;
let skinViewers = [];
let skinsData = [];
    
    // Carga dinámica de la librería skinview3d con fallback de CDN
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
        try {
            await inject('https://cdn.jsdelivr.net/npm/skinview3d@3/bundles/skinview3d.min.js');
            return typeof window.skinview3d !== 'undefined';
        } catch (_) {
            try {
                await inject('https://unpkg.com/skinview3d@3/bundles/skinview3d.min.js');
                return typeof window.skinview3d !== 'undefined';
            } catch (__) {
                return false;
            }
        }
    }

async function loadMinecraftSkins() {
    // Detectar si estamos en local o producción
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal 
        ? 'image/skin' 
        : 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/image/skin';
    
    const container = document.getElementById('skins-container');
    const skinInfo = document.getElementById('skin-info');
    
    if (!container || typeof skinview3d === 'undefined') {
        console.warn('SkinView3D no está disponible o el contenedor no existe');
        return;
    }
    
    // Asegurar que la librería esté cargada (con fallback)
    const ok = await ensureSkinview3dLoaded();
    if (!ok || typeof window.skinview3d === 'undefined') {
        console.error('No se pudo cargar skinview3d');
        container.innerHTML = `
            <div class="skin-loading" style="text-align:center; padding:60px 20px;">
                <div style="font-size:3rem; margin-bottom:16px;">⚠️</div>
                <p style="color:var(--muted);">No se pudo cargar el visor 3D</p>
                <p style="color:var(--muted); font-size:0.9rem; margin-top:12px;">Revisa tu conexión a internet y vuelve a intentarlo</p>
            </div>
        `;
        return;
    }
    
    // Intentar cargar hasta 30 skins numeradas
    const maxSkins = 30;
    const promises = [];
    
    for (let i = 1; i <= maxSkins; i++) {
        const skinUrl = `${baseUrl}/${i}.png`;
        promises.push(
            fetch(skinUrl, { method: 'HEAD', cache: 'no-store' })
                .then(res => res.ok ? { url: skinUrl, number: i } : null)
                .catch(() => null)
        );
    }
    
    const results = await Promise.all(promises);
    const validSkins = results.filter(skin => skin !== null);
    
    if (validSkins.length === 0) {
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
    
    skinsData = validSkins;
    container.innerHTML = '';
    
    // Crear visualizadores de skins
    validSkins.forEach((skin, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'skin-viewer-wrapper';
        wrapper.style.display = index === 0 ? 'flex' : 'none';
        
        const viewerDiv = document.createElement('div');
        viewerDiv.className = 'skin-viewer';
        viewerDiv.id = `skin-viewer-${index}`;
        
        wrapper.appendChild(viewerDiv);
        container.appendChild(wrapper);
        
        // Crear el visor 3D
        const skinViewer = new skinview3d.SkinViewer({
            canvas: document.createElement('canvas'),
            width: 350,
            height: 350,
            skin: skin.url
        });
        
        // Configurar el visor
        skinViewer.controls.enableRotate = true;
        skinViewer.controls.enableZoom = false;
        skinViewer.controls.enablePan = false;
        
        // Animaciones
        skinViewer.animation = new skinview3d.IdleAnimation();
        skinViewer.animation.speed = 0.5;
        
        // Configurar cámara
        skinViewer.camera.position.set(0, 18, 35);
        
        // Auto-rotación suave
        let autoRotate = true;
        skinViewer.controls.addEventListener('start', () => autoRotate = false);
        skinViewer.controls.addEventListener('end', () => autoRotate = true);
        
        function animate() {
            if (autoRotate) {
                skinViewer.playerObject.rotation.y += 0.005;
            }
            requestAnimationFrame(animate);
        }
        animate();
        
        // Insertar el canvas
        viewerDiv.appendChild(skinViewer.canvas);
        
        // Guardar referencia
        skinViewers.push({
            viewer: skinViewer,
            wrapper: wrapper,
            skinNumber: skin.number
        });
    });
    
    // Mostrar información del primer miembro
    updateSkinInfo();
    
    // Configurar botones de navegación
    const prevBtn = document.getElementById('prev-skin');
    const nextBtn = document.getElementById('next-skin');
    
    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => navigateSkins(-1);
        nextBtn.onclick = () => navigateSkins(1);
    }
}

function navigateSkins(direction) {
    if (skinViewers.length === 0) return;
    
    // Ocultar skin actual
    skinViewers[currentSkinIndex].wrapper.style.display = 'none';
    
    // Calcular nuevo índice
    currentSkinIndex = (currentSkinIndex + direction + skinViewers.length) % skinViewers.length;
    
    // Mostrar nueva skin
    skinViewers[currentSkinIndex].wrapper.style.display = 'flex';
    
    // Actualizar información
    updateSkinInfo();
}

function updateSkinInfo() {
    const skinInfo = document.getElementById('skin-info');
    if (!skinInfo || skinViewers.length === 0) return;
    
    const currentSkin = skinViewers[currentSkinIndex];
    
    skinInfo.innerHTML = `
        <h3>Miembro #${currentSkin.skinNumber}</h3>
        <p>
            Skin ${currentSkinIndex + 1} de ${skinViewers.length}
            <br>
            <span style="font-size:0.85rem; opacity:0.7;">Haz clic y arrastra para rotar • Usa las flechas para navegar</span>
        </p>
    `;
}

// Cargar skins cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMinecraftSkins);
} else {
    loadMinecraftSkins();
}