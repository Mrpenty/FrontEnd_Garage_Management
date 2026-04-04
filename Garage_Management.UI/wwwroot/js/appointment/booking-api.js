import CONFIG from '../config.js';

const VEHICLE_URL = `${CONFIG.API_BASE_URL}/Vehiclies`;
const BRAND_URL = `${CONFIG.API_BASE_URL}/VehicleBrands`;
const MODEL_URL = `${CONFIG.API_BASE_URL}/VehicleModels`;
const SERVICE_URL = `${CONFIG.API_BASE_URL}/Services`;
const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;
const APPOINTMENT_URL = `${CONFIG.API_BASE_URL}/Appointments`;
const CUSTOMER_URL = `${CONFIG.API_BASE_URL}/Customer`;

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
    // Tạo xe mới
    create: async (data) => {
        const response = await fetch(`${VEHICLE_URL}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    },
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

    // Lấy danh sách xe của tài khoản đang đăng nhập
    getUserVehicles: async () => {
        try {
            const response = await fetch(`${VEHICLE_URL}/Customer/MyVehicle?page=1&pageSize=10`, {
                headers: getHeaders() 
            });
            return await response.json();
        } catch (error) {
            console.error("Error fetching user vehicles:", error);
            return { success: false, message: error.message };
        }
    },

    // Lấy danh sách dịch vụ
    getServices: async () => {
        const res = await fetch(`${SERVICE_URL}`, { 
            headers: getHeaders() 
        });
        if (!res.ok) throw new Error("Không thể tải danh sách dịch vụ");
        return await res.json();
    },

    // Lấy danh sách phụ tùng theo hãng xe
    getInventory: async () => {
        const res = await fetch(`${INVENTORY_URL}`, { 
            headers: getHeaders() 
        });
        if (!res.ok) throw new Error("Không thể tải danh sách phụ tùng");
        return await res.json();
    },

    // Tạo lịch hẹn mới
    async createAppointment(requestBody) {
        const res = await fetch(`${APPOINTMENT_URL}`, {
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
        const url = `${APPOINTMENT_URL}?Search=${searchValue}&Page=1&PageSize=20`;        
        const res = await fetch(url, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' } // Không cần Auth nếu cho phép Guest tra cứu
        });
        if (!res.ok) throw new Error("Lỗi khi tra cứu lịch hẹn");
        return await res.json();
    }
};

export const AppointmentAPI = {
    // Lấy danh sách phân trang & lọc (Dùng cho trang chủ quản lý)
    getPaged: async (queryParams = {}) => {
        const queryString = new URLSearchParams(queryParams).toString();
        const res = await fetch(`${APPOINTMENT_URL}?${queryString}`, { headers: getHeaders() });
        return await res.json();
    },

    getById: async (id) => {
        const res = await fetch(`${APPOINTMENT_URL}/${id}`, { headers: getHeaders() });
        return await res.json();
    },

    update: async (id, data) => {
        const res = await fetch(`${APPOINTMENT_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    //Duyêt lịch hoặc Khách không đến
    updateStatus: async (id, status) => {
        const res = await fetch(`${APPOINTMENT_URL}/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: status })
        });

        if (!res.ok) {
            throw new Error(`Lỗi cập nhật: ${res.statusText}`);
        }
        
        // Trả về toàn bộ object JSON, bao gồm cả { success: true, data: {...} }
        return await res.json();
    },

    //Lấy danh sách khách hàng
    getCustomer: async () => {
        const res = await fetch(`${CUSTOMER_URL}?Filter=Customer` , {
            method: 'GET',
            headers: getHeaders()
        });
        return await res.json();
    },

    //Lấy danh sách xe của khách hàng
    getVehiclesByCustomer: async (query, page = 1, pageSize = 10) => {
        // Sử dụng URLSearchParams để encode query tránh lỗi ký tự đặc biệt
        const params = new URLSearchParams({
            Search: query,
            page: page,
            pageSize: pageSize
        });
        
        const response = await fetch(`${VEHICLE_URL}?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) return { success: false, message: "Lỗi tải danh sách xe" };
        return await response.json();
    },
};

export const customerApi = {
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
}
