import CONFIG from '../config.js';

const API_BASE = `${CONFIG.API_BASE_URL}/Services`;

export const ServicePriceAPI = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },

    getServices: async (page = 1, pageSize = 50) => {
        try {
            // Thêm query params để lấy danh sách đầy đủ hơn
            const response = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`, {
                headers: ServicePriceAPI.getAuthHeader()
            });
            if (!response.ok) throw new Error("Lấy dữ liệu thất bại");
            return await response.json();
        } catch (error) {
            console.error('Error fetching services:', error);
            return { success: false, message: 'Lỗi kết nối' };
        }
    },

    // Giữ nguyên hàm này hoặc điều chỉnh theo yêu cầu PATCH của Backend
    addOrUpdateServicePrice: async (serviceId, basePrice) => {
        try {
            const response = await fetch(`${API_BASE}/${serviceId}/price`, {
                method: 'PATCH',
                headers: ServicePriceAPI.getAuthHeader(),
                body: JSON.stringify({ basePrice: basePrice }) 
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Lỗi kết nối' };
        }
    },
};