import { workbayApi } from './workbay-api.js';

    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Hiển thị tên tài khoản đang đăng nhập
        const userInfoStr = localStorage.getItem('userInfo');
        const employeeId = localStorage.getItem('employeeId');
        console.log(employeeId);
        if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            document.getElementById('display-name').innerText = `${userInfo.fullName} (${userInfo.email})`;
            const supervisorId = employeeId;

            // Load dữ liệu ban đầu
            await Promise.all([
                loadPendingJobs(supervisorId),
                loadWorkbayStatus()
            ]);
        }

        async function loadPendingJobs(supervisorId) {
            const listContainer = document.getElementById('pending-jobs-list');
            const res = await workbayApi.getJobsBySupervisor(supervisorId);
            const jobs = res.data || res;

            // Map trạng thái sang text để dễ đọc
            const statusMap = { 1: "Chờ kiểm tra", 2: "Đang sửa chữa", 3: "Hoàn thành" };

            listContainer.innerHTML = jobs.map(job => `
                <div class="job-item">
                    <div class="job-info">
                        <span class="job-id"><strong>#JC-${job.jobCardId}</strong></span>
                        <span class="job-meta">
                            <i class="fas fa-calendar-alt"></i> ${new Date(job.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span class="job-status">
                            <i class="fas fa-info-circle"></i> ${statusMap[job.status] || "Không xác định"}
                        </span>
                    </div>
                    <div class="assign-action">
                        <select class="select-wb-dropdown" onchange="handleAssign(${job.jobCardId}, this.value)">
                            <option value="">Chọn Workbay...</option>
                            </select>
                    </div>
                </div>
            `).join('');
        }

        async function loadWorkbayStatus() {
            const grid = document.getElementById('workbay-grid');
            const res = await workbayApi.getAllWorkbays();
            const wbs = res.data || res;

            grid.innerHTML = wbs.map(wb => `
                <div class="workbay-card ${wb.status === 'Empty' ? 'empty' : 'active'}">
                    <h3>${wb.workbayName}</h3>
                    <div class="workbay-content">
                        <p>${wb.status === 'Empty' ? 'Sẵn sàng' : wb.currentVehicle}</p>
                    </div>
                    <button class="btn-detail-inner">Chi tiết</button>
                </div>
            `).join('');
        }

        // 2. Logic Tìm kiếm (Search)
        const searchInput = document.getElementById('job-search');
        searchInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.job-item');
            items.forEach(item => {
                const text = item.innerText.toLowerCase();
                item.style.display = text.includes(value) ? 'flex' : 'none';
            });
        });

        // 3. Logic nút Select (Đưa vào Workbay)
        const selectButtons = document.querySelectorAll('.btn-select-wb');
        selectButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Logic ở đây sẽ là mở ra một dropdown hoặc highlight các Workbay đang "Trống"
                alert("Vui lòng chọn một Workbay đang Trống (Sẵn sàng) để bàn giao xe.");
                highlightEmptyWorkbays();
            });
        });

        // 3. Xử lý nút "Chi tiết" trong workbay
        const detailButtons = document.querySelectorAll('.btn-detail-inner');
        detailButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                alert("Đang mở chi tiết tiến độ của Workbay này.");
            });
        });

        function highlightEmptyWorkbays() {
        const emptyWbs = document.querySelectorAll('.workbay-card.empty');
        emptyWbs.forEach(wb => {
            wb.style.ring = "3px solid #10b981"; // Giả lập hiệu ứng highlight
            wb.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 500 });
        });
    }

    // Gán vào window để HTML gọi được
    window.handleAssign = async (jobId, wbId) => {
        if (!wbId) return;
        const res = await workbayApi.assignJobToWorkbay(jobId, wbId);
        if (res.success) {
            alert("Đã gán xe vào Workbay thành công!");
            location.reload();
        }
    };
});