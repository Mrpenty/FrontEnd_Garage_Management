import { vehicleApi, serviceApi, jobcardApi, customerApi, appointmentApi } from './jobcard-api.js';
import { jobcardUI } from './jobcard-ui.js';

// --- State Management (Dùng để lưu trữ tạm thời khi tạo JobCard) ---
let selectedServices = [];
let allModels = [];
let currentAppointmentId = null;

export async function initJobCardModule() {
    const mainContent = document.getElementById('main-display');
    
    // 1. Render Layout khung (Stats + Table)
    jobcardUI.renderDashboardLayout(mainContent);

    // 2. Khai báo Elements sau khi Layout đã được render vào DOM
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
        createVehicleForm: document.getElementById('createVehicleForm'),
        createJobCardForm: document.getElementById('createJobCardForm'),
        createCustomerForm: document.getElementById('createCustomerForm'),
        jobCardBody: document.getElementById('job-card-body'),
        btnCheckAppointment: document.getElementById('btnCheckAppointment'),
        checkPhoneInput: document.getElementById('checkPhone'),
        appointmentResult: document.getElementById('appointmentResult'),
        jobCardNote: document.getElementById('jobCardNote'),
        selectSupervisor: document.getElementById('selectSupervisor')
    };

    // 3. Khởi tạo các Logic sự kiện
    initModalEvents(elements);
    initCustomerSearch(elements);
    initVehicleLogic(elements);
    initServiceLogic(elements);
    initAppointmentCheck(elements);
    initJobCardSubmit(elements);
    initCustomerLogic(elements);
    // 4. Tải dữ liệu ban đầu cho Dashboard
    loadDashboardStats(); // Hàm tải các số liệu "Xe đang làm", "Doanh thu"...
    loadJobCards(elements.jobCardBody);
    loadSupervisor(elements.selectSupervisor); // Đổ dữ liệu vào select supervisor
    loadServiceList(elements.selectService);
}

// --- CHI TIẾT CÁC HÀM LOGIC ---

