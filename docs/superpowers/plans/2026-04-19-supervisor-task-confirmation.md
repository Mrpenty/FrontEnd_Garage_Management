# Supervisor Task Confirmation in Workbay — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho supervisor xác nhận từng `serviceTask` và lập báo cáo phát sinh lỗi ngay trong modal "Chi tiết lệnh sửa chữa" của trang Workbay (khi `job.status === 7`), bằng cách tái dùng globals đã có của module `jobcard-repairation-main.js`.

**Architecture:** Chỉ chỉnh một file `workbay-main.js`. Import side-effect từ module repairation để đăng ký `window.handleTaskAction` và `window.openNewFaultPopup`. Thêm nhánh mới trong `handleActionZone` để render danh sách service/task + nút phát sinh khi status = 7. Mapping shape BE (`service.status`, `task.jobCardServiceTaskId`, `task.status`) sang tham số của `handleTaskAction`.

**Tech Stack:** Vanilla ES modules, Razor Pages hosting, Bootstrap + FontAwesome, SweetAlert2. Không có test framework JS — verify bằng cách chạy dev server và thao tác trên UI.

**File Structure:**
- Modify: `Garage_Management.UI/wwwroot/js/workbay/workbay-main.js`
  - Thêm import ở đầu file (kích hoạt globals từ repairation).
  - Thêm helper `renderRepairExecutionPanel(job)` render 2 khối UI (tasks + nút phát sinh).
  - Thêm nhánh `else if (job.status === 7)` trong `handleActionZone`.

Không tạo file mới, không đụng file khác, không đổi backend.

---

### Task 1: Import module repairation để đăng ký globals

**Files:**
- Modify: `Garage_Management.UI/wwwroot/js/workbay/workbay-main.js:1`

- [ ] **Step 1: Thêm import side-effect ở đầu file**

Ngay sau dòng import `workbayApi`, thêm import để module repairation tự chạy và đăng ký `window.handleTaskAction`, `window.openNewFaultPopup`, `window.addFaultItem`, `window.removeFaultItem`, `window.submitNewFaultUI`.

Hiện trạng:
```js
import { workbayApi } from './workbay-api.js';

let globalWorkbays = [];
```

Đổi thành:
```js
import { workbayApi } from './workbay-api.js';
import '../repairation/jobcard-repairation-main.js';

let globalWorkbays = [];
```

- [ ] **Step 2: Manual verify — mở DevTools kiểm tra globals đã được đăng ký**

Chạy app, mở trang `Pages/Dashboard/SupervisorDashboard.html`. Mở DevTools Console, gõ:

```
typeof window.handleTaskAction
typeof window.openNewFaultPopup
```

Expected: cả hai trả về `"function"`. Nếu trả `"undefined"` → import path sai hoặc module chưa load.

- [ ] **Step 3: Commit**

```bash
git add Garage_Management.UI/wwwroot/js/workbay/workbay-main.js
git commit -m "feat(workbay): import repairation module to expose task action globals"
```

---

### Task 2: Thêm helper render panel "Đang sửa chữa"

**Files:**
- Modify: `Garage_Management.UI/wwwroot/js/workbay/workbay-main.js` — thêm hàm helper mới, đặt ngay sau hàm `renderEstimateUI` (vào khoảng dòng 456).

- [ ] **Step 1: Thêm hàm `renderRepairExecutionPanel(job)`**

Chèn đoạn code sau vào ngay sau hàm `renderEstimateUI`:

