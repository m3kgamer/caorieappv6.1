// Barcode Scanner using QuaggaJS and ZXing
const BarcodeScanner = {
    isScanning: false,
    isProcessing: false, // Flag to prevent duplicate scans
    modal: null,
    statusElement: null,
    overlayElement: null,
    onDetectCallback: null,
    codeReader: null, // Singleton ZXing reader

    init() {
        this.modal = document.getElementById('scannerModal');
        this.statusElement = document.getElementById('scannerStatus');
        this.overlayElement = document.getElementById('scannerOverlay');

        const openBtn = document.getElementById('openScannerBtn');
        const closeBtn = document.getElementById('closeScannerBtn');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openScanner());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeScanner());
        }

        // Close on outside click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeScanner();
            }
        });
    },

    async openScanner(onDetect) {
        this.onDetectCallback = onDetect;

        if (this.modal) {
            this.modal.classList.remove('hidden');
            this.modal.classList.add('flex');
        }

        this.updateStatus('جاري طلب الوصول للكاميرا...', 'info');

        // Small delay to allow modal to render
        setTimeout(() => {
            this.startScanning();
        }, 300);
    },

    closeScanner() {
        this.stopScanning();

        if (this.modal) {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
        }
    },

    async startScanning() {
        if (this.isScanning) return;

        try {
            this.updateStatus('جاري تشغيل الكاميرا...', 'info');

            // Optimized constraints for iPhone 12 Pro & Modern Devices
            const constraints = {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: "environment", // Use back camera
                aspectRatio: { min: 1, max: 2 }
            };

            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.querySelector('#interactive'),
                    constraints: constraints,
                    // Area Restriction: central band
                    area: {
                        top: "30%",
                        right: "10%",
                        left: "10%",
                        bottom: "30%"
                    },
                    singleChannel: false
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: navigator.hardwareConcurrency || 4,
                decoder: {
                    readers: [
                        "ean_reader",       // EAN-13
                        "ean_8_reader",     // EAN-8
                        "code_128_reader",  // Code 128
                        "upc_reader",       // UPC-A
                        "upc_e_reader"      // UPC-E
                    ]
                },
                locate: true
            }, (err) => {
                if (err) {
                    console.error('QuaggaJS initialization error:', err);
                    this.updateStatus('تم رفض الوصول للكاميرا أو حدث خطأ. يرجى التحقق من الأذونات.', 'error');
                    return;
                }

                console.log('QuaggaJS initialized successfully');
                this.updateStatus('الكاميرا جاهزة! ضع الباركود في منتصف الخط الأخضر...', 'success');
                this.isScanning = true;
                Quagga.start();

                // Try to apply zoom if supported
                this.applyZoom(2.0);
            });

            // Handle barcode detection
            Quagga.onDetected((result) => {
                if (this.isProcessing) return;

                if (result && result.codeResult && result.codeResult.code) {
                    const code = result.codeResult.code;

                    // Basic validation
                    if (code.length < 3) return;

                    console.log('Barcode detected:', code);
                    this.isProcessing = true;

                    // Visual feedback
                    this.showDetectionFeedback();

                    // Call the callback
                    if (this.onDetectCallback) {
                        this.onDetectCallback(code);
                    }

                    // Close scanner after detection
                    setTimeout(() => {
                        this.closeScanner();
                    }, 500);
                }
            });

        } catch (error) {
            console.error('Error starting scanner:', error);
            this.updateStatus('فشل تشغيل الكاميرا. يرجى المحاولة مرة أخرى.', 'error');
            this.isProcessing = false;
        }
    },

    stopScanning() {
        if (this.isScanning) {
            Quagga.stop();
            this.isScanning = false;
            this.isProcessing = false;
            console.log('Scanner stopped');
        }
    },

    updateStatus(message, type = 'info') {
        if (!this.statusElement) return;

        const colors = {
            info: 'bg-blue-50 border-blue-200 text-blue-700',
            success: 'bg-green-50 border-green-200 text-green-700',
            error: 'bg-red-50 border-red-200 text-red-700'
        };

        this.statusElement.className = `mb-4 p-4 border rounded-xl text-center ${colors[type] || colors.info}`;
        this.statusElement.innerHTML = `<p class="font-medium">${message}</p>`;
    },

    showDetectionFeedback() {
        if (this.overlayElement) {
            this.overlayElement.style.opacity = '1';
            setTimeout(() => {
                this.overlayElement.style.opacity = '0';
            }, 300);
        }
    },

    // Apply zoom level
    applyZoom(zoomLevel) {
        const videoTrack = Quagga.CameraAccess.getActiveTrack();
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
            const capabilities = videoTrack.getCapabilities();
            if (capabilities.zoom) {
                videoTrack.applyConstraints({
                    advanced: [{ zoom: Math.min(zoomLevel, capabilities.zoom.max) }]
                }).catch(err => {
                    console.log('Zoom application failed', err);
                });
            }
        }
    },

    // Get or create ZXing reader instance
    getReader() {
        if (!this.codeReader && typeof ZXing !== 'undefined') {
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            // Configure hints for common formats
            const hints = new Map();
            const formats = [
                ZXing.BarcodeFormat.EAN_13,
                ZXing.BarcodeFormat.EAN_8,
                ZXing.BarcodeFormat.UPC_A,
                ZXing.BarcodeFormat.UPC_E,
                ZXing.BarcodeFormat.CODE_128,
            ];
            hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
            hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
            this.codeReader.hints = hints;
        }
        return this.codeReader;
    },

    // Decode a static image file using ZXing with enhanced preprocessing
    async decodeImage(fileUrl) {
        return new Promise(async (resolve) => {
            try {
                if (typeof ZXing === 'undefined') {
                    console.warn('ZXing library not loaded, falling back to Quagga');
                    this.quaggaFallback(fileUrl, resolve);
                    return;
                }

                const reader = this.getReader();

                // Method 1: Direct Decode
                try {
                    console.log('Attempting direct decode...');
                    const result = await reader.decodeFromImageUrl(fileUrl);
                    if (result) {
                        console.log('ZXing Decoded (Direct):', result.text);
                        resolve(result.text);
                        return;
                    }
                } catch (err) {
                    console.log('Direct decode failed, trying preprocessing...');
                }

                // Method 2: Preprocessing with rotations and resizing
                this.preprocessAndDecode(fileUrl, reader, resolve);

            } catch (err) {
                console.error('General decoding error:', err);
                resolve(null);
            }
        });
    },

    // Preprocess image on canvas to improve detection
    async preprocessAndDecode(fileUrl, codeReader, resolve) {
        const img = new Image();
        img.onload = async () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const tryDecode = async (width, height, rotation = 0, highContrast = false) => {
                    // Set dimensions based on rotation
                    if (rotation === 90 || rotation === 270) {
                        canvas.width = height;
                        canvas.height = width;
                    } else {
                        canvas.width = width;
                        canvas.height = height;
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.save();

                    // Handle rotation
                    if (rotation !== 0) {
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate(rotation * Math.PI / 180);
                        ctx.drawImage(img, -width / 2, -height / 2, width, height);
                    } else {
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    ctx.restore();

                    // Apply high contrast if requested
                    if (highContrast) {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            // Simple high contrast (thresholding)
                            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                            const val = avg > 128 ? 255 : 0;
                            data[i] = val;
                            data[i + 1] = val;
                            data[i + 2] = val;
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }

                    try {
                        const result = await codeReader.decodeFromCanvas(canvas);
                        return result ? result.text : null;
                    } catch (e) {
                        return null;
                    }
                };

                // Strategy: Try rotations, then resizing, then high constrast
                const strategies = [
                    { r: 0, s: 1, hc: false },
                    { r: 90, s: 1, hc: false },
                    { r: 180, s: 1, hc: false },
                    { r: 270, s: 1, hc: false },
                    { r: 0, s: 0.5, hc: false }, // Resize to 50%
                    { r: 0, s: 1, hc: true }     // High contrast
                ];

                for (const strat of strategies) {
                    const w = img.width * strat.s;
                    const h = img.height * strat.s;
                    console.log(`Trying decode: Rotation ${strat.r}, Scale ${strat.s}, HighContrast ${strat.hc}`);

                    const code = await tryDecode(w, h, strat.r, strat.hc);
                    if (code) {
                        console.log(`Success with strategy: R${strat.r}/S${strat.s}/HC${strat.hc}`);
                        resolve(code);
                        return;
                    }
                }

                console.warn('ZXing failed all strategies, falling back to Quagga...');
                this.quaggaFallback(fileUrl, resolve);

            } catch (e) {
                console.error("Preprocessing failed", e);
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = fileUrl;
    },

    // Fallback to Quagga
    quaggaFallback(fileUrl, resolve) {
        Quagga.decodeSingle({
            decoder: {
                readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"]
            },
            locate: true,
            src: fileUrl
        }, (result) => {
            if (result && result.codeResult) {
                console.log('Quagga Fallback Success:', result.codeResult.code);
                resolve(result.codeResult.code);
            } else {
                console.log('Quagga Fallback Failed');
                resolve(null);
            }
        });
    }
};

// Initialize scanner when DOM is loaded
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        BarcodeScanner.init();
    });
}
