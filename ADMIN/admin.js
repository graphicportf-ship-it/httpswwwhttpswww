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
    editModal = new bootstrap.Modal(document.getElementById('editGraphicModal'));
    statusText.textContent = 'Syncing...';
    await fetchData();
    renderAdmin();
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
    // Categories List
    catList.innerHTML = '';
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'list-group-item d-flex justify-content-between align-items-center py-3';
        div.innerHTML = `
            <span>${cat.name}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${cat.id}')">Delete</button>
        `;
        catList.appendChild(div);
    });

    // Sub-Categories List
    subCatList.innerHTML = '';
    subCategories.forEach(sub => {
        const parent = categories.find(c => c.id === sub.category_id);
        const div = document.createElement('div');
        div.className = 'list-group-item d-flex justify-content-between align-items-center py-3';
        div.innerHTML = `
            <span>${sub.name} <small class="text-muted ms-2">(${parent ? parent.name : '?'})</small></span>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteSubCategory('${sub.id}')">Delete</button>
        `;
        subCatList.appendChild(div);
    });

    // Graphics List
    adminGraphicsList.innerHTML = '';
    graphics.forEach(g => {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                <img src="${g.image_url}" class="card-img-top" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <p class="card-title fw-bold mb-1">${g.title}</p>
                    <p class="small text-muted mb-3">${subCategories.find(s => s.id === g.sub_category_id)?.name || 'Uncategorized'}</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-dark flex-grow-1" onclick="openEditModal('${g.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteGraphic('${g.id}', '${g.image_url}')">Remove</button>
                    </div>
                </div>
            </div>
        `;
        adminGraphicsList.appendChild(col);
    });

    updateDropdowns();
}

function updateDropdowns() {
    const options = '<option value="">Select Category</option>' + categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    subCatParent.innerHTML = options;
    if (animCatDropdown) animCatDropdown.innerHTML = options;

    const subOptions = '<option value="">Select Sub-category</option>' + subCategories.map(sub => {
        const parent = categories.find(c => c.id === sub.category_id);
        return `<option value="${sub.id}">${sub.name} (${parent ? parent.name : ''})</option>`;
    }).join('');
    graphicSubCat.innerHTML = subOptions;
    editGraphicSubCat.innerHTML = subOptions;
}

// Add event listener for animation category change
if (document.getElementById('anim-cat')) {
    document.getElementById('anim-cat').onchange = (e) => {
        const catId = e.target.value;
        const filtered = subCategories.filter(s => s.category_id === catId);
        const subOptions = '<option value="">Select Sub-category</option>' + filtered.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        if (document.getElementById('anim-sub-cat')) {
            document.getElementById('anim-sub-cat').innerHTML = subOptions;
        }
    };
}

// Actions
categoryForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    const { error } = await _supabase.from('categories').insert([{ name }]);
    if (error) alert(error.message);
    else {
        document.getElementById('cat-name').value = '';
        await refresh();
    }
};

subCategoryForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('sub-cat-name').value;
    const category_id = subCatParent.value;
    const { error } = await _supabase.from('sub_categories').insert([{ name, category_id }]);
    if (error) alert(error.message);
    else {
        document.getElementById('sub-cat-name').value = '';
        await refresh();
    }
};

graphicForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('graphic-title').value;
    const sub_category_id = graphicSubCat.value;
    const fileInput = document.getElementById('graphic-file');
    const file = fileInput.files[0];

    if (!file) return alert('Select a file!');

    statusText.textContent = 'Uploading...';
    const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await _supabase.storage.from('graphics').upload(fileName, file);

    if (uploadError) {
        statusText.textContent = 'Error';
        return alert(uploadError.message);
    }

    const { data: { publicUrl } } = _supabase.storage.from('graphics').getPublicUrl(fileName);
    await _supabase.from('graphics').insert([{ title, image_url: publicUrl, sub_category_id }]);
    
    fileInput.value = '';
    document.getElementById('graphic-title').value = '';
    await refresh();
};

// Edit Functionality
function openEditModal(id) {
    const g = graphics.find(item => item.id === id);
    if (!g) return;
    
    document.getElementById('edit-graphic-id').value = g.id;
    document.getElementById('edit-graphic-title').value = g.title;
    document.getElementById('edit-graphic-sub-cat').value = g.sub_category_id;
    
    editModal.show();
}

editGraphicForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-graphic-id').value;
    const title = document.getElementById('edit-graphic-title').value;
    const sub_category_id = document.getElementById('edit-graphic-sub-cat').value;

    statusText.textContent = 'Updating...';
    const { error } = await _supabase.from('graphics').update({ title, sub_category_id }).eq('id', id);

    if (error) alert(error.message);
    else {
        editModal.hide();
        await refresh();
    }
};

async function deleteCategory(id) {
    if (!confirm('Are you sure?')) return;
    await _supabase.from('categories').delete().eq('id', id);
    await refresh();
}

async function deleteSubCategory(id) {
    if (!confirm('Are you sure?')) return;
    await _supabase.from('sub_categories').delete().eq('id', id);
    await refresh();
}

async function deleteGraphic(id, imageUrl) {
    if (!confirm('Are you sure?')) return;
    const fileName = imageUrl.split('/').pop();
    await _supabase.from('graphics').delete().eq('id', id);
    await _supabase.storage.from('graphics').remove([fileName]);
    await refresh();
}

async function refresh() {
    await fetchData();
    renderAdmin();
    statusText.textContent = 'Dashboard Ready';
}

init();
