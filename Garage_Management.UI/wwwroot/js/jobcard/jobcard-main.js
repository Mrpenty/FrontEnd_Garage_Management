import { vehicleApi, serviceApi, jobcardApi, customerApi } from './jobcard-api.js';
import { jobcardUI } from './jobcard-ui.js';

// --- State Management ---
let selectedServices = [];
let allModels = [];

// --- DOM Elements ---
const elements = {
    modalJobCard: document.getElementById('jobCardModal'),
    modalAddVehicle: document.getElementById('addVehicleModal'),
    modalAddCustomer: document.getElementById('addCustomerModal'),
    
    btnCreateJobCard: document.getElementById('btn-create-jobcard'),
    btnOpenAddVehicle: document.getElementById('btnOpenAddVehicle'),
    btnOpenAddCustomer: document.getElementById('btnOpenAddCustomer'),
    
    selectVehicle: document.getElementById('selectVehicle'),
    selectService: document.getElementById('selectService'),
    btnAddService: document.getElementById('btnAddService'),
    servicesBody: document.getElementById('selectedServicesBody'),
    
    searchCustomerInput: document.getElementById('searchCustomerInput'),
    selectedCustomerId: document.getElementById('selectedCustomerId'),
    customerSearchResults: document.getElementById('customerSearchResults'),
    
    brandSelect: document.getElementById('newVehicleBrand'),
    modelSelect: document.getElementById('newVehicleModel'),
    createVehicleForm: document.getElementById('createVehicleForm')
};

// --- Sự kiện khởi tạo ---
document.addEventListener('DOMContentLoaded', () => {
    initModalEvents();
    initCustomerSearch();
    initVehicleLogic();
    initServiceLogic();
});

// 1. Quản lý Đóng/Mở Modal
function initModalEvents() {
    elements.btnCreateJobCard?.addEventListener('click', async () => {
        elements.modalJobCard.style.display = "block";
        const res = await serviceApi.getAll();
        if (res.success) jobcardUI.renderServiceSelect(elements.selectService, res.data.items);
    });

    document.querySelectorAll('.close-modal, .close-vehicle-modal, .close-customer-modal').forEach(btn => {
        btn.onclick = (e) => {
            const m = e.target.closest('.modal');
            if (m) m.style.display = 'none';
        };
    });
}

// 2. Logic Tìm kiếm khách hàng
function initCustomerSearch() {
    let searchTimeout = null;
    elements.searchCustomerInput?.addEventListener('input', (e) => {
        const keyword = e.target.value.trim();
        elements.selectedCustomerId.value = '';
        elements.selectVehicle.disabled = true;
        elements.btnOpenAddVehicle.disabled = true;

        if (keyword.length < 2) {
            elements.customerSearchResults.style.display = 'none';
            return;
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const res = await customerApi.search(keyword);
            if (res.success && res.data?.pageData) {
                jobcardUI.renderCustomerSearchResults(elements.customerSearchResults, res.data.pageData, (id, name, phone) => {
                    elements.selectedCustomerId.value = id;
                    elements.searchCustomerInput.value = `${name} - ${phone}`;
                    
                    const selectedCustomer = res.data.pageData.find(c => c.customerId == id);
                    jobcardUI.renderVehicleSelect(elements.selectVehicle, selectedCustomer?.vehicles || []);
                    elements.btnOpenAddVehicle.disabled = false;
                });
            }
        }, 400);
    });
}

// 3. Logic Xe (Thêm xe, Lọc Brand/Model)
function initVehicleLogic() {
    elements.btnOpenAddVehicle?.addEventListener('click', async () => {
        const customerId = elements.selectedCustomerId.value;
        if (!customerId || customerId === "") {
            alert("Vui lòng chọn một khách hàng từ danh sách tìm kiếm trước khi thêm xe!");
            return; // Không cho mở modal
        }
        elements.modalAddVehicle.style.display = 'block';
        try {
            const [brandRes, modelRes] = await Promise.all([vehicleApi.getBrands(), vehicleApi.getModels()]);
            if (brandRes.success) jobcardUI.renderBrandSelect(elements.brandSelect, brandRes.data.pageData || []);
            if (modelRes.success) allModels = modelRes.data.pageData || [];
        } catch (err) { console.error(err); }
    });

    elements.brandSelect?.addEventListener('change', (e) => {
        const brandId = parseInt(e.target.value);
        const filtered = allModels.filter(m => (m.brandId || m.BrandId) === brandId);
        jobcardUI.renderModelSelect(elements.modelSelect, filtered);
    });

    elements.createVehicleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const userId = userInfo?.userId || userInfo?.id;

        const payload = {
            customerId: parseInt(elements.selectedCustomerId.value),
            brandId: parseInt(elements.brandSelect.value),
            modelId: parseInt(elements.modelSelect.value),
            licensePlate: document.getElementById('newVehiclePlate').value.trim(),
            vin: document.getElementById('newVehicleVin')?.value.trim() || "N/A",
            year: parseInt(document.getElementById('newVehicleYear').value) || new Date().getFullYear(),
            createdBy: parseInt(userId)
        };

        // Kiểm tra nhanh phía Client để tránh gửi rác lên Server
        if (isNaN(payload.customerId)) return alert("Lỗi: Chưa xác định được khách hàng!");
        if (isNaN(payload.brandId) || isNaN(payload.modelId)) return alert("Vui lòng chọn Hãng và Dòng xe!");

        if (!payload.licensePlate) {
            alert("Vui lòng nhập biển số xe!");
            return;
        }

        try {
            const res = await vehicleApi.create(payload);
            if (res.success) {
                alert("Thêm xe mới thành công!");
                elements.modalAddVehicle.style.display = 'none';
                elements.createVehicleForm.reset();

                // Load lại danh sách xe và tự động chọn xe vừa tạo
                const vRes = await vehicleApi.getByCustomer(payload.customerId);
                if (vRes.success) {
                    const vehicleList = vRes.data.pageData || vRes.data || [];
                    jobcardUI.renderVehicleSelect(elements.selectVehicle, vehicleList);
                    
                    // Chọn luôn xe mới (dựa trên License Plate hoặc ID mới)
                    const newVehicle = vehicleList.find(v => v.licensePlate === payload.licensePlate);
                    if (newVehicle) {
                        elements.selectVehicle.value = newVehicle.vehicleId;
                    }
                }
            } else {
                alert("Lỗi từ server: " + (res.message || "Không thể tạo xe"));
            }
        } catch (err) {
            console.error("Lỗi kết nối:", err);
            alert("Đã xảy ra lỗi khi kết nối với máy chủ.");
        }
    });
}

// 4. Logic Dịch vụ
function initServiceLogic() {
    elements.btnAddService?.addEventListener('click', () => {
        const serviceId = elements.selectService.value;
        if (!serviceId) return;

        const option = elements.selectService.options[elements.selectService.selectedIndex];
        selectedServices.push({
            id: serviceId,
            name: option.text.split(' (')[0],
            price: option.dataset.price
        });

        jobcardUI.renderSelectedServices(elements.servicesBody, selectedServices, (index) => {
            selectedServices.splice(index, 1);
            jobcardUI.renderSelectedServices(elements.servicesBody, selectedServices, this);
        });
    });
}