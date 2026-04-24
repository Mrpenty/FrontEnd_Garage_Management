import { stockCheckAPI } from './stockcheck-api.js';
import { stockCheckUI } from './stockcheck-ui.js';

// ===== State =====
// dirtyMap: spid -> { sparePartId, partCode, partName, sparePartBrandName, unit, stockSystem, stockActual, reason, dirty }
// Giữ ngoài trang hiện tại → user chuyển trang vẫn còn input cũ khi quay lại.
const dirtyMap = new Map();

let snapshotState = {
    page: 1,
    pageSize: 20,
    total: 0,
    items: [],       // items của TRANG hiện tại sau merge với dirtyMap
    keyword: '',
    onlyDiscrepancies: false
};

let sessionsState = {
    page: 1,
    pageSize: 10,
    total: 0,
    keyword: '',
    from: '',
    to: ''
};

// Debounce helper
const debounce = (fn, ms = 350) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
};

const stockCheckMain = {
    init() {
        this.bindEvents();
        // Load sessions list khi trang ready (không phụ thuộc tab active)
        this.loadSessions(1);
    },

    // ========== CREATE MODAL ==========
    async openCreateModal() {
        dirtyMap.clear();

        const dateInput = document.getElementById('scCheckDate');
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 16);
        const scopeSel = document.getElementById('scScope');
        if (scopeSel) scopeSel.value = 'FULL';
        document.getElementById('scSearch').value = '';
        document.getElementById('scOnlyDiscrepancies').checked = false;

        snapshotState.page = 1;
        snapshotState.keyword = '';
        snapshotState.onlyDiscrepancies = false;

        new bootstrap.Modal('#stockCheckCreateModal').show();
        await this.loadSnapshotPage(1);
    },

    async loadSnapshotPage(page) {
        const tbody = document.getElementById('stockCheckRows');
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3"><i class="bi bi-hourglass-split"></i> Đang tải...</td></tr>`;

        // Chế độ "Chỉ mục có chênh lệch" → render từ dirtyMap, bỏ qua server paging
        if (snapshotState.onlyDiscrepancies) {
            const items = Array.from(dirtyMap.values()).filter(it => {
                const actual = Number(it.stockActual);
                if (!Number.isFinite(actual)) return false;
                if (actual === Number(it.stockSystem)) return false;
                if (snapshotState.keyword) {
                    const kw = snapshotState.keyword.toLowerCase();
                    const hay = `${it.partName || ''} ${it.partCode || ''}`.toLowerCase();
                    if (!hay.includes(kw)) return false;
                }
                return true;
            });
            snapshotState.items = items;
            snapshotState.total = items.length;
            stockCheckUI.renderSnapshotRows(items);
            stockCheckUI.renderSnapshotMeta({ page: 1, pageSize: items.length || 1, total: items.length });
            stockCheckUI.renderPagination('scSnapshotPagination', {
                page: 1, totalPages: 1,
                callbackName: 'stockCheckSnapshotGoPage',
                onPageClick: (p) => this.loadSnapshotPage(p)
            });
            return;
        }

        try {
            const res = await stockCheckAPI.getSnapshot({
                page,
                pageSize: snapshotState.pageSize,
                search: snapshotState.keyword
            });
            if (!res.success) throw new Error(res.message || 'Không lấy được snapshot');
            const paged = res.data || {};
            const rows = paged.pageData || [];

            // Merge với dirtyMap (giữ input user đã gõ)
            const merged = rows.map(r => {
                const d = dirtyMap.get(r.sparePartId);
                return {
                    sparePartId: r.sparePartId,
                    partCode: r.partCode,
                    partName: r.partName,
                    unit: r.unit,
                    sparePartBrandName: r.sparePartBrandName,
                    stockSystem: Number(r.stockSystem) || 0,
                    stockActual: d?.stockActual ?? null,
                    reason: d?.reason ?? '',
                    dirty: d?.dirty === true
                };
            });

            snapshotState.page = paged.page || page;
            snapshotState.pageSize = paged.pageSize || snapshotState.pageSize;
            snapshotState.total = paged.total || 0;
            snapshotState.items = merged;

            stockCheckUI.renderSnapshotRows(merged);
            stockCheckUI.renderSnapshotMeta(snapshotState);

            const totalPages = Math.max(1, Math.ceil(snapshotState.total / snapshotState.pageSize));
            stockCheckUI.renderPagination('scSnapshotPagination', {
                page: snapshotState.page,
                totalPages,
                callbackName: 'stockCheckSnapshotGoPage',
                onPageClick: (p) => this.loadSnapshotPage(p)
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Lỗi: ${err.message}</td></tr>`;
        }
    },

    // Gọi khi user đổi filter. Search có debounce.
    applyFilter() {
        snapshotState.keyword = document.getElementById('scSearch').value || '';
        snapshotState.onlyDiscrepancies = document.getElementById('scOnlyDiscrepancies').checked;
        this.loadSnapshotPage(1);
    },

    handleRowInput(e) {
        const target = e.target;
        const spid = parseInt(target.dataset.spid);
        if (!spid) return;

        // Lấy item từ page hiện tại để có đủ metadata
        let item = dirtyMap.get(spid);
        if (!item) {
            const fromPage = snapshotState.items.find(x => x.sparePartId === spid);
            if (!fromPage) return;
            item = {
                sparePartId: fromPage.sparePartId,
                partCode: fromPage.partCode,
                partName: fromPage.partName,
                sparePartBrandName: fromPage.sparePartBrandName,
                unit: fromPage.unit,
                stockSystem: fromPage.stockSystem,
                stockActual: null,
                reason: '',
                dirty: false
            };
            dirtyMap.set(spid, item);
        }

        if (target.classList.contains('sc-actual')) {
            const raw = target.value;
            if (raw === '') {
                item.stockActual = null;
                item.dirty = false;
            } else {
                const n = parseInt(raw);
                item.stockActual = Number.isFinite(n) ? n : null;
                item.dirty = true;
            }
            stockCheckUI.refreshRow(item);
        } else if (target.classList.contains('sc-reason')) {
            item.reason = target.value;
        }

        // Cập nhật bản trong snapshotState.items để pagination re-render đúng
        const idx = snapshotState.items.findIndex(x => x.sparePartId === spid);
        if (idx >= 0) {
            snapshotState.items[idx].stockActual = item.stockActual;
            snapshotState.items[idx].reason = item.reason;
            snapshotState.items[idx].dirty = item.dirty;
        }
    },

    async submitForm() {
        const checkDateRaw = document.getElementById('scCheckDate').value;
        const scope = document.getElementById('scScope').value || 'FULL';

        // Gửi item từ dirtyMap có delta ≠ 0
        const discrepancyItems = [];
        for (const it of dirtyMap.values()) {
            if (!it.dirty) continue;
            if (it.stockActual === null || !Number.isFinite(Number(it.stockActual))) continue;
            const actual = Number(it.stockActual);
            if (actual === Number(it.stockSystem)) continue;
            discrepancyItems.push(it);
        }

        if (discrepancyItems.length === 0) {
            alert('Chưa có mục nào có chênh lệch để ghi nhận.');
            return;
        }

        const missingReason = discrepancyItems.filter(it => !(it.reason || '').trim());
        if (missingReason.length > 0) {
            alert(`Vui lòng nhập lý do cho ${missingReason.length} phụ tùng có chênh lệch.\nVD: ${missingReason.slice(0, 3).map(x => x.partName).join(', ')}${missingReason.length > 3 ? '...' : ''}`);
            return;
        }

        if (!confirm(`Xác nhận tạo phiếu kiểm kê với ${discrepancyItems.length} phụ tùng có chênh lệch?`)) return;

        const payload = {
            checkDate: checkDateRaw ? new Date(checkDateRaw).toISOString() : new Date().toISOString(),
            scope,
            items: discrepancyItems.map(it => ({
                sparePartId: it.sparePartId,
                stockActual: Number(it.stockActual),
                reason: it.reason.trim()
            }))
        };

        const submitBtn = document.getElementById('btnSubmitStockCheck');
        const original = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang lưu...';

        try {
            const res = await stockCheckAPI.submit(payload);
            if (!res.success) throw new Error(res.message || 'Tạo phiếu thất bại');

            bootstrap.Modal.getInstance('#stockCheckCreateModal').hide();
            stockCheckUI.renderResultModal(res.data);
            new bootstrap.Modal('#stockCheckResultModal').show();

            // Clear state
            dirtyMap.clear();

            // Refresh data
            if (window.inventoryMain?.loadInventory) window.inventoryMain.loadInventory();
            if (window.inventoryMain?.loadTransactions) window.inventoryMain.loadTransactions();
            this.loadSessions(1);
        } catch (err) {
            alert('Lỗi: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = original;
        }
    },

    // ========== LOOKUP BY CODE ==========
    async lookup() {
        const code = (document.getElementById('scLookupCode').value || '').trim();
        if (!code) {
            alert('Vui lòng nhập mã phiếu (VD: KK-20260423111635)');
            return;
        }
        const box = document.getElementById('stockCheckLookupResult');
        box.innerHTML = `<div class="text-center py-3 text-muted"><i class="bi bi-hourglass-split"></i> Đang tra cứu...</div>`;
        try {
            const res = await stockCheckAPI.getByReceiptCode(code);
            if (!res.success) {
                stockCheckUI.renderLookupResult(null);
                return;
            }
            stockCheckUI.renderLookupResult(res.data);
        } catch (err) {
            box.innerHTML = `<div class="alert alert-danger">Lỗi: ${err.message}</div>`;
        }
    },

    // ========== SESSIONS LIST ==========
    async loadSessions(page = 1) {
        const tbody = document.getElementById('sessionsTableBody');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted"><i class="bi bi-hourglass-split"></i> Đang tải danh sách phiên...</td></tr>`;

        try {
            const res = await stockCheckAPI.getSessions({
                page,
                pageSize: sessionsState.pageSize,
                search: sessionsState.keyword,
                from: sessionsState.from ? new Date(sessionsState.from).toISOString() : '',
                to: sessionsState.to ? new Date(sessionsState.to).toISOString() : ''
            });
            if (!res.success) throw new Error(res.message || 'Không lấy được danh sách');
            const paged = res.data || {};
            const rows = paged.pageData || [];

            sessionsState.page = paged.page || page;
            sessionsState.pageSize = paged.pageSize || sessionsState.pageSize;
            sessionsState.total = paged.total || 0;

            stockCheckUI.renderSessionsTable(rows);

            const totalPages = Math.max(1, Math.ceil(sessionsState.total / sessionsState.pageSize));
            stockCheckUI.renderPagination('sessionsPagination', {
                page: sessionsState.page,
                totalPages,
                callbackName: 'stockCheckSessionsGoPage',
                onPageClick: (p) => this.loadSessions(p)
            });

            const metaBox = document.getElementById('scSessionsMeta');
            if (metaBox) {
                if (!sessionsState.total) metaBox.textContent = '';
                else {
                    const from = (sessionsState.page - 1) * sessionsState.pageSize + 1;
                    const to = Math.min(sessionsState.page * sessionsState.pageSize, sessionsState.total);
                    metaBox.textContent = `Hiển thị ${from}-${to} / ${sessionsState.total} phiên`;
                }
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Lỗi: ${err.message}</td></tr>`;
        }
    },

    applySessionsFilter() {
        sessionsState.keyword = document.getElementById('scSessionsSearch').value || '';
        sessionsState.from = document.getElementById('scSessionsFrom').value || '';
        sessionsState.to = document.getElementById('scSessionsTo').value || '';
        this.loadSessions(1);
    },

    // Xem chi tiết 1 phiên từ bảng sessions
    async viewSession(receiptCode) {
        document.getElementById('scLookupCode').value = receiptCode;
        await this.lookup();
        // scroll lookup result vào view
        document.getElementById('stockCheckLookupResult')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ========== EVENT BINDING ==========
    bindEvents() {
        document.getElementById('btnOpenStockCheck')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('btnSubmitStockCheck')?.addEventListener('click', () => this.submitForm());
        document.getElementById('btnLookupStockCheck')?.addEventListener('click', () => this.lookup());

        // Search trong modal (server-side) — debounce
        const debouncedFilter = debounce(() => this.applyFilter(), 350);
        document.getElementById('scSearch')?.addEventListener('input', debouncedFilter);
        document.getElementById('scOnlyDiscrepancies')?.addEventListener('change', () => this.applyFilter());

        document.getElementById('stockCheckRows')?.addEventListener('input', (e) => this.handleRowInput(e));

        document.getElementById('scLookupCode')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.lookup();
            }
        });

        // Sessions filter
        const debouncedSess = debounce(() => this.applySessionsFilter(), 350);
        document.getElementById('scSessionsSearch')?.addEventListener('input', debouncedSess);
        document.getElementById('btnApplySessionsFilter')?.addEventListener('click', () => this.applySessionsFilter());
        document.getElementById('btnRefreshSessions')?.addEventListener('click', () => this.loadSessions(sessionsState.page));

        // Reload sessions khi vào tab (nếu BE data đổi)
        document.getElementById('stockcheck-tab')?.addEventListener('shown.bs.tab', () => {
            this.loadSessions(sessionsState.page);
        });
    }
};

window.stockCheckMain = stockCheckMain;
document.addEventListener('DOMContentLoaded', () => stockCheckMain.init());
