// History Page Logic
class HistoryManager {
  constructor() {
    this.historyList = document.getElementById('historyList');
    this.clearAllBtn = document.getElementById('clearAllBtn');

    this.init();
  }

  init() {
    this.renderHistory();
    this.attachEventListeners();
  }

  attachEventListeners() {
    if (this.clearAllBtn) {
      this.clearAllBtn.addEventListener('click', () => {
        this.clearAllHistory();
      });
    }
  }

  renderHistory() {
    const history = StorageManager.getHistory();

    if (history.length === 0) {
      this.historyList.innerHTML = `
        <div class="col-span-full text-center py-16 text-gray-500">
          <svg class="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-xl mb-2">لا يوجد سجل حتى الآن</p>
          <p class="text-sm">حساباتك المحفوظة ستظهر هنا</p>
          <a href="index.html" class="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all">
            ابدأ الحساب
          </a>
        </div>
      `;

      if (this.clearAllBtn) {
        this.clearAllBtn.disabled = true;
        this.clearAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }
      return;
    }

    if (this.clearAllBtn) {
      this.clearAllBtn.disabled = false;
      this.clearAllBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    this.historyList.innerHTML = history.map((entry, index) => {
      const date = new Date(entry.date);
      const formattedDate = date.toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="glass-card p-6 rounded-2xl stagger-item" style="animation-delay: ${index * 0.05}s">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-bold text-gray-800">${formattedDate}</h3>
              <p class="text-sm text-gray-500">${formattedTime}</p>
            </div>
            <button onclick="historyManager.deleteEntry('${entry.id}')" 
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>

          <!-- الأطعمة -->
          <div class="mb-4 p-4 bg-white bg-opacity-50 rounded-xl">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">الأطعمة:</h4>
            <ul class="space-y-1">
              ${entry.foods.map(food => `
                <li class="text-sm text-gray-600">
                  <span class="font-medium">${food.name}</span> 
                  <span class="text-gray-500">${food.grams || food.quantity || 100}g</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Totals -->
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <div class="text-xl font-bold text-orange-600">${entry.totals.calories}</div>
              <div class="text-xs text-gray-600 uppercase mt-1">سعرات</div>
            </div>
            <div class="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div class="text-xl font-bold text-blue-600">${entry.totals.protein}جم</div>
              <div class="text-xs text-gray-600 uppercase mt-1">بروتين</div>
            </div>
            <div class="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div class="text-xl font-bold text-green-600">${entry.totals.carbs}جم</div>
              <div class="text-xs text-gray-600 uppercase mt-1">كربوهيدرات</div>
            </div>
            <div class="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <div class="text-xl font-bold text-yellow-600">${entry.totals.fat}جم</div>
              <div class="text-xs text-gray-600 uppercase mt-1">دهون</div>
            </div>
            <div class="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl col-span-2 text-right px-4">
              <div class="text-xl font-bold text-purple-600">${entry.totals.salt}جم</div>
              <div class="text-xs text-gray-600 uppercase mt-1">ملح</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  deleteEntry(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      StorageManager.deleteCalculation(id);
      this.renderHistory();
      this.showToast('تم حذف السجل بنجاح!', 'success');
    }
  }

  clearAllHistory() {
    if (confirm('هل أنت متأكد من مسح السجل بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      StorageManager.clearHistory();
      this.renderHistory();
      this.showToast('تم مسح السجل بالكامل!', 'success');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-xl z-50 fade-in ${type === 'success' ? 'bg-green-500' : 'bg-blue-500'
      } text-white font-medium`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

// Initialize history manager when DOM is loaded
let historyManager;
document.addEventListener('DOMContentLoaded', () => {
  historyManager = new HistoryManager();
});
