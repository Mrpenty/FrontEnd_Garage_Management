export const SparePartPriceUI = {
    populateSparePartSelect: (data) => {
        const select = document.getElementById('sparePartSelect');
        const list = data?.pageData || [];
        select.innerHTML = '<option value="">-- Chọn phụ tùng cần chỉnh giá --</option>';
        list.forEach(part => {
            const option = document.createElement('option');
            option.value = part.sparePartId;
            option.textContent = `[${part.partCode}] ${part.partName}`;
            select.appendChild(option);
        });
    },

    renderSparePartPrices: (data) => {
        const tbody = document.getElementById('sparepartTableBody');
        const list = data?.pageData || [];
        
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có dữ liệu</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(part => `
            <tr>
                <td>#${part.sparePartId}</td>
                <td><strong>${part.partName}</strong><br><small class="text-muted">${part.partCode}</small></td>
                <td class="fw-bold text-primary">${new Intl.NumberFormat('vi-VN').format(part.sellingPrice)} ₫</td>
                <td>${new Intl.NumberFormat('vi-VN').format(part.lastPurchasePrice)} ₫</td>
                <td>${part.quantity} ${part.unit}</td>
                <td>
                    <span class="badge ${part.isActive ? 'bg-success' : 'bg-secondary'}">
                        ${part.isActive ? 'Kinh doanh' : 'Ngừng'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editSparePart(${part.sparePartId})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderPagination: (data, onPageChange) => {
        const controls = document.getElementById('paginationControls');
        const info = document.getElementById('paginationInfo');
        if (!controls || !data) return;

        const { page, pageSize, total } = data;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, total);
        
        info.innerText = `Hiển thị ${start} - ${end} của ${total} phụ tùng`;

        let html = '';
        html += `<li class="page-item ${page <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">Trước</a></li>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
                html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }
        }

        html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">Sau</a></li>`;
        controls.innerHTML = html;

        controls.querySelectorAll('.page-link').forEach(link => {
            link.onclick = (e) => {
                e.preventDefault();
                const p = parseInt(e.target.getAttribute('data-page'));
                if (p && p !== page) onPageChange(p);
            };
        });
    }
};