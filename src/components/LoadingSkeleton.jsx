import React from 'react';
import { Loader2 } from 'lucide-react';

// 1. عنصر تحميل عام لبطاقات المنتجات
export function ProductSkeletonGrid({ count = 6, darkMode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white/60 border-slate-200'
          }`}
        >
          <div className="space-y-2.5 w-full">
            <div className={`h-4 rounded-md w-1/2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <div className={`h-3 rounded-md w-1/3 ${darkMode ? 'bg-slate-700/60' : 'bg-slate-200/60'}`}></div>
            <div className={`h-3 rounded-md w-1/4 ${darkMode ? 'bg-slate-700/40' : 'bg-slate-200/40'}`}></div>
          </div>
          <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        </div>
      ))}
    </div>
  );
}

// 2. عنصر تحميل للجداول (الفواتير أو الديون)
export function TableSkeletonRows({ rows = 5, darkMode }) {
  return (
    <div className="space-y-3 animate-pulse w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white/60 border-slate-200'
          }`}
        >
          <div className={`h-4 rounded-md w-1/6 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          <div className={`h-4 rounded-md w-1/4 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          <div className={`h-4 rounded-md w-1/5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          <div className={`h-4 rounded-md w-1/12 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        </div>
      ))}
    </div>
  );
}

// 3. شاشة تحميل كاملة مع أيقونة متحركة (Full Screen Loader)
export function FullPageLoader({ message = 'جاري جلب البيانات من السيرفر...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 dir-rtl text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-ping absolute"></div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center relative">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">{message}</p>
    </div>
  );
}