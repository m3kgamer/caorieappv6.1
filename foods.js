// Food Management Page Logic
class FoodManager {
  constructor() {
    this.foodsList = document.getElementById('foodsList');
    this.searchInput = document.getElementById('searchInput');
    this.addFoodBtn = document.getElementById('addFoodBtn');
    this.foodModal = document.getElementById('foodModal');
    this.foodForm = document.getElementById('foodForm');
    this.modalTitle = document.getElementById('modalTitle');
    this.closeModalBtn = document.getElementById('closeModal');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.barcodeInput = document.getElementById('barcodeImage');
    this.barcodePreview = document.getElementById('barcodePreview');
    this.barcodePreviewImage = document.getElementById('barcodePreviewImage');
    this.removeBarcodeBtn = document.getElementById('removeBarcodeBtn');

    // Barcode input method elements
    this.galleryMethodBtn = document.getElementById('galleryMethodBtn');
    this.cameraMethodBtn = document.getElementById('cameraMethodBtn');
    this.manualMethodBtn = document.getElementById('manualMethodBtn');
    this.galleryMethod = document.getElementById('galleryMethod');
    this.cameraMethod = document.getElementById('cameraMethod');
    this.manualMethod = document.getElementById('manualMethod');
    this.scanBarcodeInFormBtn = document.getElementById('scanBarcodeInFormBtn');
    this.scannedBarcodeDisplay = document.getElementById('scannedBarcodeDisplay');
    this.scannedBarcodeValue = document.getElementById('scannedBarcodeValue');
    this.manualBarcodeInput = document.getElementById('manualBarcodeInput');

    this.editingFoodId = null;
    this.currentBarcodeFile = null;
    this.currentBarcodeValue = null;
    this.currentBarcodeMethod = 'gallery'; // gallery, camera, or manual

    this.init();
  }

  init() {
    this.renderFoods();
    this.attachEventListeners();
  }

