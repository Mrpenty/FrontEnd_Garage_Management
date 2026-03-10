import CONFIG from '../config.js';

const AUTH_URL = `${CONFIG.API_BASE_URL}/Auth`;
const USER_URL = `${CONFIG.API_BASE_URL}/User`;
const APPOINTMENT_URL = `${CONFIG.API_BASE_URL}/Appointments`;

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
    },

    //API Đổi mật khẩu
    async changePassword(changePasswordRequest) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${AUTH_URL}/reset-password`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(changePasswordRequest)
        });
        return await response.json();
    },
};

export const customerApi = {
    //API Xem Profile
    async getProfile(){
        const token = localStorage.getItem('accessToken');
        
        try {
            const response = await fetch(`${USER_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                // Token hết hạn hoặc không hợp lệ
                return { success: false, message: "Unauthorized" };
            }

            return await response.json();
        } catch (error) {
            console.error("Profile API Error:", error);
            return { success: false, message: "Lỗi kết nối server" };
        }
    },

    //API xem xe cá nhân

    //API xem Appointment cá nhân
    getMyAppointments: async (page = 1, pageSize = 10) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${APPOINTMENT_URL}/Customer/MyAppointment?page=${page}&pageSize=${pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    }
}