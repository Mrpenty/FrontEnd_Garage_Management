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
                <div class="text-center py-5">
                    <i class="fa-regular fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p>Bạn chưa có lịch hẹn nào.</p>
                    <a href="/" class="btn btn-danger">Đặt lịch ngay</a>
                </div>`;
            return;
        }

        const statusTexts = {
            1: { text: "Chờ xác nhận", class: "bg-warning" },
            2: { text: "Đã xác nhận", class: "bg-success" },
            3: { text: "Đang xử lý", class: "bg-info" },
            4: { text: "Đã hủy", class: "bg-secondary" }
        };

        container.innerHTML = appointments.map(apt => {
            const status = statusTexts[apt.status] || { text: "Không xác định", class: "bg-dark" };
            const date = new Date(apt.appointmentDateTime).toLocaleString('vi-VN');
            const services = apt.services.map(s => s.serviceName).join(', ');

            return `
                <div class="booking-card mb-3 p-3 shadow-sm border-start border-4 border-danger" style="background:white; border-radius:8px;">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1 text-danger">Mã lịch hẹn: #APT-${apt.appointmentId}</h5>
                            <p class="mb-1"><strong><i class="fa-regular fa-clock"></i> Thời gian:</strong> ${date}</p>
                            <p class="mb-1"><strong><i class="fa-solid fa-wrench"></i> Dịch vụ:</strong> ${services}</p>
                            <p class="mb-0 text-muted"><em><i class="fa-solid fa-comment"></i> Ghi chú: ${apt.description || 'Không có'}</em></p>
                        </div>
                        <span class="badge ${status.class}" style="padding: 8px 12px; border-radius: 20px;">${status.text}</span>
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
    }
};

