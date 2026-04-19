export const reportUI = {
    renderLayout: (container) => {
        container.innerHTML = `
        <div class="rp">
          <div class="rp-header">
            <div class="rp-title">
              <span class="dot"></span>
              <h4>Tổng quan hoạt động gara</h4>
            </div>
            <span class="badge-time" id="report-time">Đang tải...</span>
          </div>

          <div class="stats-grid">
            ${reportUI._statCard('stat-active-jc',  'Xe tại xưởng',      '🔧', 'blue',  'đang xử lý')}
            ${reportUI._statCard('stat-today-apt',  'Lịch hẹn hôm nay',  '📅', 'green', 'cuộc hẹn mới')}
            ${reportUI._statCard('stat-pending-inv','Chờ thanh toán',     '💳', 'amber', 'xe cần thu tiền')}
          </div>

          <div class="bottom-grid">
            <div class="card">
              <div class="card-head">
                <h6>Trạng thái xe</h6>
                <span id="total-cars-label" class="card-sub">0 xe</span>
              </div>
              <div class="card-body">
                <div class="chart-wrap">
                  <canvas id="statusChart"></canvas>
                  <div class="chart-center">
                    <div class="chart-total" id="chart-total">0</div>
                    <div class="chart-label">tổng số</div>
                  </div>
                </div>
                <div id="status-list"></div>
              </div>
            </div>

            <div class="card">
              <div class="card-head">
                <h6>Dịch vụ phổ biến</h6>
                <span class="card-sub">Top 5</span>
              </div>
              <div class="card-body" id="top-services"></div>
            </div>
          </div>
        </div>`;
    },

    _statCard: (id, label, icon, color, sub) => `
        <div class="stat-card">
          <div class="stat-icon ic-${color}">${icon}</div>
          <div class="stat-label">${label}</div>
          <div class="stat-value" id="${id}">—</div>
          <div class="stat-sub">${sub}</div>
          <div class="stat-accent ac-${color}"></div>
        </div>`,

    updateBasicStats: (stats) => {
        document.getElementById('report-time').textContent =
            'Cập nhật: ' + new Date().toLocaleTimeString('vi-VN');
        document.getElementById('stat-active-jc').textContent  = stats.activeJC;
        document.getElementById('stat-today-apt').textContent  = stats.todayApt;
        document.getElementById('stat-pending-inv').textContent = stats.pendingInv;
    },

    renderStatusList: (statusData) => {
        const STATUS_NAMES = {1:'Vừa tạo',3:'Chờ kiểm tra',7:'Đang sửa chữa',8:'Chờ thanh toán'};
        const STATUS_COLORS = {1:'#2563eb',3:'#16a34a',7:'#d97706',8:'#dc2626'};
        const STATUS_BG     = {1:'#eff6ff',3:'#f0fdf4',7:'#fffbeb',8:'#fef2f2'};
        const STATUS_TXT    = {1:'#1d4ed8',3:'#15803d',7:'#b45309',8:'#b91c1c'};

        const total = statusData.reduce((s, d) => s + d.count, 0);
        document.getElementById('chart-total').textContent = total;
        document.getElementById('total-cars-label').textContent = total + ' xe';

        document.getElementById('status-list').innerHTML = statusData.map(({status, count}) => `
            <div class="status-item">
              <div style="display:flex;align-items:center">
                <span class="status-dot" style="background:${STATUS_COLORS[status]||'#888'}"></span>
                <span class="status-name">${STATUS_NAMES[status]||'Khác'}</span>
              </div>
              <span class="status-count"
                    style="background:${STATUS_BG[status]||'#f4f4f4'};color:${STATUS_TXT[status]||'#333'}">
                ${count} xe
              </span>
            </div>`).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';
    },

    renderTopServices: (services, totalJC) => {
        const max = services[0]?.[1] || 1;
        document.getElementById('top-services').innerHTML =
            services.map(([name, count], i) => `
            <div class="svc-item">
              <div class="svc-row">
                <span class="svc-name">${i + 1}. ${name}</span>
                <span class="svc-count">${count} lần</span>
              </div>
              <div class="svc-bar">
                <div class="svc-fill" style="width:${(count / max) * 100}%"></div>
              </div>
            </div>`).join('') || '<div class="empty-state">Chưa có dữ liệu</div>';
    }
};