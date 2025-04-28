// Logo Section Elements
const uploadLogo = document.getElementById('upload-logo');
const dropAreaLogo = document.getElementById('drop-area-logo');
const galleryLogo = document.getElementById('gallery-logo');
const processButtonLogo = document.getElementById('process-logo');
const restartButtonLogo = document.getElementById('restart-logo');
const downloadLinkLogo = document.getElementById('downloadLink-logo');
const spinnerLogo = document.getElementById('spinner-logo');

// Speaker Section Elements
const uploadSpeaker = document.getElementById('upload-speaker');
const dropAreaSpeaker = document.getElementById('drop-area-speaker');
const gallerySpeaker = document.getElementById('gallery-speaker');
const processButtonSpeaker = document.getElementById('process-speaker');
const restartButtonSpeaker = document.getElementById('restart-speaker');
const downloadLinkSpeaker = document.getElementById('downloadLink-speaker');
const spinnerSpeaker = document.getElementById('spinner-speaker');

// Modal and Cropping Elements
const editModal = document.getElementById('edit-modal');
const editCanvas = document.getElementById('edit-canvas');
const editCtx = editCanvas.getContext('2d');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const doneEditingButton = document.getElementById('done-editing');

// Toast
const toast = document.getElementById('toast');

// Canvas (hidden)
const mainCanvas = document.getElementById('canvas');
const mainCtx = mainCanvas.getContext('2d');

// Tabs
const logoTab = document.getElementById('logo-tab');
const speakerTab = document.getElementById('speaker-tab');
const logoArea = document.getElementById('logo-area');
const speakerArea = document.getElementById('speaker-area');

// Storage
let logoFiles = [];
let speakerFiles = [];
let speakerEditData = []; // store zoom and position per speaker

// Tab switching
logoTab.addEventListener('click', () => {
    logoTab.classList.add('active');
    speakerTab.classList.remove('active');
    logoArea.classList.add('active');
    speakerArea.classList.remove('active');
});

speakerTab.addEventListener('click', () => {
    speakerTab.classList.add('active');
    logoTab.classList.remove('active');
    speakerArea.classList.add('active');
    logoArea.classList.remove('active');
});

// ---------- LOGO MODE ----------

// Upload handlers
dropAreaLogo.addEventListener('click', () => uploadLogo.click());
dropAreaLogo.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropAreaLogo.classList.add('highlight');
});
dropAreaLogo.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropAreaLogo.classList.remove('highlight');
});
dropAreaLogo.addEventListener('drop', (e) => {
    e.preventDefault();
    dropAreaLogo.classList.remove('highlight');
    handleLogoFiles(e.dataTransfer.files);
});
uploadLogo.addEventListener('change', (e) => handleLogoFiles(e.target.files));

function handleLogoFiles(files) {
    if (files.length > 0) resetLogoUI();
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            logoFiles.push(file);
            displayLogoThumbnail(file);
        }
    }
}

function displayLogoThumbnail(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.innerHTML = `
            <img src="${e.target.result}" alt="Logo Thumbnail">
            <input type="checkbox" checked>
        `;
        galleryLogo.appendChild(thumb);
    };
    reader.readAsDataURL(file);
}

processButtonLogo.addEventListener('click', async () => {
    const thumbs = Array.from(galleryLogo.querySelectorAll('.thumb'));
    const selectedFiles = thumbs
        .map((thumb, index) => thumb.querySelector('input').checked ? logoFiles[index] : null)
        .filter(f => f);

    if (selectedFiles.length === 0) {
        alert("Please select at least one logo to process.");
        return;
    }

    processButtonLogo.disabled = true;
    restartButtonLogo.disabled = true;
    spinnerLogo.classList.remove('hidden');

    try {
        if (selectedFiles.length === 1) {
            const img = await loadImage(selectedFiles[0]);
            const processedImage = processLogo(img);
            const link = document.createElement('a');
            link.download = 'processed-logo.png';
            link.href = processedImage;
            link.click();
        } else {
            const zip = new JSZip();
            for (let i = 0; i < selectedFiles.length; i++) {
                const img = await loadImage(selectedFiles[i]);
                const processedImage = processLogo(img);
                const data = processedImage.split(',')[1];
                zip.file(`processed-logo-${i + 1}.png`, data, { base64: true });
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const zipLink = URL.createObjectURL(blob);
            downloadLinkLogo.href = zipLink;
            downloadLinkLogo.download = 'processed-logos.zip';
            downloadLinkLogo.style.display = 'inline-block';
            downloadLinkLogo.innerText = 'Download Logos';
        }
    } catch (error) {
        alert("Something went wrong while processing logos.");
    } finally {
        spinnerLogo.classList.add('hidden');
        processButtonLogo.disabled = false;
        restartButtonLogo.disabled = false;
        showToast();
    }
});

restartButtonLogo.addEventListener('click', () => {
    logoFiles = [];
    galleryLogo.innerHTML = '';
    resetLogoUI();
});

function resetLogoUI() {
    spinnerLogo.classList.add('hidden');
    downloadLinkLogo.style.display = 'none';
    toast.classList.add('hidden');
}

function processLogo(img) {
    mainCanvas.width = 350;
    mainCanvas.height = 200;
    const padding = 15;
    const maxWidth = mainCanvas.width - 2 * padding;
    const maxHeight = mainCanvas.height - 2 * padding;

    mainCtx.fillStyle = 'white';
    mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

    let width = img.width;
    let height = img.height;
    const aspectRatio = width / height;

    if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
    }
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }

    const x = (mainCanvas.width - width) / 2;
    const y = (mainCanvas.height - height) / 2;
    mainCtx.drawImage(img, x, y, width, height);

    return mainCanvas.toDataURL('image/png');
}

