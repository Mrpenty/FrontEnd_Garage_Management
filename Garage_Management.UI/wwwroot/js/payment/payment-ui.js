import { renderPagination, extractPaging } from '../common/pagination.js';
import { PaymentAPI } from './payment-api.js';

const INVOICE_PAGE_SIZE = 20;

export const PaymentUI = {
    PAGE_SIZE: INVOICE_PAGE_SIZE,

    renderInvoices: (apiResponse, onPageClick) => {
        const tbody = document.getElementById('invoiceTableBody');
        const paged = apiResponse.data || {};
        const invoices = paged.pageData || [];

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có hóa đơn nào</td></tr>';
        } else {
            tbody.innerHTML = invoices.map(inv => `
                <tr>
                    <td>#${inv.invoiceId}</td>
                    <td>
                        <div><strong>${inv.customerName || 'Khách lẻ'}</strong></div>
                        <small class="text-muted">${inv.vehicleLicensePlate || ''}</small>
                    </td>
                    <td>${new Intl.NumberFormat('vi-VN').format(inv.grandTotal)} VNĐ</td>
                    <td>
                        <span class="${inv.paymentStatus === 'Paid' ? 'status-paid' : 'status-unpaid'}">
                            ${inv.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </span>
                    </td>
                    <td>${inv.paymentStatus === 'Paid' ? new Date(inv.updatedAt).toLocaleString('vi-VN') : 'Chưa thanh toán'}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" title="Xem dịch vụ + phụ tùng"
                                onclick="window.PaymentUI.showInvoiceDetail(${inv.invoiceId})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
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

    showInvoiceDetail: async (invoiceId) => {
        const body = document.getElementById('invoiceDetailBody');
        body.innerHTML = `<div class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>`;
        new bootstrap.Modal('#invoiceDetailModal').show();

        try {
            const result = await PaymentAPI.getInvoiceById(invoiceId);
            if (!result.success) {
                body.innerHTML = `<div class="alert alert-danger">${result.message || 'Không tải được hóa đơn'}</div>`;
                return;
            }
            const inv = result.data;
            const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
            const services = inv.services || [];
            const spareParts = inv.spareParts || [];

            const servicesHtml = services.length === 0
                ? `<div class="text-muted fst-italic small px-2">Không có dịch vụ nào</div>`
                : `<table class="table table-sm table-bordered align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Mã DV</th>
                            <th>Tên dịch vụ</th>
                            <th>Mô tả</th>
                            <th class="text-end">Giá</th>
                            <th class="text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${services.map(s => `
                            <tr>
                                <td><code>#${s.serviceId}</code></td>
                                <td><strong>${s.serviceName || ''}</strong></td>
                                <td><small>${s.description || ''}</small></td>
                                <td class="text-end fw-bold">${fmt(s.price)} ₫</td>
                                <td class="text-center"><small>${s.status || ''}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;

            const sparePartsHtml = spareParts.length === 0
                ? `<div class="text-muted fst-italic small px-2">Không có phụ tùng nào</div>`
                : `<table class="table table-sm table-bordered align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Mã PT</th>
                            <th>Tên phụ tùng</th>
                            <th class="text-center">SL</th>
                            <th class="text-end">Đơn giá</th>
                            <th class="text-end">Thành tiền</th>
                            <th class="text-center">Bảo hành</th>
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${spareParts.map(p => `
                            <tr>
                                <td><code>${p.partCode || `#${p.sparePartId}`}</code></td>
                                <td><strong>${p.partName || ''}</strong></td>
                                <td class="text-center">${p.quantity}</td>
                                <td class="text-end">${fmt(p.unitPrice)} ₫</td>
                                <td class="text-end fw-bold">${fmt(p.totalAmount)} ₫</td>
                                <td class="text-center">
                                    ${p.isUnderWarranty
                                        ? '<span class="badge bg-success">Có</span>'
                                        : '<span class="badge bg-secondary">Không</span>'}
                                </td>
                                <td><small>${p.note || ''}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;

            body.innerHTML = `
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <div class="text-muted small">Mã hóa đơn</div>
                        <div class="fw-bold">#${inv.invoiceId} <small class="text-muted">(JC-${inv.jobCardId})</small></div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-muted small">Ngày xuất hóa đơn</div>
                        <div>${new Date(inv.invoiceDate).toLocaleString('vi-VN')}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-muted small">Khách hàng</div>
                        <div class="fw-bold">${inv.customerName || 'Khách lẻ'}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-muted small">Biển số xe</div>
                        <div>${inv.vehicleLicensePlate || '—'}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-muted small">Trạng thái thanh toán</div>
                        <div>
                            <span class="${inv.paymentStatus === 'Paid' ? 'status-paid' : 'status-unpaid'}">
                                ${inv.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                            </span>
                            ${inv.paymentMethod ? `<small class="text-muted ms-2">(${inv.paymentMethod})</small>` : ''}
                        </div>
                    </div>
                </div>

                <hr>
                <h6 class="text-primary mb-2"><i class="fas fa-wrench"></i> Dịch vụ đã dùng (${services.length})</h6>
                ${servicesHtml}

                <h6 class="text-primary mt-4 mb-2"><i class="fas fa-tools"></i> Phụ tùng đã dùng (${spareParts.length})</h6>
                ${sparePartsHtml}

                <hr>
                <div class="row g-2 mt-2">
                    <div class="col-md-4 text-end text-muted">Tổng tiền dịch vụ:</div>
                    <div class="col-md-2 text-end fw-bold">${fmt(inv.serviceTotal)} ₫</div>
                </div>
                <div class="row g-2">
                    <div class="col-md-4 text-end text-muted">Tổng tiền phụ tùng:</div>
                    <div class="col-md-2 text-end fw-bold">${fmt(inv.sparePartTotal)} ₫</div>
                </div>
                <div class="row g-2 mt-2 pt-2 border-top">
                    <div class="col-md-4 text-end fw-bold">Tổng cộng:</div>
                    <div class="col-md-2 text-end fw-bold text-primary fs-5">${fmt(inv.grandTotal)} ₫</div>
                </div>
            `;
        } catch (err) {
            console.error('Lỗi tải chi tiết hóa đơn:', err);
            body.innerHTML = `<div class="alert alert-danger">Lỗi kết nối: ${err.message}</div>`;
        }
    },
};

window.PaymentUI = PaymentUI;