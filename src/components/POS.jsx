import React, { useState } from 'react';
import {
  Search, ShoppingBag, Plus, Minus, Trash2, Printer, Send,
  PackageX
} from 'lucide-react';
import { addInvoiceToDB, updateProductInDB } from '../services/firestoreService';

export default function POS({
  products = [],
  invoices = [],
  exchangeRate = 15000,
  currency = 'USD'
}) {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountUSD, setDiscountUSD] = useState(0);

  const categories = ['الكل', 'وجبات', 'مشروبات', 'حلويات', 'ساندويش', 'إضافات'];

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('وصلت للحد الأقصى للمخزون المتوفر');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const product = products.find(p => p.id === id);
          const maxStock = product ? product.stock : 999;
          const newQty = item.quantity + delta;
          if (newQty > maxStock) {
            alert('الكمية المطلوبة تتجاوز المخزون المتوفر');
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const subtotalUSD = cart.reduce((sum, item) => sum + ((item.priceUSD || item.price || 0) * item.quantity), 0);
  const totalUSD = Math.max(0, subtotalUSD - parseFloat(discountUSD || 0));
  const totalSYP = totalUSD * exchangeRate;

  const handleCheckout = async (shouldSendWhatsApp = false) => {
    if (cart.length === 0) {
      alert('السلة فارغة');
      return;
    }

    try {
      // 1. تحديث المخزون في Firebase لكل منتج في السلة
      for (const cartItem of cart) {
        const prod = products.find(p => p.id === cartItem.id);
        if (prod) {
          const newStock = Math.max(0, prod.stock - cartItem.quantity);
          await updateProductInDB(cartItem.id, { stock: newStock });
        }
      }

      // 2. إنشاء الفاتورة الجديدة
      const newInvoice = {
        invoiceNumber: Math.floor(100000 + Math.random() * 900000).toString(),
        date: new Date().toLocaleString('ar-SY'),
        customerName: customerName.trim() || 'زبون عام',
        customerPhone: customerPhone.trim(),
        items: cart,
        subtotalUSD,
        discountUSD: parseFloat(discountUSD || 0),
        totalUSD,
        exchangeRate,
        status: 'paid',
        createdAt: new Date()
      };

      // 3. حفظ الفاتورة في Firestore
      await addInvoiceToDB(newInvoice);

      // 4. إرسال الواتساب إن طلب
      if (shouldSendWhatsApp && customerPhone.trim()) {
        let itemsText = cart.map(item => `${item.name} x ${item.quantity} = $${((item.priceUSD || item.price) * item.quantity).toFixed(2)}`).join('\n');
        const message = `فاتورة مبيعات\nرقم الفاتورة: #${newInvoice.invoiceNumber}\nالزبون: ${newInvoice.customerName}\n\n${itemsText}\n\nالإجمالي: $${totalUSD.toFixed(2)} (${totalSYP.toLocaleString()} ل.س)\nشكراً لتسوقكم معنا!`;
        window.open(`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      }

      // 5. إعادة ضبط السلة والحقول
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountUSD(0);
      alert('أتمت عملية البيع وتحديث المخزون بنجاح');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء حفظ الفاتورة في قاعدة البيانات.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
      <div className="lg:col-span-2 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="البحث برقم الباركود أو اسم المنتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition shadow-inner text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-stone-100/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-stone-300 dark:border-zinc-800">
            <PackageX className="w-12 h-12 mx-auto text-stone-400 dark:text-zinc-600 mb-2 opacity-60" />
            <p className="text-stone-600 dark:text-zinc-400 font-bold text-sm">لا يوجد منتجات لعرضها</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const priceUSD = product.priceUSD || product.price || 0;
              const priceSYP = priceUSD * exchangeRate;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`group relative p-3 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed bg-stone-200/50 dark:bg-zinc-900/30 border-stone-300 dark:border-zinc-800'
                      : 'bg-stone-100/90 dark:bg-zinc-900/90 border-stone-200/80 dark:border-zinc-800/80 hover:border-amber-500/80 hover:shadow-lg active:scale-95'
                  }`}
                >
                  <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-stone-200 dark:bg-zinc-800">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isOutOfStock ? (
                      <span className="absolute inset-0 bg-zinc-950/70 text-rose-400 font-black text-xs flex items-center justify-center backdrop-blur-xs">
                        نفدت الكمية
                      </span>
                    ) : (
                      <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-zinc-950/80 text-amber-400 backdrop-blur-md">
                        {product.stock} المتوفر
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-zinc-100 line-clamp-1">
                      {product.name}
                    </h4>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-amber-600 dark:text-amber-400 font-black text-sm">
                        ${priceUSD.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500">
                        {priceSYP.toLocaleString()} ل.س
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm h-fit sticky top-24">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-zinc-800">
            <h3 className="font-black text-stone-900 dark:text-zinc-100 text-base flex items-center gap-2">
              سلة البيع الحالية
              <ShoppingBag className="w-5 h-5 text-amber-500" />
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black">
              {cart.reduce((s, i) => s + i.quantity, 0)} عنصر
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto my-3 pr-1 text-xs">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-stone-400 dark:text-zinc-500 font-bold">
                السلة فارغة، انقر على أي منتج لإضافته
              </div>
            ) : (
              cart.map(item => {
                const itemPriceUSD = item.priceUSD || item.price || 0;
                return (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-200/50 dark:bg-zinc-950/50 border border-stone-200/50 dark:border-zinc-800/50">
                    <div className="flex-1 ml-2">
                      <h5 className="font-bold text-xs text-stone-900 dark:text-zinc-100 line-clamp-1">{item.name}</h5>
                      <span className="text-[10px] font-bold text-amber-500">${(itemPriceUSD * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-lg bg-stone-300/80 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 hover:bg-amber-500 hover:text-zinc-950 transition cursor-pointer">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black text-stone-900 dark:text-zinc-100 px-1">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-lg bg-stone-300/80 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 hover:bg-amber-500 hover:text-zinc-950 transition cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer mr-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="اسم الزبون (اختياري)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-xs font-bold focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="رقم الواتساب"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-xs font-bold focus:outline-none focus:border-amber-500 dir-ltr text-right"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-600 dark:text-zinc-400">الخصم ($):</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountUSD}
              onChange={(e) => setDiscountUSD(e.target.value)}
              className="w-20 px-2 py-1 rounded-lg bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 font-bold text-center text-xs"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-500 block">المبلغ الإجمالي</span>
              <span className="text-xl font-black text-amber-500">${totalUSD.toFixed(2)}</span>
            </div>
            <div className="text-left">
              <span className="text-xs font-black text-stone-700 dark:text-zinc-300">{totalSYP.toLocaleString()} ل.س</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCheckout(true)}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xs transition cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>واتساب</span>
            </button>
            <button
              onClick={() => handleCheckout(false)}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-black text-xs transition cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتثبيت</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}