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
                    <td><strong>${wb.name}</strong></td>
                    <td>${wb.note || ''}</td>
                    <td>${statusBadge}</td>
                    <td>${wb.jobcardId ? `<span class="tag">JC: #${wb.jobcardId}</span>` : '<em>Không có</em>'}</td>
                    <td style="white-space:nowrap;">
                        <button class="btn-detail-inner" title="Chỉnh sửa" style="width:auto; padding:6px 10px; margin-right:4px;" onclick="editWorkbay(${wb.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-detail-inner" title="Xóa" style="width:auto; padding:6px 10px; background:#be123c; color:#fff; border-color:#be123c;" onclick="deleteWorkbay(${wb.id}, '${(wb.name || '').replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i>
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

    const branchId = Number(localStorage.getItem('branchId'));
    if (!branchId) {
        Swal.fire('Thiếu BranchId', 'Không tìm thấy branchId trong localStorage. Vui lòng đăng nhập lại.', 'error');
        return;
    }

    const payload = {
        name: $('#wb-name').val(),
        note: $('#wb-note').val(),
        branchId: branchId
    };

    if (isEdit) {
        payload.status = parseInt($('#wb-status').val());
    }

    try {
        const response = await fetch(url, {
            method: 'PUT' ,
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
            // Đọc message thật từ BE để dễ debug
            let detail = `HTTP ${response.status}`;
            try {
                const errBody = await response.json();
                detail = errBody.message || errBody.title || JSON.stringify(errBody.errors || errBody);
            } catch {
                detail = await response.text();
            }
            console.error('[saveWorkbay] payload:', payload);
            console.error('[saveWorkbay] BE response:', detail);
            throw new Error(detail);
        }
    } catch (error) {
        Swal.fire('Thất bại', error.message || 'Có lỗi xảy ra khi lưu', 'error');
    }
}

window.closeWorkbayModal = function() {
    $('#workbay-modal').fadeOut();
}

// DELETE /api/WorkBays/{id} — BE chặn nếu khoang đang Occupied hoặc có lịch sử jobcard.
window.deleteWorkbay = async function(id, name) {
    const result = await Swal.fire({
        title: 'Xóa cứng khoang?',
        html: `Bạn sẽ xóa <strong>${name || 'khoang #' + id}</strong> khỏi hệ thống.<br><small>BE sẽ chặn nếu khoang đang Occupied hoặc đã có lịch sử jobcard.</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa cứng',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#be123c'
    });
    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/WorkBays/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            Swal.fire('Đã xóa', 'Khoang đã bị xóa khỏi hệ thống.', 'success');
            loadWorkbays();
        } else {
            const errBody = await response.json().catch(() => ({}));
            const msg = errBody.message
                || errBody.title
                || 'Không xóa được. Có thể khoang đang Occupied hoặc có jobcard liên quan — hãy đổi sang Inactive thay vì xóa cứng.';
            Swal.fire('Không thể xóa', msg, 'error');
        }
    } catch (e) {
        Swal.fire('Lỗi', 'Không kết nối được server', 'error');
    }
}
