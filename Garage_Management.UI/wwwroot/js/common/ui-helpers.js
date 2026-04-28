/**
 * UX/UI Helper Functions
 * Quản lý loading states, button disable, toast notifications
 */

// ============ LOADING INDICATORS ============

export const LoadingManager = {
    /**
     * Hiển thị loading overlay trên màn hình
     */
    showLoadingOverlay() {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    },

    /**
     * Ẩn loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    },

    /**
     * Hiển thị loading bar ở trên cùng
     */
    showLoadingBar() {
        let bar = document.getElementById('loadingBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'loadingBar';
            bar.className = 'loading-bar';
            document.body.appendChild(bar);
        }
        bar.style.display = 'block';
    },

    /**
     * Ẩn loading bar
     */
    hideLoadingBar() {
        const bar = document.getElementById('loadingBar');
        if (bar) bar.style.display = 'none';
    }
};

// ============ BUTTON STATE MANAGER ============

export const ButtonStateManager = {
    /**
     * Disable button và thêm loading indicator
     * @param {HTMLElement} button - Nút cần disable
     * @param {string} loadingText - Text hiển thị khi loading (mặc định: "Đang xử lý...")
     */
    setLoading(button, loadingText = "⏳ Đang xử lý...") {
        if (!button) return;
        
        button.dataset.originalText = button.innerText;
        button.dataset.originalHtml = button.innerHTML;
        button.disabled = true;
        button.classList.add('btn-disabled');
        button.style.opacity = '0.6';
        button.innerText = loadingText;
    },

    /**
     * Enable button và khôi phục text gốc
     * @param {HTMLElement} button - Nút cần enable
     */
    resetLoading(button) {
        if (!button) return;
        
        button.disabled = false;
        button.classList.remove('btn-disabled');
        button.style.opacity = '1';
        
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        } else if (button.dataset.originalText) {
            button.innerText = button.dataset.originalText;
        }
    },

    /**
     * Disable nhiều buttons cùng lúc
     * @param {HTMLElement[]} buttons - Mảng các nút
     */
    disableMultiple(buttons) {
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.add('btn-disabled');
            }
        });
    },

    /**
     * Enable nhiều buttons cùng lúc
     * @param {HTMLElement[]} buttons - Mảng các nút
     */
    enableMultiple(buttons) {
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('btn-disabled');
            }
        });
    },

    /**
     * Thêm ripple effect khi click button
     * @param {Event} event - Click event
     */
    addRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
};

// ============ TOAST NOTIFICATIONS ============

export const Toast = {
    /**
     * Hiển thị toast thông báo
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    show(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${iconMap[type] || 'ℹ'}</span>
            <span class="toast-message">${message}</span>
            <span class="toast-close">&times;</span>
        `;

        container.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },

    error(message, duration = 4000) {
        this.show(message, 'error', duration);
    },

    warning(message, duration = 3500) {
        this.show(message, 'warning', duration);
    },

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
};

// ============ FORM VALIDATION & FEEDBACK ============

export const FormValidator = {
    /**
     * Hiển thị error message cho form field
     * @param {HTMLElement} input - Input element
     * @param {string} errorMessage - Error message
     */
    showError(input, errorMessage) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.add('error');
        
        let errorDiv = formGroup.querySelector('.form-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            formGroup.appendChild(errorDiv);
        }
        
        errorDiv.innerText = errorMessage;
    },

    /**
     * Xóa error message
     * @param {HTMLElement} input - Input element
     */
    clearError(input) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error');
        const errorDiv = formGroup.querySelector('.form-error');
        if (errorDiv) errorDiv.remove();
    },

    /**
     * Validate email
     * @param {string} email - Email address
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate phone number (Vietnam)
     * @param {string} phone - Phone number
     */
    isValidPhone(phone) {
        const re = /^0\d{9,10}$/;
        return re.test(phone.replace(/\s/g, ''));
    }
};

// ============ ASYNC ACTION WRAPPER ============

/**
 * Wrapper cho async actions với loading state
 * @param {HTMLElement} button - Button element
 * @param {Function} asyncFn - Async function để chạy
 * @param {object} options - Options: { loadingText, successMsg, errorMsg }
 */
export async function executeAction(button, asyncFn, options = {}) {
    const {
        loadingText = '⏳ Đang xử lý...',
        successMsg = '✓ Thành công!',
        errorMsg = '✕ Có lỗi xảy ra'
    } = options;

    try {
        // Disable button & show loading
        ButtonStateManager.setLoading(button, loadingText);
        
        // Chạy async function
        const result = await asyncFn();
        
        // Show success
        if (successMsg) {
            Toast.success(successMsg);
        }
        
        return result;
    } catch (error) {
        // Show error
        const message = error?.response?.data?.message || error?.message || errorMsg;
        Toast.error(message);
        console.error('Action error:', error);
        throw error;
    } finally {
        // Re-enable button
        ButtonStateManager.resetLoading(button);
    }
}

// ============ MODAL HELPERS ============

export const ModalHelper = {
    /**
     * Mở modal với animation
     * @param {HTMLElement} modal - Modal element
     */
    open(modal) {
        if (!modal) return;
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Trigger animation
        setTimeout(() => {
            const content = modal.querySelector('.modal-content');
            if (content) content.style.animation = 'slideDown 0.3s ease-out';
        }, 0);
    },

    /**
     * Đóng modal với animation
     * @param {HTMLElement} modal - Modal element
     */
    close(modal) {
        if (!modal) return;
        modal.classList.remove('show');
        modal.style.display = 'none';
    },

    /**
     * Toggle modal
     * @param {HTMLElement} modal - Modal element
     */
    toggle(modal) {
        if (modal && modal.style.display === 'flex') {
            this.close(modal);
        } else {
            this.open(modal);
        }
    }
};

// ============ PAGINATION HELPERS ============

export const PaginationHelper = {
    /**
     * Render pagination
     * @param {HTMLElement} container - Container element
     * @param {number} currentPage - Current page
     * @param {number} totalPages - Total pages
     * @param {Function} onPageChange - Callback khi page thay đổi
     */
    render(container, currentPage, totalPages, onPageChange) {
        if (!container) return;
        
        let html = '<ul class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            html += `<li class="page-item"><a class="page-link" data-page="${currentPage - 1}">← Trước</a></li>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            html += `<li class="page-item ${activeClass}"><a class="page-link" data-page="${i}">${i}</a></li>`;
        }
        
        // Next button
        if (currentPage < totalPages) {
            html += `<li class="page-item"><a class="page-link" data-page="${currentPage + 1}">Tiếp →</a></li>`;
        }
        
        html += '</ul>';
        container.innerHTML = html;
        
        // Attach events
        container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                onPageChange(page);
            });
        });
    }
};

// ============ UTILITY FUNCTIONS ============

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 */
export function debounce(fn, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in ms
 */
export function throttle(fn, limit = 300) {
    let lastRun = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastRun >= limit) {
            fn.apply(this, args);
            lastRun = now;
        }
    };
}

/**
 * Sleep function (Promise based)
 * @param {number} ms - Milliseconds to sleep
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
    LoadingManager,
    ButtonStateManager,
    Toast,
    FormValidator,
    executeAction,
    ModalHelper,
    PaginationHelper,
    debounce,
    throttle,
    sleep
};
