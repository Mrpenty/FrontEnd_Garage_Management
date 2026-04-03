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

        const vehicleData = {
            customerId: parseInt(customerId),
            modelId: parseInt(document.getElementById('v-model').value),
            licensePlate: document.getElementById('v-plate').value,
            year: parseInt(document.getElementById('v-year').value),
            vin: document.getElementById('v-vin').value,
            createdBy: parseInt(customerId)
        };

        const res = await customerApi.addVehicle(vehicleData);
        const msgArea = document.getElementById('v-msg');

        if (res.success) {
            msgArea.innerHTML = `<span style="color: green;">Thêm xe thành công!</span>`;
            setTimeout(() => {
                ui.modalAddVehicle.style.display = 'none';
                location.reload(); // Load lại để thấy xe mới
            }, 1500);
        } else {
            msgArea.innerHTML = `<span style="color: red;">${res.message}</span>`;
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
    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="color:#333;">Mã phiếu: #JC${jc.jobCardId}</strong>
                <p style="margin:5px 0; font-size:13px; color:#666;">Ngày tạo: ${new Date(jc.startDate).toLocaleDateString('vi-VN')}</p>
                <p style="margin:0; font-size:14px;">Trạng thái: <span class="badge" style="background:#e3f2fd; color:#1976d2; padding:2px 8px; border-radius:10px;">${statusText[jc.status] || 'Đang xử lý'}</span></p>
            </div>
            <div style="text-align:right; color:#d32f2f; font-style:italic; font-size:13px;">
                ${customMsg}
            </div>
        </div>
    `;
}

window.handleCustomerApproval = handleCustomerApproval;