import { workbayApi } from './workbay-api.js';

    document.addEventListener('DOMContentLoaded', async () => {
        // 1. Hiển thị tên tài khoản đang đăng nhập
        const userInfoStr = localStorage.getItem('userInfo');
        const employeeId = localStorage.getItem('employeeId');

        if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            document.getElementById('display-name').innerText = `${userInfo.fullName} (${userInfo.email})`;
            await refreshData(employeeId);
        }

        async function refreshData(supervisorId) {
            // Lấy dữ liệu từ cả hai API cùng lúc
            const [jobsRes, wbsRes] = await Promise.all([
                workbayApi.getJobsBySupervisor(supervisorId),
                workbayApi.getAllWorkbays()
            ]);

        const jobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes.data || []);
        const workbays = Array.isArray(wbsRes) ? wbsRes : (wbsRes.data || []);

            renderPendingJobs(jobs, workbays);
            renderWorkbayGrid(workbays);
        }

        // Hàm render danh sách JobCard
    function renderPendingJobs(jobs, allWorkbays) {
        const listContainer = document.getElementById('pending-jobs-list');
        const now = new Date();
        const statusMap = { 1: "Chờ kiểm tra", 2: "Đang sửa chữa", 3: "Hoàn thành" };

        // Lọc danh sách Workbay sẵn sàng (Status = 1) để đưa vào dropdown
        const availableWbs = allWorkbays.filter(wb => wb.status === 1);
        const wbOptions = availableWbs.map(wb => `<option value="${wb.id}">${wb.name}</option>`).join('');

        listContainer.innerHTML = jobs.map(job => {
            // Lấy thông tin từ object lồng nhau theo dữ liệu
            const customerName = job.customer ? `${job.customer.lastName} ${job.customer.firstName}` : 'Ẩn danh';
            const plate = job.vehicle ? job.vehicle.licensePlate : 'N/A';
            const serviceNames = job.services && job.services.length > 0 
            ? job.services.map(s => s.serviceName || `Dịch vụ #${s.serviceId}`).join(', ')
            : 'Chưa xác định dịch vụ';

            let priorityClass = '';
            let appointmentInfo = '';

            if (job.appointmentId && job.startDate) { // Giả sử startDate ở đây là giờ hẹn
                const appointmentDate = new Date(job.startDate);
                const diffInMinutes = (appointmentDate - now) / (1000 * 60);

                if (diffInMinutes <= 0) {
                    // Đã đến giờ hoặc quá giờ hẹn -> Đỏ rực, ưu tiên cao nhất
                    priorityClass = 'priority-urgent';
                    appointmentInfo = `<span class="badge-appt"><i class="fas fa-exclamation-circle"></i> ĐẾN GIỜ HẸN (${appointmentDate.toLocaleTimeString([], {hour: '2d', minute:'2d'})})</span>`;
                } else if (diffInMinutes <= 60) {
                    // Sắp đến giờ (trong vòng 60p) -> Vàng nổi bật
                    priorityClass = 'priority-upcoming';
                    appointmentInfo = `<span class="badge-appt"><i class="fas fa-clock"></i> SẮP ĐẾN HẸN (${appointmentDate.toLocaleTimeString([], {hour: '2d', minute:'2d'})})</span>`;
                } else {
                    // Hẹn còn xa -> Xanh nhẹ
                    priorityClass = 'priority-future';
                    appointmentInfo = `<span class="badge-appt"><i class="far fa-calendar-check"></i> Hẹn lúc ${appointmentDate.toLocaleTimeString([], {hour: '2d', minute:'2d'})}</span>`;
                }
            }
            return `
                <div class="job-item ${priorityClass}">
                    <div class="job-info">
                        <div class="job-row-top">
                            <span class="job-id"><strong>#JC-${job.jobCardId}</strong></span>
                            ${appointmentInfo}
                        </div>
                        <div class="job-row-main">
                            <span class="car-plate"><i class="fas fa-car"></i> ${plate}</span>
                            <span class="customer-name"><i class="fas fa-user"></i> ${customerName}</span>
                        </div>
                        <div class="job-row-services">
                            <span class="service-detail">
                                <i class="fas fa-toolbox"></i> <strong>Sửa chữa:</strong> ${serviceNames}
                            </span>
                        </div>
                    </div>
                    <div class="assign-action">
                        <select class="select-wb-dropdown" onchange="window.handleAssign(${job.jobCardId}, this.value)">
                            <option value="">Chọn Workbay trống...</option>
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
        
        // Status: 1: Available, 2: Occupied, 3: Maintenance, 4: OutOfService
        const statusClassMap = { 1: 'empty', 2: 'active', 3: 'maintenance', 4: 'oos' };
        const statusTextMap = { 1: 'Sẵn sàng', 2: 'Đang sửa chữa', 3: 'Bảo trì', 4: 'Tạm dừng' };

        grid.innerHTML = workbays.map(wb => {
            const statusClass = statusClassMap[wb.status] || 'oos';
            const isOccupied = wb.status === 2;

            return `
                <div class="workbay-card ${statusClass}">
                    ${isOccupied ? `<div class="workbay-timer"><i class="far fa-clock"></i> --p</div>` : ''}
                    <h3>${wb.name}</h3>
                    <div class="workbay-content">
                        <p class="wb-status-text">${statusTextMap[wb.status]}</p>
                        ${isOccupied ? `
                            <p class="wb-plate">${wb.licensePlate || 'Đang cập nhật'}</p>
                            <p class="wb-service">${wb.note || 'Dịch vụ tổng hợp'}</p>
                        ` : '<p class="status-text">Available</p>'}
                    </div>
                    <button class="btn-detail-inner" onclick="alert('Chi tiết Workbay: ${wb.name}')">Chi tiết</button>
                </div>
            `;
        }).join('');
    }

    // Logic Tìm kiếm
    document.getElementById('job-search').addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        document.querySelectorAll('.job-item').forEach(item => {
            item.style.display = item.innerText.toLowerCase().includes(value) ? 'flex' : 'none';
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
                await refreshData(employeeId); // Tải lại dữ liệu mà không cần reload trang
            }
        } catch (error) {
            alert("Lỗi khi gán Workbay: " + error.message);
        }
    };

    window.viewWbDetail = (wbId) => {
        alert("Tính năng chi tiết Workbay #" + wbId + " đang được phát triển.");
    };
});
