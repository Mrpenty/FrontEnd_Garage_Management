import { jobCardApi } from './jobcard-inspection-api.js';
import { jobCardUI } from './jobcard-inspection-ui.js';

let selectedParts = [];
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
    InProgress: 7, 
    Completed: 9 
};

async function initDashboard() {
    try {
        const pageData = await jobCardApi.getJobsForMechanic();
        const safeData = pageData || [];

        // 1. Cột trái: Assigned (1) -> Đã phân công nhưng chưa bắt đầu
        const waitingJobs = safeData.filter(j => j.mechanicAssignmenStatus === 1);
        const nextJob = sortNextJob(waitingJobs);
        jobCardUI.renderNextJob(nextJob);

        // 2. Cột phải: InProgress (2) hoặc OnHold (4)
        const repairingJobs = safeData.filter(j => 
            j.mechanicAssignmenStatus === 2 || j.mechanicAssignmenStatus === 4
        );
        // Hiển thị job đầu tiên đang làm (nếu có)
        jobCardUI.renderRepairingJob(repairingJobs[0]);

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
    const now = new Date();
    
    return jobs.sort((a, b) => {
        // Ưu tiên có lịch hẹn
        if (a.appointmentId && !b.appointmentId) return -1;
        if (!a.appointmentId && b.appointmentId) return 1;
        // Ưu tiên thời gian gần nhất
        return Math.abs(new Date(a.jobCardStartDate) - now) - Math.abs(new Date(b.jobCardStartDate) - now);
    })[0];
}

window.renderPartList = () => {
    const body = document.getElementById('estimate-parts-body');
    if (!body) return; // Tránh lỗi nếu đang ở màn hình khác
    
    body.innerHTML = selectedParts.map((p, index) => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${p.name}</td>
            <td style="padding: 8px; text-align:center;">${p.quantity}</td>
            <td style="padding: 8px; text-align:right;">
                <button onclick="window.removePart(${index})" style="color:red; border:none; background:none;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

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

window.handleCompleteJob = async (id) => {
    if(confirm("Xác nhận hoàn thành?")) {
        const ok = await jobCardApi.updateStatus(id, 8); // Giả định 8 là hoàn thành sửa chữa
        if(ok) location.reload();
    }
};

window.addPartRow = () => {
    const select = document.getElementById('select-sparepart');
    const qty = parseInt(document.getElementById('input-qty').value);
    const partId = parseInt(select.value);
    const partName = select.options[select.selectedIndex].text;

    if (qty <= 0) return;

    selectedParts.push({ sparePartId: partId, quantity: qty, name: partName });
    renderPartList();
};

window.removePart = (index) => {
    selectedParts.splice(index, 1);
    renderPartList();
};

window.handleSubmitEstimate = async (jobCardId) => {
    const noteElement = document.getElementById('estimate-note');
    const note = noteElement ? noteElement.value : "";
    
    // 1. Lấy danh sách ServiceId từ UI (những dịch vụ sẵn có của JobCard)
    const serviceElements = document.querySelectorAll('.job-service-id');
    const services = Array.from(serviceElements).map(el => ({
        serviceId: parseInt(el.value),
        quantity: 1 // Mặc định mỗi dịch vụ là 1, bạn có thể thêm input số lượng nếu cần
    }));

    // 2. Kiểm tra nếu không có gì để báo giá
    if (selectedParts.length === 0 && services.length === 0 && !note.trim()) {
        alert("Vui lòng nhập ghi chú hoặc chọn linh kiện/dịch vụ.");
        return;
    }

    if (!confirm("Xác nhận gửi báo giá cho Supervisor duyệt?")) return;

    // 3. Tạo Object Request đúng định dạng JSON bạn yêu cầu
    const request = {
        jobCardId: jobCardId,
        note: note,
        services: services, // Đưa mảng dịch vụ vào đây
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

document.addEventListener('DOMContentLoaded', initDashboard);