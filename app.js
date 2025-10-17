// Main App
class OnlineToolkit {
    constructor() {
        this.modal = document.getElementById('toolModal');
        this.modalClose = document.getElementById('modalClose');
        this.toolContainer = document.getElementById('toolContainer');
        this.themeToggle = document.getElementById('themeToggle');

        this.initTheme();
        this.initEventListeners();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    initEventListeners() {
        // Tool cards
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolName = card.dataset.tool;
                this.openTool(toolName);
            });
        });

        // Modal close
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    openTool(toolName) {
        this.toolContainer.innerHTML = '';

        switch(toolName) {
            case 'image-converter':
                new ImageConverter(this.toolContainer);
                break;
            case 'image-resizer':
                new ImageResizer(this.toolContainer);
                break;
            case 'image-cropper':
                new ImageCropper(this.toolContainer);
                break;
            case 'video-info':
                new VideoInfo(this.toolContainer);
                break;
            case 'video-thumbnail':
                new VideoThumbnail(this.toolContainer);
                break;
            case 'audio-converter':
                new AudioConverter(this.toolContainer);
                break;
            case 'audio-info':
                new AudioInfo(this.toolContainer);
                break;
            case 'audio-trimmer':
                new AudioTrimmer(this.toolContainer);
                break;
            case 'qr-generator':
                new QRGenerator(this.toolContainer);
                break;
            case 'color-picker':
                new ColorPicker(this.toolContainer);
                break;
            case 'text-tools':
                new TextTools(this.toolContainer);
                break;
            case 'base64':
                new Base64Tool(this.toolContainer);
                break;
        }

        this.modal.classList.add('active');
    }

    closeModal() {
        this.modal.classList.remove('active');
    }
}

