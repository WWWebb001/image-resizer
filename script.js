// Elements for both tabs
const uploadLogo = document.getElementById('upload-logo');
const dropAreaLogo = document.getElementById('drop-area-logo');
const galleryLogo = document.getElementById('gallery-logo');
const processButtonLogo = document.getElementById('process-logo');
const restartButtonLogo = document.getElementById('restart-logo');
const downloadLinkLogo = document.getElementById('downloadLink-logo');
const spinnerLogo = document.getElementById('spinner-logo');

const uploadSpeaker = document.getElementById('upload-speaker');
const dropAreaSpeaker = document.getElementById('drop-area-speaker');
const gallerySpeaker = document.getElementById('gallery-speaker');
const processButtonSpeaker = document.getElementById('process-speaker');
const restartButtonSpeaker = document.getElementById('restart-speaker');
const downloadLinkSpeaker = document.getElementById('downloadLink-speaker');
const spinnerSpeaker = document.getElementById('spinner-speaker');

const mainCanvas = document.getElementById('canvas');
const mainCtx = mainCanvas.getContext('2d');
const toast = document.getElementById('toast');

const editModal = document.getElementById('edit-modal');
const editCanvas = document.getElementById('edit-canvas');
const editCtx = editCanvas.getContext('2d');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const doneEditingButton = document.getElementById('done-editing');

const logoTab = document.getElementById('logo-tab');
const speakerTab = document.getElementById('speaker-tab');
const logoArea = document.getElementById('logo-area');
const speakerArea = document.getElementById('speaker-area');

let logoFiles = [];
let speakerFiles = [];
let speakerEditData = [];
let speakerThumbnails = [];
let currentEditIndex = null;
let imgToEdit = null;

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

dropAreaLogo.addEventListener('click', () => uploadLogo.click());
dropAreaLogo.addEventListener('dragover', e => { e.preventDefault(); dropAreaLogo.classList.add('highlight'); });
dropAreaLogo.addEventListener('dragleave', e => { e.preventDefault(); dropAreaLogo.classList.remove('highlight'); });
dropAreaLogo.addEventListener('drop', e => {
    e.preventDefault();
    dropAreaLogo.classList.remove('highlight');
    handleLogoFiles(e.dataTransfer.files);
});
uploadLogo.addEventListener('change', e => handleLogoFiles(e.target.files));

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
    reader.onload = e => {
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
    const selectedFiles = thumbs.map((thumb, i) => thumb.querySelector('input').checked ? logoFiles[i] : null).filter(f => f);

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
            const processed = processLogo(img);
            triggerDownload(processed, 'processed-logo.png');
        } else {
            const zip = new JSZip();
            for (let i = 0; i < selectedFiles.length; i++) {
                const img = await loadImage(selectedFiles[i]);
                const processed = processLogo(img);
                zip.file(`processed-logo-${i + 1}.png`, processed.split(',')[1], { base64: true });
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const link = URL.createObjectURL(blob);
            downloadLinkLogo.href = link;
            downloadLinkLogo.download = 'processed-logos.zip';
            downloadLinkLogo.style.display = 'inline-block';
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
    const maxWidth = 350 - 2 * padding;
    const maxHeight = 200 - 2 * padding;
    mainCtx.fillStyle = 'white';
    mainCtx.fillRect(0, 0, 350, 200);

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

    const x = (350 - width) / 2;
    const y = (200 - height) / 2;
    mainCtx.drawImage(img, x, y, width, height);

    return mainCanvas.toDataURL('image/png');
}

dropAreaSpeaker.addEventListener('click', () => uploadSpeaker.click());
dropAreaSpeaker.addEventListener('dragover', e => { e.preventDefault(); dropAreaSpeaker.classList.add('highlight'); });
dropAreaSpeaker.addEventListener('dragleave', e => { e.preventDefault(); dropAreaSpeaker.classList.remove('highlight'); });
dropAreaSpeaker.addEventListener('drop', e => {
    e.preventDefault();
    dropAreaSpeaker.classList.remove('highlight');
    handleSpeakerFiles(e.dataTransfer.files);
});
uploadSpeaker.addEventListener('change', e => handleSpeakerFiles(e.target.files));

function handleSpeakerFiles(files) {
    if (files.length > 0) resetSpeakerUI();
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const index = speakerFiles.length;
            speakerFiles.push(file);
            speakerEditData.push({ offsetX: 0, offsetY: 0, scale: 1 });
            createSpeakerThumbnail(file, index, true);
        }
    }
}

