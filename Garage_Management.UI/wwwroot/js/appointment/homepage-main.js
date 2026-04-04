import { BookingAPI } from '../appointment/booking-api.js';
import { homepageUI } from './homepage-ui.js';

let allServices = [];
let currentPage = 1;
const pageSize = 4;

document.addEventListener("DOMContentLoaded", () => {
    loadHomepageServices(currentPage);
});

async function loadHomepageServices(page) {
    const serviceGrid = document.querySelector(".service-grid");
    serviceGrid.innerHTML = `<div class="loading-spinner">Đang tải dữ liệu...</div>`;

    try {
        const result = await BookingAPI.getServices();
        allServices = result.data?.pageData || result.data || [];
        renderCurrentPage();

    } catch (error) {
        console.error("Homepage Error:", error);
        serviceGrid.innerHTML = `<p class="error-message">Lỗi kết nối tới máy chủ</p>`;
    }
}

// Hàm render dựa trên dữ liệu đã có trong allServices
function renderCurrentPage() {
    const serviceGrid = document.querySelector(".service-grid");
    
    // Tính toán cắt mảng cho trang hiện tại (Client-side Pagination)
    const startIndex = (currentPage - 1) * pageSize;
    const pagedServices = allServices.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(allServices.length / pageSize);

    homepageUI.renderServices(serviceGrid, pagedServices, formatCurrency, {
        currentPage: currentPage,
        totalPages: totalPages,
        onPageChange: (newPage) => {
            currentPage = newPage;
            renderCurrentPage(); // Chỉ cần render lại, không gọi API nữa
            
            const section = document.querySelector('.services-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }
    });
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