  attachEventListeners() {
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    this.addFoodBtn.addEventListener('click', () => {
      this.openModal();
    });

    this.closeModalBtn.addEventListener('click', () => {
      this.closeModal();
    });

    this.cancelBtn.addEventListener('click', () => {
      this.closeModal();
    });

    this.foodForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveFood();
    });

    // Barcode upload handling
    this.barcodeInput.addEventListener('change', (e) => {
      this.handleBarcodeUpload(e);
    });

    this.removeBarcodeBtn.addEventListener('click', () => {
      this.clearBarcodePreview();
    });

    // Barcode input method switching
    this.galleryMethodBtn?.addEventListener('click', () => {
      this.switchBarcodeMethod('gallery');
    });

    this.cameraMethodBtn?.addEventListener('click', () => {
      this.switchBarcodeMethod('camera');
    });

    this.manualMethodBtn?.addEventListener('click', () => {
      this.switchBarcodeMethod('manual');
    });

    // Camera scan in form
    this.scanBarcodeInFormBtn?.addEventListener('click', () => {
      this.openCameraScanInForm();
    });

    // Close modal on outside click
    this.foodModal.addEventListener('click', (e) => {
      if (e.target === this.foodModal) {
        this.closeModal();
      }
    });
  }

  handleSearch(query) {
    const foods = StorageManager.searchFoods(query);
    this.renderFoods(foods);
  }

  async handleBarcodeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload a valid image file', 'error');
      this.barcodeInput.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image size must be less than 5MB', 'error');
      this.barcodeInput.value = '';
      return;
    }

    this.currentBarcodeFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.barcodePreviewImage.src = e.target.result;
      this.barcodePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  clearBarcodePreview() {
    this.barcodeInput.value = '';
    this.currentBarcodeFile = null;
    this.currentBarcodeValue = null;
    this.barcodePreviewImage.src = '';
    this.barcodePreview.classList.add('hidden');
    this.scannedBarcodeDisplay?.classList.add('hidden');
    this.manualBarcodeInput.value = '';
  }

  switchBarcodeMethod(method) {
    this.currentBarcodeMethod = method;

    // Update button styles
    const buttons = [this.galleryMethodBtn, this.cameraMethodBtn, this.manualMethodBtn];
    const methods = [this.galleryMethod, this.cameraMethod, this.manualMethod];

    buttons.forEach(btn => {
      btn.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-700');
      btn.classList.add('border-gray-300', 'text-gray-600');
    });

    methods.forEach(m => m.classList.add('hidden'));

    // Activate selected method and handle validations
    if (method === 'gallery') {
      this.galleryMethodBtn.classList.remove('border-gray-300', 'text-gray-600');
      this.galleryMethodBtn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
      this.galleryMethod.classList.remove('hidden');

      // If adding new food, require file
      if (!this.editingFoodId) {
        this.barcodeInput.setAttribute('required', 'required');
      }
    } else if (method === 'camera') {
      this.cameraMethodBtn.classList.remove('border-gray-300', 'text-gray-600');
      this.cameraMethodBtn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
      this.cameraMethod.classList.remove('hidden');

      this.barcodeInput.removeAttribute('required');
    } else if (method === 'manual') {
      this.manualMethodBtn.classList.remove('border-gray-300', 'text-gray-600');
      this.manualMethodBtn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
      this.manualMethod.classList.remove('hidden');

      this.barcodeInput.removeAttribute('required');
    }
  }

  openCameraScanInForm() {
    BarcodeScanner.openScanner((barcode) => {
      this.currentBarcodeValue = barcode;
      this.scannedBarcodeValue.textContent = barcode;
      this.scannedBarcodeDisplay.classList.remove('hidden');
      console.log('Scanned barcode in form:', barcode);
    });
  }

  renderFoods(foods = null) {
    const foodsToRender = foods || StorageManager.getFoods();

    if (foodsToRender.length === 0) {
      this.foodsList.innerHTML = `
        <div class="col-span-full text-center py-16 text-gray-500">
          <svg class="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <p class="text-xl mb-2">No foods yet</p>
          <p class="text-sm">Click "Add Food" to create your first entry</p>
        </div>
      `;
      return;
    }

    this.foodsList.innerHTML = foodsToRender.map((food, index) => `
      <div class="glass-card p-6 rounded-2xl stagger-item" style="animation-delay: ${index * 0.05}s">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-800 mb-1">${food.name}</h3>
            <span class="inline-block px-3 py-1 text-xs rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
              ${food.category || 'Other'}
            </span>
            ${food.hasBarcode ? '<span class="ml-2 inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">📷 Has Barcode</span>' : ''}
          </div>
          <div class="flex gap-2">
            <button onclick="foodManager.editFood('${food.id}')" 
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="foodManager.deleteFood('${food.id}')" 
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        
        ${food.hasBarcode ? `<div class="mb-4" id="barcode-container-${food.id}"><div class="text-sm text-gray-500 italic">Loading barcode...</div></div>` : ''}
        
        <div class="mb-4 text-sm text-gray-600">
          <span class="font-medium">Serving Size:</span> ${food.servingSize}
        </div>
        
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
            <div class="text-2xl font-bold text-orange-600">${food.calories}</div>
            <div class="text-xs text-gray-600 uppercase mt-1">Calories</div>
          </div>
          <div class="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div class="text-2xl font-bold text-blue-600">${food.protein}g</div>
            <div class="text-xs text-gray-600 uppercase mt-1">Protein</div>
          </div>
          <div class="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div class="text-2xl font-bold text-green-600">${food.carbs}g</div>
            <div class="text-xs text-gray-600 uppercase mt-1">Carbs</div>
          </div>
          <div class="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
            <div class="text-2xl font-bold text-yellow-600">${food.fat}g</div>
            <div class="text-xs text-gray-600 uppercase mt-1">Fat</div>
          </div>
          <div class="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl col-span-2">
            <div class="text-2xl font-bold text-purple-600">${food.salt}g</div>
            <div class="text-xs text-gray-600 uppercase mt-1">Salt</div>
          </div>
        </div>
      </div>
    `).join('');

    // Load and display barcodes for foods that have them
    foodsToRender.forEach(async (food) => {
      if (food.hasBarcode) {
        const barcodeData = await BarcodeDB.getBarcodeImage(food.id);
        if (barcodeData) {
          const container = document.getElementById(`barcode-container-${food.id}`);
          if (container) {
            container.innerHTML = `
                            <p class="text-xs text-gray-600 mb-2">Barcode:</p>
                            <img src="${barcodeData.imageData}" alt="Barcode" class="h-20 border border-gray-300 rounded-lg shadow-sm">
                        `;
          }
        }
      }
    });
  }

  async openModal(food = null) {
    this.editingFoodId = food ? food.id : null;
    this.modalTitle.textContent = food ? 'Edit Food' : 'Add New Food';

    if (food) {
      document.getElementById('foodName').value = food.name;
      document.getElementById('foodCategory').value = food.category || '';
      document.getElementById('servingSize').value = food.servingSize;
      document.getElementById('calories').value = food.calories;
      document.getElementById('protein').value = food.protein;
      document.getElementById('carbs').value = food.carbs;
      document.getElementById('fat').value = food.fat;
      document.getElementById('salt').value = food.salt;

      // Load existing barcode if available
      if (food.hasBarcode) {
        const barcodeData = await BarcodeDB.getBarcodeImage(food.id);
        if (barcodeData) {
          this.barcodePreviewImage.src = barcodeData.imageData;
          this.barcodePreview.classList.remove('hidden');
          this.barcodeInput.removeAttribute('required');
        }
      }
    } else {
      this.foodForm.reset();
      this.clearBarcodePreview();
      this.barcodeInput.setAttribute('required', 'required');
    }

    this.foodModal.classList.remove('hidden');
    this.foodModal.classList.add('flex');
    setTimeout(() => {
      this.foodModal.querySelector('.scale-in').style.opacity = '1';
    }, 10);
  }

  closeModal() {
    this.foodModal.classList.add('hidden');
    this.foodModal.classList.remove('flex');
    this.editingFoodId = null;
    this.currentBarcodeFile = null;
    this.foodForm.reset();
    this.clearBarcodePreview();
  }

  async saveFood() {
    const formData = {
      name: document.getElementById('foodName').value,
      category: document.getElementById('foodCategory').value,
      servingSize: document.getElementById('servingSize').value,
      calories: parseFloat(document.getElementById('calories').value),
      protein: parseFloat(document.getElementById('protein').value),
      carbs: parseFloat(document.getElementById('carbs').value),
      fat: parseFloat(document.getElementById('fat').value),
      salt: parseFloat(document.getElementById('salt').value)
    };

    // Handle barcode based on input method
    let foodId = this.editingFoodId;
    let barcodeValue = null;

    // Get barcode value based on method
    if (this.currentBarcodeMethod === 'camera') {
      barcodeValue = this.currentBarcodeValue;
    } else if (this.currentBarcodeMethod === 'manual') {
      barcodeValue = this.manualBarcodeInput.value.trim();
    }

    // Validate barcode is provided
    if (!this.currentBarcodeFile && !barcodeValue) {
      this.showToast('Please provide a barcode (upload, scan, or enter manually)', 'error');
      return;
    }

    if (this.editingFoodId) {
      // Update existing food
      if (this.currentBarcodeFile || barcodeValue) {
        formData.hasBarcode = true;
      }
      StorageManager.updateFood(this.editingFoodId, formData);

      // Save/update barcode
      if (this.currentBarcodeFile) {
        const base64 = await BarcodeDB.fileToBase64(this.currentBarcodeFile);
        await BarcodeDB.updateBarcodeImage(this.editingFoodId, base64, barcodeValue);
      } else if (barcodeValue) {
        // For camera/manual, generate a simple barcode image or just store the value
        await BarcodeDB.saveBarcodeImage(this.editingFoodId, null, barcodeValue);
      }

      this.showToast('Food updated successfully!', 'success');
    } else {
      // New food - barcode is required
      formData.hasBarcode = true;
      const savedFood = StorageManager.saveFood(formData);
      foodId = savedFood.id;

      // Save barcode
      if (this.currentBarcodeFile) {
        const base64 = await BarcodeDB.fileToBase64(this.currentBarcodeFile);
        await BarcodeDB.saveBarcodeImage(foodId, base64, barcodeValue);
      } else if (barcodeValue) {
        // For camera/manual, just store the barcode value
        await BarcodeDB.saveBarcodeImage(foodId, null, barcodeValue);
      }

      this.showToast('Food added successfully!', 'success');
    }

    this.closeModal();
    this.renderFoods();
  }

  editFood(id) {
    const food = StorageManager.getFoodById(id);
    if (food) {
      this.openModal(food);
    }
  }

  deleteFood(id) {
    const food = StorageManager.getFoodById(id);
    if (confirm(`Are you sure you want to delete "${food.name}"?`)) {
      StorageManager.deleteFood(id);
      this.renderFoods();
      this.showToast('Food deleted successfully!', 'success');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    toast.className = `fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-xl z-50 fade-in ${bgColor} text-white font-medium`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

// Initialize food manager when DOM is loaded
let foodManager;
document.addEventListener('DOMContentLoaded', () => {
  foodManager = new FoodManager();
});
