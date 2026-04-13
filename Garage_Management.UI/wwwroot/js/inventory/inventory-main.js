import {inventoryAPI} from "./inventory-api.js";
import {inventoryUI} from "./inventory-ui.js";
    
const inventoryMain = {
    init: function() {
        this.loadInventory(1);
        this.bindEvents();
    },

    loadInventory: async function(page = 1) {
        const query = document.getElementById('invSearch').value;
        const result = await inventoryAPI.getInventory(query, page);
        if (result.success) {
            inventoryUI.renderInventory(result.data); 
        }
    },
    loadTransactions: async function() {
        const result = await inventoryAPI.getTransactions();
        if (result.success) {
            inventoryUI.renderTransactions(result.data.pageData);
        }
    },

    bindEvents: function() {
        // Xử lý nộp form giao dịch
        document.getElementById('transactionForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                sparePartId: parseInt(formData.get('sparePartId')),
                transactionType: parseInt(formData.get('transactionType')),
                quantityChange: parseFloat(formData.get('quantityChange')) || 0,
                actualQuantity: formData.get('actualQuantity') ? parseFloat(formData.get('actualQuantity')) : null,
                receiptCode: formData.get('receiptCode'),
                note: formData.get('note')
            };

            try {
                const res = await inventoryAPI.createTransaction(data);
                if (res.success) {
                    alert("Thực hiện giao dịch thành công!");
                    bootstrap.Modal.getInstance('#transactionModal').hide();
                    this.loadInventory();
                    this.loadTransactions();
                } else {
                    alert("Lỗi: " + res.message);
                }
            } catch (err) {
                alert("Lỗi hệ thống khi tạo giao dịch");
            }
        };

        document.getElementById('inventoryForm').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const id = formData.get('sparePartId');
            
            const data = {
                partCode: formData.get('partCode'),
                partName: formData.get('partName'),
                unit: formData.get('unit'),
                quantity: parseFloat(formData.get('quantity')),
                minQuantity: parseFloat(formData.get('minQuantity')),
                lastPurchasePrice: parseFloat(formData.get('lastPurchasePrice')),
                sellingPrice: parseFloat(formData.get('sellingPrice')),
                isActive: true
            };

            let res;
            if (id) {
                res = await inventoryAPI.updateInventory(id, data);
            } else {
                res = await inventoryAPI.createInventory(data);
            }

            if (res.success) {
                alert("Lưu thông tin thành công!");
                bootstrap.Modal.getInstance('#inventoryModal').hide();
                this.loadInventory();
            } else {
                alert("Lỗi: " + res.message);
            }
        };

        // Lắng nghe đổi tab để load dữ liệu tương ứng
        document.getElementById('transactions-tab').addEventListener('shown.bs.tab', () => {
            this.loadTransactions();
        });
    }
};

// Khởi chạy khi trang load xong
window.inventoryMain = inventoryMain;
document.addEventListener('DOMContentLoaded', () => inventoryMain.init());
