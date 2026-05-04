import { ReceptionistReportAPI } from './report-api.js';
import { reportUI } from './report-ui.js';

export async function initReportModule() {
    const mainDisplay = document.getElementById('main-display');

    // 1. Render layout (filter + cards + chart placeholders)
    reportUI.renderLayout(mainDisplay);

    // 2. Bind filter events
    const fromInput = document.getElementById('rp-from');
    const toInput = document.getElementById('rp-to');
    const applyBtn = document.getElementById('rp-apply');

    const loadReport = async () => {
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
        try {
            const res = await ReceptionistReportAPI.getReport(fromInput.value, toInput.value);
            if (!res.success || !res.data) {
                reportUI.showError(res.message || 'Không tải được báo cáo');
                return;
            }
            const data = res.data;

            reportUI.setBranchInfo(data.branchName, data.fromDate, data.toDate);
            reportUI.updateStats(data);
            reportUI.renderStatusList(data.appointmentsByStatus);
            reportUI.renderStatusChart(data.appointmentsByStatus);
            reportUI.renderSourceChart(data.walkInCount, data.appointmentBasedCount);
        } catch (err) {
            console.error('[Report] error:', err);
            reportUI.showError('Lỗi kết nối: ' + err.message);
        } finally {
            applyBtn.disabled = false;
            applyBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Xem báo cáo';
        }
    };

    applyBtn.addEventListener('click', loadReport);

    // 3. Auto-load lần đầu (mặc định 30 ngày)
    await loadReport();
}
