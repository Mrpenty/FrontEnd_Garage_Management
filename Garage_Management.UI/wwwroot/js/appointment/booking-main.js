import { BookingAPI } from './booking-api.js';
import { bookingUI } from './booking-ui.js';

const TIME_SLOTS = [
    { label: "07:30 - 09:00", value: "07:30" },
    { label: "09:00 - 10:30", value: "09:00" },
    { label: "10:30 - 12:00", value: "10:30" },
    { label: "13:00 - 14:30", value: "13:00" },
    { label: "14:30 - 16:00", value: "14:30" },
    { label: "16:00 - 17:30", value: "16:00" },
    { label: "17:30 - 19:00", value: "17:30" },
    { label: "20:00 - 21:30", value: "20:00" }
];

let selectedTime = null;

// --- State ---
let bookingState = {
    brandId: null,
    modelId: null,
    brandName: "",
    modelName: "",
    vehicleId: null,
    isNewVehicle: true,
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
    window.toggleVehicleSource = toggleVehicleSource;

    window.toggleCustomInput = function(type) {
        const select = document.getElementById(`vehicle${type}`);
        const input = document.getElementById(`custom${type}`);
        const isCustom = input.classList.contains('hidden');

        if (isCustom) {
            input.classList.remove('hidden');
            select.classList.add('hidden');
            if (type === 'Brand') {
                // Nếu hãng xe nhập tay, thì loại xe cũng phải cho nhập tay
                toggleCustomInput('Model');
            }
        } else {
            input.classList.add('hidden');
            select.classList.remove('hidden');
        }
    };
}

// --- Logic functions ---

async function loadInitialData() {
    const customerId = getCustomerId();
    const toggleArea = document.getElementById("vehicle-options-toggle");
    const myVehicleGroup = document.getElementById("my-vehicle-group");
    const newVehicleGroup = document.getElementById("new-vehicle-group");
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

    if (customerId) {
        toggleArea.style.display = "block";
        myVehicleGroup.style.display = "block";
        newVehicleGroup.style.display = "none";
        bookingState.isNewVehicle = false;
        try {
            const res = await BookingAPI.getUserVehicles();
           if (res.success && res.data) {
                const vehicleList = res.data.items || [];
                bookingUI.renderMyVehicles(vehicleList);
            }
        } catch (err) { console.error("Lỗi tải xe user:", err); }
    } else {
        // Khách vãng lai
        toggleArea.style.display = "none";
        myVehicleGroup.style.display = "none";
        newVehicleGroup.style.display = "block";
        bookingState.isNewVehicle = true;
    }

    // Khi khởi tạo Step 3, điền data user
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const formContainer = document.getElementById("booking-form");
    
    bookingUI.renderBookingForm(formContainer, userInfo);
    
    const slotContainer = document.getElementById("time-slots");
    bookingUI.renderTimeSlots(slotContainer, TIME_SLOTS);
}

