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
let allServices = []; 
let allParts = [];
let currentServicePage = 1;
let currentPartPage = 1;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    loadInitialData();
});

function initEvents() {
    document.getElementById("vehicleBrand").addEventListener("change", handleBrandChange);
    document.getElementById("booking-form").addEventListener("submit", handleFormSubmit);
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
                // Náº¿u hÃ£ng xe nháº­p tay, thÃ¬ loáº¡i xe cÅ©ng pháº£i cho nháº­p tay
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
                const vehicleList = res.data.items || res.data.pageData || (Array.isArray(res.data) ? res.data : []);
                bookingUI.renderMyVehicles(vehicleList);
            }
        } catch (err) { console.error("Lá»—i táº£i xe user:", err); }
    } else {
        // KhÃ¡ch vÃ£ng lai
        toggleArea.style.display = "none";
        myVehicleGroup.style.display = "none";
        newVehicleGroup.style.display = "block";
        bookingState.isNewVehicle = true;
    }

    // Khi khá»Ÿi táº¡o Step 3, Ä‘iá»n data user
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const formContainer = document.getElementById("booking-form");
    
    bookingUI.renderBookingForm(formContainer, userInfo, bookingState);
    
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
        modelSelect.innerHTML = `<option value="">-- Chá»n loáº¡i xe --</option>`;
        modelSelect.disabled = true;
    }
}

async function loadServices() {
    const container = document.getElementById("service-list");
    container.innerHTML = "<p>Äang táº£i dá»‹ch vá»¥...</p>";
    try {
        const res = await BookingAPI.getServices();
        allServices = res.data?.pageData || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        
        currentServicePage = 1; // Reset vá» trang 1
        renderCurrentServicePage();
    } catch (err) {
        container.innerHTML = `<p class="error-msg">Lá»—i: ${err.message}</p>`;
    }
}

// HÃ m phá»¥ Ä‘á»ƒ render trang hiá»‡n táº¡i
function renderCurrentServicePage() {
    const container = document.getElementById("service-list");
    bookingUI.renderServiceList(container, allServices, formatCurrency, currentServicePage, 6);
    
    // Giá»¯ tráº¡ng thÃ¡i checkbox Ä‘Ã£ chá»n tá»« bookingState.services
    bookingState.services.forEach(id => {
        const chk = document.getElementById(`svc-${id}`);
        if (chk) chk.checked = true;
    });

    // Láº¯ng nghe sá»± thay Ä‘á»•i cá»§a checkbox Ä‘á»ƒ cáº­p nháº­t bookingState ngay láº­p tá»©c
    container.querySelectorAll('input[name="service-item"]').forEach(chk => {
        chk.addEventListener('change', (e) => {
            const id = parseInt(e.target.value);
            if (e.target.checked) {
                if (!bookingState.services.includes(id)) bookingState.services.push(id);
            } else {
                bookingState.services = bookingState.services.filter(sid => sid !== id);
            }
        });
    });
}

async function loadInventories() {
    const container = document.getElementById("part-list");
    if (!bookingState.brandId || bookingState.brandId === 0) {
        container.innerHTML = "<p class='info-msg'>HÃ£ng xe nÃ y hiá»‡n chÆ°a cÃ³ danh sÃ¡ch phá»¥ tÃ¹ng máº«u. Vui lÃ²ng ghi chÃº yÃªu cáº§u á»Ÿ bÆ°á»›c sau.</p>";
        allParts = []; // Reset danh sÃ¡ch
        return;
    }

    container.innerHTML = "<p class='loading-text'>Äang tÃ¬m phá»¥ tÃ¹ng phÃ¹ há»£p cho hÃ£ng xe...</p>";
    
    try {
        // Sá»­ dá»¥ng brandId Ä‘Ã£ lÆ°u á»Ÿ State tá»« BÆ°á»›c 0
        const res = await BookingAPI.getInventory();
        
        allParts = res.data?.pageData || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        currentPartPage = 1;
        bookingUI.renderPartList(container, allParts, formatCurrency, currentPartPage, 6);
    } catch (err) {
        console.error("Load parts error:", err);
        container.innerHTML = `<p class="error-msg">KhÃ´ng thá»ƒ táº£i danh sÃ¡ch phá»¥ kiá»‡n.</p>`;
    }
}

