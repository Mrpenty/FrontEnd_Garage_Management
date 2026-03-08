import CONFIG from '../config.js';

const CUSTOMER_URL = `${CONFIG.API_BASE_URL}/Customer`;

export const CustomerAPI = {
    // Lấy danh sách khách hàng phân trang
    getAll: async (query) => {
        const params = new URLSearchParams({
            Filter: 'Customer',
            Search: query.Search || '',
            Page: query.Page || 1,
            PageSize: query.PageSize || 10
        });
        const res = await fetch(`${CUSTOMER_URL}?${params}`);
        return await res.json();
    },

    // Lấy chi tiết lịch sử bảo dưỡng của 1 khách
    getDetails: async (id) => {
        const res = await fetch(`${CUSTOMER_URL}/${id}`);
        return await res.json();
    }
};