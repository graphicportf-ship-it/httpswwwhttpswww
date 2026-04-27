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
    console.log("Initializing Portfolio...");
    
    // Initialize Firebase if not already done
    if (!window.db && window.firebase && window.firebase.initializeApp) {
        const firebaseConfig = {
            apiKey: "AIzaSyDY_HmNfD_QFLI7Vwj39s1b3WHKEKD80nQ",
            authDomain: "ovkb-8d398.firebaseapp.com",
            projectId: "ovkb-8d398",
            storageBucket: "ovkb-8d398.firebasestorage.app",
            messagingSenderId: "804850492300",
            appId: "1:804850492300:web:cf90f3c83773e1f13caca9"
        };
        window.firebase.initializeApp(firebaseConfig);
        window.db = window.firebase.firestore();
    }
    
    if (graphicsGrid) {
        await fetchData();
        renderFilters();
        renderItems();
    }
    
    initScrollReveal();
    setupModal();
}

async function fetchData() {
    // 1. Initialize Supabase Client
    if (!window.supabase) {
        console.error("Supabase script not loaded!");
    } else {
        const SUB_URL = 'https://jfdxjpjfhekavqkzjbei.supabase.co';
        const SUB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHhqcGpmaGVrYXZxa3pqYmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDAwNDAsImV4cCI6MjA5MjQxNjA0MH0.ByrHvME7bkkC5TIY09lkLvBIKr-UJ_9D4tbxLl6l8dI';
        _supabase = window.supabase.createClient(SUB_URL, SUB_KEY);
    }

    // 2. Fetch from Supabase (Graphics)
    if (_supabase) {
        try {
            const { data: catData, error: catError } = await _supabase.from('categories').select('*').order('name');
            const { data: subCatData, error: subError } = await _supabase.from('sub_categories').select('*').order('name');
            const { data: graphData, error: graphError } = await _supabase.from('graphics').select('*').order('created_at', { ascending: false });
            
            categories = catData || [];
            subCategories = subCatData || [];
            graphics = graphData || [];
            console.log("Supabase Data Loaded:", { cats: categories.length, graphics: graphics.length });
        } catch (err) {
            console.error("Supabase Error:", err);
        }
    }

    // 3. Fetch from Firebase (Animations)
    console.log("Checking Firebase 'db'...", window.db ? "Available" : "NOT Available");
    if (window.db) {
        try {
            console.log("Fetching animations from Firestore...");
            const snapshot = await window.db.collection("animations").orderBy("createdAt", "desc").get();
            animations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Firebase Animations Loaded:", animations.length);
        } catch (err) {
            console.error("Firebase Error:", err);
        }
    } else {
        console.warn("Firebase (db) not initialized. Skipping animations.");
    }
}

function renderFilters() {
    if (!categoryFilters) return;

    // Categories
    categoryFilters.innerHTML = '';
    
    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.className = `filter-btn ${activeCategoryId === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'All';
    allBtn.onclick = () => {
        activeCategoryId = 'all';
        activeSubCategoryId = null;
        renderFilters();
        renderItems();
    };
    categoryFilters.appendChild(allBtn);

    // Category buttons
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${activeCategoryId === cat.id ? 'active' : ''}`;
        btn.textContent = cat.name;
        btn.onclick = () => {
            activeCategoryId = cat.id;
            activeSubCategoryId = null;
            renderFilters();
            renderItems();
        };
        categoryFilters.appendChild(btn);
    });

    // Sub-categories
    subCategoryFilters.innerHTML = '';
    if (activeCategoryId !== 'all') {
        const filteredSubCats = subCategories.filter(s => s.category_id === activeCategoryId);
        
        const allSubBtn = document.createElement('button');
        allSubBtn.className = `filter-btn sub ${!activeSubCategoryId ? 'active' : ''}`;
        allSubBtn.textContent = 'All Types';
        allSubBtn.onclick = () => {
            activeSubCategoryId = null;
            renderFilters();
            renderItems();
        };
        subCategoryFilters.appendChild(allSubBtn);

        filteredSubCats.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = `filter-btn sub ${activeSubCategoryId === sub.id ? 'active' : ''}`;
            btn.textContent = sub.name;
            btn.onclick = () => {
                activeSubCategoryId = sub.id;
                renderFilters();
                renderItems();
            };
            subCategoryFilters.appendChild(btn);
        });
    }
}

