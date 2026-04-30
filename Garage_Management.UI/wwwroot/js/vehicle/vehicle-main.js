import CONFIG from '../config.js';

let currentTab = 'brands';
let currentPage = 1;
let totalPages = 1;
let cachedBrands = [];
let cachedTypes = [];
let editingId = null;          // id đang edit (null = đang create)
let lastLoadedRows = [];       // cache rows trang hiện tại để pre-fill khi edit
let currentKeyword = '';       // search theo tên
let currentBrandFilter = '';   // filter brand (chỉ áp dụng cho tab Models)

const API_ENDPOINTS = {
    brands: `${CONFIG.API_BASE_URL}/VehicleBrands`,
    models: `${CONFIG.API_BASE_URL}/VehicleModels`,
    types: `${CONFIG.API_BASE_URL}/VehicleTypes`
};

// Tên field id của từng tab (BE response trả khác nhau)
const ID_FIELD = {
    brands: 'brandId',
    models: 'modelId',
    types: 'vehicleTypeId'
};

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
});

document.addEventListener('DOMContentLoaded', () => {
    loadTableData();
    const userInfoStr = localStorage.getItem('userInfo');

    if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        document.getElementById('display-name').innerText = `${userInfo.fullName} (${userInfo.email})`;
    }

    document.getElementById('prev-btn').onclick = () => changePage(-1);
    document.getElementById('next-btn').onclick = () => changePage(1);
    document.getElementById('vehicle-form').onsubmit = handleFormSubmit;

    // Search debounce
    let searchTimer;
    document.getElementById('vehicle-search')?.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentKeyword = e.target.value.trim();
            currentPage = 1;
            loadTableData();
        }, 350);
    });

    // Brand filter (Models tab) — đổi → fetch lại
    document.getElementById('brand-filter')?.addEventListener('change', (e) => {
        currentBrandFilter = e.target.value;
        currentPage = 1;
        loadTableData();
    });
});

// --- LOGIC PHÂN TRANG ---
function changePage(step) {
    const newPage = currentPage + step;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadTableData();
    }
}

// --- TẢI DỮ LIỆU BẢNG ---
async function loadTableData() {
    const tableBody = document.getElementById('vehicle-table-body');
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Đang tải...</td></tr>';

    try {
        if (currentTab === 'models') {
            await refreshCaches();
            populateBrandFilter();
        }

        // Build URL: tab Models + có brandFilter → dùng endpoint mới /VehicleBrands/{id}/models
        const qs = new URLSearchParams({ page: currentPage, pageSize: 10 });
        if (currentKeyword) qs.set('keyword', currentKeyword);

        let url;
        if (currentTab === 'models' && currentBrandFilter) {
            url = `${API_ENDPOINTS.brands}/${currentBrandFilter}/models?${qs}`;
        } else {
            url = `${API_ENDPOINTS[currentTab]}?${qs}`;
        }

        const response = await fetch(url, { headers: getAuthHeaders() });
        const result = await response.json();
        const list = result.data?.pageData || [];
        lastLoadedRows = list;

        totalPages = Math.ceil((result.data?.total || 0) / 10) || 1;

        renderTableHeader();
        renderTableBody(list);
        updatePaginationUI();
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

// Đổ danh sách brand vào filter dropdown (chỉ visible khi tab = models)
function populateBrandFilter() {
    const sel = document.getElementById('brand-filter');
    if (!sel) return;
    if (sel.options.length <= 1) {
        sel.innerHTML = '<option value="">-- Tất cả thương hiệu --</option>' +
            cachedBrands.map(b => `<option value="${b.brandId}">${b.brandName}</option>`).join('');
    }
    sel.value = currentBrandFilter || '';
}

function updatePaginationUI() {
    document.getElementById('page-info').innerText = `Trang ${currentPage} / ${totalPages}`;
    document.getElementById('prev-btn').disabled = (currentPage === 1);
    document.getElementById('next-btn').disabled = (currentPage === totalPages);
}

// --- QUẢN LÝ TAB ---
window.openTab = (tabName) => {
    currentTab = tabName;
    currentPage = 1;
    currentKeyword = '';
    currentBrandFilter = '';

    document.querySelectorAll('.tab-link').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
    });

    const titles = { brands: 'Thương hiệu', models: 'Dòng xe', types: 'Loại xe' };
    document.getElementById('tab-title').innerText = `Danh sách ${titles[tabName]}`;

    // Reset search input + brand filter visibility (chỉ Models hiện brand filter)
    const searchInput = document.getElementById('vehicle-search');
    if (searchInput) searchInput.value = '';
    const brandFilter = document.getElementById('brand-filter');
    if (brandFilter) {
        brandFilter.style.display = tabName === 'models' ? 'inline-block' : 'none';
        brandFilter.value = '';
    }

    loadTableData();
};

