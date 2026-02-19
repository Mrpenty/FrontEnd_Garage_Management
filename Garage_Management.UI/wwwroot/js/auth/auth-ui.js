export const authUi = {
    get elements() {
        return {
            form: document.getElementById('login-form'),
            passwordField: document.getElementById('password-field'),
            otpField: document.getElementById('otp-field'),
            msgDisplay: document.getElementById('msg-display'),
            btnSendOtp: document.getElementById('send-otp-btn'),
            tabs: document.querySelectorAll('.tab-btn'),
            phoneInput: document.getElementById('phone')
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

    renderMessage(message, isSuccess) {
        this.elements.msgDisplay.innerText = message;
        this.elements.msgDisplay.className = isSuccess ? 'msg-success' : 'msg-error';
    }
};