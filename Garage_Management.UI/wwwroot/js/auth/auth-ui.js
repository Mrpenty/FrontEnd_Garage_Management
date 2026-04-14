export const authUi = {
    get elements() {
        return {
            form: document.getElementById('login-form'),
            passwordField: document.getElementById('password-field'),
            otpField: document.getElementById('otp-field'),
            msgDisplay: document.getElementById('msg-display'),
            btnSendOtp: document.getElementById('send-otp-btn'),
            tabs: document.querySelectorAll('.tab-btn'),
            phoneInput: document.getElementById('phone'),
            pFullName: document.getElementById('p-fullname'),
            pRole: document.getElementById('p-role'),
            pPhone: document.getElementById('p-phone'),
            pEmail: document.getElementById('p-email'),
            pCreated: document.getElementById('p-created'),
            pStatus: document.getElementById('p-status'),
            btnOpenChangePw: document.querySelector('.btn-auth'), // Nút "Đổi mật khẩu" trên trang Profile
            modalChangePw: document.getElementById('change-password-modal'),
            btnCloseModal: document.getElementById('close-modal'),
            formChangePw: document.getElementById('change-password-form'),
            cpwMsg: document.getElementById('cpw-msg'),
            btnViewBookings: document.getElementById('btn-view-bookings'),
            carListBody: document.getElementById('car-list-body'),
            btnOpenAddVehicle: document.getElementById('btn-add-vehicle'),
            modalAddVehicle: document.getElementById('add-vehicle-modal'),
            btnCloseVehicleModal: document.getElementById('close-vehicle-modal'),
            formAddVehicle: document.getElementById('add-vehicle-form'),
            modelSelect: document.getElementById('v-model'),
            historyListBody: document.getElementById('history-list-body')
        };
    },

    toggleMode(useOtp) {
        // 1. Ẩn/Hiện các trường nhập liệu
        if (useOtp) {
            this.elements.passwordField.classList.add('hidden');
            this.elements.otpField.classList.remove('hidden');
        } else {
            this.elements.passwordField.classList.remove('hidden');
            this.elements.otpField.classList.add('hidden');
        }

        // 2. Cập nhật trạng thái Active cho Tab (màu đỏ gạch chân)
        this.elements.tabs.forEach(btn => {
            const mode = btn.getAttribute('data-mode');
            if ((useOtp && mode === 'otp') || (!useOtp && mode === 'password')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    // Hàm render dữ liệu Profile
    renderProfile(data) {
        if (this.elements.pFullName) this.elements.pFullName.innerText = data.fullName;
        if (this.elements.pRole) this.elements.pRole.innerText = data.roles.join(', ');
        if (this.elements.pPhone) this.elements.pPhone.innerText = data.phoneNumber || 'Chưa cập nhật';
        if (this.elements.pEmail) this.elements.pEmail.innerText = data.email || 'Chưa cập nhật';
        
        if (this.elements.pCreated) {
            this.elements.pCreated.innerText = new Date(data.createdAt).toLocaleDateString('vi-VN');
        }
        
        if (this.elements.pStatus) {
            this.elements.pStatus.innerHTML = data.isActive 
                ? '<span style="color: green;">● Đang hoạt động</span>' 
                : '<span style="color: red;">● Bị khóa</span>';
        }
    },

    renderMessage(message, isSuccess) {
        const display = this.elements.msgDisplay;
        if (display) {
            display.innerText = message;
            display.className = isSuccess ? 'msg-success' : 'msg-error';
        } else {
            if (!isSuccess) console.warn("Thông báo:", message);
        }
    },

    renderUserBookings: (container, appointments) => {
        if (!appointments || appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5" style="background: white; border-radius: 16px;">
                    <img src="https://cdn-icons-png.flaticon.com/512/2648/2648000.png" width="120" class="mb-3" style="opacity: 0.5">
                    <h5 class="text-muted">Bạn chưa có lịch hẹn nào</h5>
                    <p class="text-secondary">Hãy để chúng tôi chăm sóc xế yêu của bạn!</p>
                    <a href="/" class="btn btn-danger px-4" style="border-radius: 50px;">Đặt lịch ngay</a>
                </div>`;
            return;
        }

        const statusTexts = {
            1: { text: "Chờ xác nhận", class: "status-1" },
            2: { text: "Đã xác nhận", class: "status-2" },
            3: { text: "Đang sửa chữa", class: "status-3" },
            4: { text: "Quá hạn", class: "status-4" },
            5: { text: "Đã hủy", class: "status-5" },
            6: { text: "Hoàn thành", class: "status-6" },
        };

        container.innerHTML = appointments.map(apt => {
            const status = statusTexts[apt.status] || { text: "Không xác định", class: "bg-dark" };
            const date = new Date(apt.appointmentDateTime);
            const dayStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            const servicesHtml = apt.services.map(s => `<span class="service-tag"><i class="fa-solid fa-check-circle me-1" style="font-size: 10px;"></i>${s.serviceName}</span>`).join('');

            return `
                <div class="booking-card shadow-sm border-start-custom">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div class="d-flex align-items-center">
                            <div class="icon-box me-3" style="background: #fff1f1; color: var(--primary-red); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid fa-file-invoice fa-lg"></i>
                            </div>
                            <div>
                                <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 600;">MÃ LỊCH HẸN</span>
                                <h5 class="mb-0" style="font-weight: 800; letter-spacing: 0.5px;">#APT-${apt.appointmentId}</h5>
                            </div>
                        </div>
                        <span class="badge-status ${status.class}">${status.text}</span>
                    </div>

                    <div class="row g-4">
                        <div class="col-6 col-md-3">
                            <div class="info-group">
                                <span class="info-label"><i class="fa-regular fa-calendar-days"></i> Ngày hẹn</span>
                                <span class="info-value">${dayStr}</span>
                            </div>
                        </div>
                        <div class="col-6 col-md-3">
                            <div class="info-group">
                                <span class="info-label"><i class="fa-regular fa-clock"></i> Giờ hẹn</span>
                                <span class="info-value">${timeStr}</span>
                            </div>
                        </div>
                        <div class="col-12 col-md-6">
                            <div class="info-group">
                                <span class="info-label"><i class="fa-solid fa-car"></i> Phương tiện</span>
                                <span class="info-value text-truncate">${apt.customVehicleBrand || 'Xe'} - ${apt.customVehicleModel || 'Cá nhân'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="services-container">
                        <span class="info-label"><i class="fa-solid fa-gears"></i> Nội dung bảo dưỡng / sửa chữa</span>
                        <div class="d-flex flex-wrap">
                            ${servicesHtml}
                        </div>
                    </div>

                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mt-4">
                        <div style="max-width: 70%;">
                            ${apt.description ? `
                                <span class="info-label">Ghi chú của bạn</span>
                                <p class="mb-0 mt-1" style="font-size: 0.85rem; color: #64748b; font-style: italic; background: #f8fafc; padding: 10px; border-radius: 8px;">
                                    "${apt.description}"
                                </p>
                            ` : ''}
                        </div>
                        
                        <div class="mt-3 mt-md-0 d-flex gap-2">
                            ${apt.status === 1 ? `
                                <button class="btn-cancel-outline" onclick="handleCancelAppointment(${apt.appointmentId})">
                                    <i class="fa-solid fa-xmark me-1"></i> Hủy lịch
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    },

    renderMyVehicles: (container, vehicles) => {
        if (!vehicles || vehicles.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="3" style="padding: 20px; text-align: center; color: #999;">
                        Bạn chưa đăng ký xe nào trong hệ thống.
                    </td>
                </tr>`;
            return;
        }

        container.innerHTML = vehicles.map(v => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold; color: #d32f2f;">${v.licensePlate}</td>
                <td style="padding: 12px;">${v.brandName} | ${v.modelName}</td>
                <td style="padding: 12px;">${v.year || 'N/A'}</td>
            </tr>
        `).join('');
    },

    renderModelOptions(models) {
        if (this.elements.modelSelect) {
            this.elements.modelSelect.innerHTML = models.map(m => 
                `<option value="${m.modelId}">${m.modelName}</option>`
            ).join('');
        }
    },

    renderEstimateView: (container, estimate) => {
        // Kiểm tra xem đây có phải phiếu báo giá bổ sung hay không
        const isAdditionalEstimate = estimate.services.some(sv => sv.status === 5) || 
                                    estimate.spareParts.some(sp => sp.status === 5);

        container.innerHTML = `
            <div class="estimate-approval-card" style="border: 2px solid ${isAdditionalEstimate ? '#fd7e14' : '#e0e0e0'}; border-radius: 8px; padding: 15px; background: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0; color: ${isAdditionalEstimate ? '#fd7e14' : '#d32f2f'};">
                            ${isAdditionalEstimate ? '⚠️ BÁO GIÁ BỔ SUNG' : '📋 BÁO GIÁ CHI TIẾT'} #${estimate.repairEstimateId}
                        </h4>
                        ${isAdditionalEstimate ? '<small style="color: #fd7e14; font-weight: bold;">(Phát hiện lỗi mới trong quá trình sửa chữa)</small>' : ''}
                    </div>
                    <span style="font-size: 12px; color: #666;">Ngày tạo: ${new Date(estimate.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <p style="font-size: 14px; color: #555; margin-bottom: 10px;">Vui lòng tích chọn các hạng mục bạn đồng ý thực hiện:</p>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #f8f9fa; text-align: left;">
                            <th style="padding: 10px; border: 1px solid #eee; width: 40px; text-align: center;">Duyệt</th>
                            <th style="padding: 10px; border: 1px solid #eee;">Nội dung hạng mục</th>
                            <th style="padding: 10px; border: 1px solid #eee; text-align: right;">Đơn giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${estimate.services.map(sv => {
                            const isNew = sv.status === 5;
                            return `
                            <tr style="${isNew ? 'background: #fff9f4;' : ''}">
                                <td style="padding: 10px; border: 1px solid #eee; text-align: center;">
                                    <input type="checkbox" checked class="chk-service" data-id="${sv.serviceId}" data-price="${sv.totalAmount}">
                                </td>
                                <td style="padding: 10px; border: 1px solid #eee;">
                                    ${sv.serviceName} 
                                    ${isNew ? '<span style="background: #fd7e14; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 5px;">PHÁT SINH</span>' : ''}
                                </td>
                                <td style="padding: 10px; border: 1px solid #eee; text-align: right;">${sv.totalAmount.toLocaleString()}đ</td>
                            </tr>`;
                        }).join('')}

                        ${estimate.spareParts.map(sp => {
                            const isNew = sp.status === 5;
                            return `
                            <tr style="${isNew ? 'background: #fff9f4;' : ''}">
                                <td style="padding: 10px; border: 1px solid #eee; text-align: center;">
                                    <input type="checkbox" checked class="chk-sparepart" data-id="${sp.sparePartId}" data-price="${sp.totalAmount}">
                                </td>
                                <td style="padding: 10px; border: 1px solid #eee;">
                                    ${sp.sparePartName} (x${sp.quantity})
                                    ${isNew ? '<span style="background: #fd7e14; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 5px;">MỚI</span>' : ''}
                                </td>
                                <td style="padding: 10px; border: 1px solid #eee; text-align: right;">${sp.totalAmount.toLocaleString()}đ</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                
                <div style="background: #fdfdfd; border: 1px dashed #ddd; padding: 15px; border-radius: 4px; margin-bottom: 15px; text-align: right;">
                    <span style="color: #666;">Tổng chi phí duyệt thêm:</span>
                    <strong id="live-total" style="font-size: 22px; color: ${isAdditionalEstimate ? '#fd7e14' : '#d32f2f'}; margin-left: 10px;">
                        ${estimate.grandTotal.toLocaleString()}đ
                    </strong>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button id="btnConfirmEstimate" class="btn-submit" style="flex: 2; background: #28a745; border: none; padding: 14px; border-radius: 6px; color: white; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.3s;">
                        ${isAdditionalEstimate ? 'ĐỒNG Ý LÀM THÊM' : 'XÁC NHẬN SỬA CHỮA'}
                    </button>
                    <button id="btnRejectAll" style="flex: 1; background: #f8f9fa; border: 1px solid #ddd; padding: 14px; border-radius: 6px; color: #666; cursor: pointer; font-weight: bold;">
                        KHÔNG ĐỒNG Ý
                    </button>
                </div>
            </div>
        `;

        // --- LOGIC TÍNH TIỀN REALTIME (Giữ nguyên và cải tiến) ---
        const updateRealtimeTotal = () => {
            let total = 0;
            container.querySelectorAll('input[type="checkbox"]:checked').forEach(chk => {
                total += parseInt(chk.dataset.price);
            });
            const liveTotalEl = document.getElementById('live-total');
            if (liveTotalEl) liveTotalEl.innerText = total.toLocaleString() + 'đ';
        };

        container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            chk.onchange = updateRealtimeTotal;
        });

        const btnConfirm = container.querySelector('#btnConfirmEstimate');
        const btnReject = container.querySelector('#btnRejectAll');

        if (btnConfirm) {
            btnConfirm.onclick = async () => {
                const selectedSVs = Array.from(container.querySelectorAll('.chk-service:checked')).map(el => parseInt(el.dataset.id));
                const selectedSPs = Array.from(container.querySelectorAll('.chk-sparepart:checked')).map(el => parseInt(el.dataset.id));

                if (selectedSVs.length === 0 && selectedSPs.length === 0) {
                    if (!confirm("Bạn không chọn hạng mục nào. Tiếp tục?")) return;
                } else {
                    if (!confirm(isAdditionalEstimate ? "Xác nhận làm thêm?" : "Xác nhận sửa chữa?")) return;
                }

                const success = await handleCustomerApproval(estimate, selectedSPs, selectedSVs);
                if (success) location.reload();
            };
        }

        if (btnReject) {
            btnReject.onclick = async () => {
                if (confirm("Bạn chắc chắn muốn từ chối?")) {
                    const success = await handleCustomerApproval(estimate, [], []);
                    if (success) location.reload();
                }
            };
        }
    },

    // Thêm hàm này vào trong authUi
    renderCpwMessage(message, isSuccess) {
        const display = this.elements.cpwMsg; // Lấy từ id="cpw-msg" đã khai báo ở elements
        if (display) {
            display.innerText = message;
            // Thay đổi màu sắc dựa trên trạng thái thành công hay thất bại
            display.style.color = isSuccess ? 'green' : 'red';
            display.style.fontSize = '14px';
            display.style.marginTop = '10px';
            display.style.display = 'block';
        } else {
            // Fallback nếu không tìm thấy element trong DOM
            if (message) alert(message);
        }
    },
};

