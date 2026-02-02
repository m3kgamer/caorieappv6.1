// Local Storage Management
const StorageManager = {
  // Keys
  FOODS_KEY: 'calorie_tracker_foods',
  HISTORY_KEY: 'calorie_tracker_history',

  // Initialize with sample data if empty
  init() {
    if (!this.getFoods().length) {
      this.initializeSampleFoods();
    }
  },

  // Foods CRUD Operations
  getFoods() {
    const foods = localStorage.getItem(this.FOODS_KEY);
    return foods ? JSON.parse(foods) : [];
  },

  saveFood(food) {
    const foods = this.getFoods();
    food.id = Date.now().toString();
    food.createdAt = new Date().toISOString();
    food.hasBarcode = food.hasBarcode || false; // Track if food has barcode
    foods.push(food);
    localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
    return food;
  },

  updateFood(id, updatedFood) {
    const foods = this.getFoods();
    const index = foods.findIndex(f => f.id === id);
    if (index !== -1) {
      // Preserve hasBarcode flag if not explicitly updated
      if (updatedFood.hasBarcode === undefined) {
        updatedFood.hasBarcode = foods[index].hasBarcode || false;
      }
      foods[index] = { ...foods[index], ...updatedFood, id };
      localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
      return foods[index];
    }
    return null;
  },

  deleteFood(id) {
    const foods = this.getFoods();
    const filtered = foods.filter(f => f.id !== id);
    localStorage.setItem(this.FOODS_KEY, JSON.stringify(filtered));
    return filtered;
  },

  getFoodById(id) {
    const foods = this.getFoods();
    return foods.find(f => f.id === id);
  },

  searchFoods(query) {
    const foods = this.getFoods();
    if (!query) return foods;

    const lowerQuery = query.toLowerCase();
    return foods.filter(food =>
      food.name.toLowerCase().includes(lowerQuery) ||
      (food.category && food.category.toLowerCase().includes(lowerQuery))
    );
  },

  // History CRUD Operations
  getHistory() {
    const history = localStorage.getItem(this.HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  },

  saveCalculation(calculation) {
    const history = this.getHistory();
    calculation.id = Date.now().toString();
    calculation.date = new Date().toISOString();
    history.unshift(calculation); // Add to beginning
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    return calculation;
  },

  deleteCalculation(id) {
    const history = this.getHistory();
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
    return filtered;
  },

  clearHistory() {
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify([]));
  },

  // Initialize with sample foods
  initializeSampleFoods() {
    const sampleFoods = [
      {
        id: '1',
        name: 'Chicken Breast',
        category: 'Protein',
        servingSize: '100g',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        salt: 0.07,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Brown Rice',
        category: 'Grains',
        servingSize: '100g',
        calories: 112,
        protein: 2.6,
        carbs: 24,
        fat: 0.9,
        salt: 0.005,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Broccoli',
        category: 'Vegetables',
        servingSize: '100g',
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        salt: 0.033,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Salmon',
        category: 'Protein',
        servingSize: '100g',
        calories: 208,
        protein: 20,
        carbs: 0,
        fat: 13,
        salt: 0.059,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Banana',
        category: 'Fruits',
        servingSize: '100g',
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fat: 0.3,
        salt: 0.001,
        createdAt: new Date().toISOString()
      },
      {
        id: '6',
        name: 'Almonds',
        category: 'Nuts',
        servingSize: '100g',
        calories: 579,
        protein: 21,
        carbs: 22,
        fat: 50,
        salt: 0.001,
        createdAt: new Date().toISOString()
      },
      {
        id: '7',
        name: 'Greek Yogurt',
        category: 'Dairy',
        servingSize: '100g',
        calories: 59,
        protein: 10,
        carbs: 3.6,
        fat: 0.4,
        salt: 0.036,
        createdAt: new Date().toISOString()
      },
      {
        id: '8',
        name: 'Sweet Potato',
        category: 'Vegetables',
        servingSize: '100g',
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fat: 0.1,
        salt: 0.055,
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem(this.FOODS_KEY, JSON.stringify(sampleFoods));
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  StorageManager.init();
}
