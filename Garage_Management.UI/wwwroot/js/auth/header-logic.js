document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUI();
});

export function updateHeaderUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const authUser = document.getElementById('auth-user');
    const userDisplayName = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('btn-logout-header');

    const userInfoStr = localStorage.getItem('userInfo');
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken && userInfoStr) {
        // 1. Đã đăng nhập
        const userInfo = JSON.parse(userInfoStr);
        
        if (authButtons) authButtons.style.display = 'none';
        if (authUser) authUser.style.display = 'flex';
        if (userDisplayName) userDisplayName.innerText = `Xin chào, ${userInfo.fullName || 'Khách'}!`;
    } else {
        // 2. Chưa đăng nhập
        if (authButtons) authButtons.style.display = 'flex';
        if (authUser) authUser.style.display = 'none';
    }

    // Xử lý đăng xuất
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear(); // Xóa sạch token và info
            window.location.href = '/FrontEnd_Garage_Management/Garage_Management.UI/Pages/Dashboard/Homepage.html';
        });
    }
}