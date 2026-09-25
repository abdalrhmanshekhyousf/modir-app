import React, { useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Wallet, Percent, ShoppingBag, 
  BarChart2, PieChart as PieChartIcon, Award 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Reports({ invoices = [], products = [], exchangeRate = 15000, currency = 'USD' }) {

  // حساب الحسابات المالية والإحصائيات بأسلوب محسّن الأداء (useMemo)
  const analytics = useMemo(() => {
    let totalRevenueUSD = 0;
    let totalCostUSD = 0;
    const categoryMap = {};
    const productSalesMap = {};

    // معالجة الفواتير غير الملغاة
    invoices.forEach(inv => {
      if (inv.status === 'cancelled') return;

      const invoiceTotal = inv.totalUSD || inv.total || 0;
      totalRevenueUSD += invoiceTotal;

      (inv.items || []).forEach(item => {
        // البحث عن المنتج لجلب سعر التكلفة الحالي إذا لم يكن مسجلاً في بند الفاتورة
        const prod = products.find(p => p.id === item.id);
        const costPrice = item.costPriceUSD ?? (prod?.costPriceUSD || 0);
        const itemCost = costPrice * item.quantity;
        
        totalCostUSD += itemCost;

        // تجميع المبيعات حسب التصنيف
        const cat = item.category || prod?.category || 'عام';
        categoryMap[cat] = (categoryMap[cat] || 0) + ((item.priceUSD || item.price || 0) * item.quantity);

        // تجميع الكميات المبيعة والأرباح لكل منتج
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            profit: 0
          };
        }
        const itemRevenue = (item.priceUSD || item.price || 0) * item.quantity;
        const itemProfit = itemRevenue - itemCost;

        productSalesMap[item.id].quantity += item.quantity;
        productSalesMap[item.id].revenue += itemRevenue;
        productSalesMap[item.id].profit += itemProfit;
      });
    });

    const netProfitUSD = totalRevenueUSD - totalCostUSD;
    const profitMargin = totalRevenueUSD > 0 ? ((netProfitUSD / totalRevenueUSD) * 100).toFixed(1) : 0;

    // بيانات المخطط الدائري (التصنيفات)
    const categoryData = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    }));

    // بيانات قائمة الأغذية/المنتجات الأكثر مبيعاً (أعلى 5)
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // بيانات المخطط الشريطي (آخر الفواتير)
    const recentInvoicesData = invoices
      .filter(inv => inv.status !== 'cancelled')
      .slice(-7)
      .map(inv => {
        const invRevenue = inv.totalUSD || inv.total || 0;
        let invCost = 0;
        (inv.items || []).forEach(item => {
          const prod = products.find(p => p.id === item.id);
          invCost += (item.costPriceUSD ?? (prod?.costPriceUSD || 0)) * item.quantity;
        });
        return {
          id: `#${inv.id}`,
          الإيراد: invRevenue,
          الربح: invRevenue - invCost
        };
      });

    return {
      totalRevenueUSD,
      totalCostUSD,
      netProfitUSD,
      profitMargin,
      categoryData,
      topProducts,
      recentInvoicesData
    };
  }, [invoices, products]);

  // الألوان المستخدمة في المخطط الدائري
  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#64748b'];

  const formatMoney = (amountUSD) => {
    if (currency === 'SYP') {
      return `${((amountUSD || 0) * exchangeRate).toLocaleString()} ل.س`;
    }
    return `$${(amountUSD || 0).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* هيدر الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-100/60 dark:bg-zinc-900/60 p-4 sm:p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            تقارير الأرباح والمبيعات
            <TrendingUp className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 font-medium mt-1">
            تحليل شامل للتكاليف، الأرباح الصافية، والمنتجات الأكثر ربحية.
          </p>
        </div>
      </div>

      {/* كروت الإحصائيات الأربعة الرئيسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي المبيعات */}
        <div className="p-5 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">إجمالي المبيعات (الإيراد)</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-500 mt-1">{formatMoney(analytics.totalRevenueUSD)}</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">${analytics.totalRevenueUSD.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* إجمالي التكلفة */}
        <div className="p-5 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">إجمالي تكلفة البضاعة</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-500 mt-1">{formatMoney(analytics.totalCostUSD)}</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">${analytics.totalCostUSD.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* صافي الربح */}
        <div className="p-5 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">صافي الربح الفعلي</p>
            <h3 className={`text-xl sm:text-2xl font-black mt-1 ${analytics.netProfitUSD >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatMoney(analytics.netProfitUSD)}
            </h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">${analytics.netProfitUSD.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* هامش الربح */}
        <div className="p-5 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-stone-500 dark:text-zinc-400">نسبة هامش الربح</p>
            <h3 className="text-xl sm:text-2xl font-black text-blue-500 mt-1">%{analytics.profitMargin}</h3>
            <p className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">من إجمالي الإيراد</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* قسم المخططات البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* مخطط المبيعات مقابل الأرباح (8 أعمدة) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
            <h3 className="font-black text-stone-900 dark:text-zinc-100 text-sm sm:text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-500" />
              تحليل الإيرادات والربح الصافي (لآخر الفواتير)
            </h3>
          </div>
          <div className="h-72 w-full pt-2">
            {analytics.recentInvoicesData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-stone-400">
                لا توجد بيانات كافية لعرض المخطط حتى الآن
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.recentInvoicesData}>
                  <XAxis dataKey="id" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '16px', borderColor: '#27272a', color: '#fff' }} 
                  />
                  <Bar dataKey="الإيراد" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="الربح" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* مخطط توزيع المبيعات حسب التصنيف (4 أعمدة) */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
            <h3 className="font-black text-stone-900 dark:text-zinc-100 text-sm sm:text-base flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-amber-500" />
              المبيعات حسب التصنيف
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            {analytics.categoryData.length === 0 ? (
              <div className="text-xs text-stone-400">لا توجد مبيعات مسجلة</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analytics.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', borderColor: '#27272a', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* قائمة المنتجات الأكثر تحقيقاً للأرباح */}
      <div className="p-5 sm:p-6 rounded-3xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
          <h3 className="font-black text-stone-900 dark:text-zinc-100 text-sm sm:text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            أكثر 5 منتجات تحقيقاً للأرباح الصافية
          </h3>
        </div>

        {analytics.topProducts.length === 0 ? (
          <div className="text-center py-8 text-xs text-stone-400 font-bold">
            لم يتم تسجيل أي عمليات بيع بعد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {analytics.topProducts.map((prod, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-stone-200/50 dark:bg-zinc-950/50 border border-stone-200/80 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-black text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500">
                    تم بيع {prod.quantity} قطعة
                  </span>
                </div>
                <h4 className="font-black text-xs text-stone-900 dark:text-zinc-100 truncate">{prod.name}</h4>
                <div className="pt-2 border-t border-stone-300/40 dark:border-zinc-800 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-stone-400 block">الإيراد</span>
                    <span className="font-bold text-xs text-stone-700 dark:text-zinc-300">{formatMoney(prod.revenue)}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-stone-400 block">الربح الصافي</span>
                    <span className="font-black text-xs text-emerald-500">{formatMoney(prod.profit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}