// --- RENDER GIAO DIỆN BẢNG ---
function renderTableHeader() {
    const head = document.getElementById('table-head');
    if (currentTab === 'brands') {
        head.innerHTML = `<th>ID</th><th>Tên thương hiệu</th><th>Trạng thái</th><th class="text-center">Thao tác</th>`;
    } else if (currentTab === 'models') {
        head.innerHTML = `<th>ID</th><th>Tên dòng xe</th><th>Thương hiệu</th><th>Loại xe</th><th>Trạng thái</th><th class="text-center">Thao tác</th>`;
    } else {
        head.innerHTML = `<th>ID</th><th>Loại xe</th><th>Mô tả</th><th>Trạng thái</th><th class="text-center">Thao tác</th>`;
    }
}

function renderTableBody(data) {
    const body = document.getElementById('vehicle-table-body');
    const brandNameById = new Map(cachedBrands.map(b => [Number(b.brandId), b.brandName]));
    const typeNameById = new Map(cachedTypes.map(t => [Number(t.vehicleTypeId), t.typeName]));

    body.innerHTML = data.map(item => {
        const id = item[ID_FIELD[currentTab]];
        const name = item.brandName || item.modelName || item.typeName;
        const statusClass = item.isActive ? 'status-active' : 'status-inactive';
        const toggleTitle = item.isActive ? 'Vô hiệu hóa' : 'Kích hoạt';
        const toggleIcon = item.isActive ? 'fa-toggle-on' : 'fa-toggle-off';
        const toggleColor = item.isActive ? '#10b981' : '#94a3b8';

        let extraCols = '';
        if (currentTab === 'models') {
            const brandName = item.brandName || brandNameById.get(Number(item.brandId)) || item.brandId || '';
            const typeName = item.typeName || typeNameById.get(Number(item.typeId)) || item.typeId || '';
            extraCols = `<td>${brandName}</td><td>${typeName}</td>`;
        } else if (currentTab === 'types') {
            extraCols = `<td>${item.description || ''}</td>`;
        }

        return `
            <tr>
                <td>${id}</td>
                <td><strong>${name}</strong></td>
                ${extraCols}
                <td><span class="status-pill ${statusClass}">${item.isActive ? 'Active' : 'Inactive'}</span></td>
                <td class="text-center" style="white-space:nowrap;">
                    <button class="btn-icon" title="Sửa" style="color:#4f46e5;" onclick="editItem(${id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" title="${toggleTitle}" style="color:${toggleColor};" onclick="toggleActive(${id})">
                        <i class="fas ${toggleIcon}"></i>
                    </button>
                    <button class="btn-icon text-danger" title="Xóa cứng" onclick="hardDeleteItem(${id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}

// --- MODAL & FORM ---
window.showAddModal = async () => {
    editingId = null;                       // tạo mới
    await openModal();
};

window.editItem = async (id) => {
    const item = lastLoadedRows.find(r => r[ID_FIELD[currentTab]] === id);
    if (!item) {
        alert('Không tìm thấy dữ liệu để sửa.');
        return;
    }
    editingId = id;
    await openModal(item);
};

async function openModal(item = null) {
    const modal = document.getElementById('vehicle-modal');
    const fields = document.getElementById('form-fields');
    const titleEl = document.querySelector('#vehicle-modal h3, #vehicle-modal .modal-title, #vehicle-modal-title');

    modal.style.display = 'block';
    fields.innerHTML = 'Đang tải...';
    if (titleEl) titleEl.innerText = item ? 'Chỉnh sửa' : 'Thêm mới';

    if (currentTab === 'brands') {
        fields.innerHTML = renderInputField("Tên thương hiệu", "brandName", "VD: Honda...", item?.brandName);
    } else if (currentTab === 'models') {
        await refreshCaches();
        fields.innerHTML = `
            ${renderInputField("Tên dòng xe", "modelName", "VD: SH 150i...", item?.modelName)}
            <div class="form-group">
                <label>Thương hiệu</label>
                <select name="brandId" required>
                    <option value="">-- Chọn thương hiệu --</option>
                    ${cachedBrands.map(b => `<option value="${b.brandId}" ${item?.brandId == b.brandId ? 'selected' : ''}>${b.brandName}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Loại xe</label>
                <select name="typeId" required>
                    <option value="">-- Chọn loại xe --</option>
                    ${cachedTypes.map(t => `<option value="${t.vehicleTypeId}" ${item?.typeId == t.vehicleTypeId ? 'selected' : ''}>${t.typeName}</option>`).join('')}
                </select>
            </div>`;
    } else {
        fields.innerHTML = `
            ${renderInputField("Tên loại xe", "typeName", "VD: Xe ga...", item?.typeName)}
            <div class="form-group">
                <label>Mô tả</label>
                <textarea name="description" rows="2">${item?.description || ''}</textarea>
            </div>`;
    }

    fields.innerHTML += `
        <div class="form-group-checkbox">
            <input type="checkbox" name="isActive" ${item ? (item.isActive ? 'checked' : '') : 'checked'} id="chk-active">
            <label for="chk-active">Đang hoạt động</label>
        </div>`;
}

function renderInputField(label, name, placeholder, value = '') {
    const safeValue = String(value || '').replace(/"/g, '&quot;');
    return `<div class="form-group"><label>${label}</label><input type="text" name="${name}" required placeholder="${placeholder}" value="${safeValue}"></div>`;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    payload.isActive = formData.get('isActive') === 'on';
    if (payload.brandId) payload.brandId = parseInt(payload.brandId);
    if (payload.typeId) payload.typeId = parseInt(payload.typeId);

    const nameValue = payload.brandName || payload.modelName || payload.typeName;
    if (!nameValue || nameValue.trim().length < 2) {
        alert("Vui lòng nhập tên hợp lệ (tối thiểu 2 ký tự)");
        return;
    }

    const isEdit = editingId !== null;
    const url = isEdit
        ? `${API_ENDPOINTS[currentTab]}/${editingId}`
        : API_ENDPOINTS[currentTab];

    try {
        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.closeModal();
            loadTableData();
        } else {
            const err = await res.json().catch(() => ({}));
            alert("Lỗi: " + (err.message || `Không thể ${isEdit ? 'cập nhật' : 'lưu'}`));
        }
    } catch (e) {
        alert("Lỗi kết nối server");
    }
}

async function refreshCaches() {
    const [bRes, tRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.brands}?page=1&pageSize=100`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.types}?page=1&pageSize=100`, { headers: getAuthHeaders() })
    ]);
    const bData = await bRes.json();
    const tData = await tRes.json();
    cachedBrands = bData.data?.pageData || [];
    cachedTypes = tData.data?.pageData || [];
}