function createSpeakerThumbnail(file, index, initial = false) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            let scale, offsetX = 0, offsetY = 0;
            if (img.width > img.height) {
                scale = (591 + 10) / img.height;
                offsetX = (591 - img.width * scale) / 2;
            } else {
                scale = (591 + 10) / img.width;
                offsetY = 0;
            }

            if (initial) {
                speakerEditData[index] = { offsetX, offsetY, scale };
            }

            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 300;
            thumbCanvas.height = 300;
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCtx.fillStyle = 'white';
            thumbCtx.fillRect(0, 0, 300, 300);
            thumbCtx.drawImage(img, offsetX * (300/591), offsetY * (300/591), img.width * scale * (300/591), img.height * scale * (300/591));

            const thumb = document.createElement('div');
            thumb.className = 'thumb';
            thumb.innerHTML = `
                <img src="${thumbCanvas.toDataURL('image/png')}" alt="Speaker Thumbnail">
                <input type="checkbox" checked>
                <button class="edit-button" data-index="${index}"><i class="fas fa-edit"></i></button>
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
            let scale, offsetX = 0, offsetY = 0;
            if (imgToEdit.width > imgToEdit.height) {
                scale = (591 + 10) / imgToEdit.height;
                offsetX = (591 - imgToEdit.width * scale) / 2;
            } else {
                scale = (591 + 10) / imgToEdit.width;
                offsetY = 0;
            }
            speakerEditData[index] = { offsetX, offsetY, scale };
            drawEditCanvas();
            editModal.classList.remove('hidden');
        };
        imgToEdit.src = e.target.result;
    };
    reader.readAsDataURL(speakerFiles[index]);
}

function drawEditCanvas() {
    const { offsetX, offsetY, scale } = speakerEditData[currentEditIndex];
    editCtx.fillStyle = 'white';
    editCtx.fillRect(0, 0, 591, 591);
    const scaledWidth = imgToEdit.width * scale;
    const scaledHeight = imgToEdit.height * scale;
    editCtx.drawImage(imgToEdit, offsetX, offsetY, scaledWidth, scaledHeight);
}

let isDragging = false;
let lastX = 0, lastY = 0;

editCanvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});
editCanvas.addEventListener('mouseup', () => isDragging = false);
editCanvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.offsetX - lastX;
    const dy = e.offsetY - lastY;
    speakerEditData[currentEditIndex].offsetX += dx;
    speakerEditData[currentEditIndex].offsetY += dy;
    lastX = e.offsetX;
    lastY = e.offsetY;
    drawEditCanvas();
});

zoomInButton.addEventListener('click', () => {
    speakerEditData[currentEditIndex].scale *= 1.07;
    drawEditCanvas();
});
zoomOutButton.addEventListener('click', () => {
    speakerEditData[currentEditIndex].scale /= 1.07;
    drawEditCanvas();
});

doneEditingButton.addEventListener('click', () => {
    editModal.classList.add('hidden');
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

processButtonSpeaker.addEventListener('click', async () => {
    const thumbs = Array.from(gallerySpeaker.querySelectorAll('.thumb'));
    const selectedFiles = thumbs.map((thumb, i) => thumb.querySelector('input').checked ? speakerFiles[i] : null).filter(f => f);

    if (selectedFiles.length === 0) {
        alert("Please select at least one speaker photo to process.");
        return;
    }

    processButtonSpeaker.disabled = true;
    restartButtonSpeaker.disabled = true;
    spinnerSpeaker.classList.remove('hidden');

    try {
        const zip = new JSZip();
        for (let i = 0; i < speakerFiles.length; i++) {
            if (!thumbs[i].querySelector('input').checked) continue;
            const img = await loadImage(speakerFiles[i]);
            const processed = processSpeaker(img, speakerEditData[i]);
            zip.file(`processed-speaker-${i + 1}.png`, processed.split(',')[1], { base64: true });
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const link = URL.createObjectURL(blob);
        downloadLinkSpeaker.href = link;
        downloadLinkSpeaker.download = 'processed-speakers.zip';
        downloadLinkSpeaker.style.display = 'inline-block';
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
    speakerThumbnails = [];
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

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function triggerDownload(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
}
