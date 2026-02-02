// Calculator Page Logic
class Calculator {
  constructor() {
    this.selectedFoods = [];
    this.searchInput = document.getElementById('searchInput');
    this.foodList = document.getElementById('foodList');
    this.selectedFoodsList = document.getElementById('selectedFoodsList');
    this.totalsDisplay = document.getElementById('totalsDisplay');
    this.saveBtn = document.getElementById('saveCalculation');

    this.init();
  }

  init() {
    this.renderFoodList();
    this.attachEventListeners();
    this.updateTotals();
  }

  attachEventListeners() {
    this.searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    this.saveBtn.addEventListener('click', () => {
      this.saveCalculation();
    });

    // Barcode scanner integration - camera scan
    const scannerBtn = document.getElementById('scanBarcodeBtn');
    if (scannerBtn) {
      scannerBtn.addEventListener('click', () => {
        this.openBarcodeScanner();
      });
    }

    // Upload barcode image
    const uploadBtn = document.getElementById('uploadBarcodeBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.uploadBarcodeImage();
      });
    }

    // Manual barcode entry
    const manualBtn = document.getElementById('manualBarcodeBtn');
    const manualSection = document.getElementById('manualBarcodeSection');
    const searchManualBtn = document.getElementById('searchByManualBarcode');

    if (manualBtn && manualSection) {
      manualBtn.addEventListener('click', () => {
        manualSection.classList.toggle('hidden');
      });
    }

    if (searchManualBtn) {
      searchManualBtn.addEventListener('click', () => {
        const barcodeInput = document.getElementById('manualBarcodeCalc');
        if (barcodeInput && barcodeInput.value.trim()) {
          this.findAndAddFoodByBarcode(barcodeInput.value.trim());
          barcodeInput.value = '';
        }
      });
    }
  }

  async openBarcodeScanner() {
    BarcodeScanner.openScanner(async (barcode) => {
      console.log('Scanned barcode:', barcode);
      await this.findAndAddFoodByBarcode(barcode);
    });
  }

  async findAndAddFoodByBarcode(barcode) {
    // Find food by barcode value
    const foodId = await BarcodeDB.findFoodByBarcodeValue(barcode);

    if (foodId) {
      const food = StorageManager.getFoodById(foodId);
      if (food) {
        this.addFood(foodId);
        this.showToast(`✓ Added ${food.name} via barcode scan!`, 'success');
        return;
      }
    }

    // If no match found, show error
    this.showToast('⚠ No food found with this barcode. Please add it to your foods first.', 'error');
  }

  uploadBarcodeImage() {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.showToast('Processing barcode image...', 'info');

      // Here you would decode the barcode from the image
      // For now, we'll just show a message that this feature needs a barcode decoder
      this.showToast('📷 Barcode image uploaded. Note: Automatic barcode decoding from images is not yet implemented. Please use camera scan or manual entry.', 'info');

      // TODO: Integrate a barcode decoding library like jsQR or Quagga to decode the uploaded image
    };

    fileInput.click();
  }

  handleSearch(query) {
    const foods = StorageManager.searchFoods(query);
    this.renderFoodList(foods);
  }

  renderFoodList(foods = null) {
    const foodsToRender = foods || StorageManager.getFoods();

    if (foodsToRender.length === 0) {
      this.foodList.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p class="text-lg">No foods found</p>
          <a href="foods.html" class="text-blue-600 hover:text-blue-700 mt-2 inline-block">Add foods first</a>
        </div>
      `;
      return;
    }

    this.foodList.innerHTML = foodsToRender.map((food, index) => `
      <div class="glass-card p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform stagger-item" 
           onclick="calculator.addFood('${food.id}')" 
           style="animation-delay: ${index * 0.05}s">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-semibold text-gray-800">${food.name}</h3>
          <span class="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
            ${food.category || 'Other'}
          </span>
        </div>
        <p class="text-sm text-gray-600 mb-3">${food.servingSize}</p>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="text-center p-2 bg-white bg-opacity-50 rounded-lg">
            <div class="font-semibold text-orange-600">${food.calories}</div>
            <div class="text-gray-500">cal</div>
          </div>
          <div class="text-center p-2 bg-white bg-opacity-50 rounded-lg">
            <div class="font-semibold text-blue-600">${food.protein}g</div>
            <div class="text-gray-500">protein</div>
          </div>
          <div class="text-center p-2 bg-white bg-opacity-50 rounded-lg">
            <div class="font-semibold text-green-600">${food.carbs}g</div>
            <div class="text-gray-500">carbs</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  addFood(foodId) {
    const food = StorageManager.getFoodById(foodId);
    if (!food) return;

    const selectedFood = {
      ...food,
      quantity: 100, // Default to 100g
      uniqueId: Date.now().toString()
    };

    this.selectedFoods.push(selectedFood);
    this.renderSelectedFoods();
    this.updateTotals();

    // Show success feedback
    this.showToast(`Added ${food.name}`);
  }

  removeFood(uniqueId) {
    this.selectedFoods = this.selectedFoods.filter(f => f.uniqueId !== uniqueId);
    this.renderSelectedFoods();
    this.updateTotals();
  }

  updateQuantity(uniqueId, quantity) {
    const food = this.selectedFoods.find(f => f.uniqueId === uniqueId);
    if (food && quantity > 0) {
      food.quantity = parseFloat(quantity);
      this.updateTotals();
    }
  }

  renderSelectedFoods() {
    if (this.selectedFoods.length === 0) {
      this.selectedFoodsList.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <p>Select foods to calculate</p>
        </div>
      `;
      return;
    }

    this.selectedFoodsList.innerHTML = this.selectedFoods.map(food => `
      <div class="glass-card p-4 rounded-xl fade-in">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h4 class="font-semibold text-gray-800">${food.name}</h4>
            <p class="text-xs text-gray-500">Nutritional values per 100g</p>
          </div>
          <button onclick="calculator.removeFood('${food.uniqueId}')" 
                  class="text-red-500 hover:text-red-700 hover:scale-110 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600">Grams:</label>
          <input type="number" 
                 value="${food.quantity}" 
                 min="1" 
                 step="1"
                 onchange="calculator.updateQuantity('${food.uniqueId}', this.value)"
                 class="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        </div>
      </div>
    `).join('');
  }

  updateTotals() {
    const totals = this.selectedFoods.reduce((acc, food) => {
      const qty = food.quantity / 100; // Convert grams to 100g units
      return {
        calories: acc.calories + (food.calories * qty),
        protein: acc.protein + (food.protein * qty),
        carbs: acc.carbs + (food.carbs * qty),
        fat: acc.fat + (food.fat * qty),
        salt: acc.salt + (food.salt * qty)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, salt: 0 });

    this.totalsDisplay.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="glass-card p-6 rounded-2xl text-center scale-in">
          <div class="text-3xl font-bold gradient-text mb-2">${Math.round(totals.calories)}</div>
          <div class="text-sm text-gray-600 uppercase tracking-wide">Calories</div>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center scale-in" style="animation-delay: 0.1s">
          <div class="text-3xl font-bold text-blue-600 mb-2">${totals.protein.toFixed(1)}g</div>
          <div class="text-sm text-gray-600 uppercase tracking-wide">Protein</div>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center scale-in" style="animation-delay: 0.2s">
          <div class="text-3xl font-bold text-green-600 mb-2">${totals.carbs.toFixed(1)}g</div>
          <div class="text-sm text-gray-600 uppercase tracking-wide">Carbs</div>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center scale-in" style="animation-delay: 0.3s">
          <div class="text-3xl font-bold text-yellow-600 mb-2">${totals.fat.toFixed(1)}g</div>
          <div class="text-sm text-gray-600 uppercase tracking-wide">Fat</div>
        </div>
        <div class="glass-card p-6 rounded-2xl text-center scale-in" style="animation-delay: 0.4s">
          <div class="text-3xl font-bold text-purple-600 mb-2">${totals.salt.toFixed(2)}g</div>
          <div class="text-sm text-gray-600 uppercase tracking-wide">Salt</div>
        </div>
      </div>
    `;

    // Enable/disable save button
    this.saveBtn.disabled = this.selectedFoods.length === 0;
    if (this.selectedFoods.length === 0) {
      this.saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      this.saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  saveCalculation() {
    if (this.selectedFoods.length === 0) return;

    const totals = this.selectedFoods.reduce((acc, food) => {
      const qty = food.quantity / 100; // Convert grams to 100g units
      return {
        calories: acc.calories + (food.calories * qty),
        protein: acc.protein + (food.protein * qty),
        carbs: acc.carbs + (food.carbs * qty),
        fat: acc.fat + (food.fat * qty),
        salt: acc.salt + (food.salt * qty)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, salt: 0 });

    const calculation = {
      foods: this.selectedFoods.map(f => ({
        name: f.name,
        grams: f.quantity
      })),
      totals: {
        calories: Math.round(totals.calories),
        protein: parseFloat(totals.protein.toFixed(1)),
        carbs: parseFloat(totals.carbs.toFixed(1)),
        fat: parseFloat(totals.fat.toFixed(1)),
        salt: parseFloat(totals.salt.toFixed(2))
      }
    };

    StorageManager.saveCalculation(calculation);
    this.showToast('Calculation saved to history!', 'success');

    // Clear selection after save
    setTimeout(() => {
      this.selectedFoods = [];
      this.renderSelectedFoods();
      this.updateTotals();
    }, 1000);
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

// Initialize calculator when DOM is loaded
let calculator;
document.addEventListener('DOMContentLoaded', () => {
  calculator = new Calculator();
});
