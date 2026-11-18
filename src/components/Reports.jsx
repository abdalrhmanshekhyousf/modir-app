// src/components/Reports.jsx
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import {
  CreditCard,
  TrendingUp,
  Printer,
  Share2,
  FileText,
  AlertTriangle,
  Wallet,
  CalendarDays,
  Info,
  Loader,
} from 'lucide-react';

import { getInvoices, getDebts, getProducts } from '../services/dbServie';

const fmt = (n, digits = 2) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: digits });
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// حساب المبيعات والربح والكمية لمجموعة فواتير
function summarize(invoices) {
  let sales = 0;
  let cost = 0;
  let orders = 0;
  let missingCost = false;
  const byProduct = {};

  invoices.forEach((inv) => {
    orders += 1;
    sales += Number(inv.totalAmountUSD ?? inv.totalAmount ?? 0);
    (inv.items || []).forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.sellingPrice || 0);
      const itemCost = Number(item.costPrice || 0);
      if (!itemCost) missingCost = true;
      cost += itemCost * qty;
      const key = item.name || '—';
      if (!byProduct[key]) byProduct[key] = { name: key, qty: 0, sales: 0 };
      byProduct[key].qty += qty;
      byProduct[key].sales += price * qty;
    });
  });

  const top = Object.values(byProduct).sort((a, b) => b.qty - a.qty);
  return { sales, profit: sales - cost, orders, top, missingCost };
}

