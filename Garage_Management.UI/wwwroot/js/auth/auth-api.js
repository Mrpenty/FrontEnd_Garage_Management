import CONFIG from '../config.js';

const AUTH_URL = `${CONFIG.API_BASE_URL}/Auth`;

export const authApi = {
    //API gửi thông tin đăng nhập
    async login(loginRequest) {
        const response = await fetch(`${AUTH_URL}/customer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginRequest)
        });
        return await response.json();
    },

    // API dành riêng cho nhân viên (Mới cập nhật)
    async staffLogin(staffRequest) {
        const response = await fetch(`${AUTH_URL}/staff/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: staffRequest.email, // Backend dùng StaffLoginRequest { Email, Password }
                password: staffRequest.password
            })
        });
        return await response.json();
    },

    // API Gửi mã OTP 
    async sendOtp(phoneOrEmail) {
        const response = await fetch(`${AUTH_URL}/send-otp-Forlogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneOrEmail: phoneOrEmail }) // Map đúng tên thuộc tính Backend
        });
        return await response.json();
    },

    //API đăng ký
    async register(registerData) {
        const response = await fetch(`${AUTH_URL}/customer/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        return await response.json();
    },

    //API xác thực OTP và kích hoạt tài khoản khách hàng (sau khi đăng ký hoặc khi số điện thoại chưa verify)
    async verifyAccount(userId, otp) {
        const response = await fetch(`${AUTH_URL}/customer/verifyPhonenumber`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: parseInt(userId), 
                otp: otp 
            })
        });
        return await response.json();
    },

    // API gửi lại mã OTP cho khách hàng (dùng khi không nhận được hoặc OTP hết hạn)
    async resendRegisterOtp(phone) {
        const response = await fetch(`${AUTH_URL}/customer/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone })
        });
        return await response.json();
    },

    //API quên mật khẩu
    async forgotPassword(phone) {
        const response = await fetch(`${AUTH_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        return await response.json();
    }
};