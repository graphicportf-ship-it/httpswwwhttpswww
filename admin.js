// admin.js - Unified Admin Logic
// Supabase Configuration
const SUB_URL = 'https://jfdxjpjfhekavqkzjbei.supabase.co';
const SUB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHhqcGpmaGVrYXZxa3pqYmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDAwNDAsImV4cCI6MjA5MjQxNjA0MH0.ByrHvME7bkkC5TIY09lkLvBIKr-UJ_9D4tbxLl6l8dI';

const { createClient } = supabase;
const _supabase = createClient(SUB_URL, SUB_KEY);

// State
let categories = [];
let subCategories = [];
let graphics = [];

// DOM Elements
const categoryForm = document.getElementById('category-form');
const subCategoryForm = document.getElementById('sub-category-form');
const graphicForm = document.getElementById('graphic-form');
const editGraphicForm = document.getElementById('edit-graphic-form');
const catList = document.getElementById('cat-list');
const subCatList = document.getElementById('sub-cat-list');
const adminGraphicsList = document.getElementById('admin-graphics-list');
const subCatParent = document.getElementById('sub-cat-parent');
const graphicSubCat = document.getElementById('graphic-sub-cat');
const editGraphicSubCat = document.getElementById('edit-graphic-sub-cat');
const statusText = document.getElementById('status-text');
const animCatDropdown = document.getElementById('anim-cat');
const animSubCatDropdown = document.getElementById('anim-sub-cat');

// Bootstrap Modals
let editModal;

// Initialization
async function init() {
    console.log("🛠️ Admin Dashboard Initializing...");
    
    if (document.getElementById('editGraphicModal')) {
        editModal = new bootstrap.Modal(document.getElementById('editGraphicModal'));
    }
    
    statusText.textContent = 'Syncing...';
    await fetchData();
    renderAdmin();
    await fetchAnimations();
    statusText.textContent = 'Dashboard Ready';
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

function renderAdmin() {
    if (catList) {
        catList.innerHTML = '';
        categories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'list-group-item d-flex justify-content-between align-items-center py-3 bg-transparent border-secondary text-white';
            div.innerHTML = `
                <span>${cat.name}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${cat.id}')">Delete</button>
            `;
            catList.appendChild(div);
        });
    }

    if (subCatList) {
        subCatList.innerHTML = '';
        subCategories.forEach(sub => {
            const parent = categories.find(c => c.id === sub.category_id);
            const div = document.createElement('div');
            div.className = 'list-group-item d-flex justify-content-between align-items-center py-3 bg-transparent border-secondary text-white';
            div.innerHTML = `
                <span>${sub.name} <small class="text-muted ms-2">(${parent ? parent.name : '?'})</small></span>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSubCategory('${sub.id}')">Delete</button>
            `;
            subCatList.appendChild(div);
        });
    }

    if (adminGraphicsList) {
        adminGraphicsList.innerHTML = '';
        graphics.forEach(g => {
            const col = document.createElement('div');
            col.className = 'col';
            col.innerHTML = `
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-dark text-white" style="border: 1px solid var(--glass-border) !important;">
                    <img src="${g.image_url}" class="card-img-top" style="height: 180px; object-fit: cover;">
                    <div class="card-body">
                        <p class="card-title fw-bold mb-1">${g.title}</p>
                        <p class="small text-muted mb-3">${subCategories.find(s => s.id === g.sub_category_id)?.name || 'Uncategorized'}</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-light flex-grow-1" onclick="openEditModal('${g.id}')">Edit</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteGraphic('${g.id}', '${g.image_url}')">Remove</button>
                        </div>
                    </div>
                </div>
            `;
            adminGraphicsList.appendChild(col);
        });
    }
    updateDropdowns();
}

function updateDropdowns() {
    const options = '<option value="">Select Category</option>' + categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    if (subCatParent) subCatParent.innerHTML = options;
    if (animCatDropdown) animCatDropdown.innerHTML = options;

    const subOptions = '<option value="">Select Sub-category</option>' + subCategories.map(sub => {
        const parent = categories.find(c => c.id === sub.category_id);
        return `<option value="${sub.id}">${sub.name} (${parent ? parent.name : ''})</option>`;
    }).join('');
    if (graphicSubCat) graphicSubCat.innerHTML = subOptions;
    if (editGraphicSubCat) editGraphicSubCat.innerHTML = subOptions;
}