async function loadJobCards(tbody) {
    try {
        const res = await jobcardApi.getAll({ PageIndex: 1, PageSize: 20 });
        const items = res.pageData || (res.data?.pageData) || (Array.isArray(res) ? res : []);
        console.log("Dữ liệu nhận được:", items);
        jobcardUI.renderJobCardTable(tbody, items);
        initTableActions(tbody);
    } catch (err) {
        console.error("Lỗi tải danh sách JobCard:", err);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="color:red">Lỗi kết nối server</td></tr>`;
    }
}

async function loadSupervisor(selectElement) {
    try {
        const res = await jobcardApi.getSupervisors();
        // Cấu trúc BE: { success: true, data: { pageData: [...] } }
        const supervisors = res.data?.pageData || [];
        
        // Gọi UI render
        jobcardUI.renderSupervisorSelect(selectElement, supervisors);
    } catch (err) {
        console.error("Lỗi tải Supervisor:", err);
    }
}

async function loadServiceList(selectElement) {
    try {
        const res = await serviceApi.getServices();
        // Cấu trúc BE: { success: true, data: { pageData: [...] } }
        const services = res.data?.pageData || [];
        
        // Gọi UI render
        jobcardUI.renderServiceSelect(selectElement, services);
    } catch (err) {
        console.error("Lỗi tải dịch vụ:", err);
    }
}

// Hàm xử lý khi bấm nút View/Detail
function initTableActions(tbody) {
    tbody.querySelectorAll('.btn-action.view').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const res = await jobcardApi.getById(id);
            
            // Backend của bạn trả về Object trực tiếp, 
            // nên ta kiểm tra res hoặc res.data tùy theo cách jobcardApi.getById được viết
            const data = res.success ? res.data : res; 

            if (data && data.jobCardId) {
                // Bước 1: Tìm container modal (giả sử ID là jobCardModal)
                const modalContainer = document.getElementById('jobCardDetailModal');
                if (!modalContainer) return console.error("Không tìm thấy div #jobCardModal");

                // Bước 2: Gọi hàm render từ jobcardUI và gán vào HTML
                modalContainer.innerHTML = jobcardUI.renderJobCardDetailModal(data);
                
                // Bước 3: Hiển thị modal
                modalContainer.style.display = 'block';

                // Bước 4: Gán sự kiện đóng modal (X và nút Đóng)
                modalContainer.querySelectorAll('.close-modal').forEach(closeBtn => {
                    closeBtn.onclick = () => modalContainer.style.display = 'none';
                });
            } else {
                alert("Không thể tải thông tin chi tiết!");
            }
        };
    });
}

async function loadDashboardStats() {
    // Gọi API để lấy số liệu thống kê và cập nhật vào các ID: stat-working, stat-today...
    // Phần này bạn có thể bổ sung tùy theo API backend của bạn
}

function initModalEvents(elements) {
    // 1. Nút mở Modal Tạo JobCard
    elements.btnCreateJobCard?.addEventListener('click', async () => {
        elements.modalJobCard.style.display = "block";
        // ... (giữ nguyên logic reset và load dữ liệu của bạn)
    });

    // 2. Nút mở Modal Thêm khách hàng (MỚI)
    elements.btnOpenAddCustomer?.addEventListener('click', () => {
        elements.modalAddCustomer.style.display = "block";
    });

    // 3. Nút mở Modal Thêm xe (MỚI - logic check khách hàng đã có trong initVehicleLogic)
    // Lưu ý: Đảm bảo btnOpenAddVehicle đã được khai báo trong elements
    elements.btnOpenAddVehicle?.addEventListener('click', () => {
        if (!elements.selectedCustomerId.value) {
            return alert("Vui lòng chọn khách hàng trước!");
        }
        elements.modalAddVehicle.style.display = 'block';
    });

    // 4. Xử lý đóng tất cả các modal
    document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
        btn.onclick = (e) => {
            const m = e.target.closest('.modal');
            if (m) m.style.display = 'none';
        };
    });
}

//tìm kiếm khách hàng
function initCustomerSearch(elements) {
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
                jobcardUI.renderCustomerSearchResults(elements.customerSearchResults, res.data.pageData, async (id, name, phone) => {
                    elements.selectedCustomerId.value = id;
                    elements.searchCustomerInput.value = `${name} - ${phone}`;
                    
                    const vRes = await vehicleApi.getBySearch(phone);
                    if (vRes.success) {
                        jobcardUI.renderVehicleSelect(elements.selectVehicle, vRes.data.pageData || vRes.data);
                        elements.btnOpenAddVehicle.disabled = false;
                    }
                });
            }
        }, 400);
    });
}

function initVehicleLogic(elements) {
    elements.btnOpenAddVehicle?.addEventListener('click', async () => {
        if (!elements.selectedCustomerId.value) return alert("Vui lòng chọn khách hàng trước!");
        elements.modalAddVehicle.style.display = 'block';
        const [brandRes, modelRes] = await Promise.all([vehicleApi.getBrands(), vehicleApi.getModels()]);
        if (brandRes.success) jobcardUI.renderBrandSelect(elements.brandSelect, brandRes.data.pageData || brandRes.data);
        if (modelRes.success) allModels = modelRes.data.pageData || modelRes.data;
    });

    elements.brandSelect?.addEventListener('change', (e) => {
        const brandId = parseInt(e.target.value);
        const filtered = allModels.filter(m => (m.brandId || m.BrandId) === brandId);
        jobcardUI.renderModelSelect(elements.modelSelect, filtered);
    });

    elements.createVehicleForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            customerId: parseInt(elements.selectedCustomerId.value),
            brandId: parseInt(elements.brandSelect.value),
            modelId: parseInt(elements.modelSelect.value),
            licensePlate: document.getElementById('newVehiclePlate').value.trim().toUpperCase(),
            vin: document.getElementById('newVehicleVin')?.value.trim() || "N/A",
            year: parseInt(document.getElementById('newVehicleYear').value) || new Date().getFullYear()
        };

        const res = await vehicleApi.create(payload);
        if (res.success) {
            alert("Thêm xe thành công!");
            elements.modalAddVehicle.style.display = 'none';
            // Cập nhật lại dropdown xe
            const vRes = await vehicleApi.getByCustomer(payload.customerId);
            jobcardUI.renderVehicleSelect(elements.selectVehicle, vRes.data.pageData || vRes.data);
            elements.selectVehicle.value = res.data.vehicleId;
        }
    });
}

function initServiceLogic(elements) {
    elements.btnAddService?.addEventListener('click', () => {
        const serviceId = elements.selectService.value;
        if (!serviceId) return;

        const option = elements.selectService.options[elements.selectService.selectedIndex];
        if (selectedServices.some(s => s.id == serviceId)) return alert("Dịch vụ này đã có");

        selectedServices.push({
            id: serviceId,
            name: option.text.split(' (')[0],
            description: option.dataset.description
        });
        renderServiceTable(elements);
    });
}

function renderServiceTable(elements) {
    jobcardUI.renderSelectedServices(elements.servicesBody, selectedServices, (index) => {
        selectedServices.splice(index, 1);
        renderServiceTable(elements);
    });
}

async function getBusyAppointmentIds() {
    try {
        const res = await jobcardApi.getAll({ PageIndex: 1, PageSize: 1000 });
        const jobcards = res.pageData || res.data?.pageData || (Array.isArray(res) ? res : []);

        return new Set(
            jobcards
                .filter(jc => jc.appointmentId != null)
                .map(jc => jc.appointmentId)
        );
    } catch (err) {
        console.error("getBusyAppointmentIds error:", err);
        return new Set();
    }
}

function initAppointmentCheck(elements) {
    elements.btnCheckAppointment?.addEventListener('click', async () => {
        const phone = elements.checkPhoneInput.value.trim();
        if (!phone) return alert("Vui lòng nhập số điện thoại!");

        try {
            elements.appointmentResult.innerHTML = "<em>Đang tìm kiếm mã...</em>";
            elements.appointmentResult.style.display = "block";

           // 1. Gọi API lấy danh sách theo SĐT
            const [aptRes, busyAptIds] = await Promise.all([
                appointmentApi.getAll({
                Search: phone, 
                Page: 1,  
                PageSize: 20,
                Status: "InProgress" 
            }),
                getBusyAppointmentIds()
            ]);

            let list = aptRes.pageData || (aptRes.data?.pageData) || (Array.isArray(aptRes) ? aptRes : []);

            if (!list || list.length === 0) {
                elements.appointmentResult.innerHTML = `<div class="info-alert error">Không tìm thấy lịch hẹn.</div>`;
                return;
            }

             // 2. Filter: loại Completed + đã có JobCard
            list = list.filter(apt => {
                const isCompleted = apt.status === "Completed";
                const isBusy = busyAptIds.has(apt.appointmentId)
                return !isCompleted && !isBusy;
            });

            if (list.length === 0) {
                elements.appointmentResult.innerHTML = `<div class="info-alert warning">Không có lịch hẹn hợp lệ.</div>`;
                return;
            }
            
            // 3. Sort: gần ngày hiện tại nhất (ưu tiên future)
            const now = Date.now();

            list.sort((a, b) => {
                const timeA = new Date(a.appointmentDate).getTime();
                const timeB = new Date(b.appointmentDate).getTime();

                const isFutureA = timeA >= now;
                const isFutureB = timeB >= now;

                // Ưu tiên future
                if (isFutureA !== isFutureB) {
                    return isFutureA ? -1 : 1;
                }

                // Cùng future hoặc cùng past → so khoảng cách
                return Math.abs(timeA - now) - Math.abs(timeB - now);
            });

            // 4. Lấy best appointment
            const bestAppointment = list[0];
            
             // 5. Render list (top 5 cho dễ nhìn)
            jobcardUI.renderAppointmentList(
                elements.appointmentResult,
                list.slice(0, 5),
                (selectedApt) => {
                    applyAppointmentData(selectedApt, elements);
                    addResetButton(elements);
                }
            );

            // 6. Auto highlight / select best
            if (bestAppointment) {
                applyAppointmentData(bestAppointment, elements);
            }
        } catch (err) {
            elements.appointmentResult.innerHTML = `<div class="info-alert error">Lỗi hệ thống khi tìm mã.</div>`;
        }
    });
}

// Render dữ liệu vào form nếu có
async function applyAppointmentData(apt, elements) {
    currentAppointmentId = apt.appointmentId;
    
    // Điền thông tin khách hàng từ object 'customer' trong JSON của bạn
    if (apt.customer) {
        elements.selectedCustomerId.value = apt.customer.customerId;
        elements.searchCustomerInput.value = `${apt.customer.lastName} ${apt.customer.firstName} - ${apt.customer.phoneNumber}`;
    }

    // Điền thông tin xe
    if (apt.vehicle) {
        // Giả sử selectVehicle là một select box, bạn cần trigger thay đổi
        // Hoặc thêm option vào select và select nó
        const option = new Option(`${apt.vehicle.licensePlate} - ${apt.vehicle.modelName}`, apt.vehicle.vehicleId);
        elements.selectVehicle.add(option);
        elements.selectVehicle.value = apt.vehicle.vehicleId;
        elements.selectVehicle.disabled = false;
    }

    elements.jobCardNote.value = apt.description || "";

    // Đổ danh sách dịch vụ
    if (apt.services && apt.services.length > 0) {
        selectedServices = apt.services.map(s => ({
            id: s.serviceId,
            name: s.serviceName,
            description: s.description
        }));
        renderServiceTable(elements);
    }
    
    elements.appointmentResult.innerHTML = `<div class="info-alert success">Đã áp dụng lịch hẹn ngày ${new Date(apt.appointmentDateTime).toLocaleString()}</div>`;
}

//lưu khách mới
function initCustomerLogic(elements) {
    const customerForm = document.getElementById('createCustomerForm');
    const btnSubmit = document.getElementById('btnSubmitNewCustomer');

    customerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('newCustomerName').value.trim();
        const nameParts = fullName.split(' ');
        const firstName = nameParts.length > 1 ? nameParts.pop() : fullName;
        const lastName = nameParts.join(' ') || "";
        // 1. Thu thập dữ liệu từ form
        const customerData = {
            firstName: firstName,
            lastName: lastName,
            phoneNumber: document.getElementById('newCustomerPhone').value.trim(),
            email: document.getElementById('newCustomerEmail').value.trim() || null,
            address: document.getElementById('newCustomerAddress').value.trim() || null
        };

        try {
            // Vô hiệu hóa nút để tránh double-click
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Đang lưu...";

            // 2. Gửi API
            const res = await customerApi.createByReceptionist(customerData);

            if (res.success) {
                alert("Thêm khách hàng thành công!");
                
                // 3. Cập nhật UI: Đóng modal và điền thông tin vào ô tìm kiếm chính
                elements.modalAddCustomer.style.display = 'none';
                elements.searchCustomerInput.value = `${fullName} - ${customerData.phoneNumber}`;
                
                // Giả sử API trả về ID của khách hàng mới tạo trong res.data hoặc res.customerId
                const newCustomerId = res.data?.customerId || res.customerId;
                elements.selectedCustomerId.value = newCustomerId;

                // Reset form
                customerForm.reset();

                // Kích hoạt lại các nút chọn xe
                elements.selectVehicle.disabled = false;
                elements.btnOpenAddVehicle.disabled = false;
            } else {
                alert("Lỗi: " + (res.message || "Không thể tạo khách hàng"));
            }
        } catch (err) {
            console.error("Lỗi khi thêm khách:", err);
            alert("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Lưu Khách Hàng";
        }
    });
}

function initJobCardSubmit(elements) {
    elements.createJobCardForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (selectedServices.length === 0) return alert("Vui lòng chọn ít nhất 1 dịch vụ!");
        const customerId = elements.selectedCustomerId.value;
        const vehicleId = elements.selectVehicle.value;
        const supervisorId = elements.selectSupervisor.value;
        if (!customerId) return alert("Vui lòng chọn khách hàng!");
        if (!vehicleId) return alert("Vui lòng chọn xe!");
        if (!supervisorId) return alert("Vui lòng chỉ định Supervisor (Bắt buộc)!");

        const payloadJobCard = {
            // AppointmentId: currentAppointmentId ? parseInt(currentAppointmentId) : null,
            AppointmentId: null,
            CustomerId: parseInt(elements.selectedCustomerId.value),
            VehicleId: parseInt(elements.selectVehicle.value),
            Note: elements.jobCardNote.value,
            SupervisorId: parseInt(elements.selectSupervisor.value) || null
        };

        try {
            const res = await jobcardApi.create(payloadJobCard);
            if (res && res.jobCardId) {
                console.log("Tạo JobCard vỏ thành công, ID:", res.jobCardId);
                const newJobCardId = res.jobCardId;
                const servicePromises = selectedServices.map(srv => {
                    return jobcardApi.addService(newJobCardId, {
                        ServiceId: parseInt(srv.id),
                        Description: srv.description || ""
                    });
                });

                // Chạy tất cả các lệnh add service cùng lúc
                const results = await Promise.all(servicePromises);

                if (results.every(r => r === true)) {
                    alert("Tạo JobCard và thêm dịch vụ thành công!");
                    // --- Reset giao diện ---
                    elements.modalJobCard.style.display = 'none';
                    elements.createJobCardForm.reset();
                    selectedServices = [];
                    currentAppointmentId = null;
                    renderServiceTable(elements); // Xóa bảng dịch vụ trên UI
                    loadJobCards(elements.jobCardBody); // Reload danh sách chính
                } else {
                    alert("JobCard đã tạo (ID: " + newJobCardId + ") nhưng có lỗi khi thêm dịch vụ.");
                }
            } else {
                alert("Lỗi từ hệ thống: " + (res.message || "Không nhận được ID từ máy chủ"));            }
        } catch (error) {
            console.error("Lỗi Submit:", error);

            const message =
                error.response?.data?.message ||
                error.response?.data ||
                "Đã xảy ra lỗi khi kết nối máy chủ.";
            alert(message);
        }
    });
}

// Gán các hàm vào window để HTML onclick có thể gọi được
window.showPrintPreview = () => {
    const customer = document.getElementById('searchCustomerInput').value || "---";
    const phone = document.getElementById('checkPhone').value || "---";
    const vehicle = document.getElementById('selectVehicle').options[document.getElementById('selectVehicle').selectedIndex]?.text || "---";
    const note = document.getElementById('jobCardNote').value || "Không có ghi chú";
    
    let servicesHtml = '';
    document.querySelectorAll('#selectedServicesBody tr:not(.empty-row)').forEach((tr, index) => {
        servicesHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${tr.cells[0].innerText}</td>
                <td>${tr.cells[1].innerText}</td>
            </tr>`;
    });

    const paper = document.getElementById('printablePaper');
    paper.innerHTML = `
        <div class="print-header">
            <div class="print-logo">GARAGE PRO</div>
            <div>Mã số: <strong>JC-${Date.now().toString().slice(-6)}</strong></div>
        </div>
        <div class="print-title">
            <h2>Phiếu Tiếp Nhận Sửa Chữa</h2>
            <p>Ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <div class="print-info-grid">
            <div><strong>Khách hàng:</strong> ${customer}</div>
            <div><strong>Điện thoại:</strong> ${phone}</div>
            <div><strong>Phương tiện:</strong> ${vehicle}</div>
        </div>
        <table class="print-table">
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Dịch vụ</th>
                    <th>Mô tả</th>
                </tr>
            </thead>
            <tbody>
                ${servicesHtml || '<tr><td colspan="3" style="text-align:center">Chưa chọn dịch vụ</td></tr>'}
            </tbody>
        </table>
        <p><strong>Ghi chú:</strong> ${note}</p>
    `;

    document.getElementById('printPreviewModal').classList.add('show');
};

window.closePrintModal = () => {
    document.getElementById('printPreviewModal').classList.remove('show');
};

window.executePrint = () => {
    window.print();
};