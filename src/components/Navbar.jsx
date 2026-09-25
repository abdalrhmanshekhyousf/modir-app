import React, { useState } from 'react';
import { 
  Sun, Moon, ShoppingBag, Store, History, RefreshCw, 
  Sparkles, Menu, X, DollarSign, Coins, CreditCard, TrendingUp 
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  exchangeRate,
  setExchangeRate,
  currency,
  setCurrency
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // قائمة العناصر شاملة التبويب الجديد للأرباح والتقارير
  const navItems = [
    { id: 'pos', label: 'نقطة البيع', icon: ShoppingBag },
    { id: 'products', label: 'المنتجات', icon: Store },
    { id: 'invoices', label: 'الفواتير', icon: History },
    { id: 'debts', label: 'الديون', icon: CreditCard },
    { id: 'reports', label: 'الأرباح والتقارير', icon: TrendingUp },
  ];

  const handleTabChange = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const toggleCurrency = () => {
    if (setCurrency) {
      setCurrency(prev => prev === 'USD' ? 'SYP' : 'USD');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-colors duration-300 border-b bg-stone-100/90 dark:bg-zinc-950/90 backdrop-blur-xl border-stone-200/80 dark:border-zinc-800/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* الشعار واسم النظام */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-zinc-950 font-black shadow-md">
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm tracking-wide text-stone-900 dark:text-zinc-100">
                  نظام المبيعات
                </span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-stone-500 dark:text-zinc-400">
                إدارة الفواتير والتقارير
              </span>
            </div>
          </div>

          {/* تبويبات التنقل لسطح المكتب */}
          <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl bg-stone-200/60 dark:bg-zinc-900/80 border border-stone-300/40 dark:border-zinc-800/80 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-300/40 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* الأدوات: سعر الصرف، العملة، والثيم */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* حقل تعديل سعر الصرف */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-black shadow-sm">
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin-slow shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">1$ =</span>
              {isEditingRate ? (
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate && setExchangeRate(Number(e.target.value))}
                  onBlur={() => setIsEditingRate(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingRate(false)}
                  autoFocus
                  className="w-16 sm:w-20 px-1 py-0.5 rounded-lg bg-stone-100 dark:bg-zinc-900 border border-amber-500 text-center font-bold focus:outline-none"
                />
              ) : (
                <span
                  onClick={() => setIsEditingRate(true)}
                  title="انقر لتعديل سعر الصرف يدوياً"
                  className="cursor-pointer hover:underline underline-offset-2 font-black text-stone-900 dark:text-zinc-100 px-1"
                >
                  {exchangeRate?.toLocaleString()}
                </span>
              )}
              <span className="text-[10px] sm:text-xs">ل.س</span>
            </div>

            {/* زر تبديل العملة */}
            {setCurrency && (
              <button
                onClick={toggleCurrency}
                title="تبديل عرض العملة"
                className="flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-stone-200/80 dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 hover:text-amber-500 border border-stone-300/60 dark:border-zinc-800/80 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {currency === 'USD' ? (
                  <>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>USD</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>SYP</span>
                  </>
                )}
              </button>
            )}

            {/* زر تبديل الثيم */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "التحويل للوضع الفاتح" : "التحويل للوضع الداكن"}
              aria-label="Toggle Theme"
              className="p-2 sm:p-2.5 rounded-2xl bg-stone-200/80 dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 border border-stone-300/60 dark:border-zinc-800/80 active:scale-90 transition-all cursor-pointer shadow-sm"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-90" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* زر القائمة للشاشات الصغيرة */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-2xl bg-stone-200/80 dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 border border-stone-300/60 dark:border-zinc-800/80 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* القائمة المنسدلة للجوال */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200/80 dark:border-zinc-800/80 bg-stone-100/95 dark:bg-zinc-950/95 backdrop-blur-2xl p-3 space-y-1.5 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/60 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}