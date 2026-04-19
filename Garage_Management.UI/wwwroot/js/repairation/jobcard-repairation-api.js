import CONFIG from '../config.js';

const JOBCARD_URL = `${CONFIG.API_BASE_URL}/JobCards`;
const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;

export const repairApi = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },

    // Lấy danh sách JobCard theo Employee (Cơ thợ máy)
    getJobsForMechanic: async (page = 1, pageSize = 20) => {
        const queryString = `?page=${page}&pageSize=${pageSize}`;
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/JobCardMechanics/ForMechanic${queryString}`, {
            headers: repairApi.getAuthHeader()
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Chi tiết lỗi từ BE:", errorData);
            throw new Error(errorData.message || "Không thể kết nối API");
        }

        const result = await response.json();
        return result.data.pageData; 
    },

    getInventories: async () => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Inventories?pageSize=1000`, {
            headers: repairApi.getAuthHeader()
        });
        const result = await response.json();
        return result.data.pageData; // Lấy danh sách linh kiện
    },

    submitRepairEstimate: async (estimateData) => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates`, {
            method: 'POST',
            headers: repairApi.getAuthHeader(),
            body: JSON.stringify(estimateData)
        });
        return response.ok;
    },

    // Patch trạng thái của bảng JobCard
    updateJobCardStatus: async (jobCardId, status) => {
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/status`, {
            method: 'PATCH',
            headers: repairApi.getAuthHeader(),
            body: JSON.stringify({ status: status})
        });
        return response.ok;
    },

    // Patch trạng thái của bảng JobCardMechanic (Phân công).
    // mechanicId: tùy chọn — truyền khi caller không phải là chính mechanic đó (vd supervisor
    // finalize hộ). BE có thể dùng field này để tra đúng record thay vì dựa vào JWT.
    updateMechanicStatus: async (jobCardId, status, mechanicId = null) => {
        const body = mechanicId != null
            ? { status: status, mechanicId: parseInt(mechanicId) }
            : { status: status };
        const response = await fetch(`${CONFIG.API_BASE_URL}/JobCardMechanics/${jobCardId}/mechanic/status`, {
            method: 'PATCH',
            headers: repairApi.getAuthHeader(),
            body: JSON.stringify(body)
        });
        const bodyText = await response.text().catch(() => '');
        console.log(`[updateMechanicStatus] jobCardId=${jobCardId} mechanicId=${mechanicId ?? '(token)'} status=${status} httpStatus=${response.status} ok=${response.ok}`, bodyText);
        return response.ok;
    },

    updateProgress: async (id, data) => {
        const res = await fetch(`${JOBCARD_URL}/${id}/progress-update`, {
            method: 'PATCH',
            headers: repairApi.getAuthHeader(),
            body: JSON.stringify(data)
        });
        return res.ok;
    },

    // PATCH Status cho từng Service
    updateJobCardServiceStatus: async (jobCardId, serviceId, status) => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/JobCardServices/service/${serviceId}/status?jobCardId=${jobCardId}`, {
            method: 'PATCH',
            headers: repairApi.getAuthHeader(),
            body: JSON.stringify({ status: status })
        });
        return response.ok;
    },

    // Lấy danh sách dịch vụ để thợ chọn trong popup
    getServices: async () => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Services?pageSize=1000`, {
            headers: repairApi.getAuthHeader()
        });
        const result = await response.json();
        return result.data.pageData;
    },

    //Lấy chi tiết JobCard để biết danh sách ServiceId
    getJobCardDetails: async (id) => {
        const response = await fetch(`${JOBCARD_URL}/${id}`, {
            headers: repairApi.getAuthHeader()
        });
        if (!response.ok) return null;
        return await response.json(); // BE trả về object JobCard kèm List Services
    },

    releaseWorkbay: async (id) => {
        const response = await fetch(`${JOBCARD_URL}/release-workbay`, {
            method: 'POST',
            headers: repairApi.getAuthHeader(),
            body: JSON.stringify({ workBayId: parseInt(id) })
        });
        const bodyText = await response.text().catch(() => '');
        console.log(`[releaseWorkbay] workBayId=${id} status=${response.status} ok=${response.ok}`, bodyText);
        return response.ok;
    },

    createInvoice: async (invoiceRequest) => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Invoices`, {
            method: 'POST',
            headers: repairApi.getAuthHeader(),
            body: JSON.stringify(invoiceRequest)
        });
        return response.ok;
    }

};