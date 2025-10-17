// Audio Converter Tool - Standalone Version with lamejs
class AudioConverter extends BaseTool {
    constructor(container) {
        super(container, 'Audio Converter', 'Convert WAV to MP3 and other audio formats');
        this.container.innerHTML = '';
        this.init();
    }

    init() {
        const introDiv = document.createElement('div');
        introDiv.className = 'mb-2';
        introDiv.innerHTML = `
            <p><strong>Note:</strong> This tool uses <strong>lamejs</strong> for high-quality MP3 encoding.</p>
            <p class="mt-1">All processing happens in your browser - your files never leave your device.</p>
        `;
        this.container.appendChild(introDiv);

        this.container.appendChild(this.createUploadArea('audio/*', (file) => this.handleFile(file)));

        this.controlsDiv = document.createElement('div');
        this.controlsDiv.className = 'controls hidden';
        this.controlsDiv.innerHTML = `
            <div class="control-group">
                <label>Output Format</label>
                <select id="outputFormat">
                    <option value="mp3" selected>MP3 (Best compatibility)</option>
                    <option value="wav">WAV (Uncompressed)</option>
                </select>
            </div>
            <div class="control-group" id="bitrateControl">
                <label>MP3 Bitrate</label>
                <select id="bitrate">
                    <option value="128">128 kbps (Good quality)</option>
                    <option value="192" selected>192 kbps (High quality)</option>
                    <option value="256">256 kbps (Very high quality)</option>
                    <option value="320">320 kbps (Maximum quality)</option>
                </select>
            </div>
            <div class="control-group">
                <label>Sample Rate</label>
                <select id="sampleRate">
                    <option value="44100" selected>44.1 kHz (CD Quality)</option>
                    <option value="48000">48 kHz (Professional)</option>
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
        this.container.appendChild(this.controlsDiv);

        this.previewDiv = document.createElement('div');
        this.previewDiv.className = 'preview-area hidden';
        this.container.appendChild(this.previewDiv);

        // Format change listener
        const formatSelect = document.getElementById('outputFormat');
        const bitrateControl = document.getElementById('bitrateControl');

        formatSelect.addEventListener('change', () => {
            bitrateControl.style.display = formatSelect.value === 'mp3' ? 'block' : 'none';
        });
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
            this.previewDiv.innerHTML = '<h3>Original Audio</h3>';
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
        const bitrate = parseInt(document.getElementById('bitrate').value);

        const progressDiv = document.createElement('div');
        progressDiv.className = 'mt-2';
        progressDiv.innerHTML = `
            <p>Converting audio... Please wait.</p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 10%;"></div>
            </div>
        `;
        this.previewDiv.appendChild(progressDiv);

        try {
            // Update progress
            const updateProgress = (percent) => {
                const fill = document.getElementById('progressFill');
                if (fill) fill.style.width = percent + '%';
            };

            updateProgress(20);

            // Load and decode audio
            const arrayBuffer = await this.file.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            updateProgress(40);

            let resultBlob;
            let outputFormat;

            if (format === 'wav') {
                resultBlob = await this.convertToWav(audioBuffer, numChannels, sampleRate);
                outputFormat = 'audio/wav';
                updateProgress(80);
            } else {
                // Use lamejs for MP3
                resultBlob = await this.convertToMp3WithLame(audioBuffer, numChannels, sampleRate, bitrate, updateProgress);
                outputFormat = 'audio/mpeg';
            }

            updateProgress(100);
            progressDiv.remove();
            this.showResult(resultBlob, outputFormat);
            await audioContext.close();

        } catch (error) {
            progressDiv.innerHTML = `<p style="color: var(--danger);">Error: ${error.message}</p>
                <p class="mt-1">Please make sure you uploaded a valid audio file.</p>`;
            console.error('Conversion error:', error);
        }
    }

    async convertToWav(audioBuffer, targetChannels, targetSampleRate) {
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

    async convertToMp3WithLame(audioBuffer, targetChannels, targetSampleRate, bitrate, updateProgress) {
        return new Promise(async (resolve, reject) => {
            try {
                // Check if lamejs is loaded
                if (typeof lamejs === 'undefined') {
                    reject(new Error('lamejs library not loaded. Please refresh the page.'));
                    return;
                }

                updateProgress(50);

                // Resample if needed
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

                updateProgress(60);

                // Get audio data
                const leftChannel = processedBuffer.getChannelData(0);
                const rightChannel = targetChannels === 2 ? processedBuffer.getChannelData(1) : leftChannel;

                // Convert to 16-bit PCM
                const leftPcm = this.floatTo16BitPCM(leftChannel);
                const rightPcm = targetChannels === 2 ? this.floatTo16BitPCM(rightChannel) : leftPcm;

                updateProgress(70);

                // Initialize MP3 encoder
                const mp3encoder = new lamejs.Mp3Encoder(targetChannels, targetSampleRate, bitrate);
                const mp3Data = [];

                // Encode in chunks
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

                    // Update progress during encoding
                    if (i % (sampleBlockSize * 10) === 0) {
                        const progress = 70 + Math.floor((i / leftPcm.length) * 25);
                        updateProgress(progress);
                    }
                }

                // Flush remaining data
                const mp3buf = mp3encoder.flush();
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }

                updateProgress(95);

                // Create blob
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

    audioBufferToWav(buffer) {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        setUint32(0x46464952);
        setUint32(length - 8);
        setUint32(0x45564157);
        setUint32(0x20746d66);
        setUint32(16);
        setUint16(1);
        setUint16(buffer.numberOfChannels);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
        setUint16(buffer.numberOfChannels * 2);
        setUint16(16);
        setUint32(0x61746164);
        setUint32(length - pos - 4);

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

        // Remove any previous result
        const existingResult = this.container.querySelector('.result-area');
        if (existingResult) {
            existingResult.remove();
        }

        const resultDiv = document.createElement('div');
        resultDiv.className = 'preview-area mt-2 result-area';

        const sizeReduction = ((this.file.size - blob.size) / this.file.size * 100).toFixed(1);
        const sizeChange = blob.size > this.file.size
            ? `+${((blob.size - this.file.size) / this.file.size * 100).toFixed(1)}% larger`
            : `${sizeReduction}% smaller`;

        resultDiv.innerHTML = `
            <h3>✓ Conversion Complete</h3>
            <audio src="${URL.createObjectURL(blob)}" class="preview-audio" controls></audio>
            <div class="info-grid mt-2">
                <div class="info-item">
                    <label>Output Format</label>
                    <span>${extension.toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <label>File Size</label>
                    <span>${this.formatFileSize(blob.size)}</span>
                </div>
                <div class="info-item">
                    <label>Size Change</label>
                    <span>${sizeChange}</span>
                </div>
            </div>
        `;

        this.container.appendChild(resultDiv);

        const downloadBtn = this.createButton('Download Converted Audio', () => this.downloadFile(blob, filename));
        resultDiv.appendChild(downloadBtn);
    }
}

// Initialize tool when page loads
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('toolContent');
    if (container) {
        new AudioConverter(container);
    }
});
