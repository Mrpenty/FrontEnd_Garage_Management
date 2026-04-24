export const PaymentUI = {
    renderInvoices: (apiResponse) => {
        const tbody = document.getElementById('invoiceTableBody');
        
        // Bóc tách dữ liệu theo cấu trúc: result.data.pageData
        const invoices = apiResponse.data?.pageData || [];
        
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có hóa đơn nào</td></tr>';
            return;
        }

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
    },
};