function toggleVehicleSource(source) {
    const isMine = source === 'mine';
    bookingState.isNewVehicle = !isMine;
    
    document.getElementById("my-vehicle-group").style.display = isMine ? "block" : "none";
    document.getElementById("new-vehicle-group").style.display = isMine ? "none" : "block";
    
    document.getElementById("btn-my-vehicle").classList.toggle("active", isMine);
    document.getElementById("btn-new-vehicle").classList.toggle("active", !isMine);
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
    if (!bookingState.isNewVehicle) {
        // Lấy từ xe có sẵn
        const select = document.getElementById("myVehicles");
        const vehicleId = select.value;
        if (!vehicleId) return alert("Vui lòng chọn xe!");
        
        bookingState.vehicleId = parseInt(vehicleId);
        // Lưu brandName/modelName từ thuộc tính data- của option (nếu có) để BE hiển thị
        const selectedOption = select.options[select.selectedIndex];
        bookingState.brandId = parseInt(selectedOption.dataset.brandid);
        bookingState.brandName = selectedOption.dataset.brand;
        bookingState.modelName = selectedOption.dataset.model;
        bookingState.modelId = parseInt(selectedOption.dataset.modelid);
        bookingState.licensePlate = selectedOption.dataset.plate;
    } else {
        // Lấy từ form chọn hãng/loại
        const brandSelect = document.getElementById("vehicleBrand");
        const customBrandInput = document.getElementById("customBrand");
        if (!customBrandInput.classList.contains('hidden') && customBrandInput.value.trim() !== "") {
            bookingState.brandName = customBrandInput.value.trim();
            bookingState.brandId = 0; // 0 để BE biết đây là hãng mới
        } else if (brandSelect.value) {
            bookingState.brandName = brandSelect.options[brandSelect.selectedIndex].text;
            bookingState.brandId = parseInt(brandSelect.value);
        } else {
            return alert("Vui lòng chọn hoặc nhập hãng xe!");
        }

        const modelSelect = document.getElementById("vehicleModel");
        const customModelInput = document.getElementById("customModel");
        if (!customModelInput.classList.contains('hidden') && customModelInput.value.trim() !== "") {
            bookingState.modelName = customModelInput.value.trim();
            bookingState.modelId = 0;
        } else if (modelSelect.value) {
            bookingState.modelName = modelSelect.options[modelSelect.selectedIndex].text;
            bookingState.modelId = parseInt(modelSelect.value);
        } else {
            return alert("Vui lòng chọn hoặc nhập loại xe!");
        }

        bookingState.vehicleId = 0; // Hoặc null tùy BE
    }
    
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
    const isBookForOthers = document.getElementById("bookForOthers")?.checked || false;
    const date = document.getElementById("appointmentDate").value;
    const timeSlot = document.querySelector('input[name="time-slot"]:checked')?.value;
    const isLogged = !!getCustomerId();

    if (!date || !timeSlot) {
        alert("Vui lòng chọn đầy đủ ngày và giờ hẹn!");
        return;
    }

   // Xử lý thời gian chuẩn ISO
    const dateObj = new Date(`${date}T${timeSlot}:00`);

    // Tạo Payload với KEY viết hoa chữ cái đầu (PascalCase) để khớp tuyệt đối với C# DTO
    const payload = {
        AppointmentDateTime: dateObj.toISOString(),
        ServiceIds: (bookingState.services || []).map(id => Number(id)),
        SparePartsIds: (bookingState.parts || []).map(id => Number(id)),
        VehicleModelId: bookingState.modelId ? Number(bookingState.modelId) : null,
        CustomVehicleBrand: bookingState.brandName,
        CustomVehicleModel: bookingState.modelName,
        LicensePlate: document.getElementById("licensePlate").value.trim(),
        Description: document.getElementById("note").value.trim(),
        Status: 1
    };

    // --- Xử lý Logic Role theo đúng AppointmentService.cs ---
   if (isLogged && !isBookForOthers) {
        // TH1: Đăng nhập đặt cho mình
        payload.CustomerId = getCustomerId();
        payload.VehicleId = bookingState.vehicleId || null; 
        // BE yêu cầu CustomerId thì FirstName/LastName/Phone nên để null hoặc bỏ qua tùy DTO
        payload.FirstName = null;
        payload.LastName = null;
        payload.Phone = null;
    } 
    else if (isLogged && isBookForOthers) {
        // TH3: Đăng nhập nhưng đặt hộ bạn bè
        payload.CustomerId = null; // Gửi null để BE hiểu là khách mới
        payload.VehicleId = null;
        payload.FirstName = document.getElementById("firstName").value.trim();
        payload.LastName = document.getElementById("lastName").value.trim();
        payload.Phone = document.getElementById("phone").value.trim();
    }
    else {
        // TH4: Khách vãng lai (hoặc TH2 xe mới hoàn toàn)
        payload.CustomerId = null;
        payload.VehicleId = null;
        payload.FirstName = document.getElementById("firstName").value.trim();
        payload.LastName = document.getElementById("lastName").value.trim();
        payload.Phone = document.getElementById("phone").value.trim();
    }

    console.log("Payload gửi đi:", payload);

    try {
        const result = await BookingAPI.createAppointment(payload);
        if (result.success || result.data) {
            nextStep(4);
        } else {
            alert("Lỗi: " + (result.message || "Không thể đặt lịch"));
        }
    } catch (err) {
        alert("Lỗi hệ thống: " + err.message);
    }
}

// --- Helpers ---
function getCustomerId() {
    const id = localStorage.getItem("customerId");
    return id ? parseInt(id) : null;
}

function formatCurrency(amount) {
    return (amount || 0).toLocaleString('vi-VN') + " VNĐ";
}