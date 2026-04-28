// ⬇️ Đổi sang true khi deploy. URL Azure đặt ở AZURE_API_URL bên dưới.
const IS_PRODUCTION = true;

// ⬇️ THAY URL AZURE THẬT VÀO ĐÂY (KHÔNG có dấu '/' cuối, có '/api' cuối).
// Ví dụ: 'https://garage-mgms.azurewebsites.net/api'
const AZURE_API_URL = 'https://msmg-api-fpt-e8bwcse7cjh9bdh7.southeastasia-01.azurewebsites.net/api';

const BASE_PATH = '../..';

const CONFIG = {
    API_BASE_URL: IS_PRODUCTION
        ? AZURE_API_URL
        : 'https://msmg-api-fpt-e8bwcse7cjh9bdh7.southeastasia-01.azurewebsites.net/api', //URL local
    
    // Quản lý tập trung các đường dẫn trang
    PAGES: {
        LOGIN: `${BASE_PATH}/Pages/Auth/Login.html`,
        STAFF_LOGIN: `${BASE_PATH}/Pages/Auth/StaffLogin.html`,
        REGISTER: `${BASE_PATH}/Pages/Auth/Register.html`,
        DASHBOARD_RECEPTIONIST: `${BASE_PATH}/Pages/Dashboard/ReceptionistDashboard.html`,
        DASHBOARD_SUPERVISOR: `${BASE_PATH}/Pages/Dashboard/SupervisorDashboard.html`, 
        DASHBOARD_MECHANIC: `${BASE_PATH}/Pages/Dashboard/MechanicDashboard.html`, 
        DASHBOARD_STOCKER: `${BASE_PATH}/Pages/Dashboard/StockerDashboard.html`, 
        DASHBOARD_ADMIN: `${BASE_PATH}/Pages/Dashboard/AdminDashboard.html`, 
        DASHBOARD_ACCOUNTANT: `${BASE_PATH}/Pages/Dashboard/AccountantDashboard.html`,
        HOMEPAGE: `${BASE_PATH}/Pages/Dashboard/Index.html`,
        MYAPPOINTMENT: `${BASE_PATH}/Pages/Member/UserBookings.html`
    },

    TIMEOUT: 5000,
    VERSION: 'v1.0.0'
};

export default CONFIG;
