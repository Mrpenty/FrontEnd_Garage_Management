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
        // --- BƯỚC 1: Cập nhật status cho TẤT CẢ phụ tùng ---
        const spPromises = estimate.spareParts.map(sp => {
            const isApproved = selectedSparePartIds.includes(sp.sparePartId);
            return EstimateAPI.updateSparePartStatus(estId, sp.sparePartId, isApproved ? 2 : 3);
        });

        // --- BƯỚC 2: Cập nhật status cho TẤT CẢ dịch vụ ---
        const svPromises = estimate.services.map(sv => {
            const isApproved = selectedServiceIds.includes(sv.serviceId);
            return EstimateAPI.updateServiceStatus(estId, sv.serviceId, isApproved ? 2 : 3);
        });

        // Đợi tất cả các dòng được cập nhật xong
        await Promise.all([...spPromises, ...svPromises]);

        // --- BƯỚC 3: Tính toán trạng thái cuối cùng ---
        const hasAnyApproval = selectedSparePartIds.length > 0 || selectedServiceIds.length > 0;
        const finalStatus = hasAnyApproval ? 7 : 10; 
        const estimateStatus = hasAnyApproval ? 2 : 3; // 2: Duyệt, 3: Từ chối

        // --- BƯỚC 4: Cập nhật status Báo giá ---
        await EstimateAPI.updateEstimateStatus(estId, estimateStatus);

        // --- BƯỚC 5: Nếu có duyệt, thực hiện Sync Phụ tùng ---
        if (hasAnyApproval) {
            const approvedParts = estimate.spareParts.filter(sp => 
                selectedSparePartIds.includes(sp.sparePartId)
            );
            const payload = {
                spareParts: approvedParts.map(sp => ({
                    sparePartId: sp.sparePartId, // Lấy ID thực tế (ví dụ: 8, 9)
                    quantity: sp.quantity,       // Lấy số lượng thực tế (ví dụ: 2, 1)
                    isUnderWarranty: false,      // Hoặc logic bảo hành của bạn
                    note: "Khách đã duyệt từ báo giá #" + estimate.repairEstimateId
                }))
            };
        
            console.log("Payload gửi lên Backend:", payload);

            const syncRes = await EstimateAPI.syncSpareParts(jcId, payload);
    
            if (!syncRes.ok) {
                const errorData = await syncRes.json();
                console.error("Backend từ chối dữ liệu:", errorData.message);
                alert("Lỗi đồng bộ phụ tùng: " + errorData.message);
                return false; // Dừng lại nếu sync thất bại
            }
        }

        // --- BƯỚC 6: Cập nhật Status JobCard chốt hạ ---
        await EstimateAPI.updateJobCardStatus(jcId, finalStatus);

        alert(hasAnyApproval ? "Duyệt báo giá thành công! Garage sẽ bắt đầu sửa chữa." : "Đã từ chối toàn bộ báo giá.");
        return true;

    } catch (error) {
        console.error("Lỗi nghiêm trọng trong luồng duyệt:", error);
        alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
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
                        authUi.renderEstimateView(jcDiv, estimateRes.data[0]);
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
        2: "Đang kiểm tra xe",
        6: "Chờ khách duyệt báo giá",
        7: "Đang sửa chữa",
        10: "Đã hủy"
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