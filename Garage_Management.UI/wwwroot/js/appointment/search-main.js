import { BookingAPI } from './booking-api.js';
import { searchUI } from './search-ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Lấy tham số phone từ URL (do index.html chuyển sang)
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone');
    
    if (phone) {
        await executeSearch(phone); 
    }
});

async function executeSearch(phone) {
    const resultContainer = document.getElementById('appointment-results-list');
    
    try {
        resultContainer.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-danger"></i><p class="mt-2">Đang tìm kiếm lịch hẹn...</p></div>';
        
        const response = await BookingAPI.searchAppointments(phone);
        // Lưu ý: response.data.pageData theo cấu trúc dữ liệu mẫu bạn gửi
        const appointments = response.data?.pageData || [];

        searchUI.showStatus(phone);
        searchUI.renderAppointmentList(appointments, resultContainer);

    } catch (error) {
        console.error("Search Error:", error);
        resultContainer.innerHTML = `<div class="alert alert-danger">Không thể kết nối máy chủ. Vui lòng thử lại sau.</div>`;
    }
}