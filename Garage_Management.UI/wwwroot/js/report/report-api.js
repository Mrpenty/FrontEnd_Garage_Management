import CONFIG from '../config.js';

const REPORT_URL = `${CONFIG.API_BASE_URL}/Reports`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
});

const toIsoStart = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
};

const toIsoEnd = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
};

export const ReceptionistReportAPI = {
    /**
     * GET /api/Reports/branches/{branchId}/receptionist?from=&to=
     * Trả về tổng hợp lịch hẹn theo trạng thái + walk-in/appt + JC user tạo
     */
    getReport: async (fromDate, toDate) => {
        const branchId = localStorage.getItem('branchId');
        if (!branchId) return { success: false, message: 'Thiếu branchId — vui lòng đăng nhập lại' };

        const params = new URLSearchParams();
        const fromIso = toIsoStart(fromDate);
        const toIso = toIsoEnd(toDate);
        if (fromIso) params.set('from', fromIso);
        if (toIso) params.set('to', toIso);

        try {
            const res = await fetch(`${REPORT_URL}/branches/${branchId}/receptionist?${params.toString()}`, {
                headers: getAuthHeader()
            });
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`HTTP ${res.status}: ${err}`);
            }
            return await res.json();
        } catch (e) {
            console.error('[ReceptionistReportAPI] error:', e);
            return { success: false, message: e.message };
        }
    }
};
