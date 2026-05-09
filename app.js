// app.js - Unified Portfolio Logic
// State
let _supabase = null;
let categories = [];
let subCategories = [];
let graphics = [];
let animations = [];
let activeCategoryId = 'all';
let activeSubCategoryId = null;

// DOM Elements
const categoryFilters = document.getElementById('category-filters');
const subCategoryFilters = document.getElementById('sub-category-filters');
const graphicsGrid = document.getElementById('graphics-grid');

// Initialization
async function init() {
    console.log("🚀 Initializing Portfolio...");
    
    // Initialize Firebase
    if (window.firebase && window.firebase.initializeApp) {
        const firebaseConfig = {
            apiKey: "AIzaSyDY_HmNfD_QFLI7Vwj39s1b3WHKEKD80nQ",
            authDomain: "ovkb-8d398.firebaseapp.com",
            projectId: "ovkb-8d398",
            storageBucket: "ovkb-8d398.firebasestorage.app",
            messagingSenderId: "804850492300",
            appId: "1:804850492300:web:cf90f3c83773e1f13caca9"
        };
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            window.db = firebase.firestore();
            console.log("✅ Firebase Initialized");
        } catch (error) {
            console.error("❌ Firebase Init Error:", error);
        }
    }
    
    if (graphicsGrid) {
        await fetchData();
        renderFilters();
        renderItems();
    }
    
    initScrollReveal();
    setupModal();
    initSmoothScroll();
    initContactForm();
    initNavbarScroll();
}

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
}

async function fetchData() {
    // 1. Initialize Supabase Client
    if (window.supabase) {
        const SUB_URL = 'https://jfdxjpjfhekavqkzjbei.supabase.co';
        const SUB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHhqcGpmaGVrYXZxa3pqYmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDAwNDAsImV4cCI6MjA5MjQxNjA0MH0.ByrHvME7bkkC5TIY09lkLvBIKr-UJ_9D4tbxLl6l8dI';
        _supabase = window.supabase.createClient(SUB_URL, SUB_KEY);
    }

    try {
        // Fetch from Supabase (Graphics)
        if (_supabase) {
            const [catRes, subRes, graphRes] = await Promise.all([
                _supabase.from('categories').select('*').order('name'),
                _supabase.from('sub_categories').select('*').order('name'),
                _supabase.from('graphics').select('*').order('created_at', { ascending: false })
            ]);
            
            categories = catRes.data || [];
            subCategories = subRes.data || [];
            graphics = graphRes.data || [];
            console.log("✅ Supabase Data Loaded");
        }

        // Fetch from Firebase (Animations)
        if (window.db) {
            const snapshot = await window.db.collection("animations").orderBy("createdAt", "desc").get();
            animations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("✅ Firebase Animations Loaded");
        }
    } catch (err) {
        console.error("❌ Data Fetch Error:", err);
    }
}

