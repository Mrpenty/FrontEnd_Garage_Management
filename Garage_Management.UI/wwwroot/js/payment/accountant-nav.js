document.addEventListener('DOMContentLoaded', () => {
    initAccountantNavigation();
});

export function initAccountantNavigation() {
    const navLinks = document.querySelectorAll('.accountant-nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Get the target page
            const targetPage = link.getAttribute('data-page');
            
            // Navigate to the page
            if (targetPage) {
                window.location.href = targetPage;
            }
        });
    });
    
    // Highlight current page
    highlightCurrentPage();
}

function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.accountant-nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('data-page');
        if (href && currentPath.includes(href.split('/').pop())) {
            link.classList.add('active');
        }
    });
}

export function updateHeaderUI() {
    const userDisplayName = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('btn-logout-header');

    const userInfoStr = localStorage.getItem('userInfo');
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken && userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        if (userDisplayName) userDisplayName.innerText = `Xin chào, ${userInfo.fullName || 'Khách'}!`;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = '../Auth/StaffLogin.html';
        });
    }
}
