// Image Converter Tool
class ImageConverter extends BaseTool {
    constructor(container) {
        super(container, 'Image Converter', 'Convert images between different formats');
        this.container.innerHTML = '';
        this.init();
    }

    init() {
        this.container.appendChild(this.createUploadArea('image/*', (file) => this.handleFile(file)));

        this.controlsDiv = document.createElement('div');
        this.controlsDiv.className = 'controls hidden';
        this.controlsDiv.innerHTML = `
            <div class="control-group">
                <label>Output Format</label>
                <select id="outputFormat">
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WebP</option>
                    <option value="image/bmp">BMP</option>
                </select>
            </div>
            <div class="control-group" id="qualityControl" style="display: none;">
                <label>Quality: <span id="qualityValue">90</span>%</label>
                <input type="range" id="quality" min="1" max="100" value="90">
            </div>
        `;
        this.container.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.container.appendChild(this.previewDiv);

        // Format change listener
        const formatSelect = this.controlsDiv.querySelector('#outputFormat');
        const qualityControl = this.controlsDiv.querySelector('#qualityControl');
        const qualitySlider = this.controlsDiv.querySelector('#quality');
        const qualityValue = this.controlsDiv.querySelector('#qualityValue');

        formatSelect.addEventListener('change', () => {
            const format = formatSelect.value;
            qualityControl.style.display = (format === 'image/jpeg' || format === 'image/webp') ? 'block' : 'none';
        });

        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = qualitySlider.value;
        });
    }

    async handleFile(file) {
        this.file = file;
        this.controlsDiv.classList.remove('hidden');

        // Preview original
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            this.originalImage = img;
            this.previewDiv.classList.remove('hidden');
            this.previewDiv.innerHTML = `
                <h3>Original Image</h3>
                <img src="${img.src}" class="preview-image" alt="Original">
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>Dimensions</label>
                        <span>${img.width} x ${img.height}px</span>
                    </div>
                    <div class="info-item">
                        <label>File Size</label>
                        <span>${this.formatFileSize(file.size)}</span>
                    </div>
                    <div class="info-item">
                        <label>Format</label>
                        <span>${file.type}</span>
                    </div>
                </div>
            `;

            const convertBtn = this.createButton('Convert Image', () => this.convertImage());
            this.previewDiv.appendChild(convertBtn);
        };
    }

    convertImage() {
        const format = document.getElementById('outputFormat').value;
        const quality = document.getElementById('quality').value / 100;

        const canvas = document.createElement('canvas');
        canvas.width = this.originalImage.width;
        canvas.height = this.originalImage.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.originalImage, 0, 0);

        canvas.toBlob((blob) => {
            const extension = format.split('/')[1];
            const filename = this.file.name.replace(/\.[^/.]+$/, '') + '.' + extension;

            // Show result
            const resultDiv = document.createElement('div');
            resultDiv.className = 'preview-area mt-2';
            resultDiv.innerHTML = `
                <h3>Converted Image</h3>
                <img src="${URL.createObjectURL(blob)}" class="preview-image" alt="Converted">
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>New Format</label>
                        <span>${format}</span>
                    </div>
                    <div class="info-item">
                        <label>New Size</label>
                        <span>${this.formatFileSize(blob.size)}</span>
                    </div>
                    <div class="info-item">
                        <label>Reduction</label>
                        <span>${Math.round((1 - blob.size / this.file.size) * 100)}%</span>
                    </div>
                </div>
            `;

            this.container.appendChild(resultDiv);

            const downloadBtn = this.createButton('Download', () => this.downloadFile(blob, filename));
            resultDiv.appendChild(downloadBtn);
        }, format, quality);
    }
}

// Initialize tool when page loads
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('toolContent');
    if (container) {
        new ImageConverter(container);
    }
});
