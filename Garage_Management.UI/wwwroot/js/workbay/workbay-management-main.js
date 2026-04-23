import { authGuard } from '../auth/auth-guard.js';
import CONFIG from '../config.js';

// Kiểm tra quyền
authGuard.authorize('Supervisor');  
const token = localStorage.getItem('accessToken');
$(document).ready(function() {
    loadWorkbays();

    // Logout
    $('#btn-staff-logout').click(() => {
        localStorage.clear();
        window.location.href = CONFIG.PAGES.STAFF_LOGIN;
    });

    // Handle Form Submit
    $('#workbay-form').submit(function(e) {
        e.preventDefault();
        saveWorkbay();
    });
});

async function loadWorkbays() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/WorkBays`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        const data = await response.json();
        
        const tbody = $('#workbay-table-body');
        tbody.empty();

        data.forEach(wb => {
            const statusBadge = getStatusBadge(wb.status);
            tbody.append(`
                <tr>
                    <td>${wb.id}</td>
                    <td><strong>${wb.name}</strong></td>
                    <td>${wb.note || ''}</td>
                    <td>${statusBadge}</td>
                    <td>${wb.jobcardId ? `<span class="tag">JC: #${wb.jobcardId}</span>` : '<em>Không có</em>'}</td>
                    <td>
                        <button class="btn-detail-inner" onclick="editWorkbay(${wb.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `);
        });
    } catch (error) {
        console.error('Lỗi khi tải danh sách khoang:', error);
    }
}

function getStatusBadge(status) {
    const statusMap = {
        1: { text: 'Trống', class: 'status-empty' },
        2: { text: 'Đang hoạt động', class: 'status-active' },
        3: { text: 'Bảo trì', class: 'status-maintenance' },
        4: { text: 'Không còn hoạt động', class: 'status-maintenance' }
    };
    const s = statusMap[status] || { text: 'N/A', class: '' };
    return `<span class="badge ${s.class}">${s.text}</span>`;
}

window.openAddWorkbayModal = function() {
    $('#modal-workbay-title').text('Thêm Khoang Mới');
    $('#workbay-form')[0].reset();
    $('#wb-id').val('');
    $('#status-group').hide();
    $('#workbay-modal').fadeIn();
}

window.editWorkbay = async function(id) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/WorkBays/${id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        const wb = await response.json();

        $('#modal-workbay-title').text('Chỉnh sửa Khoang');
        $('#wb-id').val(wb.id);
        $('#wb-name').val(wb.name);
        $('#wb-note').val(wb.note);
        $('#wb-status').val(wb.status);
        $('#status-group').show();
        $('#workbay-modal').fadeIn();
    } catch (error) {
        Swal.fire('Lỗi', 'Không thể lấy thông tin chi tiết', 'error');
    }
}

async function saveWorkbay() {
    const id = $('#wb-id').val();
    const isEdit = id !== "";
    
    const url = isEdit 
        ? `${CONFIG.API_BASE_URL}/WorkBays/${id}` // Giả định API Update dùng PUT/POST kèm ID
        : `${CONFIG.API_BASE_URL}/WorkBays/Create`;

    const payload = {
        name: $('#wb-name').val(),
        note: $('#wb-note').val(),
        branchId: 0 // Server sẽ lấy từ Token như DTO mô tả
    };

    if (isEdit) {
        payload.status = parseInt($('#wb-status').val());
    }

    try {
        const response = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            Swal.fire('Thành công', 'Lưu thông tin khoang thành công', 'success');
            closeWorkbayModal();
            loadWorkbays();
        } else {
            throw new Error('Lỗi từ server');
        }
    } catch (error) {
        Swal.fire('Thất bại', 'Có lỗi xảy ra khi lưu', 'error');
    }
}

window.closeWorkbayModal = function() {
    $('#workbay-modal').fadeOut();
}