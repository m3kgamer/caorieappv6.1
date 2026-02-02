// Barcode Scanner using QuaggaJS
const BarcodeScanner = {
    isScanning: false,
    modal: null,
    statusElement: null,
    overlayElement: null,
    onDetectCallback: null,

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

        this.updateStatus('Requesting camera access...', 'info');

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
            this.updateStatus('Starting camera...', 'info');

            // Optimized constraints for iPhone 12 Pro & Modern Devices
            // Prefer 720p or 1080p for better barcode resolution
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
                    // Area Restriction: scanned from 10% to 90% width, and 40% to 60% height (central band)
                    area: {
                        top: "30%",    // Top 30% ignored
                        right: "10%",  // Right 10% ignored
                        left: "10%",   // Left 10% ignored
                        bottom: "30%"  // Bottom 30% ignored
                    },
                    singleChannel: false // true sometimes helps performance, false better for color cam identification
                },
                locator: {
                    patchSize: "medium", // "medium" or "large" for high-res
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
                    this.updateStatus('Camera access denied or error. Please check permissions.', 'error');
                    return;
                }

                console.log('QuaggaJS initialized successfully');
                this.updateStatus('Camera ready! Center barcode in the green line...', 'success');
                this.isScanning = true;
                Quagga.start();

                // Try to apply zoom if supported (Basic "Zoom" attempt)
                this.applyZoom(2.0);
            });

            // Handle barcode detection
            Quagga.onDetected((result) => {
                if (result && result.codeResult && result.codeResult.code) {
                    const code = result.codeResult.code;
                    console.log('Barcode detected:', code);

                    // Visual feedback
                    this.showDetectionFeedback();

                    // Call the callback with detected barcode
                    if (this.onDetectCallback) {
                        this.onDetectCallback(code);
                    }

                    // Close scanner after successful detection
                    setTimeout(() => {
                        this.closeScanner();
                    }, 500);
                }
            });

        } catch (error) {
            console.error('Error starting scanner:', error);
            this.updateStatus('Failed to start camera. Please try again.', 'error');
        }
    },

    stopScanning() {
        if (this.isScanning) {
            Quagga.stop();
            this.isScanning = false;
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

    // Initialize zoom based on camera capabilities
    setupZoom() {
        const videoTrack = Quagga.CameraAccess.getActiveTrack();
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
            const capabilities = videoTrack.getCapabilities();

            // Setup Zoom
            if (capabilities.zoom) {
                console.log('Camera zoom capabilities:', capabilities.zoom);
                if (this.zoomSlider) {
                    this.zoomSlider.min = capabilities.zoom.min;
                    this.zoomSlider.max = capabilities.zoom.max;
                    this.zoomSlider.step = capabilities.zoom.step || 0.1;
                    this.zoomSlider.value = 1.0; // Default start
                }

                // Optional: Force a small initial zoom for iPhone macros/distance
                // this.applyZoom(2.0); 
            } else {
                // If zoom not supported, hide slider
                if (this.zoomSlider) {
                    this.zoomSlider.parentElement.classList.add('hidden');
                }
            }
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
    }
};

// Initialize scanner when DOM is loaded
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        BarcodeScanner.init();
    });
}
