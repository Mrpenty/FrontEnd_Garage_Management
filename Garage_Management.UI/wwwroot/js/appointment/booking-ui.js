export const bookingUI = {
    // Render danh sách hãng xe vào Select
    renderBrandSelect: (selectElement, brands) => {
        let options = `<option value="">-- Chọn hãng xe --</option>`;
        brands.forEach(brand => {
            options += `<option value="${brand.brandId}">${brand.brandName}</option>`;
        });
        selectElement.innerHTML = options;
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

    // Render danh sách dịch vụ (Service Card)
    renderServiceList: (containerElement, services, formatCurrencyFn) => {
        containerElement.innerHTML = services.map(s => `
            <div class="service-card" onclick="document.getElementById('svc-${s.serviceId}').click()">
                <input type="checkbox" name="service-item" value="${s.serviceId}" id="svc-${s.serviceId}" 
                    onclick="event.stopPropagation()" />
                <div class="service-info">
                    <h4>${s.serviceName}</h4>
                    <p class="service-desc">${s.description || 'Không có mô tả'}</p>
                    <div class="service-meta">
                        <span class="price text-danger">${formatCurrencyFn(s.basePrice)}</span>
                        <span class="duration"><i class="far fa-clock"></i> ${s.totalEstimateMinute} phút</span>
                    </div>
                </div>
            </div>
        `).join("");
    },

    // Render danh sách các phụ tùng theo Brands đã chọn
    renderPartList: (container, parts, formatCurrencyFn) => {
        if (!parts || parts.length === 0) {
            container.innerHTML = `
                <div class="no-data-msg">
                    <p>Hãng xe này hiện chưa có phụ kiện gợi ý sẵn. Bạn có thể bỏ qua bước này.</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="service-grid">
                ${parts.map(p => `
                    <div class="service-card" onclick="document.getElementById('part-${p.inventoryId}').click()">
                        <input type="checkbox" name="part-item" value="${p.inventoryId}" id="part-${p.inventoryId}" 
                               onclick="event.stopPropagation()" />
                        <div class="service-info">
                            <h4>${p.inventoryName}</h4>
                            <p class="service-desc">${p.description || 'Phụ tùng chính hãng'}</p>
                            <div class="service-meta">
                                <span class="price text-danger">${formatCurrencyFn(p.price)}</span>
                                <span class="stock">Kho: ${p.quantity}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    //Render Booking form
    renderBookingForm: (container, userInfo) => {
        // Kiểm tra xem có phải Customer không
        const isCustomer = !!(userInfo.userId || userInfo.id);
        
        const fullName = userInfo.fullName || "";
        const nameParts = fullName.split(' ');
        const lastName = nameParts.length > 1 ? nameParts.pop() : "";
        const firstName = nameParts.join(' ');

        // Nếu là Customer, thêm thuộc tính disabled và style mờ
        const attr = isCustomer ? "disabled style='background-color: #e9ecef; cursor: not-allowed;'" : "";
        const labelNote = isCustomer ? "<p style='font-size: 0.8rem; color: #666;'>* Thông tin được lấy từ hồ sơ cá nhân</p>" : "";

        container.innerHTML = `
            <div class="booking-form-wrapper">
                ${labelNote}
                <div class="form-row">
                    <input type="text" id="firstName" placeholder="Họ *" value="${firstName}" ${attr} required>
                    <input type="text" id="lastName" placeholder="Tên *" value="${lastName}" ${attr} required>
                </div>
                <input type="text" id="phone" placeholder="Số điện thoại *" value="${userInfo.phoneNumber || ''}" ${attr} required>
                
                <label style="margin-top: 10px; display: block;">Chọn ngày hẹn:</label>
                <input type="date" id="appointmentDate" min="${new Date().toISOString().split('T')[0]}" required>
                
                <label style="margin-top: 10px; display: block;">Chọn khung giờ:</label>
                <div id="time-slots" class="time-slots-grid"></div>
                
                <textarea id="note" placeholder="Mô tả tình trạng xe (ví dụ: Thay dầu, kiểm tra phanh...)"></textarea>
                
                <button type="submit" class="btn-submit">XÁC NHẬN ĐẶT LỊCH</button>
            </div>
        `;
    },

    renderTimeSlots: (container, slots) => {
        container.innerHTML = slots.map(slot => `
            <div class="time-slot-item">
                <input type="radio" name="time-slot" id="slot-${slot.time}" value="${slot.time}">
                <label for="slot-${slot.time}">${slot.time}</label>
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