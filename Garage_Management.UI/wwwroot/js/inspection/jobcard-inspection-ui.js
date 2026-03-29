import { jobCardApi } from './jobcard-inspection-api.js';

export const jobCardUI = {
    // Render Job ở cột trái (Hàng đợi/Tiếp theo)   
    renderNextJob: (job) => {
        const container = document.getElementById('next-job-content');
        if (!job) {
            container.innerHTML = `<div class="no-job" style="padding:20px; text-align:center;">Không có JobCard chờ</div>`;
            return;
        }

        // Lấy danh sách tên dịch vụ
        const serviceNames = job.services.map(s => s.serviceName).join(', ');
        // Tính tổng số task
        const totalTasks = job.services.reduce((acc, s) => acc + s.serviceTasks.length, 0);

        container.innerHTML = `
            <div class="item-card" style="margin: 15px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background: #fff; color: #333;">
                <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                    <p><strong>Khách:</strong> ${job.customerFullName}</p>
                    <span style="background: #ffe3e3; color: #e63946; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">
                        ${totalTasks} Tasks
                    </span>
                </div>
                <p><strong>Xe:</strong> ${job.licensePlate} (${job.vehicleModel})</p>
                
                <div style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 6px;">
                    <strong style="font-size: 0.85rem; color: #555;">DỊCH VỤ YÊU CẦU:</strong>
                    <p style="font-size: 0.9rem; color: #e63946; font-weight: 500;">${serviceNames}</p>
                </div>

                <p style="font-size: 0.8rem; color: #888; margin-top:10px;">
                    <i class="fa-solid fa-user-tie"></i> Supervisor: ${job.supervisor}
                </p>
                <button class="btn-detail" style="margin-top:15px; width:100%" onclick="window.handleStartJob(${job.jobCardId})">
                    BẮT ĐẦU KIỂM TRA
                </button>
            </div>`;
    },

    // Render Job ở cột phải (Đang sửa) kèm Checklist Tasks
    renderRepairingJob: async (job) => {
        const container = document.querySelector('.repairing-list');
        const header = `<div class="column-header repairing-header">Xe đang xử lý</div>`;
        
        if (!job) {
            container.innerHTML = header + `<div class="no-job-msg">Không có xe đang xử lý</div>`;
            return;
        }

        const { jobCardStatus, mechanicAssignmenStatus } = job;

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
        else if (jobCardStatus === 7 && mechanicAssignmenStatus === 2) {
            container.innerHTML = header + jobCardUI.templateRepairExecution(job);
        }
    },

    // Template cho màn hình lập báo giá (Trường hợp 1)
    templateEstimate: (job, inventories) => {
        const currentServicesHtml = job.services.map(s => `
            <div class="service-item-static" style="background: #fff5f5; padding: 8px; border-radius: 4px; margin-bottom: 5px; border-left: 3px solid #e63946; display: flex; justify-content: space-between;">
                <span><i class="fa-solid fa-check-double"></i> ${s.serviceName}</span>
                <span class="badge bg-danger" style="font-size: 0.7rem; align-self: center;">Sẵn có</span>
                <input type="hidden" class="job-service-id" value="${s.serviceId}">
            </div>
        `).join('');

        let inventoryOptions = inventories.map(item => 
            `<option value="${item.sparePartId}" data-price="${item.sellingPrice}">[${item.partCode}] ${item.partName} - Tồn: ${item.quantity}</option>`
        ).join('');

        return `
            <div class="repair-detail-card">
                <h3><i class="fa-solid fa-file-invoice-dollar"></i> LẬP PHIẾU KIỂM TRA & BÁO GIÁ</h3>
                <p>Xe: <strong>${job.licensePlate}</strong> | Khách: ${job.customerFullName}</p>
                <hr>

                <div class="section" style="margin-bottom: 15px;">
                    <label style="font-weight: bold; color: #555;">DỊCH VỤ ĐÃ CHỌN:</label>
                    <div id="current-services-list" style="margin-top: 5px;">
                        ${currentServicesHtml}
                    </div>
                </div>
                
                <div class="section">
                    <label style="font-weight: bold; color: #555;">THÊM LINH KIỆN THAY THẾ (NẾU CÓ):</label>
                    <div style="display: flex; gap: 5px; margin-top: 5px;">
                        <select id="select-sparepart" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                            ${inventoryOptions}
                        </select>
                        <input type="number" id="input-qty" value="1" min="1" style="width: 60px; padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
                        <button class="btn-add" onclick="window.addPartRow()" style="background: #28a745; color: white; border: none; padding: 0 15px; border-radius: 4px;">+</button>
                    </div>
                </div>

                <table class="table-estimate" style="width: 100%; margin-top: 15px; font-size: 0.85rem; border-collapse: collapse;">
                    <thead style="background: #f4f4f4;">
                        <tr><th style="padding: 8px; text-align: left;">Linh kiện</th><th style="padding: 8px;">SL</th><th style="padding: 8px;">Xóa</th></tr>
                    </thead>
                    <tbody id="estimate-parts-body"></tbody>
                </table>

                <div class="section" style="margin-top:15px;">
                    <label style="font-weight: bold; color: #555;">GHI CHÚ KIỂM TRA CHI TIẾT:</label>
                    <textarea id="estimate-note" style="width: 100%; height: 80px; padding: 10px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Ví dụ: Má phanh mòn cần thay, dầu máy đen..."></textarea>
                </div>

                <button class="btn-submit-estimate" onclick="window.handleSubmitEstimate(${job.jobCardId})" style="margin-top: 15px; width: 100%; background: #e63946; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: bold;">
                    GỬI YÊU CẦU DUYỆT BÁO GIÁ
                </button>
            </div>`;
    },

    // Template cho các trạng thái chờ (Trường hợp 2 & 3)
    templateStatusMsg: (job, msg, cssClass) => `
        <div class="status-msg-card ${cssClass}" style="text-align:center; padding: 40px 20px;">
            <div class="spinner-border text-primary" role="status"></div>
            <h4 style="margin-top:20px;">${job.licensePlate}</h4>
            <p style="font-size: 1.1rem; font-weight: bold; color: #555;">${msg}</p>
            <button class="btn-secondary" onclick="location.reload()">Cập nhật trạng thái</button>
        </div>`,

    // Template cho màn hình thực hiện (Trường hợp 4 - code cũ của bạn)
    templateRepairExecution: (job) => {
        let servicesHtml = '';
        job.services.forEach(service => {
            servicesHtml += `
                <div class="service-block" style="margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #e63946; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px;">
                        <i class="fa-solid fa-wrench"></i> ${service.serviceName} 
                        <span style="float:right; font-size: 0.8rem; color: #888;">${service.totalEstimateMinute}p</span>
                    </div>
                    <ul style="list-style: none; padding-left: 5px;">
                        ${service.serviceTasks.map(task => `
                            <li style="font-size: 0.85rem; margin-bottom: 6px; display: flex; align-items: center;">
                                <input type="checkbox" ${task.serviceTaskStatusName === 'Completed' ? 'checked' : ''} style="margin-right: 10px;">
                                <span style="color: #444;">${task.taskName}</span>
                                <small style="margin-left: auto; color: #999;">${task.estimateMinute}p</small>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });

        return `
            <div class="repair-detail-card" style="max-height: 80vh; overflow-y: auto;">
                <div class="detail-header">
                    <div>
                        <div class="detail-title">${job.licensePlate} - ${job.vehicleModel}</div>
                        <p style="font-size: 0.9rem; color: #666;">Khách: ${job.customerFullName} | TP: ${job.customerPhone}</p>
                    </div>
                </div>
                
                <hr style="margin: 15px 0;">
                
                <div class="task-list-container">
                    ${servicesHtml}
                </div>

                <div class="section-label">Ghi chú từ thợ:</div>
                <textarea id="mechanic-note" style="width: 100%; border: 1px solid #ddd; border-radius: 4px; padding: 10px; font-size: 0.9rem;" placeholder="Nhập tình trạng xe thực tế..."></textarea>

                <button class="btn-finish" style="margin-top: 20px;" onclick="window.handleCompleteJob(${job.jobCardId})">
                    <div><i class="fa-regular fa-circle-check"></i> HOÀN THÀNH TẤT CẢ</div>
                    <span>Dự kiến xong: ${job.jobCardEndDate ? new Date(job.jobCardEndDate).toLocaleTimeString() : 'Đang tính toán...'}</span>
                </button>
            </div>`;
    },

    updateStats: (counts) => {
        const stats = document.querySelectorAll('.stat-card .number');
        if (stats.length >= 3) {
            stats[0].innerText = counts.waiting;
            stats[1].innerText = counts.repairing;
            stats[2].innerText = counts.completed;
        }
    }
};