function handleVehicleStep() {
    if (!bookingState.isNewVehicle) {
        // Láº¥y tá»« xe cÃ³ sáºµn
        const select = document.getElementById("myVehicles");
        const vehicleId = select.value;
        if (!vehicleId) return alert("Vui lÃ²ng chá»n xe!");
        
        bookingState.vehicleId = parseInt(vehicleId);
        // LÆ°u brandName/modelName tá»« thuá»™c tÃ­nh data- cá»§a option (náº¿u cÃ³) Ä‘á»ƒ BE hiá»ƒn thá»‹
        const selectedOption = select.options[select.selectedIndex];
        bookingState.brandId = parseInt(selectedOption.dataset.brandid);
        bookingState.brandName = selectedOption.dataset.brand;
        bookingState.modelName = selectedOption.dataset.model;
        bookingState.modelId = parseInt(selectedOption.dataset.modelid);
        bookingState.licensePlate = selectedOption.dataset.plate;
    } else {
        // Láº¥y tá»« form chá»n hÃ£ng/loáº¡i
        const brandSelect = document.getElementById("vehicleBrand");
        const customBrandInput = document.getElementById("customBrand");
        if (!customBrandInput.classList.contains('hidden') && customBrandInput.value.trim() !== "") {
            bookingState.brandName = customBrandInput.value.trim();
            bookingState.brandId = 0; // 0 Ä‘á»ƒ BE biáº¿t Ä‘Ã¢y lÃ  hÃ£ng má»›i
        } else if (brandSelect.value) {
            bookingState.brandName = brandSelect.options[brandSelect.selectedIndex].text;
            bookingState.brandId = parseInt(brandSelect.value);
        } else {
            return alert("Vui lÃ²ng chá»n hoáº·c nháº­p hÃ£ng xe!");
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
            return alert("Vui lÃ²ng chá»n hoáº·c nháº­p loáº¡i xe!");
        }

        bookingState.vehicleId = 0; // Hoáº·c null tÃ¹y BE
    }
    
    loadServices();
    nextStep(1);
}

function nextStep(step) {
    if (step === 2) {
        // Kiá»ƒm tra dá»‹ch vá»¥ trÆ°á»›c khi sang bÆ°á»›c phá»¥ kiá»‡n
        const checked = [...document.querySelectorAll('input[name="service-item"]:checked')];
        if (checked.length === 0) {
            alert("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t dá»‹ch vá»¥ Ä‘á»ƒ tiáº¿p tá»¥c");
            return;
        }
        bookingState.services = checked.map(input => parseInt(input.value));
        // Gá»i hÃ m load phá»¥ tÃ¹ng
        loadInventories();
    }

    if (step === 3) {
        const checkedParts = [...document.querySelectorAll('input[name="part-item"]:checked')];
        bookingState.parts = checkedParts.map(input => parseInt(input.value));

        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const formContainer = document.getElementById("booking-form");
        
        // TRUYá»€N THÃŠM bookingState VÃ€O ÄÃ‚Y
        bookingUI.renderBookingForm(formContainer, userInfo, bookingState); 
        setupStep3Events();
        const slotContainer = document.getElementById("time-slots");
        bookingUI.renderTimeSlots(slotContainer, TIME_SLOTS);
    }

    bookingUI.showStepContent(step);
    bookingUI.updateStepBar(step);
}

function setupStep3Events() {
        const chkOthers = document.getElementById("bookForOthers");
        const plateInput = document.getElementById("licensePlate");
        const noteArea = document.getElementById("note");

        if (chkOthers) {
            chkOthers.addEventListener("change", (e) => {
                if (!e.target.checked) {
                    // --- YÃŠU Cáº¦U 3: KhÃ´i phá»¥c láº¡i biá»ƒn sá»‘ náº¿u bá» tÃ­ch Ä‘áº·t há»™ ---
                    if (bookingState.licensePlate) {
                        plateInput.value = bookingState.licensePlate;
                        plateInput.readOnly = true; 
                    }
                } else {
                    // Náº¿u Ä‘áº·t há»™ thÃ¬ cho phÃ©p nháº­p má»›i
                    plateInput.value = "";
                    plateInput.readOnly = false;
                }
            });
        }

        // --- YÃŠU Cáº¦U 5: Max Length cho Textarea ---
        if (noteArea) {
            noteArea.setAttribute("maxlength", "500");
        }
    }

