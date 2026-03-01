import CONFIG from '../config.js';

const VEHICLE_URL = `${CONFIG.API_BASE_URL}/Vehiclies`;
const BRAND_URL = `${CONFIG.API_BASE_URL}/VehicleBrands`;
const MODEL_URL = `${CONFIG.API_BASE_URL}/VehicleModels`;
const SERVICE_URL = `${CONFIG.API_BASE_URL}/Services`;
const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('accessToken');
    
    // Chỉ thêm Authorization nếu có token thực sự
    if (token && token !== "null" && token !== "undefined") {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

export const BookingAPI = {
    // Lấy danh sách hãng xe
    getBrands: async () => {
        // Lấy pageSize lớn để lấy hết hãng xe
        const res = await fetch(`${BRAND_URL}?page=1&pageSize=50`, { headers: getHeaders() });
        return await res.json();
    },

    // Lấy danh sách loại xe (Model)
    getModels: async () => {
        // Lấy pageSize lớn để có đủ data lọc theo Brand ở FE
        const res = await fetch(`${MODEL_URL}?page=1&pageSize=200`, { headers: getHeaders() });
        return await res.json();
    },

    // Lấy danh sách dịch vụ
    getServices: async () => {
        const res = await fetch(`${SERVICE_URL}?page=1&pageSize=10`, { 
            headers: getHeaders() 
        });
        if (!res.ok) throw new Error("Không thể tải danh sách dịch vụ");
        return await res.json();
    },

    // Lấy danh sách phụ tùng theo hãng xe
    getInventoryByBrand: async (brandId) => {
        const res = await fetch(`${INVENTORY_URL}/by-brand/${brandId}`, { 
            headers: getHeaders() 
        });
        if (!res.ok) throw new Error("Không thể tải danh sách phụ tùng");
        return await res.json();
    },

    // Tạo lịch hẹn mới
    async createAppointment(requestBody) {
        const res = await fetch(`${CONFIG.API_BASE_URL}/Appointments`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(requestBody)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Lỗi khi tạo lịch hẹn");
        return result;
    },

    // Tìm kiếm lịch hẹn theo số điện thoại
    searchAppointments: async (searchValue) => {
        // Query tham số: Phone để lọc, PageSize lớn để lấy hết nếu 1 SĐT có nhiều lịch
        const url = `${CONFIG.API_BASE_URL}/Appointments?Search=${searchValue}&Page=1&PageSize=20`;        const res = await fetch(url, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' } // Không cần Auth nếu cho phép Guest tra cứu
        });
        if (!res.ok) throw new Error("Lỗi khi tra cứu lịch hẹn");
        return await res.json();
    }
};