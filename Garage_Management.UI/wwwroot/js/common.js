document.addEventListener("DOMContentLoaded", function() {
    // Load Header
    fetch('/FrontEnd_Garage_Management/Garage_Management.UI/Pages/Components/Header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            // Sau khi load xong header mới bắt đầu check login
            checkLoginStatus();
        });
});


//Để tạm chưa chính xác, đợi session của Đồng sửa lại rồi update
//Đây là hàm để phân quyền hiện login hay profile
function checkLoginStatus() {
    const token = localStorage.getItem('accessToken');

    if (token) {
        // Đã đăng nhập
        guestZone.style.display = 'none';
        userZone.style.display = 'flex';
        
        // Lấy tên từ userInfo đã lưu lúc login
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        nameDisplay.innerText = userInfo.fullName || "Người dùng";

        // Xử lý nút đăng xuất
        document.getElementById('btn-logout-header').addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    } else {
        // Chưa đăng nhập
        guestZone.style.display = 'flex';
        userZone.style.display = 'none';
    }
}