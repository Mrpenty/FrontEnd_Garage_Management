export const authGuard = {
    // Kiểm tra xem đã đăng nhập chưa
    checkLogin() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/Pages/Auth/Login.html';
        }
    },

    // Kiểm tra quyền truy cập cụ thể
    authorize(requiredRole) {
        this.checkLogin();
        const role = localStorage.getItem('userRole');
        
        if (role !== requiredRole) {
            alert("Bạn không có quyền truy cập vào trang này!");
            window.location.href = '/Pages/Auth/Login.html';
        }
    },

    // Đăng xuất
    logout() {
        localStorage.clear();
        window.location.href = '/Pages/Auth/Login.html';
    }
};