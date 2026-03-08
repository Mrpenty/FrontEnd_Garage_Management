import { CustomerAPI } from './customer-api.js';
import { customerUI } from './customer-ui.js';

export async function initCustomerModule() {
    const mainContent = document.getElementById('main-display');
    customerUI.renderLayout(mainContent);

    const tbody = document.getElementById('customer-table-body');
    const searchInput = document.getElementById('searchCustomer');

    async function loadCustomers() {
        try {
            const query = {
                Search: searchInput.value,
                Page: 1,
                PageSize: 20
            };
            const res = await CustomerAPI.getAll(query);
            if (res.success) {
                customerUI.renderTableRows(tbody, res.data.pageData);
            }
        } catch (err) {
            console.error("Lỗi tải danh sách khách hàng:", err);
        }
    }

    // Sự kiện tìm kiếm (Debounce)
    let timer;
    searchInput.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(loadCustomers, 500);
    };

    // Nút thêm mới (Sử dụng lại Modal có sẵn trong HTML)
    document.getElementById('btn-add-customer-main').onclick = () => {
        document.getElementById('addCustomerModal').style.display = 'block';
    };

    loadCustomers();
}