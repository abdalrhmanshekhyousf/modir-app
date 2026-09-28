// src/components/Products.jsx
import React, { useState } from 'react';
import { addProduct, deleteProduct } from '../services/dbServie'; 
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Package, 
  Layers, 
  Barcode, 
  X, 
  FolderPlus, 
  Sparkles,
  Image as ImageIcon,
  Upload,
  AlertTriangle,
  Boxes
} from 'lucide-react';

export default function Products({ products = [], categories = [], userId, darkMode, usdRate, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [quantity, setQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  
  const [loading, setLoading] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateBarcode = () => {
    const randomBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setBarcode(randomBarcode);
    toast.success('تم توليد الباركود بنجاح');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !sellingPrice) {
      toast.error('يرجى ملء الاسم وسعر البيع على الأقل');
      return;
    }

    setLoading(true);
    const qtyNumber = Number(quantity) || 0;
    const thresholdNumber = Number(lowStockThreshold) || 5;

    try {
      await addProduct(
        {
          name,
          sellingPrice: Number(sellingPrice),
          costPrice: Number(costPrice) || 0,
          barcode: barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString(),
          category: category || 'عام',
          imageUrl: imageUrl || '',
          quantity: qtyNumber,
          minQuantity: thresholdNumber
        },
        userId
      );

      toast.success('تمت إضافة المنتج بنجاح');
      
      setName('');
      setSellingPrice('');
      setCostPrice('');
      setBarcode('');
      setCategory('');
      setImageUrl('');
      setQuantity('');
      setLowStockThreshold('5');
      setIsModalOpen(false);

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إضافة المنتج');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteProduct(productId);
        toast.success('تم حذف المنتج بنجاح');
        if (onRefresh) onRefresh();
      } catch (error) {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    toast.success(`تم إضافة القسم: ${newCategoryName}`);
    setNewCategoryName('');
    setShowCategoryInput(false);
    if (onRefresh) onRefresh();
  };

  const handleDeleteCategory = (catName) => {
    if (window.confirm(`هل أنت متأكد من حذف القسم "${catName}"؟`)) {
      toast.success(`تم حذف القسم ${catName}`);
      if (onRefresh) onRefresh();
    }
  };

  const lowStockCount = products.filter(p => (p.quantity ?? 0) <= (p.minQuantity ?? 5)).length;

  return (
    <div className="space-y-6 dir-rtl text-right" dir="rtl">
      
      {/* 1. كروت الإحصائيات والأزرار السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-xs font-medium text-stone-400">إجمالي المنتجات</p>
            <h3 className="text-xl sm:text-2xl font-black mt-1 text-emerald-500">{products.length}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-xs font-medium text-stone-400">منتجات منخفضة/منتهية</p>
            <h3 className="text-xl sm:text-2xl font-black mt-1 text-amber-500">{lowStockCount}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-xs font-medium text-stone-400">الأقسام المتاحة</p>
            <h3 className="text-xl sm:text-2xl font-black mt-1 text-sky-500">{categories.length || 1}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl p-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">إضافة منتج</span>
          </button>

          <button
            onClick={() => setShowCategoryInput(!showCategoryInput)}
            className={`p-4 rounded-2xl border font-bold transition-all flex items-center justify-center gap-2 ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-stone-100 border-stone-200 hover:bg-stone-200'
            }`}
            title="إدارة الأقسام"
          >
            <FolderPlus className="w-5 h-5 text-sky-400" />
          </button>
        </div>
      </div>

      {/* 2. شريط إدارة الأقسام */}
      {showCategoryInput && (
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
        }`}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>إدارة الأقسام</span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="اسم القسم الجديد"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className={`flex-1 p-2.5 rounded-xl border text-sm focus:outline-none focus:border-sky-500 ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
              }`}
            />
            <button
              onClick={handleAddCategory}
              className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              حفظ القسم
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(categories.length > 0 ? categories : ['عام']).map((cat, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  darkMode ? 'bg-zinc-800 border-zinc-700 text-stone-300' : 'bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                {cat}
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-rose-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. عرض المنتجات: جدول للشاشات الكبيرة + بطاقات للشاشات الصغيرة والمتوسطة */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        
        {/* العرض للشاشات الكبيرة (Desktop Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm whitespace-nowrap">
            <thead className={darkMode ? 'bg-zinc-800/50 text-stone-300' : 'bg-stone-100 text-stone-600'}>
              <tr>
                <th className="p-4">الصورة</th>
                <th className="p-4">المنتج</th>
                <th className="p-4">القسم</th>
                <th className="p-4">الكمية</th>
                <th className="p-4">سعر البيع ($)</th>
                <th className="p-4">السعر بالليرة</th>
                <th className="p-4">التكلفة ($)</th>
                <th className="p-4">الباركود</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {products.map((p) => {
                const qty = p.quantity ?? 0;
                const minQty = p.minQuantity ?? 5;
                const isLowStock = qty <= minQty;

                return (
                  <tr key={p.id} className={darkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-stone-50'}>
                    <td className="p-4">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-zinc-700/50" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-stone-500">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold">{p.name}</td>
                    <td className="p-4 text-xs font-medium text-stone-400">
                      <span className="px-2.5 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                        {p.category || 'عام'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${qty === 0 ? 'text-rose-500' : isLowStock ? 'text-amber-500' : darkMode ? 'text-white' : 'text-stone-800'}`}>
                          {qty}
                        </span>
                        {isLowStock && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            qty === 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            {qty === 0 ? 'منتهي' : 'منخفض'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-emerald-400 font-bold">${p.sellingPrice}</td>
                    <td className="p-4 font-medium">{(p.sellingPrice * usdRate).toLocaleString()} ل.س</td>
                    <td className="p-4 text-stone-400">${p.costPrice || 0}</td>
                    <td className="p-4 font-mono text-xs text-stone-400">{p.barcode || '—'}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                        title="حذف المنتج"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-stone-500">لا توجد منتجات مضافة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* العرض للشاشات الصغيرة والمتوسطة (Mobile Cards Grid) */}
        <div className="block md:hidden p-4 space-y-3">
          {products.map((p) => {
            const qty = p.quantity ?? 0;
            const minQty = p.minQuantity ?? 5;
            const isLowStock = qty <= minQty;

            return (
              <div key={p.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${
                darkMode ? 'bg-zinc-800/40 border-zinc-800' : 'bg-stone-50 border-stone-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-xl border border-zinc-700/50 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-stone-500 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-base">{p.name}</h4>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-zinc-800/80 rounded-md text-[11px] font-medium text-stone-300 border border-zinc-700">
                        {p.category || 'عام'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shrink-0"
                    title="حذف المنتج"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-700/30 text-xs">
                  <div>
                    <span className="text-stone-400 block mb-0.5">الكمية المتوفرة:</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={qty === 0 ? 'text-rose-500' : isLowStock ? 'text-amber-500' : ''}>{qty}</span>
                      {isLowStock && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${qty === 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {qty === 0 ? 'منتهي' : 'منخفض'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">سعر البيع:</span>
                    <span className="text-emerald-400 font-bold">${p.sellingPrice} / {(p.sellingPrice * usdRate).toLocaleString()} ل.س</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">سعر التكلفة:</span>
                    <span className="font-medium">${p.costPrice || 0}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">الباركود:</span>
                    <span className="font-mono">{p.barcode || '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="p-8 text-center text-stone-500">لا توجد منتجات مضافة بعد</div>
          )}
        </div>

      </div>

      {/* 4. مودال إضافة منتج جديد (متجاوب بالكامل) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-lg rounded-2xl border p-4 sm:p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              <span>إضافة منتج جديد</span>
            </h2>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-stone-400">صورة المنتج</label>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className={`w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden shrink-0 mx-auto sm:mx-0 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-stone-100 border-stone-200'
                  }`}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="معاينة" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                      <Upload className="w-4 h-4" />
                      <span>رفع صورة من الجهاز</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>

                    <input
                      type="text"
                      placeholder="أو ضع رابط صورة مباشر (URL)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${
                        darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-stone-400">اسم المنتج *</label>
                <input
                  type="text"
                  placeholder="مثال: وجبة برغر دجاج"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-stone-400 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الكمية المتوفرة</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-stone-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>تنبيه عند كمية (تلقائي 5)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-stone-400">سعر التكلفة ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-stone-400">سعر البيع ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-stone-400">القسم</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <option value="">اختر القسم (اختياري)</option>
                  {(categories.length > 0 ? categories : ['عام', 'وجبات', 'مشروبات']).map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-stone-400">الباركود</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="أدخل الباركود أو ولّده تلقائياً"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className={`w-full p-3 pl-10 rounded-xl border text-sm font-mono focus:outline-none focus:border-emerald-500 ${
                        darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                      }`}
                    />
                    <Barcode className="w-4 h-4 absolute left-3 top-3.5 text-stone-400" />
                  </div>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>توليد</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{loading ? 'جاري الحفظ...' : 'حفظ المنتج'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                    darkMode ? 'bg-zinc-800 text-stone-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}