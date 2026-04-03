import { workbayApi } from './workbay-api.js';

async function refreshData() {
    const supervisorId = localStorage.getItem('employeeId');
    if (!supervisorId) return;

    try {
        const [jobsRes, wbsRes] = await Promise.all([
            workbayApi.getJobsBySupervisor(supervisorId),
            workbayApi.getAllWorkbays()
        ]);

        const jobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes.data || []);
        const workbays = Array.isArray(wbsRes) ? wbsRes : (wbsRes.data || []);

        renderPendingJobs(jobs, workbays);
        renderWorkbayGrid(workbays);
    } catch (err) {
        console.error("Refresh lỗi:", err);
    }
}

// Hàm render danh sách JobCard
        function renderPendingJobs(jobs, allWorkbays) {
            const listContainer = document.getElementById('pending-jobs-list');
            const pendingJobs = jobs.filter(job => job.status === 1);

            if (pendingJobs.length === 0) {
                listContainer.innerHTML = '<p class="empty-msg">Không có xe mới chờ điều phối.</p>';
                return;
            }

            const now = new Date();

            // Chuẩn bị dữ liệu Dropdown: Tất cả Workbay + Số lượng Job hiện có trong mỗi Workbay
            const wbOptions = allWorkbays.map(wb => {
                const count = wb.jobCards ? wb.jobCards.length : 0;
                return `<option value="${wb.id}">${wb.name} (${count} xe đang chờ)</option>`;
            }).join('');

            listContainer.innerHTML = pendingJobs.map(job => {
                const customerName = job.customer 
                ? `${job.customer.lastName} ${job.customer.firstName}` 
                : 'Khách vãng lai';
                const plate = job.vehicle ? job.vehicle.licensePlate : 'N/A';
                const serviceSummary = job.services && job.services.length > 0
                ? job.services.map(s => s.serviceName).join(', ')
                : 'Chưa chọn dịch vụ';
            // Tính toán thời gian dự kiến
                const totalTime = job.totalEstimateMinute || 0;

                // Logic highlight giờ hẹn (giữ nguyên từ bản trước)
                let priorityClass = '';
                let appointmentInfo = '';
                if (job.appointmentId && job.startDate) {
                    const appointmentDate = new Date(job.startDate);
                    const diff = (appointmentDate - now) / (1000 * 60);
                    if (diff <= 0) {
                        priorityClass = 'priority-urgent';
                        appointmentInfo = `<span class="badge-appt">ĐẾN GIỜ HẸN</span>`;
                    } else if (diff <= 60) {
                        priorityClass = 'priority-upcoming';
                        appointmentInfo = `<span class="badge-appt">SẮP ĐẾN HẸN</span>`;
                    }
                }

                return `
                    <div class="job-item">
                        <div class="job-info">
                            <div class="job-row-top">
                                <span class="job-id">#JC-${job.jobCardId}</span>
                                <span class="job-time-est"><i class="far fa-clock"></i> ${totalTime} phút</span>
                            </div>
                            <div class="job-row-main">
                                <span class="car-plate"><i class="fas fa-motorcycle"></i> ${plate}</span>
                                <span class="customer-name"><i class="fas fa-user"></i> ${customerName}</span>
                            </div>
                            <div class="job-row-services">
                                <i class="fas fa-tools"></i> <strong>Yêu cầu:</strong> ${serviceSummary}
                            </div>
                            ${job.note ? `<div class="job-note"><em>* Ghi chú: ${job.note}</em></div>` : ''}
                        </div>
                        <div class="assign-action">
                            <select class="select-wb-dropdown" onchange="window.handleAssign(${job.jobCardId}, this.value)">
                                <option value="">Điều phối vào khoang...</option>
                                ${wbOptions}
                            </select>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Hàm render lưới Workbay
        function renderWorkbayGrid(workbays) {
            const grid = document.getElementById('workbay-grid');
            const statusTextMap = {
                2: 'Chờ giao Mechanic', 3: 'Chờ kiểm tra', 4: 'Đang kiểm tra',
                5: 'Chờ Supervisor duyệt', 6: 'Chờ Khách duyệt', 7: 'Đang sửa chữa', 12: "Phát sinh lỗi"
            };

            grid.innerHTML = workbays.map(wb => {
                let displayJob = null;
                const cards = Array.isArray(wb.jobCards) ? wb.jobCards : [];
                
                if (cards.length > 0) {
                    const highPriority = cards.filter(j => [4, 5, 6, 7, 12].includes(j.status));
                    if (highPriority.length > 0) {
                        displayJob = highPriority.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
                    } else {
                        const lowPriority = cards.filter(j => [2, 3].includes(j.status));
                        displayJob = lowPriority.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
                    }
                }

                const statusClass = wb.status === 1 ? 'empty' : 'active';
                const hasJob = displayJob != null;

                const mechanicNames = (displayJob?.mechanics && displayJob.mechanics.length > 0)
                 ? displayJob.mechanics.map(m => m.mechanicName).join(', ')
                 : "Chưa có thợ";
                
            //     // Fix lỗi hiển thị khi vehicle hoặc customer bị null từ API
            //     const plateDisplay = displayJob?.vehicle?.licensePlate || "N/A";
            //     const customerDisplay = displayJob?.customerName || "Khách vãng lai";

            //     // FIX LỖI RangeError: Đổi '2d' thành '2-digit'
            //     const timeDisplay = hasJob ? (() => {
            //     const d = new Date(wb.startAt);
            //     d.setHours(d.getHours() + 7); // Thêm 7 tiếng
            //     return d.toLocaleTimeString('vi-VN', {
            //         hour: '2-digit', 
            //         minute: '2-digit'
            //     });
            // })() : "";

            return `
                <div class="workbay-card ${statusClass}">
                    <div class="wb-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0">${wb.name}</h3>
                        ${cards.length > 1 ? `<span class="q-badge">Đợi: ${cards.length - 1}</span>` : ''}
                    </div>
                    <div class="workbay-content" style="flex:1; margin-top:15px;">
                        ${hasJob ? `
                            <span class="badge-status s-${displayJob.status}">${statusTextMap[displayJob.status] || 'Đang xử lý'}</span>
                            <div class="wb-plate" style="font-size:1.2rem; margin:10px 0; font-weight:bold;">${displayJob.vehicle?.licensePlate || "N/A"}</div>
                            <div class="wb-customer" style="font-size:0.85rem; color:#64748b; margin-bottom:5px;"><i class="far fa-user"></i> ${displayJob.customerName || "Khách"}</div>
                            
                            <div class="wb-mechanic" style="font-size:0.85rem; color:#4f46e5; font-weight:500;">
                                <i class="fas fa-wrench"></i> Thợ: ${mechanicNames}
                            </div>
                        ` : '<div class="status-ready" style="color:#10b981; font-weight:bold; text-align:center; margin-top:20px;">SẴN SÀNG</div>'}
                    </div>
                    <div class="wb-actions" style="display:flex; gap:5px; margin-top:10px;">
                        ${hasJob ? `
                            <button class="btn-edit-small" title="Chi tiết" onclick="window.viewJobDetail(${displayJob.jobCardId})">
                                <i class="fas fa-eye"></i> #JC-${displayJob.jobCardId}
                            </button>
                        ` : ''}
                        ${cards.length > 0 ? `
                            <button class="btn-queue-inner" onclick="window.viewWbQueue(${wb.id})">
                                <i class="fas fa-list-ol"></i> Hàng chờ
                            </button>
                        ` : ''}
                    </div>
                </div>`;
            }).join('');
    }

    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Hiển thị tên tài khoản đang đăng nhập
        const userInfoStr = localStorage.getItem('userInfo');

        if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            document.getElementById('display-name').innerText = `${userInfo.fullName} (${userInfo.email})`;
            await refreshData();
        }

    // Logic Tìm kiếm
    document.getElementById('job-search').addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        document.querySelectorAll('.job-item').forEach(item => {
            item.style.display = item.innerText.toLowerCase().includes(value) ? 'flex' : 'none';
        });
    });  
});

// Hàm xử lý gán Workbay (Export ra window để HTML gọi được)
    window.handleAssign = async (jobId, wbId) => {
        if (!wbId) return;
        
        const confirmAssign = confirm(`Xác nhận đưa lệnh #${jobId} vào khoang này?`);
        if (!confirmAssign) return;

        try {
            const res = await workbayApi.assignJobToWorkbay(jobId, wbId);
            // Kiểm tra res hoặc res.success tùy thuộc API trả về
            if (res) {
                alert("Đã điều phối xe vào Workbay thành công!");
                await refreshData(); // Tải lại dữ liệu mà không cần reload trang
            }
        } catch (error) {
            alert("Lỗi khi gán Workbay: " + error.message);
        }
    };

// Cập nhật các hàm global trong main.js
window.viewWbQueue = async (wbId) => {
    const modal = document.getElementById('queue-modal');
    const tableBody = document.getElementById('queue-table-body');
    const modalTitle = document.getElementById('modal-title');
    
    // Hiện modal và thông báo đang tải
    modal.style.display = "block";
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Đang tải dữ liệu...</td></tr>';

    try {
        const res = await workbayApi.getJobCardsByWorkBay(wbId);
        const wbData = res.data;
        const jobCards = wbData.jobCards || [];

        // Cập nhật tiêu đề modal (nếu cần lấy tên Workbay bạn có thể truyền thêm name vào hàm)
        modalTitle.innerHTML = `<i class="fas fa-warehouse"></i> Hàng đợi: ${wbData.name}`;

        if (jobCards.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Không có xe nào trong hàng đợi.</td></tr>';
            return;
        }

        const statusTextMap = {
            2: 'Chờ Mechanic', 3: 'Chờ kiểm tra', 4: 'Đang kiểm tra',
            5: 'Chờ duyệt', 6: 'Đợi khách', 7: 'Đang sửa'
        };

        tableBody.innerHTML = jobCards.map((job, index) => {
            // Lấy danh sách tên dịch vụ
            const servicesHtml = job.services.length > 0 
                ? job.services.map(s => `<span class="badge-service-mini">${s.serviceName}</span>`).join('')
                : '<small style="color:#94a3b8">Chưa chọn dịch vụ</small>';

            const mechHtml = job.mechanics && job.mechanics.length > 0
                ? job.mechanics.map(m => `<div><i class="fas fa-user-cog" style="font-size:0.7rem"></i> ${m.mechanicName}</div>`).join('')
                : '<span style="color:#94a3b8; font-style:italic">Chưa phân công</span>';

            // Format thời gian
            const time = new Date(job.startDate).toLocaleTimeString('vi-VN', {
                hour: '2-digit', minute: '2-digit'
            });

            return `
                <tr>
                    <td style="text-align:center; font-weight:bold">${index + 1}</td>
                    <td>
                        <div style="font-weight:bold; color:#4f46e5">#JC-${job.jobCardId}</div>
                        <small style="color:#64748b">${job.customerName || 'N/A'}</small>
                    </td>
                    <td>
                        <div style="font-weight:bold">${job.vehicle?.licensePlate || 'N/A'}</div>
                        <div style="font-size:0.8rem; color:#64748b">${job.vehicle?.brandName || ''} ${job.vehicle?.modelName || ''}</div>
                    </td>
                    <td>
                        <div style="display:flex; flex-wrap:wrap; gap:4px">${servicesHtml}</div>
                    </td>
                    <td>
                        <div style="font-size:0.85rem; color:#1e293b">${mechHtml}</div>
                    </td>
                    <td>
                        <span class="badge-status s-${job.status}">${statusTextMap[job.status] || 'N/A'}</span>
                        <div style="font-size:0.75rem; color:#94a3b8; margin-top:4px"><i class="far fa-clock"></i> ${time}</div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red">Lỗi: ${error.message}</td></tr>`;
    }
};

window.closeQueueModal = () => {
    document.getElementById('queue-modal').style.display = "none";
};

// Đóng modal khi bấm ra ngoài vùng xám
window.onclick = (event) => {
    const modal = document.getElementById('queue-modal');
    if (event.target == modal) modal.style.display = "none";
};

window.viewJobDetail = async (jobCardId) => {
    const modal = document.getElementById('job-detail-modal');
    const infoBox = document.getElementById('jd-info-basic');
    const servicesBox = document.getElementById('jd-services-list');
    const actionZone = document.getElementById('jd-action-zone');
    
    // Thêm container cho báo cáo kiểm tra nếu chưa có trong HTML của bạn
    // Nếu chưa có, hãy đảm bảo trong modal có 1 div id="jd-estimate-report"
    let estimateBox = document.getElementById('jd-estimate-report');
    if (!estimateBox) {
        estimateBox = document.createElement('div');
        estimateBox.id = 'jd-estimate-report';
        servicesBox.parentNode.insertBefore(estimateBox, servicesBox.nextSibling);
    }

    modal.style.display = "block";
    infoBox.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu chi tiết và báo cáo...</div>';
    estimateBox.innerHTML = ''; 
    actionZone.style.display = "none";

    try {
        // Gọi song song 2 API để tối ưu tốc độ
        const [job, estimateRes] = await Promise.all([
            workbayApi.getJobCardDetail(jobCardId),
            workbayApi.getRepairEstimate(jobCardId)
        ]);

        // 1. Hiển thị thông tin cơ bản & Mechanic phụ trách
        const startTime = new Date(job.startDate).toLocaleString('vi-VN');
        const progress = job.progressPercentage || 0;
        
        // Lấy danh sách thợ
        const mechanicsHtml = (job.mechanics && job.mechanics.length > 0)
            ? job.mechanics.map(m => `<span class="badge-mech" style="background:#e0e7ff; color:#4338ca; padding:3px 8px; border-radius:12px; font-weight:600; font-size:0.85rem; margin-right:5px;"><i class="fas fa-user-cog"></i> ${m.mechanicName}</span>`).join('')
            : '<span style="color:#94a3b8">Chưa có thợ phụ trách</span>';

        infoBox.innerHTML = `
            <div class="info-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom:15px;">
                <div><i class="far fa-calendar-alt"></i> Ngày tạo: <strong>${startTime}</strong></div>
                <div><i class="fas fa-percentage"></i> Tiến độ: <strong>${progress}%</strong></div>
                <div style="grid-column: span 2; padding:8px; background:#f8fafc; border-radius:8px;">
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:4px; font-weight:bold;">NHÂN VIÊN KỸ THUẬT:</div>
                    ${mechanicsHtml}
                </div>
            </div>
            <h9>Thanh tiến độ:</h9>
            <div class="progress-container" style="height:10px; background:#e2e8f0; border-radius:5px; overflow:hidden; margin-bottom:15px;">
                <div class="progress-bar" style="width: ${progress}%; height:100%; background:#4f46e5;"></div>
            </div>
        `;

        // 2. Render danh sách Dịch vụ (Gộp cả ban đầu và phát sinh)
        if (job.services && job.services.length > 0) {
            servicesBox.innerHTML = '<h4 style="margin-bottom:10px; border-left:4px solid #4f46e5; padding-left:10px;">Yêu cầu ban đầu của Khách</h4>' + 
            job.services.map(s => {
                // Highlight nếu là dịch vụ phát sinh (ví dụ dựa trên status của dịch vụ đó là 5)
                const isExtraService = s.status === 5; 
                return `
                    <div class="task-item-row" style="display:flex; justify-content:space-between; background:${isExtraService ? '#fff1f2' : '#f1f5f9'}; margin-bottom:5px; padding:10px; border-radius:6px; border-left: ${isExtraService ? '4px solid #be123c' : 'none'}">
                        <span>${isExtraService ? '<i class="fas fa-plus-circle" style="color:#be123c"></i> ' : ''}${s.description || s.serviceName || s.serviceId}</span>
                    </div>
                `;
            }).join('');
        }

        // 3. Render BÁO CÁO & TÍNH TỔNG TẤT CẢ
        if (estimateRes.success && estimateRes.data && estimateRes.data.length > 0) {
            const estimates = estimateRes.data;
            
            // Sắp xếp: Cũ nhất (ban đầu) xuống dưới, Mới nhất (phát sinh) lên trên
            const initialEst = estimates[estimates.length - 1];
            const extraEsts = estimates.slice(0, -1);
            
            // TÍNH TỔNG CUỐI CÙNG: Cộng dồn grandTotal của tất cả các phiếu
            const totalAllEstimates = estimates.reduce((sum, est) => sum + est.grandTotal, 0);

            let estimateHtml = '';

            // Render các phiếu phát sinh lỗi (Màu đỏ)
            if (extraEsts.length > 0) {
                extraEsts.forEach((est, idx) => {
                    estimateHtml += renderEstimateUI(est, `PHÁT SINH LỖI #${extraEsts.length - idx}`, "#be123c", []);
                });
            }

            // Render phiếu kiểm tra ban đầu (Màu cam)
            // Lưu ý: Dịch vụ ban đầu chỉ hiện ở phiếu này để tránh trùng lặp
            estimateHtml += renderEstimateUI(initialEst, "KIỂM TRA TỔNG QUÁT BAN ĐẦU", "#b45309", job.services.filter(s => s.status !== 5));

            // THÊM DÒNG TỔNG CỘNG CUỐI CÙNG CHO TOÀN BỘ JOB
            estimateHtml += `
                <div style="margin-top:20px; padding:15px; background:#1e293b; color:#fff; border-radius:8px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="font-weight:bold; font-size:1rem;">TỔNG THANH TOÁN DỰ KIẾN:</div>
                    <div style="font-size:1.5rem; font-weight:800; color:#fbbf24;">${totalAllEstimates.toLocaleString()}đ</div>
                </div>
            `;

            estimateBox.innerHTML = estimateHtml;
        } else {
            estimateBox.innerHTML = `<div style="margin-top:15px; text-align:center; padding:15px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; color:#64748b;">Chưa có báo cáo kiểm tra.</div>`;
        }

        // 4. Logic Action Zone
        handleActionZone(job, actionZone);

    } catch (error) {
        infoBox.innerHTML = `<div class="error-msg" style="color:red; text-align:center">Lỗi: ${error.message}</div>`;
    }
};

// Hàm helper để render UI cho từng phiếu (Tránh lặp code)
function renderEstimateUI(est, title, color, servicesToShow = []) {
    const servicePrice = servicesToShow.reduce((sum, s) => sum + (s.price || 0), 0);
    const estServices = est.services || [];
    const estParts = est.spareParts || [];
    return `
        <div style="margin-top:15px; padding:15px; background:#fff; border:2px solid ${color}; border-radius:8px; position:relative;">
            <div style="position:absolute; top:-12px; left:15px; background:${color}; color:#fff; padding:2px 10px; border-radius:10px; font-size:0.75rem; font-weight:bold;">
                ${title}
            </div>
            <div style="font-size:0.85rem; color:#64748b; margin-bottom:10px; margin-top:5px;">
                <i class="far fa-comment-dots"></i> <em>"${est.note || 'Không có ghi chú'}"</em>
            </div>
            <table style="width:100%; font-size:0.85rem; border-collapse: collapse;">
                 ${estServices.map(s => `
                    <tr style="border-bottom:1px solid #f1f5f9; color: #4338ca;">
                        <td style="padding:5px 0;"><i class="fas fa-wrench" style="font-size:0.7rem"></i> ${s.serviceName || 'Dịch vụ'}</td>
                        <td style="text-align:right; font-weight:bold;">${(s.totalAmount || 0).toLocaleString()}đ</td>
                    </tr>
                `).join('')}
                ${est.spareParts.map(p => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:5px 0;">${p.sparePartName} (x${p.quantity})</td>
                        <td style="text-align:right; font-weight:500;">${p.totalAmount.toLocaleString()}đ</td>
                    </tr>
                `).join('')}
                ${servicesToShow.length > 0 ? `
                    <tr style="border-bottom:1px solid #f1f5f9; color:#6366f1;">
                        <td style="padding:5px 0;">+ Tiền công dịch vụ</td>
                        <td style="text-align:right; font-weight:500;">${servicePrice.toLocaleString()}đ</td>
                    </tr>
                ` : ''}
            </table>
            <div style="text-align:right; font-weight:bold; margin-top:10px; color:${color}; border-top:1px dashed #e2e8f0; padding-top:8px;">
                Cộng phiếu: ${est.grandTotal.toLocaleString()}đ
            </div>
        </div>
    `;
}

// Hàm tách riêng để xử lý nút bấm cho đỡ rối
async function handleActionZone(job, actionZone) {
    if (job.status === 2) {
        actionZone.style.display = "block";
        actionZone.innerHTML = `<div style="text-align:center"><i class="fas fa-circle-notch fa-spin"></i> Đang lấy danh sách thợ...</div>`;
        
        try {
            const res = await workbayApi.getMechanics();
            const mechanics = res.data || res;
            
            actionZone.innerHTML = `
                <label style="font-weight:bold; display:block; margin-bottom:8px;">ĐIỀU PHỐI NHÂN VIÊN KỸ THUẬT:</label>
                <div style="display:flex; gap:10px;">
                    <select id="select-mechanic" class="form-group" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
                        <option value="">-- Chọn Mechanic --</option>
                        ${mechanics.map(m => `<option value="${m.employeeId || m.id}">${m.fullName} (ID: ${m.employeeId || m.id})</option>`).join('')}                    </select>
                    <button class="btn-primary" onclick="window.doAssignMechanic(${job.jobCardId})" style="padding:0 20px;">GIAO VIỆC</button>
                </div>
            `;
        } catch (e) {
            actionZone.innerHTML = `<p style="color:red">Không lấy được danh sách thợ.</p>`;
        }
    } else if (job.status === 5) {
        actionZone.style.display = "block";
        actionZone.innerHTML = `
            <div style="text-align:center; padding:10px; border: 2px dashed #f59e0b; border-radius:8px;">
                <p style="margin-bottom:10px; font-weight:bold; color:#b45309">Lệnh đã hoàn thành kiểm tra, chờ bạn duyệt!</p>
                <button class="btn-primary" onclick="window.approveJob(${job.jobCardId})" style="width:100%; height:50px; font-size:1.1rem;">
                    <i class="fas fa-check-double"></i> PHÊ DUYỆT LỆNH SỬA CHỮA
                </button>
            </div>
        `;
    } else if  (job.status === 12) {
        actionZone.style.display = "block";
        actionZone.innerHTML = `
            <div style="text-align:center; padding:12px; border: 2px solid #be123c; background: #fff1f2; border-radius:8px;">
                <p style="margin-bottom:10px; font-weight:bold; color:#9f1239;">
                    <i class="fas fa-tools"></i> PHÁT SINH LỖI MỚI KHI ĐANG SỬA
                </p>
                <button class="btn-primary" onclick="window.approveExtraJob(${job.jobCardId})" 
                        style="width:100%; background:#be123c; height:50px; font-size:1.1rem; border:none;">
                    <i class="fas fa-paper-plane"></i> DUYỆT & GỬI BÁO GIÁ PHÁT SINH
                </button>
            </div>
        `;
    }
    else {
        actionZone.style.display = "none";
    }
}

// Hàm đóng modal
window.closeJobDetailModal = () => document.getElementById('job-detail-modal').style.display = "none";

// Hàm thực thi giao việc (Sửa lại)
window.doAssignMechanic = async (jobCardId) => {
    const selectElem = document.getElementById('select-mechanic');
    const mechId = selectElem.value;
    
    if(!mechId) {
        alert("Vui lòng chọn thợ!");
        return;
    }
    
    // Bạn có thể lấy tên thợ để confirm cho chắc
    const mechName = selectElem.options[selectElem.selectedIndex].text;

    if(confirm(`Xác nhận giao lệnh #JC-${jobCardId} cho thợ: ${mechName}?`)) {
        try {
            // Gọi API với đúng cấu trúc: id lệnh, id thợ, ghi chú
            await workbayApi.assignMechanic(jobCardId, mechId, "Supervisor phân công trực tiếp");
            
            alert("Đã giao việc thành công!");
            
            // Đóng modal chi tiết
            window.closeJobDetailModal();
            
            // Cập nhật lại toàn bộ giao diện
            await refreshData(); 
        } catch (error) {
            alert("Lỗi: " + error.message);
        }
    }
};

//Hàm xử lý duyệt báo cáo kiểm tra
window.approveJob = async (jobCardId) => {
    const isConfirm = confirm(`Bạn đã kiểm tra kỹ báo cáo của Mechanic cho lệnh #JC-${jobCardId}?\n\nHành động này sẽ gửi báo giá tới khách hàng.`);
    
    if (!isConfirm) return;

    const btn = document.querySelector(`#jd-action-zone button`);
    const originalBtnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ĐANG XỬ LÝ...`;

    try {
        const res = await workbayApi.updateJobCardStatus(jobCardId, 6);
        if (res.success || res) {
            alert("Phê duyệt thành công! Lệnh đã được chuyển sang trạng thái 'Chờ khách duyệt'.");
            window.closeJobDetailModal();
            await refreshData(); 
        } else {
            throw new Error(res.message || "Phê duyệt thất bại.");
        }
    } catch (error) {
        alert("Lỗi khi phê duyệt: " + error.message);
        // Khôi phục nút nếu lỗi
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
    }
}

//Hàm xử lý duyệt phát sinh
window.approveExtraJob = async (jobCardId) => {
    if (!confirm("Xác nhận duyệt các hạng mục PHÁT SINH và gửi thông báo cho khách hàng?")) return;

    try {
        // Giả sử quy trình vẫn là đẩy về 6 (Chờ khách duyệt) 
        // Nhưng Backend sẽ biết đây là duyệt cho phần phát sinh dựa vào status hiện tại là 12
        const res = await workbayApi.updateJobCardStatus(jobCardId, 6); 
        if (res) {
            alert("Đã gửi báo giá phát sinh cho khách thành công!");
            window.closeJobDetailModal();
            await refreshData();
        }
    } catch (error) {
        alert("Lỗi: " + error.message);
    }
};
