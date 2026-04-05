import CONFIG from '../config.js';

const JOBCARD_URL = `${CONFIG.API_BASE_URL}/JobCards`;
const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;

export const jobCardApi = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },

    // Lấy danh sách JobCard theo Employee (Cơ thợ máy)
    getJobsForMechanic: async (page = 1, pageSize = 20) => {
        const queryString = `?page=${page}&pageSize=${pageSize}`;
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/JobCardMechanics/ForMechanic${queryString}`, {
            headers: jobCardApi.getAuthHeader()
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
            headers: jobCardApi.getAuthHeader()
        });
        const result = await response.json();
        return result.data.pageData; // Lấy danh sách linh kiện
    },

    submitRepairEstimate: async (estimateData) => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates`, {
            method: 'POST',
            headers: jobCardApi.getAuthHeader(),
            body: JSON.stringify(estimateData)
        });
        return response.ok;
    },

    // Patch trạng thái của bảng JobCard
    updateJobCardStatus: async (jobCardId, status) => {
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/status`, {
            method: 'PATCH',
            headers: jobCardApi.getAuthHeader(),
            body: JSON.stringify({ status: status})
        });
        return response.ok;
    },

    // Patch trạng thái của bảng JobCardMechanic (Phân công)
    updateMechanicStatus: async (jobCardId, status) => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/JobCardMechanics/${jobCardId}/mechanic/status`, {
            method: 'PATCH',
            headers: jobCardApi.getAuthHeader(),
            body: JSON.stringify( {newStatus: status})
        });
        return response.ok;
    }
};