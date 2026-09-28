// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  FileText, 
  Package, 
  CreditCard, 
  BarChart3, 
  Moon, 
  Sun, 
  DollarSign, 
  LogOut,
  Loader,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

import { auth } from './firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// استيراد شاشة التسجيل
import AuthScreen from './components/AuthScreen';

// استيراد الصفحات
import POS from './components/POS';
import Invoices from './components/Invoices';
import Products from './components/Products';
import Debts from './components/Debts';
import Reports from './components/Reports';

import { getProducts } from './services/dbServie';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('pos');
  const [darkMode, setDarkMode] = useState(true);
  const [usdRate, setUsdRate] = useState(15000);
  const [products, setProducts] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // الاستماع لحالة المصادقة
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        setProducts([]); // تفريغ القائمة عند الخروج لضمان عدم تسرب البيانات
      }
    });
    return () => unsubscribe();
  }, []);

  // جلب المنتجات المفلترة للمستخدم الحالي
  const loadProducts = async () => {
    if (!currentUser) return;
    try {
      const data = await getProducts(currentUser.uid);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // إعطاء قيمة افتراضية مصفوفة فارغة في حال حدوث خطأ
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProducts();
    }
  }, [activeTab, currentUser]);

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    if (window.confirm('هل أنت تأكد من تسجيل الخروج؟')) {
      try {
        await signOut(auth);
        toast.success('تم تسجيل الخروج بنجاح');
      } catch (error) {
        toast.error('حدث خطأ أثناء تسجيل الخروج');
      }
    }
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false); // إغلاق القائمة عند التبديل في الجوال
  };

  // 1. شاشة التحميل الأولية
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 font-sans dir-rtl">
        <Loader className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm">جاري التحقق من الحساب والبيانات...</p>
      </div>
    );
  }

  // 2. إذا لم يكن المستخدم مسجلاً، اعرض AuthScreen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const navItems = [
    { id: 'pos', label: 'نقطة البيع (POS)', icon: ShoppingBag },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'products', label: 'المنتجات والأقسام', icon: Package },
    { id: 'debts', label: 'الديون والعملاء', icon: CreditCard },
    { id: 'reports', label: 'التقارير والتحليلات', icon: BarChart3 },
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-stone-100 text-stone-800'
    }`} dir="rtl">
      <Toaster position="top-center" reverseOrder={false} />

      {/* الهيدر العلوي */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* معلومات المستخدم والشعار */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-emerald-500 rounded-xl sm:rounded-2xl text-zinc-950 font-black shrink-0 shadow-sm">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h1 className="font-black text-xs sm:text-base tracking-wide truncate">
                  {currentUser.displayName || 'متجري الرقمي'}
                </h1>
                <Sparkles className="w-3 h-3 text-emerald-500 hidden xs:inline shrink-0" />
              </div>
              <p className="text-[10px] text-emerald-400 font-medium truncate">{currentUser.email}</p>
            </div>
          </div>

          {/* أدوات التحكم العلوية (سعر الصرف، الثيم، الخروج، وزر قائمة الجوال) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* سعر صرف الدولار */}
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-bold shadow-sm ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-emerald-400' : 'bg-stone-50 border-stone-200 text-emerald-600'
            }`}>
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">الصرف:</span>
              <input
                type="number"
                value={usdRate}
                onChange={(e) => setUsdRate(Number(e.target.value))}
                className="w-12 sm:w-16 bg-transparent text-center focus:outline-none font-black"
              />
              <span className="text-[10px]">ل.س</span>
            </div>

            {/* زر نمط الشاشة */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-sm ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700' : 'bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200'
              }`}
              title="تغيير المظهر"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* زر تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold shadow-sm cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">خروج</span>
            </button>

            {/* زر القائمة المنسدلة للجوال */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl border transition-all cursor-pointer ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-emerald-400' : 'bg-stone-100 border-stone-200 text-stone-700'
              }`}
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </header>

      {/* شريط التنقل لسطح المكتب */}
      <nav className={`hidden md:block border-b sticky top-16 z-30 transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 py-2.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : darkMode
                      ? 'text-stone-400 hover:bg-zinc-800 hover:text-stone-200'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* قائمة الجوال المنسدلة (تظهر فقط عند النقر على زر القائمة في الشاشات الصغيرة) */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-b sticky top-16 z-30 p-3 space-y-1.5 backdrop-blur-2xl transition-all shadow-xl animate-fadeIn ${
          darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-stone-200'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                    : darkMode
                    ? 'text-stone-300 hover:bg-zinc-900'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* المحتوى الرئيسي للمكونات */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'pos' && (
          <POS products={products} userId={currentUser.uid} darkMode={darkMode} usdRate={usdRate} onRefresh={loadProducts} />
        )}
        {activeTab === 'invoices' && (
          <Invoices userId={currentUser.uid} darkMode={darkMode} usdRate={usdRate} />
        )}
        {activeTab === 'products' && (
          <Products products={products} userId={currentUser.uid} darkMode={darkMode} usdRate={usdRate} onRefresh={loadProducts} />
        )}
        {activeTab === 'debts' && (
          <Debts userId={currentUser.uid} darkMode={darkMode} usdRate={usdRate} />
        )}
        {activeTab === 'reports' && (
          <Reports userId={currentUser.uid} darkMode={darkMode} usdRate={usdRate} />
        )}
      </main>
    </div>
  );
}