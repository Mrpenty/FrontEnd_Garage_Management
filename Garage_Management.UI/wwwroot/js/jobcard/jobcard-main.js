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
        sparePartsDisplay: document.getElementById('appointmentSpareParts'),
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

        // --- BẮT ĐẦU VALIDATE ---
        const brandId = elements.brandSelect.value;
        const modelId = elements.modelSelect.value;
        const licensePlate = document.getElementById('newVehiclePlate').value.trim().toUpperCase();
        const year = parseInt(document.getElementById('newVehicleYear').value);
        const currentYear = new Date().getFullYear();

        // 1. Kiểm tra chọn Hãng và Dòng xe
        if (!brandId || !modelId) {
            return alert("Vui lòng chọn đầy đủ Hãng xe và Dòng xe!");
        }

        // 2. Kiểm tra biển số (VD: 30A-12345 hoặc 29-F1 123.45)
        // Regex này chấp nhận các định dạng biển số phổ biến
        const plateRegex = /^[0-9]{2}[A-Z0-9]{1,2}[- ]?[0-9]{4,5}(\.[0-9]{1,2})?$/;
        if (!plateRegex.test(licensePlate)) {
            return alert("Biển số xe không hợp lệ! (VD: 30A12345 hoặc 29F1-12345)");
        }

        // 3. Kiểm tra năm sản xuất
        if (isNaN(year) || year < 1980 || year > currentYear + 1) {
            return alert(`Năm sản xuất phải từ 1980 đến ${currentYear + 1}`);
        }

        const payload = {
            customerId: parseInt(elements.selectedCustomerId.value),
            brandId: parseInt(brandId),
            modelId: parseInt(modelId),
            licensePlate: licensePlate,
            vin: document.getElementById('newVehicleVin')?.value.trim() || "N/A",
            year: year
        };

        const res = await vehicleApi.create(payload);
        if (res.success) {
            alert("Thêm xe thành công!");
            elements.modalAddVehicle.style.display = 'none';
            elements.createVehicleForm.reset();
            
            // Reload dropdown xe
            const vRes = await vehicleApi.getByCustomer(payload.customerId);
            jobcardUI.renderVehicleSelect(elements.selectVehicle, vRes.data.pageData || vRes.data);
            elements.selectVehicle.value = res.data.vehicleId;
        } else {
        alert("Lỗi: " + (res.message || "Biển số xe này đã tồn tại trên hệ thống!"));
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
                Status: "Confirmed" 
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
            
            // GỌI RENDER VÀ TRUYỀN CALLBACK
            jobcardUI.renderAppointmentList(
                elements.appointmentResult,
                list.slice(0, 5),
                (selectedApt) => {
                    // PHẦN NÀY CHỈ CHẠY KHI BẤM NÚT "ÁP DỤNG" TRÊN UI
                    console.log("Đã chọn lịch hẹn:", selectedApt);
                    
                    // 1. Điền dữ liệu vào form
                    applyAppointmentData(selectedApt, elements);
                    
                    // 2. Thêm nút reset nếu cần
                    if (typeof addResetButton === "function") {
                        addResetButton(elements);
                    }
                }
            );

            // 6. Auto highlight / select best
            // if (bestAppointment) {
            //     applyAppointmentData(bestAppointment, elements);
            // }
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
        elements.selectVehicle.innerHTML = '<option value="">-- Chọn xe --</option>';
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

    // Đổ danh sách phụ tùng
    if (elements.sparePartsDisplay) {
        const spareParts = apt.spareParts || apt.appointmentSpareParts || [];
        jobcardUI.renderReadOnlySpareParts(elements.sparePartsDisplay, spareParts);
    }
    
    elements.appointmentResult.innerHTML = `<div class="info-alert success">Đã áp dụng lịch hẹn ngày ${new Date(apt.appointmentDateTime).toLocaleString()}</div>`;
}

