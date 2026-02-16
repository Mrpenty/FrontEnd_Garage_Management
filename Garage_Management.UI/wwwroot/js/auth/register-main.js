import { authApi } from './auth-api.js';
import { authUi } from './auth-ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('register-form');

    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            phoneNumber: document.getElementById('reg-phone').value.trim(),
            password: document.getElementById('reg-password').value,
            confirmPassword: document.getElementById('confirm-password').value
        };

        if (data.password !== data.confirmPassword) {
            authUi.renderMessage("Mật khẩu nhập lại không khớp!", false);
            return; 
        }

        // 1. Validate Password
        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;
        if (!pwdRegex.test(data.password)) {
            authUi.renderMessage("Mật khẩu không đạt yêu cầu (9 ký tự, 1 hoa, 1 số)", false);
            return;
        }

        authUi.renderMessage("Đang đăng ký...", true);

        try {
            const result = await authApi.register(data);

            if (result.success) {
                authUi.renderMessage("Đăng ký thành công! Đang chuyển sang xác thực OTP...", true);
                
                // BE trả về result.data.id cho Identity User
                const userId = result.data.id; 
                localStorage.setItem('pendingVerifyUserId', userId);
                localStorage.setItem('pendingVerifyPhone', data.phoneNumber);

                setTimeout(() => {
                    window.location.href = '/FrontEnd_Garage_Management/Garage_Management.UI/Pages/Auth/VerifyAccount.html';
                }, 2000);
            } else {
                authUi.renderMessage(result.message || "Đăng ký thất bại", false);
            }
        } catch (error) {
            console.error("Register Error:", error);
            authUi.renderMessage("Lỗi kết nối hệ thống", false);
        }
    });
});