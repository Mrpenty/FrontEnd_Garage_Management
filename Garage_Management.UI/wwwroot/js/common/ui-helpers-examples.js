/**
 * EXAMPLE: Cách sử dụng UI Helpers
 * File này là hướng dẫn chi tiết cách tích hợp UI Helpers vào code của bạn
 */

import { 
    LoadingManager, 
    ButtonStateManager, 
    Toast, 
    FormValidator, 
    ModalHelper,
    executeAction,
    debounce,
    throttle
} from './ui-helpers.js';

// ============================================================================
// EXAMPLE 1: Form Submit với Button Loading State
// ============================================================================

const form = document.getElementById('myForm');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Cách 1: Manual control
    ButtonStateManager.setLoading(submitBtn, "⏳ Đang lưu...");
    
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: new FormData(form)
        });
        
        if (response.ok) {
            Toast.success("Dữ liệu đã được lưu thành công!");
            form.reset();
        } else {
            Toast.error("Có lỗi xảy ra!");
        }
    } catch (error) {
        Toast.error(`Lỗi: ${error.message}`);
    } finally {
        ButtonStateManager.resetLoading(submitBtn);
    }
});

// ============================================================================
// EXAMPLE 2: Async Action với executeAction Wrapper
// ============================================================================

const createBtn = document.getElementById('create-btn');

createBtn.addEventListener('click', async () => {
    try {
        const result = await executeAction(
            createBtn,
            async () => {
                // Hàm async của bạn
                const response = await fetch('/api/create', { method: 'POST' });
                return response.json();
            },
            {
                loadingText: "⏳ Đang tạo...",
                successMsg: "✓ Tạo thành công!",
                errorMsg: "✕ Không thể tạo"
            }
        );
        
        console.log("Result:", result);
    } catch (error) {
        console.error("Error:", error);
    }
});

// ============================================================================
// EXAMPLE 3: Form Validation với Toast
// ============================================================================

const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');

function validateForm() {
    let isValid = true;
    
    // Validate email
    if (!FormValidator.isValidEmail(emailInput.value)) {
        FormValidator.showError(emailInput, "Email không đúng định dạng!");
        Toast.warning("Vui lòng nhập email hợp lệ");
        isValid = false;
    } else {
        FormValidator.clearError(emailInput);
    }
    
    // Validate phone
    if (!FormValidator.isValidPhone(phoneInput.value)) {
        FormValidator.showError(phoneInput, "Số điện thoại không hợp lệ!");
        Toast.warning("Vui lòng nhập số điện thoại hợp lệ");
        isValid = false;
    } else {
        FormValidator.clearError(phoneInput);
    }
    
    return isValid;
}

// ============================================================================
// EXAMPLE 4: Disable Multiple Buttons
// ============================================================================

const buttons = document.querySelectorAll('.action-btn');

// Disable tất cả buttons khi loading
LoadingManager.showLoadingOverlay();
ButtonStateManager.disableMultiple(Array.from(buttons));

setTimeout(() => {
    LoadingManager.hideLoadingOverlay();
    ButtonStateManager.enableMultiple(Array.from(buttons));
}, 2000);

// ============================================================================
// EXAMPLE 5: Modal Operations
// ============================================================================

const modal = document.getElementById('myModal');
const openBtn = document.getElementById('open-modal-btn');
const closeBtn = document.getElementById('close-modal-btn');

openBtn.addEventListener('click', () => {
    ModalHelper.open(modal);
});

closeBtn.addEventListener('click', () => {
    ModalHelper.close(modal);
});

// Đóng modal khi click vào ngoài vùng modal
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        ModalHelper.close(modal);
    }
});

// ============================================================================
// EXAMPLE 6: Search Input với Debounce
// ============================================================================

const searchInput = document.getElementById('search');
const searchResults = document.getElementById('results');

// Tạo debounced version của search function
const performSearch = debounce(async (keyword) => {
    if (keyword.length < 2) {
        searchResults.innerHTML = '';
        return;
    }
    
    LoadingManager.showLoadingBar();
    
    try {
        const response = await fetch(`/api/search?q=${keyword}`);
        const data = await response.json();
        
        searchResults.innerHTML = data
            .map(item => `<div class="result">${item.name}</div>`)
            .join('');
            
        Toast.success(`Tìm thấy ${data.length} kết quả`);
    } catch (error) {
        Toast.error("Lỗi khi tìm kiếm");
    } finally {
        LoadingManager.hideLoadingBar();
    }
}, 300); // Delay 300ms sau khi dừng gõ

searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
});

// ============================================================================
// EXAMPLE 7: Scroll Event với Throttle
// ============================================================================

const scrollHandler = throttle(() => {
    console.log("User scrolling...");
    
    // Load more data if scroll near bottom
    const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    
    if (scrollPercentage > 80) {
        Toast.info("Đang tải thêm dữ liệu...");
        // Load more logic here
    }
}, 500);

window.addEventListener('scroll', scrollHandler);

// ============================================================================
// EXAMPLE 8: Loading Overlay Scenarios
// ============================================================================

// Scenario 1: Show during data fetch
async function loadData() {
    LoadingManager.showLoadingOverlay();
    
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        Toast.success("Dữ liệu đã được tải");
        return data;
    } catch (error) {
        Toast.error("Không thể tải dữ liệu");
    } finally {
        LoadingManager.hideLoadingOverlay();
    }
}

