export const customerUI = {
    renderLayout: (container) => {
        container.innerHTML = `
            <div class="job-card-section">
                <h2 class="table-title-main">DANH SÁCH KHÁCH HÀNG</h2>
                
                <div class="table-toolbar">
                    <div class="left-tools" style="flex-wrap:wrap; gap:10px;">
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="searchCustomer" placeholder="Tìm tên hoặc số điện thoại...">
                        </div>
                        <button id="btn-customer-search" class="btn-primary" style="padding:8px 16px;">
                            <i class="fa-solid fa-search"></i> Tìm
                        </button>
                        <select id="customer-filter-vehicle" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; background:#fff;">
                            <option value="">-- Trạng thái xe --</option>
                            <option value="has">Có xe</option>
                            <option value="none">Chưa có xe</option>
                        </select>
                        <select id="customer-sort" style="padding:8px 12px; border:1px solid #cbd5e1; border-radius:6px; background:#fff;">
                            <option value="">-- Sắp xếp --</option>
                            <option value="newest">Mới đăng ký nhất</option>
                            <option value="oldest">Lâu nhất</option>
                            <option value="name-asc">Tên A → Z</option>
                            <option value="name-desc">Tên Z → A</option>
                        </select>
                        <button id="btn-customer-reset" class="btn-cancel" style="padding:8px 14px;">
                            <i class="fa-solid fa-rotate-left"></i> Reset
                        </button>
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
                                <th>Họ tên</th>
                                <th>Số điện thoại</th>
                                <th>Email</th>
                                <th>Biển số xe</th>
                                <th>Dòng xe (Models)</th>
                                <th>Địa chỉ</th>
                                <th class="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="customer-table-body">
                            <tr><td colspan="7" class="text-center">Đang tải dữ liệu...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="pagination-bar" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0;">
                    <small id="customerPagingMeta" class="text-muted"></small>
                    <div id="customerPagination"></div>
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
                                    <input type="email" id="newCustomerEmail" placeholder="Nhập email (không bắt buộc)">
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

            <!-- Modal Chi tiết khách hàng + lịch sử sửa xe -->
            <div id="customerDetailModal" class="modal customer-modal">
                <div class="modal-content" style="max-width: 900px; width: 90%;">
                    <div class="modal-header">
                        <h3><i class="fa-solid fa-id-card"></i> Chi tiết khách hàng</h3>
                        <span class="close-modal close-customer-detail">&times;</span>
                    </div>
                    <div class="modal-body" id="customerDetailBody" style="max-height: 70vh; overflow-y: auto;">
                        <div class="text-center" style="padding:30px;">
                            <i class="fa-solid fa-spinner fa-spin"></i> Đang tải...
                        </div>
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
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">Không tìm thấy khách hàng nào</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item => {
            const vehicles = item.vehicles || [];
            let plateHtml = '';
            let modelsHtml = '';

            if (vehicles.length > 0) {
                plateHtml = vehicles.map(v => `
                    <div class="vehicle-mini-badge" title="${v.brand || ''} ${v.model || ''} (${v.year || ''})">
                        <i class="fa-solid fa-motorcycle"></i> ${v.licensePlate || ''}
                    </div>
                `).join('');
                modelsHtml = vehicles.map(v => {
                    const label = [v.brand, v.model].filter(Boolean).join(' ') || 'N/A';
                    return `<div style="font-size:12px; color:#475569; padding:2px 0;">${label}</div>`;
                }).join('');
            } else {
                plateHtml = '<span class="text-muted" style="font-size: 11px;">Chưa có xe</span>';
                modelsHtml = '<span class="text-muted" style="font-size: 11px;">—</span>';
            }

            return `
                <tr>
                    <td><strong>${item.fullName}</strong></td>
                    <td>${item.phoneNumber}</td>
                    <td>${item.email || '<span class="text-muted">N/A</span>'}</td>
                    <td><div class="customer-vehicles-list">${plateHtml}</div></td>
                    <td>${modelsHtml}</td>
                    <td><small>${item.address || 'Chưa cập nhật'}</small></td>
                    <td class="text-center">
                        <button class="btn-action view btn-view-customer" data-id="${item.customerId}" title="Xem chi tiết & lịch sử sửa xe">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-action add-v btn-add-vehicle-row" data-id="${item.customerId}" title="Thêm xe">
                            <i class="fa-solid fa-plus-circle"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Render chi tiết khách + xe + lịch sử sửa xe vào modal
    renderCustomerDetail: (container, { customer, jobcards }) => {
        if (!customer) {
            container.innerHTML = `<div class="text-center" style="color:red; padding:20px;">Không tải được dữ liệu khách hàng</div>`;
            return;
        }

        const vehicles = customer.vehicles || [];
        const jcs = (jobcards || []).slice().sort((a, b) =>
            new Date(b.startDate || b.createdAt || 0) - new Date(a.startDate || a.createdAt || 0));

        // --- Section 1: Thông tin cá nhân ---
        const infoHtml = `
            <div style="background:#f8fafc; border-radius:8px; padding:15px; margin-bottom:15px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div><i class="fa-solid fa-user" style="color:#4f46e5; width:20px;"></i>
                        <strong>${customer.fullName || ''}</strong></div>
                    <div><i class="fa-solid fa-phone" style="color:#4f46e5; width:20px;"></i>
                        ${customer.phoneNumber || 'N/A'}</div>
                    <div><i class="fa-solid fa-envelope" style="color:#4f46e5; width:20px;"></i>
                        ${customer.email || '<span class="text-muted">Chưa cập nhật</span>'}</div>
                    <div><i class="fa-solid fa-id-card" style="color:#4f46e5; width:20px;"></i>
                        Mã KH: <strong>#${customer.customerId}</strong></div>
                    <div style="grid-column: span 2;"><i class="fa-solid fa-location-dot" style="color:#4f46e5; width:20px;"></i>
                        ${customer.address || '<span class="text-muted">Chưa cập nhật</span>'}</div>
                </div>
            </div>`;

        // --- Section 2: Danh sách xe ---
        const vehicleCards = vehicles.length === 0
            ? `<div style="color:#94a3b8; font-style:italic; padding:10px;">Khách hàng chưa có xe nào</div>`
            : vehicles.map(v => `
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:#4f46e5; font-size:1.05rem;">
                            <i class="fa-solid fa-motorcycle"></i> ${v.licensePlate || 'Chưa có biển số'}
                        </strong>
                        ${v.year ? `<span style="font-size:0.8rem; color:#64748b;">Năm SX: ${v.year}</span>` : ''}
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:6px; font-size:0.85rem; color:#475569;">
                        <div><span style="color:#94a3b8;">Hãng:</span> <strong>${v.brand || 'N/A'}</strong></div>
                        <div><span style="color:#94a3b8;">Dòng:</span> <strong>${v.model || 'N/A'}</strong></div>
                        <div><span style="color:#94a3b8;">Loại:</span> <strong>${v.typeName || v.type || 'N/A'}</strong></div>
                        ${v.vin ? `<div style="grid-column: span 3;"><span style="color:#94a3b8;">VIN:</span> <code style="font-size:0.75rem;">${v.vin}</code></div>` : ''}
                    </div>
                </div>
            `).join('');

        // --- Section 3: Lịch sử sửa xe ---
        const statusMap = {
            1: { text: 'Mới tạo', color: '#64748b' },
            2: { text: 'Chờ thợ', color: '#f59e0b' },
            3: { text: 'Chờ kiểm tra', color: '#f59e0b' },
            4: { text: 'Đang kiểm tra', color: '#3b82f6' },
            5: { text: 'Chờ duyệt', color: '#a855f7' },
            6: { text: 'Chờ khách duyệt', color: '#a855f7' },
            7: { text: 'Đang sửa', color: '#3b82f6' },
            8: { text: 'Hoàn thành', color: '#10b981' },
            9: { text: 'Đã giao xe', color: '#10b981' },
            10: { text: 'Đã hủy', color: '#ef4444' },
            11: { text: 'Không có lỗi', color: '#10b981' },
            12: { text: 'Phát sinh', color: '#f59e0b' }
        };

        const historyHtml = jcs.length === 0
            ? `<div style="color:#94a3b8; font-style:italic; padding:10px;">Chưa có lịch sử sửa xe</div>`
            : `<div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày tiếp nhận</th>
                            <th>Biển số</th>
                            <th>Chi nhánh</th>
                            <th class="text-center">Hạng mục</th>
                            <th class="text-center">Tiến độ</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${jcs.map(jc => {
                            const s = statusMap[jc.status] || { text: jc.statusName || 'N/A', color: '#94a3b8' };
                            const date = jc.startDate ? new Date(jc.startDate).toLocaleString('vi-VN') : '';
                            const plate = jc.licensePlate || jc.vehicles?.[0]?.licensePlate || '';
                            const branch = jc.branchName || `#${jc.branchId || ''}`;
                            const svCount = jc.serviceCount || 0;
                            const spCount = jc.sparePartCount || 0;
                            const progress = jc.progressPercentage || 0;
                            return `
                                <tr>
                                    <td><strong style="color:#4f46e5;">#JC-${jc.jobCardId}</strong></td>
                                    <td><small>${date}</small></td>
                                    <td><strong>${plate}</strong></td>
                                    <td><small>${branch}</small></td>
                                    <td class="text-center">
                                        <span style="background:#eef2ff; color:#4338ca; padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:600;" title="Dịch vụ">${svCount} DV</span>
                                        <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:10px; font-size:0.75rem; font-weight:600; margin-left:4px;" title="Phụ tùng">${spCount} PT</span>
                                    </td>
                                    <td class="text-center"><strong>${progress}%</strong></td>
                                    <td><span style="background:${s.color}; color:#fff; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:600;">${s.text}</span></td>
                                </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;

        container.innerHTML = `
            <h4 style="border-left:4px solid #4f46e5; padding-left:10px; margin-bottom:10px; color:#1e293b;">
                <i class="fa-solid fa-circle-info"></i> Thông tin cá nhân
            </h4>
            ${infoHtml}

            <h4 style="border-left:4px solid #10b981; padding-left:10px; margin-bottom:10px; color:#1e293b;">
                <i class="fa-solid fa-motorcycle"></i> Danh sách xe (${vehicles.length})
            </h4>
            ${vehicleCards}

            <h4 style="border-left:4px solid #f59e0b; padding-left:10px; margin: 20px 0 10px 0; color:#1e293b;">
                <i class="fa-solid fa-clock-rotate-left"></i> Lịch sử sửa xe (${jcs.length})
            </h4>
            ${historyHtml}
        `;
    }
};