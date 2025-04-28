// Tabs Switching
const logoTab = document.getElementById('logo-tab');
const speakerTab = document.getElementById('speaker-tab');
const logoArea = document.getElementById('logo-area');
const speakerArea = document.getElementById('speaker-area');

logoTab.addEventListener('click', () => {
    logoTab.classList.add('active');
    speakerTab.classList.remove('active');
    logoArea.classList.add('active-area');
    logoArea.classList.remove('hidden-area');
    speakerArea.classList.remove('active-area');
    speakerArea.classList.add('hidden-area');
});

speakerTab.addEventListener('click', () => {
    speakerTab.classList.add('active');
    logoTab.classList.remove('active');
    speakerArea.classList.add('active-area');
    speakerArea.classList.remove('hidden-area');
    logoArea.classList.remove('active-area');
    logoArea.classList.add('hidden-area');
});

// Common Elements
const toast = document.getElementById('toast');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Logo Elements
const uploadLogo = document.getElementById('upload-logo');
const dropAreaLogo = document.getElementById('drop-area-logo');
const galleryLogo = document.getElementById('gallery-logo');
const processButtonLogo = document.getElementById('process-logo');
const restartButtonLogo = document.getElementById('restart-logo');
const downloadLinkLogo = document.getElementById('downloadLink-logo');
const spinnerLogo = document.getElementById('spinner-logo');

let logoFiles = [];

// Speaker Elements
const uploadSpeaker = document.getElementById('upload-speaker');
const dropAreaSpeaker = document.getElementById('drop-area-speaker');
const gallerySpeaker = document.getElementById('gallery-speaker');
const processButtonSpeaker = document.getElementById('process-speaker');
const restartButtonSpeaker = document.getElementById('restart-speaker');
const downloadLinkSpeaker = document.getElementById('downloadLink-speaker');
const spinnerSpeaker = document.getElementById('spinner-speaker');

let speakerFiles = [];
let speakerEditData = [];
let speakerThumbnails = [];
let currentEditIndex = null;
let imgToEdit = null;

// Logo Upload
dropAreaLogo.addEventListener('click', () => uploadLogo.click());
dropAreaLogo.addEventListener('dragover', e => { e.preventDefault(); });
dropAreaLogo.addEventListener('drop', e => {
    e.preventDefault();
    handleLogoFiles(e.dataTransfer.files);
});
uploadLogo.addEventListener('change', e => handleLogoFiles(e.target.files));

function handleLogoFiles(files) {
    logoFiles = [];
    galleryLogo.innerHTML = '';
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            logoFiles.push(file);
            displayLogoThumbnail(file);
        }
    }
}

function displayLogoThumbnail(file) {
    const reader = new FileReader();
    reader.onload = e => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        thumb.innerHTML = `
            <img src="${e.target.result}">
            <input type="checkbox" checked>
        `;
        galleryLogo.appendChild(thumb);
    };
    reader.readAsDataURL(file);
}

processButtonLogo.addEventListener('click', async () => {
    const selected = logoFiles.filter((_, i) => galleryLogo.querySelectorAll('input')[i].checked);
    if (selected.length === 0) {
        alert("Please select at least one logo to process.");
        return;
    }
    spinnerLogo.classList.remove('hidden');
    try {
        if (selected.length === 1) {
            const img = await loadImage(selected[0]);
            const processed = processLogo(img);
            triggerDownload(processed, 'processed-logo.png');
        } else {
            const zip = new JSZip();
            for (let i = 0; i < selected.length; i++) {
                const img = await loadImage(selected[i]);
                const processed = processLogo(img);
                zip.file(`processed-logo-${i + 1}.png`, processed.split(',')[1], { base64: true });
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            downloadLinkLogo.href = url;
            downloadLinkLogo.download = 'processed-logos.zip';
            downloadLinkLogo.style.display = 'inline-block';
        }
    } finally {
        spinnerLogo.classList.add('hidden');
        showToast();
    }
});

restartButtonLogo.addEventListener('click', () => {
    logoFiles = [];
    galleryLogo.innerHTML = '';
    downloadLinkLogo.style.display = 'none';
});

// Logo Processing
function processLogo(img) {
    canvas.width = 350;
    canvas.height = 200;
    const padding = 15;
    const maxWidth = 350 - padding * 2;
    const maxHeight = 200 - padding * 2;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 350, 200);

    let width = img.width;
    let height = img.height;
    const aspect = width / height;

    if (width > maxWidth) {
        width = maxWidth;
        height = width / aspect;
    }
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspect;
    }

    const x = (350 - width) / 2;
    const y = (200 - height) / 2;
    ctx.drawImage(img, x, y, width, height);

    return canvas.toDataURL('image/png');
}

