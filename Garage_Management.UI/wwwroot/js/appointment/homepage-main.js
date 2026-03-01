import { BookingAPI } from '../appointment/booking-api.js';
import { homepageUI } from './homepage-ui.js';

let currentPage = 1;
const pageSize = 6; // Hiện 6 dịch vụ mỗi trang cho đẹp grid

document.addEventListener("DOMContentLoaded", () => {
    loadHomepageServices(currentPage);
});

async function loadHomepageServices(page) {
    const serviceGrid = document.querySelector(".service-grid");
    // Tạo hoặc lấy container phân trang
    let paginationContainer = document.getElementById("pagination-container");
    if (!paginationContainer) {
        paginationContainer = document.createElement("div");
        paginationContainer.id = "pagination-container";
        serviceGrid.parentNode.appendChild(paginationContainer);
    }

    serviceGrid.innerHTML = `<div class="loading-spinner">Đang tải dữ liệu...</div>`;

    try {
        const result = await BookingAPI.getServices(page, pageSize);
        
        const services = result.data?.pageData || [];
        const totalItems = result.data?.total || 0;
        const totalPages = Math.ceil(totalItems / pageSize);

        homepageUI.renderServices(serviceGrid, services, formatCurrency);
        homepageUI.renderPagination(paginationContainer, page, totalPages, (newPage) => {
            currentPage = newPage;
            loadHomepageServices(newPage);
            // Cuộn lên đầu phần service khi đổi trang
            document.querySelector('.services-section').scrollIntoView({ behavior: 'smooth' });
        });

    } catch (error) {
        console.error("Homepage Error:", error);
        serviceGrid.innerHTML = `<p class="error-message">Lỗi kết nối tới máy chủ</p>`;
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value || 0);
}

const searchInput = document.getElementById('hero-tracking-input');
const searchBtn = document.getElementById('btn-hero-tracking');

// Hàm điều hướng
const goToSearch = () => {
    const phone = searchInput.value.trim();
    if (!phone) {
        alert("Vui lòng nhập số điện thoại để tra cứu!");
        return;
    }
    // Chuyển hướng sang trang Search kèm tham số phone
    window.location.href = `../../Pages/Appointment/Search.html?phone=${phone}`;
};

// Sự kiện click nút
searchBtn.addEventListener('click', goToSearch);

// Sự kiện nhấn phím Enter
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') goToSearch();
});