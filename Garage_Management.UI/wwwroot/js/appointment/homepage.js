import CONFIG from './config.js';

document.addEventListener("DOMContentLoaded", () => {
    loadServices();
});

async function loadServices(page = 1) {
    const serviceGrid = document.querySelector(".service-grid");

    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/service?page=${page}&pageSize=10`
        );

        if (!response.ok) {
            throw new Error("Server error");
        }

        const result = await response.json();

        const services = result.data.items;

        // Trường hợp không có service
        if (!services || services.length === 0) {
            serviceGrid.innerHTML = `
                <p class="no-service">
                    Không có dịch vụ khả dụng vào lúc này
                </p>
            `;
            return;
        }

        renderServices(services);

    } catch (error) {
        console.error(error);
        serviceGrid.innerHTML = `
            <p class="error-message">
                Lỗi kết nối tới máy chủ
            </p>
        `;
    }
}

function renderServices(services) {
    const serviceGrid = document.querySelector(".service-grid");

    serviceGrid.innerHTML = services.map(service => `
        <div class="service-card">
            <div class="card-inner">
                <div class="card-text">${service.serviceName}</div>
                <div class="card-img">
                    <img src="../../wwwroot/images/service-thumb.jpg" alt="service">
                </div>
            </div>
            <p class="service-name">${service.serviceName}</p>
            <p class="service-price">${formatCurrency(service.price)}</p>
            <p class="service-duration">Thời gian: ${service.estimatedDuration} phút</p>
        </div>
    `).join('');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
}