function renderFilters() {
    if (!categoryFilters) return;

    // Categories
    categoryFilters.innerHTML = '';
    
    const createFilterBtn = (id, name, isActive, onClick) => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${isActive ? 'active' : ''}`;
        btn.textContent = name;
        btn.onclick = onClick;
        return btn;
    };

    // All button
    categoryFilters.appendChild(createFilterBtn('all', 'All', activeCategoryId === 'all', () => {
        activeCategoryId = 'all';
        activeSubCategoryId = null;
        renderFilters();
        renderItems();
    }));

    categories.forEach(cat => {
        categoryFilters.appendChild(createFilterBtn(cat.id, cat.name, activeCategoryId === cat.id, () => {
            activeCategoryId = cat.id;
            activeSubCategoryId = null;
            renderFilters();
            renderItems();
        }));
    });

    // Sub-categories
    subCategoryFilters.innerHTML = '';
    if (activeCategoryId !== 'all') {
        const filteredSubCats = subCategories.filter(s => s.category_id === activeCategoryId);
        
        subCategoryFilters.appendChild(createFilterBtn(null, 'All Types', !activeSubCategoryId, () => {
            activeSubCategoryId = null;
            renderFilters();
            renderItems();
        }));

        filteredSubCats.forEach(sub => {
            subCategoryFilters.appendChild(createFilterBtn(sub.id, sub.name, activeSubCategoryId === sub.id, () => {
                activeSubCategoryId = sub.id;
                renderFilters();
                renderItems();
            }));
        });
    }
}

function renderItems() {
    if (!graphicsGrid) return;
    graphicsGrid.innerHTML = '';
    
    let filteredGraphics = graphics;
    let filteredAnimations = animations;

    if (activeCategoryId !== 'all') {
        const validSubCatIds = subCategories.filter(s => s.category_id === activeCategoryId).map(s => s.id);
        filteredGraphics = graphics.filter(g => validSubCatIds.includes(g.sub_category_id));
        filteredAnimations = animations.filter(a => a.categoryId === activeCategoryId);

        if (activeSubCategoryId) {
            filteredGraphics = filteredGraphics.filter(g => g.sub_category_id === activeSubCategoryId);
            filteredAnimations = filteredAnimations.filter(a => a.subCategoryId === activeSubCategoryId);
        }
    }

    const createSectionHeader = (title, color) => {
        const div = document.createElement('div');
        div.className = 'col-12 mt-5 mb-4 text-center';
        div.style.gridColumn = "1 / -1";
        div.innerHTML = `
            <h2 class="fw-bold" style="color: ${color}; font-size: 2rem;">${title}</h2>
            <div style="width: 60px; height: 4px; background: ${color}; margin: 15px auto; border-radius: 2px;"></div>
        `;
        return div;
    };

    if (filteredGraphics.length > 0) {
        graphicsGrid.appendChild(createSectionHeader('Creative Designs', 'var(--accent)'));
        filteredGraphics.forEach(g => {
            graphicsGrid.appendChild(createCard(g.title, g.image_url, 'Design'));
        });
    }

    if (filteredAnimations.length > 0) {
        graphicsGrid.appendChild(createSectionHeader('Motion Graphics', '#ff6b6b'));
        filteredAnimations.forEach(a => {
            const thumbUrl = `https://img.youtube.com/vi/${a.youtubeId}/maxresdefault.jpg`;
            graphicsGrid.appendChild(createCard(a.title, thumbUrl, 'Animation', a.youtubeId, a.url));
        });
    }

    if (filteredGraphics.length === 0 && filteredAnimations.length === 0) {
        graphicsGrid.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <p style="font-size: 1.2rem;">Sincerity takes time... No items found here yet.</p>
            </div>`;
    }
    
    // Re-init reveal animations for new items
    initScrollReveal();
}

function createCard(title, imageUrl, type, youtubeId = null, videoUrl = null) {
    const card = document.createElement('div');
    card.className = 'graphic-card reveal';
    
    const isAnim = !!youtubeId;
    
    card.innerHTML = `
        <div class="position-relative overflow-hidden">
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            ${isAnim ? '<div class="play-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; color: white; text-shadow: 0 0 20px rgba(0,0,0,0.5); pointer-events: none;">▶</div>' : ''}
            <div class="graphic-overlay">
                <h3>${title}</h3>
                <div class="d-flex gap-2">
                    ${isAnim ? `<button class="btn btn-sm btn-light w-100 watch-btn">Watch</button>` : ''}
                    <button class="btn btn-sm btn-primary w-100 buy-btn">${isAnim ? 'Order' : 'Buy via WhatsApp'}</button>
                </div>
            </div>
        </div>
    `;

    const buyBtn = card.querySelector('.buy-btn');
    buyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.buyOnWhatsApp(title);
    });

    if (isAnim) {
        const watchBtn = card.querySelector('.watch-btn');
        const handleOpen = (e) => {
            e.stopPropagation();
            if (window.openVideo) window.openVideo(youtubeId, title);
        };
        watchBtn.addEventListener('click', handleOpen);
        card.style.cursor = 'pointer';
        card.addEventListener('click', handleOpen);
    }

    return card;
}

function setupModal() {
    if (document.getElementById('video-modal')) return;
    
    const modalHtml = `
        <div id="video-modal" class="video-modal">
            <div class="video-container">
                <span class="close-modal" id="close-modal">&times;</span>
                <div id="player-container" style="aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);"></div>
                <div class="mt-4 text-center">
                    <button id="modal-buy-btn" class="btn btn-primary rounded-pill px-5 py-3 shine-effect">Interested in this Animation?</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('video-modal');
    const closeBtn = document.getElementById('close-modal');
    const playerContainer = document.getElementById('player-container');
    const modalBuyBtn = document.getElementById('modal-buy-btn');
    let currentTitle = "";

    window.openVideo = (id, title) => {
        if (!id) return;
        currentTitle = title;
        playerContainer.innerHTML = `
            <iframe width="100%" height="100%" 
                src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" 
                frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.style.display = 'none';
        playerContainer.innerHTML = '';
        document.body.style.overflow = '';
    };

    closeBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    modalBuyBtn.onclick = () => { if (currentTitle) window.buyOnWhatsApp(currentTitle); };
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal, section, .hero').forEach(el => observer.observe(el));
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                window.scrollTo({
                    top: target.offsetTop - navHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const message = document.getElementById('message').value;
        const phone = "94777489095";
        const text = encodeURIComponent(`Hi! I'm ${name}.\nWhatsApp: ${whatsapp}\n\nMessage: ${message}`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        form.reset();
    });
}

window.buyOnWhatsApp = (title) => {
    const phone = "94777489095";
    const text = encodeURIComponent(`Hi! I'm interested in: "${title}". Could you share more details?`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

document.addEventListener('DOMContentLoaded', init);

