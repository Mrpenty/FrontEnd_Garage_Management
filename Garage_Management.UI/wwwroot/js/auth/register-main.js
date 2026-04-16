import { authApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js';

document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('register-form');
    const btnRegister = document.getElementById('btn-register');

    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            phoneNumber: document.getElementById('reg-phone').value.trim(),
            password: document.getElementById('reg-password').value,
        };

        // --- VALIDATION PHÍA CLIENT ---

        // 1. Kiểm tra Họ và Tên (Không chứa số, tối thiểu 2 ký tự)
        const nameRegex = /^[A-Za-zÀ-ỹ\s]{2,}$/; 
        if (!nameRegex.test(data.firstName) || !nameRegex.test(data.lastName)) {
            authUi.renderMessage("Họ tên không hợp lệ (tối thiểu 2 ký tự, không chứa số)", false);
            return;
        }

        // 2. Kiểm tra Số điện thoại (Đúng định dạng VN: 10 số, bắt đầu bằng 0)
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(data.phoneNumber)) {
            authUi.renderMessage("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0", false);
            return;
        }

        // 3. Kiểm tra Mật khẩu nhập lại
        if (data.password !== document.getElementById('confirm-password').value) {
            authUi.renderMessage("Mật khẩu nhập lại không khớp!", false);
            return; 
        }

        // 4. Kiểm tra Độ mạnh mật khẩu
        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;
        if (!pwdRegex.test(data.password)) {
            authUi.renderMessage("Mật khẩu không đạt yêu cầu (9 ký tự, 1 hoa, 1 số)", false);
            return;
        }

        // --- BẮT ĐẦU GỬI API ---

        // Vô hiệu hóa nút để tránh double-click
        btnRegister.disabled = true;
        authUi.renderMessage("Đang đăng ký...", true);

        try {
            const result = await authApi.register(data);

            if (result.success) {
                authUi.renderMessage("Đăng ký thành công! Đang chuyển hướng...", true);
                
                // Lưu ID tạm thời để xác thực (nếu cần)
                // const userId = result.data.id; 
                // localStorage.setItem('pendingVerifyUserId', userId);
                // localStorage.setItem('pendingVerifyPhone', data.phoneNumber);

                setTimeout(() => {
                    window.location.href = CONFIG.PAGES.LOGIN;
                }, 2000);
            } else {
                authUi.renderMessage(result.message || "Đăng ký thất bại", false);
                btnRegister.disabled = false; // Mở lại nút nếu thất bại
            }
        } catch (error) {
            console.error("Register Error:", error);
            authUi.renderMessage("Lỗi kết nối hệ thống", false);
            btnRegister.disabled = false;
        }
    });
});