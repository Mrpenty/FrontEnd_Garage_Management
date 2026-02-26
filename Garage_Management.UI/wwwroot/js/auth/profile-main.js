import { authApi, customerApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Log để kiểm tra xem file có chạy vào đây không
    console.log("Profile page loaded, fetching data...");
    await loadUserProfile();
});

//Hàm xử lý load Profile
async function loadUserProfile() {
    const result = await customerApi.getProfile();

    if (result.success) {
        authUi.renderProfile(result.data);
    } else {
        if (result.message === "Unauthorized") {
            alert("Phiên đăng nhập hết hạn!");
            localStorage.clear();
            window.location.href = CONFIG.PAGES.LOGIN;
        } else {
            console.error(result.message);
            authUi.renderMessage("Không thể tải thông tin hồ sơ", false);
        }
    }
}

// 1. Mở Modal
if (authUi.elements.btnOpenChangePw) {
    authUi.elements.btnOpenChangePw.addEventListener('click', (e) => {
        e.preventDefault();
        authUi.elements.modalChangePw.style.display = 'block';
    });
}

// 2. Đóng Modal
if (authUi.elements.btnCloseModal) {
    authUi.elements.btnCloseModal.addEventListener('click', () => {
        authUi.elements.modalChangePw.style.display = 'none';
        authUi.elements.formChangePw.reset();
        authUi.renderCpwMessage("", true);
    });
}

// 3. Xử lý Đổi mật khẩu
if (authUi.elements.formChangePw) {
    authUi.elements.formChangePw.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Kiểm tra khớp mật khẩu ở Client trước
        if (newPassword !== confirmPassword) {
            authUi.renderCpwMessage("Xác nhận mật khẩu không khớp!", false);
            return;
        }

        const request = {
            oldPassword: oldPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
        };

        const result = await authApi.changePassword(request);

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