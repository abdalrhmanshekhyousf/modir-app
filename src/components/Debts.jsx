// src/components/Debts.jsx
import { useState, useEffect, useCallback } from 'react';
import { getDebts, addDebt, updateDebt, deleteDebt } from '../services/dbServie';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Trash2,
  DollarSign,
  Users,
  CheckCircle2,
  X,
  Coins,
  Search,
  HandCoins,
  CreditCard,
} from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function Debts({ userId, usdRate }) {
  const [debts, setDebts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaid, setShowPaid] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAmountUSD, setEditAmountUSD] = useState('');
  const [payAmount, setPayAmount] = useState('');

  const loadDebts = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getDebts(userId);
      setDebts((data || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء جلب الديون');
    }
  }, [userId]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !amountUSD) {
      toast.error('يرجى كتابة اسم العميل والمبلغ');
      return;
    }
    setLoading(true);
    try {
      await addDebt({ customerName: customerName.trim(), amountUSD: Number(amountUSD) }, userId);
      toast.success('تم تسجيل الدين');
      setCustomerName('');
      setAmountUSD('');
      loadDebts();
    } catch {
      toast.error('حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (debt) => {
    setSelectedDebt(debt);
    setEditCustomerName(debt.customerName);
    setEditAmountUSD(debt.amountUSD);
    setPayAmount('');
    setIsEditModalOpen(true);
  };

  const handleUpdateDebt = async (e) => {
    e.preventDefault();
    if (!selectedDebt) return;

    let newAmount = Number(editAmountUSD);
    const payment = Number(payAmount) || 0;

    if (payment > 0) {
      if (payment > newAmount) {
        toast.error('مبلغ التسديد أكبر من الدين المتبقي');
        return;
      }
      newAmount = Math.round((newAmount - payment) * 100) / 100;
    }

    setLoading(true);
    try {
      await updateDebt(selectedDebt.id, {
        customerName: editCustomerName,
        amountUSD: newAmount,
        lastPaymentDate: payment > 0 ? new Date().toISOString() : selectedDebt.lastPaymentDate || null,
      });
      toast.success(newAmount === 0 ? 'تم تسديد الدين بالكامل' : 'تم تحديث البيانات');
      setIsEditModalOpen(false);
      loadDebts();
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDebt = async (debt) => {
    if (!window.confirm(`هل أنت متأكد من حذف دين "${debt.customerName}" نهائياً؟`)) return;
    try {
      await deleteDebt(debt.id);
      toast.success('تم الحذف');
      loadDebts();
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const activeDebts = debts.filter((d) => Number(d.amountUSD) > 0);
  const totalDebtsUSD = activeDebts.reduce((sum, d) => sum + (Number(d.amountUSD) || 0), 0);
  const totalDebtsSYP = totalDebtsUSD * (usdRate || 0);

  const visible = (showPaid ? debts : activeDebts).filter((d) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || d.customerName?.toLowerCase().includes(term) || d.customerPhone?.includes(term);
  });

  const remainingAfterPay = Math.max(0, (Number(editAmountUSD) || 0) - (Number(payAmount) || 0));

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      <div className="page-head">
        <div>
          <h2 className="page-title">الديون والعملاء</h2>
          <p className="page-sub">متابعة ذمم الزبائن والتسديدات</p>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="card stat">
          <div className="min-w-0">
            <p className="stat-label">إجمالي الديون</p>
            <p className="stat-value !text-danger truncate">${fmt(totalDebtsUSD)}</p>
          </div>
          <div className="icon-tile tone-danger hidden sm:inline-flex"><DollarSign className="w-5 h-5" /></div>
        </div>
        <div className="card stat">
          <div>
            <p className="stat-label">عملاء مدينون</p>
            <p className="stat-value">{activeDebts.length}</p>
          </div>
          <div className="icon-tile tone-info hidden sm:inline-flex"><Users className="w-5 h-5" /></div>
        </div>
        <div className="card stat col-span-2 lg:col-span-1">
          <div className="min-w-0">
            <p className="stat-label">المعادل بالليرة</p>
            <p className="stat-value truncate">{fmt(totalDebtsSYP)}<span className="stat-unit">ل.س</span></p>
          </div>
          <div className="icon-tile tone-warn hidden sm:inline-flex"><Coins className="w-5 h-5" /></div>
        </div>
      </div>

      {/* إضافة دين */}
      <div className="card card-pad">
        <h3 className="section-title mb-4">
          <CreditCard className="w-[18px] h-[18px] text-brand" />
          تسجيل دين جديد
        </h3>
        <form onSubmit={handleAddDebt} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 sm:items-end">
          <div>
            <label className="label">اسم العميل *</label>
            <input type="text" placeholder="مثال: محمد أحمد" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="field" required />
          </div>
          <div>
            <label className="label">المبلغ ($) *</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)} className="field num" required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <Plus className="w-[18px] h-[18px]" />
            {loading ? 'جاري الحفظ...' : 'إضافة'}
          </button>
        </form>
      </div>

      {/* البحث */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative sm:w-80">
          <Search className="field-icon right-3.5" />
          <input
            type="text"
            placeholder="ابحث باسم العميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field !pr-10 !bg-surface"
          />
        </div>
        <div className="flex gap-2">
          <button className="chip" aria-pressed={!showPaid} onClick={() => setShowPaid(false)}>غير مسددة</button>
          <button className="chip" aria-pressed={showPaid} onClick={() => setShowPaid(true)}>الكل</button>
        </div>
      </div>

      {/* القائمة */}
      <div className="card overflow-hidden">
        {/* جدول الديسكتوب */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>العميل</th>
                <th>المبلغ ($)</th>
                <th>بالليرة</th>
                <th>التفاصيل</th>
                <th>التاريخ</th>
                <th className="!text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((debt) => {
                const paid = Number(debt.amountUSD) <= 0;
                return (
                  <tr key={debt.id}>
                    <td>
                      <div className="font-semibold">{debt.customerName}</div>
                      {debt.customerPhone && <div className="text-[11px] text-muted num" dir="ltr">{debt.customerPhone}</div>}
                    </td>
                    <td>{paid ? <span className="badge badge-brand">مسدد</span> : <span className="font-bold text-danger num">${fmt(debt.amountUSD)}</span>}</td>
                    <td className="text-muted num">{fmt(debt.amountUSD * usdRate)} ل.س</td>
                    <td className="text-xs text-muted max-w-[220px] truncate" title={debt.details}>{debt.details || '—'}</td>
                    <td className="text-xs text-muted">{debt.createdAt ? new Date(debt.createdAt).toLocaleDateString('ar-EG') : '—'}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleOpenEditModal(debt)} className="btn btn-info-soft btn-sm">
                          <HandCoins className="w-4 h-4" />
                          تسديد / تعديل
                        </button>
                        <button onClick={() => handleDeleteDebt(debt)} className="btn btn-ghost btn-icon-sm hover:!text-danger" title="حذف"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* كروت الموبايل */}
        <div className="md:hidden divide-y divide-line">
          {visible.map((debt) => {
            const paid = Number(debt.amountUSD) <= 0;
            return (
              <div key={debt.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{debt.customerName}</div>
                    <div className="text-xs text-muted mt-0.5">
                      {debt.createdAt ? new Date(debt.createdAt).toLocaleDateString('ar-EG') : '—'}
                      {debt.customerPhone ? <> · <span className="num" dir="ltr">{debt.customerPhone}</span></> : null}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    {paid ? (
                      <span className="badge badge-brand">مسدد</span>
                    ) : (
                      <>
                        <div className="font-bold text-danger num">${fmt(debt.amountUSD)}</div>
                        <div className="text-[11px] text-muted num">{fmt(debt.amountUSD * usdRate)} ل.س</div>
                      </>
                    )}
                  </div>
                </div>
                {debt.details && <p className="text-xs text-muted mt-2 line-clamp-2">{debt.details}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleOpenEditModal(debt)} className="btn btn-info-soft btn-sm flex-1">
                    <HandCoins className="w-4 h-4" />
                    تسديد / تعديل
                  </button>
                  <button onClick={() => handleDeleteDebt(debt)} className="btn btn-danger-soft btn-icon !w-9 !h-9" aria-label="حذف"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>

        {visible.length === 0 && (
          <div className="empty">
            <Users className="w-8 h-8 opacity-50" />
            <span>{debts.length === 0 ? 'لا توجد ديون مسجلة' : 'لا توجد نتائج'}</span>
          </div>
        )}
      </div>

      {/* مودال التسديد */}
      {isEditModalOpen && selectedDebt && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsEditModalOpen(false)} className="btn btn-ghost btn-icon absolute top-4 left-4" aria-label="إغلاق"><X className="w-5 h-5" /></button>

            <h3 className="section-title !text-lg mb-1">
              <HandCoins className="w-5 h-5 text-brand" />
              تسديد أو تعديل
            </h3>
            <p className="text-sm text-muted mb-5">{selectedDebt.customerName}</p>

            <form onSubmit={handleUpdateDebt} className="space-y-4">
              <div>
                <label className="label">اسم العميل</label>
                <input type="text" value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} className="field" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">الدين الحالي ($)</label>
                  <input type="number" step="0.01" min="0" value={editAmountUSD} onChange={(e) => setEditAmountUSD(e.target.value)} className="field num" required />
                </div>
                <div>
                  <label className="label">دفعة الآن ($)</label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="field num" autoFocus />
                </div>
              </div>

              <div className="rounded-xl bg-surface-2 border border-line p-3 flex items-center justify-between text-sm">
                <span className="text-muted">المتبقي بعد الدفعة</span>
                <span className={`font-bold num ${remainingAfterPay === 0 ? 'text-brand' : ''}`}>${fmt(remainingAfterPay)}</span>
              </div>

              <div className="pt-1 flex gap-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                  <CheckCircle2 className="w-[18px] h-[18px]" />
                  {loading ? 'جاري التحديث...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setPayAmount(String(editAmountUSD))} className="btn btn-secondary">
                  تسديد كامل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
