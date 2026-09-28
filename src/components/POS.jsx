// src/components/POS.jsx
import React, { useState } from 'react';
import { createTransaction, addDebt } from '../services/dbServie';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  CheckCircle, 
  Trash2, 
  Search, 
  User, 
  Phone, 
  Printer, 
  Send, 
  X, 
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';

export default function POS({ products = [], userId, darkMode, usdRate, onRefresh }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // حالات البحث
  const [searchTerm, setSearchTerm] = useState('');
  
  // حالات بيانات الزبون والفاتورة
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' or 'debt'

  // حالة مودال الطباعة والمعاينة
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  // إضافة للمنتجات للسلة
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalUSD = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const totalSYP = totalUSD * usdRate;

  // فلترة المنتجات بالاسم أو الباركود أو القسم
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  // إتمام العملية وحفظ الفاتورة / الدين
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentType === 'debt' && !customerName.trim()) {
      toast.error('يرجى إدخال اسم الزبون عند اختيار البيع بالدين');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        items: cart,
        totalAmountUSD: totalUSD,
        totalAmountSYP: totalSYP,
        usdRate: usdRate,
        customerName: customerName || 'زبون عام',
        customerPhone: customerPhone || '—',
        paymentType: paymentType, // cash أو debt
        createdAt: new Date().toISOString()
      };

      // 1. حفظ الفاتورة بالمعاملات العامة
      await createTransaction(transactionData, userId);

      // 2. إذا كانت العملية "دين"، نقوم بإضافتها لسجل الديون
      if (paymentType === 'debt') {
        await addDebt({
          customerName,
          customerPhone,
          amountUSD: totalUSD,
          amountSYP: totalSYP,
          details: cart.map(i => `${i.name} (${i.quantity})`).join(', '),
          date: new Date().toISOString()
        }, userId);
        toast.success('تم تسجبل الفاتورة في قائمة الديون');
      } else {
        toast.success('تمت عملية البيع بنجاح');
      }

      setCompletedTransaction(transactionData);
      setShowReceipt(true); // فتح نافذة الفاتورة والطباعة

      // تفريغ البيانات
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentType('cash');

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إجراء العملية');
    } finally {
      setLoading(false);
    }
  };

  // إرسال الفاتورة عبر واتساب
  const sendWhatsAppReceipt = () => {
    if (!completedTransaction) return;

    let phone = completedTransaction.customerPhone.replace(/[^0-9]/g, '');
    if (!phone) {
      toast.error('يرجى إدخال رقم هاتف صحيح لإرسال الفاتورة');
      return;
    }

    let itemsText = completedTransaction.items.map(i => `• ${i.name} x${i.quantity} = $${i.sellingPrice * i.quantity}`).join('\n');
    let message = `مرحباً ${completedTransaction.customerName} 👋\n\nإليك تفاصيل فاتورتك:\n${itemsText}\n\nالإجمالي: $${completedTransaction.totalAmountUSD} (${completedTransaction.totalAmountSYP.toLocaleString()} ل.س)\nنوع الدفع: ${completedTransaction.paymentType === 'debt' ? 'دين' : 'نقدي'}\n\nشكراً لتعاملكم معنا!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 dir-rtl" dir="rtl">
      
      {/* 1. قسم شاشة المنتجات والبحث (يظهر أولاً على الموبايل أو يمكن عكس الترتيب حسب الرغبة) */}
      <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
        
        {/* شريط البحث المتقدم */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث باسم المنتج، الباركود، أو القسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full p-3.5 pl-11 rounded-2xl border text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          />
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
        </div>

        {/* شبكة المنتجات */}
        <div className="max-h-[450px] sm:max-h-[560px] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className={`p-3 sm:p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between group hover:border-emerald-500 ${
                  darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
                }`}
              >
                {/* صورة المنتج إن وجدت */}
                <div className="w-full h-20 sm:h-24 rounded-xl mb-3 overflow-hidden bg-zinc-800/50 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-stone-600" />
                  )}
                </div>

                <div>
                  <span className="font-bold text-xs sm:text-sm block line-clamp-1 mb-1">{p.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-stone-400 inline-block mb-2">
                    {p.category || 'عام'}
                  </span>
                  <div>
                    <div className="text-emerald-500 font-black text-sm sm:text-base">${p.sellingPrice}</div>
                    <div className="text-[10px] sm:text-[11px] text-stone-400">{(p.sellingPrice * usdRate).toLocaleString()} ل.س</div>
                  </div>
                </div>
              </button>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-stone-500 text-sm">
                لم يتم العثور على أي منتجات مطابقة
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. قسم سلة المبيعات وبيانات الزبون */}
      <div className={`p-4 sm:p-6 rounded-2xl border flex flex-col justify-between order-1 lg:order-2 ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            <span>سلة المبيعات</span>
          </h2>

          {/* قائمة العناصر في السلة */}
          <div className="space-y-2.5 max-h-[180px] sm:max-h-[220px] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40 text-xs">
                <div>
                  <div className="font-bold line-clamp-1">{item.name}</div>
                  <div className="text-emerald-400 font-semibold">${item.sellingPrice * item.quantity}</div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded bg-zinc-700 hover:bg-zinc-600"><Minus className="w-3 h-3" /></button>
                  <span className="font-bold px-1">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded bg-zinc-700 hover:bg-zinc-600"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-rose-400 hover:text-rose-300 mr-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p className="text-center text-stone-500 text-xs py-6">السلة فارغة</p>}
          </div>

          {/* بيانات الزبون وحالة البيع */}
          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="اسم الزبون (مطلوب للديون)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full p-2.5 pl-9 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                }`}
              />
              <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="رقم الهاتف (للواتساب)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={`w-full p-2.5 pl-9 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                }`}
              />
              <Phone className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            </div>

            {/* تحديد نوع الدفع: نقدي أم دين */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('cash')}
                className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  paymentType === 'cash' 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : darkMode ? 'bg-zinc-800 border-zinc-700 text-stone-400' : 'bg-stone-100 border-stone-200 text-stone-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>نقدي</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('debt')}
                className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  paymentType === 'debt' 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                    : darkMode ? 'bg-zinc-800 border-zinc-700 text-stone-400' : 'bg-stone-100 border-stone-200 text-stone-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>تسجيل كدين</span>
              </button>
            </div>
          </div>
        </div>

        {/* المجموع والتأكيد */}
        <div className="border-t border-zinc-800 pt-4 mt-4 space-y-3">
          <div className="flex justify-between items-center font-bold">
            <span>المجموع:</span>
            <span className="text-emerald-400 text-lg">${totalUSD}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-stone-400">
            <span>المعادل بالليرة:</span>
            <span>{totalSYP.toLocaleString()} ل.س</span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{loading ? 'جاري الحفظ...' : 'إتمام الفاتورة'}</span>
          </button>
        </div>
      </div>

      {/* 3. نافذة طباعة والمعاينة للفاتورة (Receipt Modal) */}
      {showReceipt && completedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-lg transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* محتوى الفاتورة المعروض للطباعة */}
            <div id="receipt-print-area" className="space-y-4 text-center py-2">
              <h2 className="text-xl font-black">فاتورة مبيعات</h2>
              <p className="text-xs text-stone-400">{new Date(completedTransaction.createdAt).toLocaleString('ar-EG')}</p>

              <div className="border-y border-dashed border-zinc-700 py-3 text-right text-xs space-y-1">
                <div><strong>الزبون:</strong> {completedTransaction.customerName}</div>
                <div><strong>الهاتف:</strong> {completedTransaction.customerPhone}</div>
                <div><strong>طريقة الدفع:</strong> {completedTransaction.paymentType === 'debt' ? 'دين' : 'نقدي'}</div>
              </div>

              <div className="divide-y divide-zinc-800 text-xs text-right">
                {completedTransaction.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-bold">${item.sellingPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-700 pt-3 text-right font-bold text-sm space-y-1">
                <div className="flex justify-between">
                  <span>المجموع بالعملة:</span>
                  <span className="text-emerald-400">${completedTransaction.totalAmountUSD}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-400">
                  <span>المعادل بالليرة:</span>
                  <span>{completedTransaction.totalAmountSYP.toLocaleString()} ل.س</span>
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات السريعة (طباعة وواتساب) */}
            <div className="pt-4 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>

              <button
                onClick={sendWhatsAppReceipt}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>إرسال واتساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}