import CONFIG from '../config.js';

let bookingState = {
    brandId: null,
    modelId: null,
    vehicleId: null,
    services: [],
    parts: []
};

document.addEventListener("DOMContentLoaded", () => {
    loadVehicleBrands();
    document.getElementById("vehicleBrand")
        .addEventListener("change", function () {

        const brandId = this.value;

        if (!brandId) return;

        loadVehicleModels(brandId);
    });
});

async function loadServices() {
    const container = document.getElementById("service-list");

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/service?page=1&pageSize=20`);
        const data = await res.json();
        const services = data.data.items;

        if (!services || services.length === 0) {
            container.innerHTML = "<p>Không có dịch vụ khả dụng vào lúc này</p>";
            return;
        }

        container.innerHTML = services.map(s => `
            <div class="service-card">
                <input type="checkbox" value="${s.serviceId}" />
                <h4>${s.serviceName}</h4>
                <p>${formatCurrency(s.price)}</p>
                <small>${s.estimatedDuration} phút</small>
            </div>
        `).join("");

    } catch {
        container.innerHTML = "<p>Lỗi kết nối tới máy chủ</p>";
    }
}

async function loadVehicleBrands() {
    const select = document.getElementById("vehicleBrand");

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/VehicleBrands?page=1&pageSize=100`);
        const result = await res.json();

        const brands = result.data.items;

        if (!brands || brands.length === 0) {
            select.innerHTML = `<option>Không có hãng xe</option>`;
            return;
        }

        brands.forEach(brand => {
            select.innerHTML += `
                <option value="${brand.brandId}">
                    ${brand.brandName}
                </option>
            `;
        });

    } catch (error) {
        alert("Lỗi kết nối tới máy chủ");
    }
}

async function loadVehicleModels(brandId) {
    const select = document.getElementById("vehicleModel");
    select.innerHTML = `<option value="">-- Chọn loại xe --</option>`;
    select.disabled = true;

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/VehicleModels?page=1&pageSize=100`);
        const result = await res.json();

        const models = result.data.items
            .filter(m => m.brandId === parseInt(brandId));

        if (models.length === 0) {
            select.innerHTML = `<option>Không có loại xe</option>`;
            return;
        }

        models.forEach(model => {
            select.innerHTML += `
                <option value="${model.modelId}">
                    ${model.modelName}
                </option>
            `;
        });

        select.disabled = false;

    } catch {
        alert("Lỗi kết nối tới máy chủ");
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

    // TẠM thời vehicleId = modelId
    bookingState.vehicleId = bookingState.modelId;
    loadServices(); 
    nextStep(1);
}

function getUserId() {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    return userInfo.userId || 0;
}

function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + " VNĐ";
}


function nextStep(step) {

    // Validate chọn service
    if (step === 2) {
        const checked = [...document.querySelectorAll('#service-list input:checked')];

        if (checked.length === 0) {
            alert("Vui lòng chọn ít nhất 1 dịch vụ");
            return;
        }

        bookingState.services = checked.map(x => parseInt(x.value));
    }

    document.querySelectorAll('.step-content')
        .forEach(el => el.classList.remove('active'));

    document.querySelectorAll('.step')
        .forEach(el => el.classList.remove('active'));

    document.getElementById(`step-${step}`).classList.add('active');
    document.querySelector(`.step[data-step="${step}"]`)
        .classList.add('active');
}

document.getElementById("booking-form")
    .addEventListener("submit", async function (e) {

    e.preventDefault();

    const appointmentDateTime =
        document.getElementById("appointmentDateTime").value;

    if (!appointmentDateTime) {
        alert("Vui lòng nhập những thông tin còn thiếu");
        return;
    }

    const requestBody = {
        customerId: getUserId(),
        vehicleId: bookingState.vehicleId,
        createdBy: getUserId(),
        appointmentDateTime: new Date(appointmentDateTime).toISOString(),
        status: 1,
        description: document.getElementById("note").value
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Appointments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        nextStep(4);

    } catch (err) {
        alert(err.message);
    }
});
