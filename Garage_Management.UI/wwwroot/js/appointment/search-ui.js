export const searchUI = {
    renderAppointmentList: (appointments, container) => {
        if (!appointments || appointments.length === 0) {
            container.innerHTML = `<div class="text-center py-5 text-muted">Không tìm thấy lịch hẹn nào.</div>`;
            return;
        }

        container.innerHTML = `
            <div class="search-results-wrapper">
                ${appointments.map(app => {
                    // Tính tổng thời gian
                    let totalMinutes = 0;
                    app.services.forEach(svc => {
                        if (svc.serviceTasks) {
                            totalMinutes += svc.serviceTasks.reduce((sum, task) => sum + (task.estimateMinute || 0), 0);
                        }
                    });

                    return `
                    <div class="appointment-row">
                        <div class="col-info time-box">
                            <div class="date">${new Date(app.appointmentDateTime).toLocaleDateString('vi-VN')}</div>
                            <div class="time">${new Date(app.appointmentDateTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                            <span class="badge-status">${searchUI.getStatusText(app.status)}</span>
                        </div>

                        <div class="col-info service-box">
                            <div class="label">DỊCH VỤ</div>
                            <div class="value">
                                ${app.services.map(s => s.serviceName).join(', ')}
                            </div>
                            <div class="duration"><i class="fa-regular fa-clock"></i> Dự kiến: ${totalMinutes} phút</div>
                        </div>

                        <div class="col-info vehicle-box">
                            <div class="label">PHƯƠNG TIỆN</div>
                            <div class="value text-muted">Hãng: Cập nhật sau</div>
                            <div class="value text-muted">Biển số: Cập nhật sau</div>
                        </div>

                        <div class="col-info garage-box">
                            <div class="label">ĐỊA ĐIỂM</div>
                            <div class="value">MGMS - Chi nhánh Cầu Giấy</div>
                            <div class="address">123 Ngõ 100, Cầu Giấy, HN</div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    showStatus: (phone) => {
        const header = document.getElementById('search-header-container');
        const msg = document.getElementById('search-status-msg');
        if (header && msg) {
            msg.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Kết quả tra cứu cho: <strong>${phone}</strong>`;
            header.style.display = 'block';
        }
    },

    getStatusText: (status) => {
        const statusMap = { 1: "Đã xác nhận", 0: "Chờ xác nhận", 2: "Đang sửa", 3: "Hoàn thành" };
        return statusMap[status] || "Đang xử lý";
    }
};