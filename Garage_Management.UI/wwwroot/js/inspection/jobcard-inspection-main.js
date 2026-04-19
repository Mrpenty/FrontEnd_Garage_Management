import { jobCardApi } from './jobcard-inspection-api.js';
import { jobCardUI } from './jobcard-inspection-ui.js';
import '../repairation/jobcard-repairation-main.js';

let selectedParts = [];
let selectedServices = [];

const MechanicStatus = { 
    Assigned: 1, 
    InProgress: 2, 
    Completed: 3, 
    OnHold: 4 
};

const JobCardStatus = { 
    Created: 1,
    WaitingInspection: 3,
    Inspection: 4, 
    WaitingApproval: 5,
    InProgress: 7, 
    Completed: 9 
};

async function initDashboard() {
    try {
        const pageData = await jobCardApi.getJobsForMechanic();
        const safeData = pageData || [];
        
        // Cột phải: InProgress (2) hoặc OnHold (4)
        const repairingJobs = safeData.filter(j => 
            j.mechanicAssignmenStatus === 2 || j.mechanicAssignmenStatus === 4
        );
        const currentJob = repairingJobs[0];
        const hasActiveJob = repairingJobs.length > 0;

        if (currentJob) {
            // Nạp linh kiện cũ (nếu có)
            selectedParts = currentJob.appointmentSpareParts?.map(p => ({
                sparePartId: p.sparePartId,
                name: p.partName,
            })) || [];

            // Nạp dịch vụ khách chọn trước
            selectedServices = currentJob.services?.map(s => ({
                serviceId: s.serviceId,
                name: s.serviceName
            })) || [];
        }

        // Cột trái: Assigned (1) -> Đã phân công nhưng chưa bắt đầu
        const waitingJobs = safeData.filter(j => j.mechanicAssignmenStatus === 1);
        const nextJob = sortNextJob(waitingJobs);
        jobCardUI.renderNextJob(nextJob, hasActiveJob);

        // Hiển thị job đầu tiên đang làm (nếu có)
        await jobCardUI.renderRepairingJob(repairingJobs[0]);
        renderPartList();
        renderServiceList();

        if ($('#select-sparepart').length > 0) $('#select-sparepart').select2({ placeholder: "Chọn linh kiện..." });
        const allServices = await jobCardApi.getServices(); 
        const allServicesMaster = allServices?.data?.pageData || [];
            $('#select-service').select2({
            data: allServicesMaster.map(s => ({ id: s.serviceId, text: s.serviceName })),
            placeholder: "Chọn thêm dịch vụ...",
            width: '100%',
            allowClear: true
        }).val(null).trigger('change');

        // 3. Thống kê (Sử dụng đúng Enum MechanicAssignmentStatus)
        jobCardUI.updateStats({
            waiting: waitingJobs.length,
            repairing: repairingJobs.length,
            completed: safeData.filter(j => j.mechanicAssignmenStatus === 3).length // Completed (3)
        });

    } catch (error) {
        console.error("Lỗi khởi tạo Dashboard:", error);
    }
}

function sortNextJob(jobs) {
    if (jobs.length === 0) return null;
    return jobs.sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0))[0];
}

// Gán hàm vào window để gọi được từ onclick trong HTML string
window.handleStartJob = async (id) => {
    if(confirm("Bắt đầu thực hiện kiểm tra xe này?")) {
        try {
            // Chạy song song cả 2 API cập nhật
            const [resJobCard, resMechanic] = await Promise.all([
                jobCardApi.updateJobCardStatus(id, JobCardStatus.Inspection),
                jobCardApi.updateMechanicStatus(id, MechanicStatus.InProgress)
            ]);

            if (resJobCard && resMechanic) {
                location.reload();
            } else {
                alert("Có lỗi xảy ra khi cập nhật trạng thái.");
            }
        } catch (error) {
            console.error("Lỗi Start Job:", error);
        }
    }
};

