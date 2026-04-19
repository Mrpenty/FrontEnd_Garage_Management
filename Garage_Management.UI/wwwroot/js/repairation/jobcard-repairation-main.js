import { repairApi } from './jobcard-repairation-api.js';

export const repairExecution = {
    tempData: {
        services: [],
        parts: []
    },
    //Cập nhật tiến độ từng task
    handleTaskAction: async (jobCardId, taskId, currentStatus, nextStatus, taskName, jobCardStatus, serviceStatus, jobRaw) => {
        if (jobCardStatus === 12) return Swal.fire('Thông báo', 'Phiếu đang có lỗi phát sinh chờ duyệt!', 'warning');
        if (serviceStatus === 5) return Swal.fire('Thông báo', 'Hạng mục này đang tạm dừng!', 'warning');

        if (!confirm(`Xác nhận cập nhật: ${taskName}?`)) return;

        try {
            // Lấy dữ liệu chi tiết mới nhất từ BE (đã có đủ các loại ID)
            const detailResult = await repairApi.getJobCardDetails(jobCardId);
            if (!detailResult || !detailResult.services) throw new Error("Không lấy được thông tin chi tiết phiếu.");

            const targetTaskId = parseInt(taskId);
            const targetNextStatus = parseInt(nextStatus);

            let totalTasks = 0;
            let completedTasks = 0;
            let finalParentServiceId = null;
            let finalTaskUpdateId = null;

            // Duyệt trực tiếp trên detailResult để tính tiến độ
            detailResult.services.forEach(svc => {
                const sStatus = parseInt(svc.status);
                if (sStatus === 4) return;
                const hasTasks = svc.serviceTasks && svc.serviceTasks.length > 0;

                if (hasTasks) {
                    svc.serviceTasks.forEach(t => {
                        totalTasks++;
                        const isTarget = t.taskName === taskName;
                        
                        if (isTarget) { 
                            finalParentServiceId = svc.jobCardServiceId;
                            finalTaskUpdateId = t.jobCardServiceTaskId;
                        }

                        const s = isTarget ? targetNextStatus : parseInt(t.status);
                        if (s === 3) completedTasks++;
                    });
                } else {
                    // Trường hợp Service không có task con (Service đóng vai trò là 1 task)
                    totalTasks++;
                    const isTarget = svc.description.includes(taskName) || svc.jobCardServiceId == taskId;
                    if (isTarget) {
                        finalParentServiceId = svc.jobCardServiceId;
                        finalTaskUpdateId = svc.jobCardServiceId;
                    }
                    const s = isTarget ? targetNextStatus : parseInt(svc.status);
                    if (s === 3) completedTasks++;
                }
            });

            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Chuẩn bị Request với các trường ID đã được map chính xác
            const request = {
                statusJobCard: (progress === 100) ? 8 : 7,
                progressPercentage: progress,
                progressNotes: `Cập nhật: ${taskName}`,
                serviceUpdates: [{
                    jobCardServiceId: finalParentServiceId,
                    statusService: parseInt(serviceStatus) //chuyển status service là tự động hoàn thành
                }],
                serviceTaskUpdates: [{
                    jobCardServiceTaskId: finalTaskUpdateId,
                    statusServiceTask: targetNextStatus
                }]
            };

            console.log("Payload gửi đi (lấy từ Detail):", request);

            const ok = await repairApi.updateProgress(jobCardId, request);
            
            if (ok) {
                if (progress === 100) {
                    await repairExecution.finalizeRepair(jobCardId, detailResult);
                } else {
                    location.reload();
                }
            }
        } catch (error) {
            console.error("Lỗi thực thi:", error);
            alert("Có lỗi xảy ra khi cập nhật tiến độ.");
        }
    },
    //mở báo cáo phát sinh.
    // newJobCardStatus: status jobcard sẽ set sau khi submit.
    //   12 (default) = mechanic gửi, chờ supervisor duyệt.
    //   6 = supervisor gửi trực tiếp, bỏ qua duyệt supervisor, đẩy thẳng sang chờ khách duyệt.
    openNewFaultPopup: async (jobCardId, newJobCardStatus = 12) => {
        repairExecution.tempData.services = [];
        repairExecution.tempData.parts = [];
        try {
            Swal.fire({ title: 'Đang tải...', didOpen: () => Swal.showLoading() });
            
            // 1. Lấy data linh kiện và dịch vụ để thợ chọn (Giả định lấy từ API đã có)
            const [allServices, allParts] = await Promise.all([
                repairApi.getServices(), // Bạn cần thêm hàm này vào repairApi
                repairApi.getInventories()
            ]);

            // 2. Render nội dung vào một Modal (Ví dụ dùng SweetAlert2 hoặc Bootstrap)
            // Ở đây tôi dùng ví dụ logic để bạn đưa vào UI của mình
            const modalHtml = `
                <div style="text-align: left; font-family: 'Inter', sans-serif; padding: 10px;">
                    <div class="mb-4">
                        <label class="modal-label"><i class="fa-solid fa-pen-to-square"></i> Ghi chú lỗi phát hiện thêm</label>
                        <textarea id="fault-note" class="form-control" rows="2" 
                        style="border-radius: 8px; font-size: 0.9rem;" 
                        placeholder="Mô tả cụ thể tình trạng hỏng hóc thực tế..."></textarea> 
                    </div>
                    <div class="row">
                        <div class="col-md-6 border-end">
                            <label class="modal-label" style="color: var(--primary-red);">
                                <i class="fa-solid fa-screwdriver-wrench"></i> Dịch vụ phát sinh
                            </label>
                            <div class="input-group-custom">
                                <select id="fault-service-select" class="form-select form-select-sm mb-2 select-search">
                                    ${allServices.map(s => `<option value="${s.serviceId}">${s.serviceName}</option>`).join('')}
                                </select>
                                <button class="btn-action-add" style="height: 31px; padding: 0 10px;" onclick="window.addFaultItem('service')">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                            <div id="fault-services-list" class="fault-list-container">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="modal-label" style="color: var(--primary-dark);">
                                <i class="fa-solid fa-gears"></i> Linh kiện/Phụ tùng
                            </label>
                            <select id="fault-part-select" class="form-select form-select-sm mb-2 select-search">
                                ${allParts.map(p => `<option value="${p.sparePartId}">${p.partName} (Kho: ${p.quantity})</option>`).join('')}
                            </select>
                            <button class="btn-action-add" style="height: 31px; padding: 0 10px;" onclick="window.addFaultItem('part')">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        <div id="fault-parts-list" class="fault-list-container">
                        </div>
                    </div>
                </div>
            `;
            
                Swal.fire({
                title: 'LẬP BÁO CÁO PHÁT SINH LỖI',
                html: modalHtml,
                width: '800px',
                showCancelButton: true,
                confirmButtonText: '<i class="fa-solid fa-paper-plane"></i> Gửi báo cáo',
                cancelButtonText: 'Đóng',
                confirmButtonColor: '#d33',
                didOpen: () => {
                    $('.select-search').select2({
                        dropdownParent: $('.swal2-container'), // Quan trọng: Để dropdown hiện đè lên Modal
                        width: '100%',
                        allowClear: true,
                        placeholder: 'Tìm kiếm nhanh...'
                    });
                },
                preConfirm: () => {
                    const note = document.getElementById('fault-note').value;
                    if (!note.trim()) {
                        Swal.showValidationMessage('Vui lòng nhập ghi chú lỗi!');
                        return false;
                    }
                    if (repairExecution.tempData.services.length === 0 && repairExecution.tempData.parts.length === 0) {
                        Swal.showValidationMessage('Phải chọn ít nhất 1 dịch vụ hoặc linh kiện!');
                        return false;
                    }
                    return { note: note };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Gọi hàm submit đã viết ở bước trước
                    repairExecution.submitNewFault(
                        jobCardId,
                        repairExecution.tempData.services,
                        repairExecution.tempData.parts,
                        result.value.note,
                        newJobCardStatus
                    );
                }
            });
        } catch (e) { 
            console.error(e); 
            Swal.fire('Lỗi', 'Không thể tải danh sách dịch vụ/phụ tùng', 'error');
        }
    },

    renderFaultList: (type) => {
        const listId = type === 'services' ? 'fault-services-list' : 'fault-parts-list';
        const data = type === 'services' ? repairExecution.tempData.services : repairExecution.tempData.parts;
        const container = document.getElementById(listId);
        if (!container) return;

        container.innerHTML = data.map((item, index) => `
            <div class="fault-item">
                <span style="font-weight: 500; color: var(--text-dark);">${item.name}</span>
                <button onclick="window.removeFaultItem('${type}', ${index})" 
                        style="border:none; background:none; color: #ff7675; cursor:pointer;">
                    <i class="fa-solid fa-circle-xmark"></i>
                </button>
            </div>
        `).join('');
    },

    submitNewFault: async (jobCardId, selectedServices, selectedParts, note, newJobCardStatus = 12) => {
        if (!note) return alert("Vui lòng nhập ghi chú lỗi!");
        if (selectedServices.length === 0 && selectedParts.length === 0) {
            return alert("Vui lòng chọn ít nhất 1 dịch vụ hoặc linh kiện phát sinh!");
        }

        try {
            // BƯỚC 1: POST RepairEstimate (Tạo báo giá phát sinh)
            const estimateData = {
                jobCardId: jobCardId,
                note: note,
                services: selectedServices,
                spareParts: selectedParts
            };

            const postOk = await repairApi.submitRepairEstimate(estimateData);
            if (!postOk) throw new Error("Lỗi khi tạo báo giá phát sinh");

            // BƯỚC 2: PATCH JobCard Status -> newJobCardStatus
            //   12 (default, mechanic) = chờ supervisor duyệt
            //   6 (supervisor tự gửi)  = bỏ qua duyệt supervisor, chờ khách duyệt
            await repairApi.updateJobCardStatus(jobCardId, newJobCardStatus);

            // BƯỚC 3: Lấy danh sách Service hiện tại của JobCard để chuyển sang OnHold
            // Gọi API: GET JobCards/{id} hoặc API chuyên biệt lấy Services
            const currentJobData = await repairApi.getJobCardDetails(jobCardId); 
        
            if (currentJobData && currentJobData.services) {
                // SỬA TẠI ĐÂY: Dùng s.status thay vì s.serviceStatus
                // Lọc những dịch vụ đang làm (2) để tạm dừng (5)
                const inProgressServices = currentJobData.services.filter(s => parseInt(s.status) === 2);
                
                console.log(`Tìm thấy ${inProgressServices.length} dịch vụ cần tạm dừng.`);

                const holdPromises = inProgressServices.map(service => 
                    // Đảm bảo hàm này gọi đúng API PATCH/PUT để đổi status của service
                    repairApi.updateJobCardServiceStatus(jobCardId, service.serviceId, 5)
                );

                await Promise.all(holdPromises);
            }

            alert("Hệ thống đã gửi báo cáo phát sinh. Phiếu sửa chữa hiện đang tạm dừng (On Hold) để chờ khách xác nhận.");
            location.reload();

        } catch (error) {
            console.error("Lỗi khi xử lý phát sinh:", error);
            alert("Có lỗi xảy ra: " + error.message);
        }
    },

    finalizeRepair: async (jobCardId, detailResult) => {
        try {
            Swal.fire({ title: 'Đang hoàn tất thủ tục...', didOpen: () => Swal.showLoading() });
            const validServices = (detailResult.services || []).filter(svc => parseInt(svc.status) !== 4);
            const serviceTotal = validServices.reduce((sum, svc) => sum + (svc.price || 0), 0);
            const sparePartTotal = (detailResult.spareParts || []).reduce((sum, part) => sum + (part.totalAmount || 0), 0);
            // A. Cập nhật Status từng Service sang 3 (Đã xong)
            if (detailResult.services && detailResult.services.length > 0) {
                const servicePromises = validServices
                    .map(svc => repairApi.updateJobCardServiceStatus(jobCardId, svc.serviceId, 3));
                await Promise.all(servicePromises);
            }

            // B. Cập nhật Status JobCard sang 8 (Chờ thanh toán)
            await repairApi.updateJobCardStatus(jobCardId, 8);

            // C. Cập nhật trạng thái Thợ sang 3 (Nghỉ/Sẵn sàng việc mới)
            await repairApi.updateMechanicStatus(jobCardId, 3);

            // D. Giải phóng WorkBay (Đưa xe ra khỏi vị trí sửa chữa)
            // BE có thể trả về field tên khác casing, fallback nhiều key để chắc chắn.
            const wbId = detailResult.workBayId
                ?? detailResult.workbayId
                ?? detailResult.workBay?.id
                ?? detailResult.workbay?.id
                ?? detailResult.workBay?.workBayId
                ?? detailResult.workbay?.workbayId;
            if (wbId) {
                const released = await repairApi.releaseWorkbay(wbId);
                if (!released) console.warn("Cảnh báo: Không thể giải phóng khoang tự động.");
            } else {
                console.warn("Cảnh báo: JobCard detail không có workbay id, bỏ qua bước giải phóng.", detailResult);
            }

            //E. Tạo hóa đơn thanh toán
            const invoiceRequest = {
                jobCardId: jobCardId,
                invoiceDate: new Date().toISOString(),
                serviceTotal: serviceTotal, // Lấy từ detailResult
                sparePartTotal: sparePartTotal, // Lấy từ detailResult
                paymentMethod: null
            };

            console.log("Dữ liệu Invoice gửi đi:", invoiceRequest);
            const invoiceOk = await repairApi.createInvoice(invoiceRequest);

            if (invoiceOk) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Hoàn tất sửa chữa',
                    text: `Hóa đơn đã được tạo. Tổng dịch vụ: ${serviceTotal.toLocaleString()}đ, Linh kiện: ${sparePartTotal.toLocaleString()}đ`,
                });
            } else {
                await Swal.fire('Lưu ý', 'Đã xong sửa chữa nhưng không thể tạo hóa đơn tự động.', 'warning');
            }
            location.reload();
        } catch (error) {
            console.error("Lỗi hoàn tất:", error);
            Swal.fire('Lỗi', 'Không thể hoàn tất các thủ tục hệ thống.', 'error');
        }
    }
};