// Scenario 2: Show loading bar during file upload
async function uploadFile(file) {
    LoadingManager.showLoadingBar();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            Toast.success("Tệp đã được tải lên thành công!");
        } else {
            Toast.error("Tải lên thất bại!");
        }
    } catch (error) {
        Toast.error(`Lỗi: ${error.message}`);
    } finally {
        LoadingManager.hideLoadingBar();
    }
}

// ============================================================================
// EXAMPLE 9: Toast Notifications - Tất cả types
// ============================================================================

// Success notification
document.getElementById('btn-success').addEventListener('click', () => {
    Toast.success("Thao tác thành công! ✓", 3000);
});

// Error notification
document.getElementById('btn-error').addEventListener('click', () => {
    Toast.error("Đã xảy ra lỗi! ✕", 4000);
});

// Warning notification
document.getElementById('btn-warning').addEventListener('click', () => {
    Toast.warning("Hãy kiểm tra lại dữ liệu!", 3500);
});

// Info notification
document.getElementById('btn-info').addEventListener('click', () => {
    Toast.info("Thông tin cập nhật cho bạn", 3000);
});

// ============================================================================
// EXAMPLE 10: Complex Form Validation
// ============================================================================

const complexForm = document.getElementById('complex-form');

complexForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(complexForm);
    const data = Object.fromEntries(formData);
    
    // Validate
    if (!data.name) {
        FormValidator.showError(complexForm.querySelector('[name="name"]'), "Tên không được để trống");
        Toast.warning("Vui lòng điền đầy đủ thông tin");
        return;
    }
    
    if (!FormValidator.isValidEmail(data.email)) {
        FormValidator.showError(complexForm.querySelector('[name="email"]'), "Email không hợp lệ");
        Toast.warning("Email không đúng định dạng");
        return;
    }
    
    if (!FormValidator.isValidPhone(data.phone)) {
        FormValidator.showError(complexForm.querySelector('[name="phone"]'), "Số điện thoại không hợp lệ");
        Toast.warning("Số điện thoại không đúng định dạng");
        return;
    }
    
    // All valid - submit
    const submitBtn = complexForm.querySelector('button[type="submit"]');
    
    try {
        const result = await executeAction(
            submitBtn,
            async () => {
                const response = await fetch('/api/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(await response.text());
                }
                
                return response.json();
            },
            {
                loadingText: "⏳ Đang lưu...",
                successMsg: "✓ Dữ liệu đã được lưu!",
                errorMsg: "✕ Không thể lưu dữ liệu"
            }
        );
        
        console.log("Success:", result);
        complexForm.reset();
        
    } catch (error) {
        console.error("Error:", error);
    }
});

// ============================================================================
// EXAMPLE 11: Delete Confirmation + Action
// ============================================================================

const deleteBtn = document.getElementById('delete-btn');

deleteBtn.addEventListener('click', async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa?")) {
        Toast.warning("Đã hủy thao tác");
        return;
    }
    
    try {
        await executeAction(
            deleteBtn,
            async () => {
                const response = await fetch('/api/delete', { method: 'DELETE' });
                return response.json();
            },
            {
                loadingText: "⏳ Đang xóa...",
                successMsg: "✓ Dữ liệu đã được xóa!",
                errorMsg: "✕ Không thể xóa dữ liệu"
            }
        );
        
        // Reload hoặc update UI
        location.reload();
        
    } catch (error) {
        // Error handling đã done bởi executeAction
    }
});

// ============================================================================
// EXAMPLE 12: Multiple Actions with Loading State
// ============================================================================

const saveBtn = document.getElementById('save-btn');
const saveAndCloseBtn = document.getElementById('save-close-btn');
const cancelBtn = document.getElementById('cancel-btn');

function lockAllButtons() {
    ButtonStateManager.disableMultiple([saveBtn, saveAndCloseBtn, cancelBtn]);
}

function unlockAllButtons() {
    ButtonStateManager.enableMultiple([saveBtn, saveAndCloseBtn, cancelBtn]);
}

// Save only
saveBtn.addEventListener('click', async () => {
    lockAllButtons();
    ButtonStateManager.setLoading(saveBtn, "⏳ Lưu...");
    
    try {
        await someAsyncOperation();
        Toast.success("Đã lưu!");
    } catch (error) {
        Toast.error(error.message);
    } finally {
        unlockAllButtons();
        ButtonStateManager.resetLoading(saveBtn);
    }
});

// Save & close
saveAndCloseBtn.addEventListener('click', async () => {
    lockAllButtons();
    ButtonStateManager.setLoading(saveAndCloseBtn, "⏳ Lưu & Đóng...");
    
    try {
        await someAsyncOperation();
        Toast.success("Đã lưu và đóng!");
        ModalHelper.close(modal);
    } catch (error) {
        Toast.error(error.message);
    } finally {
        unlockAllButtons();
        ButtonStateManager.resetLoading(saveAndCloseBtn);
    }
});

// Cancel
cancelBtn.addEventListener('click', () => {
    Toast.info("Đã hủy");
    ModalHelper.close(modal);
});

// ============================================================================
// HELPER FUNCTION (THAY ĐỔI THEO NHU CẦU CỦA BẠN)
// ============================================================================

async function someAsyncOperation() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            Math.random() > 0.5 ? resolve("Success") : reject(new Error("Failed"));
        }, 2000);
    });
}

// ============================================================================
// Export để sử dụng ở files khác
// ============================================================================

export {
    validateForm,
    performSearch,
    loadData,
    uploadFile,
    lockAllButtons,
    unlockAllButtons
};
