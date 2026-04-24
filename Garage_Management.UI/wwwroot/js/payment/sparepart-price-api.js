import CONFIG from '../config.js';

const API_BASE = `${CONFIG.API_BASE_URL}/Inventories`;

export const SparePartPriceAPI = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },

    // API lấy danh sách có phân trang
    getSpareParts: async (page = 1, pageSize = 10) => {
        try {
            const response = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`, {
                headers: SparePartPriceAPI.getAuthHeader()
            });
            const result = await response.json();
            return result;
        } catch (error) {
            return { success: false, message: 'Lỗi kết nối' };
        }
    },

    // API cập nhật (Gửi toàn bộ object nhưng chỉ thay đổi sellingPrice)
    updateSparePartPrice: async (id, updatedData) => {
        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: SparePartPriceAPI.getAuthHeader(),
                body: JSON.stringify(updatedData)
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Lỗi kết nối' };
        }
    }
};