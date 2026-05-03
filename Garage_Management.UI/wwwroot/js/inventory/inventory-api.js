import CONFIG from '../config.js';

const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;
const STOCKTRANS_URL = `${CONFIG.API_BASE_URL}/StockTransactions`;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});

export const inventoryAPI = {
    // Lấy danh sách tồn kho có phân trang (filter theo chi nhánh của user)
    getInventory: async (query = "", page = 1) => {
        const params = new URLSearchParams({
            Page: page,
            PageSize: 10
        });
        if (query) params.set('Search', query);
        const branchId = localStorage.getItem('branchId');
        if (branchId) params.set('BranchId', branchId);

        const response = await fetch(`${INVENTORY_URL}?${params.toString()}`, {
            headers: getHeaders()
        });
        return await response.json();
    },

    // Lấy chi tiết một phụ tùng
    getInventoryById: async (id) => {
        const response = await fetch(`${INVENTORY_URL}/${id}`, {
            headers: getHeaders()
        });
        return await response.json();
    },

    // Tạo giao dịch (Nhập/Xuất/Điều chỉnh)
    createTransaction: async (data) => {
        const response = await fetch(`${STOCKTRANS_URL}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    },

    // Lấy lịch sử giao dịch (filter theo chi nhánh của user)
    getTransactions: async () => {
        const params = new URLSearchParams({ PageSize: 50 });
        const branchId = localStorage.getItem('branchId');
        if (branchId) params.set('BranchId', branchId);

        const response = await fetch(`${STOCKTRANS_URL}?${params.toString()}`, {
            headers: getHeaders()
        });
        return await response.json();
    },

    createInventory: async (data) => {
        const response = await fetch(INVENTORY_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    },

    updateInventory: async (id, data) => {
        const response = await fetch(`${INVENTORY_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};