// Global functions
window.deleteCategory = async (id) => {
    if (!confirm('Are you sure?')) return;
    await _supabase.from('categories').delete().eq('id', id);
    await refresh();
};

window.deleteSubCategory = async (id) => {
    if (!confirm('Are you sure?')) return;
    await _supabase.from('sub_categories').delete().eq('id', id);
    await refresh();
};

window.deleteGraphic = async (id, imageUrl) => {
    if (!confirm('Are you sure?')) return;
    const fileName = imageUrl.split('/').pop();
    await _supabase.from('graphics').delete().eq('id', id);
    try { await _supabase.storage.from('graphics').remove([fileName]); } catch (e) {}
    await refresh();
};

window.openEditModal = (id) => {
    const g = graphics.find(item => item.id === id);
    if (!g || !editModal) return;
    document.getElementById('edit-graphic-id').value = g.id;
    document.getElementById('edit-graphic-title').value = g.title;
    document.getElementById('edit-graphic-sub-cat').value = g.sub_category_id;
    editModal.show();
};

// Animation Management (Firebase)
async function fetchAnimations() {
    if (!window.db) return;
    try {
        const animListTbody = document.getElementById('anim-list-tbody');
        if (!animListTbody) return;
        window.db.collection("animations").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            animListTbody.innerHTML = '';
            snapshot.forEach((docSnap) => {
                const anim = docSnap.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold text-white">${anim.title}</td>
                    <td><span class="badge bg-secondary">${anim.type || 'Animation'}</span></td>
                    <td><iframe width="120" height="68" src="https://www.youtube.com/embed/${anim.youtubeId}" frameborder="0"></iframe></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAnimation('${docSnap.id}')">Delete</button>
                    </td>
                `;
                animListTbody.appendChild(tr);
            });
        });
    } catch (e) { console.error(e); }
}

window.deleteAnimation = async (id) => {
    if (!confirm('Delete this animation?')) return;
    await window.db.collection("animations").doc(id).delete();
};

// Forms
if (categoryForm) {
    categoryForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name').value;
        await _supabase.from('categories').insert([{ name }]);
        document.getElementById('cat-name').value = '';
        await refresh();
    };
}

if (subCategoryForm) {
    subCategoryForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('sub-cat-name').value;
        const category_id = subCatParent.value;
        await _supabase.from('sub_categories').insert([{ name, category_id }]);
        document.getElementById('sub-cat-name').value = '';
        await refresh();
    };
}

if (graphicForm) {
    graphicForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('graphic-title').value;
        const sub_category_id = graphicSubCat.value;
        const file = document.getElementById('graphic-file').files[0];
        if (!file) return;
        statusText.textContent = 'Uploading...';
        const fileName = `${Date.now()}_${file.name}`;
        await _supabase.storage.from('graphics').upload(fileName, file);
        const { data: { publicUrl } } = _supabase.storage.from('graphics').getPublicUrl(fileName);
        await _supabase.from('graphics').insert([{ title, image_url: publicUrl, sub_category_id }]);
        await refresh();
    };
}

const animForm = document.getElementById('animation-form');
if (animForm) {
    animForm.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('anim-title').value;
        const url = document.getElementById('anim-url').value;
        const categoryId = document.getElementById('anim-cat').value;
        const subCategoryId = document.getElementById('anim-sub-cat').value;
        
        const getYoutubeID = (url) => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        };

        const youtubeId = getYoutubeID(url);
        if (!youtubeId) return alert("Invalid URL");
        await window.db.collection("animations").add({
            title, youtubeId, url, categoryId, subCategoryId,
            type: "Animations", createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        animForm.reset();
    };
}

async function refresh() {
    await fetchData();
    renderAdmin();
    statusText.textContent = 'Dashboard Ready';
}

init();