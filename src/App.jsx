// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  FileText,
  Package,
  CreditCard,
  BarChart3,
  Moon,
  Sun,
  LogOut,
  Loader,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

import { auth } from './firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';

import AuthScreen from './components/AuthScreen';
import POS from './components/POS';
import Invoices from './components/Invoices';
import Products from './components/Products';
import Debts from './components/Debts';
import Reports from './components/Reports';

import { getProducts } from './services/dbServie';

const readStorage = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* تجاهل */
  }
};

const navItems = [
  { id: 'pos', label: 'نقطة البيع', short: 'البيع', icon: ShoppingBag },
  { id: 'invoices', label: 'الفواتير', short: 'الفواتير', icon: FileText },
  { id: 'products', label: 'المنتجات والمخزون', short: 'المخزون', icon: Package },
  { id: 'debts', label: 'الديون والعملاء', short: 'الديون', icon: CreditCard },
  { id: 'reports', label: 'التقارير', short: 'التقارير', icon: BarChart3 },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('pos');
  const [darkMode, setDarkMode] = useState(() => readStorage('modir-theme', 'dark') !== 'light');
  const [usdRate, setUsdRate] = useState(() => Number(readStorage('modir-usd-rate', '15000')) || 15000);
  const [products, setProducts] = useState([]);

  // تطبيق الثيم على مستوى الصفحة كاملة
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    writeStorage('modir-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    writeStorage('modir-usd-rate', String(usdRate));
  }, [usdRate]);

  // الاستماع لحالة المصادقة
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) setProducts([]);
    });
    return () => unsubscribe();
  }, []);

  // جلب المنتجات المفلترة للمستخدم الحالي
  const loadProducts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await getProducts(currentUser.uid);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) loadProducts();
  }, [activeTab, currentUser, loadProducts]);

  const handleLogout = async () => {
    if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      try {
        await signOut(auth);
        toast.success('تم تسجيل الخروج بنجاح');
      } catch {
        toast.error('حدث خطأ أثناء تسجيل الخروج');
      }
    }
  };

  const toaster = (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: 'var(--surface)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: 'var(--shadow-md)',
        },
      }}
    />
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3 text-muted" dir="rtl">
        <Loader className="w-7 h-7 animate-spin text-brand" />
        <p className="text-sm">جاري التحقق من الحساب...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        {toaster}
        <AuthScreen onLoginSuccess={(user) => setCurrentUser(user)} />
      </>
    );
  }

  const storeName = currentUser.displayName || 'متجري';

  return (
    <div className="min-h-screen bg-bg text-ink pb-24 md:pb-10" dir="rtl">
      {toaster}

      {/* ===== الهيدر ===== */}
      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* الشعار واسم المتجر */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand text-brand-fg flex items-center justify-center shrink-0 shadow-[0_6px_16px_-6px_var(--brand)]">
                <ShoppingBag className="w-5 h-5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 leading-tight">
                <h1 className="font-bold text-[15px] truncate">{storeName}</h1>
                <p className="text-[11px] text-muted truncate" dir="ltr">{currentUser.email}</p>
              </div>
            </div>

            {/* أدوات التحكم */}
            <div className="flex items-center gap-2 shrink-0">
              <label
                className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-line bg-surface text-xs font-semibold focus-within:border-brand focus-within:ring-4 focus-within:ring-[var(--ring)] transition"
                title="سعر صرف الدولار"
              >
                <span className="text-muted hidden sm:inline">$1 =</span>
                <input
                  type="number"
                  min="1"
                  value={usdRate}
                  onChange={(e) => setUsdRate(Number(e.target.value))}
                  className="w-16 sm:w-20 bg-transparent text-center focus:outline-none font-bold num text-ink"
                  aria-label="سعر صرف الدولار بالليرة"
                />
                <span className="text-muted text-[11px]">ل.س</span>
              </label>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="btn btn-secondary btn-icon"
                title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
                aria-label="تغيير المظهر"
              >
                {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              <button
                onClick={handleLogout}
                className="btn btn-danger-soft btn-icon sm:w-auto sm:px-3.5"
                title="تسجيل الخروج"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline text-[13px]">خروج</span>
              </button>
            </div>
          </div>

          {/* تبويبات سطح المكتب */}
          <nav className="hidden md:flex gap-1 -mb-px overflow-x-auto no-scrollbar" aria-label="التنقل الرئيسي">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-4 h-12 text-[13px] font-semibold transition-colors ${
                    isActive ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand' : ''}`} />
                  <span>{item.label}</span>
                  <span
                    className={`absolute inset-x-3 bottom-0 h-[2.5px] rounded-full transition-all ${
                      isActive ? 'bg-brand opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ===== المحتوى ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div key={activeTab} className="animate-fadeIn">
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
        </div>
      </main>

      {/* ===== شريط التنقل السفلي للموبايل ===== */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--surface)_90%,transparent)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
        aria-label="التنقل الرئيسي"
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 h-16 text-[10.5px] font-semibold transition-colors ${
                  isActive ? 'text-brand' : 'text-muted'
                }`}
              >
                <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${isActive ? 'bg-brand-soft' : ''}`}>
                  <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span>{item.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
