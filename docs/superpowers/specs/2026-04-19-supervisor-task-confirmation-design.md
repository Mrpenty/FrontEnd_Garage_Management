# Supervisor xác nhận service task trong Workbay

## Mục tiêu

Cho phép supervisor xác nhận tiến độ từng `serviceTask` và lập báo cáo phát sinh lỗi trực tiếp trong modal "Chi tiết lệnh sửa chữa" của trang Workbay, dùng lại pipeline nghiệp vụ của trang mechanic (repairation) — nhằm giúp supervisor chốt task thay mechanic khi thợ "đang bẩn tay".

## Phạm vi

- **Thêm**: hiển thị danh sách service/task + nút xác nhận + nút "LẬP BÁO CÁO PHÁT SINH" trong modal workbay khi `job.status === 7` (Đang sửa chữa).
- **Không đổi**: hành vi ở các status khác (2 – giao thợ, 5 – duyệt kiểm tra, 12 – duyệt phát sinh).
- **Không tạo API mới**: tái dùng toàn bộ endpoint hiện có của module repairation.

## Thiết kế

### 1. Tái sử dụng module repairation

`workbay-main.js` import `jobcard-repairation-main.js` chỉ để kích hoạt side-effect gắn globals:

- `window.handleTaskAction` — xác nhận task; tự gọi `finalizeRepair` (tạo invoice, release workbay, status 8) khi progress = 100%.
- `window.openNewFaultPopup`, `window.addFaultItem`, `window.removeFaultItem` — popup báo cáo phát sinh.

Không duplicate code. Khi nghiệp vụ đổi, chỉ sửa một chỗ.

### 2. Nhánh mới trong `handleActionZone`

File: `Garage_Management.UI/wwwroot/js/workbay/workbay-main.js`, hàm `handleActionZone(job, actionZone, allWorkbays)`.

Thêm nhánh `else if (job.status === 7)` render 2 khối vào `#jd-action-zone`:

**Khối 1 — Danh sách hạng mục đang thực hiện**

- Lặp `job.services`, chỉ render service có `status` ∈ {2, 3, 5}.
- Mỗi service hiển thị: `serviceName` + `totalEstimateMinute` (fallback rỗng nếu BE không trả field này). Nếu `service.status === 5` (On Hold) → banner khoá + disable mọi nút task trong block.
- Mỗi task trong `service.serviceTasks`:
  - `task.status === 1` → button "Bắt đầu", `nextStatus = 2`.
  - `task.status === 2` → button "Đang làm...", `nextStatus = 3`.
  - `task.status === 3` → button "Đã xong", `nextStatus = 1` (cho phép đảo).
  - Nút gọi `window.handleTaskAction(jobCardId, task.jobCardServiceTaskId, task.status, nextStatus, task.taskName, job.status, service.status, '')`.

**Khối 2 — Nút báo cáo phát sinh**

Một nút full-width, style đỏ, gọi `window.openNewFaultPopup(job.jobCardId)`.

### 3. Mapping field shape

`workbayApi.getJobCardDetail` trả shape BE, khác shape của mechanic. Mapping khi pass vào `handleTaskAction`:

| Tham số `handleTaskAction` | Shape mechanic | Shape workbay (dùng) |
|---|---|---|
| `taskId` | `task.serviceTaskId` | `task.jobCardServiceTaskId` |
| `currentStatus` | `task.serviceTaskStatus` | `task.status` |
| `serviceStatus` | `service.serviceStatus` | `service.status` |
| `jobCardStatus` | `job.status` | `job.status` |
| `taskName` | `task.taskName` | `task.taskName` |

`handleTaskAction` tra theo `taskName` từ lần re-fetch `getJobCardDetails` nên không lệch data — các tham số khác chỉ dùng cho guard đầu hàm (chặn khi job/service on hold).

### 4. Refresh

`handleTaskAction` và `submitNewFault` hiện đã có `location.reload()` — modal đóng, dashboard load lại. Không thêm logic refresh.

### 5. Escape dữ liệu render

`taskName` và `serviceName` được nhúng vào attribute `onclick` → phải escape dấu nháy (`.replace(/'/g, "\\'")`) giống [jobcard-repairation-ui.js:62](Garage_Management.UI/wwwroot/js/repairation/jobcard-repairation-ui.js#L62).

## Rủi ro

- **Quyền API**: `updateProgress`, `updateMechanicStatus`, `createInvoice`, `releaseWorkbay` hiện mechanic gọi. Supervisor dùng cùng token — nếu BE check role chặt sẽ lỗi 403. Cần test; nếu chặn, mở role supervisor ở BE (không thuộc scope task này).
- **UX dialog**: `handleTaskAction` dùng `confirm()`/`alert()` native, khác SweetAlert của workbay. Chấp nhận sự khác biệt để giữ tái dùng code.

## Phạm vi loại trừ

- Không refactor `handleTaskAction` để đồng bộ dialog / refresh flow với workbay.
- Không đổi logic `finalizeRepair`.
- Không thêm nhánh cho status 12 trong UI mới (đã có nhánh cũ duyệt phát sinh).
