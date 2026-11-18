// src/components/Products.jsx
import { useMemo, useState } from 'react';
import { addProduct, updateProduct, deleteProduct } from '../services/dbServie';
import { toast } from 'react-hot-toast';
import NumInput from './NumInput';
import {
  Plus,
  Minus,
  Trash2,
  Package,
  Layers,
  Barcode,
  X,
  Sparkles,
  Image as ImageIcon,
  Upload,
  AlertTriangle,
  Boxes,
  Search,
  Pencil,
  PackagePlus,
  ScanLine,
} from 'lucide-react';
import BarcodeScannerModal from './BarcodeScannerModal';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const newBarcode = () => Math.floor(100000000000 + Math.random() * 900000000000).toString();

const emptyForm = {
  name: '',
  sellingPrice: '',
  costPrice: '',
  barcode: '',
  category: '',
  imageUrl: '',
  quantity: '',
  minQuantity: '5',
};

function StockBadge({ qty, min }) {
  if (qty <= 0) return <span className="badge badge-danger"><AlertTriangle className="w-3 h-3" />نفد</span>;
  if (qty <= min) return <span className="badge badge-warn"><AlertTriangle className="w-3 h-3" />منخفض</span>;
  return <span className="badge badge-brand">متوفر</span>;
}

function Thumb({ p, size = 'w-11 h-11' }) {
  return (
    <div className={`thumb ${size} rounded-xl`}>
      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 opacity-50" />}
    </div>
  );
}

