// Local Storage Management
const StorageManager = {
  // Keys
  FOODS_KEY: 'calorie_tracker_foods',
  HISTORY_KEY: 'calorie_tracker_history',
  CALC_DRAFT_KEY: 'calorie_tracker_calc_draft',

  // Initialize with sample data
  init() {
    this.translateExistingData();
    this.populateMissingFoods();
  },

  // Translation Mapping (English -> Arabic)
  getTranslationMap() {
    return {
      // Fruits
      'apple': 'تفاح', 'banana': 'موز', 'orange': 'برتقال', 'strawberries': 'فراولة',
      'grapes': 'عنب', 'blueberries': 'توت أزرق', 'watermelon': 'بطيخ',
      'pineapple': 'أناناس', 'peach': 'خوخ', 'kiwi': 'كيوي',
      // Meats
      'chicken breast': 'صدر دجاج', 'ground beef': 'لحم بقري مفروم',
      'sirloin steak': 'ستيك سيرلوين', 'salmon': 'سلمون', 'bacon': 'بيكون',
      'turkey breast': 'صدر ديك رومي', 'pork chop': 'ريش غنم',
      // Dairy
      'whole milk': 'حليب كامل الدسم', 'skim milk': 'حليب خالي الدسم',
      'cheddar cheese': 'جبنة شيدر', 'brie': 'جبنة بري', 'mozzarella': 'جبنة موتزاريللا',
      'camembert': 'جبنة كاميمبير', 'gouda': 'جبنة جودا', 'parmesan': 'جبنة بارميزان',
      'emmental': 'جبنة إيمنتال', 'roquefort': 'جبنة ريكفورد',
      // Grains
      'white bread': 'خبز أبيض', 'whole wheat bread': 'خبز قمح كامل',
      'baguette': 'باجيت فرنسي', 'sourdough': 'خبز بالحامض', 'rye bread': 'خبز الجاودار',
      'ciabatta': 'خبز تشاباتا', 'pita bread': 'خبز بيتا', 'croissant': 'كرواسون',
      // Vegetables
      'broccoli': 'بروكلي', 'spinach': 'سبانخ', 'carrots': 'جزر', 'tomato': 'طماطم',
      'cucumber': 'خيار', 'sweet potato': 'بطاطا حلوة', 'eggplant': 'باذنجان', 'zucchini': 'كوسة',
      // Categories
      'fruits': 'فواكه', 'meats': 'لحوم', 'dairy': 'ألبان', 'grains': 'مخبوزات', 'vegetables': 'خضروات'
    };
  },

  // Translate existing database and history entries
  translateExistingData() {
    const map = this.getTranslationMap();
    let updated = false;

    // 1. Translate Foods Database
    const foods = this.getFoods();
    foods.forEach(food => {
      const lowerName = food.name.toLowerCase();
      const lowerCat = food.category ? food.category.toLowerCase() : '';

      if (map[lowerName]) {
        food.name = map[lowerName];
        updated = true;
      }
      if (map[lowerCat]) {
        food.category = map[lowerCat];
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
    }

    // 2. Translate History
    const history = this.getHistory();
    let historyUpdated = false;
    history.forEach(entry => {
      entry.foods.forEach(food => {
        const lowerName = food.name.toLowerCase();
        if (map[lowerName]) {
          food.name = map[lowerName];
          historyUpdated = true;
        }
      });
    });

    if (historyUpdated) {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
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
    food.hasBarcode = food.hasBarcode || false;
    foods.push(food);
    localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
    return food;
  },

  updateFood(id, updatedFood) {
    const foods = this.getFoods();
    const index = foods.findIndex(f => f.id === id);
    if (index !== -1) {
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
    return this.getFoods().find(f => f.id === id);
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
    history.unshift(calculation);
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

  // Calculator Draft Operations
  getCalcDraft() {
    const draft = localStorage.getItem(this.CALC_DRAFT_KEY);
    return draft ? JSON.parse(draft) : [];
  },

  saveCalcDraft(foods) {
    localStorage.setItem(this.CALC_DRAFT_KEY, JSON.stringify(foods));
  },

  clearCalcDraft() {
    localStorage.removeItem(this.CALC_DRAFT_KEY);
  },

  // Method to merge sample foods without overwriting user data
  populateMissingFoods() {
    const currentFoods = this.getFoods();
    const samples = this.getSampleData();
    let updated = false;

    samples.forEach(sample => {
      // Check if this food (Arabic name) already exists
      if (!currentFoods.some(f => f.name === sample.name)) {
        currentFoods.push({
          ...sample,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          createdAt: new Date().toISOString()
        });
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(this.FOODS_KEY, JSON.stringify(currentFoods));
      console.log('Arabic Database updated');
    }
  },

  // Expanded Arabic sample data
  getSampleData() {
    return [
      // فواكه (Fruits)
      { name: 'تفاح', category: 'فواكه', servingSize: 'ثمرة متوسطة (182 جم)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, salt: 0.002 },
      { name: 'موز', category: 'فواكه', servingSize: 'ثمرة متوسطة (118 جم)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, salt: 0.001 },
      { name: 'برتقال', category: 'فواكه', servingSize: 'ثمرة متوسطة (131 جم)', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, salt: 0 },
      { name: 'فراولة', category: 'فواكه', servingSize: 'كوب (152 جم)', calories: 49, protein: 1, carbs: 12, fat: 0.5, salt: 0.002 },
      { name: 'عنب', category: 'فواكه', servingSize: 'كوب (151 جم)', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, salt: 0.003 },
      { name: 'توت أزرق', category: 'فواكه', servingSize: 'كوب (148 جم)', calories: 84, protein: 1.1, carbs: 21, fat: 0.5, salt: 0.001 },
      { name: 'بطيخ', category: 'فواكه', servingSize: '100جم', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.1, salt: 0.001 },
      { name: 'أناناس', category: 'فواكه', servingSize: '100جم', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, salt: 0.001 },
      { name: 'خوخ', category: 'فواكه', servingSize: '100جم', calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, salt: 0 },
      { name: 'كيوي', category: 'فواكه', servingSize: '100جم', calories: 61, protein: 1.1, carbs: 15, fat: 0.5, salt: 0.003 },

      // لحوم (Meats)
      { name: 'صدر دجاج', category: 'لحوم', servingSize: '100جم (مطبوخ)', calories: 165, protein: 31, carbs: 0, fat: 3.6, salt: 0.074 },
      { name: 'لحم بقري مفروم', category: 'لحوم', servingSize: '100جم (مطبوخ)', calories: 250, protein: 26, carbs: 0, fat: 15, salt: 0.07 },
      { name: 'ستيك سيرلوين', category: 'لحوم', servingSize: '100جم (مطبوخ)', calories: 243, protein: 27, carbs: 0, fat: 14, salt: 0.05 },
      { name: 'سلمون', category: 'لحوم', servingSize: '100جم (مطبوخ)', calories: 206, protein: 22, carbs: 0, fat: 12, salt: 0.06 },
      { name: 'بيكون', category: 'لحوم', servingSize: '100جم', calories: 541, protein: 37, carbs: 1.4, fat: 42, salt: 1.5 },
      { name: 'صدر ديك رومي', category: 'لحوم', servingSize: '100جم', calories: 135, protein: 30, carbs: 0, fat: 1, salt: 0.06 },
      { name: 'ريش غنم', category: 'لحوم', servingSize: '100جم', calories: 294, protein: 25, carbs: 0, fat: 21, salt: 0.07 },

      // ألبان وأجبان (Dairy & Cheese)
      { name: 'حليب كامل الدسم', category: 'ألبان', servingSize: 'كوب (244 جم)', calories: 149, protein: 8, carbs: 12, fat: 8, salt: 0.1 },
      { name: 'حليب خالي الدسم', category: 'ألبان', servingSize: 'كوب', calories: 83, protein: 8, carbs: 12, fat: 0.2, salt: 0.1 },
      { name: 'جبنة شيدر', category: 'ألبان', servingSize: '100جم', calories: 402, protein: 25, carbs: 1.3, fat: 33, salt: 1.6 },
      { name: 'جبنة بري', category: 'ألبان', servingSize: '100جم', calories: 334, protein: 21, carbs: 0.5, fat: 28, salt: 1.6 },
      { name: 'جبنة موتزاريللا', category: 'ألبان', servingSize: '100جم', calories: 280, protein: 22, carbs: 2.2, fat: 17, salt: 1.2 },
      { name: 'جبنة كاميمبير', category: 'ألبان', servingSize: '100جم', calories: 300, protein: 20, carbs: 0.5, fat: 24, salt: 1.8 },
      { name: 'جبنة جودا', category: 'ألبان', servingSize: '100جم', calories: 356, protein: 25, carbs: 2.2, fat: 27, salt: 2.1 },
      { name: 'جبنة بارميزان', category: 'ألبان', servingSize: '100جم', calories: 431, protein: 38, carbs: 4.1, fat: 29, salt: 1.7 },
      { name: 'جبنة إيمنتال', category: 'ألبان', servingSize: '100جم', calories: 380, protein: 29, carbs: 0, fat: 30, salt: 0.5 },
      { name: 'جبنة ريكفورد', category: 'ألبان', servingSize: '100جم', calories: 369, protein: 22, carbs: 2, fat: 31, salt: 4.5 },

      // حبوب ومخبوزات (Grains & Breads)
      { name: 'خبز أبيض', category: 'مخبوزات', servingSize: 'شريحة (25 جم)', calories: 67, protein: 2, carbs: 13, fat: 1, salt: 0.15 },
      { name: 'خبز قمح كامل', category: 'مخبوزات', servingSize: 'شريحة (28 جم)', calories: 81, protein: 4, carbs: 14, fat: 1, salt: 0.14 },
      { name: 'باجيت فرنسي', category: 'مخبوزات', servingSize: '100جم', calories: 274, protein: 9, carbs: 56, fat: 1.2, salt: 1.5 },
      { name: 'خبز بالحامض', category: 'مخبوزات', servingSize: 'شريحة', calories: 93, protein: 4, carbs: 18, fat: 0.6, salt: 0.2 },
      { name: 'خبز الجاودار', category: 'مخبوزات', servingSize: '100جم', calories: 259, protein: 9, carbs: 48, fat: 3.3, salt: 1.5 },
      { name: 'خبز تشاباتا', category: 'مخبوزات', servingSize: '100جم', calories: 260, protein: 8.5, carbs: 51, fat: 2.5, salt: 1.2 },
      { name: 'خبز بيتا', category: 'مخبوزات', servingSize: '100جم', calories: 275, protein: 9, carbs: 55, fat: 1.2, salt: 1.3 },
      { name: 'كرواسون', category: 'مخبوزات', servingSize: '100جم', calories: 406, protein: 8, carbs: 46, fat: 21, salt: 0.5 },

      // خضروات (Vegetables)
      { name: 'بروكلي', category: 'خضروات', servingSize: 'كوب (91 جم)', calories: 31, protein: 2.5, carbs: 6, fat: 0.4, salt: 0.03 },
      { name: 'سبانخ', category: 'خضروات', servingSize: 'كوب خام', calories: 7, protein: 0.9, carbs: 1, fat: 0.1, salt: 0.02 },
      { name: 'جزر', category: 'خضروات', servingSize: '100جم', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, salt: 0.07 },
      { name: 'طماطم', category: 'خضروات', servingSize: '100جم', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, salt: 0.005 },
      { name: 'خيار', category: 'خضروات', servingSize: '100جم', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, salt: 0.002 },
      { name: 'بطاطا حلوة', category: 'خضروات', servingSize: '100جم', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, salt: 0.055 },
      { name: 'باذنجان', category: 'خضروات', servingSize: '100جم', calories: 25, protein: 1, carbs: 6, fat: 0.2, salt: 0.002 },
      { name: 'كوسة', category: 'خضروات', servingSize: '100جم', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, salt: 0.008 }
    ];
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  StorageManager.init();
}