//lưu khách mới
function initCustomerLogic(elements) {
    const customerForm = document.getElementById('createCustomerForm');
    const btnSubmit = document.getElementById('btnSubmitNewCustomer');

    customerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // --- BẮT ĐẦU VALIDATE ---
        const fullName = document.getElementById('newCustomerName').value.trim();
        const phone = document.getElementById('newCustomerPhone').value.trim();
        const email = document.getElementById('newCustomerEmail').value.trim();
        
        // 1. Kiểm tra họ tên (Phải có ít nhất 2 từ)
        if (fullName.split(' ').length < 2) {
            return alert("Vui lòng nhập đầy đủ Họ và Tên (VD: Nguyễn Văn A)");
        }

        // 2. Kiểm tra số điện thoại (Định dạng Việt Nam: 10 số, bắt đầu bằng 0)
        const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;
        if (!phoneRegex.test(phone)) {
            return alert("Số điện thoại không hợp lệ! (Phải có 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09)");
        }

        // 3. Kiểm tra Email (Nếu có nhập thì phải đúng định dạng)
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            return alert("Email không đúng định dạng!");
        }
        // --- KẾT THÚC VALIDATE ---

        const nameParts = fullName.split(' ');
        const firstName = nameParts.pop();
        const lastName = nameParts.join(' ');

        const customerData = {
            firstName, lastName,
            phoneNumber: phone,
            email: email || null,
            address: document.getElementById('newCustomerAddress').value.trim() || null
        };

        try {
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Đang lưu...";

            const res = await customerApi.createByReceptionist(customerData);
            if (res.success) {
                alert("Thêm khách hàng thành công!");
                elements.modalAddCustomer.style.display = 'none';
                elements.searchCustomerInput.value = `${fullName} - ${phone}`;
                elements.selectedCustomerId.value = res.data?.customerId || res.customerId;
                customerForm.reset();
                elements.selectVehicle.disabled = false;
                elements.btnOpenAddVehicle.disabled = false;
            } else {
                alert("Lỗi: " + (res.message || "Số điện thoại này có thể đã tồn tại!"));
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server.");
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

        const customerIdNum = Number(elements.selectedCustomerId.value);
        const vehicleIdNum = Number(elements.selectVehicle.value);
        const supervisorIdNum = Number(elements.selectSupervisor.value);
        const appointmentIdNum = Number(currentAppointmentId);

        if (!Number.isFinite(customerIdNum) || customerIdNum <= 0) return alert("CustomerId không hợp lệ!");
        if (!Number.isFinite(vehicleIdNum) || vehicleIdNum <= 0) return alert("VehicleId không hợp lệ!");
        if (!Number.isFinite(supervisorIdNum) || supervisorIdNum <= 0) return alert("SupervisorId không hợp lệ!");

        const payloadJobCard = {
            CustomerId: customerIdNum,
            VehicleId: vehicleIdNum,
            Note: elements.jobCardNote.value,
            SupervisorId: supervisorIdNum
        };

        // Chỉ gửi AppointmentId khi có giá trị hợp lệ để tránh null gây lỗi BE.
        if (Number.isFinite(appointmentIdNum) && appointmentIdNum > 0) {
            payloadJobCard.AppointmentId = appointmentIdNum;
        }

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
                    if (currentAppointmentId) {
                        try {
                            const updateAptPayload = {
                                customerId: customerIdNum,
                                vehicleId: vehicleIdNum,
                                status: 3, // Chuyển sang trạng thái đã tiếp nhận (hoặc 3 tùy BE)
                                updatedBy: 1, // Thay bằng ID user đang đăng nhập nếu có
                                // Các trường dưới đây nên giữ nguyên từ object apt cũ hoặc truyền từ form
                                description: elements.jobCardNote.value 
                            };
                            await Promise.all([
                                appointmentApi.update(currentAppointmentId, updateAptPayload),
                                appointmentApi.updateStatus(currentAppointmentId, 3) 
                            ]);
                            console.log(`Đã chuyển trạng thái lịch hẹn ${currentAppointmentId} sang 3`);
                        } catch (statusErr) {
                            console.error("Lỗi cập nhật trạng thái lịch hẹn:", statusErr);
                            // Không alert lỗi này để tránh làm gián đoạn trải nghiệm vì JobCard đã tạo xong
                        }
                    }
                    alert("Tạo JobCard và thêm dịch vụ thành công!");                 
                    // --- Reset giao diện ---
                    elements.modalJobCard.style.display = 'none';
                    elements.createJobCardForm.reset();
                    selectedServices = [];
                    currentAppointmentId = null;
                    if (elements.sparePartsDisplay) {
                        elements.sparePartsDisplay.innerHTML = '<p class="text-muted small"><i>Chưa chọn lịch hẹn...</i></p>';
                    }
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

// Hàm này dùng để In khi xem chi tiết một JobCard cũ
window.showPrintPreviewFromData = async (input) => {
    let data;
    if (typeof input === 'string') {
        data = JSON.parse(input);
    } else if (typeof input === 'number') {
        const res = await jobcardApi.getById(input);
        data = res.success ? res.data : res;
    }

    if (!data || !data.jobCardId) return alert("Không có dữ liệu!");

    const paper = document.getElementById('printablePaper');
    
    // Tính toán dữ liệu dịch vụ và tổng tiền
    let servicesHtml = '';
    let totalAmount = 0;

    if (data.services && data.services.length > 0) {
        data.services.forEach((srv, index) => {
            totalAmount += srv.price || 0;
            servicesHtml += `
                <tr>
                    <td style="text-align:center">${index + 1}</td>
                    <td>
                        <strong>${srv.serviceName || 'Dịch vụ #' + srv.serviceId}</strong><br>
                        <small style="color: #666;">${srv.description || ''}</small>
                    </td>
                    <td style="text-align:right">${(srv.price || 0).toLocaleString('vi-VN')} đ</td>
                </tr>`;
        });
    }

    paper.innerHTML = `
        <div style="font-family: 'Times New Roman', serif; color: #000; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px;">
                <div>
                    <h3 style="margin:0">GARAGE PRO SERVICE</h3>
                    <p style="margin:0; font-size: 12px;">Đ/C: Số 123 Đường Định Công, Hà Nội</p>
                </div>
                <div style="text-align: right">
                    <strong>Mã phiếu: JC-${data.jobCardId}</strong><br>
                    <small>Ngày: ${new Date(data.startDate).toLocaleDateString('vi-VN')}</small>
                </div>
            </div>

            <h2 style="text-align: center; text-transform: uppercase; margin: 20px 0;">Phiếu Tiếp Nhận & Sửa Chữa</h2>

            <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
                <tr>
                    <td width="15%"><strong>Khách hàng:</strong></td>
                    <td width="35%">${data.customerName || 'Mã KH: ' + data.customerId}</td>
                    <td width="15%"><strong>Biển số:</strong></td>
                    <td width="35%"><strong>${data.licensePlate || 'Xe ID: ' + data.vehicleId}</strong></td>
                </tr>
                <tr>
                    <td><strong>Cố vấn:</strong></td>
                    <td>${data.supervisorName || 'ID: ' + data.supervisorId}</td>
                    <td><strong>Trạng thái:</strong></td>
                    <td>${data.status === 8 ? 'Chờ thanh toán' : 'Đang xử lý'}</td>
                </tr>
                <tr>
                    <td><strong>Ghi chú:</strong></td>
                    <td colspan="3">${data.note || 'Không có'}</td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #eee;">
                        <th style="border: 1px solid #000; padding: 5px;">STT</th>
                        <th style="border: 1px solid #000; padding: 5px;">Nội dung công việc</th>
                        <th style="border: 1px solid #000; padding: 5px;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicesHtml || '<tr><td colspan="3" style="text-align:center">Chưa có dịch vụ</td></tr>'}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="border: 1px solid #000; padding: 5px; text-align: right;"><strong>TỔNG CỘNG:</strong></td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: right; font-weight: bold;">
                            ${totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; text-align: center;">
                <div>
                    <strong>KHÁCH HÀNG</strong><br><br><br><br>
                    <span>(Ký và ghi rõ họ tên)</span>
                </div>
                <div>
                    <strong>CỐ VẤN DỊCH VỤ</strong><br><br><br><br>
                    <span>${data.mechanics?.[0]?.mechanicName || 'Người tiếp nhận'}</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('printPreviewModal').style.display = 'block';
};

// Sửa lại hàm đóng Modal để dùng style.display
window.closePrintModal = () => {
    const modal = document.getElementById('printPreviewModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
};


window.executePrint = () => {
    window.print();
};
