const upload = document.getElementById('upload');
const dropArea = document.getElementById('drop-area');
const gallery = document.getElementById('gallery');
const processButton = document.getElementById('process');
const restartButton = document.getElementById('restart');
const downloadLink = document.getElementById('downloadLink');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const spinner = document.getElementById('spinner');
const toast = document.getElementById('toast');

let allFiles = [];

dropArea.addEventListener('click', () => upload.click());

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('highlight');
});

dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropArea.classList.remove('highlight');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('highlight');
    handleFiles(e.dataTransfer.files);
});

upload.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        resetUI();
    }
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            allFiles.push(file);
            displayThumbnail(file);
        }
    }
}

function displayThumbnail(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const thumbCanvas = document.createElement('canvas');
            const ctx = thumbCanvas.getContext('2d');
            thumbCanvas.width = 350;
            thumbCanvas.height = 200;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);

            const padding = 15;
            const maxWidth = thumbCanvas.width - 2 * padding;
            const maxHeight = thumbCanvas.height - 2 * padding;
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

            const x = (thumbCanvas.width - width) / 2;
            const y = (thumbCanvas.height - height) / 2;

            ctx.drawImage(img, x, y, width, height);

            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'thumb';

            const thumbImg = document.createElement('img');
            thumbImg.src = thumbCanvas.toDataURL('image/jpeg', 0.8);
            thumbImg.alt = 'Thumbnail';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;

            thumbDiv.appendChild(thumbImg);
            thumbDiv.appendChild(checkbox);
            gallery.appendChild(thumbDiv);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

processButton.addEventListener('click', async () => {
    const thumbs = Array.from(document.querySelectorAll('.thumb'));
    const selectedFiles = thumbs
        .map((thumb, index) => thumb.querySelector('input').checked ? allFiles[index] : null)
        .filter(f => f);

    if (selectedFiles.length === 0) {
        alert("Please select at least one image to process.");
        return;
    }

    // Disable buttons and show spinner
    processButton.disabled = true;
    restartButton.disabled = true;
    spinner.classList.remove('hidden');

    try {
        if (selectedFiles.length === 1) {
            const img = await loadImage(selectedFiles[0]);
            const processedImage = processImage(img);

            const link = document.createElement('a');
            link.download = 'processed-image.jpg';
            link.href = processedImage;
            link.click();
        } else {
            const zip = new JSZip();
            for (let i = 0; i < selectedFiles.length; i++) {
                const img = await loadImage(selectedFiles[i]);
                const processedImage = processImage(img);

                const data = processedImage.split(',')[1];
                zip.file(`processed-${i + 1}.jpg`, data, { base64: true });
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const zipLink = URL.createObjectURL(blob);

            downloadLink.href = zipLink;
            downloadLink.download = 'processed-images.zip';
            downloadLink.style.display = 'inline-block';
            downloadLink.innerText = 'Download Processed Images';
        }
    } catch (error) {
        alert("Something went wrong while processing the images.");
    } finally {
        spinner.classList.add('hidden');
        processButton.disabled = false;
        restartButton.disabled = false;
        showToast();
    }
});

restartButton.addEventListener('click', () => {
    allFiles = [];
    gallery.innerHTML = '';
    resetUI();
    processButton.disabled = false;
    restartButton.disabled = false;
});

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

function processImage(img) {
    const canvasWidth = 350;
    const canvasHeight = 200;
    const padding = 15;
    const maxWidth = canvasWidth - 2 * padding;
    const maxHeight = canvasHeight - 2 * padding;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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

    const x = (canvasWidth - width) / 2;
    const y = (canvasHeight - height) / 2;

    ctx.drawImage(img, x, y, width, height);

    return canvas.toDataURL('image/png');
}

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function resetUI() {
    spinner.classList.add('hidden');
    toast.classList.add('hidden');
    downloadLink.style.display = 'none';
}
