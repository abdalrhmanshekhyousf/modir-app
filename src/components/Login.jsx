import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError('فشل تسجيل الدخول. يرجى التحقق من البريد وكلمة السر.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200/80 dark:border-zinc-800 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 p-3.5 rounded-2xl shadow-lg shadow-amber-500/20 text-zinc-950 mb-2">
            <Building2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-zinc-100 tracking-wide">
            تسجيل الدخول إلى <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">MODIR</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            أدخل بيانات حسابك للوصول لنظام إدارة المبيعات
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold tracking-wider text-stone-500 dark:text-zinc-400 uppercase block mb-1.5">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute right-4 top-3.5 text-stone-400 dark:text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@modir.app"
                className="w-full pl-4 pr-11 py-2.5 rounded-2xl bg-stone-200/50 dark:bg-zinc-950/80 border border-stone-300/50 dark:border-zinc-800 text-xs text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold tracking-wider text-stone-500 dark:text-zinc-400 uppercase block mb-1.5">
              كلمة السر
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-4 top-3.5 text-stone-400 dark:text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-2.5 rounded-2xl bg-stone-200/50 dark:bg-zinc-950/80 border border-stone-300/50 dark:border-zinc-800 text-xs text-stone-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/15 active:scale-95 cursor-pointer disabled:opacity-50 mt-6"
          >
            <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
}