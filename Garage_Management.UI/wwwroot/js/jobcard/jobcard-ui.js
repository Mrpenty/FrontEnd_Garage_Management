export const jobcardUI = {
    // Thêm vào trong export const jobcardUI = { ... }
    renderDashboardLayout: (container) => {
        container.innerHTML = `
            <div class="job-card-section">
                <h2 class="table-title-main">Danh sách phiếu sửa chữa</h2>
                <div class="table-toolbar">
                    <div class="left-tools">
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="searchJobCard" placeholder="Tìm biển số, tên khách...">
                        </div>
                    </div>
                    <div class="right-tools">
                        <button id="btn-create-jobcard" class="btn-primary"><i class="fa-solid fa-plus"></i> Tạo JobCard</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên khách hàng</th>
                                <th>Hãng xe</th>
                                <th>Loại xe</th>
                                <th>Biển số xe</th>
                                <th>Check-in</th>
                                <th>Phụ trách</th>
                                <th>Tình trạng</th>
                                <th class="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="job-card-body"></tbody>
                    </table>
                </div>
            </div>

             <div id="jobCardModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-file-medical"></i> Tạo JobCard Mới</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-section">
                            <label><i class="fa-solid fa-calendar-check"></i> Kiểm tra lịch hẹn</label>
                            <div class="input-group">
                                <input type="text" id="checkPhone" placeholder="Nhập số điện thoại khách...">
                                <button type="button" class="btn-secondary" id="btnCheckAppointment">Kiểm tra</button>
                            </div>
                            <div id="appointmentResult" style="display:none"></div>
                        </div>

                        <hr>

                        <form id="createJobCardForm">
                            <div class="form-row">
                                <div class="form-group flex-3">
                                    <label>Khách hàng (Nhập Tên hoặc SĐT để tìm)</label>
                                    <div class="search-customer-wrapper">
                                        <input type="text" id="searchCustomerInput" placeholder="VD: 0987... hoặc Nguyễn Văn A" autocomplete="off" class="form-control" required>
                                        <input type="hidden" id="selectedCustomerId" required>
                                        
                                        <ul id="customerSearchResults" class="autocomplete-dropdown" style="display: none;">
                                        </ul>
                                    </div>
                                </div>
                                <div class="form-group flex-1 align-bottom">
                                    <button type="button" class="btn-outline" id="btnOpenAddCustomer">
                                        <i class="fa-solid fa-user-plus"></i> Thêm khách
                                    </button>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group flex-3">
                                    <label>Phương tiện (Biển số/Loại xe)</label>
                                    <select id="selectVehicle" class="select-searchable" required disabled>
                                        <option value="">-- Chọn xe --</option>
                                    </select>
                                </div>
                                <div class="form-group flex-1 align-bottom">
                                    <button type="button" class="btn-outline" id="btnOpenAddVehicle" disabled>
                                        <i class="fa-solid fa-motorcycle"></i> Thêm xe
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label><i class="fa-solid fa-gears"></i> Chọn dịch vụ sửa chữa/bảo dưỡng</label>
                                <div class="input-group">
                                    <select id="selectService" class="select-searchable">
                                        <option value="">-- Tìm & Chọn dịch vụ --</option>
                                        </select>
                                    <button type="button" class="btn-secondary" id="btnAddService">
                                        <i class="fa-solid fa-plus"></i> Thêm
                                    </button>
                                </div>
                            </div>

                            <div class="selected-services-container">
                                <table class="table-mini" id="selectedServicesTable">
                                    <thead>
                                        <tr>
                                            <th>Tên dịch vụ</th>
                                            <th class="col-desc">Mô tả</th>
                                            <th class="col-action"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="selectedServicesBody">
                                        <tr class="empty-row">
                                            <td colspan="3" class="text-center text-muted">Chưa có dịch vụ nào được chọn</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="grid-2-cols">
                                <div class="form-group">
                                    <label>Assign Supervisor (Người quản lý kỹ thuật)</label>
                                    <select id="selectSupervisor" class="select-searchable" required>
                                        <option value="">-- Chọn Supervisor --</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label>Ghi chú triệu chứng / Yêu cầu khách hàng</label>
                                    <textarea id="jobCardNote" rows="3" placeholder="Nhập tình trạng xe khi nhận..."></textarea>
                                </div>
                            </div>
                        </form>
                        <div class="modal-footer">
                                <button type="submit" form="createJobCardForm" class="btn-primary">Xác nhận tạo JobCard</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="jobCardDetailModal" class="modal"></div>

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

    // Render danh sách Supervisor
    renderSupervisorSelect: (selectElement, users) => {
        let html = '<option value="">-- Chọn Supervisor đảm nhận --</option>';
        if (Array.isArray(users) && users.length > 0) {
            users.forEach(u => {   
                const id = u.userId || u.staffId || u.id;
                const name = u.fullName || u.userName || "Không rõ tên";
                html += `<option value="${id}">${name}</option>`;
            });
        } else {
            html = '<option value="">Không có nhân viên nào</option>';
        }
        selectElement.innerHTML = html;
    },

    // Render dropdown xe của khách
    renderVehicleSelect: (selectElement, vehicles) => {
        if (!vehicles || vehicles.length === 0) {
            selectElement.innerHTML = '<option value="">Khách hàng chưa có xe</option>';
            selectElement.disabled = true;
            return;
        }
        let html = '<option value="">-- Chọn xe của khách --</option>';
        vehicles.forEach(v => {
            // Kiểm tra các trường hợp tên thuộc tính có thể có
            const brand = v.brandName || v.brand || v.BrandName || "";
            const model = v.modelName || v.model || v.ModelName || "";
            
            html += `<option value="${v.vehicleId}">${v.licensePlate} - Hãng: ${brand} - Loại: ${model}</option>`;
        });
        selectElement.innerHTML = html;
        selectElement.disabled = false;
    },

    // Render dropdown dịch vụ
    renderServiceSelect: (selectElement, services) => {
        let html = '<option value="">-- Chọn dịch vụ --</option>';
        services.forEach(s => {
            // Tính tổng thời gian từ các task nếu totalEstimateMinute bằng 0
            const totalTime = s.totalEstimateMinute > 0 
                ? s.totalEstimateMinute 
                : (s.serviceTasks?.reduce((sum, task) => sum + (task.estimateMinute || 0), 0) || 0);

            html += `<option value="${s.serviceId}" 
                            data-price="${s.basePrice}" 
                            data-description="${s.description || ''}">
                        ${s.serviceName} (${s.basePrice.toLocaleString()}đ) - ~${totalTime}phút
                    </option>`;
        });
        selectElement.innerHTML = html;
    },

    // Render danh sách JobCard ra bảng chính
    renderJobCardTable: (tbody, items) => {
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center">Không có dữ liệu JobCard</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(item => {
            // Lấy thông tin xe từ object con 'vehicle'
            const vehicle = item.vehicle || {}; 
            const supervisor = item.supervisor || {};
            return `
                <tr>
                    <td>#${item.jobCardId}</td>
                    <td>${item.customerName || 'N/A'}</td>
                    <td>${vehicle.brandName || '-'}</td>
                    <td>${vehicle.modelName || '-'}</td>
                    <td><span class="plate-badge">${vehicle.licensePlate || 'N/A'}</span></td>
                    <td>${item.startDate ? new Date(item.startDate).toLocaleString('vi-VN') : 'N/A'}</td>
                    <td>
                        <span class="supervisor-name">
                            <i class="fa-solid fa-user-gear"></i> ${supervisor.fullName || 'Chưa phân công'}
                        </span>
                    </td>                    <td>
                        <span class="status-badge status-${item.status}">
                            ${item.status === 1 ? 'Chờ kiểm tra' : 'Hoàn thành'}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn-action view" data-id="${item.jobCardId}" title="Chi tiết">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-action print" data-id="${item.jobCardId}" 
                                onclick="showPrintPreview(${item.jobCardId})" title="In phiếu">
                            <i class="fa-solid fa-print"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Render kết quả tìm kiếm khách hàng (Autocomplete)
    renderCustomerSearchResults: (ulElement, customers, onSelectCallback) => {
        if (!customers || customers.length === 0) {
            ulElement.innerHTML = '<li style="padding: 10px; color: red;">Không tìm thấy khách hàng. Vui lòng thêm mới!</li>';
            ulElement.style.display = 'block';
            return;
        }

        ulElement.innerHTML = customers.map(c => `
            <li class="customer-item" data-id="${c.customerId}" data-name="${c.fullName}" data-phone="${c.phoneNumber}" 
                style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;">
                <strong>${c.fullName}</strong> - ${c.phoneNumber}
            </li>
        `).join('');

        ulElement.style.display = 'block';

        // Gắn sự kiện click cho từng dòng kết quả
        ulElement.querySelectorAll('.customer-item').forEach(li => {
            li.addEventListener('click', function() {
                onSelectCallback(this.dataset.id, this.dataset.name, this.dataset.phone);
                ulElement.style.display = 'none'; // Ẩn danh sách đi
            });
        });
    },

    // Render dropdown Hãng (Brand) trong Modal thêm xe
    renderBrandSelect: (selectElement, brands) => {
        selectElement.innerHTML = '<option value="">-- Chọn Hãng --</option>';
        brands.forEach(b => {
            const name = b.brandName || b.BrandName;
            const id = b.brandId || b.BrandId;
            selectElement.add(new Option(name, id));
        });
    },

    // Render dropdown Dòng xe (Model) trong Modal thêm xe
    renderModelSelect: (selectElement, models) => {
        selectElement.innerHTML = '<option value="">-- Chọn Dòng Xe --</option>';
        models.forEach(m => {
            const name = m.modelName || m.ModelName;
            const id = m.modelId || m.ModelId;
            selectElement.add(new Option(name, id));
        });
        selectElement.disabled = false;
    },

    //Kết quả trả về lịch hẹn
    renderAppointmentList: (container, appointments, onSelectCallback) => {
        let html = `
            <div class="apt-list-box" style="padding: 10px; border: 1px solid #ccc;">
                <p><strong>Tìm thấy ${appointments.length} lịch hẹn:</strong></p>
                <div class="apt-items" style="max-height: 200px; overflow-y: auto;">
                    ${appointments.map((apt, index) => `
                        <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;">
                            <input type="radio" name="aptSelect" id="apt_${index}" value="${index}">
                            <label for="apt_${index}" style="cursor: pointer;">
                                <strong>${new Date(apt.appointmentDateTime).toLocaleString('vi-VN')}</strong><br>
                                <small>Xe: ${apt.vehicle?.licensePlate || 'Chưa có xe'} | Dịch vụ: ${apt.services?.length || 0} mục</small>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <button type="button" id="btnConfirmApt" class="btn-primary" style="margin-top: 10px;">Áp dụng lịch hẹn</button>
            </div>
        `;

        container.innerHTML = html;

        container.querySelector('#btnConfirmApt').onclick = () => {
            const selected = container.querySelector('input[name="aptSelect"]:checked');
            if (!selected) return alert("Vui lòng chọn một lịch!");
            
            const apt = appointments[selected.value];
            onSelectCallback(apt);
        };
    },

    // Hiển thị thông báo kết quả tìm lịch hẹn
    renderAppointmentAlert: (container, appointment) => {
        container.style.display = 'block';
        if (appointment) {
            const isNewCustomer = !appointment.customerId;
            const fullName = `${appointment.lastName || ''} ${appointment.firstName || ''}`.trim();
            container.className = isNewCustomer ? 'info-alert warning' : 'info-alert success';
            
            let html = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <i class="fa-solid ${isNewCustomer ? 'fa-user-plus' : 'fa-circle-check'}"></i> 
                        <strong>Tìm thấy lịch hẹn:</strong> ${new Date(appointment.appointmentDateTime).toLocaleString('vi-VN')}<br>
                        <small>Khách: ${fullName} - SĐT: ${appointment.phone}</small>
                    </div>
            `;

            if (isNewCustomer) {
                html += `
                    <div class="alert-action" style="text-align: right;">
                        <span style="color: #d63031; font-weight: bold; display: block;">Khách mới (Chưa có ID)</span>
                        <small>Vui lòng tạo khách hàng trước</small>
                    </div>`;
            } else {
                html += `<div class="alert-action"><span class="badge-success">Khách thân thiết</span></div>`;
            }

            html += `</div>`;
            container.innerHTML = html;
        } else {
            container.className = 'info-alert warning';
            container.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Không tìm thấy lịch hẹn nào.`;
        }
    },

    // Render Service vào form create jobcard
    addServiceToTable: (service) => {
        const tbody = document.getElementById('selectedServicesBody');
        
        // Xóa dòng "Chưa có dịch vụ" nếu có
        const emptyRow = tbody.querySelector('.empty-row');
        if (emptyRow) emptyRow.remove();

        // Kiểm tra xem dịch vụ đã tồn tại trong bảng chưa để tránh trùng
        if (document.querySelector(`tr[data-id="${service.serviceId}"]`)) return;

        const row = document.createElement('tr');
        row.setAttribute('data-id', service.serviceId);
        row.innerHTML = `
            <td><strong>${service.serviceName}</strong></td>
            <td class="col-desc">${service.description || ''}</td>
            <td class="col-action text-right">
                <button type="button" class="btn-remove-service" style="color:red; border:none; background:none; cursor:pointer">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        
        // Gắn sự kiện xóa
        row.querySelector('.btn-remove-service').addEventListener('click', () => {
            row.remove();
            if (tbody.children.length === 0) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="3" class="text-center text-muted">Chưa có dịch vụ nào được chọn</td></tr>';
            }
        });

        tbody.appendChild(row);
    },

    // Render danh sách service đã chọn (dùng bởi jobcard-main.js)
    renderSelectedServices: (tbody, services, onRemove) => {
        if (!tbody) return;

        if (!Array.isArray(services) || services.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="3" class="text-center text-muted">Chua co dich vu nao duoc chon</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = services.map((service, index) => `
            <tr data-id="${service.id}">
                <td><strong>${service.name || ''}</strong></td>
                <td class="col-desc">${service.description || ''}</td>
                <td class="col-action text-right">
                    <button type="button" class="btn-remove-service" data-index="${index}" style="color:red; border:none; background:none; cursor:pointer">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-remove-service').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = Number(btn.dataset.index);
                if (Number.isFinite(idx)) onRemove(idx);
            });
        });
    },

    renderJobCardDetailModal: (data) => {
        // Hàm phụ để chuyển đổi Status số sang chữ
        const getStatusLabel = (s) => {
            const map = { 1: 'Chờ sửa chữa', 2: 'Đang làm', 3: 'Hoàn thành', 0: 'Đã hủy' };
            return map[s] || 'Không xác định';
        };

        return `
            <div class="modal-content detail-modal">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-file-invoice"></i> CHI TIẾT JOB CARD #${data.jobCardId}</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="detail-grid">
                        <div class="info-group">
                            <label>Khách hàng ID:</label> <span>${data.customerId}</span>
                        </div>
                        <div class="info-group">
                            <label>Biển số xe:</label> <span class="badge-plate">${data.licensePlate || 'N/A'}</span>
                        </div>
                        <div class="info-group">
                            <label>Ngày bắt đầu:</label> <span>${new Date(data.startDate).toLocaleString('vi-VN')}</span>
                        </div>
                        <div class="info-group">
                            <label>Trạng thái:</label> <span class="status-${data.status}">${getStatusLabel(data.status)}</span>
                        </div>
                        <div class="info-group full-width">
                            <label>Ghi chú:</label> <p>${data.note || '<i>Không có ghi chú</i>'}</p>
                        </div>
                        <div class="info-group">
                            <label>Supervisor ID:</label> <span>${data.supervisorId}</span>
                        </div>
                        <div class="info-group">
                            <label>Người tạo (ID):</label> <span>${data.createdByEmployeeId}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary print-jobcard" data-id="${data.jobCardId}" onclick="showPrintPreview()>
                        <i class="fa-solid fa-print"></i> In phiếu
                    </button>
                </div>
            </div>
            <div id="printPreviewModal" class="modal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-eye"></i> Xem trước bản in</h3>
                        <span class="close-modal" onclick="closePrintModal()">&times;</span>
                    </div>
                    <div class="modal-body" style="background: #525659; padding: 30px; display: flex; justify-content: center;">
                        <div id="printablePaper" class="a5-paper">
                            </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" onclick="closePrintModal()">Đóng</button>
                        <button class="btn-primary" onclick="executePrint()">
                            <i class="fa-solid fa-print"></i> In ngay
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
};
