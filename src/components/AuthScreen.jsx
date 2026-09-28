import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { LogIn, UserPlus, Lock, Mail, User, Loader } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (fullName) {
          await updateProfile(user, { displayName: fullName });
        }

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: fullName || '',
          email: email,
          createdAt: new Date().toISOString()
        });

        toast.success(`أهلاً بك يا ${fullName || 'مستخدم جديد'}! تم إنشاء حسابك بنجاح`);
        onLoginSuccess(user);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        toast.success('تم تسجيل الدخول بنجاح!');
        onLoginSuccess(userCredential.user);
      }
    } catch (err) {
      console.error(err);
      switch (err.code) {
        case 'auth/invalid-email':
          toast.error('البريد الإلكتروني غير صالحة صيغته');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          break;
        case 'auth/email-already-in-use':
          toast.error('البريد الإلكتروني مستخدم بالفعل');
          break;
        case 'auth/weak-password':
          toast.error('كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل)');
          break;
        default:
          toast.error('حدث خطأ أثناء الاتصال، يرجى المحاولة لاحقاً');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 dir-rtl" dir="rtl">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isSignUp ? 'أنشئ حسابك للبدء في إدارة متجرك الخاص' : 'أدخل بياناتك للدخول إلى لوحة التحكم'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">الاسم الكامل</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="مثال: عبد الرحمن"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-5 h-5" />
                <span>إنشاء الحساب</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>تسجيل الدخول</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-700/50">
          <p className="text-slate-400 text-sm">
            {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب بعد؟'}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 mr-1 transition-colors"
            >
              {isSignUp ? 'سجّل دخولك' : 'أنشئ حساباً جديداً'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}