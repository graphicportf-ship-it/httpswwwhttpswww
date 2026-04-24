// Supabase Configuration
const SUB_URL = 'https://jfdxjpjfhekavqkzjbei.supabase.co';
const SUB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHhqcGpmaGVrYXZxa3pqYmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDAwNDAsImV4cCI6MjA5MjQxNjA0MH0.ByrHvME7bkkC5TIY09lkLvBIKr-UJ_9D4tbxLl6l8dI';

const { createClient } = supabase;
const _supabase = createClient(SUB_URL, SUB_KEY);

// State
let categories = [];
let subCategories = [];
let graphics = [];
let activeCategoryId = 'all';
let activeSubCategoryId = null;

// DOM Elements
const mainFilter = document.getElementById('main-filter');
const categoryFilters = document.getElementById('category-filters');
const subCategoryFilters = document.getElementById('sub-category-filters');
const graphicsGrid = document.getElementById('graphics-grid');

// Initialization
async function init() {
    if (graphicsGrid) {
        await fetchData();
        renderFilters();
        renderGraphics();
    }
    
    // Initialize Scroll Reveal
    initScrollReveal();
}

async function fetchData() {
    try {
        const { data: catData } = await _supabase.from('categories').select('*').order('name');
        const { data: subCatData } = await _supabase.from('sub_categories').select('*').order('name');
        const { data: graphData } = await _supabase.from('graphics').select('*').order('created_at', { ascending: false });
        
        categories = catData || [];
        subCategories = subCatData || [];
        graphics = graphData || [];
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

function renderFilters() {
    if (!categoryFilters || !mainFilter) return;

    // Main Filter (All Categories)
    mainFilter.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = `filter-btn main ${activeCategoryId === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'All Categories';
    allBtn.onclick = () => {
        activeCategoryId = 'all';
        activeSubCategoryId = null;
        renderFilters();
        renderGraphics();
    };
    mainFilter.appendChild(allBtn);

    // Categories
    categoryFilters.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${activeCategoryId === cat.id ? 'active' : ''}`;
        btn.textContent = cat.name;
        btn.onclick = () => {
            activeCategoryId = cat.id;
            activeSubCategoryId = null;
            renderFilters();
            renderGraphics();
        };
        categoryFilters.appendChild(btn);
    });

    // Sub-categories
    subCategoryFilters.innerHTML = '';
    if (activeCategoryId !== 'all') {
        const filteredSubCats = subCategories.filter(s => s.category_id === activeCategoryId);
        
        const allSubBtn = document.createElement('button');
        allSubBtn.className = `filter-btn sub ${!activeSubCategoryId ? 'active' : ''}`;
        allSubBtn.textContent = 'All Designs';
        allSubBtn.onclick = () => {
            activeSubCategoryId = null;
            renderFilters();
            renderGraphics();
        };
        subCategoryFilters.appendChild(allSubBtn);

        filteredSubCats.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = `filter-btn sub ${activeSubCategoryId === sub.id ? 'active' : ''}`;
            btn.textContent = sub.name;
            btn.onclick = () => {
                activeSubCategoryId = sub.id;
                renderFilters();
                renderGraphics();
            };
            subCategoryFilters.appendChild(btn);
        });
    }
}

function renderGraphics() {
    if (!graphicsGrid) return;
    graphicsGrid.innerHTML = '';
    
    let filtered = graphics;
    
    if (activeCategoryId !== 'all') {
        const validSubCatIds = subCategories.filter(s => s.category_id === activeCategoryId).map(s => s.id);
        filtered = graphics.filter(g => validSubCatIds.includes(g.sub_category_id));
        
        if (activeSubCategoryId) {
            filtered = filtered.filter(g => g.sub_category_id === activeSubCategoryId);
        }
    }

    if (filtered.length === 0) {
        graphicsGrid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No designs found here yet.</div>';
        return;
    }

    filtered.forEach(g => {
        const card = document.createElement('div');
        card.className = 'graphic-card';
        card.innerHTML = `
            <img src="${g.image_url}" alt="${g.title}" loading="lazy">
            <div class="graphic-overlay">
                <h3>${g.title}</h3>
                <button class="btn btn-primary w-100" onclick="buyOnWhatsApp('${g.title}')">Buy on WhatsApp</button>
            </div>
        `;
        graphicsGrid.appendChild(card);
    });
}

function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section, .hero, .page-header').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

function buyOnWhatsApp(title) {
    const phone = "94782594427";
    const text = encodeURIComponent(`Hi! I'm interested in buying your design: "${title}". Can you provide more details?`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
}

init();
