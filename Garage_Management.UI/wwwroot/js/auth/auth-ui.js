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
            cpwMsg: document.getElementById('cpw-msg')
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
}
};