import {inventoryAPI} from "./inventory-api.js";

export const inventoryUI = {
    renderInventory: (data) => {
        const items = data.pageData || [];
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = items.map(item => `
            <tr>
                <td><code>${item.partCode || 'N/A'}</code></td>
                <td><span class="fw-bold">${item.partName}</span></td>
                <td>${item.sparePartBrandName || '-'}</td>
                <td>
                    <span class="badge ${item.quantity <= item.minQuantity ? 'bg-danger' : 'bg-success'}">
                        ${item.quantity}
                    </span>
                </td>
                <td>${item.unit || ''}</td>
                <td>${new Intl.NumberFormat('vi-VN').format(item.sellingPrice)} đ</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm" onclick="window.inventoryUI.openQuickAdjust(${item.sparePartId})">
                        Sửa nhanh
                    </button>
                </td>
            </tr>
        `).join('');

        inventoryUI.renderPagination('invPagination', data, (p) => window.inventoryMain.loadInventory(p));    },

    renderTransactions: (items) => {
        const tbody = document.getElementById('transactionTableBody');
        const typeMap = {
            1: { text: 'Nhập', cls: 'bg-success' },
            2: { text: 'Xuất → JC', cls: 'bg-danger' },
            3: { text: 'Trả từ JC', cls: 'bg-info text-dark' },
            4: { text: 'Kiểm kê', cls: 'bg-warning text-dark' }
        };
        const fmt = (n) => (n == null ? '' : Number(n).toLocaleString('vi-VN'));

        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">Chưa có giao dịch nào</td></tr>`;
            return;
        }

        // Cache items vào window để nút "Chi tiết" tra cứu được
        window.__transactionsCache = items;

        tbody.innerHTML = items.map(item => {
            const t = typeMap[item.transactionType] || { text: 'Khác', cls: 'bg-secondary' };
            const isImport = item.quantityChange > 0;
            const total = (item.quantityChange != null && item.unitPrice != null)
                ? Math.abs(item.quantityChange) * item.unitPrice
                : null;

            return `
                <tr>
                    <td><small>${new Date(item.createdAt).toLocaleString('vi-VN')}</small></td>
                    <td><span class="badge ${t.cls}">${t.text}</span></td>
                    <td><small><code>${item.partCode || ''}</code></small></td>
                    <td>${item.partName || ''}</td>
                    <td class="text-center fw-bold ${isImport ? 'text-success' : 'text-danger'}">
                        ${isImport ? '+' : ''}${item.quantityChange}
                    </td>
                    <td class="text-end">${fmt(item.unitPrice)}</td>
                    <td class="text-end fw-bold">${total != null ? fmt(total) : ''}</td>
                    <td><small>${item.receiptCode || ''}</small></td>
                    <td class="small">${item.note || ''}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" title="Xem chi tiết"
                                onclick="inventoryUI.showTransactionDetail(${item.stockTransactionId})">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showTransactionDetail: (id) => {
        const items = window.__transactionsCache || [];
        const item = items.find(x => x.stockTransactionId === id);
        if (!item) return;

        const typeMap = {
            1: { text: 'Nhập kho', cls: 'bg-success' },
            2: { text: 'Xuất → Job Card', cls: 'bg-danger' },
            3: { text: 'Trả từ Job Card', cls: 'bg-info text-dark' },
            4: { text: 'Kiểm kê / Điều chỉnh', cls: 'bg-warning text-dark' }
        };
        const t = typeMap[item.transactionType] || { text: 'Khác', cls: 'bg-secondary' };
        const fmt = (n) => (n == null ? '<span class="text-muted">—</span>' : Number(n).toLocaleString('vi-VN'));
        const txt = (s) => (s == null || s === '' ? '<span class="text-muted">—</span>' : s);
        const isImport = item.quantityChange > 0;
        const total = (item.quantityChange != null && item.unitPrice != null)
            ? Math.abs(item.quantityChange) * item.unitPrice
            : null;
        const partyLabel = item.supplierName
            ? `<i class="bi bi-truck"></i> ${item.supplierName} <small class="text-muted">(NCC #${item.supplierId || ''})</small>`
            : (item.jobCardId ? `<i class="bi bi-clipboard"></i> Job Card #${item.jobCardId}` : txt(null));

        const body = document.getElementById('transactionDetailBody');
        body.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="text-muted small">Mã giao dịch</div>
                    <div class="fw-bold">#${item.stockTransactionId}</div>
                </div>
                <div class="col-md-6">
                    <div class="text-muted small">Loại giao dịch</div>
                    <div><span class="badge ${t.cls} fs-6">${t.text}</span></div>
                </div>
                <div class="col-md-6">
                    <div class="text-muted small">Ngày tạo</div>
                    <div>${new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div class="col-md-6">
                    <div class="text-muted small">Mã chứng từ</div>
                    <div>${txt(item.receiptCode)}</div>
                </div>
            </div>
            <hr>
            <h6 class="text-primary"><i class="bi bi-box-seam"></i> Phụ tùng</h6>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="text-muted small">Mã PT</div>
                    <div><code>${txt(item.partCode)}</code></div>
                </div>
                <div class="col-md-8">
                    <div class="text-muted small">Tên</div>
                    <div class="fw-bold">${txt(item.partName)}</div>
                </div>
                <div class="col-md-4">
                    <div class="text-muted small">Số lô (Lot Number)</div>
                    <div>${txt(item.lotNumber)}</div>
                </div>
                <div class="col-md-8">
                    <div class="text-muted small">Số Serial</div>
                    <div>${txt(item.serialNumber)}</div>
                </div>
            </div>
            <hr>
            <h6 class="text-primary"><i class="bi bi-cash-coin"></i> Số lượng & Tài chính</h6>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="text-muted small">Thay đổi tồn</div>
                    <div class="fw-bold ${isImport ? 'text-success' : 'text-danger'} fs-5">
                        ${isImport ? '+' : ''}${item.quantityChange}
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-muted small">Đơn giá</div>
                    <div>${fmt(item.unitPrice)} <small class="text-muted">VNĐ</small></div>
                </div>
                <div class="col-md-4">
                    <div class="text-muted small">Thành tiền</div>
                    <div class="fw-bold text-primary fs-5">${fmt(total)} <small class="text-muted">VNĐ</small></div>
                </div>
            </div>
            <hr>
            <h6 class="text-primary"><i class="bi bi-people"></i> Đối tác / Nguồn xuất</h6>
            <div class="mb-3">${partyLabel}</div>
            ${item.note ? `
                <hr>
                <h6 class="text-primary"><i class="bi bi-chat-left-text"></i> Ghi chú</h6>
                <div class="p-2 bg-light rounded">${item.note}</div>
            ` : ''}
        `;

        new bootstrap.Modal('#transactionDetailModal').show();
    },

    toggleTransactionFields: () => {
        const type = document.getElementById('transactionType').value;
        const divQty = document.getElementById('divQuantity');
        const divActual = document.getElementById('divActual');

        if (type == "4") { // Adjustment
            divQty.classList.add('d-none');
            divActual.classList.remove('d-none');
        } else {
            divQty.classList.remove('d-none');
            divActual.classList.add('d-none');
        }
    },

    showTransactionModal: async () => {
        const res = await inventoryAPI.getInventory();
        const select = document.getElementById('sparePartSelect');
        select.innerHTML = res.data.pageData.map(i => `<option value="${i.sparePartId}">${i.partName} (Tồn: ${i.quantity})</option>`).join('');
        
        new bootstrap.Modal('#transactionModal').show();
    },

    showCreateModal: () => {
        document.getElementById('inventoryForm').reset();
        document.getElementById('editSparePartId').value = '';
        document.getElementById('invModalTitle').innerText = 'Thêm Phụ tùng mới';
        new bootstrap.Modal('#inventoryModal').show();
    },

    openQuickAdjust: async (id) => {
        const res = await inventoryAPI.getInventoryById(id);
        if (res.success) {
            const d = res.data;
            const form = document.getElementById('inventoryForm');
            document.getElementById('invModalTitle').innerText = 'Cập nhật phụ tùng';
            document.getElementById('editSparePartId').value = d.sparePartId;
            
            form.elements['partCode'].value = d.partCode || '';
            form.elements['partName'].value = d.partName;
            form.elements['unit'].value = d.unit || '';
            
            // Số lượng: Read-only vì phải nhập/xuất kho mới được đổi
            form.elements['quantity'].value = d.quantity;
            form.elements['quantity'].readOnly = true; 

            form.elements['minQuantity'].value = d.minQuantity;

            // GIÁ: Chuyển sang Read-only để Stocker không sửa được
            form.elements['lastPurchasePrice'].value = d.lastPurchasePrice || 0;
            form.elements['lastPurchasePrice'].readOnly = true;
            form.elements['lastPurchasePrice'].classList.add('bg-light');

            form.elements['sellingPrice'].value = d.sellingPrice || 0;
            form.elements['sellingPrice'].readOnly = true;
            form.elements['sellingPrice'].classList.add('bg-light');

            new bootstrap.Modal('#inventoryModal').show();
        }
    },

    renderPagination: (containerId, data, onPageClick) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Hỗ trợ cả 2 shape của BE: {page, pageSize, total, pageData} mới
        // và {pageIndex, pageSize, totalRow, totalPages, pageData} cũ
        const currentPage = data.pageIndex ?? data.page ?? 1;
        const pageSize = data.pageSize ?? 10;
        const total = data.total ?? data.totalRow ?? 0;
        const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        window.currentPaginationClick = onPageClick;

        let html = `<ul class="pagination pagination-sm mb-0">`;
        // Nút Trước
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="${currentPage === 1 ? '' : `window.currentPaginationClick(${currentPage - 1})`}">&laquo;</a>
                 </li>`;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="window.currentPaginationClick(${i})">${i}</a>
                </li>`;
        }

        // Nút Sau
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="${currentPage === totalPages ? '' : `window.currentPaginationClick(${currentPage + 1})`}">&raquo;</a>
                 </li>`;
        html += `</ul>`;
        container.innerHTML = html;
    },
};

window.inventoryUI = inventoryUI;
