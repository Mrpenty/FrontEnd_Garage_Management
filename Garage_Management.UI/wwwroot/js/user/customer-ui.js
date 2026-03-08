export const customerUI = {
    renderLayout: (container) => {
        container.innerHTML = `
            <div class="job-card-section">
                <h2 class="table-title-main">DANH SÁCH KHÁCH HÀNG</h2>
                
                <div class="table-toolbar">
                    <div class="left-tools">
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="searchCustomer" placeholder="Tìm tên hoặc số điện thoại...">
                        </div>
                    </div>
                    <div class="right-tools">
                        <button id="btn-add-customer-main" class="btn-primary">
                            <i class="fa-solid fa-user-plus"></i> Thêm khách hàng mới
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã KH</th>
                                <th>Họ tên</th>
                                <th>Số điện thoại</th>
                                <th>Email</th>
                                <th>Địa chỉ</th>
                                <th class="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="customer-table-body">
                            <tr><td colspan="6" class="text-center">Đang tải dữ liệu...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderTableRows: (tbody, items) => {
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Không tìm thấy khách hàng nào</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>#${item.customerId}</td>
                <td><strong>${item.fullName}</strong></td>
                <td>${item.phoneNumber}</td>
                <td>${item.email || '<span class="text-muted">N/A</span>'}</td>
                <td><small>${item.address || 'Chưa cập nhật'}</small></td>
                <td class="text-center">
                    <button class="btn-action view btn-view-customer" data-id="${item.customerId}" title="Xem lịch sử">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action print btn-edit-customer" data-id="${item.customerId}" title="Sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
};