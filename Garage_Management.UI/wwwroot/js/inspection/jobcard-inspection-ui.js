import { jobCardApi } from './jobcard-inspection-api.js';
import { repairUI} from '../repairation/jobcard-repairation-ui.js';

export const jobCardUI = {
    // Render Job ở cột trái (Hàng đợi/Tiếp theo)   
    renderNextJob: (job, hasActiveJob) => {
        const container = document.getElementById('next-job-content');

        if (!job) {
            container.innerHTML = `<div class="loading-placeholder">Không có JobCard chờ</div>`;
            return;
        }

        const warningMsg = hasActiveJob 
            ? `<div class="service-block" style="background:#fff3cd; color:#856404;">
                    Hoàn thành công việc hiện tại để bắt đầu xe mới
            </div>` 
            : '';

        const serviceNames = job.services.map(s => s.serviceName).join(', ');
        const totalTasks = job.services.reduce((acc, s) => acc + s.serviceTasks.length, 0);

        container.innerHTML = `
            <div class="column-box repair-detail-card">
                
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <p><strong>Khách:</strong> ${job.customerFullName}</p>
                    <span class="badge-task">${totalTasks} Tasks</span>
                </div>

                <p><strong>Xe:</strong> ${job.licensePlate} (${job.vehicleModel})</p>

                <div class="service-block">
                    <strong style="font-size: 0.85rem; color: var(--text-muted);">
                        DỊCH VỤ YÊU CẦU
                    </strong>
                    <p style="color: var(--primary-red); font-weight: 500;">
                        ${serviceNames}
                    </p>
                </div>

                <p style="font-size: 0.8rem; color: var(--text-muted);">
                    <i class="fa-solid fa-user-tie"></i> Supervisor: ${job.supervisor}
                </p>

                ${warningMsg}

                ${
                    !hasActiveJob 
                    ? `<button class="btn-detail" 
                            style="margin-top:15px; width:100%;" 
                            onclick="window.handleStartJob(${job.jobCardId})">
                            BẮT ĐẦU KIỂM TRA
                    </button>`
                    : ''
                }

            </div>
        `;
    },

    // Render Job ở cột phải (Đang sửa) kèm Checklist Tasks
    renderRepairingJob: async (job) => {
        const container = document.querySelector('.repairing-list');
        const header = `<div class="column-header repairing-header">Xe đang xử lý</div>`;
        
        if (!job) {
            container.innerHTML = header + `<div class="loading-placeholder">Không có xe đang xử lý</div>`;
            return;
        }

        const { jobCardStatus, mechanicAssignmenStatus } = job;
            try {
                // TRƯỜNG HỢP 1: LẬP BÁO GIÁ (Màn hình chọn linh kiện/dịch vụ)
                if (jobCardStatus === 4 && mechanicAssignmenStatus === 2) {
                    const inventories = await jobCardApi.getInventories();
                    container.innerHTML = header + jobCardUI.templateEstimate(job, inventories);
                } 
                // TRƯỜNG HỢP 2: CHỜ SUPERVISOR
                else if (jobCardStatus === 5 && mechanicAssignmenStatus === 2) {
                    container.innerHTML = header + jobCardUI.templateStatusMsg(job, "Đang chờ Supervisor duyệt yêu cầu", "bg-warning");
                }
                // TRƯỜNG HỢP 3: CHỜ KHÁCH HÀNG
                else if (jobCardStatus === 6 && mechanicAssignmenStatus === 2) {
                    container.innerHTML = header + jobCardUI.templateStatusMsg(job, "Đang chờ Khách hàng duyệt yêu cầu", "bg-info");
                }
                // TRƯỜNG HỢP 4: THỰC HIỆN SỬA CHỮA (Màn hình Checklist cũ)
                else if (jobCardStatus === 7 && mechanicAssignmenStatus === 2 || jobCardStatus === 12 && mechanicAssignmenStatus === 2) {
                    // KIỂM TRA repairUI CÓ TỒN TẠI KHÔNG
                    if (typeof repairUI === 'undefined') {
                        console.error("CRITICAL: repairUI chưa được import hoặc bị undefined!");
                        container.innerHTML = header + `<div class="alert alert-danger">Lỗi hệ thống: repairUI undefined</div>`;
                        return;
                    }
                    container.innerHTML = header + repairUI.templateRepairExecution(job);
                }
            } catch (err) {
            // NẾU CÓ LỖI NÓ SẼ HIỆN Ở ĐÂY
            console.error("LỖI THỰC THI RENDER:", err);
            container.innerHTML = header + `<div class="alert alert-danger">Lỗi: ${err.message}</div>`;
        }
    },

    // Template cho màn hình lập báo giá (Trường hợp 1)
    templateEstimate: (job, inventories) => {
        let inventoryOptions = inventories.map(item => 
            `<option value="${item.sparePartId}" data-price="${item.sellingPrice}">
                [${item.partCode}] ${item.partName} - Tồn: ${item.quantity}
            </option>`
        ).join('');

        return `
            <div class="column-box repair-detail-card">

                <h3>
                    <i class="fa-solid fa-file-invoice-dollar"></i> 
                    LẬP PHIẾU KIỂM TRA & BÁO GIÁ
                </h3>

                <p>
                    Xe: <strong>${job.licensePlate}</strong> | 
                    Khách: ${job.customerFullName}
                </p>
                <br>

                <!-- SERVICE -->
                <div style="display:flex; gap:10px; margin-bottom:10px; ">
                    <select id="select-service" style="flex:1;"></select>
                    <button class="btn-add" onclick="window.addServiceRow()">+</button>
                </div>

                <table class="table-estimate" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Tên dịch vụ</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="estimate-services-body"></tbody>
                </table>

                <!-- PART -->
                <div class="service-block">
                    <strong style="color: var(--text-muted);">
                        THÊM LINH KIỆN THAY THẾ (NẾU CÓ)
                    </strong>

                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <select id="select-sparepart" style="flex:1;">
                            ${inventoryOptions}
                        </select>
                        <input type="number" id="input-qty" value="1" min="1" style="width:70px;">
                        <button class="btn-add" onclick="window.addPartRow()">+</button>
                    </div>
                </div>

                <table class="table-estimate" style="width:100%; margin-top:15px;">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Linh kiện</th>
                            <th>SL</th>
                            <th style="text-align:right;">Xóa</th>
                        </tr>
                    </thead>
                    <tbody id="estimate-parts-body"></tbody>
                </table>

                <!-- NOTE -->
                <div class="service-block">
                    <strong style="color: var(--text-muted);">
                        GHI CHÚ KIỂM TRA CHI TIẾT
                    </strong>
                    <textarea 
                        id="estimate-note" 
                        placeholder="Ví dụ: Má phanh mòn cần thay..."
                        style="width:100%; height:80px; margin-top:10px;">
                    </textarea>
                </div>

                <div class="column-box repair-detail-card">
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                        <button class="btn-finish" 
                                style="width:100%;"
                                onclick="window.handleSubmitEstimate(${job.jobCardId})">
                            <i class="fa-solid fa-paper-plane"></i> Gửi yêu cầu duyệt báo giá
                        </button>

                        <button class="btn-secondary" 
                                style="width:100%; background-color: #6c757d; color: white; border: none; padding: 10px; border-radius: 4px;"
                                onclick="window.handleNoFaultFound(${job.jobCardId})">
                            <i class="fa-solid fa-magnifying-glass-minus"></i> Không tìm thấy lỗi
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Template cho các trạng thái chờ (Trường hợp 2 & 3)
    templateStatusMsg: (job, msg, cssClass) => `
        <div class="status-msg-card ${cssClass}" style="text-align:center; padding: 40px 20px;">
            <div class="spinner-border text-primary" role="status"></div>
            <h4 style="margin-top:20px;">${job.licensePlate}</h4>
            <p style="font-size: 1.1rem; font-weight: bold; color: #555;">${msg}</p>
            <button class="btn-secondary" onclick="location.reload()">Cập nhật trạng thái</button>
        </div>`,

    updateStats: (counts) => {
        const stats = document.querySelectorAll('.stat-card .number');
        if (stats.length >= 3) {
            stats[0].innerText = counts.waiting;
            stats[1].innerText = counts.repairing;
            stats[2].innerText = counts.completed;
        }
    }
};