// ---------- SPEAKER MODE ----------

// Upload handlers
dropAreaSpeaker.addEventListener('click', () => uploadSpeaker.click());
dropAreaSpeaker.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropAreaSpeaker.classList.add('highlight');
});
dropAreaSpeaker.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropAreaSpeaker.classList.remove('highlight');
});
dropAreaSpeaker.addEventListener('drop', (e) => {
    e.preventDefault();
    dropAreaSpeaker.classList.remove('highlight');
    handleSpeakerFiles(e.dataTransfer.files);
});
uploadSpeaker.addEventListener('change', (e) => handleSpeakerFiles(e.target.files));

function handleSpeakerFiles(files) {
    if (files.length > 0) resetSpeakerUI();
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            speakerFiles.push(file);
            speakerEditData.push({ offsetX: 0, offsetY: 0, scale: 1 });
            displaySpeakerThumbnail(file, speakerFiles.length - 1);
        }
    }
}

function displaySpeakerThumbnail(file, index) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.innerHTML = `
            <img src="${e.target.result}" alt="Speaker Thumbnail">
            <input type="checkbox" checked>
            <button class="edit-button" data-index="${index}"><i class="fas fa-edit"></i></button>
        `;
        gallerySpeaker.appendChild(thumb);
        thumb.querySelector('.edit-button').addEventListener('click', () => openEditor(index));
    };
    reader.readAsDataURL(file);
}

// Editing logic
let currentEditIndex = null;
let imgToEdit = null;

function openEditor(index) {
    currentEditIndex = index;
    const reader = new FileReader();
    reader.onload = (e) => {
        imgToEdit = new Image();
        imgToEdit.onload = () => {
            drawEditCanvas();
            editModal.classList.remove('hidden');
        };
        imgToEdit.src = e.target.result;
    };
    reader.readAsDataURL(speakerFiles[index]);
}

function drawEditCanvas() {
    const { offsetX, offsetY, scale } = speakerEditData[currentEditIndex];
    editCtx.clearRect(0, 0, 591, 591);
    const scaledWidth = imgToEdit.width * scale;
    const scaledHeight = imgToEdit.height * scale;
    editCtx.fillStyle = "white";
    editCtx.fillRect(0, 0, 591, 591);
    editCtx.drawImage(imgToEdit, offsetX, offsetY, scaledWidth, scaledHeight);
}

// Drag to reposition
let isDragging = false;
let lastX = 0;
let lastY = 0;

editCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});
editCanvas.addEventListener('mouseup', () => isDragging = false);
editCanvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.offsetX - lastX;
    const dy = e.offsetY - lastY;
    speakerEditData[currentEditIndex].offsetX += dx;
    speakerEditData[currentEditIndex].offsetY += dy;
    lastX = e.offsetX;
    lastY = e.offsetY;
    drawEditCanvas();
});

// Zoom
zoomInButton.addEventListener('click', () => {
    speakerEditData[currentEditIndex].scale *= 1.1;
    drawEditCanvas();
});
zoomOutButton.addEventListener('click', () => {
    speakerEditData[currentEditIndex].scale /= 1.1;
    drawEditCanvas();
});

// Done Editing
doneEditingButton.addEventListener('click', () => {
    editModal.classList.add('hidden');
});

processButtonSpeaker.addEventListener('click', async () => {
    const thumbs = Array.from(gallerySpeaker.querySelectorAll('.thumb'));
    const selectedFiles = thumbs
        .map((thumb, index) => thumb.querySelector('input').checked ? speakerFiles[index] : null)
        .filter(f => f);

    if (selectedFiles.length === 0) {
        alert("Please select at least one speaker photo to process.");
        return;
    }

    processButtonSpeaker.disabled = true;
    restartButtonSpeaker.disabled = true;
    spinnerSpeaker.classList.remove('hidden');

    try {
        if (selectedFiles.length === 1) {
            const img = await loadImage(selectedFiles[0]);
            const processedImage = processSpeaker(img, speakerEditData[currentEditIndex]);
            const link = document.createElement('a');
            link.download = 'processed-speaker.png';
            link.href = processedImage;
            link.click();
        } else {
            const zip = new JSZip();
            for (let i = 0; i < selectedFiles.length; i++) {
                const img = await loadImage(selectedFiles[i]);
                const processedImage = processSpeaker(img, speakerEditData[i]);
                const data = processedImage.split(',')[1];
                zip.file(`processed-speaker-${i + 1}.png`, data, { base64: true });
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const zipLink = URL.createObjectURL(blob);
            downloadLinkSpeaker.href = zipLink;
            downloadLinkSpeaker.download = 'processed-speakers.zip';
            downloadLinkSpeaker.style.display = 'inline-block';
            downloadLinkSpeaker.innerText = 'Download Speakers';
        }
    } catch (error) {
        alert("Something went wrong while processing speaker photos.");
    } finally {
        spinnerSpeaker.classList.add('hidden');
        processButtonSpeaker.disabled = false;
        restartButtonSpeaker.disabled = false;
        showToast();
    }
});

restartButtonSpeaker.addEventListener('click', () => {
    speakerFiles = [];
    speakerEditData = [];
    gallerySpeaker.innerHTML = '';
    resetSpeakerUI();
});

function resetSpeakerUI() {
    spinnerSpeaker.classList.add('hidden');
    downloadLinkSpeaker.style.display = 'none';
    toast.classList.add('hidden');
}

function processSpeaker(img, { offsetX, offsetY, scale }) {
    mainCanvas.width = 591;
    mainCanvas.height = 591;
    mainCtx.fillStyle = 'white';
    mainCtx.fillRect(0, 0, 591, 591);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    mainCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    return mainCanvas.toDataURL('image/png');
}

// Utility
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
