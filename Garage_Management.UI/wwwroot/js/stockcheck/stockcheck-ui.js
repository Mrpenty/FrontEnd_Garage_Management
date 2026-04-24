// UI helpers cho chức năng Kiểm kê kho.

const renderRowHtml = (it) => {
    const sys = Number(it.stockSystem) || 0;
    const actual = Number(it.stockActual);
    const dirty = it.dirty === true;

    let badge = '<span class="badge bg-light text-muted">—</span>';
    let hasDiscrepancy = false;
    if (dirty && Number.isFinite(actual)) {
        const delta = actual - sys;
        if (delta === 0) badge = `<span class="badge bg-success">0</span>`;
        else if (delta > 0) { badge = `<span class="badge bg-primary">+${delta}</span>`; hasDiscrepancy = true; }
        else { badge = `<span class="badge bg-danger">${delta}</span>`; hasDiscrepancy = true; }
    }
    const reasonRequired = hasDiscrepancy ? 'required' : '';
    const reasonClass = hasDiscrepancy ? 'border-warning' : '';

    return `
        <tr data-spid="${it.sparePartId}">
            <td><code>${it.partCode || 'N/A'}</code></td>
            <td><span class="fw-bold">${it.partName || ''}</span>
                <small class="text-muted d-block">${it.sparePartBrandName || ''} ${it.unit ? '· ' + it.unit : ''}</small>
            </td>
            <td class="text-center">${sys}</td>
            <td style="width:110px;">
                <input type="number" class="form-control form-control-sm sc-actual"
                    data-spid="${it.sparePartId}"
                    value="${Number.isFinite(actual) ? actual : ''}"
                    min="0" step="1" placeholder="${sys}">
            </td>
            <td class="text-center">${badge}</td>
            <td>
                <input type="text" class="form-control form-control-sm sc-reason ${reasonClass}"
                    data-spid="${it.sparePartId}"
                    value="${(it.reason || '').replace(/"/g, '&quot;')}"
                    ${reasonRequired}
                    placeholder="${hasDiscrepancy ? 'Bắt buộc khi có chênh lệch' : 'Tùy chọn'}">
            </td>
        </tr>`;
};

