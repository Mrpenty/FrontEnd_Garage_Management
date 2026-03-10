import CONFIG from '../config.js';

const JOBCARD_URL = `${CONFIG.API_BASE_URL}/Jobcards`;
const WORKBAY_URL = `${CONFIG.API_BASE_URL}/WorkBays`;

export const workbayApi = {
    // Lấy JobCards theo SupervisorId
    getJobsBySupervisor: async (supervisorId) => {
        const response = await fetch(`${JOBCARD_URL}/supervisor/${supervisorId}`);
        return await response.json();
    },

    // Lấy trạng thái tất cả Workbays
    getAllWorkbays: async () => {
        const response = await fetch(`${WORKBAY_URL}`);
        return await response.json();
    },

    // Gán Job vào Workbay
    assignJobToWorkbay: async (jobId, workbayId) => {
        const response = await fetch(`${JOBCARD_URL}/assign-workbay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workbayId })
        });
        return await response.json();
    }
};
