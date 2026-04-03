export const repairUI = {
    templateRepairExecution: (job) => {
        if (!job || !job.services) return `<p>Dữ liệu công việc không hợp lệ</p>`;
        const isJobOnHold = job.status === 12;
        // 1. Xử lý HTML cho Linh kiện (Spare Parts) đã chốt
        let sparePartsHtml = '';
        if (job.spareParts && job.spareParts.length > 0) {
            sparePartsHtml = `
                <div class="spare-parts-section" style="margin-bottom: 20px; background: #f8f9fa; border: 1px dashed #dee2e6; padding: 10px; border-radius: 6px;">
                    <div style="font-weight: bold; color: #007bff; margin-bottom: 8px; font-size: 0.9rem;">
                        <i class="fa-solid fa-box-open"></i> LINH KIỆN ĐÃ CHỐT
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${job.spareParts.map(p => `
                            <li style="font-size: 0.85rem; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #eee;">
                                <span>${p.partName}</span>
                                <span style="font-weight: bold;">x${p.quantity}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>`;
        }

        // 2. Xử lý HTML cho Dịch vụ (Chỉ lấy status 2, 3 và xử lý status 5)
        let servicesHtml = '';
        job.services.forEach(service => {
            // Lọc: Chỉ hiện InProgress(2), Completed(3) hoặc OnHold(5) để báo trạng thái
            // Nếu bạn muốn giấu hoàn toàn OnHold thì xóa số 5 ở điều kiện dưới
            if (![2, 3, 5].includes(service.serviceStatus)) return;

            const isServiceOnHold = service.serviceStatus === 5;
            // Nút bấm bị vô hiệu hóa nếu Job bị Hold HOẶC Service bị Hold
            const isDisabled = isJobOnHold || isServiceOnHold;
            const tasks = service.serviceTasks || [];

            servicesHtml += `
                <div class="service-block" style="margin-bottom: 15px; opacity: ${isDisabled ? '0.6' : '1'};">
                    <div style="font-weight: bold; color: #e63946; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; display: flex; justify-content: space-between;">
                        <span><i class="fa-solid fa-wrench"></i> ${service.serviceName}</span>
                        <span style="font-size: 0.8rem; color: #888;">${service.totalEstimateMinute}p</span>
                    </div>

                    ${isDisabled ? `
                        <div style="background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 8px; border: 1px solid #ffeeba;">
                            <i class="fa-solid fa-lock"></i> ${isJobOnHold ? 'Phiếu chờ duyệt phát sinh.' : 'Hạng mục đang tạm dừng.'} Không thể thao tác.
                        </div>
                    ` : ''}

                    <ul style="list-style: none; padding-left: 5px;">
                        ${tasks.map(task => {
                            // Logic chọn btnClass, btnText giữ nguyên...
                            let btnClass = task.serviceTaskStatus === 2 ? 'btn-primary' : (task.serviceTaskStatus === 3 ? 'btn-success' : 'btn-outline-secondary');
                            let btnText = task.serviceTaskStatus === 2 ? 'Đang làm...' : (task.serviceTaskStatus === 3 ? 'Đã xong' : 'Bắt đầu');
                            let nextStatus = task.serviceTaskStatus === 2 ? 3 : (task.serviceTaskStatus === 3 ? 1 : 2);

                            return `
                                <li style="font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #eee;">
                                    <span style="color: #444; font-weight: 500;">${task.taskName}</span>
                                    <button 
                                        class="btn btn-sm ${btnClass} task-action-btn" 
                                        ${isDisabled ? 'disabled' : ''} 
                                        onclick="window.handleTaskAction(${job.jobCardId}, ${task.serviceTaskId}, ${task.serviceTaskStatus}, ${nextStatus}, '${task.taskName.replace(/'/g, "\\'")}', ${job.status}, ${service.serviceStatus}, '${encodeURIComponent(JSON.stringify(job))}')">
                                        ${btnText}
                                    </button>
                                </li>`;
                        }).join('')}
                    </ul>
                </div>`;
        });

        const finishTime = job.jobCardEndDate ? new Date(job.jobCardEndDate).toLocaleTimeString() : '...';


        return `
            <div class="repair-detail-card" style="max-height: 80vh; overflow-y: auto;">
                <div class="detail-header">
                    <div class="detail-title">${job.licensePlate} - ${job.vehicleModel}</div>
                    <p style="font-size: 0.9rem; color: #666;">Khách: ${job.customerFullName}</p>
                </div>
                <hr style="margin: 15px 0;">
                
                ${sparePartsHtml}

                <div class="section-label" style="font-weight:bold; margin-bottom:10px;">DANH SÁCH HẠNG MỤC:</div>
                <div class="task-list-container">${servicesHtml || '<p style="font-size:0.9rem; color:#888;">Không có dịch vụ nào đang thực hiện.</p>'}</div>
                
                <div class="section-label" style="margin-top:20px; font-weight: bold;">Ghi chú / Phát hiện lỗi thêm:</div>
                <div style="position: relative;">
                     <button class="btn btn-danger btn-sm" style="width: 100%; font-weight: bold;" 
                        onclick="window.openNewFaultPopup(${job.jobCardId})">
                        <i class="fa-solid fa-file-medical"></i> LẬP BÁO CÁO PHÁT SINH
                    </button>
                </div>
            </div>`;
    }
};

// Biến tạm để lưu danh sách thợ chọn trên Popup
let tempFaultServices = [];
let tempFaultParts = [];

window.addFaultItem = (type) => {
    if (type === 'service') {
        const select = document.getElementById('fault-service-select');
        const id = parseInt(select.value);
        const name = select.options[select.selectedIndex].text;
        
        if (!tempFaultServices.find(s => s.serviceId === id)) {
            tempFaultServices.push({ serviceId: id, quantity: 1, name: name });
            renderFaultList('services');
        }
    } else {
        const select = document.getElementById('fault-part-select');
        const id = parseInt(select.value);
        const name = select.options[select.selectedIndex].text;
        
        if (!tempFaultParts.find(p => p.sparePartId === id)) {
            tempFaultParts.push({ sparePartId: id, quantity: 1, name: name });
            renderFaultList('parts');
        }
    }
};

const renderFaultList = (type) => {
    const listId = type === 'services' ? 'fault-services-list' : 'fault-parts-list';
    const data = type === 'services' ? tempFaultServices : tempFaultParts;
    const container = document.getElementById(listId);
    
    container.innerHTML = data.map((item, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center p-2" style="font-size: 0.8rem;">
            ${item.name}
            <span class="badge bg-danger rounded-pill" style="cursor:pointer" onclick="removeFaultItem('${type}', ${index})">x</span>
        </li>
    `).join('');
};

// Cuối cùng khi thợ bấm nút "Gửi báo cáo" trong Modal:
window.submitNewFaultUI = (jobCardId) => {
    const note = document.getElementById('fault-note').value;
    repairExecution.submitNewFault(jobCardId, tempFaultServices, tempFaultParts, note);
};

