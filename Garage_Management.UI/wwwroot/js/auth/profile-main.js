import { authApi, customerApi, EstimateAPI } from './auth-api.js';
import { authUi } from './auth-ui.js';
import CONFIG from '../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const currentPath = window.location.pathname;
    // 1. Kiểm tra nếu đang ở trang Profile
    const btnViewBookings = document.getElementById('btn-view-bookings');
    if (btnViewBookings) {
        btnViewBookings.onclick = () => {
            window.location.href = 'UserBookings.html';
        };
        loadUserProfile(); // Hàm hiển thị thông tin cá nhân
        const carListContainer = document.getElementById('car-list-body');
        if (carListContainer) {
            loadCustomerVehicles(carListContainer);
        }
        setupProfileEvents();

        //Kiểm tra xem có JobCard nào đang chờ báo giá không
        const jobCardContainer = document.getElementById('jobcard-estimate-container');
        if (jobCardContainer) {
            loadCustomerJobCards(jobCardContainer);
        }
    }

    // 2. Kiểm tra nếu đang ở trang Danh sách lịch hẹn
    const bookingsContainer = document.getElementById('user-bookings-list');
    if (bookingsContainer || currentPath.includes('UserBookings.html')) {
        // Gọi hàm tải dữ liệu ngay khi trang load
        loadCustomerAppointments(bookingsContainer);
    }
});

const ui = authUi.elements;
ui.btnOpenAddVehicle?.addEventListener('click', async () => {
        ui.modalAddVehicle.style.display = 'block';
        // Load danh sách model nếu chưa có
        if (ui.modelSelect.options.length === 0) {
            const res = await customerApi.getVehicleModels(1, 100);
            if (res.success) {
                authUi.renderModelOptions(res.data.pageData);
            }
        }
    });

    // Đóng modal
    ui.btnCloseVehicleModal?.addEventListener('click', () => {
        ui.modalAddVehicle.style.display = 'none';
    });

    // Xử lý nộp form thêm xe
    ui.formAddVehicle?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Lấy thông tin user hiện tại từ Profile (giả sử bạn lưu ở biến global hoặc lấy từ DOM)
        const customerId = localStorage.getItem('customerId'); // Hoặc lấy từ data profile
        const plateInput = document.getElementById('v-plate');
        const modelSelect = document.getElementById('v-model');
        const yearInput = document.getElementById('v-year');
        const vinInput = document.getElementById('v-vin');
        
        const rawPlate = plateInput.value || "";
        const cleanPlate = rawPlate.replace(/\s+/g, '').toUpperCase();

        if (!cleanPlate) {
            msgArea.innerHTML = `<span style="color: red;">Vui lòng nhập biển số xe!</span>`;
            return;
        }

        if (cleanPlate.length > 11) {
            msgArea.innerHTML = `<span style="color: red;">Biển số xe không được vượt quá 11 ký tự!</span>`;
            plateInput.focus();
            return;
        }

        const plateRegex = /^[0-9]{2}[A-Z0-9]{1,2}[- ]?[0-9]{4,5}(\.[0-9]{1,2})?$/;
        if (!plateRegex.test(cleanPlate)) {
            return alert("Biển số xe không hợp lệ! (VD: 30A12345 hoặc 29F1-12345)");
        }

        const vehicleData = {
        customerId: parseInt(customerId),
        modelId: parseInt(modelSelect.value),
        licensePlate: cleanPlate, // Gửi bản đã sạch khoảng trắng
        year: parseInt(yearInput.value),
        vin: vinInput.value.trim(), // VIN cũng nên trim khoảng trắng đầu cuối
        createdBy: parseInt(customerId)
        };

        const res = await customerApi.addVehicle(vehicleData);
        const msgArea = document.getElementById('v-msg');

        try {
            const res = await customerApi.addVehicle(vehicleData);
            if (res.success) {
                msgArea.innerHTML = `<span style="color: green;">Thêm xe thành công!</span>`;
                setTimeout(() => {
                    ui.modalAddVehicle.style.display = 'none';
                    location.reload(); 
                }, 1500);
            } else {
                msgArea.innerHTML = `<span style="color: red;">${res.message}</span>`;
            }
        } catch (error) {
            msgArea.innerHTML = `<span style="color: red;">Lỗi kết nối máy chủ</span>`;
        }
    });
