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
                
                <input type="text" id="licensePlate" placeholder="Biển số xe *" value="${licensePlateValue}" required>

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