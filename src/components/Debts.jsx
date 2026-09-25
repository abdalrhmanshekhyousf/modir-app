import React, { useState } from 'react';
import {
  Users, Plus, Search, Trash2, Edit3, DollarSign, Coins,
  ArrowDownLeft, ArrowUpRight, X, Phone
} from 'lucide-react';
import { addCustomerToDB, updateCustomerInDB, deleteCustomerFromDB } from '../services/firestoreService';

export default function Debts({ debts = [], exchangeRate = 15000, currency = 'USD' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', note: '' });
  const [debtForm, setDebtForm] = useState({ amountUSD: '', description: '', type: 'debt' });

  const formatMoney = (amountUSD) => {
    if (currency === 'SYP') {
      const syp = (amountUSD || 0) * (exchangeRate || 1);
      return `${syp.toLocaleString()} ل.س`;
    }
    return `$${(amountUSD || 0).toFixed(2)}`;
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;

    try {
      if (editingCustomer) {
        await updateCustomerInDB(editingCustomer.id, { ...customerForm });
      } else {
        const newCustomer = {
          name: customerForm.name,
          phone: customerForm.phone,
          note: customerForm.note,
          createdAt: new Date().toISOString().split('T')[0],
          transactions: []
        };
        await addCustomerToDB(newCustomer);
      }
      closeCustomerModal();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ العميل في قاعدة البيانات');
    }
  };

  const openEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      note: customer.note || ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('هل أنت تأكد من حذف هذا العميل وكافة سجلات الديون الخاصة به؟')) {
      try {
        await deleteCustomerFromDB(customerId);
        if (selectedCustomer?.id === customerId) setSelectedCustomer(null);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء حذف العميل');
      }
    }
  };

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
    setCustomerForm({ name: '', phone: '', note: '' });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !debtForm.amountUSD) return;

    const amount = parseFloat(debtForm.amountUSD);
    const newTx = {
      id: Date.now(),
      type: debtForm.type,
      amountUSD: debtForm.type === 'payment' ? -Math.abs(amount) : Math.abs(amount),
      description: debtForm.description || (debtForm.type === 'debt' ? 'دين جديد' : 'دفعة سداد'),
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    const updatedTx = [newTx, ...(selectedCustomer.transactions || [])];

    try {
      await updateCustomerInDB(selectedCustomer.id, { transactions: updatedTx });
      setSelectedCustomer({ ...selectedCustomer, transactions: updatedTx });
      setIsDebtModalOpen(false);
      setDebtForm({ amountUSD: '', description: '', type: 'debt' });
    } catch (err) {
      console.error(err);
      alert('تعذر تسجيل الحركة المالية في قاعدة البيانات');
    }
  };

  const getCustomerBalance = (customer) => {
    return (customer.transactions || []).reduce((acc, tx) => acc + tx.amountUSD, 0);
  };

  const filteredCustomers = debts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const totalAllDebtsUSD = debts.reduce((acc, c) => acc + Math.max(0, getCustomerBalance(c)), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">إجمالي الديون القائمة</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-500 mt-1">{formatMoney(totalAllDebtsUSD)}</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
              {currency === 'USD' ? `${(totalAllDebtsUSD * exchangeRate).toLocaleString()} ل.س` : `$${totalAllDebtsUSD.toFixed(2)}`}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">إجمالي العملاء المدينين</p>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 mt-1">
              {debts.filter(c => getCustomerBalance(c) > 0).length}
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">من أصل {debts.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">سعر الصرف المعتمد</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-500 mt-1">1$ = {exchangeRate?.toLocaleString()}</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">ليرة سورية</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="البحث باسم العميل أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 focus:border-amber-500 transition-colors text-xs font-bold focus:outline-none"
          />
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setCustomerForm({ name: '', phone: '', note: '' }); setIsCustomerModalOpen(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-black text-stone-800 dark:text-zinc-100">قائمة العملاء ({filteredCustomers.length})</h2>
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center bg-stone-100 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-stone-300 dark:border-zinc-800">
                <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">لا يوجد عملاء مضافون حالياً</p>
              </div>
            ) : (
              filteredCustomers.map(customer => {
                const balanceUSD = getCustomerBalance(customer);
                const isSelected = selectedCustomer?.id === customer.id;
                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 dark:bg-amber-500/15'
                        : 'bg-stone-100 dark:bg-zinc-900/80 border-stone-200/80 dark:border-zinc-800 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-stone-900 dark:text-zinc-100 truncate">{customer.name}</span>
                        {balanceUSD > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black">مطلوب</span>
                        )}
                        {balanceUSD <= 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black">خالي الدين</span>
                        )}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500 dark:text-zinc-400">
                          <Phone className="w-3 h-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-left shrink-0 space-y-1">
                      <p className={`font-black text-xs sm:text-sm ${balanceUSD > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {formatMoney(balanceUSD)}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditCustomer(customer); }}
                          className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                          title="تعديل العميل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id); }}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-stone-500 hover:text-red-500 dark:text-zinc-400"
                          title="حذف العميل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-zinc-100">{selectedCustomer.name}</h3>
                  <p className="text-xs font-bold text-stone-500 dark:text-zinc-400 mt-0.5">
                    الهاتف: {selectedCustomer.phone || 'غير محدد'} {selectedCustomer.note ? `| ملاحظة: ${selectedCustomer.note}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setDebtForm({ amountUSD: '', description: '', type: 'debt' }); setIsDebtModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة دين</span>
                  </button>
                  <button
                    onClick={() => { setDebtForm({ amountUSD: '', description: '', type: 'payment' }); setIsDebtModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-xs shadow-sm transition-all"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>تسديد دفعة</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-500 dark:text-zinc-400">سجل المعاملات والديون</h4>
                {(!selectedCustomer.transactions || selectedCustomer.transactions.length === 0) ? (
                  <div className="p-6 text-center text-xs font-bold text-stone-400 dark:text-zinc-500">
                    لا يوجد ديون أو دفعات مسجلة لهذا العميل بعد.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3.5 rounded-2xl bg-stone-200/50 dark:bg-zinc-950/50 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${tx.type === 'debt' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {tx.type === 'debt' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-black text-stone-800 dark:text-zinc-200">{tx.description}</p>
                            <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500">{tx.date}</span>
                          </div>
                        </div>
                        <div className="text-left font-black">
                          <p className={tx.type === 'debt' ? 'text-amber-500' : 'text-emerald-500'}>
                            {tx.type === 'debt' ? '+' : ''} {formatMoney(tx.amountUSD)}
                          </p>
                          <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500">
                            {currency === 'USD' ? `${((tx.amountUSD) * exchangeRate).toLocaleString()} ل.س` : `$${tx.amountUSD.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] p-8 rounded-3xl bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-stone-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-sm font-black text-stone-700 dark:text-zinc-300">اختر عميلاً من القائمة</h3>
              <p className="text-xs font-bold text-stone-400 dark:text-zinc-500 mt-1">عرض كشف الحساب وتسديد الديون وإدارتها</p>
            </div>
          )}
        </div>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-zinc-800">
              <h3 className="font-black text-sm text-stone-900 dark:text-zinc-100">
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button onClick={closeCustomerModal} className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-stone-600 dark:text-zinc-400 mb-1">اسم العميل</label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="أدخل الاسم الكامل"
                  className="w-full p-2.5 rounded-xl bg-stone-200/50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-stone-600 dark:text-zinc-400 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="09xxxxxxxx"
                  className="w-full p-2.5 rounded-xl bg-stone-200/50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-stone-600 dark:text-zinc-400 mb-1">ملاحظة إضافية</label>
                <textarea
                  value={customerForm.note}
                  onChange={(e) => setCustomerForm({ ...customerForm, note: e.target.value })}
                  placeholder="عنوان أو تفاصيل إضافية..."
                  className="w-full p-2.5 rounded-xl bg-stone-200/50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500 resize-none h-20"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-black hover:bg-amber-600 shadow-md transition-all">
                  حفظ العميل
                </button>
                <button type="button" onClick={closeCustomerModal} className="w-full py-2.5 rounded-xl bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold hover:bg-stone-300 transition-all">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDebtModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-zinc-800">
              <h3 className="font-black text-sm text-stone-900 dark:text-zinc-100">
                {debtForm.type === 'debt' ? 'إضافة دين جديد' : 'تسجيل دفعة سداد'} ({selectedCustomer.name})
              </h3>
              <button onClick={() => setIsDebtModalOpen(false)} className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-stone-600 dark:text-zinc-400 mb-1">المبلغ بالدولار ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={debtForm.amountUSD}
                  onChange={(e) => setDebtForm({ ...debtForm, amountUSD: e.target.value })}
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-xl bg-stone-200/50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500 font-black"
                />
                {debtForm.amountUSD && (
                  <p className="text-[11px] text-amber-500 font-black mt-1">
                    ≈ {(parseFloat(debtForm.amountUSD) * exchangeRate).toLocaleString()} ليرة سورية
                  </p>
                )}
              </div>
              <div>
                <label className="block text-stone-600 dark:text-zinc-400 mb-1">البيان / الوصف</label>
                <input
                  type="text"
                  value={debtForm.description}
                  onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
                  placeholder={debtForm.type === 'debt' ? 'مثال: فاتورة وجبات' : 'مثال: تسديد نقدي'}
                  className="w-full p-2.5 rounded-xl bg-stone-200/50 dark:bg-zinc-950 border border-stone-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-black text-zinc-950 shadow-md transition-all ${
                    debtForm.type === 'debt' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  تأكيد الحفظ
                </button>
                <button type="button" onClick={() => setIsDebtModalOpen(false)} className="w-full py-2.5 rounded-xl bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold hover:bg-stone-300 transition-all">
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