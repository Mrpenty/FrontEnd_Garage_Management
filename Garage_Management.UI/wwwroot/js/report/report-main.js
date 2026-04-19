import { vehicleApi, serviceApi, jobcardApi, customerApi, appointmentApi, EstimateAPI, PaymentAPI} from '../jobcard/jobcard-api.js';
import { reportUI} from './report-ui.js';

let myChart = null;
// report-main.js
export async function initReportModule() {
    const mainDisplay = document.getElementById('main-display');
    
    // 1. Vẽ khung giao diện trước
    reportUI.renderLayout(mainDisplay);

    try {
        // 2. Lấy dữ liệu từ các API
        const [resJC, resInv, resApt] = await Promise.all([
            jobcardApi.getAll(),
            PaymentAPI.getInvoices(),
            appointmentApi.getAll()
        ]);

        const jobCards = resJC.pageData || [];
        const invoices = resInv.data?.pageData || [];
        const appointments = resApt.data?.pageData || [];
        const todayStr = new Date().toISOString().split('T')[0];

        // 3. Xử lý logic tính toán các con số
        const stats = {
            activeJC: jobCards.filter(jc => jc.status !== 9 && jc.status !== 10).length,
            todayApt: appointments.filter(apt => 
                apt.appointmentDateTime && apt.appointmentDateTime.startsWith(todayStr)
            ).length,
            pendingInv: jobCards.filter(jc => jc.status === 8).length,
        };

        // 4. Đẩy dữ liệu ra UI
        reportUI.updateBasicStats(stats);

        // Xử lý mảng trạng thái xe
        const statusCounts = { 1: 0, 7: 0, 8: 0, 3: 0 }; 
            jobCards.forEach(jc => {
                if (statusCounts.hasOwnProperty(jc.status)) {
                    statusCounts[jc.status]++;
                }
            });
        const ctx = document.getElementById('statusChart').getContext('2d');
        const labelMap = { 1: "Vừa tạo", 3: "Chờ kiểm tra", 7: "Đang sửa", 8: "Chờ thanh toán" };
        const chartLabels = Object.keys(statusCounts).map(key => labelMap[key] || "Khác");

        if (myChart) myChart.destroy();
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels, // Dùng mảng chữ thay vì mảng số
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#4e73df', '#36b9cc', '#f6c23e', '#e74a3b'], // Màu sắc hiện đại hơn
                    hoverOffset: 15,
                    borderWidth: 5,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false } // Ẩn legend mặc định vì mình đã có status-list ở dưới
                },
                cutout: '75%'
            }
        });
        const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
        reportUI.renderStatusList(statusData);

        // Xử lý top dịch vụ
        const serviceMap = {};
        jobCards.forEach(jc => jc.services.forEach(s => serviceMap[s.serviceName] = (serviceMap[s.serviceName] || 0) + 1));
        const sortedServices = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        reportUI.renderTopServices(sortedServices, jobCards.length || 1);

    } catch (error) {
        console.error("Lỗi báo cáo:", error);
        mainDisplay.innerHTML = `<div class="alert alert-danger">Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.</div>`;
    }
}