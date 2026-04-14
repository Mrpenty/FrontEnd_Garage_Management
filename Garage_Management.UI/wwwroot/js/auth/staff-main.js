import { authApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js';

authUi.elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Lấy phần tử nút bấm để vô hiệu hóa
    const btnSubmit = document.getElementById('btn-login');
    
    // 2. Sử dụng .trim() để loại bỏ khoảng trắng thừa
    const emailValue = document.getElementById('Email').value.trim();
    const passwordValue = document.getElementById('password').value;

    const request = {
        email: emailValue,
        password: passwordValue
    };

    btnSubmit.disabled = true;
    authUi.renderMessage("Đang xác thực nhân viên...", true);

    try {
        const result = await authApi.staffLogin(request);

        if (result.success) {
            const userData = result.data;
            const role = userData.role;

            authUi.renderMessage("Đăng nhập thành công! Đang chuyển hướng...", true);

            // 4. Bọc parseJwt trong try-catch để an toàn
            let employeeId = null;
            try {
                const tokenPayload = parseJwt(userData.accessToken);
                employeeId = tokenPayload.EmployeeId;
            } catch (jwtError) {
                console.error("Lỗi giải mã Token:", jwtError);
                authUi.renderMessage("Lỗi hệ thống: Mã xác thực không hợp lệ.", false);
                btnSubmit.disabled = false;
                return;
            }

            // Lưu thông tin vào localStorage
            localStorage.setItem('accessToken', userData.accessToken);
            localStorage.setItem('refreshToken', userData.refreshToken);
            localStorage.setItem('userRole', role);
            localStorage.setItem('employeeId', employeeId);
            localStorage.setItem('userInfo', JSON.stringify({
                userId: userData.userId,
                fullName: userData.fullName,
                email: userData.email,
            }));

            // Điều hướng dựa trên Role
            let targetPage = "";
            switch (role) {
                case 'Receptionist': targetPage = CONFIG.PAGES.DASHBOARD_RECEPTIONIST; break;
                case 'Supervisor': targetPage = CONFIG.PAGES.DASHBOARD_SUPERVISOR; break;
                case 'Mechanic': targetPage = CONFIG.PAGES.DASHBOARD_MECHANIC; break;
                case 'Stocker': targetPage = CONFIG.PAGES.DASHBOARD_STOCKER; break;
                case 'Admin': targetPage = CONFIG.PAGES.DASHBOARD_ADMIN; break;
                default:
                    authUi.renderMessage("Vai trò không hợp lệ.", false);
                    btnSubmit.disabled = false;
                    return;
            }

            setTimeout(() => { window.location.href = targetPage; }, 1000);

        } else {
            authUi.renderMessage(result.message || "Thông tin không chính xác", false);
            btnSubmit.disabled = false; // Kích hoạt lại nút nếu lỗi
        }
    } catch (err) {
        authUi.renderMessage("Lỗi kết nối máy chủ.", false);
        btnSubmit.disabled = false;
    }
});

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        throw new Error("Token không đúng định dạng");
    }
}