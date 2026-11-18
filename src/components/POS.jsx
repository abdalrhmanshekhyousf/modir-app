// src/components/POS.jsx
import { useMemo, useRef, useState } from 'react';
import { checkoutSale, StockError } from '../services/dbServie';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Trash2,
  Search,
  User,
  Phone,
  Printer,
  Send,
  X,
  Banknote,
  NotebookPen,
  Image as ImageIcon,
  PackageX,
  ChevronUp,
  ScanLine,
} from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const stockOf = (p) => Number(p?.quantity ?? 0);

// تحويل الرقم لصيغة دولية تناسب wa.me (افتراضياً سوريا 963)
const toWhatsAppNumber = (raw) => {
  let digits = String(raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `963${digits.slice(1)}`;
  else if (digits.length === 9 && digits.startsWith('9')) digits = `963${digits}`;
  return digits;
};

export default function POS({ products = [], userId, usdRate, onRefresh }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'debt'

  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const cartRef = useRef(null);

  const productsById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category || 'عام'))],
    [products]
  );

  // ===== السلة =====
  const qtyInCart = (id) => cart.find((i) => i.id === id)?.quantity || 0;

  const addToCart = (product) => {
    const stock = stockOf(product);
    const current = qtyInCart(product.id);
    if (current + 1 > stock) {
      toast.error(stock === 0 ? `"${product.name}" نفد من المخزون` : `المتوفر من "${product.name}" ${stock} فقط`);
      return;
    }
    if (current > 0) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    const stock = stockOf(productsById[id]);
    setCart(
      cart.map((item) => {
        if (item.id !== id) return item;
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > stock) {
          toast.error(`المتوفر من "${item.name}" ${stock} فقط`);
          return item;
        }
        return { ...item, quantity: newQty };
      })
    );
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));

  const totalUSD = round2(cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0));
  const totalSYP = Math.round(totalUSD * usdRate);
  const itemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ===== الفلترة =====
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesTerm =
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term);
    const matchesCat = activeCategory === 'all' || (p.category || 'عام') === activeCategory;
    return matchesTerm && matchesCat;
  });

  // إضافة سريعة بالباركود عند الضغط على Enter
  const handleSearchKey = (e) => {
    if (e.key !== 'Enter') return;
    const term = searchTerm.trim();
    if (!term) return;
    const exact = products.find((p) => p.barcode === term);
    if (exact) {
      addToCart(exact);
      setSearchTerm('');
    } else if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchTerm('');
    }
  };

  const handleScan = (code) => {
    const product = products.find((p) => p.barcode === code);
    if (product) {
      addToCart(product);
      toast.success(`تمت إضافة "${product.name}"`);
    } else {
      toast.error(`لا يوجد منتج بالباركود ${code}`);
    }
  };

  // ===== إتمام البيع =====
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentType === 'debt' && !customerName.trim()) {
      toast.error('يرجى إدخال اسم الزبون عند البيع بالدين');
      return;
    }

    setLoading(true);
    try {
      // نحفظ فقط الحقول اللازمة (بدون الصور) حتى لا يتضخم مستند الفاتورة
      const items = cart.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category || 'عام',
        barcode: i.barcode || '',
        sellingPrice: Number(i.sellingPrice) || 0,
        costPrice: Number(i.costPrice) || 0,
        quantity: i.quantity,
      }));

      const transactionData = {
        items,
        totalAmountUSD: totalUSD,
        totalAmountSYP: totalSYP,
        usdRate,
        customerName: customerName.trim() || 'زبون عام',
        customerPhone: customerPhone.trim() || '—',
        paymentType,
      };

      const debtData =
        paymentType === 'debt'
          ? {
              customerName: customerName.trim(),
              customerPhone: customerPhone.trim(),
              amountUSD: totalUSD,
              amountSYP: totalSYP,
              details: items.map((i) => `${i.name} (${i.quantity})`).join('، '),
              date: new Date().toISOString(),
            }
          : null;

      // خصم المخزون + حفظ الفاتورة + الدين في عملية واحدة
      await checkoutSale({ items, transactionData, debtData }, userId);

      toast.success(paymentType === 'debt' ? 'تم البيع وتسجيل الدين' : 'تمت عملية البيع بنجاح');

      setCompletedTransaction({ ...transactionData, createdAt: new Date().toISOString() });
      setShowReceipt(true);

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentType('cash');
    } catch (error) {
      if (error instanceof StockError) {
        const lines = error.shortages.map((s) => `${s.name}: المتوفر ${s.available}`).join('\n');
        toast.error(`الكمية غير كافية:\n${lines}`, { duration: 5000 });
        // ضبط السلة على الكميات المتوفرة فعلياً
        const byId = Object.fromEntries(error.shortages.map((s) => [s.id, s.available]));
        setCart((prev) =>
          prev
            .map((i) => (i.id in byId ? { ...i, quantity: Math.min(i.quantity, byId[i.id]) } : i))
            .filter((i) => i.quantity > 0)
        );
      } else {
        console.error(error);
        toast.error('حدث خطأ أثناء إتمام العملية');
      }
    } finally {
      setLoading(false);
      if (onRefresh) onRefresh(); // تحديث الكميات المعروضة
    }
  };

  // ===== واتساب =====
  const sendWhatsAppReceipt = () => {
    if (!completedTransaction) return;
    const phone = toWhatsAppNumber(completedTransaction.customerPhone);
    if (!phone) {
      toast.error('لا يوجد رقم هاتف صحيح لإرسال الفاتورة');
      return;
    }
    const itemsText = completedTransaction.items
      .map((i) => `• ${i.name} ×${i.quantity} = $${fmt(i.sellingPrice * i.quantity)}`)
      .join('\n');
    const message = `مرحباً ${completedTransaction.customerName} 👋\n\nإليك تفاصيل فاتورتك:\n${itemsText}\n\nالإجمالي: $${fmt(completedTransaction.totalAmountUSD)} (${fmt(completedTransaction.totalAmountSYP)} ل.س)\nنوع الدفع: ${completedTransaction.paymentType === 'debt' ? 'دين' : 'نقدي'}\n\nشكراً لتعاملكم معنا!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 lg:gap-6 items-start" dir="rtl">
      {/* ================= المنتجات ================= */}
      <section className="space-y-4 min-w-0">
        <div className="page-head">
          <div>
            <h2 className="page-title">نقطة البيع</h2>
            <p className="page-sub">اضغط على المنتج لإضافته للسلة — أو امسح الباركود واضغط Enter</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="field-icon right-4 !w-[18px] !h-[18px]" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الباركود، أو القسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKey}
              className="field !h-12 !pr-11 !rounded-2xl !bg-surface"
            />
          </div>
          <button
            onClick={() => setScannerOpen(true)}
            className="btn btn-secondary !h-12 !w-12 sm:!w-auto !px-0 sm:!px-4 !rounded-2xl shrink-0"
            title="مسح بالكاميرا"
          >
            <ScanLine className="w-5 h-5 text-brand" />
            <span className="hidden sm:inline">مسح</span>
          </button>
        </div>

        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button className="chip" aria-pressed={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
              الكل
            </button>
            {categories.map((cat) => (
              <button key={cat} className="chip" aria-pressed={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const stock = stockOf(p);
            const remaining = stock - qtyInCart(p.id);
            const outOfStock = stock <= 0;
            const low = !outOfStock && stock <= (p.minQuantity ?? 5);
            const inCart = qtyInCart(p.id);

            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                className={`card group relative text-right p-2.5 flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-line-strong disabled:hover:translate-y-0 disabled:opacity-55 ${
                  inCart ? '!border-brand ring-2 ring-[var(--ring)]' : ''
                }`}
              >
                <div className="thumb w-full aspect-[4/3] rounded-[0.875rem] mb-2.5 !border-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ImageIcon className="w-7 h-7 opacity-50" />
                  )}
                </div>

                {inCart > 0 && (
                  <span key={inCart} className="animate-pop absolute top-4 left-4 min-w-7 h-7 px-2 rounded-full bg-brand text-brand-fg text-xs font-bold flex items-center justify-center shadow-md num">
                    {inCart}
                  </span>
                )}

                <div className="px-1 flex-1 flex flex-col">
                  <span className="font-semibold text-[13px] sm:text-sm leading-snug line-clamp-2 mb-1.5">{p.name}</span>
                  <div className="mt-auto flex items-end justify-between gap-2">
                    <div>
                      <div className="text-brand font-bold text-[15px] num">${fmt(p.sellingPrice)}</div>
                      <div className="text-[10.5px] text-muted num">{fmt(p.sellingPrice * usdRate)} ل.س</div>
                    </div>
                    <span className={`badge num ${outOfStock ? 'badge-danger' : low ? 'badge-warn' : ''}`}>
                      {outOfStock ? 'نفد' : `${remaining} متبقي`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full card empty">
              <PackageX className="w-8 h-8 opacity-60" />
              <span>{products.length === 0 ? 'لا توجد منتجات بعد — أضفها من صفحة المخزون' : 'لا توجد منتجات مطابقة للبحث'}</span>
            </div>
          )}
        </div>
      </section>

      {/* ================= السلة ================= */}
      <aside ref={cartRef} className="card lg:sticky lg:top-36 flex flex-col overflow-hidden scroll-mt-20">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="section-title">
            <ShoppingCart className="w-[18px] h-[18px] text-brand" />
            <span>السلة</span>
            {itemsCount > 0 && <span className="badge badge-brand num">{itemsCount}</span>}
          </h3>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="btn btn-ghost btn-sm !h-8 !px-2.5 text-xs">
              تفريغ
            </button>
          )}
        </div>

        <div className="px-3 max-h-[300px] lg:max-h-[calc(100vh-34rem)] min-h-[96px] overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2 transition-colors">
              <div className="thumb w-11 h-11 rounded-lg !border-0">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 opacity-50" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[13px] truncate">{item.name}</div>
                <div className="text-[11.5px] text-muted num">
                  ${fmt(item.sellingPrice)} × {item.quantity} = <span className="text-ink font-semibold">${fmt(item.sellingPrice * item.quantity)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5 border border-line">
                <button onClick={() => updateQuantity(item.id, 1)} className="btn btn-ghost btn-icon-sm !w-7 !h-7" aria-label="زيادة">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-[13px] font-bold num">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, -1)} className="btn btn-ghost btn-icon-sm !w-7 !h-7" aria-label="إنقاص">
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="btn btn-ghost btn-icon-sm hover:!text-danger" aria-label="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="empty !py-8">
              <ShoppingCart className="w-7 h-7 opacity-40" />
              <span className="text-xs">السلة فارغة</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-3 border-t border-line mt-2">
          <div className="segmented">
            <button type="button" aria-pressed={paymentType === 'cash'} onClick={() => setPaymentType('cash')}>
              <Banknote className="w-4 h-4" />
              نقدي
            </button>
            <button type="button" aria-pressed={paymentType === 'debt'} onClick={() => setPaymentType('debt')}>
              <NotebookPen className="w-4 h-4" />
              دين
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="relative">
              <User className="field-icon right-3.5" />
              <input
                type="text"
                placeholder={paymentType === 'debt' ? 'اسم الزبون (مطلوب)' : 'اسم الزبون (اختياري)'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`field field-sm !pr-10 ${paymentType === 'debt' && !customerName.trim() ? '!border-warn' : ''}`}
              />
            </div>
            <div className="relative">
              <Phone className="field-icon right-3.5" />
              <input
                type="tel"
                placeholder="رقم الهاتف (للواتساب)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="field field-sm !pr-10"
                dir="rtl"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-surface-2 border border-line p-4 space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-ink-soft">الإجمالي</span>
              <span className="text-2xl font-bold num tracking-tight">${fmt(totalUSD)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>بالليرة السورية</span>
              <span className="num">{fmt(totalSYP)} ل.س</span>
            </div>
          </div>

          <button onClick={handleCheckout} disabled={cart.length === 0 || loading} className="btn btn-primary btn-lg w-full">
            <CheckCircle2 className="w-5 h-5" />
            <span>{loading ? 'جاري الحفظ...' : 'إتمام البيع'}</span>
          </button>
        </div>
      </aside>

      {/* شريط السلة العائم للموبايل */}
      {cart.length > 0 && (
        <button
          onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="lg:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] inset-x-4 z-30 btn btn-primary btn-lg justify-between !px-5 animate-fadeIn"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="num">{itemsCount} عنصر</span>
          </span>
          <span className="flex items-center gap-1 num font-bold">
            ${fmt(totalUSD)}
            <ChevronUp className="w-4 h-4" />
          </span>
        </button>
      )}

      <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScanSuccess={handleScan} />

      {/* ================= الإيصال ================= */}
      {showReceipt && completedTransaction && (
        <div className="modal-backdrop" onClick={() => setShowReceipt(false)}>
          <div className="modal max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowReceipt(false)} className="btn btn-ghost btn-icon absolute top-4 left-4 print:hidden" aria-label="إغلاق">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center pt-2 pb-4 print:hidden">
              <div className="icon-tile tone-brand !w-14 !h-14 !rounded-full mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold">تمت العملية بنجاح</h3>
            </div>

            <div id="receipt-print-area" className="rounded-2xl border border-dashed border-line-strong p-4 space-y-3 text-sm">
              <div className="text-center">
                <h2 className="font-bold text-base">فاتورة مبيعات</h2>
                <p className="text-[11px] text-muted mt-0.5">{new Date(completedTransaction.createdAt).toLocaleString('ar-EG')}</p>
              </div>

              <div className="text-xs space-y-1 py-2 border-y border-dashed border-line-strong">
                <div className="flex justify-between"><span className="text-muted">الزبون</span><span className="font-semibold">{completedTransaction.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted">الهاتف</span><span className="font-semibold num" dir="ltr">{completedTransaction.customerPhone}</span></div>
                <div className="flex justify-between"><span className="text-muted">الدفع</span><span className={`badge ${completedTransaction.paymentType === 'debt' ? 'badge-danger' : 'badge-brand'}`}>{completedTransaction.paymentType === 'debt' ? 'دين' : 'نقدي'}</span></div>
              </div>

              <div className="space-y-1.5 text-xs">
                {completedTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between gap-3">
                    <span className="truncate">{item.name} <span className="text-muted num">×{item.quantity}</span></span>
                    <span className="font-semibold num">${fmt(item.sellingPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-line-strong">
                <div className="flex justify-between font-bold">
                  <span>الإجمالي</span>
                  <span className="num">${fmt(completedTransaction.totalAmountUSD)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted mt-0.5">
                  <span>بالليرة</span>
                  <span className="num">{fmt(completedTransaction.totalAmountSYP)} ل.س</span>
                </div>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-2 gap-2 print:hidden">
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer className="w-4 h-4" />
                طباعة
              </button>
              <button onClick={sendWhatsAppReceipt} className="btn btn-primary">
                <Send className="w-4 h-4" />
                واتساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
