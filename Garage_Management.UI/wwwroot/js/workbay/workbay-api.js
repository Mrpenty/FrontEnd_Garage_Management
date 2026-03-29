import CONFIG from '../config.js';

const JOBCARD_URL = `${CONFIG.API_BASE_URL}/Jobcards`;
const WORKBAY_URL = `${CONFIG.API_BASE_URL}/WorkBays`;

export const workbayApi = {
    // Lấy JobCards theo SupervisorId
    getJobsBySupervisor: async (supervisorId) => {
        const response = await fetch(`${JOBCARD_URL}/supervisor/${supervisorId}`);
        return await response.json();
    },

    // Lấy danh sách tất cả Workbays
    getAllWorkbays: async () => {
        const response = await fetch(`${WORKBAY_URL}`);
        return await response.json();
    },

    // Gán Job vào Workbay
    assignJobToWorkbay: async (jobId, wbId) => {
        const response = await fetch(`${JOBCARD_URL}/assign-workbay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const response = await fetch(`${WORKBAY_URL}/${wbId}`);
        if (!response.ok) throw new Error("Không thể lấy hàng đợi của khoang này");
        return await response.json();
    },

    // Thêm vào trong object workbayApi
    getJobCardDetail: async (jobCardId) => {
        const res = await fetch(`${JOBCARD_URL}/${jobCardId}`);
        return await res.json();
    },

    // Lấy báo cáo kiểm tra
    getRepairEstimate: async (jobcardId) => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/RepairEstimates/job-cards/${jobcardId}`);
        return await res.json();
    },

    // Lấy danh sách nhân viên là Mechanic
    getMechanics: async () => {
        const res = await fetch(`${CONFIG.API_BASE_URL}/Employee/mechanics`);
        return await res.json();
    },

    // Giao việc cho thợ
    assignMechanic: async (jobCardId, mechanicId, note = "") => {
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/assign-mechanic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status})
        });
        return response.ok;
    },
};
