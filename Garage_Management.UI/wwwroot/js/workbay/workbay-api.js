import CONFIG from '../config.js';

const JOBCARD_URL = `${CONFIG.API_BASE_URL}/Jobcards`;
const WORKBAY_URL = `${CONFIG.API_BASE_URL}/WorkBays`;

export const workbayApi = {
    // Lấy JobCards theo SupervisorId
    getJobsBySupervisor: async (supervisorId) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${JOBCARD_URL}/supervisor/${supervisorId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return await res.json();
    },

    // Lấy danh sách tất cả Workbays
    getAllWorkbays: async () => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${WORKBAY_URL}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return await response.json();
    },

    // Gán Job vào Workbay
    assignJobToWorkbay: async (jobId, wbId) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${JOBCARD_URL}/assign-workbay`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jobCardId: parseInt(jobId),
                workBayId: parseInt(wbId)
            })
        });
        const resultText = await response.text();

        if (!response.ok) {
            // Ném lỗi kèm theo nội dung từ BadRequest("...")
            throw new Error(resultText || "Gán Workbay thất bại");
        }

        return resultText;
    },

    //Xem hàng chờ của WorkBay đó
    getJobCardsByWorkBay: async (wbId) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${WORKBAY_URL}/${wbId}` , {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) throw new Error("Không thể lấy hàng đợi của khoang này");
        return await response.json();
    },

    // Thêm vào trong object workbayApi
    getJobCardDetail: async (jobCardId) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${JOBCARD_URL}/${jobCardId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return await res.json();
    },

    // Lấy báo cáo kiểm tra
    getRepairEstimate: async (jobcardId) => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates/job-cards/${jobcardId}` , {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return await res.json();
    },

    // Lấy danh sách nhân viên là Mechanic
    getMechanics: async () => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${CONFIG.API_BASE_URL}/Employee/mechanics` , {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        return await res.json();
    },

    // Giao việc cho thợ
    assignMechanic: async (jobCardId, mechanicId, note = "") => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/assign-mechanic`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                mechanicId: parseInt(mechanicId), 
                note: note 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Không thể giao việc cho thợ này");
        }
        
        // Nếu API trả về text hoặc empty, dùng .text(), nếu trả về JSON thì .json()
        return await response.text(); 
    },

    // Patch trạng thái của bảng JobCard
    updateJobCardStatus: async (jobCardId, status) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/status`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status})
        });
        return response.ok;
    },

    reorderQueue: async (data) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${JOBCARD_URL}/reorder-workbay-queue`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Lỗi khi cập nhật thứ tự hàng đợi");
        return await response.json();
    },

    startInspection: async (jobCardId, mechanicId) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${CONFIG.API_BASE_URL}/JobCardMechanics/startInspection`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobCardId: jobCardId, mechanicId: mechanicId })
        });
        return await response.json();
    }
};
