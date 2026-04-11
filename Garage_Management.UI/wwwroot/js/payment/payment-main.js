import { PaymentAPI } from './payment-api.js';
import { PaymentUI } from './payment-ui.js';

let currentInvoiceId = null;
const modalElement = document.getElementById('paymentModal');
let bsModal = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Khởi tạo bootstrap modal
    bsModal = new bootstrap.Modal(modalElement);
    
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

// Export các hàm để gắn vào window object (cho phép HTML gọi được)
export  async function openPaymentModal(invoiceId, jobCardId) {
    currentInvoiceId = invoiceId;
    document.getElementById('modalInvoiceId').innerText = invoiceId;
    PaymentUI.resetModal();
    bsModal.show();

    try {
        const result = await PaymentAPI.getJobCardDetail(jobCardId);
        const jobCard = result.data || result;

        // 1. Lọc dịch vụ (bỏ status 4)
        const validServices = jobCard.services.filter(s => s.status !== 4);

        // 2. Lấy thêm chi tiết từ API Service cho từng cái
        // Dùng Promise.all để các request chạy song song cho nhanh
        const enrichedServices = await Promise.all(validServices.map(async (s) => {
            try {
                const sDetail = await PaymentAPI.getServiceById(s.serviceId);
                return { 
                    ...s, 
                    serviceName: sDetail.data?.serviceName || s.description 
                };
            } catch {
                return { ...s, serviceName: s.description }; // Fallback nếu lỗi API
            }
        }));

        // 3. Render lên UI
        PaymentUI.renderInvoiceDetails({
            services: enrichedServices,
            spareParts: jobCard.spareParts
        });
    } catch (error) {
        console.error("Không thể lấy chi tiết JobCard:", error);
    }
}

export async function handleCashPayment() {
    if (!confirm("Xác nhận khách hàng đã thanh toán bằng tiền mặt?")) return;

    try {
        const result = await PaymentAPI.confirmCashPayment(currentInvoiceId);
        if (result.success) {
            alert("Thanh toán thành công!");
            bsModal.hide();
            await loadInvoices(); // Load lại danh sách để cập nhật trạng thái "Đã thanh toán"
        } else {
            alert(result.message || "Lỗi xác nhận tiền mặt");
        }
    } catch (error) {
        alert("Không thể kết nối API xác nhận tiền mặt");
    }
}

export async function handleBankTransfer() {
    const result = await PaymentAPI.getBankTransferQr(currentInvoiceId);
    if (result.success) {
        // result.data chứa invoiceId, qrCodeUrl, bankName, v.v...
        PaymentUI.showQrCode(result.data);
    } else {
        alert("Lỗi: " + result.message);
    }
}