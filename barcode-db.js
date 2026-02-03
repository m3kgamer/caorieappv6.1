// Barcode Image Storage using IndexedDB
const BarcodeDB = {
    dbName: 'NutriTrackBarcodes',
    storeName: 'barcodes',
    version: 1,
    db: null,

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('foodId', 'foodId', { unique: true });
                    console.log('Barcode object store created');
                }
            };
        });
    },

    // Ensure DB is initialized
    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    },

    // Save barcode image (Base64) and optional barcode value
    async saveBarcodeImage(foodId, imageBase64, barcodeValue = null) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);

                // Check if already exists to merge
                const getRequest = objectStore.get(`barcode_${foodId}`);

                getRequest.onsuccess = () => {
                    const existingData = getRequest.result;
                    const barcodeData = existingData ? { ...existingData } : {
                        id: `barcode_${foodId}`,
                        foodId: foodId,
                        createdAt: new Date().toISOString()
                    };

                    if (imageBase64) barcodeData.imageData = imageBase64;
                    if (barcodeValue !== null) barcodeData.barcodeValue = barcodeValue;
                    barcodeData.updatedAt = new Date().toISOString();

                    const putRequest = objectStore.put(barcodeData);

                    putRequest.onsuccess = () => {
                        console.log('Barcode saved/merged successfully for food:', foodId);
                        resolve(barcodeData);
                    };

                    putRequest.onerror = () => {
                        console.error('Failed to put barcode:', putRequest.error);
                        reject(putRequest.error);
                    };
                };

                getRequest.onerror = () => {
                    console.error('Failed to check existing barcode:', getRequest.error);
                    reject(getRequest.error);
                };
            });
        } catch (error) {
            console.error('Error saving barcode:', error);
            throw error;
        }
    },

    // Get barcode image by food ID
    async getBarcodeImage(foodId) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const objectStore = transaction.objectStore(this.storeName);
                const index = objectStore.index('foodId');

                const request = index.get(foodId);

                request.onsuccess = () => {
                    resolve(request.result || null);
                };

                request.onerror = () => {
                    console.error('Failed to get barcode:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting barcode:', error);
            return null;
        }
    },

    // Get all barcodes
    async getAllBarcodes() {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const objectStore = transaction.objectStore(this.storeName);

                const request = objectStore.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    console.error('Failed to get all barcodes:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting all barcodes:', error);
            return [];
        }
    },

    // Update barcode image (modification allowed)
    async updateBarcodeImage(foodId, newImageBase64, barcodeValue = null) {
        try {
            await this.ensureDB();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const objectStore = transaction.objectStore(this.storeName);
                const index = objectStore.index('foodId');

                const getRequest = index.get(foodId);

                getRequest.onsuccess = () => {
                    const existingData = getRequest.result;

                    if (existingData) {
                        existingData.imageData = newImageBase64;
                        if (barcodeValue !== null) {
                            existingData.barcodeValue = barcodeValue;
                        }
                        existingData.updatedAt = new Date().toISOString();

                        const updateRequest = objectStore.put(existingData);

                        updateRequest.onsuccess = () => {
                            console.log('Barcode updated successfully for food:', foodId);
                            resolve(existingData);
                        };

                        updateRequest.onerror = () => {
                            console.error('Failed to update barcode:', updateRequest.error);
                            reject(updateRequest.error);
                        };
                    } else {
                        // If doesn't exist, create new
                        this.saveBarcodeImage(foodId, newImageBase64, barcodeValue)
                            .then(resolve)
                            .catch(reject);
                    }
                };

                getRequest.onerror = () => {
                    console.error('Failed to get existing barcode:', getRequest.error);
                    reject(getRequest.error);
                };
            });
        } catch (error) {
            console.error('Error updating barcode:', error);
            throw error;
        }
    },

    // Check if food has barcode
    async hasBarcode(foodId) {
        const barcode = await this.getBarcodeImage(foodId);
        return barcode !== null;
    },

    // Find food by barcode value (for scanner matching)
    async findFoodByBarcodeValue(barcodeValue) {
        try {
            const allBarcodes = await this.getAllBarcodes();
            const match = allBarcodes.find(b => b.barcodeValue === barcodeValue);
            return match ? match.foodId : null;
        } catch (error) {
            console.error('Error finding food by barcode value:', error);
            return null;
        }
    },

    // Convert file to Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = () => {
                reject(reader.error);
            };

            reader.readAsDataURL(file);
        });
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    BarcodeDB.init().catch(err => {
        console.error('Failed to initialize BarcodeDB:', err);
    });
}
