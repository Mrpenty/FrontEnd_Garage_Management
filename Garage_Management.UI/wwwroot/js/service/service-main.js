import CONFIG from '../config.js';
import { renderPagination, extractPaging } from '../common/pagination.js';
import { authGuard } from '../auth/auth-guard.js';

const SERVICE_API = `${CONFIG.API_BASE_URL}/Services`;
const TASK_API = `${CONFIG.API_BASE_URL}/ServiceTasks`;
const SERVICE_PAGE_SIZE = 20;
let serviceCurrentPage = 1;

const serviceFilters = {
    keyword: '',
    isActive: '',
    hasPrice: '',
    sortBy: '',
    sortDesc: true
};

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
});
document.addEventListener('DOMContentLoaded', () => {
    initServiceFilters();
    loadServices();
    const userInfoStr = localStorage.getItem('userInfo');

    if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        const displayNameEl = document.getElementById('display-name');
        if (displayNameEl) {
            displayNameEl.innerText = `${userInfo.fullName} (${userInfo.email})`;
        }
    }

    const logoutBtn = document.getElementById('btn-staff-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => authGuard.logout());
    }

    // Xử lý tạo Service mới
    document.getElementById('service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            serviceName: e.target.serviceName.value,
            description: e.target.description.value
        };
        const res = await fetch(SERVICE_API, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Đã tạo dịch vụ thành công!");
            closeModals();
            loadServices(1);
        }
    });

    // Xử lý tạo Task mới
    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('editing-task-id').value;
        const serviceId = parseInt(document.getElementById('current-service-id').value);

        const payload = {
            serviceId: serviceId,
            taskName: document.getElementById('taskName').value,
            taskOrder: parseInt(document.getElementById('taskOrder').value),
            estimateMinute: parseInt(document.getElementById('estimateMinute').value),
            note: document.getElementById('taskNote').value
        };

        let url = TASK_API;
        let method = 'POST';

        // Nếu có taskId -> Chuyển sang chế độ UPDATE (PUT)
        if (taskId) {
            url = `${TASK_API}/${taskId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(taskId ? "Cập nhật Task thành công!" : "Thêm Task thành công!");
            resetTaskForm();
            viewTasks(serviceId); // Load lại danh sách task trong modal
            loadServices(); // Load lại bảng chính để cập nhật tổng thời gian
        }
    });
});

function buildServiceQueryString(page) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('pageSize', SERVICE_PAGE_SIZE);
    if (serviceFilters.keyword) params.set('keyword', serviceFilters.keyword);
    if (serviceFilters.isActive !== '') params.set('isActive', serviceFilters.isActive);
    if (serviceFilters.hasPrice !== '') params.set('hasPrice', serviceFilters.hasPrice);
    if (serviceFilters.sortBy) {
        params.set('sortBy', serviceFilters.sortBy);
        params.set('sortDesc', serviceFilters.sortDesc);
    }
    return params.toString();
}

async function loadServices(page = serviceCurrentPage) {
    const qs = buildServiceQueryString(page);
    const url = `${SERVICE_API}?${qs}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
        console.error('[Services] HTTP', res.status, 'URL:', url);
        const body = document.getElementById('service-table-body');
        if (body) body.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Lỗi HTTP ${res.status} — kiểm tra Network tab</td></tr>`;
        return;
    }
    const result = await res.json();
    const paged = result.data || {};
    const services = paged.pageData || [];

    const body = document.getElementById('service-table-body');
    body.innerHTML = services.map(s => {
        const statusClass = s.isActive ? 'status-active' : 'status-inactive';
        const statusText = s.isActive ? 'Đang hoạt động' : 'Ngừng';
        const toggleTitle = s.isActive ? 'Vô hiệu hóa' : 'Kích hoạt';
        const toggleIcon = s.isActive ? 'fa-toggle-on' : 'fa-toggle-off';
        const toggleColor = s.isActive ? '#10b981' : '#94a3b8';
        return `
        <tr>
            <td>#${s.serviceId}</td>
            <td><strong>${s.serviceName}</strong></td>
            <td><small>${s.description || ''}</small></td>
            <td><i class="far fa-clock"></i> ${s.totalEstimateMinute} phút</td>
            <td><span class="badge-count">${s.serviceTasks.length} Task</span></td>
            <td><span class="status-pill ${statusClass}">${statusText}</span></td>
            <td style="white-space:nowrap;">
                <button class="btn-secondary" onclick="window.viewTasks(${s.serviceId})">
                    <i class="fas fa-list-check"></i> Quản lý Task
                </button>
                <button class="btn-icon" title="${toggleTitle}" style="color:${toggleColor}; background:transparent; border:none; cursor:pointer; font-size:1.4rem; padding:4px 6px;" onclick="window.toggleServiceActive(${s.serviceId}, ${!s.isActive})">
                    <i class="fas ${toggleIcon}"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    const { page: p, totalPages, total } = extractPaging(paged, SERVICE_PAGE_SIZE);
    serviceCurrentPage = p;
    renderPagination('servicePagination', {
        page: p, totalPages,
        callbackName: 'serviceGoPage',
        onPageClick: (np) => loadServices(np)
    });
    const metaBox = document.getElementById('servicePagingMeta');
    if (metaBox) {
        if (!total) metaBox.textContent = '';
        else {
            const from = (p - 1) * SERVICE_PAGE_SIZE + 1;
            const to = Math.min(p * SERVICE_PAGE_SIZE, total);
            metaBox.textContent = `Hiển thị ${from}-${to} / ${total} dịch vụ`;
        }
    }
}

