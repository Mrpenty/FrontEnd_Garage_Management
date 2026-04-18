export const appointmentUI = {
    renderLayout: (container) => {
        container.innerHTML = `
            <div class="job-card-section">
                <h2 class="table-title-main">QUẢN LÝ LỊCH HẸN</h2>
                
                <div class="table-toolbar">
                    <div class="left-tools">
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="searchAppointment" placeholder="Tìm tên khách, SĐT...">
                        </div>
                        <div class="filter-group">
                            <input type="date" id="filterDate" class="form-control-sm">
                            <select id="filterStatus">
                                <option value="">Tất cả trạng thái</option>
                                <option value="0">Chờ xác nhận</option>
                                <option value="1">Đã xác nhận</option>
                                <option value="2">Đã đến</option>
                                <option value="3">Đã hủy</option>
                            </select>
                        </div>
                    </div>
                    <div class="right-tools">
                        <button id="btn-open-booking" class="btn-primary">
                            <i class="fa-solid fa-calendar-plus"></i> Đặt lịch hộ
                        </button>
                        <button id="btn-refresh-appointment" class="btn-secondary">
                            <i class="fa-solid fa-rotate"></i> Làm mới
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Ngày hẹn</th>
                                <th>Khách hàng</th>
                                <th>Số điện thoại</th>
                                <th>Dịch vụ</th>
                                <th>Trạng thái</th>
                                <th class="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="appointment-table-body">
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
                                    <label>Email (Tùy chọn)</label>
                                    <input type="email" id="newCustomerEmail" placeholder="Nhập email...">
                                </div>
                                <div class="form-group">
                                    <label>Địa chỉ (Tùy chọn)</label>
                                    <input type="text" id="newCustomerAddress" placeholder="Nhập địa chỉ...">
                                </div>
                            </div>
                            
                            <div class="modal-footer mt-15">
                                <button type="button" class="btn-cancel close-customer-modal" id="btnCancelCustomer">Hủy</button>
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
            <div id="bookingModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-calendar-check"></i> Đặt Lịch Hẹn Cho Khách</h3>
                        <span class="close-modal" id="closeBookingModal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="receptionistBookingForm">
                            <div class="form-row">
                                <div class="form-group flex-3">
                                    <label>Tìm khách hàng (Tên/SĐT)</label>
                                    <div class="search-customer-wrapper">
                                        <input type="text" id="bookSearchCustomer" placeholder="Nhập để tìm kiếm..." autocomplete="off" required>
                                        <input type="hidden" id="bookCustomerId">
                                        <ul id="bookCustomerResults" class="autocomplete-dropdown" style="display:none"></ul>
                                    </div>
                                </div>
                                <div class="form-group flex-1 align-bottom">
                                    <button type="button" class="btn-outline" id="btnQuickAddCustomer">
                                        <i class="fa-solid fa-user-plus"></i> Thêm khách
                                    </button>
                                </div>
                            </div>
                            <div class="grid-2-cols">
                                <div class="form-group">
                                    <label>Ngày hẹn *</label>
                                    <input type="date" id="bookDate" required>
                                </div>
                                <div class="form-group">
                                    <label>Khung giờ *</label>
                                    <select id="bookTimeSlot" required>
                                        <option value="">-- Chọn giờ --</option>
                                        </select>
                                </div>
                            </div>
                            <div class="grid-2-cols">
                                <div class="form-group">
                                    <label>Xe của khách</label>
                                    <select id="bookVehicle" required>
                                        <option value="">-- Vui lòng chọn khách trước --</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>&nbsp;</label>
                                    <button type="button" class="btn-outline" id="btnQuickAddVehicle">
                                        <i class="fa-solid fa-car"></i> Thêm xe mới
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Dịch vụ</label>
                                <select id="bookService" multiple style="height: 80px;">
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Ghi chú</label>
                                <textarea id="bookDescription" rows="2"></textarea>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn-cancel" id="btnCancelBooking">Hủy</button>
                                <button type="submit" class="btn-primary">Xác nhận đặt lịch</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    renderTableRows: (tbody, items) => {
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Không có lịch hẹn nào</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item => {

            const fullName = item.customer 
            ? `${item.customer.lastName || ''} ${item.customer.firstName || ''}`.trim()
            : `${item.lastName ?? ''} ${item.firstName ?? ''}`.trim();

            const phone = item.customer?.phoneNumber ?? item.phone ?? 'N/A';
            const appointmentDate = item.appointmentDateTime
            const now = new Date();
            // Logic hiển thị nút bấm theo trạng thái
            let actionButtons = '';
            
            if (item.status === 1) { // Pending
                actionButtons = `
                    <button class="btn-action view btn-confirm-apt" data-id="${item.appointmentId}" title="Xác nhận lịch">
                        <i class="fa-solid fa-check"></i> Duyệt
                    </button>`;
            } else if (item.status === 2) { // Confirmed
                if (appointmentDate < now) {
                    actionButtons = `
                        <button class="btn-action print btn-noshow-apt" data-id="${item.appointmentId}">
                            <i class="fa-solid fa-user-slash"></i> Vắng mặt
                        </button>`;
                } else {
                    actionButtons = `<small class="text-muted">Chưa đến giờ</small>`;
                }
            } else if (item.status === 3) {
                actionButtons = `<small class="text-muted">Đang sửa chữa</small>`;
            } else if (item.status === 4) {
                actionButtons = `<small class="text-muted">Vắng mặt</small>`;
            } else if (item.status === 5) {
                actionButtons = `<small class="text-muted">Đã hủy</small>`;
            } else if (item.status === 6) {
                actionButtons = `<small class="text-muted">Đã hoàn thành</small>`;
            }

            return `
            <tr>
                <td><strong>${appointmentDate}</strong></td>
                <td>${fullName || 'Khách vãng lai'}</td>
                <td>${phone}</td>
                <td><small>${item.services?.map(s => s.serviceName).join(', ') || 'N/A'}</small></td>
                <td><span class="status-badge status-${item.status}">${getStatusText(item.status)}</span></td>
                <td class="text-center">
                    ${actionButtons}
                </td>
            </tr>`;
        }).join('');
    },

};

function getStatusText(status) {
    const statuses = {
        1: "Chờ xác nhận",
        2: "Đã xác nhận",
        3: "Đang thực hiện",
        4: "Vắng mặt (No-show)",
        5: "Đã hủy",
        6: "Đã hoàn thành",
    };
    return statuses[status] || "Không xác định";
}