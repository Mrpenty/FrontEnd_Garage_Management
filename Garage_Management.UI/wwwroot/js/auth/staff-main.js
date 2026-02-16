import { authApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js'

authUi.elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    authUi.renderMessage("Đang xác thực nhân viên...", true);

    const request = {
        email: document.getElementById('Email').value,
        password: document.getElementById('password').value
    };

    const result = await authApi.staffLogin(request);

    if (result.success) {
        authUi.renderMessage("Đăng nhập thành công! Đang chuyển hướng...", true);

        // Lưu trạng thái tạm thời
        localStorage.setItem('userRole', '...'); 

        setTimeout(() => {
            window.location.href = CONFIG.PAGES.DASHBOARD_STAFF;
        }, 1000);
    } else {
        // Trường hợp success: false (bao gồm cả lỗi: "Tài khoản không có quyền truy cập khu vực nhân viên")
        authUi.renderMessage(result.message || "Thông tin không chính xác", false);
        
        // Nếu là lỗi phân quyền, có thể đẩy về Homepage sau 2s
        if (result.message.includes("không có quyền")) {
            setTimeout(() => {
                window.location.href = CONFIG.PAGES.STAFF_LOGIN;
            }, 2000);
        }
    }
});