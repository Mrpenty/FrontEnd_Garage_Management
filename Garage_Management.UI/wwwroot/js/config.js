const IS_PRODUCTION = false;  // Chuyển thành true khi deploy 

const BASE_PATH = '../..';

const CONFIG = {
    API_BASE_URL: IS_PRODUCTION 
        ? 'https://api.your-garage-system.com/api' //Thay thành URL khi deploy
        : 'https://localhost:7004/api', //URL local
    
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
        HOMEPAGE: `${BASE_PATH}/Pages/Dashboard/Index.html`,
        MYAPPOINTMENT: `${BASE_PATH}/Pages/Member/UserBookings.html`
    },

    TIMEOUT: 5000,
    VERSION: 'v1.0.0'
};

export default CONFIG;