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
                <td>
                    ${inv.paymentStatus !== 'Paid' ? 
                        `<button class="btn btn-sm btn-primary" onclick="openPaymentModal(${inv.invoiceId}, ${inv.jobCardId})">
                            <i class="fa-solid fa-money-bill"></i> Thanh toán
                        </button>` : 
                        `<span class="badge bg-success"><i class="fa-solid fa-check"></i> Hoàn tất</span>`
                    }
                </td>
            </tr>
        `).join('');
    },

    showQrCode: (data) => {
        // data ở đây chính là object bên trong trường "data" của JSON bạn gửi
        document.getElementById('paymentOptions').classList.add('d-none');
        document.getElementById('qrSection').classList.remove('d-none');
        
        // Gán ảnh QR
        document.getElementById('qrCodeImage').src = data.qrCodeUrl;
        
        // Hiển thị thông tin chuyển khoản cụ thể
        document.getElementById('bankName').innerText = data.bankName; // VD: ICB (Vietinbank)
        document.getElementById('accNumber').innerText = data.accountNumber;
        document.getElementById('accName').innerText = data.accountName.toUpperCase(); // In hoa tên
        document.getElementById('transContent').innerText = data.transferContent;
        
        // Thêm hiển thị số tiền vào giao diện QR nếu cần
        const amountDisplay = new Intl.NumberFormat('vi-VN').format(data.amount);
        console.log(`Đang chờ thanh toán số tiền: ${amountDisplay} VNĐ`);
    },

    renderInvoiceDetails: (jobCardData) => {
        const detailContainer = document.getElementById('invoiceDetailContent');
        if (!detailContainer) return;

        // 1. Lọc bỏ các dịch vụ có status là 4
        const filteredServices = jobCardData.services.filter(s => s.status !== 4);

        // 2. Tạo HTML cho dịch vụ - SỬA: dùng filteredServices thay vì data.services
        const serviceHtml = filteredServices.map(s => `
            <div class="d-flex justify-content-between mb-1 border-bottom-dotted">
                <span>
                    <i class="fa-solid fa-screwdriver-wrench me-2 text-primary"></i>
                    <strong>Tiền công ${s.serviceName || s.description}</strong>
                </span>
                <span class="text-dark fw-bold">${new Intl.NumberFormat('vi-VN').format(s.price)} đ</span>
            </div>
        `).join('');

        // 3. Tạo HTML cho phụ tùng - SỬA: jobCardData.spareParts (đúng rồi)
        const sparePartHtml = jobCardData.spareParts.map(p => `
            <div class="d-flex justify-content-between mb-1">
                <span><i class="fa-solid fa-nut-bolt me-2 small text-secondary"></i>${p.sparePartName} (x${p.quantity})</span>
                <span class="fw-medium">${new Intl.NumberFormat('vi-VN').format(p.totalAmount)} đ</span>
            </div>
        `).join('');

        detailContainer.innerHTML = `
            <div class="border-bottom pb-2 mb-2">
                <h6 class="text-primary"><i class="fa-solid fa-list-check me-2"></i>Chi tiết dịch vụ</h6>
                ${serviceHtml || '<p class="small text-muted">Không có dịch vụ</p>'}
            </div>
            <div>
                <h6 class="text-primary"><i class="fa-solid fa-box-open me-2"></i>Phụ tùng thay thế</h6>
                ${sparePartHtml || '<p class="small text-muted">Không có phụ tùng</p>'}
            </div>
        `;
    },

    resetModal: () => {
        document.getElementById('paymentOptions').classList.remove('d-none');
        document.getElementById('qrSection').classList.add('d-none');
        const detailContainer = document.getElementById('invoiceDetailContent');
        if (detailContainer) detailContainer.innerHTML = 'Đang tải chi tiết...';
    }
};