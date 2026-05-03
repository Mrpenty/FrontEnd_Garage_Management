import { CustomerAPI } from './customer-api.js';
import { customerUI } from './customer-ui.js';
import { renderPagination, extractPaging } from '../common/pagination.js';

const PAGE_SIZE = 20;
let currentPage = 1;

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
            return;
        }

        const btnView = e.target.closest('.btn-view-customer');
        if (btnView) {
            await openCustomerDetailModal(btnView.dataset.id);
            return;
        }
    };

    // --- Modal chi tiết khách hàng + lịch sử sửa xe ---
    async function openCustomerDetailModal(customerId) {
        const detailModal = document.getElementById('customerDetailModal');
        const body = document.getElementById('customerDetailBody');

        body.innerHTML = `<div class="text-center" style="padding:30px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>`;
        detailModal.style.display = 'block';

        try {
            const custRes = await CustomerAPI.getDetails(customerId);
            const customer = custRes.data || custRes;
            const jobcards = customer.repairHistory || [];
            customerUI.renderCustomerDetail(body, { customer, jobcards });
        } catch (err) {
            console.error('Lỗi tải chi tiết khách hàng:', err);
            body.innerHTML = `<div class="text-center" style="color:red; padding:20px;">Lỗi: ${err.message}</div>`;
        }
    }

    // Đóng modal chi tiết
    document.querySelectorAll('.close-customer-detail').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('customerDetailModal').style.display = 'none';
        };
    });

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

    const customerFilters = {
        vehicleStatus: '',  // '', 'has', 'none'
        sort: ''            // '', 'newest', 'oldest', 'name-asc', 'name-desc'
    };

    function applyClientFilters(items) {
        let result = [...items];

        if (customerFilters.vehicleStatus === 'has') {
            result = result.filter(c => Array.isArray(c.vehicles) && c.vehicles.length > 0);
        } else if (customerFilters.vehicleStatus === 'none') {
            result = result.filter(c => !c.vehicles || c.vehicles.length === 0);
        }

        switch (customerFilters.sort) {
            case 'newest':
                result.sort((a, b) => (b.customerId || 0) - (a.customerId || 0));
                break;
            case 'oldest':
                result.sort((a, b) => (a.customerId || 0) - (b.customerId || 0));
                break;
            case 'name-asc':
                result.sort((a, b) => (`${a.lastName || ''} ${a.firstName || ''}`).localeCompare(`${b.lastName || ''} ${b.firstName || ''}`, 'vi'));
                break;
            case 'name-desc':
                result.sort((a, b) => (`${b.lastName || ''} ${b.firstName || ''}`).localeCompare(`${a.lastName || ''} ${a.firstName || ''}`, 'vi'));
                break;
        }
        return result;
    }

    // --- Hàm tải danh sách ---
    async function loadCustomers(page = currentPage) {
        try {
            const query = { Search: searchInput.value, Page: page, PageSize: PAGE_SIZE };
            const res = await CustomerAPI.getAll(query);
            const paged = res.data || res;
            const items = paged.pageData || [];
            const filtered = applyClientFilters(items);
            customerUI.renderTableRows(tbody, filtered);

            const { page: p, totalPages, total } = extractPaging(paged, PAGE_SIZE);
            currentPage = p;
            renderPagination('customerPagination', {
                page: p, totalPages,
                callbackName: 'customerGoPage',
                onPageClick: (np) => loadCustomers(np)
            });
            const metaBox = document.getElementById('customerPagingMeta');
            if (metaBox) {
                if (!total) metaBox.textContent = '';
                else {
                    const from = (p - 1) * PAGE_SIZE + 1;
                    const to = Math.min(p * PAGE_SIZE, total);
                    const filterNote = filtered.length !== items.length ? ` (đã lọc còn ${filtered.length})` : '';
                    metaBox.textContent = `Hiển thị ${from}-${to} / ${total} khách hàng${filterNote}`;
                }
            }
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

    // Tìm kiếm Debounce — reset về trang 1 khi đổi keyword
    let timer;
    searchInput.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(() => loadCustomers(1), 500);
    };

    // Nút "Tìm" — search ngay không cần debounce
    document.getElementById('btn-customer-search')?.addEventListener('click', () => {
        clearTimeout(timer);
        loadCustomers(1);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(timer);
            loadCustomers(1);
        }
    });

    // Filter theo trạng thái xe
    document.getElementById('customer-filter-vehicle')?.addEventListener('change', (e) => {
        customerFilters.vehicleStatus = e.target.value;
        loadCustomers(currentPage);
    });

    // Sort
    document.getElementById('customer-sort')?.addEventListener('change', (e) => {
        customerFilters.sort = e.target.value;
        loadCustomers(currentPage);
    });

    // Reset toàn bộ
    document.getElementById('btn-customer-reset')?.addEventListener('click', () => {
        searchInput.value = '';
        customerFilters.vehicleStatus = '';
        customerFilters.sort = '';
        document.getElementById('customer-filter-vehicle').value = '';
        document.getElementById('customer-sort').value = '';
        loadCustomers(1);
    });

    loadCustomers(1);
}