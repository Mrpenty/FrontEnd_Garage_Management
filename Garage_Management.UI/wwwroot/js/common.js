import { authGuard } from "./auth/auth-guard.js";

document.addEventListener("DOMContentLoaded", function() {
    // Load Header
    fetch('../../Pages/Components/Header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            // Sau khi load xong header mới bắt đầu check login
            checkLoginStatus();
        })
        .catch(err => console.error("Lỗi khi load header:", err));
});

function checkLoginStatus() {
    const token = localStorage.getItem('accessToken');
    
    // LẤY CÁC PHẦN TỬ TỪ DOM (Quan trọng: Phải lấy sau khi fetch header xong)
    const guestZone = document.querySelector('.auth-buttons');
    const userZone = document.getElementById('auth-user');
    const nameDisplay = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('btn-logout-header');

    if (token) {
        // Đã đăng nhập
        if (guestZone) guestZone.style.display = 'none';
        if (userZone) userZone.style.display = 'flex';
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (nameDisplay) {
            nameDisplay.innerText = `Xin chào, ${userInfo.fullName || "Người dùng"}!`;
        }

        // Xử lý nút đăng xuất
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }
    } else {
        // Chưa đăng nhập
        if (guestZone) guestZone.style.display = 'flex';
        if (userZone) userZone.style.display = 'none';
    }
}

function logoutUser() {
    authGuard.logout();
}