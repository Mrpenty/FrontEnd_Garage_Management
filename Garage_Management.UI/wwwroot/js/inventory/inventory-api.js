import CONFIG from '../config.js';

const INVENTORY_URL = `${CONFIG.API_BASE_URL}/Inventories`;
const STOCKTRANS_URL = `${CONFIG.API_BASE_URL}/StockTransactions`;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});

// Helper lấy branchId an toàn từ localStorage
function getBranchId() {
    const raw = localStorage.getItem('branchId');
    if (!raw || raw === 'null' || raw === 'undefined') return null;
    const id = parseInt(raw);
    return isNaN(id) ? null : id;
}

export const inventoryAPI = {
    // Lấy danh sách tồn kho theo chi nhánh — endpoint /by-branch/{branchId}
    getInventory: async (query = "", page = 1) => {
        const branchId = getBranchId();
        if (!branchId) {
            console.error('[Inventory] Thiếu branchId hợp lệ trong localStorage');
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

    // Lấy chi tiết một phụ tùng — BE giờ yêu cầu branchId qua query
    getInventoryById: async (id) => {
        const branchId = getBranchId();
        if (!branchId) {
            return { success: false, message: 'Không xác định được chi nhánh. Vui lòng đăng nhập lại.' };
        }
        const response = await fetch(`${INVENTORY_URL}/${id}?branchId=${branchId}`, {
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
        // BE bắt buộc branchId trong body request
        const branchId = getBranchId();
        const payload = { ...data, branchId: data.branchId ?? branchId };
        const response = await fetch(INVENTORY_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    // BE: PUT /Inventories/{id}?branchId=X
    updateInventory: async (id, data) => {
        const branchId = getBranchId();
        if (!branchId) return { success: false, message: 'Không xác định được chi nhánh. Vui lòng đăng nhập lại.' };
        const response = await fetch(`${INVENTORY_URL}/${id}?branchId=${branchId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};