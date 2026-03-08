import { authApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js';

authUi.elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    authUi.renderMessage("Đang xác thực nhân viên...", true);

    const request = {
        email: document.getElementById('Email').value,
        password: document.getElementById('password').value
    };

    const result = await authApi.staffLogin(request);

    if (result.success) {
        const userData = result.data;
        const role = userData.role;

        authUi.renderMessage("Đăng nhập thành công! Đang chuyển hướng...", true);

        const tokenPayload = parseJwt(userData.accessToken);
        const employeeId = tokenPayload.EmployeeId;

        // 1. Lưu thông tin đăng nhập
        localStorage.setItem('accessToken', userData.accessToken);
        localStorage.setItem('refreshToken', userData.refreshToken);
        localStorage.setItem('userRole', role);
        localStorage.setItem('employeeId', employeeId);
        localStorage.setItem('userInfo', JSON.stringify({
            userId: userData.userId,
            fullName: userData.fullName,
            email: userData.email,
        }));

        // 2. Điều hướng dựa trên Role
        let targetPage = "";

        switch (role) {
            case 'Receptionist':
                targetPage = CONFIG.PAGES.DASHBOARD_RECEPTIONIST;
                break;
            case 'Supervisor':
                targetPage = CONFIG.PAGES.DASHBOARD_SUPERVISOR;
                break;
            case 'Mechanic':
                targetPage = CONFIG.PAGES.DASHBOARD_MECHANIC;
                break;
            case 'Stocker':
                targetPage = CONFIG.PAGES.DASHBOARD_STOCKER;
                break;
            case 'Admin':
                targetPage = CONFIG.PAGES.DASHBOARD_ADMIN;
                break;
            default:
                // Nếu role không xác định, đẩy về Homepage hoặc báo lỗi
                authUi.renderMessage("Vai trò không hợp lệ trong hệ thống nội bộ.", false);
                return;
        }

        setTimeout(() => {
            window.location.href = targetPage;
        }, 1000);

    } else {
        authUi.renderMessage(result.message || "Thông tin không chính xác", false);
        
        // Nếu là lỗi phân quyền hoặc lỗi nghiêm trọng, đẩy lại về trang Login Staff
        if (result.message && result.message.includes("không có quyền")) {
            setTimeout(() => {
                window.location.href = CONFIG.PAGES.STAFF_LOGIN;
            }, 2000);
        }
    }
});

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}