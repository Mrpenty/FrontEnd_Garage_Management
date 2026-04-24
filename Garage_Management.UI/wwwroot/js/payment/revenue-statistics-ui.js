export const RevenueStatisticsUI = {
    updateStatisticsCards: (data) => {
        const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
        
        // Cập nhật các thẻ con số tổng quát
        if(document.getElementById('totalRevenue'))
            document.getElementById('totalRevenue').innerText = formatter.format(data.totalRevenue);
        
        // Vì API mới không tách Paid/Unpaid rõ rệt, ta dùng Service/SparePart để hiển thị nếu cần
        if(document.getElementById('paidAmount'))
            document.getElementById('paidAmount').innerText = formatter.format(data.serviceTotal);
            
        if(document.getElementById('unpaidAmount'))
            document.getElementById('unpaidAmount').innerText = formatter.format(data.sparePartTotal);
        
        if(document.getElementById('totalInvoices'))
            document.getElementById('totalInvoices').innerText = data.totalInvoices + ' hóa đơn';
    },

    renderRevenueTable: (data) => {
        const tbody = document.getElementById('revenueTableBody');
        if (!tbody) return;

        // data.rawList chứa object duy nhất từ API
        const list = data.rawList || [];
        
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không có dữ liệu</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(item => `
            <tr>
                <td>${item.branchName || 'N/A'}</td>
                <td class="text-center">${item.invoiceCount || 0}</td>
                <td class="text-end">${new Intl.NumberFormat('vi-VN').format(item.serviceTotal || 0)} VNĐ</td>
                <td class="text-end">${new Intl.NumberFormat('vi-VN').format(item.sparePartTotal || 0)} VNĐ</td>
                <td class="text-end"><strong>${new Intl.NumberFormat('vi-VN').format(item.grandTotal || 0)} VNĐ</strong></td>
            </tr>
        `).join('');
    }
};