// Speaker Upload
dropAreaSpeaker.addEventListener('click', () => uploadSpeaker.click());
dropAreaSpeaker.addEventListener('dragover', e => { e.preventDefault(); });
dropAreaSpeaker.addEventListener('drop', e => {
    e.preventDefault();
    handleSpeakerFiles(e.dataTransfer.files);
});
uploadSpeaker.addEventListener('change', e => handleSpeakerFiles(e.target.files));

function handleSpeakerFiles(files) {
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const index = speakerFiles.length;
            speakerFiles.push(file);
            speakerEditData.push({ offsetX: 0, offsetY: 0, scale: 1 });
            displaySpeakerThumbnail(file, index, true);
        }
    }
}

function displaySpeakerThumbnail(file, index, initial = false) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            let scale;
            if (img.width > img.height) {
                scale = (591 / img.height) * 1.1;
            } else {
                scale = (591 / img.width) * 1.1;
            }
            speakerEditData[index] = { offsetX: 0, offsetY: 0, scale };

            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 300;
            thumbCanvas.height = 300;
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCtx.fillStyle = 'white';
            thumbCtx.fillRect(0, 0, 300, 300);
            thumbCtx.drawImage(img, 0, 0, img.width * scale * (300/591), img.height * scale * (300/591));

            const thumb = document.createElement('div');
            thumb.className = 'thumb';
            thumb.innerHTML = `
                <img src="${thumbCanvas.toDataURL('image/png')}">
                <input type="checkbox" checked>
                <button class="edit-button" data-index="${index}">&#9998;</button>
            `;
            gallerySpeaker.appendChild(thumb);
            speakerThumbnails[index] = thumb.querySelector('img');

            thumb.querySelector('.edit-button').addEventListener('click', () => openEditor(index));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function openEditor(index) {
    currentEditIndex = index;
    const reader = new FileReader();
    reader.onload = e => {
        imgToEdit = new Image();
        imgToEdit.onload = () => {
            drawEditCanvas();
            document.getElementById('edit-modal').classList.remove('hidden');
        };
        imgToEdit.src = e.target.result;
    };
    reader.readAsDataURL(speakerFiles[index]);
}

function drawEditCanvas() {
    const { offsetX, offsetY, scale } = speakerEditData[currentEditIndex];
    const editCanvas = document.getElementById('edit-canvas');
    const editCtx = editCanvas.getContext('2d');
    editCtx.fillStyle = 'white';
    editCtx.fillRect(0, 0, 591, 591);
    editCtx.drawImage(imgToEdit, offsetX, offsetY, imgToEdit.width * scale, imgToEdit.height * scale);
}

// Zoom and Pan
document.getElementById('zoom-in').addEventListener('click', () => {
    speakerEditData[currentEditIndex].scale *= 1.07;
    drawEditCanvas();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    speakerEditData[currentEditIndex].scale /= 1.07;
    drawEditCanvas();
});

document.getElementById('done-editing').addEventListener('click', () => {
    document.getElementById('edit-modal').classList.add('hidden');
    updateSpeakerThumbnail(currentEditIndex);
});

function updateSpeakerThumbnail(index) {
    const { offsetX, offsetY, scale } = speakerEditData[index];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 300;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, 300, 300);
    tempCtx.drawImage(imgToEdit, offsetX * (300/591), offsetY * (300/591), imgToEdit.width * scale * (300/591), imgToEdit.height * scale * (300/591));
    speakerThumbnails[index].src = tempCanvas.toDataURL('image/png');
}

// Speaker Processing
processButtonSpeaker.addEventListener('click', async () => {
    const selected = speakerFiles.filter((_, i) => gallerySpeaker.querySelectorAll('input')[i].checked);
    if (selected.length === 0) {
        alert("Please select at least one speaker image.");
        return;
    }
    spinnerSpeaker.classList.remove('hidden');
    try {
        const zip = new JSZip();
        for (let i = 0; i < speakerFiles.length; i++) {
            if (!gallerySpeaker.querySelectorAll('input')[i].checked) continue;
            const img = await loadImage(speakerFiles[i]);
            const processed = processSpeaker(img, speakerEditData[i]);
            zip.file(`processed-speaker-${i + 1}.png`, processed.split(',')[1], { base64: true });
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        downloadLinkSpeaker.href = url;
        downloadLinkSpeaker.download = 'processed-speakers.zip';
        downloadLinkSpeaker.style.display = 'inline-block';
    } finally {
        spinnerSpeaker.classList.add('hidden');
        showToast();
    }
});

restartButtonSpeaker.addEventListener('click', () => {
    speakerFiles = [];
    gallerySpeaker.innerHTML = '';
    downloadLinkSpeaker.style.display = 'none';
});

// Speaker Processing
function processSpeaker(img, { offsetX, offsetY, scale }) {
    canvas.width = 591;
    canvas.height = 591;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 591, 591);
    ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
    return canvas.toDataURL('image/png');
}

// Helpers
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function triggerDownload(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
}

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
