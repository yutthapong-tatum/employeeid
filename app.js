// MOCK DATA
// MOCK DATA & STORAGE
const DEFAULT_REQUESTS = [
    { id: 1, type: 'Lost Card', date: '2023-10-15', status: 'Completed', statusClass: 'completed' },
    { id: 2, type: 'Card Damaged / Expired', date: '2023-12-01', status: 'Pending', statusClass: 'pending' }
];

let requests = JSON.parse(localStorage.getItem('requests')) || DEFAULT_REQUESTS;

// Save defaults immediately if empty (optional, but good for demo)
if (!localStorage.getItem('requests')) {
    localStorage.setItem('requests', JSON.stringify(requests));
}

// STATE
let currentPhoto = null;
let stream = null;
let canvas = document.getElementById('photo-canvas');
let ctx = canvas.getContext('2d');
let photoImage = new Image();

// DOM ELEMENTS
const views = {
    dashboard: document.getElementById('view-dashboard'),
    reason: document.getElementById('view-reason'),
    guidelines: document.getElementById('view-guidelines'),
    camera: document.getElementById('view-camera'),
    editor: document.getElementById('view-editor'),
    address: document.getElementById('view-address'),
    success: document.getElementById('view-success')
};

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    renderRequestList();
    setupNavigation();
    setupCamera();
    setupEditor();
});

// NAVIGATION
function switchView(viewName) {
    Object.values(views).forEach(el => el.classList.remove('active'));
    views[viewName].classList.add('active');

    // Header logic: Only show on dashboard
    const header = document.getElementById('main-header');
    if (viewName === 'dashboard') {
        header.style.display = 'block';
    } else {
        header.style.display = 'none';
    }
}


function setupNavigation() {
    // Start flow: Dashboard -> Reason
    document.getElementById('btn-new-request').onclick = () => switchView('reason');

    // Reason logic
    const reasonSelect = document.getElementById('reason-select');
    const uploadSection = document.getElementById('upload-section');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('file-drop-zone');
    const fileName = document.getElementById('file-name');

    reasonSelect.onchange = () => {
        if (reasonSelect.value === 'Lost') {
            uploadSection.classList.remove('hidden');
        } else {
            uploadSection.classList.add('hidden');
        }
    };

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = () => {
        if (fileInput.files.length > 0) {
            fileName.innerText = fileInput.files[0].name;
            dropZone.style.borderColor = 'var(--success)';
        }
    };

    // Reason -> Guidelines
    document.getElementById('btn-reason-next').onclick = () => {
        if (reasonSelect.value === 'Lost' && fileInput.files.length === 0) {
            alert('Please upload a police report document.');
            return;
        }
        switchView('guidelines');
    };

    document.getElementById('btn-start-camera').onclick = () => startCameraFlow();

    // Back buttons
    document.querySelectorAll('.btn-back-dashboard').forEach(btn => {
        btn.onclick = () => switchView('dashboard');
    });
    document.querySelector('.btn-back-editor').onclick = () => switchView('editor');

    // Home button
    document.getElementById('btn-home').onclick = () => switchView('dashboard');
}

// DASHBOARD LOGIC
function renderRequestList() {
    const list = document.getElementById('request-list');
    list.innerHTML = '';

    // Sort logic (newest first) could go here
    const sorted = [...requests].reverse();

    sorted.forEach(req => {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML = `
            <div class="req-info">
                <h4>${req.type}</h4>
                <span class="req-date">${req.date}</span>
            </div>
            <div class="status-badge ${req.statusClass}">${req.status}</div>
        `;
        list.appendChild(card);
    });
}

// CAMERA LOGIC
async function startCameraFlow() {
    switchView('camera');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        document.getElementById('camera-feed').srcObject = stream;
    } catch (e) {
        alert("Camera access denied or not available.");
        switchView('dashboard');
    }
}

function setupCamera() {
    document.querySelector('.btn-cancel-camera').onclick = () => {
        stopCamera();
        switchView('dashboard');
    };

    document.getElementById('btn-capture').onclick = () => {
        const countDisplay = document.getElementById('countdown-display');
        countDisplay.classList.remove('hidden');
        let count = 5;
        countDisplay.innerText = count;

        const timer = setInterval(() => {
            count--;
            countDisplay.innerText = count;
            if (count === 0) {
                clearInterval(timer);
                countDisplay.classList.add('hidden');
                capturePhoto();
            }
        }, 1000); // 5 seconds
    };
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-feed');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    currentPhoto = canvas.toDataURL('image/png');
    photoImage.src = currentPhoto;

    stopCamera();
    switchView('editor');

    // Initialize Editor state
    photoImage.onload = () => drawEditor();
}

// EDITOR LOGIC
let zoom = 1;
let brightness = 100;
let bgRemoved = false;

function setupEditor() {
    document.getElementById('zoom-slider').addEventListener('input', (e) => {
        zoom = e.target.value;
        drawEditor();
    });

    document.getElementById('brightness-slider').addEventListener('input', (e) => {
        brightness = e.target.value;
        drawEditor();
    });

    document.getElementById('btn-remove-bg').onclick = () => {
        bgRemoved = !bgRemoved;
        drawEditor();
    };

    document.getElementById('btn-retake').onclick = () => startCameraFlow();
    document.getElementById('btn-confirm-photo').onclick = () => switchView('address');
}

function drawEditor() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${brightness}%)`;

    ctx.save();

    // Scale from center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    if (bgRemoved) {
        // Simple mock for bg removal: just draw (in real app, use AI model)
        // Check if we can simulate by masking? For now, we will just apply a white scrim
        // Actually, let's just draw the image normally but maybe change background color of container?
        // Since it's a mock, we'll just toggle a class on wrapper
    }

    ctx.drawImage(photoImage, 0, 0);
    ctx.restore();

    // Reset filter for other drawings
    ctx.filter = 'none';
}

// ADDRESS & SUBMIT LOGIC
const addressForm = document.getElementById('address-form');
document.getElementById('btn-add-address').onclick = () => {
    document.getElementById('new-address-input').classList.remove('hidden');
    // Deselect radio buttons to indicate new address flow? 
    // Or just let user type. 
};

addressForm.onsubmit = (e) => {
    e.preventDefault();

    // Simulate API Call
    setTimeout(() => {
        // Get Reason Text
        const reasonSelect = document.getElementById('reason-select');
        const reasonText = reasonSelect.options[reasonSelect.selectedIndex].text;

        // Add new request to history
        const newReq = {
            id: Date.now(),
            type: reasonText, // Use the selected reason
            date: new Date().toISOString().split('T')[0],
            status: 'Waiting for HR Approval',
            statusClass: 'waiting'
        };

        requests.push(newReq);

        // SAVE TO LOCAL STORAGE
        localStorage.setItem('requests', JSON.stringify(requests));

        renderRequestList();

        switchView('success');
    }, 1000);
};
