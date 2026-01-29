// DOM Elements
const requestTableBody = document.getElementById('request-table-body');
const detailModal = document.getElementById('detail-modal');
const statsTotal = document.getElementById('stats-total');
const statsPending = document.getElementById('stats-pending');
const statsCompleted = document.getElementById('stats-completed');

// Modal Elements
const modalPhoto = document.getElementById('modal-photo');
const modalName = document.getElementById('modal-name');
const modalReason = document.getElementById('modal-reason');
const modalDate = document.getElementById('modal-date');
const modalStatus = document.getElementById('modal-status');

let currentRequestId = null;

// Initialize
function init() {
    renderTable();
    updateStats();
}

// Get Requests from LocalStorage
function getRequests() {
    const requests = localStorage.getItem('requests');
    return requests ? JSON.parse(requests) : [];
}

// Save Requests to LocalStorage
function saveRequests(requests) {
    localStorage.setItem('requests', JSON.stringify(requests));
    // Trigger storage event for cross-tab sync (if needed)
    window.dispatchEvent(new Event('storage'));
}

// Render Table
function renderTable() {
    const requests = getRequests();
    requestTableBody.innerHTML = '';

    requests.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest

    requests.forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(req.date)}</td>
            <td>Siripattra D.</td> <!-- Mock Name -->
            <td>${req.type}</td>
            <td><span class="status-badge status-${req.status.toLowerCase()}">${req.status}</span></td>
            <td>
                <button class="action-btn" onclick="openModal('${req.id}')">View</button>
            </td>
        `;
        requestTableBody.innerHTML += tr.outerHTML;
    });

    // Re-attach event listeners because innerHTML += breaks them
    // Actually, distinct onclick handlers in HTML are safer for simple usage here, 
    // but passing data via function arguments is easier.
}

// Update Stats
function updateStats() {
    const requests = getRequests();
    statsTotal.innerText = requests.length;
    statsPending.innerText = requests.filter(r => r.status === 'Pending').length;
    statsCompleted.innerText = requests.filter(r => ['Approved', 'Printed'].includes(r.status)).length;
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Open Modal
window.openModal = function (id) {
    const requests = getRequests();
    const req = requests.find(r => r.id == id); // Use ID

    if (!req) return;

    currentRequestId = id;

    modalPhoto.src = 'https://via.placeholder.com/300x400?text=User+Photo'; // Placeholder users didn't actually upload photos in the mockup yet
    modalName.innerText = "Siripattra D.";
    modalReason.innerText = req.type;
    modalDate.innerText = formatDate(req.date);
    modalStatus.innerText = req.status;

    // Show photo if available (mock logic, if we had real photos they would be dataURLs)
    // In a real app we'd display the captured image.

    detailModal.classList.add('active');
}

// Close Modal
window.closeModal = function () {
    detailModal.classList.remove('active');
    currentRequestId = null;
}

// Update Status
window.updateStatus = function (newStatus) {
    if (!currentRequestId) return;

    const requests = getRequests();
    const reqIndex = requests.findIndex(r => r.id == currentRequestId);

    if (reqIndex !== -1) {
        requests[reqIndex].status = newStatus;
        saveRequests(requests);
        renderTable();
        updateStats();
        closeModal();
    }
}

// Listen for storage changes (if user app adds a request in another tab)
window.addEventListener('storage', () => {
    renderTable();
    updateStats();
});

// Start
init();
