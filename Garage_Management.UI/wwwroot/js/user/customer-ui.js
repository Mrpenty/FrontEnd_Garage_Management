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
                                <th>Danh sách xe</th>
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

            <!-- Modal thêm khách hàng mới -->
            <div id="addCustomerModal" class="modal customer-modal">
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-user-plus"></i> Thêm Khách Hàng Mới</h3>
                        <span class="close-modal close-customer-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="createCustomerForm">
                            <div class="form-group">
                                <label>Họ và Tên *</label>
                                <input type="text" id="newCustomerName" required placeholder="VD: Nguyễn Văn A">
                            </div>
                            <div class="form-group">
                                <label>Số điện thoại *</label>
                                <input type="text" id="newCustomerPhone" required placeholder="Nhập số điện thoại...">
                            </div>
                            <div class="grid-2-cols">
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" id="newCustomerEmail" required placeholder="Nhập email...">
                                </div>
                                <div class="form-group">
                                    <label>Địa chỉ</label>
                                    <input type="text" id="newCustomerAddress" required placeholder="Nhập địa chỉ...">
                                </div>
                            </div>
                            
                            <div class="modal-footer mt-15">
                                <button type="button" class="btn-cancel close-customer-modal">Hủy</button>
                                <button type="submit" class="btn-primary" id="btnSubmitNewCustomer">Lưu Khách Hàng</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal thêm xe cho khách hàng -->
            <div id="addVehicleModal" class="modal">
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-motorcycle"></i> Thêm Xe Cho Khách Hàng</h3>
                        <span class="close-modal close-vehicle-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="createVehicleForm">
                            <div class="form-group">
                                <label>Biển số xe *</label>
                                <input type="text" id="newVehiclePlate" required placeholder="VD: 29A1-12345">
                            </div>
                            <div class="form-group">
                                <label>Hãng xe *</label>
                                <select id="newVehicleBrand" required>
                                    <option value="">-- Chọn Hãng --</option>
                                    </select>
                            </div>
                            <div class="form-group">
                                <label>Dòng xe (Model) *</label>
                                <select id="newVehicleModel" required disabled>
                                    <option value="">-- Chọn Dòng Xe --</option>
                                </select>
                            </div>
                            <div class="grid-2-cols">
                                <div class="form-group">
                                    <label>Năm sản xuất</label>
                                    <input type="number" id="newVehicleYear" placeholder="2024">
                                </div>
                                <div class="form-group">
                                    <label>Số khung (VIN)</label>
                                    <input type="text" id="newVehicleVin" placeholder="Tùy chọn">
                                </div>
                            </div>
                            
                            <div class="modal-footer mt-15">
                                <button type="button" class="btn-cancel close-vehicle-modal">Hủy</button>
                                <button type="submit" class="btn-primary" id="btnSubmitNewVehicle">Lưu Xe</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    renderTableRows: (tbody, items) => {
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Không tìm thấy khách hàng nào</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item =>
            {
                const vehicles = item.vehicles || [];
                let vehicleHtml = '';

                if (vehicles.length > 0) {
                    vehicleHtml = vehicles.map(v => `
                        <div class="vehicle-mini-badge" title="${v.brand} ${v.model} (${v.year})">
                            <i class="fa-solid fa-motorcycle"></i> ${v.licensePlate}
                        </div>
                    `).join('');
                } else {
                    vehicleHtml = '<span class="text-muted" style="font-size: 11px;">Chưa có xe</span>';
                }           
            return `
            <tr>
                <td>#${item.customerId}</td>
                <td><strong>${item.fullName}</strong></td>
                <td>${item.phoneNumber}</td>
                <td>${item.email || '<span class="text-muted">N/A</span>'}</td>
                <td>
                    <div class="customer-vehicles-list">
                        ${vehicleHtml}
                    </div>
                </td>
                <td><small>${item.address || 'Chưa cập nhật'}</small></td>              
                <td class="text-center">
                    <button class="btn-action view btn-view-customer" data-id="${item.customerId}" title="Xem lịch sử">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action add-v btn-add-vehicle-row" data-id="${item.customerId}" title="Thêm xe">
                        <i class="fa-solid fa-plus-circle"></i>
                    </button>
                    <button class="btn-action print btn-edit-customer" data-id="${item.customerId}" title="Sửa">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
                
            </tr>
        `;}).join('');
    }
};