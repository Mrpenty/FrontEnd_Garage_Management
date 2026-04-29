import { renderPagination, extractPaging } from '../common/pagination.js';

const INVOICE_PAGE_SIZE = 20;

export const PaymentUI = {
    PAGE_SIZE: INVOICE_PAGE_SIZE,

    renderInvoices: (apiResponse, onPageClick) => {
        const tbody = document.getElementById('invoiceTableBody');
        const paged = apiResponse.data || {};
        const invoices = paged.pageData || [];

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có hóa đơn nào</td></tr>';
        } else {
            tbody.innerHTML = invoices.map(inv => `
                <tr>
                    <td>#${inv.invoiceId}</td>
                    <td>
                        <div><strong>${inv.customerName || 'Khách lẻ'}</strong></div>
                        <small class="text-muted">${inv.vehicleLicensePlate}</small>
                    </td>
                    <td>${new Intl.NumberFormat('vi-VN').format(inv.grandTotal)} VNĐ</td>
                    <td>
                        <span class="${inv.paymentStatus === 'Paid' ? 'status-paid' : 'status-unpaid'}">
                            ${inv.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </span>
                    </td>
                    <td>${inv.paymentStatus === 'Paid' ? new Date(inv.updatedAt).toLocaleString('vi-VN') : 'Chưa thanh toán'}</td>
                </tr>
            `).join('');
        }

        // Render pagination nếu có container
        if (document.getElementById('invoicePagination') && typeof onPageClick === 'function') {
            const { page, totalPages, total } = extractPaging(paged, INVOICE_PAGE_SIZE);
            renderPagination('invoicePagination', {
                page, totalPages,
                callbackName: 'invoiceGoPage',
                onPageClick
            });
            const metaBox = document.getElementById('invoicePagingMeta');
            if (metaBox) {
                if (!total) metaBox.textContent = '';
                else {
                    const from = (page - 1) * INVOICE_PAGE_SIZE + 1;
                    const to = Math.min(page * INVOICE_PAGE_SIZE, total);
                    metaBox.textContent = `Hiển thị ${from}-${to} / ${total} hóa đơn`;
                }
            }
        }
    },
};