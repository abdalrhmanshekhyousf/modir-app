import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import POS from './components/POS';
import Products from './components/Products';
import Invoices from './components/Invoices';
import Debts from './components/Debts';
import Reports from './components/Reports';
import { 
  subscribeToProducts, 
  subscribeToInvoices, 
  subscribeToDebts,
  subscribeToCategories
} from './services/firestoreService';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [darkMode, setDarkMode] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(15000);
  const [currency, setCurrency] = useState('USD');

  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [debts, setDebts] = useState([]);
  const [categories, setCategories] = useState(['الكل', 'وجبات', 'مشروبات', 'حلويات', 'ساندويش', 'إضافات']);
  const [loading, setLoading] = useState(true);

  // جلب البيانات واستماع التحديثات الحية من Firestore (بما فيها الأقسام)
  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts((data) => setProducts(data));
    const unsubscribeInvoices = subscribeToInvoices((data) => setInvoices(data));
    const unsubscribeDebts = subscribeToDebts((data) => setDebts(data));
    const unsubscribeCategories = subscribeToCategories((data) => setCategories(data));

    setLoading(false);

    return () => {
      unsubscribeProducts();
      unsubscribeInvoices();
      unsubscribeDebts();
      unsubscribeCategories();
    };
  }, []);

  // التحكم بوضع الثيم
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-amber-500 flex items-center justify-center font-bold">
        جاري الاتصال بقاعدة البيانات السحابية...
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-stone-50 text-stone-900'}`} dir="rtl">
      
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        exchangeRate={exchangeRate}
        setExchangeRate={setExchangeRate}
        currency={currency}
        setCurrency={setCurrency}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          <POS
            products={products}
            setProducts={setProducts}
            invoices={invoices}
            setInvoices={setInvoices}
            exchangeRate={exchangeRate}
            currency={currency}
          />
        )}

        {activeTab === 'products' && (
          <Products
            products={products}
            setProducts={setProducts}
            categories={categories}
            exchangeRate={exchangeRate}
            currency={currency}
          />
        )}

        {activeTab === 'invoices' && (
          <Invoices
            invoices={invoices}
            setInvoices={setInvoices}
            exchangeRate={exchangeRate}
          />
        )}

        {activeTab === 'debts' && (
          <Debts
            debts={debts}
            setDebts={setDebts}
            exchangeRate={exchangeRate}
            currency={currency}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            invoices={invoices}
            products={products}
            exchangeRate={exchangeRate}
            currency={currency}
          />
        )}
      </main>
    </div>
  );
}