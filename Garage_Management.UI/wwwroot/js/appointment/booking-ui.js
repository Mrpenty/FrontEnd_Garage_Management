export const bookingUI = {
    // Render danh sách hãng xe vào Select
    renderBrandSelect: (selectElement, brands) => {
        let options = `<option value="">-- Chọn hãng xe --</option>`;
        brands.forEach(brand => {
            options += `<option value="${brand.brandId}">${brand.brandName}</option>`;
        });
        selectElement.innerHTML = options;
    },

    renderMyVehicles(vehicles) {
        const select = document.getElementById("myVehicles");
        if (!vehicles || vehicles.length === 0) {
            select.innerHTML = `<option value="">Bạn chưa có xe nào. Hãy chọn "Thêm xe mới"</option>`;
            return;
        }
        select.innerHTML = `<option value="">-- Chọn xe của bạn --</option>` + 
        vehicles.map(v => `
            <option value="${v.vehicleId}" 
                    data-plate="${v.licensePlate}"
                    data-brand="${v.brandName}" 
                    data-brandid="${v.brandId}" 
                    data-model="${v.modelName}"
                    data-modelid="${v.vehicleModelId}">
                ${v.licensePlate} - ${v.brandName} ${v.modelName}
            </option>`).join('');
    },

    // Render danh sách loại xe vào Select
    renderModelSelect: (selectElement, models) => {
        if (models.length === 0) {
            selectElement.innerHTML = `<option value="">Không có loại xe cho hãng này</option>`;
            return;
        }
        let options = `<option value="">-- Chọn loại xe --</option>`;
        models.forEach(model => {
            options += `<option value="${model.modelId}">${model.modelName}</option>`;
        });
        selectElement.innerHTML = options;
        selectElement.disabled = false;
    },

    renderServiceList: (containerElement, services, formatCurrencyFn, currentPage = 1, pageSize = 6) => {
        // Tính toán dữ liệu cho trang hiện tại
        const startIndex = (currentPage - 1) * pageSize;
        const pagedServices = services.slice(startIndex, startIndex + pageSize);

        // Render danh sách Card
        containerElement.innerHTML = pagedServices.map(s => `
            <div class="service-card" onclick="const chk = this.querySelector('input'); chk.checked = !chk.checked; chk.dispatchEvent(new Event('change', {bubbles: true}));">
                <input type="checkbox" name="service-item" value="${s.serviceId}" id="svc-${s.serviceId}" 
                    onclick="event.stopPropagation()" />
                <div class="service-info">
                    <h4>${s.serviceName}</h4>
                    <p class="service-desc">${s.description || 'Không có mô tả cho dịch vụ này.'}</p>
                    <div class="service-meta">
                        <span class="price">${formatCurrencyFn(s.basePrice)}</span>
                        <span class="duration">
                            <i class="far fa-clock"></i> ${s.totalEstimateMinute} phút
                        </span>
                    </div>
                </div>
            </div>
        `).join("");

        // Render nút phân trang nếu cần
        const totalPages = Math.ceil(services.length / pageSize);
        if (totalPages > 1) {
            const paginationHtml = `
                <div class="pagination-container" style="grid-column: 1 / -1;">
                    ${Array.from({ length: totalPages }, (_, i) => `
                        <button class="page-btn ${i + 1 === currentPage ? 'active' : ''}" 
                                onclick="window.changeServicePage(${i + 1})">${i + 1}</button>
                    `).join('')}
                </div>
            `;
            containerElement.innerHTML += paginationHtml;
        }
    },

    // Render danh sách các phụ tùng
    renderPartList: (container, parts, formatCurrencyFn, currentPage = 1, pageSize = 6) => {
        const list = Array.isArray(parts) ? parts : (parts?.pageData || parts?.items || []);
        if (!list || list.length === 0) {
            container.innerHTML = `
                <div class="no-data-msg">
                    <p>Hãng xe này hiện chưa có phụ kiện gợi ý sẵn. Bạn có thể bỏ qua bước này.</p>
                </div>`;
            return;
        }
        const startIndex = (currentPage - 1) * pageSize;
        const pagedParts = list.slice(startIndex, startIndex + pageSize);
        // 3. Render danh sách (Đã có biến 'list' nên sẽ không còn lỗi ReferenceError)
        container.innerHTML = `
            <div id="part-list-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; width: 100%;">
                ${pagedParts.map(p => `
                    <div class="service-card" onclick="handlePartClick(this, ${p.sparePartId})">
                        <input type="checkbox" name="part-item" value="${p.sparePartId}" id="part-${p.sparePartId}" 
                            ${(window.bookingState?.parts || []).includes(p.sparePartId) ? 'checked' : ''}
                            onclick="event.stopPropagation()" />
                        <div class="service-info">
                            <h4>${p.partName}</h4>
                            <p class="service-desc">Mã: ${p.partCode} | ĐVT: ${p.unit}</p>
                            <div class="service-meta">
                                <span class="price" style="color: #d32f2f; font-weight: bold;">${formatCurrencyFn(p.sellingPrice)}</span>
                                <span class="stock" style="font-size: 12px; color: ${p.quantity > 0 ? '#27ae60' : '#e74c3c'}">
                                    <i class="fas fa-warehouse"></i> Kho: ${p.quantity}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;

            const totalPages = Math.ceil(list.length / pageSize);
            if (totalPages > 1) {
                container.innerHTML += `
                    <div class="pagination-container" style="display: flex; justify-content: center; gap: 10px; margin-top: 20px; width: 100%;">
                        ${Array.from({ length: totalPages }, (_, i) => `
                            <button class="page-btn ${i + 1 === currentPage ? 'active' : ''}" 
                                    onclick="window.changePartPage(${i + 1})">${i + 1}</button>
                        `).join('')}
                    </div>`;
            }
    },

    //Render Booking form
    renderBookingForm: (container, userInfo) => {
        // Kiểm tra xem có phải Customer không
        const isCustomer = !!(userInfo.userId || userInfo.id);       
        const fullName = userInfo.fullName || "";
        const nameParts = fullName.split(' ');
        const lastName = nameParts.length > 1 ? nameParts.pop() : "";
        const firstName = nameParts.join(' ');
        const licensePlateValue = window.bookingState?.licensePlate || "";
        const isLogged = isCustomer;
        container.innerHTML = `
            <div class="booking-form-wrapper">
                ${isCustomer ? `
                    <div class="booking-option" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <input type="checkbox" id="bookForOthers">
                        <label for="bookForOthers" style="font-weight: bold; color: #d9534f; cursor: pointer;">
                            <i class="fas fa-user-friends"></i> Tôi muốn đặt lịch hộ người khác
                        </label>
                    </div>
                ` : ""}

                <div class="form-row">
                    <input type="text" id="firstName" placeholder="Họ *" value="${firstName}" ${isLogged ? 'readonly' : ''} required>
                    <input type="text" id="lastName" placeholder="Tên *" value="${lastName}" ${isLogged ? 'readonly' : ''} required>
                </div>
                <input type="text" id="phone" placeholder="Số điện thoại *" value="${userInfo.phoneNumber || ''}" ${isLogged ? 'readonly' : ''} required>
                
                <input type="text" id="licensePlate" placeholder="Biển số xe *" value="${licensePlateValue}" maxlength="11" required>

                <label style="margin-top: 10px; display: block;">Chọn ngày hẹn:</label>
                <input type="date" id="appointmentDate" min="${new Date().toISOString().split('T')[0]}" required>
                
                <label style="margin-top: 10px; display: block;">Chọn khung giờ:</label>
                <div id="time-slots" class="time-slots-grid"></div>
                
                <textarea id="note" placeholder="Mô tả tình trạng xe..."></textarea>
                
                <div class="button-group" style="margin-top: 20px;">
                    <button type="button" class="btn-back" onclick="nextStep(2)">Quay lại</button>
                    <button type="submit" class="btn-submit">XÁC NHẬN ĐẶT LỊCH</button>
                </div>
            </div>
        `;

        // Sự kiện Đặt hộ (TH3)
        const checkOther = document.getElementById("bookForOthers");
        if (checkOther) {
            checkOther.addEventListener('change', (e) => {
                const fields = ['firstName', 'lastName', 'phone'];
                if (e.target.checked) {
                    // Chuyển sang chế độ nhập tự do
                    fields.forEach(id => {
                        const el = document.getElementById(id);
                        el.value = "";
                        el.readOnly = false;
                        el.style.backgroundColor = "#fff";
                    });
                } else {
                    // Khôi phục dữ liệu đăng nhập và readonly
                    document.getElementById("firstName").value = firstName;
                    document.getElementById("lastName").value = lastName;
                    document.getElementById("phone").value = userInfo.phoneNumber || "";
                    fields.forEach(id => {
                        const el = document.getElementById(id);
                        el.readOnly = true;
                        el.style.backgroundColor = "#e9ecef";
                    });
                }
            });
        }
    },

    renderTimeSlots: (container, slots) => {
        container.innerHTML = slots.map(slot => `
            <div class="time-slot-item">
                <input type="radio" name="time-slot" id="slot-${slot.value}" value="${slot.value}" required>
                <label for="slot-${slot.value}">${slot.label}</label>
            </div>
        `).join('');
    },

    // Cập nhật trạng thái Active trên Step Bar
    updateStepBar: (step) => {
        document.querySelectorAll('.step').forEach(el => {
            el.classList.remove('active');
            if (parseInt(el.dataset.step) <= step) {
                el.classList.add('active');
            }
        });
    },

    // Chuyển nội dung Step Content
    showStepContent: (step) => {
        document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`step-${step}`);
        if (target) target.classList.add('active');
    }
};