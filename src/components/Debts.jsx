// src/components/Debts.jsx
import React, { useState, useEffect } from 'react';
import { getDebts, addDebt, updateDebt, deleteDebt } from '../services/dbServie';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  X, 
  Coins,
  History,
  Sparkles
} from 'lucide-react';

export default function Debts({ userId, darkMode, usdRate }) {
  const [debts, setDebts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [loading, setLoading] = useState(false);

  // حالات التعديل وتسديد الديون (Modal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAmountUSD, setEditAmountUSD] = useState('');
  const [payAmount, setPayAmount] = useState('');

  // جلب الديون
  const loadDebts = async () => {
    if (!userId) return;
    try {
      const data = await getDebts(userId);
      setDebts(data || []);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء جلب الديون');
    }
  };

  useEffect(() => {
    loadDebts();
  }, [userId]);

  // إضافة دين جديد
  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!customerName || !amountUSD) {
      toast.error('يرجى كتابة اسم العميل والمبلغ');
      return;
    }

    setLoading(true);
    try {
      await addDebt(
        {
          customerName,
          amountUSD: Number(amountUSD),
          createdAt: new Date().toISOString()
        },
        userId
      );

      toast.success('تم تسجيل الدين بنجاح');
      setCustomerName('');
      setAmountUSD('');
      loadDebts();
    } catch (error) {
      toast.error('حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // فتح مودال التعديل / التسديد
  const handleOpenEditModal = (debt) => {
    setSelectedDebt(debt);
    setEditCustomerName(debt.customerName);
    setEditAmountUSD(debt.amountUSD);
    setPayAmount('');
    setIsEditModalOpen(true);
  };

  // حفظ التعديلات أو التسديد الجزئي/الكلي
  const handleUpdateDebt = async (e) => {
    e.preventDefault();
    if (!selectedDebt) return;

    let newAmount = Number(editAmountUSD);

    if (payAmount && Number(payAmount) > 0) {
      const payment = Number(payAmount);
      if (payment > newAmount) {
        toast.error('مبلغ التسديد أكبر من الدين المتبقي');
        return;
      }
      newAmount -= payment;
    }

    setLoading(true);
    try {
      await updateDebt(selectedDebt.id, {
        customerName: editCustomerName,
        amountUSD: newAmount,
        lastPaymentDate: payAmount ? new Date().toISOString() : selectedDebt.lastPaymentDate || null
      });

      toast.success(newAmount === 0 ? 'تم تسديد الدين بالكامل' : 'تم تحديث البيانات بنجاح');
      setIsEditModalOpen(false);
      loadDebts();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  // حذف دين/عميل
  const handleDeleteDebt = async (debtId) => {
    if (window.confirm('هل أنت تأكد من حذف هذا العميل/الدين بشكل نهائي؟')) {
      try {
        await deleteDebt(debtId);
        toast.success('تم حذف العميل بنجاح');
        loadDebts();
      } catch (error) {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const totalDebtsUSD = debts.reduce((sum, d) => sum + (Number(d.amountUSD) || 0), 0);
  const totalDebtsSYP = totalDebtsUSD * (usdRate || 0);

  return (
    <div className="space-y-6 dir-rtl pb-12" dir="rtl">

      {/* شريط شعار modir العلوي أو الترويسة الهوية */}
      <div className={`p-4 sm:p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black">إدارة الديون والعملاء</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-black text-[10px] tracking-wider uppercase shadow-sm">
                modir
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">متابعة حسابات الزبون والذمم المالية بدقة عالية</p>
          </div>
        </div>
      </div>

      {/* 1. كروت الإحصائيات العليا (متجاوبة تماماً) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-xs font-bold text-stone-400">إجمالي الديون المستحقة</p>
            <h3 className="text-2xl font-black mt-1 text-rose-500">${totalDebtsUSD.toLocaleString()}</h3>
          </div>
          <div className="p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-xs font-bold text-stone-400">المبلغ المعادل بالليرة</p>
            <h3 className="text-xl sm:text-2xl font-black mt-1 text-amber-500">
              {totalDebtsSYP.toLocaleString()} <span className="text-xs font-bold">ل.س</span>
            </h3>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1 ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
        }`}>
          <div>
            <p className="text-xs font-bold text-stone-400">عدد العملاء المدينين</p>
            <h3 className="text-2xl font-black mt-1 text-sky-500">{debts.length} <span className="text-xs font-bold text-stone-400">عميل</span></h3>
          </div>
          <div className="p-3.5 bg-sky-500/10 text-sky-500 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. نموذج إضافة دين جديد */}
      <div className={`p-6 rounded-3xl border shadow-sm ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          <span>تسجيل دين أو ذمة جديدة</span>
        </h3>

        <form onSubmit={handleAddDebt} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-stone-400">اسم العميل *</label>
            <input
              type="text"
              placeholder="مثال: محمد أحمد"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`w-full p-3 rounded-2xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-stone-400">المبلغ ($) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amountUSD}
              onChange={(e) => setAmountUSD(e.target.value)}
              className={`w-full p-3 rounded-2xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
              }`}
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>{loading ? 'جاري الحفظ...' : 'إضافة الدين'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. جدول عرض الديون (Responsive Scroll Container) */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm min-w-[650px]">
            <thead className={darkMode ? 'bg-zinc-800/50 text-stone-300' : 'bg-stone-100 text-stone-600'}>
              <tr>
                <th className="p-4">اسم العميل</th>
                <th className="p-4">المبلغ ($)</th>
                <th className="p-4">المبلغ بالليرة</th>
                <th className="p-4">تاريخ التسجيل</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {debts.map((debt) => (
                <tr key={debt.id} className={darkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-stone-50'}>
                  <td className="p-4 font-bold">{debt.customerName}</td>
                  <td className="p-4 font-black text-rose-500">${debt.amountUSD}</td>
                  <td className="p-4 font-medium">{(debt.amountUSD * usdRate).toLocaleString()} ل.س</td>
                  <td className="p-4 text-xs text-stone-400">
                    {debt.createdAt ? new Date(debt.createdAt).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(debt)}
                        className="px-3 py-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تسديد / تعديل</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(debt.id)}
                        className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {debts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-stone-500">لا توجد ديون أو ذمم مسجلة حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. نافذة التعديل والتسديد (Modal) */}
      {isEditModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl relative ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-stone-200 text-stone-900'
          }`}>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-stone-400 hover:text-white rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-500" />
              <span>تسديد أو تعديل دين: {selectedDebt.customerName}</span>
            </h3>

            <form onSubmit={handleUpdateDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-stone-400">اسم العميل</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className={`w-full p-3 rounded-2xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-stone-400">المبلغ الإجمالي الحالي ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmountUSD}
                  onChange={(e) => setEditAmountUSD(e.target.value)}
                  className={`w-full p-3 rounded-2xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-stone-400">مبلغ الدفعة المسددة الآن ($) - اختياري</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAccount && setPayAmount(e.target.value)}
                  className={`w-full p-3 rounded-2xl border text-sm font-medium focus:outline-none focus:border-emerald-500 ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-stone-50 border-stone-200'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{loading ? 'جاري التحديث...' : 'حفظ التعديلات'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
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