// js/admin-ui.js
export const adminUi = {
    renderUsers: (users, onToggleStatus) => {
        const tbody = document.getElementById('user-table-body');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.userId}</td>
                <td>
                    <strong>${user.fullName}</strong><br>
                    <small class="text-muted">${user.employee?.position || 'Khách hàng'}</small>
                </td>
                <td>${user.email}<br>${user.phoneNumber}</td>
                <td>${user.roles.map(r => `<span class="badge bg-info text-dark">${r}</span>`).join(' ')}</td>
                <td>
                    <span class="badge ${user.isActive ? 'bg-success' : 'bg-danger'}">
                        ${user.isActive ? 'Hoạt động' : 'Bị chặn'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm ${user.isActive ? 'btn-outline-danger' : 'btn-outline-success'}" 
                            onclick="window.handleToggleUser(${user.userId}, ${!user.isActive})">
                        ${user.isActive ? 'Chặn' : 'Mở chặn'}
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderPagination: (total, currentPage, pageSize, onPageChange) => {
        const totalPages = Math.ceil(total / pageSize);
        const nav = document.getElementById('user-pagination');
        let html = '<ul class="pagination pagination-sm justify-content-end">';
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="window.handlePageChange(${i})">${i}</a>
                     </li>`;
        }
        html += '</ul>';
        nav.innerHTML = html;
    },

    renderReports: (reports) => {
        const tbody = document.getElementById('report-table-body');
        tbody.innerHTML = reports.map(r => `
            <tr>
                <td><strong>${r.branchName}</strong> (${r.branchCode})</td>
                <td>${r.invoiceCount}</td>
                <td>${new Intl.NumberFormat('vi-VN').format(r.serviceTotal)} đ</td>
                <td>${new Intl.NumberFormat('vi-VN').format(r.sparePartTotal)} đ</td>
                <td class="text-primary fw-bold">${new Intl.NumberFormat('vi-VN').format(r.grandTotal)} đ</td>
            </tr>
        `).join('');
    },

    renderBranches: (branches) => {
        const tbody = document.getElementById('branch-table-body');
        tbody.innerHTML = branches.map(branch => `
            <tr>
                <td>${branch.branchId}</td>
                <td><strong>${branch.address}</strong><br><small class="text-muted">${branch.branchCode}</small></td>
                <td><strong>${branch.email || 'Chưa cập nhật'}</strong><br>${branch.phone || 'Chưa cập nhật'}</td>
                <td>${branch.managerEmployeeName || 'Chưa có quản lý'}</td>
                <td>${branch.employeeCount} nhân viên</td>
                <td>${branch.activeJobCardCount} công việc đang xử lý</td>
                <td>
                    <span class="badge ${branch.isActive ? 'bg-success' : 'bg-danger'}">
                        ${branch.isActive ? 'Hoạt động' : 'Đóng cửa'}
                    </span>
                </td>
                <td><button class="btn btn-sm btn-outline-primary" onclick="window.handleToggleBranch(${branch.branchId}, ${!branch.isActive})">
                    ${branch.isActive ? 'Ngừng hoạt động' : 'Hoạt động'}
                </button></td>
            </tr>
        `).join('');
    }
};