import CONFIG from '../config.js';

const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;
const STOCKTRANS_URL = `${CONFIG.API_BASE_URL}/StockTransactions`;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});

export const inventoryAPI = {
    // Lấy danh sách tồn kho theo chi nhánh — endpoint /by-branch/{branchId}
    getInventory: async (query = "", page = 1) => {
        const raw = localStorage.getItem('branchId');
        const branchId = (raw && raw !== 'null' && raw !== 'undefined') ? parseInt(raw) : null;
        if (!branchId || isNaN(branchId)) {
            console.error('[Inventory] Thiếu branchId hợp lệ trong localStorage. Giá trị raw:', raw);
            return { success: false, message: 'Không xác định được chi nhánh. Vui lòng đăng nhập lại.' };
        }

        const params = new URLSearchParams({
            Page: page,
            PageSize: 10
        });
        if (query) params.set('Search', query);

        const response = await fetch(`${INVENTORY_URL}/by-branch/${branchId}?${params.toString()}`, {
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