window.renderPartList = () => {
    const body = document.getElementById('estimate-parts-body');
    if (!body) return;
    
    body.innerHTML = selectedParts.map((p, index) => `
        <tr>
            <td style="font-weight: 500;">${p.name}</td>
            <td style="text-align:center;">
                <span class="badge-task">${1}</span>
            </td>
            <td style="text-align:right;">
                <button class="btn-secondary" onclick="window.removePart(${index})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');
};
//Thêm phụ tùng vào 
window.addPartRow = () => {
    const select = $('#select-sparepart'); // Dùng jQuery cho đồng bộ với Select2
    const qtyInput = document.getElementById('input-qty');
    const qty = parseInt(qtyInput.value);
    
    const partId = parseInt(select.val());
    if (!partId || qty <= 0) {
        alert("Vui lòng chọn linh kiện và nhập số lượng hợp lệ!");
        return;
    }

    const partName = select.find('option:selected').text();

    // Kiểm tra trùng lặp
    const existing = selectedParts.find(p => p.sparePartId === partId);
    if (existing) {
        existing.quantity += qty;
    } else {
        selectedParts.push({ sparePartId: partId, quantity: qty, name: partName });
    }

    renderPartList();
    
    // Reset input số lượng và xóa lựa chọn ở select (về placeholder)
    qtyInput.value = 1;
    select.val(null).trigger('change'); 
};

window.removePart = (index) => {
    selectedParts.splice(index, 1);
    renderPartList();
};

window.handleSubmitEstimate = async (jobCardId) => {
    const noteElement = document.getElementById('estimate-note');
    const note = noteElement ? noteElement.value : "";
    
    if (selectedServices.length === 0) {
        alert("Vui lòng chọn ít nhất một dịch vụ thực hiện.");
        return;
    }

    // Kiểm tra ghi chú (Tránh việc thợ gửi note trống)
    if (!note.trim() || note.trim().length < 10) {
        alert("Vui lòng nhập ghi chú kiểm tra chi tiết (tối thiểu 10 ký tự) để Supervisor dễ dàng duyệt.");
        return;
    }

    if (!confirm("Xác nhận gửi báo giá? Sau khi gửi, bạn sẽ chờ Supervisor duyệt để bắt đầu sửa chữa.")) return;

    // 3. Tạo Object Request đúng định dạng JSON bạn yêu cầu
    const request = {
        jobCardId: jobCardId,
        note: note,
        services: selectedServices.map(s => ({
            serviceId: s.serviceId,
            quantity: 1
        })),
        spareParts: selectedParts.map(p => ({ 
            sparePartId: p.sparePartId, 
            quantity: p.quantity 
        }))
    };

    console.log("Dữ liệu gửi đi:", request);

    try {
        const ok = await jobCardApi.submitRepairEstimate(request);
        if (ok) {
            alert("Đã gửi báo giá! Vui lòng chờ Supervisor và Khách hàng duyệt.");
            const isUpdateOk = await jobCardApi.updateJobCardStatus(jobCardId, 5);
            if (isUpdateOk) {
                alert("Đã gửi báo giá thành công!");
                location.reload();
            } else {
                alert("Báo giá đã gửi nhưng không thể cập nhật trạng thái JobCard.");
            }
            selectedParts = []; // Reset mảng linh kiện
            location.reload();
        } else {
            alert("Gửi báo giá thất bại. Vui lòng thử lại.");
        }
    } catch (error) {
        console.error("Lỗi khi gửi báo giá:", error);
    }
};

window.renderServiceList = () => {
    const body = document.getElementById('estimate-services-body');
    if (!body) return;
    
    body.innerHTML = selectedServices.map((s, index) => `
        <tr>
            <td>${s.name}</td>
            <td style="text-align:right;">
                <button class="btn-secondary" onclick="window.removeService(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

window.addServiceRow = () => {
    const select = $('#select-service');
    const serviceId = parseInt(select.val());
    if (!serviceId) return;

    // Lấy text chuẩn từ Select2
    const serviceName = select.find('option:selected').text();

    if (selectedServices.find(s => s.serviceId === serviceId)) {
        alert("Dịch vụ này đã có trong danh sách");
        return;
    }

    selectedServices.push({ serviceId, name: serviceName });
    renderServiceList();
    select.val(null).trigger('change');
};

window.removeService = (index) => {
    selectedServices.splice(index, 1);
    renderServiceList();
};

window.handleNoFaultFound = async (id) => {
    const note = document.getElementById('estimate-note')?.value || "";
    
    // Yêu cầu thợ nhập lý do tại sao không tìm thấy lỗi
    if (!note.trim() || note.trim().length < 5) {
        alert("Vui lòng ghi chú ngắn gọn tình trạng xe (Ví dụ: Xe hoạt động bình thường, không phát hiện hỏng hóc) vào ô Ghi chú.");
        document.getElementById('estimate-note').focus();
        return;
    }

    if (!confirm("Xác nhận kết thúc kiểm tra: Không tìm thấy lỗi phát sinh?")) return;

    try {
        Swal.fire({ title: 'Đang xử lý...', didOpen: () => Swal.showLoading() });

        // 1. Cập nhật JobCard sang trạng thái 11 (Không tìm thấy lỗi)
        // 2. Cập nhật trạng thái thợ sang 3 (Hoàn thành/Sẵn sàng)
        const [resJobCard, resMechanic] = await Promise.all([
            jobCardApi.updateJobCardStatus(id, 11), 
            jobCardApi.updateMechanicStatus(id, 3)
        ]);

        if (resJobCard && resMechanic) {
            await Swal.fire({
                icon: 'success',
                title: 'Đã hoàn tất',
                text: 'Hệ thống ghi nhận không có lỗi. Xe sẽ được chuyển về trạng thái chờ bàn giao.',
                timer: 2000
            });
            location.reload();
        } else {
            alert("Có lỗi xảy ra khi cập nhật trạng thái lên hệ thống.");
        }
    } catch (error) {
        console.error("Lỗi NoFaultFound:", error);
        alert("Lỗi kết nối server.");
    }
};

document.addEventListener('DOMContentLoaded', initDashboard);
