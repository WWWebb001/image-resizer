const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadButton = document.getElementById('download');

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            drawImage(img);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function drawImage(img) {
    const canvasWidth = 350;
    const canvasHeight = 200;
    const padding = 15;
    const maxWidth = canvasWidth - 2 * padding;
    const maxHeight = canvasHeight - 2 * padding;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate new size
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
}

downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'processed-image.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
});