// Hàm chính để tải lịch hẹn
async function loadCustomerAppointments(container) {
    try {
        const res = await customerApi.getMyAppointments(1, 20);
        if (res.success) {
            const appointments = res.data.pageData;
            authUi.renderUserBookings(container, appointments);
        } else {
            container.innerHTML = `<div class="alert alert-danger">${res.message}</div>`;
        }
    } catch (error) {
        console.error("Lỗi tải lịch hẹn:", error);
        container.innerHTML = `<div class="alert alert-danger">Không thể kết nối máy chủ.</div>`;
    }
}

async function handleCancelAppointment(appointmentId) {
    if (!confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) return;

    try {
        // Gọi API Patch để cập nhật status sang 5
        // Lưu ý: Tên hàm updateAppointmentStatus tùy thuộc vào khai báo trong auth-api.js của bạn
        const res = await customerApi.updateAppointmentStatus(appointmentId, 5);

        if (res.success) {
            alert("Đã hủy lịch hẹn thành công.");
            location.reload(); // Load lại trang để cập nhật danh sách
        } else {
            alert("Lỗi: " + (res.message || "Không thể hủy lịch hẹn"));
        }
    } catch (error) {
        console.error("Lỗi khi hủy lịch hẹn:", error);
        alert("Đã có lỗi xảy ra khi kết nối máy chủ.");
    }
}

