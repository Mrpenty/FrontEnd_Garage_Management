import { PaymentAPI } from './payment-api.js';
import { PaymentUI } from './payment-ui.js';

document.addEventListener('DOMContentLoaded', async () => {  
    await loadInvoices();
});

async function loadInvoices() {
    try {
        const result = await PaymentAPI.getInvoices();
        if (result.success) {
            PaymentUI.renderInvoices(result);
        } else {
            console.error("API trả về lỗi:", result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
    }
}