function renderItems() {
    if (!graphicsGrid) return;
    graphicsGrid.innerHTML = '';
    
    // Initialize filtered lists
    let filteredGraphics = graphics;
    let filteredAnimations = animations;

    // Apply category and sub-category filtering
    if (activeCategoryId !== 'all') {
        // Filter graphics by category (via sub-category IDs)
        const validSubCatIds = subCategories.filter(s => s.category_id === activeCategoryId).map(s => s.id);
        filteredGraphics = graphics.filter(g => validSubCatIds.includes(g.sub_category_id));
        
        // Filter animations by category
        filteredAnimations = animations.filter(a => a.categoryId === activeCategoryId);

        if (activeSubCategoryId) {
            filteredGraphics = filteredGraphics.filter(g => g.sub_category_id === activeSubCategoryId);
            filteredAnimations = filteredAnimations.filter(a => a.subCategoryId === activeSubCategoryId);
        }
    }

    // Show header for Designs if there are designs
    if (filteredGraphics.length > 0) {
        const designHeader = document.createElement('div');
        designHeader.className = 'col-12 mb-4';
        designHeader.style.gridColumn = "1 / -1";
        designHeader.innerHTML = `<h2 class="text-center fw-bold" style="color: var(--accent);">Designs</h2><hr style="width: 50px; margin: 10px auto; border: 2px solid var(--accent); opacity: 1;">`;
        graphicsGrid.appendChild(designHeader);

        filteredGraphics.forEach(g => {
            const card = createCard(g.title, g.image_url, 'Design');
            graphicsGrid.appendChild(card);
        });
    }

    // Show header for Animations if there are animations
    if (filteredAnimations.length > 0) {
        const animHeader = document.createElement('div');
        animHeader.className = 'col-12 mt-5 mb-4';
        animHeader.style.gridColumn = "1 / -1";
        animHeader.innerHTML = `<h2 class="text-center fw-bold" style="color: #ff6b6b;">Animations</h2><hr style="width: 50px; margin: 10px auto; border: 2px solid #ff6b6b; opacity: 1;">`;
        graphicsGrid.appendChild(animHeader);

        filteredAnimations.forEach(a => {
            const thumbUrl = `https://img.youtube.com/vi/${a.youtubeId}/maxresdefault.jpg`;
            const card = createCard(a.title, thumbUrl, 'Animation', a.youtubeId, a.url);
            graphicsGrid.appendChild(card);
        });
    }

    if (filteredGraphics.length === 0 && filteredAnimations.length === 0) {
        graphicsGrid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No items found here yet.</div>';
    }
}

function createCard(title, imageUrl, type, youtubeId = null, videoUrl = null) {
    const card = document.createElement('div');
    card.className = 'graphic-card';
    if (youtubeId) {
        card.innerHTML = `
            <div class="position-relative">
                <img src="${imageUrl}" alt="${title}" loading="lazy">
                <div class="play-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;">▶</div>
            </div>
            <div class="graphic-overlay">
                <h3>${title}</h3>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-light w-100 watch-btn">Watch</button>
                    <button class="btn btn-sm btn-primary w-100 buy-btn">Buy</button>
                </div>
            </div>
        `;
        // Use event listeners instead of onclick
        const watchBtn = card.querySelector('.watch-btn');
        const buyBtn = card.querySelector('.buy-btn');
        
        watchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // User requested that "Watch" opens the actual YouTube link
            if (videoUrl) window.open(videoUrl, '_blank');
            else if (window.openVideo) window.openVideo(youtubeId, title);
        });
        
        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.buyOnWhatsApp) window.buyOnWhatsApp(title);
        });
        
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            if (window.openVideo) window.openVideo(youtubeId, title);
        });
    } else {
        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            <div class="graphic-overlay">
                <h3>${title}</h3>
                <button class="btn btn-sm btn-light w-100 buy-btn">Buy via WhatsApp</button>
            </div>
        `;
        const buyBtn = card.querySelector('.buy-btn');
        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.buyOnWhatsApp) window.buyOnWhatsApp(title);
        });
    }
    return card;
}

// Setup modal first
function setupModal() {
    if (document.getElementById('video-modal')) {
        // Modal already exists, just get references
        const modal = document.getElementById('video-modal');
        const closeBtn = document.getElementById('close-modal');
        const playerContainer = document.getElementById('player-container');
        const modalBuyBtn = document.getElementById('modal-buy-btn');
        let currentTitle = "";
        
        window.openVideo = (id, title) => {
            if (!id) {
                console.error("No video ID provided");
                return alert("Video ID not found.");
            }
            currentTitle = title;
            console.log("Opening video:", id, title);
            
            const finalUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
            
            playerContainer.innerHTML = `
                <iframe 
                    width="100%" 
                    height="315" 
                    src="${finalUrl}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerpolicy="strict-origin-when-cross-origin" 
                    allowfullscreen>
                </iframe>
            `;
            modal.style.display = 'flex';
        };
        
        closeBtn.onclick = () => { 
            modal.style.display = 'none'; 
            playerContainer.innerHTML = ''; 
        };
        window.onclick = (e) => { 
            if (e.target == modal) { 
                modal.style.display = 'none'; 
                playerContainer.innerHTML = ''; 
            } 
        };
        modalBuyBtn.onclick = () => {
            if (currentTitle) window.buyOnWhatsApp(currentTitle);
        };
        return;
    }
    
    const modalHtml = `<div id="video-modal" class="video-modal"><div class="video-container"><span class="close-modal" id="close-modal">&times;</span><div id="player-container"></div><div class="mt-4 text-center"><button id="modal-buy-btn" class="btn btn-primary btn-lg rounded-pill px-5">Buy on WhatsApp</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setupModal(); // Re-run to set up handlers
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('reveal-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('section, .hero, .page-header').forEach(el => { el.classList.add('reveal'); observer.observe(el); });
}

window.buyOnWhatsApp = (title) => {
    const phone = "94777489095";
    const text = encodeURIComponent(`Hi! I'm interested in buying: "${title}". Can you provide more details?`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

document.addEventListener('DOMContentLoaded', init);
