    import { AppointmentAPI, BookingAPI, customerApi } from './booking-api.js';
    import { appointmentUI } from './appointment-ui.js';
    import { jobcardUI } from '../jobcard/jobcard-ui.js';

    function initModalEvents(elements) {
        // 1. Nút mở Modal Tạo JobCard
        elements.btnCreateJobCard?.addEventListener('click', async () => {
            elements.modalJobCard.style.display = "block";
            // ... (giữ nguyên logic reset và load dữ liệu của bạn)
        });

        // 2. Nút mở Modal Thêm khách hàng (MỚI)
        elements.btnOpenAddCustomer?.addEventListener('click', () => {
            elements.modalAddCustomer.style.display = "block";
        });

        // 3. Nút mở Modal Thêm xe (MỚI - logic check khách hàng đã có trong initVehicleLogic)
        // Lưu ý: Đảm bảo btnOpenAddVehicle đã được khai báo trong elements
        elements.btnOpenAddVehicle?.addEventListener('click', () => {
            if (!elements.selectedCustomerId.value) {
                return alert("Vui lòng chọn khách hàng trước!");
            }
            elements.modalAddVehicle.style.display = 'block';
        });

        // 4. Xử lý đóng tất cả các modal
        document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
            btn.onclick = (e) => {
                const m = e.target.closest('.modal');
                if (m) m.style.display = 'none';
            };
        });
    }

    export async function initAppointmentModule() {
        const mainContent = document.getElementById('main-display');
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
        // 1. Dọn dẹp và Render layout mới
        mainContent.innerHTML = ''; 
        appointmentUI.renderLayout(mainContent);
        let createdNewCustomerId = null;
        const bookingModal = document.getElementById('bookingModal');
        const addVehicleModal = document.getElementById('addVehicleModal');
        const bookingForm = document.getElementById('receptionistBookingForm');
        const addCustomerModal = document.getElementById('addCustomerModal');
        const tbody = document.getElementById('appointment-table-body');
        const createCustomerForm = document.getElementById('createCustomerForm');
        const searchInput = document.getElementById('searchAppointment');
        const statusFilter = document.getElementById('filterStatus');
        const dateFilter = document.getElementById('filterDate');
        const createVehicleForm = document.getElementById('createVehicleForm');

        initCustomerLogic(createCustomerForm);
        initVehicleLogic(createVehicleForm);
        // 2. Hàm tải dữ liệu
        async function fetchData() {
            try {
                const query = {
                    Search: searchInput.value,
                    Status: statusFilter.value,
                    Date: dateFilter.value,
                    Page: 1,
                    PageSize: 20
                };
                const res = await AppointmentAPI.getPaged(query);
                if (res.success) {
                    appointmentUI.renderTableRows(tbody, res.data.pageData);
                    bindRowEvents();
                }
            } catch (err) {
                console.error("Lỗi tải lịch hẹn:", err);
            }
        }

        // 3. Bắt sự kiện (Dùng trực tiếp để tránh lỗi null khi đổi trang)
        searchInput.oninput = debounce(() => fetchData(), 500);
        statusFilter.onchange = fetchData;
        dateFilter.onchange = fetchData;
        document.getElementById('btn-refresh-appointment').onclick = fetchData;

        // --- Logic Mở Modal & Load Data dự phòng ---
        document.getElementById('btn-open-booking').onclick = async () => {
            bookingModal.style.display = 'block';
            // Render khung giờ
            const timeSelect = document.getElementById('bookTimeSlot');
            timeSelect.innerHTML = '<option value="">-- Chọn khung giờ --</option>' + 
            TIME_SLOTS.map(slot => `<option value="${slot.value}">${slot.label}</option>`).join('');

            // Load Services
            const serviceRes = await BookingAPI.getServices();
            if(serviceRes.success) {
                const serviceSelect = document.getElementById('bookService');
                serviceSelect.innerHTML = serviceRes.data.pageData.map(s => 
                    `<option value="${s.serviceId}">${s.serviceName}</option>`).join('');
            }
        };

        document.getElementById('btnQuickAddVehicle').onclick = async () => {
            addVehicleModal.style.display = 'block';
        }

        // --- Logic Tìm kiếm khách hàng (Autocomplete) ---
        const bookSearchInput = document.getElementById('bookSearchCustomer');
        const bookCustomerId = document.getElementById('bookCustomerId');
        const bookCustomerResults = document.getElementById('bookCustomerResults');

        bookSearchInput.oninput = debounce(async (e) => {
            const val = e.target.value;
            if (val.length < 2) return bookCustomerResults.style.display = 'none';
            
            // Giả sử dùng chung API search của JobCard
            const res = await AppointmentAPI.getCustomer();
            
            jobcardUI.renderCustomerSearchResults(bookCustomerResults, res.data.pageData, async (id, name, phone) => {
                bookSearchInput.value = `${name} (${phone})`;
                bookCustomerId.value = id;
                bookCustomerResults.style.display = 'none';

                await loadVehiclesForCustomer(phone);
            });
        }, 400);

        async function loadVehiclesForCustomer(phone) {
            const vehicleSelect = document.getElementById('bookVehicle'); // Bạn cần thêm thẻ select này vào form
            const res = await AppointmentAPI.getVehiclesByCustomer(phone);
            
            if (res.success) {
                // KIỂM TRA ĐƯỜNG DẪN DỮ LIỆU
                // Có thể là res.data, hoặc res.data.pageData, hoặc chính là res.data
                const vehicles = res.data.pageData || res.data; 

                if (vehicles && vehicles.length > 0) {
                    vehicleSelect.innerHTML = vehicles.map(v => 
                        `<option value="${v.vehicleId}">${v.licensePlate} - ${v.brandName} ${v.modelName}</option>`
                    ).join('');
                } else {
                    vehicleSelect.innerHTML = `<option value="">Khách chưa có xe nào</option>`;
                }
            } else {
                vehicleSelect.innerHTML = `<option value="">Lỗi tải danh sách xe</option>`;
            }
        }

        //lưu khách mới
        function initCustomerLogic() {
            const customerForm = document.getElementById('createCustomerForm');
            const btnSubmit = document.getElementById('btnSubmitNewCustomer');
        
            customerForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fullName = document.getElementById('newCustomerName').value.trim();
                const nameParts = fullName.split(' ');
                const firstName = nameParts.length > 1 ? nameParts.pop() : fullName;
                const lastName = nameParts.join(' ') || "";
                // 1. Thu thập dữ liệu từ form
                const customerData = {
                    firstName: firstName,
                    lastName: lastName,
                    phoneNumber: document.getElementById('newCustomerPhone').value.trim(),
                    email: document.getElementById('newCustomerEmail').value.trim() || null,
                    address: document.getElementById('newCustomerAddress').value.trim() || null
                };
        
                try {
                    // Vô hiệu hóa nút để tránh double-click
                    btnSubmit.disabled = true;
                    btnSubmit.innerText = "Đang lưu...";
        
                    // 2. Gửi API
                    const res = await customerApi.createByReceptionist(customerData);
        
                    if (res.success) {
                        alert("Thêm khách hàng thành công!");
                        
                        
                        // Giả sử API trả về ID của khách hàng mới tạo trong res.data hoặc res.customerId
                        createdNewCustomerId = res.data?.customerId || res.data?.id;
                        // Điền luôn thông tin vào form booking cho lễ tân đỡ phải gõ lại
                        document.getElementById('bookSearchCustomer').value = `${customerData.firstName} (${customerData.phoneNumber})`;
                        document.getElementById('bookCustomerId').value = createdNewCustomerId;

                        addCustomerModal.style.display = 'none';
                        // Reset form
                        customerForm.reset();
                    } else {
                        alert("Lỗi: " + (res.message || "Không thể tạo khách hàng"));
                    }
                } catch (err) {
                    console.error("Lỗi khi thêm khách:", err);
                    alert("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.");
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerText = "Lưu Khách Hàng";
                }
            });
        }

        //Tao xe moi
        async function initVehicleLogic() {        
            const vehicleForm = document.getElementById('createVehicleForm');
            const brandSelect = document.getElementById('newVehicleBrand'); // Đảm bảo ID này đúng trong UI
            const modelSelect = document.getElementById('newVehicleModel');
            let allModels = [];
            try {
                // 1. Tải song song Brands và Models
                const [brandRes, modelRes] = await Promise.all([
                    BookingAPI.getBrands(), 
                    BookingAPI.getModels()
                ]);

                // 2. Đổ dữ liệu vào Brand Select
                if (brandRes.success) {
                    const brands = brandRes.data.pageData || brandRes.data;
                    brandSelect.innerHTML = '<option value="">-- Chọn Hãng Xe --</option>' + 
                        brands.map(b => `<option value="${b.brandId}">${b.brandName}</option>`).join('');
                }

                // 3. Lưu lại danh sách Models
                if (modelRes.success) {
                    allModels = modelRes.data.pageData || modelRes.data;
                }

                // 4. Logic Lọc Model theo Brand (Chạy ngay khi chọn Brand)
                brandSelect.onchange = () => {
                    const selectedBrandId = parseInt(brandSelect.value);
                    const filteredModels = allModels.filter(m => m.brandId === selectedBrandId);
                    
                    if (filteredModels.length > 0) {
                        modelSelect.innerHTML = '<option value="">-- Chọn Dòng Xe --</option>' + 
                            filteredModels.map(m => `<option value="${m.modelId}">${m.modelName}</option>`).join('');
                        modelSelect.disabled = false;
                    } else {
                        modelSelect.innerHTML = '<option value="">-- N/A --</option>';
                        modelSelect.disabled = true;
                    }
                };

            } catch (err) {
                console.error("Lỗi khi load danh sách hãng/dòng xe:", err);
            }
            // 5. Logic Submit tạo xe
            vehicleForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentCustomerId = document.getElementById('bookCustomerId').value;
                if (!currentCustomerId) {
                    return alert("Vui lòng chọn hoặc tạo khách hàng trước khi thêm xe!");
                }

                const payload = {
                    customerId: parseInt(currentCustomerId),
                    modelId: parseInt(modelSelect.value),
                    licensePlate: document.getElementById('newVehiclePlate').value.trim().toUpperCase(),
                    vin: document.getElementById('newVehicleVin')?.value.trim() || "N/A",
                    year: parseInt(document.getElementById('newVehicleYear').value) || new Date().getFullYear()
                };

                // Kiểm tra validation nhẹ
                if (!payload.modelId || !payload.licensePlate) {
                    return alert("Vui lòng nhập đầy đủ Hãng, Dòng xe và Biển số!");
                }

                try {
                    const res = await BookingAPI.create(payload); // Đảm bảo vehicleApi đã được import
                    console.log("Payload gửi đi:", payload);
                    if (res.success) {
                        alert("Thêm xe thành công!");
                        
                        // Đóng modal add vehicle
                        document.getElementById('addVehicleModal').style.display = 'none';
                        vehicleForm.reset();
                        modelSelect.disabled = true;

                        // Tự động load lại danh sách xe vào Form Đặt lịch để Lễ tân chọn luôn
                        const customerInfo = document.getElementById('bookSearchCustomer').value;
                        const phoneMatch = customerInfo.match(/\d+/);
                        if (phoneMatch) {
                            await loadVehiclesForCustomer(phoneMatch[0]);
                            // Tự động chọn cái xe vừa tạo (giả sử là xe mới nhất)
                            const bookVehicleSelect = document.getElementById('bookVehicle');
                            if (bookVehicleSelect) bookVehicleSelect.value = res.data.vehicleId;
                        }
                    }
                } catch (err) {
                    alert("Lỗi khi tạo xe: " + err.message);
                }
            });
        }

        // --- Logic Submit Form đặt lịch ---
        bookingForm.onsubmit = async (e) => {
            e.preventDefault();
            const date = document.getElementById('bookDate').value; // YYYY-MM-DD
            const time = document.getElementById('bookTimeSlot').value; // HH:mm
            const customerId = document.getElementById('bookCustomerId').value;
            if (!customerId) return alert("Vui lòng chọn khách hàng!");
            if (!date || !time) return alert("Vui lòng chọn thời gian!");
            const appointmentDateTime = `${date}T${time}:00`;
            const requestBody = {
                customerId: parseInt(customerId),
                appointmentDateTime: appointmentDateTime,
                vehicleId: parseInt(document.getElementById('bookVehicle').value) || null,
                vehicleModelId: null,
                serviceIds: Array.from(document.getElementById('bookService').selectedOptions).map(o => parseInt(o.value)),
                description: document.getElementById('bookDescription').value,
                status: 2 // Mặc định Đã xác nhận vì lễ tân đặt hộ
            };

            try {
                await BookingAPI.createAppointment(requestBody);
                alert("Đặt lịch thành công!");
                bookingModal.style.display = 'none';
                bookingForm.reset();
                fetchData();
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        };

        document.getElementById('btnQuickAddCustomer').onclick = () => {
        document.getElementById('addCustomerModal').style.display = 'block';
        };

        // Đóng modal
        document.getElementById('closeBookingModal').onclick = () => bookingModal.style.display = 'none';
        document.getElementById('btnCancelBooking').onclick = () => bookingModal.style.display = 'none';
        document.getElementById('btnCancelCustomer').onclick = () => addCustomerModal.style.display = 'none';
        document.querySelectorAll('.close-modal, .btn-cancel').forEach(btn => {
            btn.onclick = (e) => {
                const m = e.target.closest('.modal');
                if (m) m.style.display = 'none';
            };
        });
        fetchData();

        function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    function bindRowEvents() {
        // 1. Logic Duyệt lịch (Status 1 -> 2)
        document.querySelectorAll('.btn-confirm-apt').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                if (confirm("Bạn có chắc chắn muốn Duyệt lịch hẹn này không?")) {
                    try {
                        // Gọi API với status = 2 (Đã xác nhận)
                        const result = await AppointmentAPI.updateStatus(id, 2); 
                        if (result.success) {
                            console.log("Cập nhật thành công:", result.message);
                            fetchData(); // Load lại danh sách
                        } else {
                            alert("Lỗi từ server: " + (result.message || "Không xác định"));
                        }
                    } catch (err) {
                        console.error("Lỗi khi duyệt lịch:", err);
                        alert("Đã xảy ra lỗi, vui lòng thử lại!");
                    }
                }
            };
        });

        // 2. Logic Khách vắng mặt (Status 2 -> 4)
        document.querySelectorAll('.btn-noshow-apt').forEach(btn => {
            btn.onclick = async () => {
                const appointmentTimeStr = btn.closest('tr').querySelector('strong').innerText;
                const appointmentTime = new Date(btn.dataset.time);

                if (new Date() < appointmentTime) {
                    alert("Chưa đến giờ hẹn, bạn không thể đánh dấu Vắng mặt!");
                    return;
                }
                const id = btn.dataset.id;
                if (confirm("Đánh dấu khách hàng vắng mặt (No-show)?")) {
                    try {
                        const res = await AppointmentAPI.updateStatus(id, 4); // 4 = NoShow
                        if (res.success) {
                            fetchData();
                        } else {
                            alert(res.message || "Lỗi khi cập nhật trạng thái");
                        }
                    } catch (err) {
                        console.error("Lỗi cập nhật vắng mặt:", err);
                    }
                }
            };
        });
    }
}
    

    