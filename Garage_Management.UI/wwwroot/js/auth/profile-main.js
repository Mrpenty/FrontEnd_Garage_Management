import { authApi, customerApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra nếu đang ở trang Profile
    const btnViewBookings = document.getElementById('btn-view-bookings');
    if (btnViewBookings) {
        btnViewBookings.onclick = () => {
            window.location.href = 'UserBookings.html';
        };
        loadUserProfile(); // Hàm hiển thị thông tin cá nhân
        setupProfileEvents();
    }

    // 2. Kiểm tra nếu đang ở trang Danh sách lịch hẹn
    const bookingsContainer = document.getElementById('user-bookings-list');
    if (bookingsContainer || path.includes('UserBookings.html')) {
        // Gọi hàm tải dữ liệu ngay khi trang load
        loadCustomerAppointments(bookingsContainer);
    }
});

// Hàm chính để tải lịch hẹn
async function loadCustomerAppointments(container) {
    try {
        const res = await customerApi.getMyAppointments(1, 20);
        if (res.success) {
            const appointments = res.data.pageData;
            authUi.renderUserBookings(container, appointments);
        } else {
            container.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
        }
    } catch (error) {
        console.error("Lỗi tải lịch hẹn:", error);
        container.innerHTML = `<div class="alert alert-danger">Không thể kết nối máy chủ.</div>`;
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
            const storageData = localStorage.getItem('userInfo'); 
            const userInfo = storageData ? JSON.parse(storageData) : null;
            if (userInfo && userInfo.customerId) {
                // Chuyển hướng sang trang lịch hẹn
                window.location.href = CONFIG.PAGES.MYAPPOINTMENT;
            } else {
                alert("Không tìm thấy mã khách hàng. Vui lòng đăng nhập lại.");
                console.error("Data in localStorage:", userInfo);
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