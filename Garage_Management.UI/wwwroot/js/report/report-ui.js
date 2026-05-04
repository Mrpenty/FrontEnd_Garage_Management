// UI cho màn Báo cáo của Lễ tân — dùng Chart.js (đã có sẵn trong project)

const STATUS_META = {
    pending:           { label: 'Chờ xác nhận',   color: '#f59e0b', bg: '#fef3c7' },
    confirmed:         { label: 'Đã xác nhận',    color: '#10b981', bg: '#d1fae5' },
    convertedToJobCard:{ label: 'Đã thành phiếu', color: '#3b82f6', bg: '#dbeafe' },
    completed:         { label: 'Hoàn tất',       color: '#0d9488', bg: '#ccfbf1' },
    cancelled:         { label: 'Đã hủy',         color: '#ef4444', bg: '#fee2e2' },
    noShow:            { label: 'Vắng mặt',       color: '#94a3b8', bg: '#f1f5f9' }
};

export const reportUI = {
    renderLayout: (container) => {
        const today = new Date();
        const aMonthAgo = new Date();
        aMonthAgo.setDate(today.getDate() - 30);
        const fmt = (d) => d.toISOString().slice(0, 10);

        container.innerHTML = `
        <div style="padding: 4px 8px;">
            <!-- Header + Filter -->
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom: 18px;">
                <div>
                    <h2 style="margin:0; font-size:1.4rem; color:#1e293b;">
                        <i class="fa-solid fa-chart-line" style="color:#4f46e5;"></i>
                        Báo cáo Lễ tân
                    </h2>
                    <small id="rp-branch-name" style="color:#64748b;">Đang tải...</small>
                </div>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <input type="date" id="rp-from" value="${fmt(aMonthAgo)}"
                        style="padding:8px 10px; border:1px solid #cbd5e1; border-radius:6px;">
                    <span style="color:#64748b;">→</span>
                    <input type="date" id="rp-to" value="${fmt(today)}"
                        style="padding:8px 10px; border:1px solid #cbd5e1; border-radius:6px;">
                    <button id="rp-apply" class="btn-primary" style="padding:8px 16px;">
                        <i class="fa-solid fa-magnifying-glass"></i> Xem báo cáo
                    </button>
                </div>
            </div>

            <!-- Stat cards -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; margin-bottom: 20px;">
                ${reportUI._statCard('rp-total-appt',     'Tổng lịch hẹn',     '📅', '#4f46e5', '#eef2ff')}
                ${reportUI._statCard('rp-conversion',     'Tỷ lệ chốt phiếu', '✅', '#10b981', '#d1fae5')}
                ${reportUI._statCard('rp-noshow',         'Tỷ lệ vắng mặt',   '🚫', '#f59e0b', '#fef3c7')}
                ${reportUI._statCard('rp-cancel',         'Tỷ lệ hủy',        '❌', '#ef4444', '#fee2e2')}
                ${reportUI._statCard('rp-walkin',         'Khách không đặt lịch',   '🚶', '#06b6d4', '#cffafe')}
            </div>

            <!-- Charts: Status doughnut + Walk-in vs Appt bar -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="card" style="background:#fff; padding:18px; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;">
                        <h6 style="margin:0; color:#1e293b;">Lịch hẹn theo trạng thái</h6>
                        <small id="rp-status-total" style="color:#64748b;"></small>
                    </div>
                    <div style="position:relative; height:280px;">
                        <canvas id="rp-status-chart"></canvas>
                    </div>
                </div>
                <div class="card" style="background:#fff; padding:18px; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;">
                        <h6 style="margin:0; color:#1e293b;">Walk-in vs Theo lịch</h6>
                        <small style="color:#64748b;">Phiếu sửa chữa</small>
                    </div>
                    <div style="position:relative; height:280px;">
                        <canvas id="rp-source-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Status breakdown list -->
            <div class="card" style="background:#fff; padding:18px; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.06);">
                <h6 style="margin:0 0 12px; color:#1e293b;">Chi tiết các trạng thái</h6>
                <div id="rp-status-list" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;"></div>
            </div>

            <div id="rp-msg" style="display:none; text-align:center; padding:30px; color:#94a3b8;"></div>
        </div>`;
    },

    _statCard: (id, label, icon, color, bg) => `
        <div style="background:#fff; padding:16px; border-radius:10px; box-shadow:0 2px 4px rgba(0,0,0,0.06); border-left:4px solid ${color};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="color:#64748b; font-size:0.8rem; font-weight:500; text-transform:uppercase;">${label}</div>
                    <div id="${id}" style="font-size:1.8rem; font-weight:700; color:${color}; margin-top:4px;">—</div>
                </div>
                <div style="font-size:1.5rem; background:${bg}; padding:8px; border-radius:8px;">${icon}</div>
            </div>
        </div>`,

    setBranchInfo: (branchName, fromDate, toDate) => {
        const el = document.getElementById('rp-branch-name');
        if (!el) return;
        const range = (fromDate && toDate)
            ? `${new Date(fromDate).toLocaleDateString('vi-VN')} → ${new Date(toDate).toLocaleDateString('vi-VN')}`
            : 'Toàn thời gian';
        el.textContent = `${branchName || 'Chi nhánh'} · ${range}`;
    },

    updateStats: (data) => {
        const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
        const pct = (n) => `${(Number(n || 0) * 100).toFixed(1)}%`;

        document.getElementById('rp-total-appt').textContent = fmt(data.totalAppointments);
        document.getElementById('rp-conversion').textContent = pct(data.conversionRate);
        document.getElementById('rp-noshow').textContent = pct(data.noShowRate);
        document.getElementById('rp-cancel').textContent = pct(data.cancelRate);
        document.getElementById('rp-walkin').textContent = fmt(data.walkInCount);
    },

    renderStatusList: (breakdown) => {
        const html = Object.entries(STATUS_META).map(([key, meta]) => {
            const count = breakdown?.[key] ?? 0;
            return `
                <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:${meta.bg}; border-radius:8px;">
                    <span style="width:10px; height:10px; border-radius:50%; background:${meta.color};"></span>
                    <div style="flex:1;">
                        <div style="font-size:0.85rem; color:#475569;">${meta.label}</div>
                        <div style="font-size:1.2rem; font-weight:700; color:${meta.color};">${count}</div>
                    </div>
                </div>`;
        }).join('');
        document.getElementById('rp-status-list').innerHTML = html;
    },

    renderStatusChart: (breakdown) => {
        const labels = [];
        const values = [];
        const colors = [];
        Object.entries(STATUS_META).forEach(([key, meta]) => {
            const v = breakdown?.[key] ?? 0;
            if (v > 0) {
                labels.push(meta.label);
                values.push(v);
                colors.push(meta.color);
            }
        });

        const total = values.reduce((s, v) => s + v, 0);
        document.getElementById('rp-status-total').textContent = `Tổng: ${total}`;

        const ctx = document.getElementById('rp-status-chart').getContext('2d');
        if (window.__rpStatusChart) window.__rpStatusChart.destroy();

        if (total === 0) {
            ctx.canvas.parentElement.innerHTML = '<div style="text-align:center; padding:80px 0; color:#94a3b8;"><em>Không có lịch hẹn trong khoảng thời gian này</em></div>';
            return;
        }

        window.__rpStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    renderSourceChart: (walkIn, apptBased) => {
        const ctx = document.getElementById('rp-source-chart').getContext('2d');
        if (window.__rpSourceChart) window.__rpSourceChart.destroy();

        if (walkIn === 0 && apptBased === 0) {
            ctx.canvas.parentElement.innerHTML = '<div style="text-align:center; padding:80px 0; color:#94a3b8;"><em>Không có phiếu sửa chữa trong khoảng thời gian</em></div>';
            return;
        }

        window.__rpSourceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Khách vãng lai', 'Đặt lịch hẹn'],
                datasets: [{
                    label: 'Số phiếu',
                    data: [walkIn, apptBased],
                    backgroundColor: ['#06b6d4', '#4f46e5'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    },

    showError: (msg) => {
        const el = document.getElementById('rp-msg');
        if (!el) return;
        el.style.display = 'block';
        el.style.color = '#ef4444';
        el.textContent = msg;
    }
};
