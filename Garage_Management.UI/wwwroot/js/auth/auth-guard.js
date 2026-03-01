import CONFIG from '../config.js';

export const authGuard = {
    checkLogin() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = CONFIG.PAGES.LOGIN;
            return false;
        }
        return true;
    },

    authorize(requiredRole) {
        if (!this.checkLogin()) return;

        const role = localStorage.getItem('userRole');
        
        // Chấp nhận requiredRole là 1 chuỗi hoặc 1 mảng các chuỗi
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        if (!roles.includes(role)) {
            alert("Bạn không có quyền truy cập vào trang này!");
            // Nếu là Staff đăng nhập nhầm trang Customer thì về STAFF_LOGIN, ngược lại về LOGIN
            window.location.href = role ? CONFIG.PAGES.STAFF_LOGIN : CONFIG.PAGES.LOGIN;
        }
    },

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userRole');
        window.location.href = CONFIG.PAGES.HOMEPAGE;
    }
};