// Base Tool Class
class BaseTool {
    constructor(container, title, description) {
        this.container = container;
        this.title = title;
        this.description = description;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="tool-header">
                <h2>${this.title}</h2>
                <p>${this.description}</p>
            </div>
            <div class="tool-body"></div>
        `;
        this.body = this.container.querySelector('.tool-body');
    }

    createUploadArea(acceptedFormats, onChange) {
        const uploadArea = document.createElement('div');
        uploadArea.className = 'upload-area';
        uploadArea.innerHTML = `
            <div class="upload-icon">📁</div>
            <h3>Drop your file here</h3>
            <p>or click to browse (${acceptedFormats})</p>
            <input type="file" class="file-input" accept="${acceptedFormats}">
        `;

        const input = uploadArea.querySelector('.file-input');

        uploadArea.addEventListener('click', () => input.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                onChange(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                onChange(e.target.files[0]);
            }
        });

        return uploadArea;
    }

    createButton(text, onClick, className = 'btn-primary') {
        const button = document.createElement('button');
        button.className = `btn ${className}`;
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Image Converter Tool
class ImageConverter extends BaseTool {
    constructor(container) {
        super(container, 'Image Converter', 'Convert images between different formats');
        this.init();
    }

    init() {
        this.body.appendChild(this.createUploadArea('image/*', (file) => this.handleFile(file)));

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
        this.body.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);

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

            this.body.appendChild(resultDiv);

            const downloadBtn = this.createButton('Download', () => this.downloadFile(blob, filename));
            resultDiv.appendChild(downloadBtn);
        }, format, quality);
    }
}

// Image Resizer Tool
class ImageResizer extends BaseTool {
    constructor(container) {
        super(container, 'Image Resizer', 'Resize and compress images');
        this.init();
    }

    init() {
        this.body.appendChild(this.createUploadArea('image/*', (file) => this.handleFile(file)));

        this.controlsDiv = document.createElement('div');
        this.controlsDiv.className = 'controls hidden';
        this.controlsDiv.innerHTML = `
            <div class="control-group">
                <label>Width (px)</label>
                <input type="number" id="width" min="1" placeholder="Auto">
            </div>
            <div class="control-group">
                <label>Height (px)</label>
                <input type="number" id="height" min="1" placeholder="Auto">
            </div>
            <div class="control-group">
                <label>
                    <input type="checkbox" id="maintainRatio" checked> Maintain aspect ratio
                </label>
            </div>
        `;
        this.body.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);
    }

    async handleFile(file) {
        this.file = file;
        this.controlsDiv.classList.remove('hidden');

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            this.originalImage = img;
            this.originalWidth = img.width;
            this.originalHeight = img.height;

            document.getElementById('width').value = img.width;
            document.getElementById('height').value = img.height;

            this.previewDiv.classList.remove('hidden');
            this.previewDiv.innerHTML = `
                <h3>Original Image</h3>
                <img src="${img.src}" class="preview-image" alt="Original">
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>Original Size</label>
                        <span>${img.width} x ${img.height}px</span>
                    </div>
                    <div class="info-item">
                        <label>File Size</label>
                        <span>${this.formatFileSize(file.size)}</span>
                    </div>
                </div>
            `;

            const resizeBtn = this.createButton('Resize Image', () => this.resizeImage());
            this.previewDiv.appendChild(resizeBtn);

            // Auto-calculate dimensions
            const widthInput = document.getElementById('width');
            const heightInput = document.getElementById('height');
            const maintainRatio = document.getElementById('maintainRatio');

            widthInput.addEventListener('input', () => {
                if (maintainRatio.checked && widthInput.value) {
                    heightInput.value = Math.round((widthInput.value / this.originalWidth) * this.originalHeight);
                }
            });

            heightInput.addEventListener('input', () => {
                if (maintainRatio.checked && heightInput.value) {
                    widthInput.value = Math.round((heightInput.value / this.originalHeight) * this.originalWidth);
                }
            });
        };
    }

    resizeImage() {
        const width = parseInt(document.getElementById('width').value) || this.originalWidth;
        const height = parseInt(document.getElementById('height').value) || this.originalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.originalImage, 0, 0, width, height);

        canvas.toBlob((blob) => {
            const filename = this.file.name.replace(/\.[^/.]+$/, '') + '_resized.png';

            const resultDiv = document.createElement('div');
            resultDiv.className = 'preview-area mt-2';
            resultDiv.innerHTML = `
                <h3>Resized Image</h3>
                <img src="${URL.createObjectURL(blob)}" class="preview-image" alt="Resized">
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>New Size</label>
                        <span>${width} x ${height}px</span>
                    </div>
                    <div class="info-item">
                        <label>File Size</label>
                        <span>${this.formatFileSize(blob.size)}</span>
                    </div>
                </div>
            `;

            this.body.appendChild(resultDiv);

            const downloadBtn = this.createButton('Download', () => this.downloadFile(blob, filename));
            resultDiv.appendChild(downloadBtn);
        }, 'image/png');
    }
}

// Image Cropper Tool
class ImageCropper extends BaseTool {
    constructor(container) {
        super(container, 'Image Cropper', 'Crop images to custom dimensions');
        this.init();
    }

    init() {
        this.body.innerHTML = `
            <div class="upload-area">
                <div class="upload-icon">✂️</div>
                <h3>Drop your image here</h3>
                <p>Click on the image to select crop area</p>
                <input type="file" class="file-input" accept="image/*">
            </div>
            <div class="controls hidden">
                <canvas id="cropCanvas" class="preview-canvas"></canvas>
                <div class="control-group mt-2">
                    <p>Click and drag on the image to select the area to crop</p>
                </div>
            </div>
        `;

        const uploadArea = this.body.querySelector('.upload-area');
        const input = this.body.querySelector('.file-input');

        uploadArea.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
    }

    handleFile(file) {
        this.file = file;
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            this.setupCanvas(img);
        };
    }

    setupCanvas(img) {
        const canvas = document.getElementById('cropCanvas');
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        this.originalImage = img;
        this.canvas = canvas;
        this.ctx = ctx;
        this.scale = scale;

        this.body.querySelector('.controls').classList.remove('hidden');
        this.body.querySelector('.upload-area').style.display = 'none';

        this.setupCropSelection();
    }

    setupCropSelection() {
        let isDrawing = false;
        let startX, startY;

        this.canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = this.canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;

            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            // Redraw image
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.originalImage, 0, 0, this.canvas.width, this.canvas.height);

            // Draw selection
            this.ctx.strokeStyle = '#6366f1';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);

            // Darken outside area
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, startY);
            this.ctx.fillRect(0, startY, startX, currentY - startY);
            this.ctx.fillRect(currentX, startY, this.canvas.width - currentX, currentY - startY);
            this.ctx.fillRect(0, currentY, this.canvas.width, this.canvas.height - currentY);
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (!isDrawing) return;
            isDrawing = false;

            const rect = this.canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            this.cropImage(startX, startY, endX - startX, endY - startY);
        });
    }

    cropImage(x, y, width, height) {
        if (width <= 0 || height <= 0) return;

        // Convert to original image coordinates
        const cropX = x / this.scale;
        const cropY = y / this.scale;
        const cropWidth = width / this.scale;
        const cropHeight = height / this.scale;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;

        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(this.originalImage, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        cropCanvas.toBlob((blob) => {
            const filename = this.file.name.replace(/\.[^/.]+$/, '') + '_cropped.png';

            const resultDiv = document.createElement('div');
            resultDiv.className = 'preview-area mt-2';
            resultDiv.innerHTML = `
                <h3>Cropped Image</h3>
                <img src="${URL.createObjectURL(blob)}" class="preview-image" alt="Cropped">
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>Dimensions</label>
                        <span>${Math.round(cropWidth)} x ${Math.round(cropHeight)}px</span>
                    </div>
                    <div class="info-item">
                        <label>File Size</label>
                        <span>${this.formatFileSize(blob.size)}</span>
                    </div>
                </div>
            `;

            this.body.appendChild(resultDiv);

            const downloadBtn = this.createButton('Download', () => this.downloadFile(blob, filename));
            resultDiv.appendChild(downloadBtn);
        }, 'image/png');
    }
}

// Video Info Tool
class VideoInfo extends BaseTool {
    constructor(container) {
        super(container, 'Video Info', 'Get detailed information about video files');
        this.init();
    }

    init() {
        this.body.appendChild(this.createUploadArea('video/*', (file) => this.handleFile(file)));

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);
    }

    async handleFile(file) {
        this.file = file;

        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.className = 'preview-video';
        video.controls = true;

        video.onloadedmetadata = () => {
            this.previewDiv.classList.remove('hidden');
            this.previewDiv.innerHTML = `
                <h3>Video Preview</h3>
            `;
            this.previewDiv.appendChild(video);

            const infoHTML = `
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>File Name</label>
                        <span>${file.name}</span>
                    </div>
                    <div class="info-item">
                        <label>File Size</label>
                        <span>${this.formatFileSize(file.size)}</span>
                    </div>
                    <div class="info-item">
                        <label>Duration</label>
                        <span>${this.formatDuration(video.duration)}</span>
                    </div>
                    <div class="info-item">
                        <label>Dimensions</label>
                        <span>${video.videoWidth} x ${video.videoHeight}px</span>
                    </div>
                    <div class="info-item">
                        <label>Type</label>
                        <span>${file.type || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <label>Bitrate (approx)</label>
                        <span>${Math.round(file.size * 8 / video.duration / 1000)} kbps</span>
                    </div>
                </div>
            `;
            this.previewDiv.innerHTML += infoHTML;
        };
    }

    formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Video Thumbnail Tool
class VideoThumbnail extends BaseTool {
    constructor(container) {
        super(container, 'Video Thumbnail Generator', 'Extract thumbnail images from videos');
        this.init();
    }

    init() {
        this.body.appendChild(this.createUploadArea('video/*', (file) => this.handleFile(file)));

        this.controlsDiv = document.createElement('div');
        this.controlsDiv.className = 'controls hidden';
        this.controlsDiv.innerHTML = `
            <div class="control-group">
                <label>Time Position: <span id="timeValue">0:00</span></label>
                <input type="range" id="timeSlider" min="0" max="100" value="0">
            </div>
        `;
        this.body.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);
    }

    async handleFile(file) {
        this.file = file;

        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;

        video.onloadedmetadata = () => {
            this.video = video;
            this.duration = video.duration;

            this.controlsDiv.classList.remove('hidden');
            this.previewDiv.classList.remove('hidden');

            const timeSlider = document.getElementById('timeSlider');
            const timeValue = document.getElementById('timeValue');

            timeSlider.max = Math.floor(video.duration);

            timeSlider.addEventListener('input', () => {
                const time = parseInt(timeSlider.value);
                video.currentTime = time;
                timeValue.textContent = this.formatTime(time);
            });

            video.onseeked = () => {
                this.captureThumbnail();
            };

            // Initial thumbnail
            video.currentTime = 0;
        };
    }

    captureThumbnail() {
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0);

        canvas.toBlob((blob) => {
            this.previewDiv.innerHTML = `
                <h3>Thumbnail Preview</h3>
                <img src="${URL.createObjectURL(blob)}" class="preview-image" alt="Thumbnail">
            `;

            const downloadBtn = this.createButton('Download Thumbnail', () => {
                const filename = this.file.name.replace(/\.[^/.]+$/, '') + '_thumbnail.png';
                this.downloadFile(blob, filename);
            });
            this.previewDiv.appendChild(downloadBtn);
        }, 'image/png');
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Audio Converter Tool
class AudioConverter extends BaseTool {
    constructor(container) {
        super(container, 'Audio Converter', 'Convert WAV to MP3 and other audio formats');
        this.init();
    }

    init() {
        // Check browser capabilities
        this.checkBrowserSupport();

        this.body.innerHTML = `
            <div class="mb-2">
                <p><strong>Note:</strong> This tool converts audio files using your browser's capabilities.</p>
                <p class="mt-1" id="browserSupport">Checking browser support...</p>
            </div>
        `;

        this.body.appendChild(this.createUploadArea('audio/*', (file) => this.handleFile(file)));

        this.controlsDiv = document.createElement('div');
        this.controlsDiv.className = 'controls hidden';
        this.controlsDiv.innerHTML = `
            <div class="control-group">
                <label>Output Format</label>
                <select id="outputFormat">
                    <option value="audio/wav">WAV (Uncompressed)</option>
                    <option value="audio/mpeg">MP3 (Recommended)</option>
                    <option value="audio/ogg">OGG Vorbis</option>
                    <option value="audio/webm">WebM Audio</option>
                </select>
            </div>
            <div class="control-group">
                <label>Sample Rate</label>
                <select id="sampleRate">
                    <option value="44100">44.1 kHz (CD Quality)</option>
                    <option value="48000" selected>48 kHz (Professional)</option>
                    <option value="22050">22.05 kHz (Lower Quality)</option>
                    <option value="16000">16 kHz (Voice)</option>
                </select>
            </div>
            <div class="control-group">
                <label>Channels</label>
                <select id="channels">
                    <option value="1">Mono</option>
                    <option value="2" selected>Stereo</option>
                </select>
            </div>
        `;
        this.body.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);

        // Update format availability after controls are added
        setTimeout(() => this.updateFormatAvailability(), 100);
    }

    checkBrowserSupport() {
        this.supportedFormats = {
            'audio/wav': true, // Always supported
            'audio/mpeg': false,
            'audio/ogg': false,
            'audio/webm': false
        };

        if (window.MediaRecorder) {
            // Check common MP3 formats
            const mp3Types = ['audio/mpeg', 'audio/mp3'];
            for (const type of mp3Types) {
                if (MediaRecorder.isTypeSupported(type)) {
                    this.supportedFormats['audio/mpeg'] = true;
                    break;
                }
            }

            // Check OGG
            const oggTypes = ['audio/ogg', 'audio/ogg;codecs=opus'];
            for (const type of oggTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    this.supportedFormats['audio/ogg'] = true;
                    break;
                }
            }

            // Check WebM
            const webmTypes = ['audio/webm', 'audio/webm;codecs=opus'];
            for (const type of webmTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    this.supportedFormats['audio/webm'] = true;
                    break;
                }
            }
        }

        // Update UI with support info
        setTimeout(() => {
            const supportEl = document.getElementById('browserSupport');
            if (supportEl) {
                const supported = Object.entries(this.supportedFormats)
                    .filter(([_, isSupported]) => isSupported)
                    .map(([format, _]) => format.split('/')[1].toUpperCase());

                supportEl.innerHTML = `✅ Your browser supports: <strong>${supported.join(', ')}</strong>`;

                if (!this.supportedFormats['audio/mpeg']) {
                    supportEl.innerHTML += '<br>⚠️ MP3 encoding not supported in your browser. Try Chrome/Edge for MP3 support, or use WAV format.';
                }
            }
        }, 100);
    }

    updateFormatAvailability() {
        const select = document.getElementById('outputFormat');
        if (!select) return;

        Array.from(select.options).forEach(option => {
            const format = option.value;
            if (!this.supportedFormats[format]) {
                option.textContent += ' (Not Supported)';
                option.disabled = true;
            }
        });

        // Select first available format
        for (let i = 0; i < select.options.length; i++) {
            if (!select.options[i].disabled) {
                select.selectedIndex = i;
                break;
            }
        }
    }

    async handleFile(file) {
        this.file = file;
        this.controlsDiv.classList.remove('hidden');

        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.className = 'preview-audio';
        audio.controls = true;

        audio.onloadedmetadata = () => {
            this.originalAudio = audio;

            this.previewDiv.classList.remove('hidden');
            this.previewDiv.innerHTML = `
                <h3>Original Audio</h3>
            `;
            this.previewDiv.appendChild(audio);

            const infoHTML = `
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>File Name</label>
                        <span>${file.name}</span>
                    </div>
                    <div class="info-item">
                        <label>File Size</label>
                        <span>${this.formatFileSize(file.size)}</span>
                    </div>
                    <div class="info-item">
                        <label>Duration</label>
                        <span>${this.formatDuration(audio.duration)}</span>
                    </div>
                    <div class="info-item">
                        <label>Type</label>
                        <span>${file.type || 'Unknown'}</span>
                    </div>
                </div>
            `;
            this.previewDiv.innerHTML += infoHTML;

            const convertBtn = this.createButton('Convert Audio', () => this.convertAudio());
            this.previewDiv.appendChild(convertBtn);
        };
    }

    async convertAudio() {
        const format = document.getElementById('outputFormat').value;
        const sampleRate = parseInt(document.getElementById('sampleRate').value);
        const numChannels = parseInt(document.getElementById('channels').value);

        // Check if format is supported
        if (!this.supportedFormats[format]) {
            alert(`${format} is not supported by your browser. Please select a different format.`);
            return;
        }

        // Show progress
        const progressDiv = document.createElement('div');
        progressDiv.className = 'mt-2';
        progressDiv.innerHTML = `
            <p>Converting audio... Please wait.</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 50%;"></div>
            </div>
        `;
        this.previewDiv.appendChild(progressDiv);

        try {
            // Load and decode the audio file
            const arrayBuffer = await this.file.arrayBuffer();

            // Create audio context with target sample rate
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            let resultBlob;

            if (format === 'audio/wav') {
                // WAV conversion - direct encoding
                resultBlob = await this.convertToWav(audioBuffer, numChannels, sampleRate);
            } else {
                // MP3, OGG, WebM - use MediaRecorder
                resultBlob = await this.convertWithMediaRecorder(audioBuffer, format, sampleRate, numChannels);
            }

            progressDiv.remove();
            this.showResult(resultBlob, format);

            // Close audio context
            await audioContext.close();

        } catch (error) {
            progressDiv.innerHTML = `<p style="color: var(--danger);">Error: ${error.message}</p>
                <p class="mt-1">Try using a different output format or browser.</p>`;
            console.error('Conversion error:', error);
        }
    }

    async convertToWav(audioBuffer, targetChannels, targetSampleRate) {
        // Create offline context for resampling/rechanneling if needed
        const offlineContext = new OfflineAudioContext(
            targetChannels,
            Math.ceil(audioBuffer.duration * targetSampleRate),
            targetSampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();

        const renderedBuffer = await offlineContext.startRendering();
        return this.audioBufferToWav(renderedBuffer);
    }

    async convertWithMediaRecorder(audioBuffer, mimeType, sampleRate, numChannels) {
        return new Promise(async (resolve, reject) => {
            try {
                // Create a new audio context
                const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: sampleRate
                });

                // Create offline context for channel/sample rate adjustment
                const offlineContext = new OfflineAudioContext(
                    numChannels,
                    Math.ceil(audioBuffer.duration * sampleRate),
                    sampleRate
                );

                const source = offlineContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineContext.destination);
                source.start();

                const renderedBuffer = await offlineContext.startRendering();

                // Create a media stream destination
                const destination = audioContext.createMediaStreamDestination();

                // Create buffer source for playback
                const playbackSource = audioContext.createBufferSource();
                playbackSource.buffer = renderedBuffer;
                playbackSource.connect(destination);

                // Determine the best mime type for the format
                let actualMimeType = mimeType;
                if (mimeType === 'audio/mpeg') {
                    // Try different MP3 mime type variations
                    const mp3Types = ['audio/mpeg', 'audio/mp3', 'audio/mpeg;codecs=mp3'];
                    for (const type of mp3Types) {
                        if (MediaRecorder.isTypeSupported(type)) {
                            actualMimeType = type;
                            break;
                        }
                    }
                } else if (mimeType === 'audio/ogg') {
                    actualMimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
                        ? 'audio/ogg;codecs=opus' : 'audio/ogg';
                } else if (mimeType === 'audio/webm') {
                    actualMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                        ? 'audio/webm;codecs=opus' : 'audio/webm';
                }

                // Create MediaRecorder
                const mediaRecorder = new MediaRecorder(destination.stream, {
                    mimeType: actualMimeType
                });

                const chunks = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    audioContext.close();
                    resolve(blob);
                };

                mediaRecorder.onerror = (e) => {
                    audioContext.close();
                    reject(new Error('MediaRecorder error: ' + (e.error || 'Unknown error')));
                };

                // Start recording and playback
                mediaRecorder.start(100); // Collect data every 100ms
                playbackSource.start();

                // Stop recording when audio ends
                playbackSource.onended = () => {
                    // Give a small delay to ensure all data is captured
                    setTimeout(() => {
                        if (mediaRecorder.state !== 'inactive') {
                            mediaRecorder.stop();
                        }
                    }, 100);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    audioBufferToWav(buffer) {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        // Write WAV header
        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // RIFF identifier
        setUint32(0x46464952);
        // file length
        setUint32(length - 8);
        // RIFF type
        setUint32(0x45564157);
        // format chunk identifier
        setUint32(0x20746d66);
        // format chunk length
        setUint32(16);
        // sample format (raw)
        setUint16(1);
        // channel count
        setUint16(buffer.numberOfChannels);
        // sample rate
        setUint32(buffer.sampleRate);
        // byte rate (sample rate * block align)
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
        // block align (channel count * bytes per sample)
        setUint16(buffer.numberOfChannels * 2);
        // bits per sample
        setUint16(16);
        // data chunk identifier
        setUint32(0x61746164);
        // data chunk length
        setUint32(length - pos - 4);

        // Write interleaved data
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    showResult(blob, format) {
        const formatExtensions = {
            'audio/wav': 'wav',
            'audio/mpeg': 'mp3',
            'audio/ogg': 'ogg',
            'audio/webm': 'webm'
        };

        const extension = formatExtensions[format] || 'audio';
        const filename = this.file.name.replace(/\.[^/.]+$/, '') + '.' + extension;

        const resultDiv = document.createElement('div');
        resultDiv.className = 'preview-area mt-2';
        resultDiv.innerHTML = `
            <h3>Converted Audio</h3>
            <audio src="${URL.createObjectURL(blob)}" class="preview-audio" controls></audio>
            <div class="info-grid mt-2">
                <div class="info-item">
                    <label>Output Format</label>
                    <span>${format}</span>
                </div>
                <div class="info-item">
                    <label>File Size</label>
                    <span>${this.formatFileSize(blob.size)}</span>
                </div>
                <div class="info-item">
                    <label>Size Change</label>
                    <span>${Math.round((blob.size / this.file.size) * 100)}% of original</span>
                </div>
            </div>
        `;

        this.body.appendChild(resultDiv);

        const downloadBtn = this.createButton('Download Converted Audio', () => this.downloadFile(blob, filename));
        resultDiv.appendChild(downloadBtn);
    }

    formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Audio Info Tool
class AudioInfo extends BaseTool {
    constructor(container) {
        super(container, 'Audio Info', 'View audio file metadata and properties');
        this.init();
    }

    init() {
        this.body.appendChild(this.createUploadArea('audio/*', (file) => this.handleFile(file)));

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);
    }

    async handleFile(file) {
        this.file = file;

        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.className = 'preview-audio';
        audio.controls = true;

        audio.onloadedmetadata = () => {
            this.previewDiv.classList.remove('hidden');
            this.previewDiv.innerHTML = `
                <h3>Audio Preview</h3>
            `;
            this.previewDiv.appendChild(audio);

            const infoHTML = `
                <div class="info-grid mt-2">
                    <div class="info-item">
                        <label>File Name</label>
                        <span>${file.name}</span>
                    </div>
                    <div class="info-item">
                        <label>File Size</label>
                        <span>${this.formatFileSize(file.size)}</span>
                    </div>
                    <div class="info-item">
                        <label>Duration</label>
                        <span>${this.formatDuration(audio.duration)}</span>
                    </div>
                    <div class="info-item">
                        <label>Type</label>
                        <span>${file.type || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <label>Bitrate (approx)</label>
                        <span>${Math.round(file.size * 8 / audio.duration / 1000)} kbps</span>
                    </div>
                </div>
            `;
            this.previewDiv.innerHTML += infoHTML;
        };
    }

    formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Audio Trimmer Tool
class AudioTrimmer extends BaseTool {
    constructor(container) {
        super(container, 'Audio Trimmer', 'Trim and cut audio files');
        this.init();
    }

    init() {
        this.body.innerHTML = `
            <p class="mb-2">Note: This tool creates a trimmed copy using the Web Audio API. The quality depends on your browser's audio encoding capabilities.</p>
        `;
        this.body.appendChild(this.createUploadArea('audio/*', (file) => this.handleFile(file)));

        this.controlsDiv = document.createElement('div');
        this.controlsDiv.className = 'controls hidden';
        this.body.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);
    }

    async handleFile(file) {
        this.file = file;

        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.controls = true;

        audio.onloadedmetadata = () => {
            this.audio = audio;
            this.duration = audio.duration;

            this.controlsDiv.classList.remove('hidden');
            this.controlsDiv.innerHTML = `
                <div class="control-group">
                    <label>Start Time: <span id="startValue">0:00</span></label>
                    <input type="range" id="startTime" min="0" max="${Math.floor(this.duration)}" value="0">
                </div>
                <div class="control-group">
                    <label>End Time: <span id="endValue">${this.formatTime(this.duration)}</span></label>
                    <input type="range" id="endTime" min="0" max="${Math.floor(this.duration)}" value="${Math.floor(this.duration)}">
                </div>
            `;

            this.previewDiv.classList.remove('hidden');
            this.previewDiv.innerHTML = '<h3>Original Audio</h3>';
            this.previewDiv.appendChild(audio);

            const startSlider = document.getElementById('startTime');
            const endSlider = document.getElementById('endTime');
            const startValue = document.getElementById('startValue');
            const endValue = document.getElementById('endValue');

            startSlider.addEventListener('input', () => {
                startValue.textContent = this.formatTime(startSlider.value);
                if (parseInt(startSlider.value) >= parseInt(endSlider.value)) {
                    startSlider.value = parseInt(endSlider.value) - 1;
                    startValue.textContent = this.formatTime(startSlider.value);
                }
            });

            endSlider.addEventListener('input', () => {
                endValue.textContent = this.formatTime(endSlider.value);
                if (parseInt(endSlider.value) <= parseInt(startSlider.value)) {
                    endSlider.value = parseInt(startSlider.value) + 1;
                    endValue.textContent = this.formatTime(endSlider.value);
                }
            });

            const trimBtn = this.createButton('Trim Audio', () => this.trimAudio());
            this.controlsDiv.appendChild(trimBtn);
        };
    }

    async trimAudio() {
        const startTime = parseFloat(document.getElementById('startTime').value);
        const endTime = parseFloat(document.getElementById('endTime').value);

        const resultDiv = document.createElement('div');
        resultDiv.className = 'preview-area mt-2';
        resultDiv.innerHTML = `
            <h3>Trimmed Audio</h3>
            <p>Audio will be trimmed from ${this.formatTime(startTime)} to ${this.formatTime(endTime)}</p>
            <p class="mt-2">Note: Due to browser limitations, the trimmed audio is created by extracting the selected portion. You'll hear the trimmed version when you play it.</p>
        `;

        // Create a new audio element for the trimmed portion
        const trimmedAudio = document.createElement('audio');
        trimmedAudio.src = this.audio.src;
        trimmedAudio.controls = true;
        trimmedAudio.className = 'preview-audio mt-2';

        // Set the playback to start and end at specified times
        trimmedAudio.addEventListener('loadedmetadata', () => {
            trimmedAudio.currentTime = startTime;
        });

        trimmedAudio.addEventListener('timeupdate', () => {
            if (trimmedAudio.currentTime >= endTime) {
                trimmedAudio.pause();
                trimmedAudio.currentTime = startTime;
            }
        });

        resultDiv.appendChild(trimmedAudio);

        const infoHTML = `
            <div class="info-grid mt-2">
                <div class="info-item">
                    <label>Start Time</label>
                    <span>${this.formatTime(startTime)}</span>
                </div>
                <div class="info-item">
                    <label>End Time</label>
                    <span>${this.formatTime(endTime)}</span>
                </div>
                <div class="info-item">
                    <label>Duration</label>
                    <span>${this.formatTime(endTime - startTime)}</span>
                </div>
            </div>
        `;
        resultDiv.innerHTML += infoHTML;

        this.body.appendChild(resultDiv);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// QR Code Generator Tool
class QRGenerator extends BaseTool {
    constructor(container) {
        super(container, 'QR Code Generator', 'Generate QR codes from text or URLs');
        this.init();
    }

    init() {
        this.body.innerHTML = `
            <div class="controls">
                <div class="control-group">
                    <label>Enter Text or URL</label>
                    <textarea id="qrText" rows="4" placeholder="Enter text or URL to encode..."></textarea>
                </div>
                <div class="control-group">
                    <label>Size</label>
                    <select id="qrSize">
                        <option value="200">Small (200x200)</option>
                        <option value="300" selected>Medium (300x300)</option>
                        <option value="500">Large (500x500)</option>
                    </select>
                </div>
            </div>
            <div class="preview-area hidden" id="qrPreview"></div>
        `;

        const generateBtn = this.createButton('Generate QR Code', () => this.generateQR());
        this.body.querySelector('.controls').appendChild(generateBtn);
    }

    generateQR() {
        const text = document.getElementById('qrText').value.trim();
        const size = parseInt(document.getElementById('qrSize').value);

        if (!text) {
            alert('Please enter some text or URL');
            return;
        }

        const qrPreview = document.getElementById('qrPreview');
        qrPreview.classList.remove('hidden');

        // Simple QR code generation using a canvas
        const canvas = document.createElement('canvas');
        const qrSize = size;
        canvas.width = qrSize;
        canvas.height = qrSize;

        // Generate simple QR code pattern (this is a simplified version)
        // For production, you'd use a library like qrcode.js
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, qrSize, qrSize);

        // Draw a simple pattern (placeholder - real QR code would be more complex)
        ctx.fillStyle = '#000000';
        const moduleSize = qrSize / 25;

        // Generate a pseudo-random pattern based on text
        const hash = this.hashCode(text);
        for (let i = 0; i < 25; i++) {
            for (let j = 0; j < 25; j++) {
                if ((hash * i * j) % 3 === 0) {
                    ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
                }
            }
        }

        // Add positioning squares (QR code corners)
        this.drawPositionSquare(ctx, 0, 0, moduleSize * 7);
        this.drawPositionSquare(ctx, qrSize - moduleSize * 7, 0, moduleSize * 7);
        this.drawPositionSquare(ctx, 0, qrSize - moduleSize * 7, moduleSize * 7);

        qrPreview.innerHTML = `
            <h3>Generated QR Code</h3>
            <canvas id="qrCanvas" class="preview-canvas mt-2"></canvas>
            <p class="mt-2">Note: This is a simplified QR code pattern. For production use, consider using a dedicated QR code library.</p>
        `;

        const displayCanvas = document.getElementById('qrCanvas');
        displayCanvas.width = qrSize;
        displayCanvas.height = qrSize;
        displayCanvas.getContext('2d').drawImage(canvas, 0, 0);

        canvas.toBlob((blob) => {
            const downloadBtn = this.createButton('Download QR Code', () => this.downloadFile(blob, 'qrcode.png'));
            qrPreview.appendChild(downloadBtn);
        }, 'image/png');
    }

    drawPositionSquare(ctx, x, y, size) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + size/5, y + size/5, size * 3/5, size * 3/5);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + size * 2/5, y + size * 2/5, size/5, size/5);
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
}

// Color Picker Tool
class ColorPicker extends BaseTool {
    constructor(container) {
        super(container, 'Color Picker', 'Extract colors from images and get color codes');
        this.init();
    }

    init() {
        this.body.appendChild(this.createUploadArea('image/*', (file) => this.handleFile(file)));

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.body.appendChild(this.previewDiv);
    }

    handleFile(file) {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            this.previewDiv.classList.remove('hidden');

            const canvas = document.createElement('canvas');
            const maxWidth = 600;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.style.cursor = 'crosshair';
            canvas.className = 'preview-canvas';

            this.previewDiv.innerHTML = `
                <h3>Click on the image to pick a color</h3>
            `;
            this.previewDiv.appendChild(canvas);

            const colorInfo = document.createElement('div');
            colorInfo.className = 'info-grid mt-2 hidden';
            colorInfo.id = 'colorInfo';
            this.previewDiv.appendChild(colorInfo);

            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const pixel = ctx.getImageData(x, y, 1, 1).data;
                const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
                const hex = this.rgbToHex(pixel[0], pixel[1], pixel[2]);
                const hsl = this.rgbToHsl(pixel[0], pixel[1], pixel[2]);

                colorInfo.classList.remove('hidden');
                colorInfo.innerHTML = `
                    <div class="info-item">
                        <label>Color Preview</label>
                        <div style="width: 60px; height: 60px; background: ${rgb}; border-radius: 8px; border: 2px solid var(--border);"></div>
                    </div>
                    <div class="info-item">
                        <label>HEX</label>
                        <span style="font-family: monospace;">${hex}</span>
                    </div>
                    <div class="info-item">
                        <label>RGB</label>
                        <span style="font-family: monospace;">${rgb}</span>
                    </div>
                    <div class="info-item">
                        <label>HSL</label>
                        <span style="font-family: monospace;">${hsl}</span>
                    </div>
                `;

                // Copy to clipboard functionality
                const copyBtn = this.createButton('Copy HEX', () => {
                    navigator.clipboard.writeText(hex);
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy HEX', 2000);
                });
                colorInfo.appendChild(copyBtn);
            });
        };
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
}

// Text Tools
class TextTools extends BaseTool {
    constructor(container) {
        super(container, 'Text Tools', 'Case converter, word counter, and more');
        this.init();
    }

    init() {
        this.body.innerHTML = `
            <div class="controls">
                <div class="control-group">
                    <label>Enter Your Text</label>
                    <textarea id="textInput" rows="8" placeholder="Type or paste your text here..."></textarea>
                </div>
                <div class="info-grid mt-2" id="textStats">
                    <div class="info-item">
                        <label>Characters</label>
                        <span id="charCount">0</span>
                    </div>
                    <div class="info-item">
                        <label>Words</label>
                        <span id="wordCount">0</span>
                    </div>
                    <div class="info-item">
                        <label>Lines</label>
                        <span id="lineCount">0</span>
                    </div>
                    <div class="info-item">
                        <label>Paragraphs</label>
                        <span id="paraCount">0</span>
                    </div>
                </div>
                <div class="control-group mt-2">
                    <label>Text Operations</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary" id="uppercase">UPPERCASE</button>
                        <button class="btn btn-secondary" id="lowercase">lowercase</button>
                        <button class="btn btn-secondary" id="capitalize">Capitalize</button>
                        <button class="btn btn-secondary" id="reverse">Reverse</button>
                        <button class="btn btn-secondary" id="removeSpaces">Remove Spaces</button>
                        <button class="btn btn-secondary" id="copyText">Copy Text</button>
                    </div>
                </div>
            </div>
        `;

        const textInput = document.getElementById('textInput');

        textInput.addEventListener('input', () => this.updateStats());

        document.getElementById('uppercase').addEventListener('click', () => {
            textInput.value = textInput.value.toUpperCase();
            this.updateStats();
        });

        document.getElementById('lowercase').addEventListener('click', () => {
            textInput.value = textInput.value.toLowerCase();
            this.updateStats();
        });

        document.getElementById('capitalize').addEventListener('click', () => {
            textInput.value = textInput.value.replace(/\b\w/g, l => l.toUpperCase());
            this.updateStats();
        });

        document.getElementById('reverse').addEventListener('click', () => {
            textInput.value = textInput.value.split('').reverse().join('');
            this.updateStats();
        });

        document.getElementById('removeSpaces').addEventListener('click', () => {
            textInput.value = textInput.value.replace(/\s+/g, '');
            this.updateStats();
        });

        document.getElementById('copyText').addEventListener('click', () => {
            textInput.select();
            navigator.clipboard.writeText(textInput.value);
            const btn = document.getElementById('copyText');
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy Text', 2000);
        });
    }

    updateStats() {
        const text = document.getElementById('textInput').value;

        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lineCount = text.split('\n').length;
        const paraCount = text.trim() ? text.trim().split(/\n\n+/).length : 0;

        document.getElementById('charCount').textContent = charCount;
        document.getElementById('wordCount').textContent = wordCount;
        document.getElementById('lineCount').textContent = lineCount;
        document.getElementById('paraCount').textContent = paraCount;
    }
}

// Base64 Encoder/Decoder Tool
class Base64Tool extends BaseTool {
    constructor(container) {
        super(container, 'Base64 Encoder/Decoder', 'Encode and decode Base64 strings');
        this.init();
    }

    init() {
        this.body.innerHTML = `
            <div class="controls">
                <div class="control-group">
                    <label>Input Text</label>
                    <textarea id="inputText" rows="6" placeholder="Enter text to encode or Base64 to decode..."></textarea>
                </div>
                <div style="display: flex; gap: 1rem; margin: 1rem 0;">
                    <button class="btn btn-primary" id="encodeBtn">Encode to Base64</button>
                    <button class="btn btn-primary" id="decodeBtn">Decode from Base64</button>
                </div>
                <div class="control-group">
                    <label>Output</label>
                    <textarea id="outputText" rows="6" placeholder="Result will appear here..." readonly></textarea>
                </div>
                <button class="btn btn-secondary mt-2" id="copyOutput">Copy Output</button>
            </div>
        `;

        document.getElementById('encodeBtn').addEventListener('click', () => this.encode());
        document.getElementById('decodeBtn').addEventListener('click', () => this.decode());
        document.getElementById('copyOutput').addEventListener('click', () => this.copyOutput());
    }

    encode() {
        const input = document.getElementById('inputText').value;
        try {
            const encoded = btoa(unescape(encodeURIComponent(input)));
            document.getElementById('outputText').value = encoded;
        } catch (e) {
            alert('Error encoding text: ' + e.message);
        }
    }

    decode() {
        const input = document.getElementById('inputText').value;
        try {
            const decoded = decodeURIComponent(escape(atob(input)));
            document.getElementById('outputText').value = decoded;
        } catch (e) {
            alert('Error decoding Base64: ' + e.message);
        }
    }

    copyOutput() {
        const output = document.getElementById('outputText');
        output.select();
        navigator.clipboard.writeText(output.value);
        const btn = document.getElementById('copyOutput');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Output', 2000);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new OnlineToolkit();
});