```js
// Render panel "Đang sửa chữa" cho supervisor: danh sách task có thể xác nhận + nút báo cáo phát sinh.
// Dùng shape BE từ workbayApi.getJobCardDetail: service.status, service.jobCardServiceId,
// task.jobCardServiceTaskId, task.status, task.taskName.
function renderRepairExecutionPanel(job) {
    const isJobOnHold = job.status === 12;
    const services = Array.isArray(job.services) ? job.services : [];

    // Chỉ hiển thị service đang làm (2), đã xong (3), on hold (5).
    const visibleServices = services.filter(s => [2, 3, 5].includes(parseInt(s.status)));

    let servicesHtml = '';
    visibleServices.forEach(service => {
        const serviceStatus = parseInt(service.status);
        const isServiceOnHold = serviceStatus === 5;
        const isDisabled = isJobOnHold || isServiceOnHold;
        const tasks = Array.isArray(service.serviceTasks) ? service.serviceTasks : [];
        const estimateMin = service.totalEstimateMinute != null ? `${service.totalEstimateMinute}p` : '';
        const serviceNameSafe = (service.serviceName || '').replace(/'/g, "\\'");

        const lockBanner = isDisabled ? `
            <div style="background:#fff3cd; color:#856404; padding:8px; border-radius:4px; font-size:0.75rem; margin-bottom:8px; border:1px solid #ffeeba;">
                <i class="fa-solid fa-lock"></i> ${isJobOnHold ? 'Phiếu chờ duyệt phát sinh.' : 'Hạng mục đang tạm dừng.'} Không thể thao tác.
            </div>` : '';

        const tasksHtml = tasks.map(task => {
            const taskStatus = parseInt(task.status);
            let btnClass = taskStatus === 2 ? 'btn-secondary' : (taskStatus === 3 ? 'btn-secondary' : 'btn-outline-secondary');
            let btnText = taskStatus === 2 ? 'Đang làm...' : (taskStatus === 3 ? 'Đã xong' : 'Bắt đầu');
            let nextStatus = taskStatus === 2 ? 3 : (taskStatus === 3 ? 1 : 2);
            const taskNameSafe = (task.taskName || '').replace(/'/g, "\\'");

            return `
                <li style="font-size:0.85rem; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px; border-radius:4px; border:1px solid #eee;">
                    <span style="color:#444; font-weight:500;">${task.taskName || ''}</span>
                    <button class="${btnClass} task-action-btn"
                        ${isDisabled ? 'disabled' : ''}
                        onclick="window.handleTaskAction(${job.jobCardId}, ${task.jobCardServiceTaskId}, ${taskStatus}, ${nextStatus}, '${taskNameSafe}', ${job.status}, ${serviceStatus}, '')">
                        ${btnText}
                    </button>
                </li>`;
        }).join('');

        servicesHtml += `
            <div class="service-block" style="margin-bottom:15px; opacity:${isDisabled ? '0.6' : '1'};">
                <div style="font-weight:bold; color:#e63946; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:8px; display:flex; justify-content:space-between;">
                    <span><i class="fa-solid fa-wrench"></i> ${service.serviceName || ''}</span>
                    <span style="font-size:0.8rem; color:#888;">${estimateMin}</span>
                </div>
                ${lockBanner}
                <ul style="list-style:none; padding-left:5px; margin:0;">
                    ${tasksHtml}
                </ul>
            </div>`;
    });

    const emptyHtml = `<p style="font-size:0.9rem; color:#888;">Không có dịch vụ nào đang thực hiện.</p>`;

    return `
        <div style="border:2px dashed #4f46e5; border-radius:8px; padding:15px; background:#fafaff;">
            <div style="font-weight:bold; color:#4f46e5; margin-bottom:10px;">
                <i class="fa-solid fa-list-check"></i> HẠNG MỤC ĐANG THỰC HIỆN
            </div>
            ${servicesHtml || emptyHtml}
            <button class="btn-primary" style="width:100%; margin-top:10px; background:#be123c; border:none; padding:10px; border-radius:8px; color:#fff; font-weight:bold; cursor:pointer;"
                onclick="window.openNewFaultPopup(${job.jobCardId})">
                <i class="fa-solid fa-file-medical"></i> LẬP BÁO CÁO PHÁT SINH
            </button>
        </div>`;
}
```

- [ ] **Step 2: Manual verify — file không có syntax error**

Mở DevTools Console sau khi load trang. Expected: không có error đỏ. Nếu có `SyntaxError` → fix trước khi tiếp tục.

- [ ] **Step 3: Commit**

