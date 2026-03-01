import { BookingAPI } from './booking-api.js';
import { bookingUI } from './booking-ui.js';

const TIME_SLOTS = [
    { time: "08:00" }, { time: "09:30" }, { time: "11:00" },
    { time: "13:30" }, { time: "15:00" }, { time: "16:30" }
];

let selectedTime = null;

// --- State ---
let bookingState = {
    brandId: null,
    modelId: null,
    vehicleId: null,
    services: [],
    parts: []
};
let allModels = [];

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    loadInitialData();
});

function initEvents() {
    // Lắng nghe thay đổi hãng xe
    document.getElementById("vehicleBrand").addEventListener("change", handleBrandChange);

    // Form submit
    document.getElementById("booking-form").addEventListener("submit", handleFormSubmit);

    // Gán hàm vào window cho HTML onclick
    window.handleVehicleStep = handleVehicleStep;
    window.nextStep = nextStep;
}

// --- Logic functions ---

async function loadInitialData() {
    try {
        const [brandRes, modelRes] = await Promise.all([
            BookingAPI.getBrands(),
            BookingAPI.getModels()
        ]);

        if (brandRes.success) {
            bookingUI.renderBrandSelect(document.getElementById("vehicleBrand"), brandRes.data?.pageData || []);
        }
        if (modelRes.success) {
            allModels = modelRes.data?.pageData || modelRes.data?.items || [];
        }
    } catch (err) {
        console.error("Initialization error:", err);
    }

    // Khi khởi tạo Step 3, điền data user
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const formContainer = document.getElementById("booking-form");
    
    bookingUI.renderBookingForm(formContainer, userInfo);
    
    const slotContainer = document.getElementById("time-slots");
    bookingUI.renderTimeSlots(slotContainer, TIME_SLOTS);
}

function handleBrandChange(e) {
    const brandId = e.target.value;
    const modelSelect = document.getElementById("vehicleModel");

    if (brandId) {
        const filtered = allModels.filter(m => Number(m.brandId) === Number(brandId));
        bookingUI.renderModelSelect(modelSelect, filtered);
    } else {
        modelSelect.innerHTML = `<option value="">-- Chọn loại xe --</option>`;
        modelSelect.disabled = true;
    }
}

async function loadServices() {
    const container = document.getElementById("service-list");
    container.innerHTML = "<p>Đang tải dịch vụ...</p>";
    try {
        const res = await BookingAPI.getServices();
        const services = res.data?.pageData || [];
        bookingUI.renderServiceList(container, services, formatCurrency);
    } catch (err) {
        container.innerHTML = `<p class="error-msg">Lỗi: ${err.message}</p>`;
    }
}

async function loadInventories() {
    const container = document.getElementById("part-list");
    container.innerHTML = "<p class='loading-text'>Đang tìm phụ tùng phù hợp cho xe của bạn...</p>";
    
    try {
        // Sử dụng brandId đã lưu ở State từ Bước 0
        const res = await BookingAPI.getInventoryByBrand(bookingState.brandId);
        
        // Lưu ý: Kiểm tra cấu trúc data trả về của ApiResponse<List<InventoryResponse>>
        const parts = res.data || []; 
        
        bookingUI.renderPartList(container, parts, formatCurrency);
    } catch (err) {
        console.error("Load parts error:", err);
        container.innerHTML = `<p class="error-msg">Không thể tải danh sách phụ kiện.</p>`;
    }
}

function handleVehicleStep() {
    const brandId = document.getElementById("vehicleBrand").value;
    const modelId = document.getElementById("vehicleModel").value;

    if (!brandId || !modelId) {
        alert("Vui lòng chọn đầy đủ hãng xe và loại xe");
        return;
    }

    bookingState.brandId = parseInt(brandId);
    bookingState.modelId = parseInt(modelId);
    bookingState.vehicleId = parseInt(modelId); 

    loadServices(); 
    nextStep(1);
}

function nextStep(step) {
    if (step === 2) {
        // Kiểm tra dịch vụ trước khi sang bước phụ kiện
        const checked = [...document.querySelectorAll('input[name="service-item"]:checked')];
        if (checked.length === 0) {
            alert("Vui lòng chọn ít nhất một dịch vụ để tiếp tục");
            return;
        }
        bookingState.services = checked.map(input => parseInt(input.value));
        // Gọi hàm load phụ tùng
        loadInventories();
    }

    if (step === 3) {
        // Lưu các phụ kiện đã chọn vào state trước khi sang bước thông tin
        const checkedParts = [...document.querySelectorAll('input[name="part-item"]:checked')];
        bookingState.parts = checkedParts.map(input => parseInt(input.value));
    }

    bookingUI.showStepContent(step);
    bookingUI.updateStepBar(step);
}


async function handleFormSubmit(e) {
    e.preventDefault();
    
    const date = document.getElementById("appointmentDate").value;
    const timeSlot = document.querySelector('input[name="time-slot"]:checked')?.value;
    const userId = getUserId(); 

    if (!date || !timeSlot) {
        alert("Vui lòng chọn đầy đủ ngày và giờ hẹn!");
        return;
    }

    // BE dùng DateTime, nên gửi chuỗi định dạng ISO nhưng đảm bảo khớp múi giờ
    const dateObj = new Date(`${date}T${timeSlot}:00`);

    // Tạo Payload với KEY viết hoa chữ cái đầu (PascalCase) để khớp tuyệt đối với C# DTO
    const payload = {
        VehicleId: null,
        VehicleModelId: bookingState.modelId ? Number(bookingState.modelId) : null,
        AppointmentDateTime: dateObj.toISOString(),
        ServiceIds: (bookingState.services || []).map(id => Number(id)),
        SparePartsIds: (bookingState.parts || []).map(id => Number(id)),
        Status: 1, 
        Description: document.getElementById("note").value.trim() || ""
    };

    // --- Xử lý Logic Role theo đúng AppointmentService.cs ---
    if (userId && userId !== 0) {
        payload.CustomerId = Number(userId);
        // Bắt buộc phải để null để không dính "InvalidOperationException" ở BE
        payload.FirstName = null;
        payload.LastName = null;
        payload.Phone = null;
    } else {
        payload.CustomerId = null;
        payload.FirstName = document.getElementById("firstName").value.trim();
        payload.LastName = document.getElementById("lastName").value.trim();
        payload.Phone = document.getElementById("phone").value.trim();
    }

    console.log("Payload gửi đi:", payload);

    try {
        const result = await BookingAPI.createAppointment(payload);
        // Kiểm tra đúng cấu trúc ApiResponse của bạn
        if (result.success || result.data) {
            nextStep(4); 
        } else {
            alert(result.message || "Đặt lịch thất bại");
        }
    } catch (err) {
        console.error("Submit Error:", err);
        // Trả về message chi tiết từ server (Ví dụ: "VehicleId không tồn tại")
        alert("Lỗi từ hệ thống: " + err.message);
    }
}

// --- Helpers ---
function getUserId() {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const id = userInfo.userId || userInfo.id;
    return id ? parseInt(id) : null; // Trả về null nếu không tìm thấy
}

function formatCurrency(amount) {
    return (amount || 0).toLocaleString('vi-VN') + " VNĐ";
}