import CONFIG from '../config.js';

const REPORT_URL = `${CONFIG.API_BASE_URL}/reports`;
const branchId = localStorage.getItem('branchId');

const formatToISO = (dateStr, isEndOfDay = false) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isEndOfDay) {
        date.setHours(23, 59, 59, 999);
    } else {
        date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
};

export const RevenueStatisticsAPI = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },

    getRevenueStatistics: async (startDate, endDate) => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('from', formatToISO(startDate)); 
            if (endDate) params.append('to', formatToISO(endDate, true)); 

            // Đã sửa thành /branches/ (số nhiều)
            const response = await fetch(`${REPORT_URL}/branches/${branchId}/revenue?${params}`, {
                headers: RevenueStatisticsAPI.getAuthHeader()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Lỗi hệ thống (${response.status}): ${errorText}`);
            }

            const text = await response.text();
            if (!text) throw new Error("Server không trả về dữ liệu");
            
            const result = JSON.parse(text);
            
            if (result.success && result.data) {
                // Vì API đã tính toán sẵn, chúng ta chỉ cần format lại cho UI dễ dùng
                return {
                    success: true,
                    data: RevenueStatisticsAPI.processData(result.data)
                };
            }
            return result;
        } catch (error) {
            console.error('Error fetching revenue statistics:', error);
            return { success: false, message: error.message };
        }
    },

    // Hàm này thay thế cho calculateStatistics cũ
    processData: (apiData) => {
        return {
            totalRevenue: apiData.grandTotal || 0,
            serviceTotal: apiData.serviceTotal || 0,
            sparePartTotal: apiData.sparePartTotal || 0,
            totalInvoices: apiData.invoiceCount || 0,
            branchName: apiData.branchName || 'Chi nhánh',
            // Tạo mảng để hiển thị trong Table (vì UI của bạn dùng Table)
            rawList: [apiData] 
        };
    }
};