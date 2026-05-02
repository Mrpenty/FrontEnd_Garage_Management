// js/admin-main.js
import { adminApi } from './admin-api.js';
import { adminUi } from './admin-ui.js';

let currentUserPage = 1;

export async function initAdminDashboard() {
    setupNavigation();
    setupCreateEmployee();
    await loadUserData(1);
    await loadReportData();
    await loadBranchData();
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.getAttribute('data-target');
            if (!targetId) return;

            document.querySelectorAll('.dashboard-section').forEach(s => s.classList.add('d-none'));
            const target = document.getElementById(targetId);
            if (target) target.classList.remove('d-none');

            document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
            const parentLi = link.closest('li');
            if (parentLi) parentLi.classList.add('active');
        });
    });
}

async function loadUserData(page) {
    currentUserPage = page;
    const response = await adminApi.getUsers(page);
    if (response.success) {
        adminUi.renderUsers(response.data.pageData);
        adminUi.renderPagination(response.data.total, page, 10);
    }
}

async function loadReportData() {
    const response = await adminApi.getRevenueReport();
    if (response.success) {
        adminUi.renderReports(response.data);
    }
}

async function loadBranchData() {
    const response = await adminApi.getBranches();
    if (response.success) {
        adminUi.renderBranches(response.data.pageData);
    }
}

// Gắn các hàm vào window để gọi từ HTML (vì dùng module nên scope bị giới hạn)
window.handlePageChange = (page) => {
    loadUserData(page);
};

window.handleToggleUser = async (userId, newStatus) => {
    if (confirm(`Bạn có chắc chắn muốn ${newStatus ? 'mở khóa' : 'chặn'} người dùng này?`)) {
        const res = await adminApi.toggleUserStatus(userId, newStatus);
        if (res.success) {
            alert('Cập nhật trạng thái thành công');
            loadUserData(currentUserPage);
        }
    }
};

window.handleToggleBranch = async (branchId, newStatus) => {
    if (confirm(`Bạn có chắc chắn muốn ${newStatus ? 'mở khóa' : 'chặn'} chi nhánh này?`)) {
        const res = await adminApi.updateBranchStatus(branchId, newStatus);
        if (res.success) {
            alert('Cập nhật trạng thái chi nhánh thành công');
            loadBranchData();
        }
    }
}

function setupCreateEmployee() {
    const openBtn = document.getElementById('btn-open-create-employee');
    const closeBtn = document.getElementById('btn-close-create-employee');
    const cancelBtn = document.getElementById('btn-cancel-create-employee');
    const modal = document.getElementById('create-employee-modal');
    const form = document.getElementById('create-employee-form');

    if (!modal || !form) return;

    const openModal = () => {
        form.reset();
        modal.classList.remove('d-none');
    };
    const closeModal = () => modal.classList.add('d-none');

    openBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            fullName: document.getElementById('emp-full-name').value.trim(),
            email: document.getElementById('emp-email').value.trim(),
            phoneNumber: document.getElementById('emp-phone').value.trim(),
            password: document.getElementById('emp-password').value,
            role: document.getElementById('emp-role').value,
            branchId: Number(document.getElementById('emp-branch-id').value)
        };

        if (!payload.fullName || !payload.email || !payload.phoneNumber || !payload.password || !payload.role || !payload.branchId) {
            alert('Vui lòng nhập đầy đủ thông tin nhân viên');
            return;
        }

        const res = await adminApi.createEmployee(payload);
        if (res.success) {
            alert('Tạo nhân viên thành công');
            closeModal();
            await loadUserData(currentUserPage);
            return;
        }

        alert(res.message || 'Không thể tạo nhân viên');
    });
}
