import CONFIG from '../config.js';

const PAYMENT_URL = `${CONFIG.API_BASE_URL}/Payment`;
const INVOICE_URL = `${CONFIG.API_BASE_URL}/Invoices`;
const JOBCARD_URL = `${CONFIG.API_BASE_URL}/Jobcards`;

export const PaymentAPI = {
    getAuthHeader: () => {
        const token = localStorage.getItem('accessToken'); 
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    },

    getInvoices: async () => {
        const response = await fetch(`${INVOICE_URL}`, {
            headers: PaymentAPI.getAuthHeader()
        }); 
        return await response.json();
    },

    getBankTransferQr: async (invoiceId) => {
        const response = await fetch(`${PAYMENT_URL}/bank-transfer/${invoiceId}`, {
            headers: PaymentAPI.getAuthHeader()
        });
        return await response.json();
    },

    confirmCashPayment: async (invoiceId) => {
        const response = await fetch(`${PAYMENT_URL}/cash-confirm`, {
            method: 'POST',
            headers: PaymentAPI.getAuthHeader(),
            body: JSON.stringify({ invoiceId: invoiceId })
        });
        return await response.json();
    },

    getJobCardDetail: async (jobCardId) => {
        const response = await fetch(`${JOBCARD_URL}/${jobCardId}`, {
            headers: PaymentAPI.getAuthHeader()
        });
        return await response.json();
    },

    getServiceById: async (serviceId) => {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Services/${serviceId}`, {
            headers: PaymentAPI.getAuthHeader()
        });
        return await response.json();
    }
};