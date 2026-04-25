import CONFIG from '../config.js';

const VEHICLE_URL = `${CONFIG.API_BASE_URL}/Vehiclies`;
const BRAND_URL = `${CONFIG.API_BASE_URL}/VehicleBrands`
const MODEL_URL = `${CONFIG.API_BASE_URL}/VehicleModels`
const APPOINTMENT_URL = `${CONFIG.API_BASE_URL}/Appointments`;
const JOBCARD_URL = `${CONFIG.API_BASE_URL}/JobCards`;
const SERVICE_URL = `${CONFIG.API_BASE_URL}/Services`;
const CUSTOMER_URL = `${CONFIG.API_BASE_URL}/Customer`;
const USER_URL = `${CONFIG.API_BASE_URL}/User`;
const PAYMENT_URL = `${CONFIG.API_BASE_URL}/Payment`;
const INVOICE_URL = `${CONFIG.API_BASE_URL}/Invoices`;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});

export const jobcardApi = {
    getAll: async (params = {}) => {
        // params có thể chứa: SearchTerm, Status, SortBy, PageIndex, PageSize...
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${JOBCARD_URL}/active?${queryString}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            console.error(`Lỗi HTTP ${response.status} khi lấy danh sách JobCard.`);
            return [];
        }

        return await response.json();
    },

    getById: async (id) => {
        const response = await fetch(`${JOBCARD_URL}/${id}`, {
            headers: getHeaders()
        });
        if (!response.ok) return { success: false };
        const data = await response.json();
        return { success: true, data: data };
    },

    // Lấy danh sách Supervisor
    getSupervisors: async () => {
        // Bạn có thể thêm param lọc theo Role nếu BE hỗ trợ, ví dụ: ?Role=Supervisor
        const response = await fetch(`${USER_URL}/ListUser?Filter=Supervisor&PageSize=100`, {
            headers: getHeaders()
        });
        if (!response.ok) return { success: false, data: [] };
        return await response.json();
    },

    // Tạo JobCard mới
    create: async (payload) => {
        const response = await fetch(`${JOBCARD_URL}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: errorData.message || "Lỗi Server" };
        }

        return await response.json();
    },

    // Thêm dịch vụ vào JobCard đã tồn tại
    addService: async (jobCardId, serviceDto) => {
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/services`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(serviceDto)
        });
        // Vì BE trả về NoContent (204) nên không cần .json() nếu thành công
        return response.ok; 
    },

    update: async (jobCardId, payload) => {
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, message: errorData.message || "Lỗi Server" };
        }
        return { success: true };
    }
}

export const serviceApi = {
    getServices: async () => {
        const res = await fetch(`${SERVICE_URL}?pageSize=1000`, { 
            headers: getHeaders() 
        });
        if (!res.ok) throw new Error("Không thể tải danh sách dịch vụ");
        return await res.json();
    },
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
    // Lấy danh sách xe bằng cách Search (SĐT)
    getBySearch: async (query, page = 1, pageSize = 10) => {
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

export const appointmentApi = {
        getAll: async (params) => {
        const query = new URLSearchParams(params).toString();
        const url = `${APPOINTMENT_URL}?${query}`;
        const res = await fetch(url, { 
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        return await res.json();
    },

    update: async (id, data) => {
        const response = await fetch(`${APPOINTMENT_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return response.ok;
    },

    updateStatus: async (id, status) => {
        const response = await fetch(`${APPOINTMENT_URL}/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: status })
        });
        if (!response.ok) throw new Error("Không thể cập nhật trạng thái lịch hẹn");
        return await response.json();
    }
}

export const EstimateAPI = {
    getByJobCard: async (jcId) => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates/job-cards/${jcId}`, { headers: { 'Content-Type': 'application/json' } });
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
        return await fetch(`${JOBCARD_URL}/${jcId}/status`, {
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

    getEstimateByJobCardId: async (jobCardId) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates/job-cards/${jobCardId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
    },
}

export const PaymentAPI = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },

    getInvoices: async () => {
            const response = await fetch(`${INVOICE_URL}`, {
                headers: PaymentAPI.getAuthHeader()
            }); 
            return await response.json();
        },

    getBankTransferQr: async (invoiceId) => {
        const response = await fetch(`${PAYMENT_URL}/bank-transfer/${invoiceId}`, {
            headers: PaymentAPI.getAuthHeader()
        });
        return await response.json();
    },

    confirmCashPayment: async (invoiceId) => {
        const response = await fetch(`${PAYMENT_URL}/cash-payment?invoiceId=${invoiceId}`, {
            method: 'POST',
            headers: PaymentAPI.getAuthHeader(),
        });
        return await response.json();
    },
};