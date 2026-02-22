import { authApi } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js';

let useOtp = false;

// Xử lý khi nhấn vào các Tab (Mật khẩu / OTP)
authUi.elements.tabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Lấy mode từ attribute data-mode="otp" hoặc data-mode="password"
        useOtp = e.target.dataset.mode === 'otp';
        
        // Gọi UI để chuyển đổi hiển thị
        authUi.toggleMode(useOtp);
    });
});

// Xử lý nút Đăng nhập
authUi.elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const request = {
        phoneNumber: document.getElementById('phone').value,
        password: useOtp ? null : document.getElementById('password').value,
        otp: useOtp ? document.getElementById('otp').value : null,
        useOtp: useOtp
    };

    const result = await authApi.login(request);
    
    if (result.success) {
        const userData = result.data; 
        if (userData.role === 'Customer') {
            authUi.renderMessage("Đăng nhập thành công! Đang chuyển hướng...", true);

            // Lưu toàn bộ thông tin User và Token   
            localStorage.setItem('accessToken', userData.accessToken);
            localStorage.setItem('refreshToken', userData.refreshToken);
            localStorage.setItem('userRole', userData.role);
            localStorage.setItem('userInfo', JSON.stringify({
                userId: userData.userId,
                fullName: userData.fullName,
                email: userData.email
            }));

            // Chuyển hướng đến Dashboard của Customer
            setTimeout(() => {
                window.location.href = CONFIG.PAGES.HOMEPAGE;
            }, 1000);
        }
        else{
            authUi.renderMessage("Tài khoản nhân viên không đăng nhập tại đây", false);
            setTimeout(() => {
                window.location.href = CONFIG.PAGES.HOMEPAGE;
            }, 2000);
        }
    } else {
        authUi.renderMessage(result.message || "Đăng nhập thất bại", false);
    }
});

// Lắng nghe sự kiện nút Gửi mã OTP
authUi.elements.btnSendOtp.addEventListener('click', async () => {
    const phone = document.getElementById('phone').value;

    if (!phone) {
        authUi.renderMessage("Vui lòng nhập số điện thoại trước khi lấy mã OTP.", false);
        return;
    }

    // Vô hiệu hóa nút để tránh spam
    authUi.elements.btnSendOtp.disabled = true;
    authUi.renderMessage("Đang gửi yêu cầu...", true);

    const result = await authApi.sendOtp(phone);

    if (result.success) {
        authUi.renderMessage(result.message, true); // "Đã gửi mã OTP thành công"
        
        // Bắt đầu đếm ngược 60 giây
        startOtpCountdown(60);
    } else {
        authUi.renderMessage(result.message, false);
        authUi.elements.btnSendOtp.disabled = false;
    }
});

// Hàm xử lý đếm ngược
function startOtpCountdown(seconds) {
    let timeLeft = seconds;
    const originalText = "Gửi Mã OTP";
    
    const timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            authUi.elements.btnSendOtp.innerText = originalText;
            authUi.elements.btnSendOtp.disabled = false;
        } else {
            authUi.elements.btnSendOtp.innerText = `Gửi lại (${timeLeft}s)`;
            timeLeft--;
        }
    }, 1000);
}

// Sự kiện cho link Đăng ký
const registerLink = document.querySelector('.link-item.highlight');
if (registerLink) {
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = CONFIG.PAGES.REGISTER;
    });
}

// Thêm sự kiện cho link quên mật khẩu
const forgotLink = document.querySelector('.link-item[href="#"]'); // Giả định link Quên MK
if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value;
        
        if (!phone) {
            authUi.renderMessage("Vui lòng nhập Số điện thoại để lấy lại mật khẩu", false);
            return;
        }

        const result = await authApi.forgotPassword(phone);
        authUi.renderMessage(result.message, result.success);
    });
}

