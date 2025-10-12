
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
// CARRUSELES DE PROYECTOS
// ========================================
const projectCarousels = {};

function loadProjectCarousel(folderName, carouselName, imageNames) {
    const container = document.getElementById(`carousel-container-${carouselName}`);
    const dotsContainer = document.querySelector(`.carousel-dots[data-carousel="${carouselName}"]`);
    const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    
    let loadedImages = [];
    
    imageNames.forEach((imageName) => {
        extensions.forEach(ext => {
            const img = new Image();
            img.onload = function() {
                if (!loadedImages.includes(imageName)) {
                    loadedImages.push(imageName);
                    
                    // Crear imagen del carrusel
                    const imgElement = document.createElement('img');
                    imgElement.src = `image/${folderName}/${imageName}.${ext}`;
                    imgElement.style.cssText = 'width:100%; height:100%; object-fit:cover; flex-shrink:0; display:block; cursor:pointer;';
                    imgElement.onclick = function() { openImageModal(this.src); };
                    container.appendChild(imgElement);
                    
                    // Crear dot
                    const dot = document.createElement('span');
                    dot.className = 'dot';
                    dot.dataset.slide = loadedImages.length - 1;
                    dot.dataset.carousel = carouselName;
                    dot.style.cssText = `width:6px; height:6px; border-radius:50%; background:${loadedImages.length === 1 ? '#ff6a00' : 'rgba(255,255,255,0.5)'}; cursor:pointer; transition:all 0.2s;`;
                    dotsContainer.appendChild(dot);
                    
                    // Agregar evento click al dot
                    dot.onclick = function() {
                        updateProjectCarousel(carouselName, parseInt(this.dataset.slide), loadedImages.length);
                    };
                }
            };
            img.src = `image/${folderName}/${imageName}.${ext}`;
        });
    });
}

function initProjectCarousels() {
    // Inicializar controles para todos los carruseles
    document.querySelectorAll('.carousel-prev').forEach(btn => {
        btn.onclick = function() {
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
        btn.onclick = function() {
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

function loadProjectPreviews() {
    // Cargar carruseles para cada proyecto
    loadProjectCarousel('ojo sauron', 'fortaleza', ['ojo', 'ojo1', 'ojo3', 'image']);
    loadProjectCarousel('granja Xp', 'granja', ['image', '2025-10-11_20.06.50', '2025-10-11_20.06.59']);
    loadProjectCarousel('la tortuga destartalada', 'tortuga', [
        '2025-10-11_16.31.11', '2025-10-11_16.31.33', 
        '2025-10-11_16.32.20', '2025-10-11_16.32.56'
    ]);
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    loadProjectPreviews();
    initProjectCarousels();
    initActiveNavigation();
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
    
    // Logo lleva al inicio
    logoHome.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Limpiar navegación activa
        navLinks.forEach(link => link.classList.remove('active'));
    });
    
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