```bash
git add Garage_Management.UI/wwwroot/js/workbay/workbay-main.js
git commit -m "feat(workbay): add renderRepairExecutionPanel helper for status 7"
```

---

### Task 3: Thêm nhánh status 7 trong `handleActionZone`

**Files:**
- Modify: `Garage_Management.UI/wwwroot/js/workbay/workbay-main.js` — hàm `handleActionZone`, trước nhánh `else` cuối (khoảng dòng 513).

- [ ] **Step 1: Chèn nhánh `else if (job.status === 7)`**

Hiện trạng (khoảng dòng 499-515):
```js
    } else if  (job.status === 12) {
        actionZone.style.display = "block";
        actionZone.innerHTML = `
            <div style="text-align:center; padding:12px; border: 2px solid #be123c; background: #fff1f2; border-radius:8px;">
                <p style="margin-bottom:10px; font-weight:bold; color:#9f1239;">
                    <i class="fas fa-tools"></i> PHÁT SINH LỖI MỚI KHI ĐANG SỬA
                </p>
                <button class="btn-primary" onclick="window.approveExtraJob(${job.jobCardId})" 
                        style="width:100%; background:#be123c; height:50px; font-size:1.1rem; border:none;">
                    <i class="fas fa-paper-plane"></i> DUYỆT & GỬI BÁO GIÁ PHÁT SINH
                </button>
            </div>
        `;
    }
    else {
        actionZone.style.display = "none";
    }
```

Đổi thành (chèn thêm nhánh `status === 7` trước `else`):
```js
    } else if  (job.status === 12) {
        actionZone.style.display = "block";
        actionZone.innerHTML = `
            <div style="text-align:center; padding:12px; border: 2px solid #be123c; background: #fff1f2; border-radius:8px;">
                <p style="margin-bottom:10px; font-weight:bold; color:#9f1239;">
                    <i class="fas fa-tools"></i> PHÁT SINH LỖI MỚI KHI ĐANG SỬA
                </p>
                <button class="btn-primary" onclick="window.approveExtraJob(${job.jobCardId})" 
                        style="width:100%; background:#be123c; height:50px; font-size:1.1rem; border:none;">
                    <i class="fas fa-paper-plane"></i> DUYỆT & GỬI BÁO GIÁ PHÁT SINH
                </button>
            </div>
        `;
    } else if (job.status === 7) {
        actionZone.style.display = "block";
        actionZone.innerHTML = renderRepairExecutionPanel(job);
    }
    else {
        actionZone.style.display = "none";
    }
```

- [ ] **Step 2: Manual test — status 7 hiển thị đúng panel**

Chuẩn bị: có jobcard với `status === 7` và có ít nhất 1 service status 2 kèm vài task.

Steps:
1. Login supervisor, mở dashboard.
2. Bấm nút "Chi tiết" (`viewJobDetail`) trên một workbay có jobcard status 7.
3. Cuộn xuống `#jd-action-zone`.

Expected:
- Hiện khối "HẠNG MỤC ĐANG THỰC HIỆN".
- Mỗi service có danh sách task + nút ("Bắt đầu" / "Đang làm..." / "Đã xong") theo `task.status` = 1/2/3.
- Dưới cùng có nút đỏ "LẬP BÁO CÁO PHÁT SINH".
- Nếu có service status 5 → có banner vàng "Hạng mục đang tạm dừng" + các nút task của service đó disabled.

- [ ] **Step 3: Manual test — status khác không regression**

Mở thêm jobcard ở status 2 và 5:
- Status 2: hiện dropdown chọn mechanic + nút "GIAO VIỆC" (như cũ).
- Status 5: hiện nút "PHÊ DUYỆT LỆNH SỬA CHỮA" (như cũ).
- Status 12: hiện nút "DUYỆT & GỬI BÁO GIÁ PHÁT SINH" (như cũ).

Expected: hành vi không đổi so với trước.

- [ ] **Step 4: Commit**

```bash
git add Garage_Management.UI/wwwroot/js/workbay/workbay-main.js
git commit -m "feat(workbay): show repair task panel in detail modal when status=7"
```

