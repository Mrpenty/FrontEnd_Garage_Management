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
        const getStatusInfo = (status) => {
            switch (status) {
                case 1: return { label: 'Vừa tạo', class: 'status-created' };
                case 2: return { label: 'Chờ tiếp nhận', class: 'status-waiting' };
                case 3: return { label: 'Chờ kiểm tra', class: 'status-waiting-insp' };
                case 4: return { label: 'Đang kiểm tra', class: 'status-inspection' };
                case 5: return { label: 'Chờ Supervisor duyệt', class: 'status-waiting-sv' };
                case 6: return { label: 'Chờ khách duyệt', class: 'status-waiting-cust' };
                case 7: return { label: 'Đang sửa chữa', class: 'status-inprogress' };
                case 8: return { label: 'Chờ nhận xe', class: 'status-waiting-pickup' };
                case 9: return { label: 'Hoàn thành', class: 'status-completed' };
                case 10: return { label: 'Đã hủy', class: 'status-rejected' };
                case 11: return { label: 'Không phát hiện lỗi', class: 'status-noissue' };
                case 12: return { label: 'Phát sinh lỗi mới', class: 'status-newfault' };
                default: return { label: 'Không xác định', class: 'status-unknown' };
            }
        };

        // Kiểm tra nếu items là object chứa pageData thì lấy pageData
        const dataList = Array.isArray(items) ? items : (items?.pageData || []);

        if (dataList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center">Không có dữ liệu JobCard</td></tr>`;
            return;
        }

        tbody.innerHTML = dataList.map(item => {
            const vehicle = item.vehicle || {}; 
            const statusInfo = getStatusInfo(item.status);
            
            // Xử lý hiển thị thợ máy (vì mechanics là mảng)
            const mechanicName = (item.mechanics && item.mechanics.length > 0) 
                ? item.mechanics[0].fullName 
                : 'Chưa phân công';

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
                            <i class="fa-solid fa-user-gear"></i> ${mechanicName}
                        </span>
                    </td>                   
                    <td>
                        <span class="status-badge ${statusInfo.class}">
                            ${statusInfo.label}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn-action view" data-id="${item.jobCardId}" title="Chi tiết">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-action print" 
                            onclick="showPrintPreviewFromData(${item.jobCardId})" title="In phiếu">
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
        let localSelectedApt = null; // Biến tạm lưu lịch đang được highlight

        let html = `
            <div class="apt-wrapper">
                <div class="apt-header">
                    <i class="fas fa-calendar-check"></i>
                    <span>Tìm thấy <strong>${appointments.length}</strong> lịch hẹn phù hợp</span>
                </div>
                <div class="apt-scroll-area">
                    ${appointments.map((apt, index) => `
                        <div class="apt-card" data-index="${index}">
                            <div class="apt-card-icon"><i class="fas fa-clock"></i></div>
                            <div class="apt-card-content">
                                <div class="apt-time">${new Date(apt.appointmentDateTime).toLocaleString('vi-VN')}</div>
                                <div class="apt-details">
                                    <span class="apt-plate"><i class="fas fa-car"></i> ${apt.vehicle?.licensePlate || 'Chưa có xe'}</span>
                                    <span class="apt-service-count"><i class="fas fa-tools"></i> ${apt.services?.length || 0} dịch vụ</span>
                                </div>
                                ${apt.description ? `<div class="apt-note">"${apt.description}"</div>` : ''}
                            </div>
                            <div class="apt-check-mark"><i class="fas fa-check-circle"></i></div>
                        </div>
                    `).join('')}
                </div>
                <div class="apt-footer">
                    <button type="button" id="btnConfirmApt" class="btn-apply-apt" disabled>
                        <i class="fas fa-magic"></i> Áp dụng lịch hẹn này
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        const cards = container.querySelectorAll('.apt-card');
        const confirmBtn = container.querySelector('#btnConfirmApt');

        cards.forEach(card => {
            card.onclick = () => {
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                const index = card.dataset.index;
                localSelectedApt = appointments[index]; // Gán vào biến tạm
                
                confirmBtn.disabled = false;
                confirmBtn.classList.add('ready');
            };
        });

        confirmBtn.onclick = () => {
            if (localSelectedApt) {
                // GỬI DỮ LIỆU NGƯỢC LẠI CHO LOGIC QUA CALLBACK
                onSelectCallback(localSelectedApt); 
                
                // UI Phản hồi: Đổi thông báo hoặc ẩn danh sách
                container.innerHTML = `<div class="info-alert success">
                    <i class="fas fa-check"></i> Đã áp dụng lịch hẹn lúc ${new Date(localSelectedApt.appointmentDateTime).toLocaleString('vi-VN')}
                </div>`;
            }
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
    const getStatusInfo = (status) => {
        switch (status) {
            case 1: return { label: 'Vừa tạo', class: 'status-created' };
            case 2: return { label: 'Chờ tiếp nhận', class: 'status-waiting' };
            case 3: return { label: 'Chờ kiểm tra', class: 'status-waiting-insp' };
            case 4: return { label: 'Đang kiểm tra', class: 'status-inspection' };
            case 5: return { label: 'Chờ Supervisor duyệt', class: 'status-waiting-sv' };
            case 6: return { label: 'Chờ khách duyệt', class: 'status-waiting-cust' };
            case 7: return { label: 'Đang sửa chữa', class: 'status-inprogress' };
            case 8: return { label: 'Chờ nhận xe', class: 'status-waiting-pickup' };
            case 9: return { label: 'Hoàn thành', class: 'status-completed' };
            case 10: return { label: 'Đã hủy', class: 'status-rejected' };
            case 11: return { label: 'Không phát hiện lỗi', class: 'status-noissue' };
            case 12: return { label: 'Phát sinh lỗi mới', class: 'status-newfault' };
            default: return { label: 'Không xác định', class: 'status-unknown' };
        }
    };
    const statusInfo = getStatusInfo(data.status);

    // Render danh sách thợ máy
    const mechanicsHtml = data.mechanics?.map(m => `
        <span class="badge-mechanic"><i class="fa fa-wrench"></i> ${m.mechanicName}</span>
    `).join('') || 'Chưa phân công';

    // Render danh sách dịch vụ kèm Task
    const servicesHtml = data.services?.map(srv => `
        <div class="service-item-detail">
            <div class="service-header">
                <strong>${srv.serviceName || 'Dịch vụ #' + srv.serviceId}</strong>
                <span class="price">${(srv.price || 0).toLocaleString()} đ</span>
            </div>
            <ul class="task-list">
                ${srv.serviceTasks?.map(t => `
                    <li class="${t.status === 3 ? 'done' : ''}">
                        <i class="fa-regular ${t.status === 3 ? 'fa-check-circle' : 'fa-circle'}"></i> 
                        ${t.taskName}
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('') || '<p>Chưa có dịch vụ</p>';

    const dataString = JSON.stringify(data).replace(/"/g, '&quot;');

    return `
    <div class="modal-content detail-modal" style="max-width: 900px;">
        <div class="modal-header">
            <h3><i class="fa-solid fa-file-invoice"></i> CHI TIẾT JOB CARD #${data.jobCardId}</h3>
            <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
            <div class="detail-top-grid">
                <div class="info-card">
                    <label>Khách hàng</label>
                    <p>${data.customerName || 'ID: ' + data.customerId}</p>
                </div>
                <div class="info-card">
                    <label>Biển số xe</label>
                    <p class="plate-text">${data.licensePlate || 'ID: ' + data.vehicleId}</p>
                </div>
                <div class="info-card">
                    <label>Kỹ thuật viên</label>
                    <p>${mechanicsHtml}</p>
                </div>
                <div class="info-card">
                    <label>Trạng thái</label>
                    <p><span class="status-badge-detail ${statusInfo.class}">${statusInfo.label}</span></p>
                </div>
            </div>

            <div class="detail-main-content">
                <h4><i class="fa-solid fa-gears"></i> Nội dung thực hiện</h4>
                <div class="services-container-detail">
                    ${servicesHtml}
                </div>
                
                <div class="note-section">
                    <label>Ghi chú khách hàng:</label>
                    <p>${data.note || '<i>Không có ghi chú</i>'}</p>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-primary" onclick="showPrintPreviewFromData('${dataString}')">
                <i class="fa-solid fa-print"></i> In phiếu tiếp nhận
            </button>
        </div>
    </div>
    `;
    }
};