window.viewTasks = async (serviceId) => {
    const res = await fetch(`${SERVICE_API}?page=1&pageSize=100`, { headers: getAuthHeaders() });
    const result = await res.json();
    const service = result.data.pageData.find(s => s.serviceId === serviceId);

    document.getElementById('current-service-id').value = serviceId;
    document.getElementById('task-modal-title').innerText = `Quy trình: ${service.serviceName}`;
    
    const container = document.getElementById('task-list-container');
    container.innerHTML = service.serviceTasks.sort((a,b) => a.taskOrder - b.taskOrder).map(t => `
        <div class="task-item-row">
            <span class="t-order">${t.taskOrder}.</span>
            <div class="t-content">
                <span class="t-name">${t.taskName}</span>
                <span class="t-note">${t.note ? `- ${t.note}` : ''}</span>
            </div>
            <span class="t-time">${t.estimateMinute}p</span>
            <div class="t-actions">
                <button class="btn-edit-small" onclick="prepareEditTask(${t.serviceTaskId}, '${t.taskName}', ${t.taskOrder}, ${t.estimateMinute}, '${t.note || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('task-modal').style.display = 'block';
}


// Hàm đưa dữ liệu Task lên Form để sửa
window.prepareEditTask = (taskId, name, order, minute, note) => {
    document.getElementById('editing-task-id').value = taskId;
    document.getElementById('taskName').value = name;
    document.getElementById('taskOrder').value = order;
    document.getElementById('estimateMinute').value = minute;
    document.getElementById('taskNote').value = note || '';

    // Đổi giao diện form sang trạng thái Edit
    document.getElementById('editor-title').innerText = "Chỉnh sửa bước thực hiện";
    document.getElementById('btn-save-task').innerHTML = '<i class="fas fa-save"></i> Lưu cập nhật';
    document.getElementById('btn-save-task').style.background = '#f59e0b'; // Đổi sang màu cam
    document.getElementById('btn-cancel-edit').style.display = 'inline-block';
};

// Hàm reset Form về trạng thái Add ban đầu
window.resetTaskForm = () => {
    document.getElementById('task-form').reset();
    document.getElementById('editing-task-id').value = "";
    document.getElementById('editor-title').innerText = "Thêm bước (Task) mới";
    document.getElementById('btn-save-task').innerHTML = '<i class="fas fa-plus"></i> Thêm Task';
    document.getElementById('btn-save-task').style.background = '#4f46e5';
    document.getElementById('btn-cancel-edit').style.display = 'none';
};


window.showAddServiceModal = () => document.getElementById('service-modal').style.display = 'block';
window.closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function initServiceFilters() {
    const searchEl = document.getElementById('service-search');
    const activeEl = document.getElementById('service-filter-active');
    const hasPriceEl = document.getElementById('service-filter-hasprice');
    const sortEl = document.getElementById('service-sort');
    const resetEl = document.getElementById('service-filter-reset');

    let debounceTimer = null;
    const reload = () => {
        serviceCurrentPage = 1;
        loadServices(1);
    };

    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                serviceFilters.keyword = e.target.value.trim();
                reload();
            }, 350);
        });
    }

    if (activeEl) {
        activeEl.addEventListener('change', (e) => {
            serviceFilters.isActive = e.target.value;
            reload();
        });
    }

    if (hasPriceEl) {
        hasPriceEl.addEventListener('change', (e) => {
            serviceFilters.hasPrice = e.target.value;
            reload();
        });
    }

    if (sortEl) {
        sortEl.addEventListener('change', (e) => {
            const [sortBy, sortDesc] = e.target.value.split('|');
            serviceFilters.sortBy = sortBy;
            serviceFilters.sortDesc = sortDesc === 'true';
            reload();
        });
    }

    if (resetEl) {
        resetEl.addEventListener('click', () => {
            serviceFilters.keyword = '';
            serviceFilters.isActive = '';
            serviceFilters.hasPrice = '';
            serviceFilters.sortBy = '';
            serviceFilters.sortDesc = true;
            if (searchEl) searchEl.value = '';
            if (activeEl) activeEl.value = '';
            if (hasPriceEl) hasPriceEl.value = '';
            if (sortEl) sortEl.value = '';
            reload();
        });
    }
}

window.toggleServiceActive = async (serviceId, newStatus) => {
    if (!confirm('Đổi trạng thái Hoạt động/Ngừng cho dịch vụ này?')) return;
    try {
        const res = await fetch(`${SERVICE_API}/${serviceId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isActive: newStatus })
        });
        if (res.ok) {
            loadServices(serviceCurrentPage);
        } else {
            const err = await res.json().catch(() => ({}));
            alert('Không đổi trạng thái được: ' + (err.message || `HTTP ${res.status}`));
        }
    } catch (e) {
        alert('Lỗi kết nối server');
    }
};
