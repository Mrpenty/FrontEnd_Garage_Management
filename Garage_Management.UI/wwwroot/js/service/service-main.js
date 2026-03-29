import CONFIG from '../config.js';

const SERVICE_API = `${CONFIG.API_BASE_URL}/Services`;
const TASK_API = `${CONFIG.API_BASE_URL}/ServiceTasks`;

document.addEventListener('DOMContentLoaded', () => {
    loadServices();

    // Xử lý tạo Service mới
    document.getElementById('service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            serviceName: e.target.serviceName.value,
            description: e.target.description.value
        };
        
        const res = await fetch(SERVICE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Đã tạo dịch vụ thành công!");
            closeModals();
            loadServices();
        }
    });

    // Xử lý tạo Task mới
    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('editing-task-id').value;
        const serviceId = parseInt(document.getElementById('current-service-id').value);

        const payload = {
            serviceId: serviceId,
            taskName: document.getElementById('taskName').value,
            taskOrder: parseInt(document.getElementById('taskOrder').value),
            estimateMinute: parseInt(document.getElementById('estimateMinute').value),
            note: document.getElementById('taskNote').value
        };

        let url = TASK_API;
        let method = 'POST';

        // Nếu có taskId -> Chuyển sang chế độ UPDATE (PUT)
        if (taskId) {
            url = `${TASK_API}/${taskId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(taskId ? "Cập nhật Task thành công!" : "Thêm Task thành công!");
            resetTaskForm();
            viewTasks(serviceId); // Load lại danh sách task trong modal
            loadServices(); // Load lại bảng chính để cập nhật tổng thời gian
        }
    });
});

async function loadServices() {
    const res = await fetch(`${SERVICE_API}?page=1&pageSize=20`);
    const result = await res.json();
    const services = result.data.pageData;

    const body = document.getElementById('service-table-body');
    body.innerHTML = services.map(s => `
        <tr>
            <td>#${s.serviceId}</td>
            <td><strong>${s.serviceName}</strong></td>
            <td><small>${s.description || ''}</small></td>
            <td><i class="far fa-clock"></i> ${s.totalEstimateMinute} phút</td>
            <td><span class="badge-count">${s.serviceTasks.length} Task</span></td>
            <td>
                <button class="btn-secondary" onclick="window.viewTasks(${s.serviceId})">
                    <i class="fas fa-list-check"></i> Quản lý Task
                </button>
            </td>
        </tr>
    `).join('');
}

window.viewTasks = async (serviceId) => {
    const res = await fetch(`${SERVICE_API}?page=1&pageSize=100`);
    const result = await res.json();
    const service = result.data.pageData.find(s => s.serviceId === serviceId);

    document.getElementById('current-service-id').value = serviceId;
    document.getElementById('task-modal-title').innerText = `Quy trình: ${service.serviceName}`;
    
    const container = document.getElementById('task-list-container');
    container.innerHTML = service.serviceTasks.sort((a,b) => a.taskOrder - b.taskOrder).map(t => `
        <div class="task-item-row">
            <span class="t-order">${t.taskOrder}.</span>
            <div class="t-content">
                <span class="t-name">${t.taskName}</span>
                <span class="t-note">${t.note ? `- ${t.note}` : ''}</span>
            </div>
            <span class="t-time">${t.estimateMinute}p</span>
            <div class="t-actions">
                <button class="btn-edit-small" onclick="prepareEditTask(${t.serviceTaskId}, '${t.taskName}', ${t.taskOrder}, ${t.estimateMinute}, '${t.note || ''}')">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('task-modal').style.display = 'block';
}


// Hàm đưa dữ liệu Task lên Form để sửa
window.prepareEditTask = (taskId, name, order, minute, note) => {
    document.getElementById('editing-task-id').value = taskId;
    document.getElementById('taskName').value = name;
    document.getElementById('taskOrder').value = order;
    document.getElementById('estimateMinute').value = minute;
    document.getElementById('taskNote').value = note || '';

    // Đổi giao diện form sang trạng thái Edit
    document.getElementById('editor-title').innerText = "Chỉnh sửa bước thực hiện";
    document.getElementById('btn-save-task').innerHTML = '<i class="fas fa-save"></i> Lưu cập nhật';
    document.getElementById('btn-save-task').style.background = '#f59e0b'; // Đổi sang màu cam
    document.getElementById('btn-cancel-edit').style.display = 'inline-block';
};

// Hàm reset Form về trạng thái Add ban đầu
window.resetTaskForm = () => {
    document.getElementById('task-form').reset();
    document.getElementById('editing-task-id').value = "";
    document.getElementById('editor-title').innerText = "Thêm bước (Task) mới";
    document.getElementById('btn-save-task').innerHTML = '<i class="fas fa-plus"></i> Thêm Task';
    document.getElementById('btn-save-task').style.background = '#4f46e5';
    document.getElementById('btn-cancel-edit').style.display = 'none';
};


window.showAddServiceModal = () => document.getElementById('service-modal').style.display = 'block';
window.closeModals = () => {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}