// Render Bootstrap-style pagination vào container. Trả về <ul> HTML.
// onPageClick: (page) => void. Không render nếu totalPages <= 1.
const renderPagination = (containerId, { page, totalPages, onPageClick, callbackName }) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!totalPages || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    window[callbackName] = onPageClick;

    // Hiển thị tối đa ~7 trang với ellipsis đơn giản
    const pages = [];
    const pushPage = (p) => pages.push(p);
    const windowSize = 2;
    pushPage(1);
    if (page - windowSize > 2) pushPage('...');
    for (let p = Math.max(2, page - windowSize); p <= Math.min(totalPages - 1, page + windowSize); p++) pushPage(p);
    if (page + windowSize < totalPages - 1) pushPage('...');
    if (totalPages > 1) pushPage(totalPages);

    let html = `<ul class="pagination pagination-sm mb-0">`;
    html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="javascript:void(0)" onclick="window.${callbackName}(${Math.max(1, page - 1)})">&laquo;</a></li>`;
    for (const p of pages) {
        if (p === '...') {
            html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
        } else {
            html += `<li class="page-item ${page === p ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="window.${callbackName}(${p})">${p}</a></li>`;
        }
    }
    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="javascript:void(0)" onclick="window.${callbackName}(${Math.min(totalPages, page + 1)})">&raquo;</a></li>`;
    html += `</ul>`;
    container.innerHTML = html;
};

export const stockCheckUI = {
    renderRowHtml,
    renderPagination,

    renderSnapshotRows: (items) => {
        const tbody = document.getElementById('stockCheckRows');
        if (!tbody) return;
        if (!items || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Không có phụ tùng phù hợp</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(renderRowHtml).join('');
    },

    renderSnapshotMeta: ({ page, pageSize, total }) => {
        const box = document.getElementById('scSnapshotMeta');
        if (!box) return;
        if (!total) {
            box.textContent = '';
            return;
        }
        const from = (page - 1) * pageSize + 1;
        const to = Math.min(page * pageSize, total);
        box.textContent = `Hiển thị ${from}-${to} / ${total} phụ tùng`;
    },

    // Cập nhật 1 row tại chỗ (tránh re-render cả bảng làm mất focus khi gõ)
    refreshRow: (item) => {
        const row = document.querySelector(`#stockCheckRows tr[data-spid="${item.sparePartId}"]`);
        if (!row) return;
        const sys = Number(item.stockSystem) || 0;
        const actual = Number(item.stockActual);
        let badge = '<span class="badge bg-light text-muted">—</span>';
        let hasDiscrepancy = false;
        if (item.dirty && Number.isFinite(actual)) {
            const delta = actual - sys;
            if (delta === 0) badge = `<span class="badge bg-success">0</span>`;
            else if (delta > 0) { badge = `<span class="badge bg-primary">+${delta}</span>`; hasDiscrepancy = true; }
            else { badge = `<span class="badge bg-danger">${delta}</span>`; hasDiscrepancy = true; }
        }
        const deltaCell = row.children[4];
        if (deltaCell) deltaCell.innerHTML = badge;
        const reasonInput = row.querySelector('.sc-reason');
        if (reasonInput) {
            if (hasDiscrepancy) {
                reasonInput.setAttribute('required', 'required');
                reasonInput.classList.add('border-warning');
                reasonInput.placeholder = 'Bắt buộc khi có chênh lệch';
            } else {
                reasonInput.removeAttribute('required');
                reasonInput.classList.remove('border-warning');
                reasonInput.placeholder = 'Tùy chọn';
            }
        }
    },

    renderResultModal: (result) => {
        const box = document.getElementById('stockCheckResultBody');
        if (!box) return;
        if (!result) {
            box.innerHTML = `<div class="alert alert-warning">Không có dữ liệu</div>`;
            return;
        }

        const adjustments = result.adjustments || [];
        const rowsHtml = adjustments.length === 0
            ? `<tr><td colspan="6" class="text-center text-muted py-3">Không có chênh lệch nào được điều chỉnh</td></tr>`
            : adjustments.map(a => {
                const delta = Number(a.delta) || 0;
                const cls = delta > 0 ? 'text-primary' : (delta < 0 ? 'text-danger' : 'text-muted');
                return `
                    <tr>
                        <td><code>${a.partCode || 'N/A'}</code></td>
                        <td>${a.partName || ''}</td>
                        <td class="text-center">${a.stockSystem}</td>
                        <td class="text-center">${a.stockActual}</td>
                        <td class="text-center fw-bold ${cls}">${delta > 0 ? '+' + delta : delta}</td>
                        <td class="small">${a.reason || ''}</td>
                    </tr>`;
            }).join('');

        const checkDate = result.checkDate ? new Date(result.checkDate).toLocaleString('vi-VN') : '';

        box.innerHTML = `
            <div class="alert alert-success d-flex align-items-center gap-3 mb-3">
                <i class="bi bi-check-circle-fill fs-3"></i>
                <div>
                    <div class="fw-bold">Mã phiếu: <code>${result.receiptCode}</code></div>
                    <small class="text-muted">Ngày: ${checkDate} · Chi nhánh #${result.branchId ?? '-'}</small>
                </div>
            </div>
            <div class="row g-2 mb-3">
                <div class="col"><div class="border rounded p-2 text-center">
                    <div class="text-muted small">Tổng item</div>
                    <div class="fs-5 fw-bold">${result.totalItems ?? '-'}</div>
                </div></div>
                <div class="col"><div class="border rounded p-2 text-center">
                    <div class="text-muted small">Đã điều chỉnh</div>
                    <div class="fs-5 fw-bold">${result.discrepanciesAdjusted ?? 0}</div>
                </div></div>
                <div class="col"><div class="border rounded p-2 text-center text-danger">
                    <div class="small">Thiếu</div>
                    <div class="fs-5 fw-bold">${result.shortageCount ?? 0}</div>
                </div></div>
                <div class="col"><div class="border rounded p-2 text-center text-primary">
                    <div class="small">Thừa</div>
                    <div class="fs-5 fw-bold">${result.surplusCount ?? 0}</div>
                </div></div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Mã PT</th>
                            <th>Tên</th>
                            <th class="text-center">Hệ thống</th>
                            <th class="text-center">Thực tế</th>
                            <th class="text-center">Chênh lệch</th>
                            <th>Lý do</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
    },

    renderLookupResult: (session) => {
        const box = document.getElementById('stockCheckLookupResult');
        if (!box) return;
        if (!session) {
            box.innerHTML = `<div class="alert alert-warning">Không tìm thấy phiên kiểm kê.</div>`;
            return;
        }

        const adjustments = session.adjustments || [];
        const rowsHtml = adjustments.length === 0
            ? `<tr><td colspan="6" class="text-center text-muted py-3">Phiếu không có điều chỉnh</td></tr>`
            : adjustments.map(a => {
                const delta = Number(a.delta) || 0;
                const cls = delta > 0 ? 'text-primary' : (delta < 0 ? 'text-danger' : 'text-muted');
                return `
                    <tr>
                        <td><code>${a.partCode || 'N/A'}</code></td>
                        <td>${a.partName || ''}</td>
                        <td class="text-center">${a.stockSystem}</td>
                        <td class="text-center">${a.stockActual}</td>
                        <td class="text-center fw-bold ${cls}">${delta > 0 ? '+' + delta : delta}</td>
                        <td class="small">${a.reason || ''}</td>
                    </tr>`;
            }).join('');

        const checkDate = session.checkDate ? new Date(session.checkDate).toLocaleString('vi-VN') : '';

        box.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-header bg-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">Mã phiếu: <code>${session.receiptCode}</code></div>
                            <small class="text-muted">Ngày: ${checkDate} · Chi nhánh #${session.branchId ?? '-'}</small>
                        </div>
                        <div class="d-flex gap-2">
                            <span class="badge bg-secondary">Điều chỉnh: ${session.discrepanciesAdjusted ?? 0}</span>
                            <span class="badge bg-danger">Thiếu: ${session.shortageCount ?? 0}</span>
                            <span class="badge bg-primary">Thừa: ${session.surplusCount ?? 0}</span>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Mã PT</th>
                                    <th>Tên</th>
                                    <th class="text-center">Hệ thống</th>
                                    <th class="text-center">Thực tế</th>
                                    <th class="text-center">Chênh lệch</th>
                                    <th>Lý do</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    },

    renderSessionsTable: (sessions) => {
        const tbody = document.getElementById('sessionsTableBody');
        if (!tbody) return;
        if (!sessions || sessions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Chưa có phiên kiểm kê nào</td></tr>`;
            return;
        }
        tbody.innerHTML = sessions.map(s => {
            const d = s.checkDate ? new Date(s.checkDate).toLocaleString('vi-VN') : '';
            return `
                <tr>
                    <td><code>${s.receiptCode}</code></td>
                    <td>${d}</td>
                    <td class="text-center">${s.discrepanciesAdjusted ?? 0}</td>
                    <td class="text-center text-danger">${s.shortageCount ?? 0}</td>
                    <td class="text-center text-primary">${s.surplusCount ?? 0}</td>
                    <td class="text-center">#${s.branchId ?? '-'}</td>
                    <td class="text-center">
                        <button class="btn btn-outline-primary btn-sm"
                            onclick="window.stockCheckMain.viewSession('${s.receiptCode}')">
                            <i class="bi bi-eye"></i> Xem
                        </button>
                    </td>
                </tr>`;
        }).join('');
    }
};
