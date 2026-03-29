import CONFIG from '../config.js';

let currentTab = 'brands';
let currentPage = 1;
let cachedBrands = [];
let cachedTypes = [];

const API_ENDPOINTS = {
    brands: `${CONFIG.API_BASE_URL}/VehicleBrands`,
    models: `${CONFIG.API_BASE_URL}/VehicleModels`,
    types: `${CONFIG.API_BASE_URL}/VehicleTypes`
};

document.addEventListener('DOMContentLoaded', () => {
    loadTableData();

    // Sự kiện chuyển Tab
    window.openTab = (tabName) => {
        currentTab = tabName;
        currentPage = 1;
        document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const titles = { brands: 'Thương hiệu', models: 'Dòng xe', types: 'Loại xe' };
        document.getElementById('tab-title').innerText = `Danh sách ${titles[tabName]}`;
        
        loadTableData();
    };
});

async function loadTableData() {
    try {
        const response = await fetch(`${API_ENDPOINTS[currentTab]}?page=${currentPage}&pageSize=10`);
        const result = await response.json();
        const list = result.data.pageData;

        renderTableHeader();
        renderTableBody(list);
        document.getElementById('page-info').innerText = `Trang ${result.data.page} / ${Math.ceil(result.data.total / 10)}`;
    } catch (error) {
        console.error("Lỗi load dữ liệu:", error);
    }
}

function renderTableHeader() {
    const head = document.getElementById('table-head');
    if (currentTab === 'brands') {
        head.innerHTML = `<th>ID</th><th>Tên thương hiệu</th><th>Trạng thái</th><th>Thao tác</th>`;
    } else if (currentTab === 'models') {
        head.innerHTML = `<th>ID</th><th>Tên dòng xe</th><th>Brand ID</th><th>Type ID</th><th>Trạng thái</th><th>Thao tác</th>`;
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
            extraCols = `<td>${item.brandId}</td><td>${item.typeId}</td>`;
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
                    <button class="btn-icon" onclick="editItem(${id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon text-danger" onclick="deleteItem(${id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

// Logic CRUD cơ bản
window.showAddModal = () => {
    document.getElementById('vehicle-modal').style.display = 'block';
    // Render fields dựa trên currentTab (Tên, ID cha, v.v...)
};

window.closeModal = () => {
    document.getElementById('vehicle-modal').style.display = 'none';
};

window.showAddModal = async () => {
    const modal = document.getElementById('vehicle-modal');
    const formFields = document.getElementById('form-fields');
    const modalTitle = document.getElementById('modal-title');
    
    modal.style.display = 'block';
    formFields.innerHTML = ''; // Clear cũ

    if (currentTab === 'brands') {
        modalTitle.innerText = "Thêm Thương hiệu mới";
        formFields.innerHTML = `
            <div class="form-group">
                <label>Tên thương hiệu</label>
                <input type="text" name="brandName" required placeholder="Ví dụ: Honda, Yamaha...">
            </div>
        `;
    } 
    else if (currentTab === 'models') {
        modalTitle.innerText = "Thêm Dòng xe mới";
        // Fetch dữ liệu Brand và Type để làm Dropdown
        if (cachedBrands.length === 0) await refreshCaches();
        
        formFields.innerHTML = `
            <div class="form-group">
                <label>Tên dòng xe (Model)</label>
                <input type="text" name="modelName" required placeholder="Ví dụ: Air Blade 160">
            </div>
            <div class="form-group">
                <label>Thuộc Thương hiệu</label>
                <select name="brandId" required>
                    ${cachedBrands.map(b => `<option value="${b.brandId}">${b.brandName}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Phân loại xe</label>
                <select name="typeId" required>
                    ${cachedTypes.map(t => `<option value="${t.vehicleTypeId}">${t.typeName}</option>`).join('')}
                </select>
            </div>
        `;
    } 
    else if (currentTab === 'types') {
        modalTitle.innerText = "Thêm Loại xe mới";
        formFields.innerHTML = `
            <div class="form-group">
                <label>Tên loại xe</label>
                <input type="text" name="typeName" required placeholder="Ví dụ: Naked Bike">
            </div>
            <div class="form-group">
                <label>Mô tả chi tiết</label>
                <textarea name="description" rows="3" placeholder="Đặc điểm nhận dạng dòng xe..."></textarea>
            </div>
        `;
    }

    // Mặc định luôn có trạng thái hoạt động
    formFields.innerHTML += `
        <div class="form-group" style="display: flex; gap: 10px; align-items: center;">
            <input type="checkbox" name="isActive" checked style="width: auto;">
            <label style="margin: 0;">Đang hoạt động (Active)</label>
        </div>
    `;
};

// Hàm lấy dữ liệu phụ trợ cho Dropdown
async function refreshCaches() {
    const [bRes, tRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.brands}?page=1&pageSize=100`),
        fetch(`${API_ENDPOINTS.types}?page=1&pageSize=100`)
    ]);
    const bData = await bRes.json();
    const tData = await tRes.json();
    cachedBrands = bData.data.pageData || [];
    cachedTypes = tData.data.pageData || [];
}

// Xử lý gửi dữ liệu lên Server
document.getElementById('vehicle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    
    // Convert các trường số và checkbox
    if (payload.brandId) payload.brandId = parseInt(payload.brandId);
    if (payload.typeId) payload.typeId = parseInt(payload.typeId);
    payload.isActive = formData.get('isActive') === 'on';

    try {
        const response = await fetch(API_ENDPOINTS[currentTab], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Thêm mới thành công!");
            closeModal();
            loadTableData(); // Refresh lại bảng
        } else {
            const err = await response.json();
            alert("Lỗi: " + (err.message || "Không thể lưu dữ liệu"));
        }
    } catch (error) {
        alert("Lỗi kết nối server!");
    }
});