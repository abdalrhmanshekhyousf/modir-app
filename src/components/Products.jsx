import React, { useState, useRef } from 'react';
import {
  Plus, Search, Edit3, Trash2, Package, Layers, Barcode,
  X, AlertTriangle, Camera, FolderPlus, Settings
} from 'lucide-react';
import { 
  addProductToDB, 
  updateProductInDB, 
  deleteProductFromDB,
  addCategoryToDB,
  deleteCategoryFromDB
} from '../services/firestoreService';

export default function Products({ 
  products = [], 
  categories = ['الكل', 'وجبات', 'مشروبات', 'حلويات', 'ساندويش', 'إضافات'],
  exchangeRate = 15000, 
  currency = 'USD' 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // حالة نافذة إدارة التصنيفات
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // حالة الكاميرا
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // نموذج إدخال المنتج
  const [formData, setFormData] = useState({
    name: '',
    category: categories[1] || 'وجبات',
    costPriceUSD: '',
    priceUSD: '',
    stock: '',
    barcode: '',
    image: ''
  });

  // --- إدارة الكاميرا ---
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('تعذر الوصول للكاميرا');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setFormData(prev => ({ ...prev, image: photoDataUrl }));
    stopCamera();
  };

  // --- إدارة مودال المنتجات ---
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: categories.filter(c => c !== 'الكل')[0] || 'وجبات',
      costPriceUSD: '',
      priceUSD: '',
      stock: '',
      barcode: '',
      image: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || categories.filter(c => c !== 'الكل')[0] || 'وجبات',
      costPriceUSD: product.costPriceUSD || '',
      priceUSD: product.priceUSD || product.price || '',
      stock: product.stock !== undefined ? product.stock : 10,
      barcode: product.barcode || '',
      image: product.image || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsModalOpen(false);
  };

  // --- حفظ / تعديل المنتج ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.priceUSD) return;

    const priceUSD = parseFloat(formData.priceUSD) || 0;
    const costPriceUSD = parseFloat(formData.costPriceUSD) || 0;
    const stock = parseInt(formData.stock, 10) || 0;
    const barcode = formData.barcode.trim() || `BC-${Math.floor(100000 + Math.random() * 900000)}`;
    const image = formData.image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';

    const productPayload = {
      name: formData.name,
      category: formData.category,
      costPriceUSD,
      priceUSD,
      price: priceUSD,
      stock,
      barcode,
      image
    };

    try {
      if (editingProduct) {
        await updateProductInDB(editingProduct.id, productPayload);
      } else {
        await addProductToDB(productPayload);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المنتج في Firebase');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج؟')) {
      try {
        await deleteProductFromDB(id);
      } catch (err) {
        console.error(err);
        alert('تعذر حذف المنتج من قاعدة البيانات');
      }
    }
  };

  // --- إدارة التصنيفات (إضافة وحذف) ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.includes(name)) {
      alert('هذا التصنيف موجود بالفعل');
      return;
    }

    try {
      await addCategoryToDB(name);
      setNewCategoryName('');
    } catch (err) {
      console.error(err);
      alert('تعذر إضافة التصنيف لقاعدة البيانات');
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (catName === 'الكل') return;
    if (window.confirm(`هل أنت تأكد من حذف تصنيف "${catName}"؟`)) {
      try {
        await deleteCategoryFromDB(catName);
      } catch (err) {
        console.error(err);
        alert('تعذر حذف التصنيف من قاعدة البيانات');
      }
    }
  };

  // تصفية المنتجات
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'الكل' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* الهيدر والأزرار الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-100/60 dark:bg-zinc-900/60 p-4 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            إدارة المنتجات والمخزون
            <Package className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 font-medium mt-1">
            إضافة وتعديل المنتجات وإدارة أسام الأقسام/التصنيفات.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-stone-200 dark:bg-zinc-800 hover:bg-stone-300 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 font-black text-xs transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>إدارة الأقسام</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-zinc-950 font-black shadow-lg shadow-amber-500/20 transition cursor-pointer text-xs"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* البحث والتصنيف */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="البحث باسم المنتج أو الباركود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold placeholder-stone-400 focus:outline-none focus:border-amber-500 transition shadow-inner text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <Layers className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition cursor-pointer appearance-none text-sm"
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat === 'الكل' ? 'all' : cat} className="dark:bg-zinc-900">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* قائمة المنتجات */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-stone-100/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-stone-300 dark:border-zinc-800">
          <Package className="w-12 h-12 mx-auto text-stone-400 dark:text-zinc-600 mb-3 opacity-60" />
          <p className="text-stone-600 dark:text-zinc-400 font-bold">لم يتم العثور على أي منتجات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const priceUSD = product.priceUSD || product.price || 0;
            const costUSD = product.costPriceUSD || 0;
            const priceSYP = priceUSD * exchangeRate;
            const profitUSD = priceUSD - costUSD;
            const isLowStock = product.stock <= 5;
            const isOutOfStock = product.stock === 0;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 overflow-hidden hover:shadow-xl hover:border-amber-500/40 transition-all duration-300"
              >
                <div className="relative h-44 w-full bg-stone-200 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-zinc-950/80 text-amber-400 backdrop-blur-md border border-amber-500/20">
                      {product.category || 'عام'}
                    </span>
                    {isOutOfStock ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> نفدت
                      </span>
                    ) : isLowStock && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-zinc-950">
                        مخزون منخفض ({product.stock})
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="p-2 rounded-xl bg-zinc-950/80 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 transition cursor-pointer backdrop-blur-md"
                      title="تعديل المنتج"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 rounded-xl bg-zinc-950/80 text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer backdrop-blur-md"
                      title="حذف المنتج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-black text-stone-900 dark:text-zinc-100 text-base line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                      <Barcode className="w-3.5 h-3.5 text-amber-500" />
                      <span>{product.barcode || 'بدون باركود'}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-200/60 dark:border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 dark:text-zinc-400 font-bold">التكلفة:</span>
                      <span className="font-black text-stone-700 dark:text-zinc-300">${costUSD.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 dark:text-zinc-400 font-bold">المبيع:</span>
                      <div className="text-left">
                        <span className="font-black text-amber-600 dark:text-amber-400 text-sm block">${priceUSD.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500">{priceSYP.toLocaleString()} ل.س</span>
                      </div>
                    </div>
                    {costUSD > 0 && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-stone-200 dark:border-zinc-800">
                        <span className="text-stone-400 dark:text-zinc-500">الربح المقدر:</span>
                        <span className={`font-black ${profitUSD >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ${profitUSD.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة إدارية لإضافة وحذف الأقسام (Categories Modal) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-black text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                إدارة الأقسام والتصنيفات
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* نموذج إضافة قسم جديد */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="اسم القسم الجديد..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-xs font-bold text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs transition flex items-center gap-1"
              >
                <FolderPlus className="w-4 h-4" /> إضافة
              </button>
            </form>

            {/* قائمة الأقسام المتاحة مع خيار الحذف */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-zinc-800 max-h-56 overflow-y-auto">
              <span className="text-xs font-bold text-stone-500 dark:text-zinc-400 block mb-2">الأقسام الحالية:</span>
              {categories.filter(c => c !== 'الكل').map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-200/50 dark:bg-zinc-950/50 border border-stone-200/60 dark:border-zinc-800/60 text-xs">
                  <span className="font-bold text-stone-800 dark:text-zinc-200">{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                    title="حذف القسم"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة/تعديل المنتج */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <h2 className="text-lg font-black text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button onClick={handleCloseModal} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-stone-700 dark:text-zinc-300 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: برغر كلاسيك دبل"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-zinc-300 mb-1">التصنيف</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition text-sm"
                >
                  {categories.filter(c => c !== 'الكل').map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-zinc-300 mb-1">سعر التكلفة ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPriceUSD}
                    onChange={(e) => setFormData({ ...formData, costPriceUSD: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-zinc-300 mb-1">سعر المبيع ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.priceUSD}
                    onChange={(e) => setFormData({ ...formData, priceUSD: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-zinc-300 mb-1">الكمية المتوفرة</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-zinc-300 mb-1">الباركود (اختياري)</label>
                  <input
                    type="text"
                    placeholder="يولد تلقائياً إذا ترك فارغاً"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-stone-700 dark:text-zinc-300 mb-1">صورة المنتج</label>
                {isCapturing ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-stone-300 dark:border-zinc-800 flex flex-col items-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
                    <div className="absolute bottom-3 flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-black flex items-center gap-1 text-xs shadow-lg"
                      >
                        <Camera className="w-4 h-4" /> التقاط صورة
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 text-stone-300 font-bold text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="رابط صورة (https://...)"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-stone-200/60 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500 transition text-sm dir-ltr"
                    />
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-2.5 rounded-xl bg-stone-200 dark:bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-stone-700 dark:text-zinc-300 transition flex items-center gap-1 shrink-0"
                    >
                      <Camera className="w-4 h-4" />
                      <span>الكاميرا</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-800 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black shadow-lg shadow-amber-500/20 transition"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}