export default function Reports({ userId, darkMode, usdRate = 1 }) {
  const [invoices, setInvoices] = useState([]);
  const [debts, setDebts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([getInvoices(userId), getDebts(userId), getProducts(userId)])
      .then(([inv, dbt, prod]) => {
        setInvoices(inv || []);
        setDebts(dbt || []);
        setProducts(prod || []);
      })
      .catch((err) => console.error('خطأ أثناء تحميل بيانات التقارير:', err))
      .finally(() => setLoaded(true));
  }, [userId]);

  const data = useMemo(() => {
    const now = new Date();
    const todayKey = dayKey(now);
    const withDate = invoices.map((inv) => ({ ...inv, _d: inv.createdAt ? new Date(inv.createdAt) : null }));

    const monthInv = withDate.filter((i) => i._d && i._d.getFullYear() === now.getFullYear() && i._d.getMonth() === now.getMonth());
    const todayInv = withDate.filter((i) => i._d && dayKey(i._d) === todayKey);

    // آخر 14 يوم
    const days = [];
    for (let k = 13; k >= 0; k -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - k);
      days.push({ key: dayKey(d), label: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' }), invoices: [] });
    }
    const dayMap = Object.fromEntries(days.map((d) => [d.key, d]));
    withDate.forEach((i) => {
      if (i._d && dayMap[dayKey(i._d)]) dayMap[dayKey(i._d)].invoices.push(i);
    });
    const chart = days.map((d) => {
      const s = summarize(d.invoices);
      return { label: d.label, sales: Math.round(s.sales * 100) / 100, profit: Math.round(s.profit * 100) / 100 };
    });

    const activeDebts = debts.filter((d) => Number(d.amountUSD) > 0);
    const debtsTotal = activeDebts.reduce((s, d) => s + Number(d.amountUSD || 0), 0);

    const stock = products.map((p) => ({ ...p, q: Number(p.quantity ?? 0), min: p.minQuantity ?? 5 }));
    const lowStock = stock.filter((p) => p.q <= p.min).sort((a, b) => a.q - b.q);
    const available = stock.filter((p) => p.q > 0);

    return {
      month: summarize(monthInv),
      today: summarize(todayInv),
      chart,
      debtsTotal,
      debtorsCount: activeDebts.length,
      lowStock,
      available,
      monthName: now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
    };
  }, [invoices, debts, products]);

  const syp = (usd) => `${fmt(usd * usdRate, 0)} ل.س`;

  // ===== الطباعة =====
  const handlePrint = (title, contentHtml) => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    w.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${esc(title)}</title>
          <style>
            body { font-family: "IBM Plex Sans Arabic", system-ui, sans-serif; padding: 28px; color: #1b1a17; }
            h1 { font-size: 22px; margin: 0 0 4px; }
            .muted { color: #76726a; font-size: 12px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
            .box { border: 1px solid #e4e1d8; border-radius: 10px; padding: 12px; }
            .box small { color: #76726a; display: block; margin-bottom: 4px; }
            .box b { font-size: 18px; }
            h3 { font-size: 15px; margin: 22px 0 8px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #e4e1d8; padding: 8px; text-align: right; font-size: 13px; }
            th { background: #f1efe9; }
            .red { color: #d33a4a; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${esc(title)}</h1>
          <div class="muted">تاريخ التقرير: ${esc(new Date().toLocaleString('ar-EG'))} — سعر الصرف: ${fmt(usdRate, 0)} ل.س</div>
          ${contentHtml}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const summaryBoxes = (s) => `
    <div class="grid">
      <div class="box"><small>المبيعات</small><b>$${fmt(s.sales)}</b><br/><small>${syp(s.sales)}</small></div>
      <div class="box"><small>صافي الربح</small><b>$${fmt(s.profit)}</b><br/><small>${syp(s.profit)}</small></div>
      <div class="box"><small>عدد الفواتير</small><b>${s.orders}</b></div>
    </div>`;

  const topTable = (top) => `
    <table>
      <tr><th>المنتج</th><th>الكمية المباعة</th><th>المبيعات ($)</th></tr>
      ${top.length ? top.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.qty}</td><td>${fmt(p.sales)}</td></tr>`).join('') : '<tr><td colspan="3">لا توجد مبيعات</td></tr>'}
    </table>`;

  const printMonthlyReport = () => {
    handlePrint(
      `التقرير الشهري — ${data.monthName}`,
      `${summaryBoxes(data.month)}
      <div class="box"><small>الديون المستحقة</small><b class="red">$${fmt(data.debtsTotal)}</b> <small>(${data.debtorsCount} عميل)</small></div>
      <h3>المبيعات حسب المنتج</h3>${topTable(data.month.top)}
      <h3>المخزون المتوفر (${data.available.length} صنف)</h3>
      <table>
        <tr><th>المنتج</th><th>الكمية</th><th>سعر البيع ($)</th></tr>
        ${data.available.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.q}</td><td>${fmt(p.sellingPrice)}</td></tr>`).join('')}
      </table>`
    );
  };

  const printDailyReport = () => {
    handlePrint('التقرير اليومي', `${summaryBoxes(data.today)}<h3>المنتجات المباعة اليوم</h3>${topTable(data.today.top)}`);
  };

  const shareMonthlyWhatsApp = () => {
    const text = `📊 *تقرير ${data.monthName}*
---
💰 المبيعات: $${fmt(data.month.sales)} (${syp(data.month.sales)})
📈 صافي الربح: $${fmt(data.month.profit)} (${syp(data.month.profit)})
🧾 عدد الفواتير: ${data.month.orders}
💳 الديون المستحقة: $${fmt(data.debtsTotal)}
---
⚠️ منتجات منخفضة أو نافدة: ${data.lowStock.length}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const colors = darkMode
    ? { sales: '#60a5fa', profit: '#34d399', grid: '#262a26', axis: '#8b9288', bg: '#141614' }
    : { sales: '#2563eb', profit: '#0e8f63', grid: '#e4e1d8', axis: '#76726a', bg: '#ffffff' };

  const statCards = [
    { label: 'مبيعات الشهر', usd: data.month.sales, tone: 'tone-info', icon: Wallet },
    { label: 'ربح الشهر', usd: data.month.profit, tone: 'tone-brand', icon: TrendingUp, valueClass: '!text-brand' },
    { label: 'مبيعات اليوم', usd: data.today.sales, tone: 'tone-violet', icon: CalendarDays, sub: `${data.today.orders} فاتورة` },
    { label: 'الديون المستحقة', usd: data.debtsTotal, tone: 'tone-danger', icon: CreditCard, valueClass: '!text-danger', sub: `${data.debtorsCount} عميل` },
  ];

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted text-sm" dir="rtl">
        <Loader className="w-6 h-6 animate-spin text-brand" />
        جاري تحميل التقارير...
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="page-head">
        <div>
          <h2 className="page-title">التقارير والجرد</h2>
          <p className="page-sub">{data.monthName}</p>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] sm:flex gap-2 w-full sm:w-auto">
          <button onClick={printMonthlyReport} className="btn btn-primary btn-sm">
            <Printer className="w-4 h-4" />
            التقرير الشهري
          </button>
          <button onClick={printDailyReport} className="btn btn-secondary btn-sm">
            <FileText className="w-4 h-4 text-info" />
            التقرير اليومي
          </button>
          <button onClick={shareMonthlyWhatsApp} className="btn btn-secondary btn-icon !w-9 !h-9" title="مشاركة عبر واتساب">
            <Share2 className="w-4 h-4 text-brand" />
          </button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card stat">
              <div className="min-w-0">
                <p className="stat-label">{s.label}</p>
                <p className={`stat-value truncate ${s.valueClass || ''}`}>${fmt(s.usd)}</p>
                <p className="text-[11px] text-muted num mt-0.5 truncate">{s.sub || syp(s.usd)}</p>
              </div>
              <div className={`icon-tile ${s.tone} hidden sm:inline-flex`}><Icon className="w-5 h-5" /></div>
            </div>
          );
        })}
      </div>

      {data.month.missingCost && (
        <div className="flex items-start gap-2 text-xs text-muted bg-surface-2 border border-line rounded-xl p-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-info" />
          بعض المنتجات المباعة بدون سعر تكلفة، فيُحسب سعر بيعها كاملاً كربح. أضف سعر التكلفة من صفحة المخزون لدقة أكبر.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* الرسم البياني */}
        <div className="card card-pad lg:col-span-2 min-w-0">
          <div className="mb-5">
            <h3 className="section-title">المبيعات والأرباح — آخر 14 يوم</h3>
            <p className="text-xs text-muted mt-1">بالدولار</p>
          </div>
          <div className="h-64 sm:h-72 w-full" dir="ltr">
            {loaded && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chart} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barGap={2}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="label" stroke={colors.axis} fontSize={10} tickLine={false} axisLine={false} reversed interval="preserveStartEnd" />
                  <YAxis stroke={colors.axis} fontSize={10} tickLine={false} axisLine={false} width={44} orientation="right" tickFormatter={(v) => fmt(v, 0)} />
                  <Tooltip
                    cursor={{ fill: colors.grid, opacity: 0.4 }}
                    formatter={(v, name) => [`$${fmt(v)}`, name === 'sales' ? 'المبيعات' : 'الربح']}
                    contentStyle={{ backgroundColor: colors.bg, borderRadius: 12, border: `1px solid ${colors.grid}`, fontSize: 12, direction: 'rtl' }}
                  />
                  <Legend formatter={(v) => (v === 'sales' ? 'المبيعات' : 'الربح')} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sales" fill={colors.sales} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="profit" fill={colors.profit} radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* الأكثر مبيعاً */}
        <div className="card card-pad">
          <h3 className="section-title mb-1">الأكثر مبيعاً</h3>
          <p className="text-xs text-muted mb-4">هذا الشهر</p>
          <div className="space-y-3">
            {data.month.top.slice(0, 7).map((p, idx) => {
              const max = data.month.top[0]?.qty || 1;
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate"><span className="text-muted num ml-1.5">{idx + 1}.</span>{p.name}</span>
                    <span className="font-semibold num">{p.qty}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(p.qty / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            {data.month.top.length === 0 && <p className="text-xs text-muted py-6 text-center">لا توجد مبيعات هذا الشهر</p>}
          </div>
        </div>
      </div>

      {/* تنبيهات المخزون */}
      <div className="card card-pad">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">
            <AlertTriangle className="w-[18px] h-[18px] text-warn" />
            تنبيهات المخزون
          </h3>
          <span className="badge num">{data.lowStock.length}</span>
        </div>
        {data.lowStock.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">كل المنتجات متوفرة بكميات جيدة 👌</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                <span className="text-sm font-semibold truncate">{p.name}</span>
                <span className={`badge num ${p.q <= 0 ? 'badge-danger' : 'badge-warn'}`}>{p.q <= 0 ? 'نفد' : `${p.q} متبقي`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