// Gán hàm vào window bằng Arrow Function để tránh lỗi mất context 'this'
window.handleTaskAction = (jobCardId, taskId, currentStatus, nextStatus, taskName, jobCardStatus, serviceStatus, jobRaw) => {
    repairExecution.handleTaskAction(jobCardId, taskId, currentStatus, nextStatus, taskName, jobCardStatus, serviceStatus, jobRaw);
};

window.addFaultItem = (type) => {
    const selectId = type === 'service' ? 'fault-service-select' : 'fault-part-select';
    const select = document.getElementById(selectId);
    const id = parseInt(select.value);
    const name = select.options[select.selectedIndex].text;

    if (type === 'service') {
        if (!repairExecution.tempData.services.find(s => s.serviceId === id)) {
            repairExecution.tempData.services.push({ serviceId: id, quantity: 1, name: name });
            repairExecution.renderFaultList('services');
        }
    } else {
        if (!repairExecution.tempData.parts.find(p => p.sparePartId === id)) {
            repairExecution.tempData.parts.push({ sparePartId: id, quantity: 1, name: name });
            repairExecution.renderFaultList('parts');
        }
    }
};

window.removeFaultItem = (type, index) => {
    if (type === 'services') {
        repairExecution.tempData.services.splice(index, 1);
    } else {
        repairExecution.tempData.parts.splice(index, 1);
    }
    repairExecution.renderFaultList(type);
};

window.submitNewFaultUI = (jobCardId) => {
    const note = document.getElementById('fault-note').value;
    // Lấy data từ biến tạm trong object
    repairExecution.submitNewFault(
        jobCardId, 
        repairExecution.tempData.services, 
        repairExecution.tempData.parts, 
        note
    );
};

window.openNewFaultPopup = repairExecution.openNewFaultPopup;

