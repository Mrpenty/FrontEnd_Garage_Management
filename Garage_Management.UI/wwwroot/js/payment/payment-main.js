import { PaymentAPI } from './payment-api.js';
import { PaymentUI } from './payment-ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadInvoices(1);
});

async function loadInvoices(page = 1) {
    try {
        const result = await PaymentAPI.getInvoices({ page, pageSize: PaymentUI.PAGE_SIZE });
        if (result.success) {
            PaymentUI.renderInvoices(result, (np) => loadInvoices(np));
        } else {
            console.error("API trả về lỗi:", result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
    }
}

