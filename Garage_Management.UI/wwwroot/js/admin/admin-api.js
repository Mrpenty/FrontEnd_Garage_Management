import CONFIG from '../config.js';

const USER_URL = `${CONFIG.API_BASE_URL}/User`;
const BRANCH_URL = `${CONFIG.API_BASE_URL}/Branches`;
const REPORT_URL = `${CONFIG.API_BASE_URL}/reports`;

export const adminApi = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },
    // User APIs
    getUsers: (page = 1, pageSize = 10) => 
        fetch(`${USER_URL}/ListUser?page=${page}&pageSize=${pageSize}`, {
            headers: adminApi.getAuthHeader()
        }).then(res => res.json()),

    toggleUserStatus: (userId, isActive) =>
        fetch(`${USER_URL}/ChangeStatus`, {
            method: 'POST',
            headers: adminApi.getAuthHeader(),
            body: JSON.stringify({ userId, isActive })
        }).then(res => res.json()),

    // Branch APIs
    getBranches: () => fetch(`${BRANCH_URL}`, {
        headers: adminApi.getAuthHeader()
    }).then(res => res.json()),

    updateBranchStatus: (branchId, isActive) =>
        fetch(`${BRANCH_URL}/${branchId}`, {
            method: 'PATCH',
            headers: adminApi.getAuthHeader(),
            body: JSON.stringify({ isActive })
        }).then(res => res.json()),

    // Report APIs
    getRevenueReport: () => fetch(`${REPORT_URL}/revenue-by-branch`, {
        headers: adminApi.getAuthHeader()
    }).then(res => res.json())
};