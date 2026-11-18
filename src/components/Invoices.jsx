// src/components/Invoices.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getInvoices, cancelInvoice } from '../services/dbServie';
import { toast } from 'react-hot-toast';
import { FileText, ChevronDown, Search, Receipt, Banknote, NotebookPen, Undo2 } from 'lucide-react';

const sortByDateDesc = (list) => (list || []).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

function PayBadge({ type }) {
  return type === 'debt' ? (
    <span className="badge badge-danger"><NotebookPen className="w-3 h-3" />دين</span>
  ) : (
    <span className="badge badge-brand"><Banknote className="w-3 h-3" />نقدي</span>
  );
}

export default function Invoices({ userId, onRefresh }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payFilter, setPayFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchInvoices = useCallback(
    () =>
      getInvoices(userId)
        .then((data) => setInvoices(sortByDateDesc(data)))
        .catch((error) => console.error(error))
        .finally(() => setLoading(false)),
    [userId]
  );

  useEffect(() => {
    if (userId) fetchInvoices();
  }, [userId, fetchInvoices]);

  const handleCancel = async (inv) => {
    const msg =
      inv.paymentType === 'debt'
        ? 'سيتم إلغاء الفاتورة وإرجاع الكميات للمخزون وحذف الدين المرتبط بها. متابعة؟'
        : 'سيتم إلغاء الفاتورة وإرجاع الكميات للمخزون. متابعة؟';
    if (!window.confirm(msg)) return;

    setCancellingId(inv.id);
    try {
      await cancelInvoice(inv, userId);
      toast.success('تم إلغاء الفاتورة وإرجاع المخزون');
      setOpenId(null);
      await fetchInvoices();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('تعذر إلغاء الفاتورة');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = invoices.filter((inv) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesTerm =
      !term ||
      inv.customerName?.toLowerCase().includes(term) ||
      inv.items?.some((i) => i.name?.toLowerCase().includes(term));
    const matchesPay = payFilter === 'all' || (inv.paymentType || 'cash') === payFilter;
    return matchesTerm && matchesPay;
  });

  const totals = useMemo(() => {
    const today = new Date().toDateString();
    let todaySum = 0;
    let todayCount = 0;
    invoices.forEach((inv) => {
      if (inv.createdAt && new Date(inv.createdAt).toDateString() === today) {
        todaySum += Number(inv.totalAmountUSD || 0);
        todayCount += 1;
      }
    });
    return { todaySum, todayCount };
  }, [invoices]);

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      <div className="page-head">
        <div>
          <h2 className="page-title">سجل الفواتير</h2>
          <p className="page-sub">كل عمليات البيع مرتبة من الأحدث</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="card stat">
          <div>
            <p className="stat-label">عدد الفواتير</p>
            <p className="stat-value">{invoices.length}</p>
          </div>
          <div className="icon-tile tone-info hidden sm:inline-flex"><FileText className="w-5 h-5" /></div>
        </div>
        <div className="card stat">
          <div>
            <p className="stat-label">فواتير اليوم</p>
            <p className="stat-value">{totals.todayCount}</p>
          </div>
          <div className="icon-tile tone-violet hidden sm:inline-flex"><Receipt className="w-5 h-5" /></div>
        </div>
        <div className="card stat col-span-2 lg:col-span-1">
          <div>
            <p className="stat-label">مبيعات اليوم</p>
            <p className="stat-value !text-brand">${fmt(totals.todaySum)}</p>
          </div>
          <div className="icon-tile tone-brand hidden sm:inline-flex"><Banknote className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative sm:w-80">
          <Search className="field-icon right-3.5" />
          <input
            type="text"
            placeholder="ابحث باسم الزبون أو المنتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field !pr-10 !bg-surface"
          />
        </div>
        <div className="flex gap-2">
          <button className="chip" aria-pressed={payFilter === 'all'} onClick={() => setPayFilter('all')}>الكل</button>
          <button className="chip" aria-pressed={payFilter === 'cash'} onClick={() => setPayFilter('cash')}>نقدي</button>
          <button className="chip" aria-pressed={payFilter === 'debt'} onClick={() => setPayFilter('debt')}>دين</button>
        </div>
      </div>

      <div className="card overflow-hidden divide-y divide-line">
        {/* رأس الأعمدة للشاشات الكبيرة */}
        <div className="hidden md:grid grid-cols-[1.3fr_1.2fr_0.8fr_0.7fr_1fr_1fr_40px] gap-3 px-5 py-3 bg-surface-2 text-xs font-semibold text-muted">
          <span>التاريخ</span>
          <span>الزبون</span>
          <span>المواد</span>
          <span>الدفع</span>
          <span>المجموع ($)</span>
          <span>المجموع (ل.س)</span>
          <span />
        </div>

        {filtered.map((inv) => {
          const isOpen = openId === inv.id;
          const date = inv.createdAt ? new Date(inv.createdAt) : null;
          const itemsCount = inv.items?.reduce((s, i) => s + Number(i.quantity || 0), 0) || 0;
          return (
            <div key={inv.id}>
              <button
                onClick={() => setOpenId(isOpen ? null : inv.id)}
                className="w-full text-right px-4 md:px-5 py-3.5 hover:bg-surface-2/60 transition-colors"
                aria-expanded={isOpen}
              >
                {/* موبايل */}
                <div className="md:hidden flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{inv.customerName || 'زبون عام'}</span>
                      <PayBadge type={inv.paymentType} />
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {date ? date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'غير محدد'} · {itemsCount} مادة
                    </div>
                  </div>
                  <div className="text-left shrink-0 flex items-center gap-2">
                    <div>
                      <div className="font-bold num">${fmt(inv.totalAmountUSD)}</div>
                      <div className="text-[11px] text-muted num">{fmt(inv.totalAmountSYP)} ل.س</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* ديسكتوب */}
                <div className="hidden md:grid grid-cols-[1.3fr_1.2fr_0.8fr_0.7fr_1fr_1fr_40px] gap-3 items-center text-sm">
                  <span className="text-muted text-xs">{date ? date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'غير محدد'}</span>
                  <span className="font-semibold truncate">{inv.customerName || 'زبون عام'}</span>
                  <span className="num">{itemsCount}</span>
                  <span><PayBadge type={inv.paymentType} /></span>
                  <span className="font-bold num">${fmt(inv.totalAmountUSD)}</span>
                  <span className="text-muted num">{fmt(inv.totalAmountSYP)}</span>
                  <ChevronDown className={`w-4 h-4 text-muted transition-transform justify-self-end ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 md:px-5 pb-4 animate-fadeIn">
                  <div className="rounded-xl bg-surface-2 border border-line p-3 space-y-1.5 text-sm">
                    {inv.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between gap-3">
                        <span className="truncate">{item.name} <span className="text-muted num">×{item.quantity}</span></span>
                        <span className="font-semibold num">${fmt(Number(item.sellingPrice) * Number(item.quantity))}</span>
                      </div>
                    ))}
                    {inv.customerPhone && inv.customerPhone !== '—' && (
                      <div className="pt-2 mt-1 border-t border-line text-xs text-muted">
                        الهاتف: <span className="num" dir="ltr">{inv.customerPhone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleCancel(inv)}
                      disabled={cancellingId === inv.id}
                      className="btn btn-danger-soft btn-sm"
                    >
                      <Undo2 className="w-4 h-4" />
                      {cancellingId === inv.id ? 'جاري الإلغاء...' : 'إلغاء الفاتورة وإرجاع المخزون'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="empty">
            <FileText className="w-8 h-8 opacity-50" />
            <span>{invoices.length === 0 ? 'لا توجد فواتير مسجلة بعد' : 'لا توجد نتائج مطابقة'}</span>
          </div>
        )}
        {loading && <div className="empty">جاري التحميل...</div>}
      </div>
    </div>
  );
}
