export const jobcardUI = {
    // Render dropdown xe của khách
    renderVehicleSelect: (selectElement, vehicles) => {
        if (!vehicles || vehicles.length === 0) {
            selectElement.innerHTML = '<option value="">Khách hàng chưa có xe</option>';
            selectElement.disabled = true;
            return;
        }
        let html = '<option value="">-- Chọn xe của khách --</option>';
        vehicles.forEach(v => {
            // Kiểm tra các trường hợp tên thuộc tính có thể có
            const brand = v.brandName || v.brand || v.BrandName || "";
            const model = v.modelName || v.model || v.ModelName || "";
            
            html += `<option value="${v.vehicleId}">${v.licensePlate} - Hãng: ${brand} - Loại: ${model}</option>`;
        });
        selectElement.innerHTML = html;
        selectElement.disabled = false;
    },

    // Render dropdown dịch vụ
    renderServiceSelect: (selectElement, services) => {
        let html = '<option value="">-- Chọn dịch vụ --</option>';
        services.forEach(s => {
            // Lưu giá vào data-price để dùng sau
            html += `<option value="${s.serviceId}" data-price="${s.price}">${s.serviceName} (${s.price.toLocaleString()}đ)</option>`;
        });
        selectElement.innerHTML = html;
    },

    // Render danh sách dịch vụ đã chọn vào bảng
    renderSelectedServices: (tableBodyElement, selectedArray, onRemoveCallback) => {
        if (selectedArray.length === 0) {
            tableBodyElement.innerHTML = `<tr><td colspan="3" style="text-align:center">Chưa có dịch vụ nào</td></tr>`;
            return;
        }
        tableBodyElement.innerHTML = selectedArray.map((s, index) => `
            <tr>
                <td>${s.name}</td>
                <td>${parseInt(s.price).toLocaleString()}đ</td>
                <td>
                    <button type="button" class="btn-remove-service" data-index="${index}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tableBodyElement.querySelectorAll('.btn-remove-service').forEach(btn => {
            btn.onclick = () => onRemoveCallback(parseInt(btn.dataset.index));
        });
    },

    // Render kết quả tìm kiếm khách hàng (Autocomplete)
    renderCustomerSearchResults: (ulElement, customers, onSelectCallback) => {
        if (!customers || customers.length === 0) {
            ulElement.innerHTML = '<li style="padding: 10px; color: red;">Không tìm thấy khách hàng. Vui lòng thêm mới!</li>';
            ulElement.style.display = 'block';
            return;
        }

        ulElement.innerHTML = customers.map(c => `
            <li class="customer-item" data-id="${c.customerId}" data-name="${c.fullName}" data-phone="${c.phoneNumber}" 
                style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;">
                <strong>${c.fullName}</strong> - ${c.phoneNumber}
            </li>
        `).join('');

        ulElement.style.display = 'block';

        // Gắn sự kiện click cho từng dòng kết quả
        ulElement.querySelectorAll('.customer-item').forEach(li => {
            li.addEventListener('click', function() {
                onSelectCallback(this.dataset.id, this.dataset.name, this.dataset.phone);
                ulElement.style.display = 'none'; // Ẩn danh sách đi
            });
        });
    },

    // Render dropdown Hãng (Brand) trong Modal thêm xe
    renderBrandSelect: (selectElement, brands) => {
        selectElement.innerHTML = '<option value="">-- Chọn Hãng --</option>';
        brands.forEach(b => {
            const name = b.brandName || b.BrandName;
            const id = b.brandId || b.BrandId;
            selectElement.add(new Option(name, id));
        });
    },

    // Render dropdown Dòng xe (Model) trong Modal thêm xe
    renderModelSelect: (selectElement, models) => {
        selectElement.innerHTML = '<option value="">-- Chọn Dòng Xe --</option>';
        models.forEach(m => {
            const name = m.modelName || m.ModelName;
            const id = m.modelId || m.ModelId;
            selectElement.add(new Option(name, id));
        });
        selectElement.disabled = false;
    },
};