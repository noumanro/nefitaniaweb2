
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
const totalSlides = 7;
const carouselContainer = document.getElementById('carousel-container');
const dots = document.querySelectorAll('.dot');

function updateCarousel() {
    const translateX = -currentSlide * 100;
    carouselContainer.style.transform = `translateX(${translateX}%)`;
    
    // Actualizar dots
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.style.background = '#ff6a00';
        } else {
            dot.style.background = 'rgba(255,255,255,0.5)';
        }
    });
}

document.getElementById('next-img').onclick = function() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
};

document.getElementById('prev-img').onclick = function() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
};

// Clicks en los dots
dots.forEach((dot, index) => {
    dot.onclick = function() {
        currentSlide = index;
        updateCarousel();
    };
});

// Auto-avance del carrusel cada 5 segundos
setInterval(function() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
}, 5000);

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
    return withPrefix
        .split('/')
        .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg))) // no codificar 'image'
        .join('/');
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
    const folder = normalizeFolderPath(project.folder_location);
    loadProjectCarouselFromFolder(folder, slug);
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
        console.warn('Proyecto sin folder_location. Mostrando placeholder para:', carouselName);
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'width:100%; height:100%; background:rgba(255,106,0,0.1); display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:0.9rem; flex-shrink:0; flex-direction:column; gap:8px;';
        placeholder.innerHTML = `
            <div style="font-size:2rem;">📷</div>
            <div>Sin carpeta de imágenes</div>
            <div style="font-size:0.8rem; text-align:center;">Agrega <code>folder_location:</code> en proyecto.txt</div>
        `;
        container.appendChild(placeholder);
        return;
    }
    
    const extensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    
    // Lista optimizada de nombres más comunes primero
    const possibleNames = [
        // Nombres más comunes primero
        'image', 'img', '1', '2', '3', '4', '5',
        'ojo', 'ojo1', 'ojo2', 'ojo3', 
        // Nombres específicos conocidos de tus proyectos
        '2025-10-11_16.31.11', '2025-10-11_16.31.33', '2025-10-11_16.32.20', '2025-10-11_16.32.56',
        '2025-10-11_20.06.50', '2025-10-11_20.06.59',
        // Más variaciones
        'granja', 'tortuga', 'castillo', 'submarina', 'torre',
        'foto', 'pic', 'screenshot', 'capture', 'main', 'cover',
        '6', '7', '8', '9', '10', '11', '12',
        '01', '02', '03', '04', '05', '06',
        'img1', 'img2', 'img3', 'img4', 'img5', 'img6',
        'image1', 'image2', 'image3', 'image4', 'image5', 'image6'
    ];

    let loadedCount = 0;
    let attemptedCount = 0;
    const maxAttempts = possibleNames.length * extensions.length;

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
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'width:100%; height:100%; background:rgba(255,106,0,0.1); display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:0.9rem; flex-shrink:0; flex-direction:column; gap:8px;';
            placeholder.innerHTML = `
                <div style="font-size:2rem;">📷</div>
                <div>Sin imágenes disponibles</div>
                <div style="font-size:0.8rem; text-align:center;">Agrega imágenes a:<br><code style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">${decodeURIComponent(folderPath)}/</code></div>
            `;
            container.appendChild(placeholder);
        }
    }

    // Primero, intentar leer el listado del directorio (si el servidor lo permite)
    async function tryDirectoryListing() {
        try {
            const res = await fetch(`${folderPath}/`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const contentType = res.headers.get('content-type') || '';
            const html = await res.text();
            if (!/text\/html/i.test(contentType) && !/<a\s+/i.test(html)) {
                throw new Error('No parece un índice de directorio');
            }
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const links = Array.from(tmp.querySelectorAll('a'))
                .map(a => a.getAttribute('href'))
                .filter(Boolean)
                .filter(h => {
                    const lower = h.toLowerCase();
                    return extensions.some(ext => lower.endsWith('.' + ext));
                })
                .map(h => {
                    // Si el href es absoluto o relativo al índice
                    // En listado de python, suelen ser nombres como 'img1.jpg'
                    return `${folderPath}/${encodeURIComponent(h.replace(/^\/?/, ''))}`;
                });

            // Evitar duplicados y limitar a 20 imágenes
            const unique = Array.from(new Set(links)).slice(0, 20);
            unique.forEach((url, idx) => addImageToCarousel(url, loadedCount++));
            if (loadedCount === 0) throw new Error('Índice sin imágenes');
            // Inicializar drag si cargamos del índice
            setTimeout(() => initSingleCarouselDrag(carouselName), 50);
            return true;
        } catch (e) {
            console.info('No se pudo leer índice de', folderPath, '-', e.message || e);
            return false;
        }
    }

    // Probar cada combinación de forma más controlada (fallback si no hay índice)
    let nameIndex = 0;
    let extIndex = 0;

    function tryNextImage() {
        if (nameIndex >= possibleNames.length) {
            console.log('Terminada búsqueda de imágenes para:', carouselName, 'Total encontradas:', loadedCount);
            showPlaceholder();
            return;
        }

        const baseName = possibleNames[nameIndex];
        const ext = extensions[extIndex];
        const testUrl = `${folderPath}/${encodeURIComponent(baseName)}.${ext}`;
        
        console.log('Probando imagen:', testUrl);
        const img = new Image();
        img.onload = function() {
            console.log('Imagen cargada exitosamente:', testUrl);
            addImageToCarousel(testUrl, loadedCount);
            loadedCount++;
            // Continuar buscando más imágenes
            advanceToNext();
        };
        img.onerror = function() {
            // Continuar con la siguiente combinación
            advanceToNext();
        };
        img.src = testUrl;
        
        attemptedCount++;
    }

    function advanceToNext() {
        extIndex++;
        if (extIndex >= extensions.length) {
            extIndex = 0;
            nameIndex++;
        }
        
        // Limitar intentos para evitar demasiados requests
        if (attemptedCount < maxAttempts && nameIndex < possibleNames.length) {
            // Usar timeout para no saturar el navegador
            setTimeout(tryNextImage, 10);
        } else if (loadedCount === 0) {
            showPlaceholder();
        }
    }

    // Iniciar: intentar índice y si falla, usar búsqueda por nombres
    tryDirectoryListing().then(ok => {
        if (!ok) tryNextImage();
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