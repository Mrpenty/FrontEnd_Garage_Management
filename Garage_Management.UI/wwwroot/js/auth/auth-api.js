import CONFIG from '../config.js';

const AUTH_URL = `${CONFIG.API_BASE_URL}/Auth`;
const USER_URL = `${CONFIG.API_BASE_URL}/User`;
const APPOINTMENT_URL = `${CONFIG.API_BASE_URL}/Appointments`;
const VEHICLE_URL = `${CONFIG.API_BASE_URL}/Vehiclies`;
const MODEL_URL = `${CONFIG.API_BASE_URL}/VehicleModels`;
const JOBCARD_URL = `${CONFIG.API_BASE_URL}/JobCards`;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});


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
                headers: getHeaders()
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
    async getMyVehicles(page = 1, pageSize = 10) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${VEHICLE_URL}/Customer/MyVehicle?page=${page}&pageSize=${pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    },


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
    },

    updateAppointmentStatus: async (id, status) => {
         const token = localStorage.getItem('accessToken');
        const response = await fetch(`${APPOINTMENT_URL}/${id}/status`, {
            method: 'PATCH',
            headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            body: JSON.stringify({ status: status })
        });
        if (!response.ok) throw new Error("Không thể cập nhật trạng thái lịch hẹn");
        return await response.json();
    },

    // Lấy danh sách Model xe để chọn
    async getVehicleModels(page = 1, pageSize = 50) {
        const response = await fetch(`${MODEL_URL}?page=${page}&pageSize=${pageSize}`);
        return await response.json();
    },

    // API thêm xe mới
    async addVehicle(vehicleData) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${VEHICLE_URL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vehicleData)
        });
        return await response.json();
    }
}

export const EstimateAPI = {
    // Lấy báo giá theo JobCardId
    getByJobCard: async (jcId) => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates/job-cards/${jcId}`, { headers: getHeaders() });
        return await res.json();
    },

    // 1. Cập nhật status cho từng Phụ tùng trong báo giá
    updateSparePartStatus: async (estId, spId, status) => {
        const token = localStorage.getItem('accessToken');
        return await fetch(`${CONFIG.API_BASE_URL}/RepairEstimateSpareParts/${estId}/${spId}/status`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status})
        });
    },

    // 2. Cập nhật status cho từng Dịch vụ trong báo giá
    updateServiceStatus: async (estId, svId, status) => {
        const token = localStorage.getItem('accessToken');
        return await fetch(`${CONFIG.API_BASE_URL}/RepairEstimateServices/${estId}/${svId}/status`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status: status})
        });
    },

    // 3. Cập nhật status của bản ghi RepairEstimate (Bảng tổng)
    updateEstimateStatus: async (estId, status) => {
        const token = localStorage.getItem('accessToken');
        return await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates/${estId}/status`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status: status})
        });
    },

    // 4. Đồng bộ phụ tùng sang JobCard thực tế
    syncSpareParts: async (jcId, data) => {
        const token = localStorage.getItem('accessToken');
        return await fetch(`${CONFIG.API_BASE_URL}/JobCardSparepart/${jcId}/spare-parts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data) // Gửi trực tiếp mảng Object
        });
    },

    // Thêm hàm POST cho Dịch vụ
    syncJobCardServiceSingle: async (payload) => {
        const token = localStorage.getItem('accessToken');
        return await fetch(`${CONFIG.API_BASE_URL}/JobCardServices`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload) 
        });
    },

    // 5. Cập nhật status JobCard (7: Đã duyệt, 10: Hủy)
    updateJobCardStatus: async (jcId, status) => {
        const token = localStorage.getItem('accessToken');
        return await fetch(`${CONFIG.API_BASE_URL}/JobCards/${jcId}/status`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status: status})
        });
    },

    //Lấy danh dách JobCard của khách hàng
    getMyJobCard: async (customerId) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${JOBCARD_URL}/customer/${customerId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    },

    // Cập nhật status cho JobCardService thực tế
    updateJobCardServiceStatus: async (jcId, serviceId, status) => {
        const token = localStorage.getItem('accessToken');
        return await fetch(`${CONFIG.API_BASE_URL}/JobCardServices/service/${serviceId}/status?jobCardId=${jcId}`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status: status }) // Truyền status vào body
        });
    },

    viewProgress: async (jobCardId) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/progress-viewdetail`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    }
};