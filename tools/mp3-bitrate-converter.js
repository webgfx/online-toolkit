// MP3 Bitrate Converter Tool - Re-encode MP3 at higher bitrate using lamejs
class Mp3BitrateConverter extends BaseTool {
    constructor(container) {
        super(container, 'MP3 Bitrate Converter', 'Re-encode MP3 files from low bitrate to high bitrate');
        this.container.innerHTML = '';
        this.init();
    }

    init() {
        const introDiv = document.createElement('div');
        introDiv.className = 'mb-2';
        introDiv.innerHTML = `
            <p><strong>Note:</strong> This tool re-encodes MP3 files at a higher bitrate using <strong>lamejs</strong>.</p>
            <p class="mt-1">⚠️ Re-encoding cannot recover audio quality lost during the original compression. The output file will be larger but the audio fidelity remains the same as the source.</p>
            <p class="mt-1">All processing happens in your browser - your files never leave your device.</p>
        `;
        this.container.appendChild(introDiv);

        this.container.appendChild(this.createUploadArea('.mp3,audio/mpeg', (file) => this.handleFile(file)));

        this.controlsDiv = document.createElement('div');
        this.controlsDiv.className = 'controls hidden';
        this.controlsDiv.innerHTML = `
            <div class="control-group">
                <label>Target Bitrate</label>
                <select id="targetBitrate">
                    <option value="128">128 kbps</option>
                    <option value="192">192 kbps (High quality)</option>
                    <option value="256">256 kbps (Very high quality)</option>
                    <option value="320" selected>320 kbps (Maximum quality)</option>
                </select>
            </div>
            <div class="control-group">
                <label>Sample Rate</label>
                <select id="sampleRate">
                    <option value="44100" selected>44.1 kHz (CD Quality)</option>
                    <option value="48000">48 kHz (Professional)</option>
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
        this.container.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.container.appendChild(this.previewDiv);
    }

    estimateBitrate(fileSizeBytes, durationSeconds) {
        if (!durationSeconds || durationSeconds <= 0) return 0;
        return Math.round((fileSizeBytes * 8) / durationSeconds / 1000);
    }

    async handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.mp3') && file.type !== 'audio/mpeg') {
            alert('Please select an MP3 file.');
            return;
        }

        this.file = file;
        this.controlsDiv.classList.remove('hidden');

        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);
        audio.className = 'preview-audio';
        audio.controls = true;

        audio.onloadedmetadata = () => {
            this.originalAudio = audio;
            const estimatedBitrate = this.estimateBitrate(file.size, audio.duration);

            this.previewDiv.classList.remove('hidden');
            this.previewDiv.innerHTML = '<h3>Original MP3</h3>';
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
                        <label>Estimated Bitrate</label>
                        <span>${estimatedBitrate} kbps</span>
                    </div>
                </div>
            `;
            this.previewDiv.innerHTML += infoHTML;

            const convertBtn = this.createButton('Convert to Higher Bitrate', () => this.convertAudio());
            this.previewDiv.appendChild(convertBtn);
        };
    }

    async convertAudio() {
        const targetBitrate = parseInt(document.getElementById('targetBitrate').value);
        const sampleRate = parseInt(document.getElementById('sampleRate').value);
        const numChannels = parseInt(document.getElementById('channels').value);

        const progressDiv = document.createElement('div');
        progressDiv.className = 'mt-2';
        progressDiv.innerHTML = `
            <p>Re-encoding MP3 at ${targetBitrate} kbps... Please wait.</p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 5%;"></div>
            </div>
        `;
        this.previewDiv.appendChild(progressDiv);

        try {
            const updateProgress = (percent) => {
                const fill = document.getElementById('progressFill');
                if (fill) fill.style.width = percent + '%';
            };

            updateProgress(10);

            // Decode the source MP3
            const arrayBuffer = await this.file.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            updateProgress(30);

            // Re-encode with lamejs at the target bitrate
            const resultBlob = await this.encodeToMp3(audioBuffer, numChannels, sampleRate, targetBitrate, updateProgress);

            updateProgress(100);
            progressDiv.remove();
            this.showResult(resultBlob, targetBitrate);
            await audioContext.close();

        } catch (error) {
            progressDiv.innerHTML = `<p style="color: var(--danger);">Error: ${error.message}</p>
                <p class="mt-1">Please make sure you uploaded a valid MP3 file.</p>`;
            console.error('Conversion error:', error);
        }
    }

    async encodeToMp3(audioBuffer, targetChannels, targetSampleRate, bitrate, updateProgress) {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof lamejs === 'undefined') {
                    reject(new Error('lamejs library not loaded. Please refresh the page.'));
                    return;
                }

                updateProgress(35);

                // Resample / rechannel if needed
                let processedBuffer = audioBuffer;
                if (audioBuffer.sampleRate !== targetSampleRate || audioBuffer.numberOfChannels !== targetChannels) {
                    const offlineContext = new OfflineAudioContext(
                        targetChannels,
                        Math.ceil(audioBuffer.duration * targetSampleRate),
                        targetSampleRate
                    );
                    const source = offlineContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(offlineContext.destination);
                    source.start();
                    processedBuffer = await offlineContext.startRendering();
                }

                updateProgress(45);

                const leftChannel = processedBuffer.getChannelData(0);
                const rightChannel = targetChannels === 2 ? processedBuffer.getChannelData(1) : leftChannel;

                const leftPcm = this.floatTo16BitPCM(leftChannel);
                const rightPcm = targetChannels === 2 ? this.floatTo16BitPCM(rightChannel) : leftPcm;

                updateProgress(55);

                const mp3encoder = new lamejs.Mp3Encoder(targetChannels, targetSampleRate, bitrate);
                const mp3Data = [];
                const sampleBlockSize = 1152;

                for (let i = 0; i < leftPcm.length; i += sampleBlockSize) {
                    const leftChunk = leftPcm.subarray(i, i + sampleBlockSize);
                    const rightChunk = targetChannels === 2 ? rightPcm.subarray(i, i + sampleBlockSize) : null;

                    const mp3buf = targetChannels === 2
                        ? mp3encoder.encodeBuffer(leftChunk, rightChunk)
                        : mp3encoder.encodeBuffer(leftChunk);

                    if (mp3buf.length > 0) {
                        mp3Data.push(mp3buf);
                    }

                    if (i % (sampleBlockSize * 10) === 0) {
                        const progress = 55 + Math.floor((i / leftPcm.length) * 40);
                        updateProgress(progress);
                    }
                }

                const mp3buf = mp3encoder.flush();
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }

                updateProgress(98);

                const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
                resolve(blob);

            } catch (error) {
                reject(error);
            }
        });
    }

    floatTo16BitPCM(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    showResult(blob, targetBitrate) {
        const filename = this.file.name.replace(/\.[^/.]+$/, '') + `_${targetBitrate}kbps.mp3`;

        // Remove any previous result
        const existingResult = this.container.querySelector('.result-area');
        if (existingResult) existingResult.remove();

        const resultDiv = document.createElement('div');
        resultDiv.className = 'preview-area mt-2 result-area';

        const originalBitrate = this.estimateBitrate(this.file.size, this.originalAudio.duration);
        const newBitrate = this.estimateBitrate(blob.size, this.originalAudio.duration);
        const sizeChange = blob.size > this.file.size
            ? `+${((blob.size - this.file.size) / this.file.size * 100).toFixed(1)}% larger`
            : `${((this.file.size - blob.size) / this.file.size * 100).toFixed(1)}% smaller`;

        resultDiv.innerHTML = `
            <h3>✓ Conversion Complete</h3>
            <audio src="${URL.createObjectURL(blob)}" class="preview-audio" controls></audio>
            <div class="info-grid mt-2">
                <div class="info-item">
                    <label>Original Bitrate</label>
                    <span>~${originalBitrate} kbps</span>
                </div>
                <div class="info-item">
                    <label>New Bitrate</label>
                    <span>~${newBitrate} kbps (target: ${targetBitrate})</span>
                </div>
                <div class="info-item">
                    <label>Original Size</label>
                    <span>${this.formatFileSize(this.file.size)}</span>
                </div>
                <div class="info-item">
                    <label>New Size</label>
                    <span>${this.formatFileSize(blob.size)}</span>
                </div>
                <div class="info-item">
                    <label>Size Change</label>
                    <span>${sizeChange}</span>
                </div>
            </div>
        `;

        this.container.appendChild(resultDiv);

        const downloadBtn = this.createButton('Download Converted MP3', () => this.downloadFile(blob, filename));
        resultDiv.appendChild(downloadBtn);
    }
}

// Initialize tool when page loads
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('toolContent');
    if (container) {
        new Mp3BitrateConverter(container);
    }
});