async function loadCustomerVehicles(container) {
    try {
        const res = await customerApi.getMyVehicles(1, 10);
        
        if (res.success) {
            // Lưu ý: Backend trả về PagedResult nên dữ liệu nằm trong res.data.items hoặc res.data.pageData
            const vehicleList = res.data.items || res.data.pageData || [];
            authUi.renderMyVehicles(container, vehicleList);
        } else {
            console.error("Lỗi lấy danh sách xe:", res.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối API xe:", error);
        container.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Lỗi tải dữ liệu</td></tr>`;
    }
}

// Hàm tải thông tin cá nhân (Dành cho trang Profile.html)
async function loadUserProfile() {
    const result = await customerApi.getProfile();
    if (result.success) {
        authUi.renderProfile(result.data);
    } else if (result.message === "Unauthorized") {
        alert("Phiên đăng nhập hết hạn!");
        localStorage.clear();
        window.location.href = CONFIG.PAGES.LOGIN;
    } else {
        authUi.renderMessage("Không thể tải thông tin hồ sơ", false);
    }
}

// Thiết lập các sự kiện nút bấm trên trang Profile
function setupProfileEvents() {
    // 1. Nút Xem lịch đặt xe
    const btnViewBookings = document.getElementById('btn-view-bookings');
    if (btnViewBookings) {
        btnViewBookings.addEventListener('click', () => {
            const storageData = localStorage.getItem('userInfo'); 
            const userInfo = storageData ? JSON.parse(storageData) : null;
            if (userInfo && userInfo.customerId) {
                // Chuyển hướng sang trang lịch hẹn
                window.location.href = CONFIG.PAGES.MYAPPOINTMENT;
            } else {
                alert("Không tìm thấy mã khách hàng. Vui lòng đăng nhập lại.");
                console.error("Data in localStorage:", userInfo);
            }
        });
    }

    // 2. Các sự kiện Modal Đổi mật khẩu
    if (authUi.elements.btnOpenChangePw) {
        authUi.elements.btnOpenChangePw.addEventListener('click', (e) => {
            e.preventDefault();
            authUi.elements.modalChangePw.style.display = 'block';
        });
    }

    if (authUi.elements.btnCloseModal) {
        authUi.elements.btnCloseModal.addEventListener('click', () => {
            authUi.elements.modalChangePw.style.display = 'none';
            authUi.elements.formChangePw.reset();
            authUi.renderCpwMessage("", true);
        });
    }

    if (authUi.elements.formChangePw) {
        authUi.elements.formChangePw.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                authUi.renderCpwMessage("Xác nhận mật khẩu không khớp!", false);
                return;
            }

            const result = await authApi.changePassword({ oldPassword, newPassword, confirmPassword });
            if (result.success) {
                authUi.renderCpwMessage("Đổi mật khẩu thành công!", true);
                setTimeout(() => {
                    authUi.elements.modalChangePw.style.display = 'none';
                    authUi.elements.formChangePw.reset();
                }, 2000);
            } else {
                authUi.renderCpwMessage(result.message || "Đổi mật khẩu thất bại", false);
            }
        });
    }
}

async function handleCustomerApproval(estimate, selectedSparePartIds, selectedServiceIds) {
    const jcId = estimate.jobCardId;
    const estId = estimate.repairEstimateId;

    try {
        // --- BƯỚC 1 & 2: Cập nhật status trên tờ Báo giá (RepairEstimate) ---
        const spPromises = estimate.spareParts.map(sp => {
            const isApproved = selectedSparePartIds.includes(sp.sparePartId);
            return EstimateAPI.updateSparePartStatus(estId, sp.sparePartId, isApproved ? 2 : 3);
        });
        const svPromises = estimate.services.map(sv => {
            const isApproved = selectedServiceIds.includes(sv.serviceId);
            return EstimateAPI.updateServiceStatus(estId, sv.serviceId, isApproved ? 2 : 3);
        });
        await Promise.all([...spPromises, ...svPromises]);

        // --- BƯỚC 3 & 4: Cập nhật trạng thái tổng của phiếu Báo giá ---
        const hasAnyApproval = selectedSparePartIds.length > 0 || selectedServiceIds.length > 0;
        const estimateStatus = hasAnyApproval ? 2 : 3; 
        await EstimateAPI.updateEstimateStatus(estId, estimateStatus);

        // Lấy dữ liệu JobCard hiện tại
        const customerId = localStorage.getItem('customerId');
        const jcList = await EstimateAPI.getMyJobCard(customerId);
        const currentJC = jcList.find(j => j.jobCardId === jcId);

        if (!currentJC) throw new Error("Không tìm thấy JobCard.");

        // Kiểm tra TH2 (Bổ sung lỗi)
        const hasOnHoldService = currentJC.services && currentJC.services.some(s => s.status === 5);

        // --- BƯỚC 5: ĐỒNG BỘ DỮ LIỆU ---
        
        // 5.1. Xử lý các mục ĐƯỢC DUYỆT MỚI (Nếu có)
        if (hasAnyApproval) {
            // Sync Phụ tùng
            const approvedParts = estimate.spareParts.filter(sp => selectedSparePartIds.includes(sp.sparePartId));
            if (approvedParts.length > 0) {
                const payload = {
                    spareParts: approvedParts.map(sp => ({
                        sparePartId: sp.sparePartId,
                        quantity: sp.quantity,
                        isUnderWarranty: false,
                        note: "Duyệt từ báo giá #" + estId
                    }))
                };
                await EstimateAPI.syncSpareParts(jcId, payload);
            }

            // Sync Dịch vụ mới
            const approvedServices = estimate.services.filter(sv => selectedServiceIds.includes(sv.serviceId));
            if (hasOnHoldService) {
                // TH2: POST thêm dịch vụ mới vào
                const addPromises = approvedServices.map(sv => {
                    return EstimateAPI.syncJobCardServiceSingle({
                        jobCardId: jcId,
                        serviceId: sv.serviceId,
                        description: "Duyệt bổ sung",
                        price: sv.unitPrice || 0,
                        status: 2,
                        sourceInspectionItemId: 0
                    });
                });
                await Promise.all(addPromises);
            } else {
                // TH1: Duyệt lần đầu (Chỉ chạy khi ko có OnHold) - PATCH cái có sẵn
                const patchPromises = estimate.services.map(sv => {
                    const isApproved = selectedServiceIds.includes(sv.serviceId);
                    return EstimateAPI.updateJobCardServiceStatus(jcId, sv.serviceId, isApproved ? 2 : 4);
                });
                await Promise.all(patchPromises);
            }
        } else {
            // NẾU KHÔNG DUYỆT GÌ (hasAnyApproval = false)
            if (!hasOnHoldService) {
                // Và là TH1 (Duyệt lần đầu) -> Phải PATCH sạch về Cancelled (4)
                const cancelPromises = estimate.services.map(sv => 
                    EstimateAPI.updateJobCardServiceStatus(jcId, sv.serviceId, 4)
                );
                await Promise.all(cancelPromises);
            }
        }

        // 5.2. KHÔI PHỤC DỊCH VỤ CŨ (Quan trọng nhất để tránh Status 10)
        // Chạy vô điều kiện nếu là TH2, dù khách có duyệt thêm cái mới hay không
        if (hasOnHoldService) {
            const onHoldServices = currentJC.services.filter(s => s.status === 5);
            const recoverPromises = onHoldServices.map(s => 
                EstimateAPI.updateJobCardServiceStatus(jcId, s.serviceId, 2)
            );
            await Promise.all(recoverPromises);
        }

        // --- BƯỚC 6: CHỐT TRẠNG THÁI JOBCARD ---
        let finalJobCardStatus;
        if (hasOnHoldService) {
            finalJobCardStatus = 7; // Luôn là InProgress vì còn việc cũ đang làm
        } else {
            finalJobCardStatus = hasAnyApproval ? 7 : 10; // Duyệt lần đầu: Ko duyệt = Hủy
        }

        await EstimateAPI.updateJobCardStatus(jcId, finalJobCardStatus);

        alert(hasAnyApproval ? "Duyệt báo giá thành công!" : (hasOnHoldService ? "Đã từ chối các lỗi phát sinh, thợ tiếp tục công việc cũ." : "Đã từ chối báo giá."));
        return true;

    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi xảy ra: " + error.message);
        return false;
    }
}

async function loadCustomerJobCards(container) {
    try {
        const customerId = localStorage.getItem('customerId');
        
        // QUAN TRỌNG: Phải có await ở đây
        const jcResult = await EstimateAPI.getMyJobCard(customerId);

        if (Array.isArray(jcResult) && jcResult.length > 0) {
            container.innerHTML = ''; // Xóa dòng "Đang tải..."
            
            // Duyệt qua tất cả JobCard để hiển thị
            for (const jc of jcResult) {
                // Tạo một div con cho mỗi JobCard
                const jcDiv = document.createElement('div');
                jcDiv.className = 'jobcard-item';
                jcDiv.style.marginBottom = '20px';
                jcDiv.style.padding = '15px';
                jcDiv.style.border = '1px solid #eee';
                jcDiv.style.borderRadius = '8px';
                container.appendChild(jcDiv);

                // Kiểm tra nếu JobCard đang ở trạng thái chờ duyệt (status = 6) thì load báo giá
                if (jc.status === 6) {
                    const estimateRes = await EstimateAPI.getByJobCard(jc.jobCardId);
                    if (estimateRes.success && estimateRes.data.length > 0) {
                        // Chỉ lấy các phiếu báo giá đang chờ duyệt (status = 1)
                        const pendingEstimates = estimateRes.data.filter(est => est.status === 1);
                        pendingEstimates.forEach(est => {
                        const estDiv = document.createElement('div');
                        authUi.renderEstimateView(estDiv, est);
                        jcDiv.appendChild(estDiv);
                    });
                    } else {
                        jcDiv.innerHTML = renderBasicJobCardInfo(jc, "Đang chờ garage lập báo giá...");
                    }
                } else {
                    // Hiển thị thông tin cơ bản cho các JobCard trạng thái khác
                    jcDiv.innerHTML = renderBasicJobCardInfo(jc);
                }
            }
        } else {
            container.innerHTML = `<p style="text-align: center; color: #999; padding: 20px;">Bạn chưa có lượt sửa chữa nào.</p>`;
        }
    } catch (error) {
        console.error("Lỗi tải thông tin báo giá:", error);
        container.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">Lỗi kết nối dữ liệu.</p>`;
    }
}

// Hàm phụ để hiển thị các JobCard không phải trạng thái chờ duyệt
function renderBasicJobCardInfo(jc, customMsg = "") {
    const statusText = {
        1: "Tiếp nhận xe thành công",
        2: "Đang chờ giao thợ",
        3: "Đang chờ thợ kiểm tra",
        4: "Đang kiểm tra",
        5: "Đang xem xét vấn đề",
        6: "Đã có kết quả kiểm tra xe, chờ duyệt",
        7: "Đang sửa chữa",
        8: "Đã sửa xong",
        9: "Thanh toán thành công",
        10: "Đã hủy",
        11: "Không tìm thấy lỗi",
        12: "Đang xem xét vấn đề mới",
    };

    const showProgressBtn = jc.status === 7 || jc.status === 8;

    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="color:#333;">Mã phiếu: #JC${jc.jobCardId}</strong>
                <p style="margin:5px 0; font-size:13px; color:#666;">Ngày tạo: ${new Date(jc.startDate).toLocaleDateString('vi-VN')}</p>
                <p style="margin:0; font-size:14px;">
                    Trạng thái: <span class="badge" style="background:#e3f2fd; color:#1976d2; padding:2px 8px; border-radius:10px;">${statusText[jc.status] || 'Đang xử lý'}</span>
                </p>
                ${showProgressBtn ? `
                    <button class="btn-progress" onclick="handleViewProgress(${jc.jobCardId})" 
                            style="margin-top:10px; background:#1976d2; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-size:12px;">
                        <i class="fa-solid fa-chart-line"></i> Xem tiến độ chi tiết
                    </button>` : ''}
            </div>
            <div style="text-align:right; color:#d32f2f; font-style:italic; font-size:13px;">
                ${customMsg}
            </div>
        </div>
    `;
}

// Hàm gọi API và hiển thị Popup
async function handleViewProgress(jobCardId) {
    const modal = document.getElementById('modalProgress');
    const content = document.getElementById('progressContent');
    
    modal.style.display = 'block';
    content.innerHTML = '<p style="text-align:center;">Đang tải dữ liệu tiến độ...</p>';

    try {
        
        const result = await EstimateAPI.viewProgress(jobCardId);

        if (result.success) {
            const data = result.data;
            content.innerHTML = `
                <div style="background:#f8f9fa; padding:10px; border-radius:6px; margin-bottom:15px;">
                    <p style="margin:5px 0;"><strong>Xe:</strong> ${data.vehicleBrand} ${data.vehicleModel} (${data.vehicleLicensePlate})</p>
                    <p style="margin:5px 0;"><strong>Thợ chính:</strong> ${data.assignedMechanic || 'Chưa phân công'}</p>
                    <p style="margin:5px 0;"><strong>Dự kiến xong:</strong> <span style="color:#d32f2f;">${data.estimatedCompletionTime}</span></p>
                    <div style="margin-top:10px; background:#eee; height:15px; border-radius:10px; overflow:hidden;">
                        <div style="width:${data.progressPercentage}%; background:#28a745; height:100%; transition:0.5s;"></div>
                    </div>
                    <p style="text-align:right; font-size:12px; margin-top:5px;">Hoàn thành: ${data.progressPercentage}%</p>
                </div>

                <div class="progress-steps">
                    ${data.services.map(sv => `
                        <div style="margin-bottom:20px; border-left:3px solid #1976d2; padding-left:15px;">
                            <h5 style="margin:0; color:#1976d2;">${sv.serviceName} 
                                <small style="float:right;">${sv.serviceStatusName}</small>
                            </h5>
                            <p style="font-size:12px; color:#666; margin:5px 0;">${sv.description}</p>
                            
                            <div style="margin-top:10px;">
                                ${sv.tasks.map(task => `
                                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:5px 0; border-bottom:1px dashed #eee;">
                                        <span>
                                            ${task.status === 3 ? '✅' : '⏳'} ${task.taskName}
                                        </span>
                                        <span style="color:#888;">${task.serviceTaskStatusName}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            content.innerHTML = `<p style="color:red;">${result.message}</p>`;
        }
    } catch (error) {
        content.innerHTML = '<p style="color:red;">Lỗi kết nối máy chủ.</p>';
    }
}

// Đưa ra global để button có thể gọi
window.handleViewProgress = handleViewProgress;
window.handleCustomerApproval = handleCustomerApproval;
window.handleCancelAppointment = handleCancelAppointment;