---

### Task 4: Manual end-to-end test pipeline xác nhận task

**Files:** (no code change — chỉ test)

- [ ] **Step 1: Test xác nhận 1 task giữa chừng (progress < 100%)**

Chuẩn bị: jobcard status 7 với ≥ 2 task chưa hoàn thành.

Steps:
1. Supervisor mở modal chi tiết.
2. Bấm "Bắt đầu" ở 1 task status 1.
3. Bấm OK ở native `confirm(...)`.

Expected:
- Không có alert lỗi đỏ.
- Trang reload (modal đóng, dashboard refresh).
- Mở lại modal → task đó chuyển thành "Đang làm...".
- Jobcard vẫn ở status 7 (chưa 100%).

- [ ] **Step 2: Test xác nhận task cuối → finalizeRepair**

Chuẩn bị: jobcard status 7 chỉ còn **1 task cuối cùng** chưa "Đã xong".

Steps:
1. Supervisor mở modal, bấm chuyển task cuối sang "Đã xong".
2. Bấm OK ở `confirm(...)`.

Expected:
- SweetAlert hiện "Hoàn tất sửa chữa" với tổng tiền dịch vụ + linh kiện.
- Trang reload.
- Jobcard biến mất khỏi Workbay grid (đã release) hoặc hiển thị trạng thái "Chờ thanh toán" (status 8) nếu dashboard render status này.
- Kiểm tra BE: jobcard.status = 8, tất cả services.status = 3, workbay đã giải phóng, invoice đã tạo, mechanic status = 3.

- [ ] **Step 3: Test nút "LẬP BÁO CÁO PHÁT SINH"**

Steps:
1. Supervisor mở modal jobcard status 7, bấm nút đỏ "LẬP BÁO CÁO PHÁT SINH".
2. Popup SweetAlert mở. Nhập note, chọn 1 dịch vụ + 1 linh kiện.
3. Bấm "Gửi báo cáo".

Expected:
- Popup đóng, `alert("Hệ thống đã gửi báo cáo phát sinh...")`.
- Trang reload.
- Jobcard chuyển sang status 12 (Phát sinh lỗi) — hiển thị đúng badge ở workbay grid.
- Các service đang `status = 2` bị chuyển sang `status = 5` (on hold).
- Mở lại modal chi tiết, nhánh status 12 hiện nút "DUYỆT & GỬI BÁO GIÁ PHÁT SINH".

- [ ] **Step 4: Test guard — service on hold**

Chuẩn bị: jobcard status 7, có service status 5.

Steps:
1. Mở modal chi tiết.
2. Thử bấm vào nút task trong block service on hold.

Expected: Nút disabled (không click được), hoặc nếu click được thì SweetAlert hiện "Hạng mục này đang tạm dừng!".

- [ ] **Step 5: Kiểm tra quyền API (rủi ro đã flag)**

Trong các test ở Step 1-3, mở DevTools Network:
- Các request `PATCH /JobCards/{id}/progress-update`, `POST /RepairEstimates`, `POST /Invoices`, `POST /JobCards/release-workbay` phải trả 200/204.
- Nếu có 401/403 → BE chặn quyền supervisor, cần phối hợp mở role (ngoài scope task frontend này — báo lại để xử lý riêng).

- [ ] **Step 6: Final commit (chỉ tạo nếu còn thay đổi tồn đọng)**

Nếu các task trước đã commit đủ, bước này không tạo commit mới. Chỉ verify:

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

---

## Self-Review Checklist

- **Spec coverage**: mọi mục trong spec (import module, nhánh status 7, 2 khối UI, mapping field, rủi ro quyền API) đều có task tương ứng ở trên. ✓
- **Placeholder scan**: không có TBD/TODO/"fill in details". ✓
- **Type consistency**: các field BE shape (`job.jobCardId`, `service.status`, `task.jobCardServiceTaskId`, `task.status`, `task.taskName`, `service.serviceName`, `service.totalEstimateMinute`) dùng nhất quán ở Task 2 và Task 3. ✓
