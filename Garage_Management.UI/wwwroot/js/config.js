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
        DASHBOARD_CUSTOMER: `${BASE_PATH}/Pages/Dashboard/CustomerDashboard.html`,
        DASHBOARD_STAFF: `${BASE_PATH}/Pages/DashboardStaff.html`, //Trang này sau này sẽ tách theo từng role
        HOMEPAGE: `${BASE_PATH}/Pages/Dashboard/Homepage.html`
    },

    TIMEOUT: 5000,
    VERSION: 'v1.0.0'
};

export default CONFIG;