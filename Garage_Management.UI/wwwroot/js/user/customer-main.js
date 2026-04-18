import { CustomerAPI } from './customer-api.js';
import { customerUI } from './customer-ui.js';

export async function initCustomerModule() {
    const mainContent = document.getElementById('main-display');
    customerUI.renderLayout(mainContent);

    const tbody = document.getElementById('customer-table-body');
    const searchInput = document.getElementById('searchCustomer');
    const modalAdd = document.getElementById('addCustomerModal');

    let allModels = []; // Biến tạm lưu danh sách model
    const vehicleModal = document.getElementById('addVehicleModal');
    const vehicleForm = document.getElementById('createVehicleForm');
    let currentSelectedCustomerId = null; // Lưu ID khách hàng đang được chọn thêm xe

    // --- Xử lý sự kiện trong Table (Dùng Event Delegation) ---
    tbody.onclick = async (e) => {
        const btnAddVehicle = e.target.closest('.btn-add-vehicle-row');
        if (btnAddVehicle) {
            currentSelectedCustomerId = btnAddVehicle.dataset.id;
            openVehicleModal();
        }
    };

    // --- Hàm mở và nạp dữ liệu cho Modal Xe ---
    async function openVehicleModal() {
        vehicleModal.style.display = 'block';
        const brandSelect = document.getElementById('newVehicleBrand');
        
        try {
            // Gọi API lấy Hãng và Dòng xe (Sử dụng API bạn cung cấp)
            const [brandRes, modelRes] = await Promise.all([
                CustomerAPI.getBrands(), 
                CustomerAPI.getModels()
            ]);

            if (brandRes.success) {
                const brands = brandRes.data.pageData || brandRes.data;
                brandSelect.innerHTML = '<option value="">-- Chọn Hãng --</option>' + 
                    brands.map(b => `<option value="${b.brandId}">${b.brandName}</option>`).join('');
            }
            if (modelRes.success) {
                allModels = modelRes.data.pageData || modelRes.data;
            }
        } catch (err) {
            console.error("Lỗi nạp dữ liệu xe:", err);
        }
    }

    // --- Xử lý thay đổi Hãng xe để lọc Dòng xe ---
    document.getElementById('newVehicleBrand').onchange = (e) => {
        const brandId = parseInt(e.target.value);
        const modelSelect = document.getElementById('newVehicleModel');
        
        const filtered = allModels.filter(m => (m.brandId || m.BrandId) === brandId);
        modelSelect.disabled = false;
        modelSelect.innerHTML = '<option value="">-- Chọn Dòng Xe --</option>' + 
            filtered.map(m => `<option value="${m.modelId}">${m.modelName}</option>`).join('');
    };

    // --- Submit lưu xe mới ---
    vehicleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSubmitNewVehicle');

        const payload = {
            customerId: parseInt(currentSelectedCustomerId),
            modelId: parseInt(document.getElementById('newVehicleModel').value),
            licensePlate: document.getElementById('newVehiclePlate').value.trim().toUpperCase(),
            vin: document.getElementById('newVehicleVin').value.trim() || "N/A",
            year: parseInt(document.getElementById('newVehicleYear').value) || new Date().getFullYear(),
            createdBy: parseInt(currentSelectedCustomerId)
        };

        try {
            btnSubmit.disabled = true;
            const res = await CustomerAPI.create(payload);
            if (res.success) {
                alert("Thêm xe thành công!");
                vehicleModal.style.display = 'none';
                vehicleForm.reset();
                loadCustomers(); // Load lại bảng chính để hiện badge xe mới
            } else {
                alert(res.message || "Lỗi khi lưu xe");
            }
        } catch (err) {
            alert("Lỗi hệ thống");
        } finally {
            btnSubmit.disabled = false;
        }
    });

    // Đóng Modal xe
    document.querySelectorAll('.close-vehicle-modal').forEach(btn => {
        btn.onclick = () => {
            vehicleModal.style.display = 'none';
            vehicleForm.reset();
        };
    });

    // --- Hàm tải danh sách ---
    async function loadCustomers() {
        try {
            const query = { Search: searchInput.value, Page: 1, PageSize: 20 };
            const res = await CustomerAPI.getAll(query);
            // API của bạn trả về pageData nằm trong data
            const items = res.data?.pageData || res.pageData || [];
            customerUI.renderTableRows(tbody, items);
        } catch (err) {
            console.error("Lỗi tải danh sách:", err);
        }
    }

    // --- Logic Xử lý Modal & Form ---
    const customerForm = document.getElementById('createCustomerForm');
    const btnSubmit = document.getElementById('btnSubmitNewCustomer');

    // Mở modal
    document.getElementById('btn-add-customer-main').onclick = () => {
        modalAdd.style.display = 'block';
    };

    // Đóng modal (nút X và nút Hủy)
    document.querySelectorAll('.close-customer-modal').forEach(btn => {
        btn.onclick = () => {
            modalAdd.style.display = 'none';
            customerForm.reset();
        };
    });

    // Submit form thêm khách
    customerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('newCustomerName').value.trim();
        const nameParts = fullName.split(' ');
        const firstName = nameParts.length > 1 ? nameParts.pop() : fullName;
        const lastName = nameParts.join(' ') || "";

        const customerData = {
            firstName,
            lastName,
            phoneNumber: document.getElementById('newCustomerPhone').value.trim(),
            email: document.getElementById('newCustomerEmail').value.trim() || null,
            address: document.getElementById('newCustomerAddress').value.trim() || null
        };

        try {
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Đang lưu...";

            const res = await CustomerAPI.createByReceptionist(customerData);

            if (res.success) {
                alert("Thêm khách hàng thành công!");
                modalAdd.style.display = 'none';
                customerForm.reset();
                
                // Load lại danh sách để thấy khách mới
                loadCustomers(); 
            } else {
                alert(res.message);
            }
        } catch (err) {
            alert("Đã xảy ra lỗi hệ thống.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Lưu Khách Hàng";
        }
    });

    // Tìm kiếm Debounce
    let timer;
    searchInput.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(loadCustomers, 500);
    };

    loadCustomers();
}