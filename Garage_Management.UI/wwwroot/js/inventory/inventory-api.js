import CONFIG from '../config.js';

const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;
const STOCKTRANS_URL = `${CONFIG.API_BASE_URL}/StockTransactions`;

export const inventoryAPI = {
    // Lấy danh sách tồn kho có phân trang
    getInventory: async (query = "", page = 1) => {
        // Fix lỗi ReferenceError bằng cách đảm bảo page có giá trị
        const response = await fetch(`${INVENTORY_URL}?Search=${encodeURIComponent(query)}&PageIndex=${page}&PageSize=10`);
        return await response.json();
    },

    // Lấy chi tiết một phụ tùng
    getInventoryById: async (id) => {
        const response = await fetch(`${INVENTORY_URL}/${id}`);
        return await response.json();
    },

    // Tạo giao dịch (Nhập/Xuất/Điều chỉnh)
    createTransaction: async (data) => {
        const response = await fetch(`${STOCKTRANS_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    },

    // Lấy lịch sử giao dịch
    getTransactions: async () => {
        const response = await fetch(`${STOCKTRANS_URL}?PageSize=50`);
        return await response.json();
    },

    createInventory: async (data) => {
        const response = await fetch(INVENTORY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    },

    updateInventory: async (id, data) => {
        const response = await fetch(`${INVENTORY_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};