export const ServicePriceUI = {
    populateServiceSelect: (services) => {
        const select = document.getElementById('serviceSelect');
        // Trích xuất mảng từ result.data.pageData
        const list = services?.pageData || [];
        
        select.innerHTML = '<option value="">-- Chọn dịch vụ --</option>';
        list.forEach(service => {
            const option = document.createElement('option');
            option.value = service.serviceId;
            option.textContent = service.serviceName;
            select.appendChild(option);
        });
    },

    renderServicePrices: (services) => {
        const tbody = document.getElementById('serviceTableBody');
        const list = services?.pageData || [];
        
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có dữ liệu</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(service => {
            // Tính toán dựa trên dữ liệu thật từ API: basePrice và totalEstimateMinute
            const price = service.basePrice || 0;
            const worktimeMinutes = service.totalEstimateMinute || 0;
            const worktimeHours = (worktimeMinutes / 60).toFixed(1);

            return `
                <tr>
                    <td>#${service.serviceId}</td>
                    <td><strong>${service.serviceName}</strong></td>
                    <td>${new Intl.NumberFormat('vi-VN').format(price)} VNĐ</td>
                    <td>${service.isActive ? '<span class="text-success">Đang hoạt động</span>' : '<span class="text-danger">Ngừng</span>'}</td>
                    <td>${worktimeHours} h (${worktimeMinutes} p)</td>
                    <td>${service.description || 'Không có mô tả'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editService('${service.serviceId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPagination: (data, onPageChange) => {
        const controls = document.getElementById('paginationControls');
        const info = document.getElementById('paginationInfo');
        if (!controls || !data) return;

        const { page, pageSize, total } = data;
        const totalPages = Math.ceil(total / pageSize);
        
        // Cập nhật thông tin hiển thị
        const start = (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, total);
        info.innerText = `Hiển thị ${start} - ${end} của ${total} dịch vụ`;

        let html = '';
        
        // Nút Previous
        html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${page - 1}">Trước</a>
                 </li>`;

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
                html += `<li class="page-item ${i === page ? 'active' : ''}">
                            <a class="page-link" href="#" data-page="${i}">${i}</a>
                         </li>`;
            } else if (i === page - 2 || i === page + 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Nút Next
        html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${page + 1}">Sau</a>
                 </li>`;

        controls.innerHTML = html;

        // Gắn sự kiện click
        controls.querySelectorAll('.page-link').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const p = parseInt(e.target.getAttribute('data-page'));
                if (p && p !== page) onPageChange(p);
            };
        });
    }
};
