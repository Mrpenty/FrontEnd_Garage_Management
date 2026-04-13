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
        const getTypeName = (type) => {
            const types = { 1: 'Nhập', 2: 'Xuất', 3: 'Trả hàng', 4: 'Kiểm kê' };
            return types[type] || 'Khác';
        };

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                <td><span class="badge bg-secondary">${getTypeName(item.transactionType)}</span></td>
                <td>${item.partName}</td>
                <td class="${item.quantityChange > 0 ? 'text-success' : 'text-danger'}">
                    ${item.quantityChange > 0 ? '+' : ''}${item.quantityChange}
                </td>
                <td>${item.receiptCode || ''}</td>
                <td class="small">${item.note || ''}</td>
            </tr>
        `).join('');
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
        if (!container || !data.totalPages || data.totalPages <= 1) {
            if (container) container.innerHTML = ''; 
            return;
        }

        // Lưu callback vào window để onclick trong chuỗi HTML có thể gọi được
        window.currentPaginationClick = onPageClick;

        let html = `<ul class="pagination pagination-sm mb-0">`;
        for (let i = 1; i <= data.totalPages; i++) {
            html += `
                <li class="page-item ${data.pageIndex === i ? 'active' : ''}">
                    <a class="page-link" href="javascript:void(0)" onclick="window.currentPaginationClick(${i})">${i}</a>
                </li>`;
        }
        html += `</ul>`;
        container.innerHTML = html;
    },
};

window.inventoryUI = inventoryUI;
