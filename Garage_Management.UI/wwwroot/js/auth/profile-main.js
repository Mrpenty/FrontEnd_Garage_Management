import { authApi, customerApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import { searchUI } from '../appointment/search-ui.js'; // Import UI lịch hẹn
import CONFIG from '../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra xem đang ở trang Profile hay trang Danh sách lịch hẹn
    const isBookingPage = document.getElementById('user-bookings-list') !== null;

    if (isBookingPage) {
        // --- LOGIC TRANG DANH SÁCH LỊCH HẸN ---
        await loadUserBookings();
    } else {
        // --- LOGIC TRANG PROFILE ---
        console.log("Profile page loaded, fetching data...");
        await loadUserProfile();
        setupProfileEvents();
    }
});

// Hàm tải lịch hẹn (Dành cho trang UserBookings.html)
async function loadUserBookings() {
    const container = document.getElementById('user-bookings-list');
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('cid');

    if (!customerId) {
        container.innerHTML = `<div class="alert alert-warning">Không tìm thấy mã khách hàng.</div>`;
        return;
    }

    try {
        const response = await customerApi.getAppointmentsByCustomer(customerId);
        // Map đúng cấu trúc dữ liệu Backend (PageData)
        const bookings = response.data?.pageData || response.data || [];
        
        // Render bằng UI đã làm ở trang Search
        searchUI.renderAppointmentList(bookings, container);
    } catch (error) {
        console.error("Load Bookings Error:", error);
        container.innerHTML = `<div class="alert alert-danger">Lỗi khi tải danh sách lịch hẹn.</div>`;
    }
}

// Hàm tải thông tin cá nhân (Dành cho trang Profile.html)
async function loadUserProfile() {
    const result = await customerApi.getProfile();
    if (result.success) {
        authUi.renderProfile(result.data);
    } else if (result.message === "Unauthorized") {
        alert("Phiên đăng nhập hết hạn!");
        localStorage.clear();
        window.location.href = CONFIG.PAGES.LOGIN;
    } else {
        authUi.renderMessage("Không thể tải thông tin hồ sơ", false);
    }
}

// Thiết lập các sự kiện nút bấm trên trang Profile
function setupProfileEvents() {
    // 1. Nút Xem lịch đặt xe
    const btnViewBookings = document.getElementById('btn-view-bookings');
    if (btnViewBookings) {
        btnViewBookings.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('user')); 
            if (user && user.customerId) {
                window.location.href = `../Appointment/UserBookings.html?cid=${user.customerId}`;
            } else {
                alert("Không tìm thấy mã khách hàng trong hệ thống.");
            }
        });
    }

    // 2. Các sự kiện Modal Đổi mật khẩu
    if (authUi.elements.btnOpenChangePw) {
        authUi.elements.btnOpenChangePw.addEventListener('click', (e) => {
            e.preventDefault();
            authUi.elements.modalChangePw.style.display = 'block';
        });
    }

    if (authUi.elements.btnCloseModal) {
        authUi.elements.btnCloseModal.addEventListener('click', () => {
            authUi.elements.modalChangePw.style.display = 'none';
            authUi.elements.formChangePw.reset();
            authUi.renderCpwMessage("", true);
        });
    }

    if (authUi.elements.formChangePw) {
        authUi.elements.formChangePw.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                authUi.renderCpwMessage("Xác nhận mật khẩu không khớp!", false);
                return;
            }

            const result = await authApi.changePassword({ oldPassword, newPassword, confirmPassword });
            if (result.success) {
                authUi.renderCpwMessage("Đổi mật khẩu thành công!", true);
                setTimeout(() => {
                    authUi.elements.modalChangePw.style.display = 'none';
                    authUi.elements.formChangePw.reset();
                }, 2000);
            } else {
                authUi.renderCpwMessage(result.message || "Đổi mật khẩu thất bại", false);
            }
        });
    }
}