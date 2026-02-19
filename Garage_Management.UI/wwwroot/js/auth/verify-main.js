import { authApi } from './auth-api.js';
import { authUi } from './auth-ui.js';

const verifyForm = document.getElementById('verify-form');
const btnResend = document.getElementById('resend-otp-verify');
let countdownTimer; // Khai báo biến toàn cục ở đây

const userId = localStorage.getItem('pendingVerifyUserId');
const phone = localStorage.getItem('pendingVerifyPhone');

if (!userId) {
    window.location.href = 'Register.html';
}

function startResendCountdown(seconds) {
    clearInterval(countdownTimer); // Xóa timer cũ nếu có
    let counter = seconds;
    btnResend.disabled = true;
    btnResend.style.opacity = "0.5";

    countdownTimer = setInterval(() => {
        btnResend.innerHTML = `<i class="fa-solid fa-clock"></i> Gửi lại mã sau (${counter}s)`;
        counter--;

        if (counter < 0) {
            clearInterval(countdownTimer);
            btnResend.disabled = false;
            btnResend.style.opacity = "1";
            btnResend.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Gửi lại mã`;
        }
    }, 1000);
}

verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otp-code').value.trim();
    authUi.renderMessage("Đang kiểm tra mã...", true);

    const result = await authApi.verifyAccount(userId, otp);
    if (result.success) {
        authUi.renderMessage("Xác thực thành công!", true);
        localStorage.removeItem('pendingVerifyUserId');
        localStorage.removeItem('pendingVerifyPhone');
        setTimeout(() => window.location.href = 'Login.html', 2000);
    } else {
        authUi.renderMessage(result.message || "Mã OTP không hợp lệ", false);
    }
});

btnResend.addEventListener('click', async () => {
    authUi.renderMessage("Đang gửi lại mã mới...", true);
    const result = await authApi.resendRegisterOtp(phone);
    if (result.success) {
        authUi.renderMessage("Đã gửi mã mới!", true);
        startResendCountdown(60); 
    } else {
        authUi.renderMessage(result.message, false);
    }
});

// Chạy countdown ngay khi trang vừa load
startResendCountdown(30);