// src/components/Reports.jsx
import { useEffect, useState } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { 
  CreditCard, 
  TrendingUp, 
  Printer, 
  Share2, 
  FileText, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

import { getInvoices, getDebts, getProducts } from "../services/dbServie";

export default function Reports({ userId, darkMode, usdRate = 1 }) {
  const [totalDebts, setTotalDebts] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [dailySales, setDailySales] = useState(0);
  const [dailyOrdersCount, setDailyOrdersCount] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [todayProductsSold, setTodayProductsSold] = useState([]);
  const [profitTrendData, setProfitTrendData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      try {
        const invoices = await getInvoices(userId);
        const debtsList = await getDebts(userId);
        const productsList = await getProducts(userId);

        const now = new Date();
        const todayStr = now.toDateString();

        let dailySumUSD = 0;
        let dailyCount = 0;
        let monthlySumUSD = 0;
        let totalCostMonthly = 0;
        const dailyProdMap = {};

        (invoices || []).forEach((inv) => {
          const invAmountUSD = Number(inv.totalAmountUSD || inv.totalAmount || 0);
          monthlySumUSD += invAmountUSD;

          const invDate = inv.createdAt ? new Date(inv.createdAt) : new Date();
          
          if (invDate.toDateString() === todayStr) {
            dailySumUSD += invAmountUSD;
            dailyCount += 1;

            inv.items?.forEach((item) => {
              dailyProdMap[item.name] = (dailyProdMap[item.name] || 0) + Number(item.quantity || 1);
            });
          }

          inv.items?.forEach((item) => {
            const itemCost = Number(item.costPrice || 0);
            const itemQty = Number(item.quantity || 1);
            totalCostMonthly += (itemCost * itemQty);
          });
        });

        const available = [];
        const outOfStock = [];
        
        (productsList || []).forEach((p) => {
          const stock = Number(p.quantity ?? p.stock ?? 0);
          if (stock > 0) {
            available.push({ ...p, calculatedStock: stock });
          } else {
            outOfStock.push({ ...p, calculatedStock: stock });
          }
        });

        const todaySoldArr = Object.keys(dailyProdMap).map((name) => ({
          name,
          qty: dailyProdMap[name]
        }));

        const debtsSumUSD = (debtsList || []).reduce((sum, d) => sum + Number(d.amountUSD || 0), 0);
        
        const calculatedNetProfitUSD = monthlySumUSD > totalCostMonthly 
          ? (monthlySumUSD - totalCostMonthly) 
          : (monthlySumUSD * 0.25);

        const currentRate = usdRate || 1;

        setAvailableProducts(available);
        setOutOfStockProducts(outOfStock);
        setTodayProductsSold(todaySoldArr);
        setTotalDebts(debtsSumUSD * currentRate);
        setMonthlySales(monthlySumUSD * currentRate);
        setDailySales(dailySumUSD * currentRate);
        setDailyOrdersCount(dailyCount);
        setNetProfit(calculatedNetProfitUSD * currentRate);

        setProfitTrendData([
          { period: "الأسبوع 1", profit: (calculatedNetProfitUSD * currentRate) * 0.18 },
          { period: "الأسبوع 2", profit: (calculatedNetProfitUSD * currentRate) * 0.28 },
          { period: "الأسبوع 3", profit: (calculatedNetProfitUSD * currentRate) * 0.22 },
          { period: "الأسبوع 4", profit: (calculatedNetProfitUSD * currentRate) * 0.32 },
        ]);
      } catch (err) {
        console.error("خطأ أثناء تحميل بيانات التقارير:", err);
      }
    };

    loadData();
  }, [userId, usdRate]);

  const handlePrint = (title, contentHtml) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 25px; direction: rtl; text-align: right; }
            h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 22px; }
            .card { border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 14px; }
            th { background-color: #e2e8f0; font-weight: bold; }
            .badge-red { color: #dc2626; font-weight: bold; }
            .badge-green { color: #16a34a; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p style="color: #64748b; font-size: 12px;">تاريخ التقرير: ${new Date().toLocaleString('ar-EG')}</p>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const printMonthlyReport = () => {
    const content = `
      <div class="card">
        <h3>📊 ملخص الجرد والأرباح الشهري (مطعم الفاح)</h3>
        <p><strong>إجمالي المبيعات الشهرية:</strong> ${monthlySales.toLocaleString()} ل.س</p>
        <p><strong>إجمالي صافي الربح:</strong> ${netProfit.toLocaleString()} ل.س</p>
        <p><strong>إجمالي الديون المستحقة:</strong> ${totalDebts.toLocaleString()} ل.س</p>
      </div>
      <h3 class="badge-green">📦 المنتجات الباقية بالمخزون (${availableProducts.length} صنف)</h3>
      <table>
        <tr><th>اسم المنتج</th><th>الكمية المتبقية</th><th>سعر البيع ($)</th></tr>
        ${availableProducts.map(p => `<tr><td>${p.name}</td><td>${p.calculatedStock}</td><td>$${p.sellingPrice || 0}</td></tr>`).join('')}
      </table>
    `;
    handlePrint("تقرير جرد المخزون والأرباح الشهري", content);
  };

  const printDailyReport = () => {
    const dailyProfit = dailySales * 0.25;
    const content = `
      <div class="card">
        <h3>🗓️ ملخص الجرد والمبيعات اليومية</h3>
        <p><strong>المبيعات اليومية:</strong> ${dailySales.toLocaleString()} ل.س</p>
        <p><strong>الربح اليومي التقديري:</strong> ${dailyProfit.toLocaleString()} ل.س</p>
        <p><strong>عدد الطلبات المنفذة:</strong> ${dailyOrdersCount}</p>
      </div>
      <h3>🛒 المنتجات المباعة اليوم</h3>
      <table>
        <tr><th>اسم المنتج</th><th>الكمية المباعة</th></tr>
        ${todayProductsSold.length > 0 
          ? todayProductsSold.map(p => `<tr><td>${p.name}</td><td>${p.qty}</td></tr>`).join('')
          : '<tr><td colspan="2">لا توجد مبيعات مسجلة اليوم</td></tr>'
        }
      </table>
    `;
    handlePrint("تقرير الجرد والمبيعات اليومي", content);
  };

  const shareMonthlyWhatsApp = () => {
    const text = `📊 *تقرير الجرد والأرباح الشهري - مطعم الفاح*
---
📈 *إجمالي صافي الربح:* ${netProfit.toLocaleString()} ل.س
💳 *إجمالي الديون:* ${totalDebts.toLocaleString()} ل.س
---
✅ المنتجات الباقية بالمخزون: ${availableProducts.length} صنف
❌ المنتجات النافذة: ${outOfStockProducts.length} صنف`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const lowStock = [...availableProducts.filter((p) => p.calculatedStock <= (p.minQuantity ?? 5)), ...outOfStockProducts]
    .sort((a, b) => a.calculatedStock - b.calculatedStock);

  const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const chartColor = darkMode ? "#a78bfa" : "#6d4fd6";
  const gridColor = darkMode ? "#262a26" : "#e4e1d8";
  const axisColor = darkMode ? "#8b9288" : "#76726a";

  const statCards = [
    { label: "صافي الربح", value: netProfit, unit: "ل.س", tone: "tone-violet", icon: TrendingUp },
    { label: "الديون المستحقة", value: totalDebts, unit: "ل.س", tone: "tone-danger", icon: CreditCard, valueClass: "!text-danger" },
    { label: "أصناف متوفرة", value: availableProducts.length, unit: "صنف", tone: "tone-brand", icon: CheckCircle2 },
    { label: "أصناف نافدة", value: outOfStockProducts.length, unit: "صنف", tone: "tone-warn", icon: AlertTriangle, valueClass: "!text-warn" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="page-head">
        <div>
          <h2 className="page-title">التقارير والجرد</h2>
          <p className="page-sub">الأرباح، الديون، وحالة المخزون</p>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] sm:flex gap-2 w-full sm:w-auto">
          <button onClick={printMonthlyReport} className="btn btn-primary btn-sm">
            <Printer className="w-4 h-4" />
            <span>التقرير الشهري</span>
          </button>
          <button onClick={printDailyReport} className="btn btn-secondary btn-sm">
            <FileText className="w-4 h-4 text-info" />
            <span>التقرير اليومي</span>
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
                <p className={`stat-value truncate ${s.valueClass || ""}`}>
                  {fmt(s.value)}
                  <span className="stat-unit">{s.unit}</span>
                </p>
              </div>
              <div className={`icon-tile ${s.tone} hidden sm:inline-flex`}><Icon className="w-5 h-5" /></div>
            </div>
          );
        })}
      </div>

      {/* اليوم */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="card card-pad lg:col-span-2">
          <div className="flex items-start justify-between gap-2 mb-5">
            <div>
              <h3 className="section-title">مسار الأرباح</h3>
              <p className="text-xs text-muted mt-1">توزيع تقديري لصافي الربح على أسابيع الشهر</p>
            </div>
            <span className="badge badge-info">تقديري</span>
          </div>
          <div className="h-64 sm:h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="period" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} reversed />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={64} orientation="right" tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  formatter={(v) => [`${fmt(v)} ل.س`, "الربح"]}
                  contentStyle={{
                    backgroundColor: darkMode ? "#141614" : "#ffffff",
                    borderRadius: "12px",
                    border: `1px solid ${gridColor}`,
                    fontSize: 12,
                    direction: "rtl",
                  }}
                />
                <Line type="monotone" dataKey="profit" stroke={chartColor} strokeWidth={2.5} dot={{ r: 4, fill: chartColor, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="section-title mb-4">اليوم</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-surface-2 border border-line p-3">
              <p className="text-[11px] text-muted font-semibold">المبيعات</p>
              <p className="font-bold num mt-0.5">{fmt(dailySales)} <span className="text-[11px] text-muted">ل.س</span></p>
            </div>
            <div className="rounded-xl bg-surface-2 border border-line p-3">
              <p className="text-[11px] text-muted font-semibold">الطلبات</p>
              <p className="font-bold num mt-0.5">{dailyOrdersCount}</p>
            </div>
          </div>
          <p className="label">الأكثر مبيعاً اليوم</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...todayProductsSold].sort((a, b) => b.qty - a.qty).slice(0, 8).map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <span className="badge num">{p.qty}</span>
              </div>
            ))}
            {todayProductsSold.length === 0 && <p className="text-xs text-muted py-4 text-center">لا توجد مبيعات اليوم</p>}
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
          <span className="badge num">{lowStock.length}</span>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">كل المنتجات متوفرة بكميات جيدة 👌</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                <span className="text-sm font-semibold truncate">{p.name}</span>
                <span className={`badge num ${p.calculatedStock <= 0 ? "badge-danger" : "badge-warn"}`}>
                  {p.calculatedStock <= 0 ? "نفد" : `${p.calculatedStock} متبقي`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
