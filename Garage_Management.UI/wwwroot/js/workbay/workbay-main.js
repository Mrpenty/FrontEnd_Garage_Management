import { workbayApi } from './workbay-api.js';
import { repairExecution } from '../repairation/jobcard-repairation-main.js';
import { repairApi } from '../repairation/jobcard-repairation-api.js';

let globalWorkbays = [];
let currentPendingPage = 1;
const ITEMS_PER_PAGE = 3;

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

        globalWorkbays = workbays;

        currentPendingPage = 1; // Reset về trang 1 khi refresh
        renderPendingJobs(jobs, workbays);
        renderWorkbayGrid(workbays);
    } catch (err) {
        console.error("Refresh lỗi:", err);
    }
}

// Hàm render danh sách JobCard với phân trang
function renderPendingJobs(jobs, allWorkbays) {
    const listContainer = document.getElementById('pending-jobs-list');
    const pendingJobs = jobs.filter(job => job.status === 1);

    if (pendingJobs.length === 0) {
        listContainer.innerHTML = '<p class="empty-msg">Không có xe mới chờ điều phối.</p>';
        return;
    }

    const now = new Date();
    const totalPages = Math.ceil(pendingJobs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPendingPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedJobs = pendingJobs.slice(startIndex, endIndex);

    // Chuẩn bị dữ liệu Dropdown
    const wbOptions = allWorkbays.map(wb => {
        const cards = wb.jobCards || [];
        const activeJobsInWb = cards.filter(job => 
            [1, 2, 3, 4, 5, 6, 7, 12].includes(job.status)
        );
        const count = activeJobsInWb.length;
        return `<option value="${wb.id}">${wb.name} (${count} xe đang chờ)</option>`;
    }).join('');

    let html = paginatedJobs.map(job => {
        const customerName = job.customer 
            ? `${job.customer.lastName} ${job.customer.firstName}` 
            : 'Khách vãng lai';
        const plate = job.vehicle ? job.vehicle.licensePlate : 'N/A';
        const serviceSummary = job.services && job.services.length > 0
            ? job.services.map(s => s.serviceName).join(', ')
            : 'Chưa chọn dịch vụ';
        const totalTime = job.totalEstimateMinute || 0;

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

    // Thêm phần Pagination
    if (totalPages > 1) {
        html += `
            <div class="pagination-container" style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:20px; padding-top:15px; border-top:1px solid #e2e8f0;">
                <button class="btn-pagination" onclick="window.changePendingPage(1)" ${currentPendingPage === 1 ? 'disabled' : ''} style="padding:8px 12px; border-radius:4px; border:1px solid #cbd5e1; background:#fff; cursor:pointer; font-weight:500;">
                    <i class="fas fa-chevron-left"></i> Đầu
                </button>
                <button class="btn-pagination" onclick="window.changePendingPage(${currentPendingPage - 1})" ${currentPendingPage === 1 ? 'disabled' : ''} style="padding:8px 12px; border-radius:4px; border:1px solid #cbd5e1; background:#fff; cursor:pointer;">
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div style="display:flex; gap:5px; align-items:center;">
                    ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => `
                        <button class="btn-pagination" onclick="window.changePendingPage(${page})" style="padding:6px 12px; border-radius:4px; border:1px solid #cbd5e1; background:${currentPendingPage === page ? '#4f46e5' : '#fff'}; color:${currentPendingPage === page ? '#fff' : '#1e293b'}; cursor:pointer; font-weight:${currentPendingPage === page ? 'bold' : 'normal'};">
                            ${page}
                        </button>
                    `).join('')}
                </div>
                
                <button class="btn-pagination" onclick="window.changePendingPage(${currentPendingPage + 1})" ${currentPendingPage === totalPages ? 'disabled' : ''} style="padding:8px 12px; border-radius:4px; border:1px solid #cbd5e1; background:#fff; cursor:pointer;">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="btn-pagination" onclick="window.changePendingPage(${totalPages})" ${currentPendingPage === totalPages ? 'disabled' : ''} style="padding:8px 12px; border-radius:4px; border:1px solid #cbd5e1; background:#fff; cursor:pointer; font-weight:500;">
                    Cuối <i class="fas fa-chevron-right"></i>
                </button>
                
                <span style="margin-left:15px; color:#64748b; font-size:0.9rem;">
                    Trang <strong>${currentPendingPage}</strong> / ${totalPages} (${pendingJobs.length} xe)
                </span>
            </div>
        `;
    }

    listContainer.innerHTML = html;
}

// Hàm thay đổi trang
window.changePendingPage = (newPage) => {
    currentPendingPage = newPage;
    // Lấy dữ liệu từ localStorage để re-render
    const supervisorId = localStorage.getItem('employeeId');
    if (supervisorId) {
        Promise.all([
            workbayApi.getJobsBySupervisor(supervisorId),
            workbayApi.getAllWorkbays()
        ]).then(([jobsRes, wbsRes]) => {
            const jobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes.data || []);
            const workbays = Array.isArray(wbsRes) ? wbsRes : (wbsRes.data || []);
            renderPendingJobs(jobs, workbays);
        });
    }
};

// Hàm render lưới Workbay
        function renderWorkbayGrid(workbays) {
            const grid = document.getElementById('workbay-grid');
            const statusTextMap = {
                2: 'Chờ giao Mechanic', 3: 'Chờ kiểm tra', 4: 'Đang kiểm tra',
                5: 'Chờ Supervisor duyệt', 6: 'Chờ Khách duyệt', 7: 'Đang sửa chữa', 12: "Phát sinh lỗi"
            };

            grid.innerHTML = workbays.map(wb => {
                let displayJob = null;
                const allCards = Array.isArray(wb.jobCards) ? wb.jobCards : [];
                const cards = allCards.filter(j => [2, 3, 4, 5, 6, 7, 12].includes(j.status));
                
                if (cards.length > 0) {
                    const highPriority = cards.filter(j => [4, 5, 6, 7, 12].includes(j.status));
                    if (highPriority.length > 0) {
                        displayJob = highPriority.sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0))[0];
                    } else {
                        displayJob = cards.sort((a, b) => (a.queueOrder || 0) - (b.queueOrder || 0))[0];
                    }
                }

                // Workbay trống khi: BE đã set status = 1, HOẶC không có jobcard active nào.
                // Fallback cards.length === 0 để phòng trường hợp releaseWorkbay không reset wb.status ở BE.
                const isEmpty = wb.status === 1 || cards.length === 0;
                const statusClass = isEmpty ? 'empty' : 'active';
                const hasJob = displayJob != null;

                const mechanicNames = (displayJob?.mechanics && displayJob.mechanics.length > 0)
                 ? displayJob.mechanics.map(m => m.mechanicName).join(', ')
                 : "Chưa có thợ";

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
                            ${[4, 5, 6, 7, 12].includes(displayJob.status) ? `
                                <div class="wb-eta" style="font-size:0.85rem; color:#f59e0b; font-weight:bold; margin-bottom:5px;">
                                    <i class="fas fa-history"></i> Xong dự kiến: <span style="color:#1e293b">Cập nhật sau</span>
                                </div>
                            ` : ''}
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

    function getBusyMechanics(allWorkbays) {
        const busyIds = new Set();
        if (!Array.isArray(allWorkbays)) return busyIds;
        allWorkbays.forEach(wb => {
        (wb.jobCards || []).forEach(job => {
            // Bao gồm các trạng thái đang làm việc
            if ([4, 5, 6, 7, 12].includes(job.status)) {
                (job.mechanics || []).forEach(m => {
                    // Lấy mechanicId hoặc id tùy theo cấu trúc thợ trong JobCard
                    const id = m.mechanicId || m.id || m.employeeId;
                    if (id) busyIds.add(id);
                });
            }
        });
    });
    return busyIds;
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
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Đang tải dữ liệu...</td></tr>';

    try {
        const res = await workbayApi.getJobCardsByWorkBay(wbId);
        const wbData = res.data;
        const allCards = wbData.jobCards || [];
        const jobCards = allCards.filter(job => [2, 3, 4, 5, 6, 7, 12].includes(job.status));
        window.currentQueueData = jobCards;
        // Cập nhật tiêu đề modal (nếu cần lấy tên Workbay bạn có thể truyền thêm name vào hàm)
        modalTitle.innerHTML = `<i class="fas fa-warehouse"></i> Hàng đợi: ${wbData.name}`;

        if (jobCards.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center">Không có xe nào trong hàng đợi.</td></tr>';
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

            // Render nút hành động tùy theo status
            let actionBtn = '';
            if (job.status === 2) {
                // Status 2: Hiện nút "Giao thợ"
                actionBtn = `<button class="btn-edit-small" style="background:#4f46e5; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.8rem;" 
                    onclick="window.openMechanicAssignModal(${job.jobCardId})">
                    <i class="fas fa-user-check"></i> Giao thợ
                </button>`;
            } else if (job.status === 3) {
                // Status 3: Hiện nút "Sửa xe này"
                actionBtn = `<button class="btn-edit-small" style="background:#10b981; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.8rem;"
                    onclick="window.startInspectionFromQueue(${job.jobCardId})">
                    <i class="fas fa-tools"></i> Sửa xe này
                </button>`;
            } 

            return `
                <tr>
                    <td style="text-align:center;">
                        <div style="display:flex; flex-direction:column; gap:2px; align-items:center;">
                            ${index > 0 ? `<button class="btn-sort" onclick="window.moveJob(${index}, 'up', ${wbId})"><i class="fas fa-chevron-up"></i></button>` : ''}
                            <span style="font-weight:bold">${index + 1}</span>
                            ${index < jobCards.length - 1 ? `<button class="btn-sort" onclick="window.moveJob(${index}, 'down', ${wbId})"><i class="fas fa-chevron-down"></i></button>` : ''}
                        </div>
                    </td>
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
                    <td style="text-align:center;">
                        ${actionBtn}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red">Lỗi: ${error.message}</td></tr>`;
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
        handleActionZone(job, actionZone, globalWorkbays);

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
                        <td style="padding:5px 0;"><i class="fas fa-wrench" style="font-size:0.7rem"></i> Tiền công làm dịch vụ ${s.serviceName || 'Dịch vụ'}</td>
                        <td style="text-align:right; font-weight:bold;">${(s.totalAmount || 0).toLocaleString()}đ</td>
                    </tr>
                `).join('')}
                ${est.spareParts.map(p => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:5px 0;"> Tiền phụ tùng: ${p.sparePartName} (x${p.quantity})</td>
                        <td style="text-align:right; font-weight:500;">${p.totalAmount.toLocaleString()}đ</td>
                    </tr>
                `).join('')}
            </table>
            <div style="text-align:right; font-weight:bold; margin-top:10px; color:${color}; border-top:1px dashed #e2e8f0; padding-top:8px;">
                Cộng phiếu: ${est.grandTotal.toLocaleString()}đ
            </div>
        </div>
    `;
}

// Tra workbay id đang chứa jobCard từ globalWorkbays (fallback cho trường hợp
// getJobCardDetails không trả workbay id). Dùng trước khi gọi finalizeRepair.
function findWorkbayIdForJob(jobCardId) {
    for (const wb of globalWorkbays || []) {
        const cards = Array.isArray(wb.jobCards) ? wb.jobCards : [];
        if (cards.some(j => j.jobCardId === jobCardId || j.jobCardId == jobCardId)) {
            return wb.id ?? wb.workBayId ?? wb.workbayId;
        }
    }
    return null;
}

// Inject workbay id vào detail trước khi finalize, đảm bảo release luôn chạy.
function prepareDetailForFinalize(detail, jobCardId) {
    const existingWbId = detail.workBayId
        ?? detail.workbayId
        ?? detail.workBay?.id
        ?? detail.workbay?.id;
    if (!existingWbId) {
        const wbId = findWorkbayIdForJob(jobCardId);
        if (wbId != null) {
            detail.workBayId = wbId;
            detail.workbayId = wbId;
        }
    }
    return detail;
}

// Supervisor finalize hộ → gọi updateMechanicStatus cho TỪNG mechanic với mechanicId
// tường minh (vì BE endpoint mặc định tra theo token, không khớp với supervisor).
async function releaseAllMechanicsForSupervisor(detail, jobCardId) {
    const mechanics = Array.isArray(detail?.mechanics) ? detail.mechanics : [];
    if (mechanics.length === 0) {
        console.warn("[releaseAllMechanics] detail.mechanics rỗng, bỏ qua.");
        return;
    }
    await Promise.all(mechanics.map(m => {
        const id = m.mechanicId ?? m.employeeId ?? m.id;
        if (id == null) {
            console.warn("[releaseAllMechanics] mechanic không có id, bỏ qua", m);
            return Promise.resolve(false);
        }
        return repairApi.updateMechanicStatus(jobCardId, 3, id);
    }));
}

// Tính progress và tìm target khi supervisor xác nhận task/service.
// overrideTaskIds: Set các jobCardServiceTaskId được coi như status 3 (đã xong).
function computeProgress(detail, overrideTaskIds) {
    const overrides = overrideTaskIds instanceof Set ? overrideTaskIds : new Set(overrideTaskIds || []);
    let totalTasks = 0;
    let completedTasks = 0;

    (detail.services || []).forEach(svc => {
        if (parseInt(svc.status) === 4) return;
        const hasTasks = svc.serviceTasks && svc.serviceTasks.length > 0;
        if (hasTasks) {
            svc.serviceTasks.forEach(t => {
                totalTasks++;
                const s = overrides.has(t.jobCardServiceTaskId) ? 3 : parseInt(t.status);
                if (s === 3) completedTasks++;
            });
        } else {
            totalTasks++;
            const s = overrides.has(svc.jobCardServiceId) ? 3 : parseInt(svc.status);
            if (s === 3) completedTasks++;
        }
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

// Supervisor cập nhật 1 task. Giống handleTaskAction của mechanic nhưng re-render modal thay vì reload.
window.supervisorHandleTaskAction = async (jobCardId, taskName, currentStatus, nextStatus, serviceStatus) => {
    if (parseInt(serviceStatus) === 5) {
        return Swal.fire('Thông báo', 'Hạng mục này đang tạm dừng!', 'warning');
    }
    if (!confirm(`Xác nhận cập nhật: ${taskName}?`)) return;

    try {
        const detail = await repairApi.getJobCardDetails(jobCardId);
        if (!detail || !detail.services) throw new Error("Không lấy được chi tiết phiếu.");

        let targetServiceId = null;
        let targetTaskId = null;
        detail.services.forEach(svc => {
            (svc.serviceTasks || []).forEach(t => {
                if (t.taskName === taskName && targetTaskId === null) {
                    targetServiceId = svc.jobCardServiceId;
                    targetTaskId = t.jobCardServiceTaskId;
                }
            });
        });
        if (targetTaskId === null) throw new Error("Không tìm thấy task.");

        const targetNextStatus = parseInt(nextStatus);
        const overrides = targetNextStatus === 3 ? new Set([targetTaskId]) : new Set();
        const progress = computeProgress(detail, overrides);

        const request = {
            statusJobCard: (progress === 100) ? 8 : 7,
            progressPercentage: progress,
            progressNotes: `Supervisor cập nhật: ${taskName}`,
            serviceUpdates: [{
                jobCardServiceId: targetServiceId,
                statusService: parseInt(serviceStatus)
            }],
            serviceTaskUpdates: [{
                jobCardServiceTaskId: targetTaskId,
                statusServiceTask: targetNextStatus
            }]
        };

        const ok = await repairApi.updateProgress(jobCardId, request);
        if (!ok) throw new Error("Cập nhật tiến độ thất bại.");

        if (progress === 100) {
            await releaseAllMechanicsForSupervisor(detail, jobCardId);
            await repairExecution.finalizeRepair(jobCardId, prepareDetailForFinalize(detail, jobCardId));
        } else {
            await window.viewJobDetail(jobCardId);
            await refreshData();
        }
    } catch (error) {
        console.error("Supervisor task action lỗi:", error);
        Swal.fire('Lỗi', error.message || 'Có lỗi khi cập nhật.', 'error');
    }
};

// Supervisor xác nhận hoàn thành TOÀN BỘ service (set mọi task còn lại → 3, service → 3).
window.supervisorConfirmService = async (jobCardId, serviceId, serviceName) => {
    if (!confirm(`Xác nhận hoàn thành toàn bộ hạng mục: ${serviceName}?`)) return;

    try {
        const detail = await repairApi.getJobCardDetails(jobCardId);
        if (!detail || !detail.services) throw new Error("Không lấy được chi tiết phiếu.");

        const target = detail.services.find(s => s.jobCardServiceId == serviceId);
        if (!target) throw new Error("Không tìm thấy hạng mục.");
        if (parseInt(target.status) === 5) {
            return Swal.fire('Thông báo', 'Hạng mục đang tạm dừng, không thể hoàn thành.', 'warning');
        }

        const pendingTasks = (target.serviceTasks || []).filter(t => parseInt(t.status) !== 3);
        const taskUpdates = pendingTasks.map(t => ({
            jobCardServiceTaskId: t.jobCardServiceTaskId,
            statusServiceTask: 3
        }));

        const overrides = new Set(pendingTasks.map(t => t.jobCardServiceTaskId));
        if (!target.serviceTasks || target.serviceTasks.length === 0) {
            overrides.add(target.jobCardServiceId);
        }
        const progress = computeProgress(detail, overrides);

        const request = {
            statusJobCard: (progress === 100) ? 8 : 7,
            progressPercentage: progress,
            progressNotes: `Supervisor hoàn thành hạng mục: ${serviceName}`,
            serviceUpdates: [{
                jobCardServiceId: parseInt(serviceId),
                statusService: 3
            }],
            serviceTaskUpdates: taskUpdates
        };

        const ok = await repairApi.updateProgress(jobCardId, request);
        if (!ok) throw new Error("Cập nhật tiến độ thất bại.");

        await repairApi.updateJobCardServiceStatus(jobCardId, serviceId, 3);

        if (progress === 100) {
            await releaseAllMechanicsForSupervisor(detail, jobCardId);
            await repairExecution.finalizeRepair(jobCardId, prepareDetailForFinalize(detail, jobCardId));
        } else {
            await window.viewJobDetail(jobCardId);
            await refreshData();
        }
    } catch (error) {
        console.error("Supervisor confirm service lỗi:", error);
        Swal.fire('Lỗi', error.message || 'Có lỗi khi hoàn thành hạng mục.', 'error');
    }
};

// Render panel "Đang sửa chữa" cho supervisor: danh sách task có thể xác nhận + nút báo cáo phát sinh.
// Dùng shape BE từ workbayApi.getJobCardDetail: service.status, service.jobCardServiceId,
// task.jobCardServiceTaskId, task.status, task.taskName.
function renderRepairExecutionPanel(job) {
    const isJobOnHold = job.status === 12;
    const services = Array.isArray(job.services) ? job.services : [];

    // Hiện mọi service không bị huỷ (status 4). Đồng bộ với computeProgress để supervisor
    // không bị "che" service chưa bắt đầu (status 1) khiến tiến độ không bao giờ lên 100%.
    const visibleServices = services.filter(s => parseInt(s.status) !== 4);

    let servicesHtml = '';
    visibleServices.forEach(service => {
        const serviceStatus = parseInt(service.status);
        const isServiceOnHold = serviceStatus === 5;
        const isServiceDone = serviceStatus === 3;
        const isDisabled = isJobOnHold || isServiceOnHold || isServiceDone;
        const tasks = Array.isArray(service.serviceTasks) ? service.serviceTasks : [];
        const estimateMin = service.totalEstimateMinute != null ? `${service.totalEstimateMinute}p` : '';
        const serviceDisplayName = service.serviceName || service.description || `#${service.jobCardServiceId}`;
        const serviceNameSafe = serviceDisplayName.replace(/'/g, "\\'");

        const lockBanner = (isJobOnHold || isServiceOnHold) ? `
            <div style="background:#fff3cd; color:#856404; padding:8px; border-radius:4px; font-size:0.75rem; margin-bottom:8px; border:1px solid #ffeeba;">
                <i class="fa-solid fa-lock"></i> ${isJobOnHold ? 'Phiếu chờ duyệt phát sinh.' : 'Hạng mục đang tạm dừng.'} Không thể thao tác.
            </div>` : '';

        const doneBadge = isServiceDone ? `
            <div style="background:#d1fae5; color:#065f46; padding:6px 8px; border-radius:4px; font-size:0.75rem; margin-bottom:8px; border:1px solid #6ee7b7;">
                <i class="fa-solid fa-circle-check"></i> Hạng mục đã hoàn thành.
            </div>` : '';

        const tasksHtml = tasks.map(task => {
            const taskStatus = parseInt(task.status);
            const btnClass = taskStatus === 2 ? 'btn-secondary' : (taskStatus === 3 ? 'btn-secondary' : 'btn-outline-secondary');
            const btnText = taskStatus === 2 ? 'Đang làm...' : (taskStatus === 3 ? 'Đã xong' : 'Bắt đầu');
            const nextStatus = taskStatus === 2 ? 3 : (taskStatus === 3 ? 1 : 2);
            const taskNameSafe = (task.taskName || '').replace(/'/g, "\\'");

            return `
                <li style="font-size:0.85rem; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px; border-radius:4px; border:1px solid #eee;">
                    <span style="color:#444; font-weight:500;">${task.taskName || ''}</span>
                    <button class="${btnClass} task-action-btn"
                        ${isDisabled ? 'disabled' : ''}
                        onclick="window.supervisorHandleTaskAction(${job.jobCardId}, '${taskNameSafe}', ${taskStatus}, ${nextStatus}, ${serviceStatus})">
                        ${btnText}
                    </button>
                </li>`;
        }).join('');

        const confirmServiceBtn = (!isDisabled) ? `
            <button style="background:#10b981; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer;"
                onclick="window.supervisorConfirmService(${job.jobCardId}, ${service.jobCardServiceId}, '${serviceNameSafe}')">
                <i class="fa-solid fa-check-double"></i> Xong hạng mục
            </button>` : '';

        servicesHtml += `
            <div class="service-block" style="margin-bottom:15px; opacity:${isDisabled ? '0.6' : '1'};">
                <div style="font-weight:bold; color:#e63946; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span><i class="fa-solid fa-wrench"></i> ${serviceDisplayName}</span>
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:0.8rem; color:#888;">${estimateMin}</span>
                        ${confirmServiceBtn}
                    </span>
                </div>
                ${lockBanner}
                ${doneBadge}
                <ul style="list-style:none; padding-left:5px; margin:0;">
                    ${tasksHtml}
                </ul>
            </div>`;
    });

    const emptyHtml = `<p style="font-size:0.9rem; color:#888;">Không có dịch vụ nào đang thực hiện.</p>`;

    return `
        <div style="border:2px dashed #4f46e5; border-radius:8px; padding:15px; background:#fafaff;">
            <div style="font-weight:bold; color:#4f46e5; margin-bottom:10px;">
                <i class="fa-solid fa-list-check"></i> HẠNG MỤC ĐANG THỰC HIỆN
            </div>
            ${servicesHtml || emptyHtml}
            <button class="btn-primary" style="width:100%; margin-top:10px; background:#be123c; border:none; padding:10px; border-radius:8px; color:#fff; font-weight:bold; cursor:pointer;"
                onclick="window.openNewFaultPopup(${job.jobCardId}, 6)">
                <i class="fa-solid fa-file-medical"></i> LẬP BÁO CÁO PHÁT SINH
            </button>
        </div>`;
}

// Hàm tách riêng để xử lý nút bấm cho đỡ rối
async function handleActionZone(job, actionZone, allWorkbays) {
    if (job.status === 2) {
        actionZone.style.display = "block";
        actionZone.innerHTML = `<div style="text-align:center"><i class="fas fa-circle-notch fa-spin"></i> Đang lấy danh sách thợ...</div>`;
        
        try {
            const res = await workbayApi.getMechanics();
            const mechanics = res.data || res;
            const busyMechanics = getBusyMechanics(allWorkbays);

            actionZone.innerHTML = `
                <label style="font-weight:bold; display:block; margin-bottom:8px;">ĐIỀU PHỐI NHÂN VIÊN KỸ THUẬT:</label>
                <div style="display:flex; gap:10px;">
                    <select id="select-mechanic" class="form-group" style="flex:1; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
                        <option value="">-- Chọn Mechanic --</option>
                        ${mechanics.map(m => {
                            const isBusy = busyMechanics.has(m.employeeId || m.id);
                            const statusText = isBusy ? ' (⚠️ Đang bận khoang khác)' : ' (✅ Đang rảnh)';
                            const style = isBusy ? 'color: #be123c;' : 'color: #10b981;';
                            return `<option value="${m.employeeId || m.id}" data-busy="${isBusy}" style="${style}">
                                ${m.fullName}${statusText}
                            </option>`;
                        }).join('')}
                    </select>
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
    } else if (job.status === 7) {
        actionZone.style.display = "block";
        actionZone.innerHTML = renderRepairExecutionPanel(job);
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
    const selectedOption = selectElem.options[selectElem.selectedIndex];
    const mechId = selectElem.value;
    
    if(!mechId) {
        alert("Vui lòng chọn thợ!");
        return;
    }
    
    // Bạn có thể lấy tên thợ để confirm cho chắc
    const mechName = selectedOption.text.split(' (')[0];
    const isBusy = selectedOption.getAttribute('data-busy') === 'true';

    const confirmMsg = isBusy 
        ? `Thợ ${mechName} đang bận công việc ở khoang khác, bạn chắc chắn muốn giao cho thợ này không?`
        : `Xác nhận giao lệnh #JC-${jobCardId} cho thợ ${mechName}?`;

    if(confirm(confirmMsg)) {
        try {
            await workbayApi.assignMechanic(jobCardId, mechId, "Supervisor phân công");
            alert("Đã giao việc thành công!");
            window.closeJobDetailModal();
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

window.moveJob = async (currentIndex, direction, workBayId) => {
    const queue = window.currentQueueData;
    if (!queue) return;

    const currentJob = queue[currentIndex];
    let prevId = null;
    let nextId = null;

    if (direction === 'up') {
        // Nếu lên trên: Vị trí mới là index - 1
        // Job đứng trước vị trí mới sẽ là index - 2
        // Job đứng sau vị trí mới sẽ là index - 1 (chính là job bị đẩy xuống)
        prevId = currentIndex - 2 >= 0 ? queue[currentIndex - 2].jobCardId : null;
        nextId = queue[currentIndex - 1].jobCardId;
    } else {
        // Nếu xuống dưới: Vị trí mới là index + 1
        // Job đứng trước vị trí mới là index + 1 (chính là job bị đẩy lên)
        // Job đứng sau vị trí mới là index + 2
        prevId = queue[currentIndex + 1].jobCardId;
        nextId = currentIndex + 2 < queue.length ? queue[currentIndex + 2].jobCardId : null;
    }

    const payload = {
        jobCardId: currentJob.jobCardId,
        workBayId: workBayId,
        previousJobCardId: prevId,
        nextJobCardId: nextId
    };

    try {
        // Hiển thị loading nhẹ hoặc disable nút để tránh bấm liên tục
        await workbayApi.reorderQueue(payload);
        
        // Tải lại danh sách hàng đợi sau khi đổi
        await window.viewWbQueue(workBayId); 
        
        // Tải lại grid bên ngoài để cập nhật số lượng/thứ tự hiển thị
        await refreshData(); 
    } catch (error) {
        alert("Không thể thay đổi thứ tự: " + error.message);
    }
};

// Hàm mở modal giao thợ cho Queue
window.openMechanicAssignModal = async (jobCardId) => {
    const confirmAssign = confirm(`Bạn muốn giao lệnh #JC-${jobCardId} cho thợ nào?`);
    if (!confirmAssign) return;

    try {
        const res = await workbayApi.getMechanics();
        const mechanics = res.data || res;
        const busyMechanics = getBusyMechanics(globalWorkbays);

        // Tạo modal tạm thời để chọn mechanic
        const modalHtml = `
            <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:9999; background:#fff; padding:20px; border-radius:8px; box-shadow:0 10px 40px rgba(0,0,0,0.3); min-width:400px;">
                <h3 style="margin-top:0; color:#1e293b;">Chọn thợ</h3>
                <select id="temp-select-mechanic" class="form-group" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:15px;">
                    <option value="">-- Chọn Mechanic --</option>
                    ${mechanics.map(m => {
                        const isBusy = busyMechanics.has(m.employeeId || m.id);
                        const statusText = isBusy ? ' (⚠️ Đang bận)' : ' (✅ Rảnh)';
                        const style = isBusy ? 'color: #be123c;' : 'color: #10b981;';
                        return `<option value="${m.employeeId || m.id}" data-busy="${isBusy}" style="${style}">
                            ${m.fullName}${statusText}
                        </option>`;
                    }).join('')}
                </select>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.confirmMechanicAssignFromQueue(${jobCardId})" style="flex:1; background:#4f46e5; color:#fff; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-check"></i> Xác nhận
                    </button>
                    <button onclick="window.closeTempModal()" style="flex:1; background:#94a3b8; color:#fff; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                </div>
            </div>
            <div id="temp-modal-backdrop" onclick="window.closeTempModal()" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9998;"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        window.tempModalId = 'temp-select-mechanic';
    } catch (e) {
        alert("Không lấy được danh sách thợ.");
    }
};

window.confirmMechanicAssignFromQueue = async (jobCardId) => {
    const selectElem = document.getElementById('temp-select-mechanic');
    const mechId = selectElem.value;
    
    if (!mechId) {
        alert("Vui lòng chọn thợ!");
        return;
    }

    try {
        await workbayApi.assignMechanic(jobCardId, mechId, "Supervisor phân công từ hàng đợi");
        alert("Đã giao việc thành công!");
        window.closeTempModal();
        // Reload lại hàng đợi
        const modal = document.getElementById('queue-modal');
        if (modal && modal.style.display === 'block') {
            const wbId = window.currentWbId;
            if (wbId) await window.viewWbQueue(wbId);
        }
        await refreshData();
    } catch (error) {
        alert("Lỗi: " + error.message);
    }
};

window.startInspectionFromQueue = async (jobCardId) => {
    try {
        // 1. Lấy thông tin mechanic
        const detail = await workbayApi.getJobCardDetail(jobCardId);
        
        if (!detail.mechanics || detail.mechanics.length === 0) {
            Swal.fire("Thông báo", "JobCard chưa có thợ được giao!", "warning");
            return;
        }

        const mechanic = detail.mechanics[0];
        const mechanicId = mechanic.mechanicId || mechanic.employeeId || mechanic.id;

        if (!mechanicId) {
            Swal.fire("Lỗi", "Không tìm thấy ID của thợ!", "error");
            return;
        }

        // 2. Xác nhận
        const result = await Swal.fire({
            title: 'Xác nhận?',
            text: `Bắt đầu kiểm tra xe với thợ ${mechanic.mechanicName || 'được phân công'}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        // 3. Gọi API startInspection
        // Lưu ý: Nếu hàm startInspection trong workbayApi sử dụng axios hoặc fetch, 
        // nó cần được xử lý để trả về data ngay cả khi status là 400.
        const res = await workbayApi.startInspection(jobCardId, mechanicId);
        
        // KIỂM TRA LỖI Ở ĐÂY: 
        // Backend của bạn trả về Success: true/false trong body của ApiResponse
        if (res && res.success) {
            await Swal.fire("Thành công", res.message || "Đã bắt đầu kiểm tra!", "success");
            
            // Đóng modal chi tiết nếu có
            if (typeof window.closeTempModal === 'function') window.closeTempModal();
            
            // Reload lại hàng đợi (Queue)
            const modal = document.getElementById('queue-modal');
            if (modal && modal.style.display === 'block') {
                const wbId = window.currentWbId;
                if (wbId) await window.viewWbQueue(wbId);
            }
            
            // Reload data trang chủ (Grid)
            if (typeof refreshData === 'function') await refreshData();
        } else {
            // Trường hợp backend trả về success: false (BadRequest)
            const errorMsg = res && res.message ? res.message : "Bắt đầu kiểm tra thất bại.";
            Swal.fire("Không thể thực hiện", errorMsg, "error");
        }

    } catch (error) {
        // Trường hợp lỗi kết nối hoặc lỗi code JS
        console.error("Inspection Error:", error);
        Swal.fire("Lỗi hệ thống", error.message || "Không thể kết nối đến máy chủ", "error");
    }
};

window.closeTempModal = () => {
    const backdrop = document.getElementById('temp-modal-backdrop');
    const selectElem = document.getElementById('temp-select-mechanic');
    
    if (backdrop) backdrop.remove();
    if (selectElem) selectElem.parentElement.remove();
};

// Lưu workbay id hiện tại khi mở queue modal
const originalViewWbQueue = window.viewWbQueue;
window.viewWbQueue = async (wbId) => {
    window.currentWbId = wbId;
    return originalViewWbQueue.call(this, wbId);
};
