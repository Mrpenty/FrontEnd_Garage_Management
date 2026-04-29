// Shared pagination helper. Hoạt động cả khi page có/không có Bootstrap CSS
// vì các style cốt lõi đều inline.
//
// Usage:
//   import { renderPagination } from '../common/pagination.js';
//   renderPagination('myPagerId', {
//     page: 3, totalPages: 12,
//     onPageClick: (p) => loadData(p),
//     callbackName: 'goCustomerPage'  // unique để tránh xung đột window.*
//   });

const BTN_BASE = 'min-width:32px; height:32px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center; border:1px solid #cbd5e1; border-radius:4px; background:#fff; color:#1e293b; cursor:pointer; user-select:none; font-size:0.85rem; text-decoration:none; transition:background 0.15s;';
const BTN_ACTIVE = 'background:#4f46e5; color:#fff; border-color:#4f46e5; font-weight:600;';
const BTN_DISABLED = 'background:#f1f5f9; color:#94a3b8; cursor:not-allowed; pointer-events:none;';

function btnStyle({ active, disabled }) {
    let s = BTN_BASE;
    if (active) s += BTN_ACTIVE;
    if (disabled) s += BTN_DISABLED;
    return s;
}

export function renderPagination(containerId, { page, totalPages, onPageClick, callbackName }) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!totalPages || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    if (!callbackName) throw new Error('renderPagination: callbackName is required');
    window[callbackName] = onPageClick;

    // Sinh dải số trang gọn: 1 ... (page-2..page+2) ... totalPages
    const pages = [];
    const windowSize = 2;
    pages.push(1);
    if (page - windowSize > 2) pages.push('...');
    for (let p = Math.max(2, page - windowSize); p <= Math.min(totalPages - 1, page + windowSize); p++) {
        pages.push(p);
    }
    if (page + windowSize < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    let html = `<div class="pagination" style="display:flex; gap:4px; flex-wrap:wrap;">`;

    // Prev
    const prevDisabled = page === 1;
    html += `<a href="javascript:void(0)" style="${btnStyle({ disabled: prevDisabled })}" onclick="${prevDisabled ? '' : `window.${callbackName}(${page - 1})`}">&laquo;</a>`;

    for (const p of pages) {
        if (p === '...') {
            html += `<span style="${btnStyle({ disabled: true })}">…</span>`;
        } else {
            const isActive = page === p;
            html += `<a href="javascript:void(0)" style="${btnStyle({ active: isActive })}" onclick="window.${callbackName}(${p})">${p}</a>`;
        }
    }

    // Next
    const nextDisabled = page === totalPages;
    html += `<a href="javascript:void(0)" style="${btnStyle({ disabled: nextDisabled })}" onclick="${nextDisabled ? '' : `window.${callbackName}(${page + 1})`}">&raquo;</a>`;

    html += `</div>`;
    container.innerHTML = html;
}

// Chuyển response paged của BE thành { page, totalPages, total }.
// Hỗ trợ cả 2 shape:
//  - PagedResult mới: { page, pageSize, total, pageData }
//  - PagedResult cũ: { pageIndex, pageSize, totalRow, totalPages, pageData }
export function extractPaging(pagedData, fallbackPageSize = 20) {
    if (!pagedData) return { page: 1, totalPages: 1, total: 0 };
    const page = pagedData.page ?? pagedData.pageIndex ?? 1;
    const pageSize = pagedData.pageSize ?? fallbackPageSize;
    const total = pagedData.total ?? pagedData.totalRow ?? 0;
    const totalPages = pagedData.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
    return { page, totalPages, total, pageSize };
}
