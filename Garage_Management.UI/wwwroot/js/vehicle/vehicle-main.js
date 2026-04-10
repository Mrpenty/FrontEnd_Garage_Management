import CONFIG from '../config.js';

let currentTab = 'brands';
let currentPage = 1;
let totalPages = 1;
let cachedBrands = [];
let cachedTypes = [];

const API_ENDPOINTS = {
    brands: `${CONFIG.API_BASE_URL}/VehicleBrands`,
    models: `${CONFIG.API_BASE_URL}/VehicleModels`,
    types: `${CONFIG.API_BASE_URL}/VehicleTypes`
};

document.addEventListener('DOMContentLoaded', () => {
    loadTableData();
    const userInfoStr = localStorage.getItem('userInfo');

    if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        document.getElementById('display-name').innerText = `${userInfo.fullName} (${userInfo.email})`;
    }

    // Gán sự kiện cho các nút phân trang
    document.getElementById('prev-btn').onclick = () => changePage(-1);
    document.getElementById('next-btn').onclick = () => changePage(1);
    
    // Gắn sự kiện submit cho form
    document.getElementById('vehicle-form').onsubmit = handleFormSubmit;
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
        const response = await fetch(`${API_ENDPOINTS[currentTab]}?page=${currentPage}&pageSize=10`);
        const result = await response.json();
        const list = result.data?.pageData || [];
        
        // Tính toán tổng trang
        totalPages = Math.ceil((result.data?.total || 0) / 10) || 1;

        renderTableHeader();
        renderTableBody(list);
        updatePaginationUI();
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Lỗi tải dữ liệu</td></tr>';
    }
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

    // Cập nhật UI nút Tab
    document.querySelectorAll('.tab-link').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
    });

    const titles = { brands: 'Thương hiệu', models: 'Dòng xe', types: 'Loại xe' };
    document.getElementById('tab-title').innerText = `Danh sách ${titles[tabName]}`;
    
    loadTableData();
};

// --- RENDER GIAO DIỆN BẢNG ---
function renderTableHeader() {
    const head = document.getElementById('table-head');
    if (currentTab === 'brands') {
        head.innerHTML = `<th>ID</th><th>Tên thương hiệu</th><th>Trạng thái</th><th>Thao tác</th>`;
    } else if (currentTab === 'models') {
        head.innerHTML = `<th>ID</th><th>Tên dòng xe</th><th>Thương hiệu</th><th>Loại xe</th><th>Trạng thái</th><th>Thao tác</th>`;
    } else {
        head.innerHTML = `<th>ID</th><th>Loại xe</th><th>Mô tả</th><th>Trạng thái</th><th>Thao tác</th>`;
    }
}

function renderTableBody(data) {
    const body = document.getElementById('vehicle-table-body');
    body.innerHTML = data.map(item => {
        const id = item.brandId || item.modelId || item.vehicleTypeId;
        const name = item.brandName || item.modelName || item.typeName;
        const statusClass = item.isActive ? 'status-active' : 'status-inactive';

        let extraCols = '';
        if (currentTab === 'models') {
            extraCols = `<td>${item.brandName || item.brandId}</td><td>${item.typeName || item.typeId}</td>`;
        } else if (currentTab === 'types') {
            extraCols = `<td>${item.description || ''}</td>`;
        }

        return `
            <tr>
                <td>${id}</td>
                <td><strong>${name}</strong></td>
                ${extraCols}
                <td><span class="status-pill ${statusClass}">${item.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn-icon text-danger" onclick="deleteItem(${id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    }).join('');
}

// --- MODAL & VALIDATION ---
window.showAddModal = async () => {
    const modal = document.getElementById('vehicle-modal');
    const fields = document.getElementById('form-fields');
    modal.style.display = 'block';
    fields.innerHTML = 'Đang tải...';

    if (currentTab === 'brands') {
        fields.innerHTML = renderInputField("Tên thương hiệu", "brandName", "VD: Honda...");
    } 
    else if (currentTab === 'models') {
        await refreshCaches();
        fields.innerHTML = `
            ${renderInputField("Tên dòng xe", "modelName", "VD: SH 150i...")}
            <div class="form-group">
                <label>Thương hiệu</label>
                <select name="brandId" required>
                    <option value="">-- Chọn thương hiệu --</option>
                    ${cachedBrands.map(b => `<option value="${b.brandId}">${b.brandName}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Loại xe</label>
                <select name="typeId" required>
                    <option value="">-- Chọn loại xe --</option>
                    ${cachedTypes.map(t => `<option value="${t.vehicleTypeId}">${t.typeName}</option>`).join('')}
                </select>
            </div>`;
    } 
    else {
        fields.innerHTML = `
            ${renderInputField("Tên loại xe", "typeName", "VD: Xe ga...")}
            <div class="form-group">
                <label>Mô tả</label>
                <textarea name="description" rows="2"></textarea>
            </div>`;
    }
    // Checkbox Active mặc định
    fields.innerHTML += `
        <div class="form-group-checkbox">
            <input type="checkbox" name="isActive" checked id="chk-active">
            <label for="chk-active">Đang hoạt động</label>
        </div>`;
};

function renderInputField(label, name, placeholder) {
    return `<div class="form-group"><label>${label}</label><input type="text" name="${name}" required placeholder="${placeholder}"></div>`;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    // Ép kiểu dữ liệu & Validate
    payload.isActive = formData.get('isActive') === 'on';
    if (payload.brandId) payload.brandId = parseInt(payload.brandId);
    if (payload.typeId) payload.typeId = parseInt(payload.typeId);

    // Validate chuỗi trống (trim)
    const nameValue = payload.brandName || payload.modelName || payload.typeName;
    if (!nameValue || nameValue.trim().length < 2) {
        alert("Vui lòng nhập tên hợp lệ (tối thiểu 2 ký tự)");
        return;
    }

    try {
        const res = await fetch(API_ENDPOINTS[currentTab], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.closeModal();
            loadTableData();
        } else {
            const err = await res.json();
            alert("Lỗi: " + (err.message || "Không thể lưu"));
        }
    } catch (e) { alert("Lỗi kết nối server"); }
}

async function refreshCaches() {
    const [bRes, tRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.brands}?page=1&pageSize=100`),
        fetch(`${API_ENDPOINTS.types}?page=1&pageSize=100`)
    ]);
    const bData = await bRes.json();
    const tData = await tRes.json();
    cachedBrands = bData.data?.pageData || [];
    cachedTypes = tData.data?.pageData || [];
}

window.closeModal = () => document.getElementById('vehicle-modal').style.display = 'none';

window.deleteItem = async (id) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mục này?")) return;
    try {
        const res = await fetch(`${API_ENDPOINTS[currentTab]}/${id}`, { method: 'DELETE' });
        if (res.ok) loadTableData();
        else alert("Không thể xóa (có thể đang có dữ liệu liên quan)");
    } catch (e) { alert("Lỗi kết nối"); }
};