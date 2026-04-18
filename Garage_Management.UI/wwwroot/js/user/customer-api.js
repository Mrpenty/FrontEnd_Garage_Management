import CONFIG from '../config.js';

const CUSTOMER_URL = `${CONFIG.API_BASE_URL}/Customer`;
const VEHICLE_URL = `${CONFIG.API_BASE_URL}/Vehiclies`;
const MODEL_URL = `${CONFIG.API_BASE_URL}/VehicleModels`;
const BRAND_URL = `${CONFIG.API_BASE_URL}/VehicleBrands`;

export const CustomerAPI = {
    // Lấy danh sách khách hàng phân trang
    getAll: async (query) => {
        const params = new URLSearchParams({
            Filter: 'Customer',
            Search: query.Search || '',
            Page: query.Page || 1,
            PageSize: query.PageSize || 10
        });
        const res = await fetch(`${CUSTOMER_URL}?${params}`);
        return await res.json();
    },

    // Lấy danh sách hãng (Brands)
    getBrands: async () => {
        // Lấy pageSize lớn để lấy hết hãng xe
        const res = await fetch(`${BRAND_URL}?page=1&pageSize=50`, 
        { 
             headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
        });
        return await res.json();
    },

    // Lấy danh sách dòng xe (Models)
    getModels: async () => {
        // Lấy pageSize lớn để có đủ data lọc theo Brand ở FE
        const res = await fetch(`${MODEL_URL}?page=1&pageSize=200`, 
        {  
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
        });
        return await res.json();
    },

    // Lấy chi tiết lịch sử bảo dưỡng của 1 khách
    getDetails: async (id) => {
        const res = await fetch(`${CUSTOMER_URL}/${id}`);
        return await res.json();
    },

    createByReceptionist: async (customerData) => {
        const response = await fetch(`${CUSTOMER_URL}/CreateByReceptionist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(customerData)
        });

        let data;

        try {
            data = await response.json();
        } catch {
            return { success: false, message: "Server trả về không hợp lệ" };
        }

        return data;
    },

    // Tạo xe mới
    create: async (data) => {
        const response = await fetch(`${VEHICLE_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    },
};