window.closeModal = () => {
    document.getElementById('vehicle-modal').style.display = 'none';
    editingId = null;
};

// --- TOGGLE ACTIVE (PATCH /{id}) ---
window.toggleActive = async (id) => {
    if (!confirm("Đổi trạng thái Active/Inactive cho mục này?")) return;
    try {
        const res = await fetch(`${API_ENDPOINTS[currentTab]}/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            loadTableData();
        } else {
            const err = await res.json().catch(() => ({}));
            alert("Không đổi trạng thái được: " + (err.message || `HTTP ${res.status}`));
        }
    } catch (e) {
        alert("Lỗi kết nối server");
    }
};

// --- HARD DELETE (DELETE /{id}) ---
window.hardDeleteItem = async (id) => {
    if (!confirm("⚠️ XÓA VĨNH VIỄN mục này?\n\nLưu ý: nếu mục đang có dữ liệu liên kết (model/vehicle/service-mapping) sẽ bị từ chối.")) return;
    try {
        const res = await fetch(`${API_ENDPOINTS[currentTab]}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            loadTableData();
        } else {
            const err = await res.json().catch(() => ({}));
            alert("Không xóa được: " + (err.message || "Có dữ liệu liên kết, hãy đổi sang Inactive thay vì xóa cứng."));
        }
    } catch (e) {
        alert("Lỗi kết nối server");
    }
};