export default function Products({ products = [], userId, usdRate, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all | low | out | <category>

  // مودال تعديل المخزون السريع
  const [stockTarget, setStockTarget] = useState(null);
  const [stockDelta, setStockDelta] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category || 'عام'))], [products]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const stats = useMemo(() => {
    let low = 0;
    let out = 0;
    let value = 0;
    products.forEach((p) => {
      const q = Number(p.quantity ?? 0);
      if (q <= 0) out += 1;
      else if (q <= (p.minQuantity ?? 5)) low += 1;
      value += Math.max(q, 0) * (Number(p.costPrice) || Number(p.sellingPrice) || 0);
    });
    return { low, out, value };
  }, [products]);

  const filtered = products.filter((p) => {
    const q = Number(p.quantity ?? 0);
    const term = searchTerm.trim().toLowerCase();
    const matchesTerm = !term || p.name?.toLowerCase().includes(term) || p.barcode?.toLowerCase().includes(term);
    let matchesFilter = true;
    if (filter === 'low') matchesFilter = q > 0 && q <= (p.minQuantity ?? 5);
    else if (filter === 'out') matchesFilter = q <= 0;
    else if (filter !== 'all') matchesFilter = (p.category || 'عام') === filter;
    return matchesTerm && matchesFilter;
  });

  // ===== فتح المودال =====
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      sellingPrice: String(p.sellingPrice ?? ''),
      costPrice: String(p.costPrice ?? ''),
      barcode: p.barcode || '',
      category: p.category || '',
      imageUrl: p.imageUrl || '',
      quantity: String(p.quantity ?? 0),
      minQuantity: String(p.minQuantity ?? 5),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 700 * 1024) {
      toast.error('حجم الصورة كبير، اختر صورة أقل من 700 كيلوبايت');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sellingPrice) {
      toast.error('يرجى ملء الاسم وسعر البيع على الأقل');
      return;
    }

    const payload = {
      name: form.name.trim(),
      sellingPrice: Number(form.sellingPrice),
      costPrice: Number(form.costPrice) || 0,
      barcode: form.barcode.trim() || newBarcode(),
      category: form.category.trim() || 'عام',
      imageUrl: form.imageUrl || '',
      quantity: Math.max(0, Math.floor(Number(form.quantity) || 0)),
      minQuantity: Math.max(0, Math.floor(Number(form.minQuantity) || 5)),
    };

    const duplicate = products.find((p) => p.barcode === payload.barcode && p.id !== editingId);
    if (duplicate) {
      toast.error(`الباركود مستخدم مسبقاً للمنتج "${duplicate.name}"`);
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success('تم تحديث المنتج');
      } else {
        await addProduct(payload, userId);
        toast.success('تمت إضافة المنتج');
      }
      closeModal();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${product.name}"؟`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('تم حذف المنتج');
      if (onRefresh) onRefresh();
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // ===== تعديل المخزون السريع =====
  const applyStock = async (sign) => {
    const delta = Math.floor(Number(stockDelta) || 0);
    if (!stockTarget || delta <= 0) {
      toast.error('أدخل كمية صحيحة');
      return;
    }
    const current = Number(stockTarget.quantity ?? 0);
    const next = current + sign * delta;
    if (next < 0) {
      toast.error(`لا يمكن الإنقاص أكثر من الكمية الحالية (${current})`);
      return;
    }
    setLoading(true);
    try {
      await updateProduct(stockTarget.id, { quantity: next });
      toast.success(`المخزون الآن: ${next}`);
      setStockTarget(null);
      setStockDelta('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('تعذر تحديث المخزون');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* ===== الترويسة ===== */}
      <div className="page-head">
        <div>
          <h2 className="page-title">المنتجات والمخزون</h2>
          <p className="page-sub">الكميات تنقص تلقائياً مع كل عملية بيع</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary w-full sm:w-auto">
          <Plus className="w-[18px] h-[18px]" />
          إضافة منتج
        </button>
      </div>

      {/* ===== الإحصائيات ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card stat">
          <div>
            <p className="stat-label">إجمالي المنتجات</p>
            <p className="stat-value">{products.length}</p>
          </div>
          <div className="icon-tile tone-brand hidden sm:inline-flex"><Package className="w-5 h-5" /></div>
        </div>
        <button className="card stat text-right hover:border-line-strong transition" onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}>
          <div>
            <p className="stat-label">مخزون منخفض</p>
            <p className="stat-value !text-warn">{stats.low}</p>
          </div>
          <div className="icon-tile tone-warn hidden sm:inline-flex"><AlertTriangle className="w-5 h-5" /></div>
        </button>
        <button className="card stat text-right hover:border-line-strong transition" onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}>
          <div>
            <p className="stat-label">نفد من المخزون</p>
            <p className="stat-value !text-danger">{stats.out}</p>
          </div>
          <div className="icon-tile tone-danger hidden sm:inline-flex"><Boxes className="w-5 h-5" /></div>
        </button>
        <div className="card stat">
          <div className="min-w-0">
            <p className="stat-label">قيمة المخزون</p>
            <p className="stat-value truncate">${fmt(stats.value)}</p>
          </div>
          <div className="icon-tile tone-info hidden sm:inline-flex"><Layers className="w-5 h-5" /></div>
        </div>
      </div>

      {/* ===== البحث والفلاتر ===== */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative md:w-80 shrink-0">
          <Search className="field-icon right-3.5" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الباركود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field !pr-10 !bg-surface"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>الكل</button>
          <button className="chip" aria-pressed={filter === 'low'} onClick={() => setFilter('low')}>منخفض</button>
          <button className="chip" aria-pressed={filter === 'out'} onClick={() => setFilter('out')}>نفد</button>
          {categories.length > 1 && <span className="w-px bg-line my-1 shrink-0" />}
          {categories.length > 1 &&
            categories.map((cat) => (
              <button key={cat} className="chip" aria-pressed={filter === cat} onClick={() => setFilter(cat)}>{cat}</button>
            ))}
        </div>
      </div>

      {/* ===== جدول (شاشات كبيرة) ===== */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>القسم</th>
                <th>المخزون</th>
                <th>سعر البيع</th>
                <th>التكلفة</th>
                <th>الباركود</th>
                <th className="!text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const qty = Number(p.quantity ?? 0);
                const min = p.minQuantity ?? 5;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Thumb p={p} />
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td><span className="badge">{p.category || 'عام'}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold num text-base ${qty <= 0 ? 'text-danger' : qty <= min ? 'text-warn' : ''}`}>{qty}</span>
                        <StockBadge qty={qty} min={min} />
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold num">${fmt(p.sellingPrice)}</div>
                      <div className="text-[11px] text-muted num">{fmt(p.sellingPrice * usdRate)} ل.س</div>
                    </td>
                    <td className="text-muted num">${fmt(p.costPrice)}</td>
                    <td className="font-mono text-xs text-muted" dir="ltr">{p.barcode || '—'}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => { setStockTarget(p); setStockDelta(''); }} className="btn btn-secondary btn-sm" title="تعديل المخزون">
                          <PackagePlus className="w-4 h-4 text-brand" />
                          مخزون
                        </button>
                        <button onClick={() => openEdit(p)} className="btn btn-ghost btn-icon-sm" title="تعديل"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p)} className="btn btn-ghost btn-icon-sm hover:!text-danger" title="حذف"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty">
              <Package className="w-8 h-8 opacity-50" />
              <span>{products.length === 0 ? 'لا توجد منتجات بعد' : 'لا توجد نتائج مطابقة'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== كروت (موبايل وتابلت) ===== */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => {
          const qty = Number(p.quantity ?? 0);
          const min = p.minQuantity ?? 5;
          return (
            <div key={p.id} className="card p-3.5">
              <div className="flex items-start gap-3">
                <Thumb p={p} size="w-16 h-16" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold leading-snug line-clamp-2">{p.name}</h4>
                    <StockBadge qty={qty} min={min} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <span>{p.category || 'عام'}</span>
                    <span>·</span>
                    <span className="font-mono" dir="ltr">{p.barcode || '—'}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-bold text-brand num">${fmt(p.sellingPrice)}</span>
                    <span className="text-[11px] text-muted num">{fmt(p.sellingPrice * usdRate)} ل.س</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-2">
                <div className="text-xs text-muted">
                  المخزون:{' '}
                  <span className={`font-bold text-base num ${qty <= 0 ? 'text-danger' : qty <= min ? 'text-warn' : 'text-ink'}`}>{qty}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setStockTarget(p); setStockDelta(''); }} className="btn btn-secondary btn-sm">
                    <PackagePlus className="w-4 h-4 text-brand" />
                    مخزون
                  </button>
                  <button onClick={() => openEdit(p)} className="btn btn-ghost btn-icon" aria-label="تعديل"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p)} className="btn btn-ghost btn-icon hover:!text-danger" aria-label="حذف"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card empty">
            <Package className="w-8 h-8 opacity-50" />
            <span>{products.length === 0 ? 'لا توجد منتجات بعد' : 'لا توجد نتائج مطابقة'}</span>
          </div>
        )}
      </div>

      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(code) => {
          const existing = products.find((p) => p.barcode === code && p.id !== editingId);
          if (existing) toast.error(`هذا الباركود مستخدم للمنتج "${existing.name}"`);
          setForm((f) => ({ ...f, barcode: code }));
        }}
      />

      {/* ===== مودال تعديل المخزون ===== */}
      {stockTarget && (
        <div className="modal-backdrop" onClick={() => setStockTarget(null)}>
          <div className="modal max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setStockTarget(null)} className="btn btn-ghost btn-icon absolute top-4 left-4" aria-label="إغلاق"><X className="w-5 h-5" /></button>
            <h3 className="section-title !text-lg mb-1">
              <PackagePlus className="w-5 h-5 text-brand" />
              تعديل المخزون
            </h3>
            <p className="text-sm text-muted mb-5">
              {stockTarget.name} — الكمية الحالية: <span className="font-bold text-ink num">{Number(stockTarget.quantity ?? 0)}</span>
            </p>

            <label className="label">الكمية</label>
            <NumInput
              min="1"
              inputMode="numeric"
              placeholder="مثال: 10"
              value={stockDelta}
              onChange={(e) => setStockDelta(e.target.value)}
              className="field !h-12 !text-lg text-center num"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => applyStock(-1)} disabled={loading} className="btn btn-secondary">
                <Minus className="w-4 h-4 text-danger" />
                إنقاص
              </button>
              <button onClick={() => applyStock(1)} disabled={loading} className="btn btn-primary">
                <Plus className="w-4 h-4" />
                إضافة للمخزون
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== مودال إضافة / تعديل منتج ===== */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="btn btn-ghost btn-icon absolute top-4 left-4" aria-label="إغلاق"><X className="w-5 h-5" /></button>

            <h3 className="section-title !text-lg mb-6">
              <Package className="w-5 h-5 text-brand" />
              {editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* الصورة */}
              <div className="flex items-center gap-3">
                <div className="thumb w-20 h-20 rounded-2xl">
                  {form.imageUrl ? <img src={form.imageUrl} alt="معاينة" className="w-full h-full object-cover" /> : <ImageIcon className="w-7 h-7 opacity-50" />}
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  <label className="btn btn-secondary btn-sm w-full">
                    <Upload className="w-4 h-4" />
                    رفع صورة
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <input
                    type="text"
                    placeholder="أو رابط صورة (URL)"
                    value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                    onChange={setField('imageUrl')}
                    className="field field-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="label">اسم المنتج *</label>
                <input type="text" placeholder="مثال: وجبة برغر دجاج" value={form.name} onChange={setField('name')} className="field" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">سعر التكلفة ($)</label>
                  <NumInput step="0.01" min="0" placeholder="0.00" value={form.costPrice} onChange={setField('costPrice')} className="field num" />
                </div>
                <div>
                  <label className="label">سعر البيع ($) *</label>
                  <NumInput step="0.01" min="0" placeholder="0.00" value={form.sellingPrice} onChange={setField('sellingPrice')} className="field num" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">الكمية المتوفرة</label>
                  <NumInput min="0" inputMode="numeric" placeholder="0" value={form.quantity} onChange={setField('quantity')} className="field num" />
                </div>
                <div>
                  <label className="label">تنبيه عند كمية</label>
                  <NumInput min="0" inputMode="numeric" placeholder="5" value={form.minQuantity} onChange={setField('minQuantity')} className="field num" />
                </div>
              </div>

              <div>
                <label className="label">القسم</label>
                <input
                  type="text"
                  list="category-options"
                  placeholder="اختر أو اكتب قسماً جديداً"
                  value={form.category}
                  onChange={setField('category')}
                  className="field"
                />
                <datalist id="category-options">
                  {[...new Set([...categories, 'عام', 'وجبات', 'مشروبات'])].map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="label">الباركود</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="field-icon left-3.5" />
                    <input
                      type="text"
                      placeholder="امسح أو ولّد تلقائياً"
                      value={form.barcode}
                      onChange={setField('barcode')}
                      className="field font-mono placeholder:font-sans !pl-10"
                      dir="ltr"
                    />
                  </div>
                  <button type="button" onClick={() => setScannerOpen(true)} className="btn btn-secondary btn-icon !w-11 !h-11" title="مسح بالكاميرا">
                    <ScanLine className="w-4 h-4 text-brand" />
                  </button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, barcode: newBarcode() }))} className="btn btn-secondary btn-icon !w-11 !h-11 sm:!w-auto sm:!px-3.5" title="توليد تلقائي">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="hidden sm:inline">توليد</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-[18px] h-[18px]" />}
                  {loading ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'حفظ المنتج'}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
