// js/admin-main.js
import { adminApi } from './admin-api.js';
import { adminUi } from './admin-ui.js';

let currentUserPage = 1;

export async function initAdminDashboard() {
    setupNavigation();
    await loadUserData(1);
    await loadReportData();
    await loadBranchData();
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            
            // Switch UI
            document.querySelectorAll('.dashboard-section').forEach(s => s.classList.add('d-none'));
            document.getElementById(targetId).classList.remove('d-none');
            
            // Active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
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