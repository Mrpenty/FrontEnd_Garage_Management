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
};