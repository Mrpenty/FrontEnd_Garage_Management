export const homepageUI = {
    renderServices: (container, services, formatCurrencyFn, paginationInfo = {}) => {
        const { currentPage = 1, totalPages = 1, onPageChange } = paginationInfo;
        if (!services || services.length === 0) {
            container.innerHTML = `<p class="no-service">Không có dịch vụ...</p>`;
            return;
        }

        let servicesHtml = services.map(service => `
            <div class="service-card" data-id="${service.serviceId}">
                <div class="service-icon-wrapper">
                    <i class="fas fa-tools"></i>
                </div>
                <div class="service-body">
                    <h4 class="service-title">${service.serviceName}</h4>
                    <p class="service-desc">${service.description || 'Chăm sóc xe chuyên nghiệp'}</p>
                    <div class="service-footer">
                        <span class="price">${formatCurrencyFn(service.basePrice)}</span>
                        <span class="duration"><i class="far fa-clock"></i> ${service.totalEstimateMinute}ph</span>
                    </div>
                </div>
                <div class="service-overlay">
                    <span>Xem quy trình <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="services-grid-content">
                ${servicesHtml}
            </div>
            <div id="pagination-container" class="services-pagination-container"></div>
        `;

        // Gán sự kiện click cho từng card
        container.querySelectorAll('.service-card').forEach(card => {
            card.onclick = () => {
                const serviceId = card.dataset.id;
                const service = services.find(s => s.serviceId == serviceId);
                homepageUI.showServiceDetail(service);
            };
        });

        const paginationContainer = container.querySelector('.services-pagination-container');
        if (onPageChange) {
            homepageUI.renderPagination(paginationContainer, currentPage, totalPages, onPageChange);
        }
    },

    showServiceDetail: (service) => {
        const modal = document.getElementById('service-detail-modal');
        const content = document.getElementById('service-detail-content');
        
        // Sắp xếp tasks theo taskOrder
        const sortedTasks = (service.serviceTasks || []).sort((a, b) => a.taskOrder - b.taskOrder);

        content.innerHTML = `
            <div class="modal-header-custom">
                <h2>${service.serviceName}</h2>
                <p>${service.description}</p>
            </div>
            <div class="task-timeline">
                ${sortedTasks.map((task, index) => `
                    <div class="task-item">
                        <div class="task-number">${task.taskOrder}</div>
                        <div class="task-info">
                            <h5>${task.taskName} <span class="task-time">${task.estimateMinute} phút</span></h5>
                            <p>${task.note || ''}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="modal-footer-custom">
                <div class="total-summary">
                    Tổng thời gian ước tính: <strong>${service.totalEstimateMinute} phút</strong>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        // Đóng modal
        modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        window.onclick = (event) => { if (event.target == modal) modal.style.display = 'none'; };
    },

    renderPagination: (container, page, totalPages, onPageChange) => {
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `<div class="pagination-wrapper">`;
        
        // Nút lùi
        html += `<button class="btn-page" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">
                    <i class="fas fa-chevron-left"></i>
                 </button>`;

        // Thuật toán hiển thị số trang (có thể tối ưu thêm nếu nhiều trang)
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="btn-page ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        // Nút tới
        html += `<button class="btn-page" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">
                    <i class="fas fa-chevron-right"></i>
                 </button>`;

        html += `</div>`;
        container.innerHTML = html;

        container.querySelectorAll('.btn-page:not([disabled])').forEach(btn => {
            btn.onclick = () => {
                const targetPage = parseInt(btn.dataset.page);
                onPageChange(targetPage);
            };
        });
    }
};