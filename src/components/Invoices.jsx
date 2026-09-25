import React, { useState } from 'react';
import {
  FileText, Search, DollarSign, Printer, Send,
  Trash2, X, Eye, CheckCircle2, XCircle, TrendingUp, Hash
} from 'lucide-react';
import { cancelInvoiceInDB, deleteInvoiceFromDB } from '../services/firestoreService';

export default function Invoices({ invoices = [], exchangeRate = 15000 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const totalSalesUSD = invoices
    .filter(inv => inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + (inv.totalUSD || inv.total || 0), 0);
  const totalSalesSYP = totalSalesUSD * exchangeRate;
  const activeInvoicesCount = invoices.filter(inv => inv.status !== 'cancelled').length;
  const averageInvoiceValue = activeInvoicesCount > 0 ? (totalSalesUSD / activeInvoicesCount) : 0;

  const filteredInvoices = invoices.filter(inv => {
    const invIdStr = inv.invoiceNumber || inv.id || '';
    const matchesSearch =
      invIdStr.toString().includes(searchTerm) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.customerPhone && inv.customerPhone.includes(searchTerm));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'paid' && inv.status !== 'cancelled') ||
      (statusFilter === 'cancelled' && inv.status === 'cancelled');

    return matchesSearch && matchesStatus;
  });

  const handleCancelInvoice = async (invoiceId) => {
    if (window.confirm('هل أنت تأكد من إبطال / إلغاء هذه الفاتورة؟')) {
      try {
        await cancelInvoiceInDB(invoiceId);
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice(prev => ({ ...prev, status: 'cancelled' }));
        }
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء إلغاء الفاتورة');
      }
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm('هل أنت تأكد من حذف الفاتورة نهائياً من الأرشيف؟')) {
      try {
        await deleteInvoiceFromDB(invoiceId);
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice(null);
        }
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء حذف الفاتورة');
      }
    }
  };

  const handleSendWhatsApp = (invoice) => {
    const phone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    if (!phone) {
      alert('لا يوجد رقم هاتف مسجل لهذه الفاتورة');
      return;
    }

    let itemsText = (invoice.items || []).map(item =>
      `${item.name} x ${item.quantity} = $${((item.priceUSD || item.price) * item.quantity).toFixed(2)}`
    ).join('\n');

    const totalSYP = ((invoice.totalUSD || invoice.total) * (invoice.exchangeRate || exchangeRate)).toLocaleString();
    const message = `فاتورة مبيعات\nرقم الفاتورة: #${invoice.invoiceNumber || invoice.id}\nالزبون: ${invoice.customerName || 'زبون عام'}\nالتاريخ: ${invoice.date}\n\nتفاصيل الطلب:\n${itemsText}\n\nالإجمالي: $${(invoice.totalUSD || invoice.total).toFixed(2)} (${totalSYP} ل.س)\nشكراً لتسوقكم معنا!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-100/60 dark:bg-zinc-900/60 p-4 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            أرشيف الفواتير والمبيعات
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 font-medium mt-1">
            متابعة استعراض، طباعة، وإعادة إرسال الفواتير الصادرة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">إجمالي المبيعات</p>
            <h3 className="text-xl font-black text-amber-500 mt-1">${totalSalesUSD.toFixed(2)}</h3>
            <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-500">{totalSalesSYP.toLocaleString()} ل.س</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">عدد الفواتير الناجحة</p>
            <h3 className="text-xl font-black text-stone-900 dark:text-zinc-100 mt-1">{activeInvoicesCount} فاتورة</h3>
            <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-500">من أصل {invoices.length} إجمالي</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">متوسط قيمة الفاتورة</p>
            <h3 className="text-xl font-black text-stone-900 dark:text-zinc-100 mt-1">${averageInvoiceValue.toFixed(2)}</h3>
            <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-500">لكل عملية بيع</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-2/3 relative">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="البحث برقم الفاتورة، اسم الزبون، أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 rounded-2xl bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200 dark:border-zinc-800 text-stone-900 dark:text-zinc-100 font-bold placeholder-stone-400 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="w-full md:w-auto flex items-center gap-2 bg-stone-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-stone-200 dark:border-zinc-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              statusFilter === 'paid' ? 'bg-emerald-500 text-white shadow-md' : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            المدفوعة
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              statusFilter === 'cancelled' ? 'bg-rose-500 text-white shadow-md' : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            الملغاة
          </button>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-stone-100/40 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-stone-300 dark:border-zinc-800">
          <FileText className="w-12 h-12 mx-auto text-stone-400 dark:text-zinc-600 mb-3 opacity-60" />
          <p className="text-stone-600 dark:text-zinc-400 font-bold">لا يوجد فواتير مطابقة للبث</p>
        </div>
      ) : (
        <div className="bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-stone-200/60 dark:bg-zinc-800/60 text-stone-600 dark:text-zinc-400 text-xs font-black uppercase">
                <tr>
                  <th className="p-4">رقم الفاتورة</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الزبون</th>
                  <th className="p-4">المبلغ ($)</th>
                  <th className="p-4">المبلغ (ل.س)</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 dark:divide-zinc-800/60">
                {filteredInvoices.map((inv) => {
                  const invTotalUSD = inv.totalUSD || inv.total || 0;
                  const invRate = inv.exchangeRate || exchangeRate;
                  const invTotalSYP = invTotalUSD * invRate;
                  const isCancelled = inv.status === 'cancelled';
                  return (
                    <tr key={inv.id} className={`hover:bg-stone-200/30 dark:hover:bg-zinc-800/30 transition ${isCancelled ? 'opacity-60 bg-rose-500/5' : ''}`}>
                      <td className="p-4 font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        <span>{inv.invoiceNumber || inv.id}</span>
                      </td>
                      <td className="p-4 font-medium text-stone-600 dark:text-zinc-300 text-xs">
                        {inv.date || 'اليوم'}
                      </td>
                      <td className="p-4 font-bold text-stone-900 dark:text-zinc-100">
                        <div>{inv.customerName || 'زبون عام'}</div>
                        {inv.customerPhone && (
                          <div className="text-[11px] font-normal text-stone-400 dir-ltr text-right">{inv.customerPhone}</div>
                        )}
                      </td>
                      <td className="p-4 font-black text-stone-900 dark:text-zinc-100">
                        ${invTotalUSD.toFixed(2)}
                      </td>
                      <td className="p-4 font-bold text-stone-500 dark:text-zinc-400 text-xs">
                        {invTotalSYP.toLocaleString()} ل.س
                      </td>
                      <td className="p-4">
                        {isCancelled ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> ملغاة
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> مدفوعة
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-2 rounded-xl bg-stone-200/80 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-amber-500 hover:text-zinc-950 transition cursor-pointer"
                            title="معاينة التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(inv)}
                            className="p-2 rounded-xl bg-stone-200/80 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                            title="إرسال عبر الواتساب"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          {!isCancelled ? (
                            <button
                              onClick={() => handleCancelInvoice(inv.id)}
                              className="p-2 rounded-xl bg-stone-200/80 dark:bg-zinc-800 text-rose-500 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                              title="إلغاء الفاتورة"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-2 rounded-xl bg-stone-200/80 dark:bg-zinc-800 text-stone-400 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-300 dark:border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-stone-900 dark:text-zinc-100 text-base">
                  فاتورة #{selectedInvoice.invoiceNumber || selectedInvoice.id}
                </h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-stone-200/50 dark:bg-zinc-950 p-3 rounded-2xl">
              <div>
                <span className="text-stone-400 dark:text-zinc-500 block">الزبون</span>
                <span className="font-bold text-stone-800 dark:text-zinc-200">{selectedInvoice.customerName || 'زبون عام'}</span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-zinc-500 block">التاريخ</span>
                <span className="font-bold text-stone-800 dark:text-zinc-200">{selectedInvoice.date || 'اليوم'}</span>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-xs font-black text-stone-500 dark:text-zinc-400">المنتجات المطلوبة:</span>
              {(selectedInvoice.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-200/50 dark:border-zinc-800/50">
                  <span className="font-bold text-stone-800 dark:text-zinc-200">{item.name} x {item.quantity}</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    ${((item.priceUSD || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-zinc-400">
                <span>سعر الصرف المعتمد:</span>
                <span className="font-bold">1$ = {(selectedInvoice.exchangeRate || exchangeRate).toLocaleString()} ل.س</span>
              </div>
              <div className="flex justify-between text-base font-black text-stone-900 dark:text-zinc-100 pt-1">
                <span>المبلغ الإجمالي:</span>
                <div className="text-left">
                  <div className="text-amber-500">${(selectedInvoice.totalUSD || selectedInvoice.total || 0).toFixed(2)}</div>
                  <div className="text-[11px] font-bold text-stone-400 dark:text-zinc-500">
                    {((selectedInvoice.totalUSD || selectedInvoice.total || 0) * (selectedInvoice.exchangeRate || exchangeRate)).toLocaleString()} ل.س
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={() => handleSendWhatsApp(selectedInvoice)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>إرسال واتساب</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs transition cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}