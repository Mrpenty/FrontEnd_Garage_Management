import CONFIG from '../config.js';

const VEHICLE_URL = `${CONFIG.API_BASE_URL}/Vehiclies`;
const BRAND_URL = `${CONFIG.API_BASE_URL}/VehicleBrands`
const MODEL_URL = `${CONFIG.API_BASE_URL}/VehicleModels`
const APOINTMENT_URL = `${CONFIG.API_BASE_URL}/Appointment`;
const JOBCARD_URL = `${CONFIG.API_BASE_URL}/JobCards`;
const SERVICE_URL = `${CONFIG.API_BASE_URL}/Services`;
const CUSTOMER_URL = `${CONFIG.API_BASE_URL}/Customer`;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});

export const jobcardApi = {
    getAll: async (params = {}) => {
        // params có thể chứa: SearchTerm, Status, SortBy, PageIndex, PageSize...
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${JOBCARD_URL}?${queryString}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            console.error(`Lỗi HTTP ${response.status} khi lấy danh sách JobCard.`);
            return { success: false, items: [] };
        }

        return await response.json();
    },
}

export const serviceApi = {

}

export const vehicleApi = {
    // Tạo xe mới
    create: async (data) => {
        const response = await fetch(`${VEHICLE_URL}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    },
    // Lấy lại danh sách xe của khách
    getByCustomer: async (customerId) => {
        const response = await fetch(`${VEHICLE_URL}/by-customer/${customerId}`, {
            headers: getHeaders()
        });
        return await response.json();
    },
    
    //API lấy brands và Modals
    // Lấy danh sách hãng (Brands)
    getBrands: async () => {
        // Lấy pageSize lớn để lấy hết hãng xe
        const res = await fetch(`${BRAND_URL}?page=1&pageSize=50`, { headers: getHeaders() });
        return await res.json();
    },

    // Lấy danh sách dòng xe (Models)
    getModels: async () => {
        // Lấy pageSize lớn để có đủ data lọc theo Brand ở FE
        const res = await fetch(`${MODEL_URL}?page=1&pageSize=200`, { headers: getHeaders() });
        return await res.json();
    }
};

export const customerApi = {
    // Tìm kiếm khách hàng (dùng chung ParamQuery)
    search: async (keyword) => {
        const response = await fetch(`${CUSTOMER_URL}?Search=${encodeURIComponent(keyword)}&PageSize=10`, {
            headers: getHeaders()
        });
        return await response.json();
    },
    
    // Lễ tân tạo khách hàng
    createByReceptionist: async (customerData) => {
        const response = await fetch(`${CUSTOMER_URL}/CreateByReceptionist`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(customerData)
        });
        if (!response.ok) {
        // Đọc response dưới dạng text để tránh lỗi sập JSON
        const errorText = await response.text();
        console.error(`Lỗi HTTP ${response.status}:`, errorText);
        
        // Tùy chỉnh thông báo dựa trên mã lỗi
        if (response.status === 401) {
            return { success: false, message: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." };
        }
        if (response.status === 403) {
            return { success: false, message: "Bạn không có quyền Lễ tân (Receptionist) để thực hiện thao tác này." };
        }
        
        // Nếu API trả về BadRequest nhưng có chứa JSON ApiResponse
        try {
            const errorJson = JSON.parse(errorText);
            return errorJson; // Trả về JSON lỗi của Backend
        } catch {
            return { success: false, message: `Lỗi Server: ${response.status}. Chi tiết: ${errorText}` };
        }
        }

    // Nếu mã 2xx OK thì parse JSON bình thường
    return await response.json();
    }
};