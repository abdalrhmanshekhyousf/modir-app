// src/components/Invoices.jsx
import React, { useState, useEffect } from 'react';
import { getInvoices } from '../services/dbServie';
import { FileText } from 'lucide-react';

export default function Invoices({ userId, darkMode, usdRate }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // 🟢 جلب فواتير الحساب الحالي فقط
        const data = await getInvoices(userId);
        setInvoices(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [userId]);

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <FileText className="w-5 h-5 text-emerald-500" />
        <span>سجل الفواتير</span>
      </h2>

      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        <table className="w-full text-right text-sm">
          <thead className={darkMode ? 'bg-zinc-800/50 text-stone-300' : 'bg-stone-100 text-stone-600'}>
            <tr>
              <th className="p-4">تاريخ الفاتورة</th>
              <th className="p-4">عدد المواد</th>
              <th className="p-4">المجموع ($)</th>
              <th className="p-4">المجموع (ل.س)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {invoices.map((inv) => (
              <tr key={inv.id} className={darkMode ? 'hover:bg-zinc-800/30' : 'hover:bg-stone-50'}>
                <td className="p-4 text-xs text-stone-400">
                  {inv.createdAt ? new Date(inv.createdAt).toLocaleString('ar-EG') : 'غير محدد'}
                </td>
                <td className="p-4 font-bold">{inv.items?.length || 0} مواد</td>
                <td className="p-4 text-emerald-400 font-bold">${inv.totalAmountUSD}</td>
                <td className="p-4 font-medium">{inv.totalAmountSYP?.toLocaleString()} ل.س</td>
              </tr>
            ))}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-stone-500">لا توجد فواتير مسجلة لهذا الحساب</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}