async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    const isBookForOthers = document.getElementById("bookForOthers")?.checked || false;
    const date = document.getElementById("appointmentDate").value;
    const timeSlot = document.querySelector('input[name="time-slot"]:checked')?.value;
    const isLogged = !!getCustomerId();
    const rawLicensePlate = document.getElementById("licensePlate").value.trim();
    const noteArea = document.getElementById("note");
    const plateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{3}\.[0-9]{2}$/;
    if (date) {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert("NgÃ y háº¹n khÃ´ng Ä‘Æ°á»£c trong quÃ¡ khá»©!");
            return;
        }
    }

    if (!date || !timeSlot) {
        alert("Vui lÃ²ng chá»n Ä‘áº§y Ä‘á»§ ngÃ y vÃ  giá» háº¹n!");
        return;
    }

    if (rawLicensePlate.length > 11) {
        alert("Biá»ƒn sá»‘ xe khÃ´ng Ä‘Æ°á»£c quÃ¡ 11 kÃ½ tá»±!");
        document.getElementById("licensePlate").focus();
        return;
    }

    if (rawLicensePlate.length < 4) { // Validate tá»‘i thiá»ƒu náº¿u cáº§n
        alert("Biá»ƒn sá»‘ xe khÃ´ng há»£p lá»‡!");
        return;
    }

    if (!plateRegex.test(rawLicensePlate)) {
        alert("Biá»ƒn sá»‘ xe khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng! (VÃ­ dá»¥ Ä‘Ãºng: 29BF-009.09)");
        document.getElementById("licensePlate").focus();
        return;
    }

    const cleanLicensePlate = rawLicensePlate;
    const branchId = Number(localStorage.getItem("branchId"));
    if (!Number.isFinite(branchId) || branchId <= 0) {
        alert("Thiếu thông tin chi nhánh (branchId). Vui lòng đăng nhập lại.");
        return;
    }
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Äang xá»­ lÃ½...';

    // Táº¡o Payload vá»›i KEY viáº¿t hoa chá»¯ cÃ¡i Ä‘áº§u (PascalCase) Ä‘á»ƒ khá»›p tuyá»‡t Ä‘á»‘i vá»›i C# DTO
    const payload = {
        AppointmentDateTime: `${date}T${timeSlot}:00`,
        ServiceIds: (bookingState.services || []).map(id => Number(id)),
        SparePartsIds: (bookingState.parts || []).map(id => Number(id)),
        VehicleModelId: bookingState.modelId ? Number(bookingState.modelId) : null,
        CustomVehicleBrand: bookingState.brandName,
        CustomVehicleModel: bookingState.modelName,
        LicensePlate: cleanLicensePlate,
        Description: noteArea.value.trim().substring(0, 500),
        Status: 1,
        BranchId: branchId
    };

    // --- Xá»­ lÃ½ Logic Role theo Ä‘Ãºng AppointmentService.cs ---
   if (isLogged && !isBookForOthers) {
        // TH1: ÄÄƒng nháº­p Ä‘áº·t cho mÃ¬nh
        payload.CustomerId = getCustomerId();
        payload.VehicleId = bookingState.vehicleId || null; 
        payload.FirstName = null;
        payload.LastName = null;
        payload.Phone = null;
        payload.LicensePlate = null;
        payload.VehicleModelId = null;
        payload.CustomVehicleBrand = null;
        payload.CustomVehicleModel = null;
    } 
    else if (isLogged && isBookForOthers) {
        // TH3: ÄÄƒng nháº­p nhÆ°ng Ä‘áº·t há»™ báº¡n bÃ¨
        payload.CustomerId = null; // Gá»­i null Ä‘á»ƒ BE hiá»ƒu lÃ  khÃ¡ch má»›i
        payload.VehicleId = null;
        payload.CustomVehicleBrand = null;
        payload.CustomVehicleModel = null;
        payload.FirstName = document.getElementById("firstName").value.trim();
        payload.LastName = document.getElementById("lastName").value.trim();
        payload.Phone = document.getElementById("phone").value.trim();
    }
    else {
        // TH4: KhÃ¡ch vÃ£ng lai (hoáº·c TH2 xe má»›i hoÃ n toÃ n)
        payload.CustomerId = null;
        payload.VehicleId = null;
        payload.FirstName = document.getElementById("firstName").value.trim();
        payload.LastName = document.getElementById("lastName").value.trim();
        payload.Phone = document.getElementById("phone").value.trim();
        payload.CustomVehicleBrand = null;
        payload.CustomVehicleModel = null;
    }

    console.log("Payload gá»­i Ä‘i:", payload);

    try {
        const result = await BookingAPI.createAppointment(payload);
        if (result.success || result.data) {
            nextStep(4);
        } else {
            alert("Lá»—i: " + (result.message || "KhÃ´ng thá»ƒ Ä‘áº·t lá»‹ch"));
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    } catch (err) {
        alert("Lá»—i há»‡ thá»‘ng: " + err.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// --- Helpers ---
function getCustomerId() {
    const id = localStorage.getItem("customerId");
    return id ? parseInt(id) : null;
}

function formatCurrency(amount) {
    return (amount || 0).toLocaleString('vi-VN') + " VNÄ";
}

// HÃ m chuyá»ƒn trang cho Dá»‹ch vá»¥
window.changeServicePage = function(page) {
    currentServicePage = page;
    const container = document.getElementById("service-list");
    bookingUI.renderServiceList(container, allServices, formatCurrency, currentServicePage, 6);
    // Cuá»™n nháº¹ lÃªn Ä‘áº§u danh sÃ¡ch
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// HÃ m chuyá»ƒn trang cho Phá»¥ tÃ¹ng
window.changePartPage = function(page) {
    currentPartPage = page;
    const container = document.getElementById("part-list"); // hoáº·c ID container phá»¥ tÃ¹ng cá»§a báº¡n
    bookingUI.renderPartList(container, allParts, formatCurrency, currentPartPage, 6);
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.renderCurrentServicePage = renderCurrentServicePage;

window.handlePartClick = (cardEl, partId) => {
    const chk = cardEl.querySelector('input');
    chk.checked = !chk.checked;
    
    // Cáº­p nháº­t vÃ o bookingState
    if (!bookingState.parts) bookingState.parts = [];
    
    if (chk.checked) {
        if (!bookingState.parts.includes(partId)) {
            bookingState.parts.push(partId);
        }
    } else {
        bookingState.parts = bookingState.parts.filter(id => id !== partId);
    }
};

