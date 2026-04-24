import CONFIG from '../config.js';

const STOCKCHECK_URL = `${CONFIG.API_BASE_URL}/stock-checks`;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});

const buildQuery = (params) => {
    const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    return qs ? `?${qs}` : '';
};

export const stockCheckAPI = {
    // GET /api/stock-checks/snapshot — paginated
    // Trả PagedResult<StockCheckItemSnapshotResponse> { page, pageSize, total, pageData }
    getSnapshot: async ({ page = 1, pageSize = 20, search = '', categoryId, brandId } = {}) => {
        const url = `${STOCKCHECK_URL}/snapshot${buildQuery({ Page: page, PageSize: pageSize, Search: search, CategoryId: categoryId, BrandId: brandId })}`;
        const res = await fetch(url, { headers: getHeaders() });
        return await res.json();
    },

    // POST /api/stock-checks
    submit: async (payload) => {
        const res = await fetch(STOCKCHECK_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return await res.json();
    },

    // GET /api/stock-checks/{receiptCode}
    getByReceiptCode: async (receiptCode) => {
        const res = await fetch(`${STOCKCHECK_URL}/${encodeURIComponent(receiptCode)}`, {
            headers: getHeaders()
        });
        return await res.json();
    },

    // GET /api/stock-checks — paginated list of sessions
    // Giả định route: cùng URL với POST (khác verb). Nếu BE dùng route khác (vd /sessions),
    // chỉ cần sửa URL ở đây.
    getSessions: async ({ page = 1, pageSize = 10, search = '', from, to } = {}) => {
        const url = `${STOCKCHECK_URL}${buildQuery({
            Page: page,
            PageSize: pageSize,
            Search: search,
            From: from,
            To: to
        })}`;
        const res = await fetch(url, { headers: getHeaders() });
        return await res.json();
    }
};
