import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { LogIn, UserPlus, Lock, Mail, User, Loader, ShoppingBag, Package, FileText, BarChart3 } from 'lucide-react';

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
          toast.error('صيغة البريد الإلكتروني غير صحيحة');
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
          toast.error('كلمة المرور ضعيفة (6 أحرف على الأقل)');
          break;
        default:
          toast.error('حدث خطأ أثناء الاتصال، يرجى المحاولة لاحقاً');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: ShoppingBag, text: 'نقطة بيع سريعة مع دعم الباركود' },
    { icon: Package, text: 'مخزون يتحدث تلقائياً مع كل بيعة' },
    { icon: FileText, text: 'فواتير وديون وتسديدات' },
    { icon: BarChart3, text: 'تقارير يومية وشهرية' },
  ];

  return (
    <div className="min-h-screen bg-bg grid lg:grid-cols-2" dir="rtl">
      {/* لوحة تعريفية — شاشات كبيرة فقط */}
      <div className="hidden lg:flex relative overflow-hidden bg-brand text-brand-fg p-12 flex-col justify-between">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Modir</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight mb-4">إدارة متجرك<br />من مكان واحد</h2>
          <p className="opacity-80 mb-8 max-w-sm">المبيعات، المخزون، الديون والتقارير — ببساطة ومن أي جهاز.</p>
          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center"><Icon className="w-[18px] h-[18px]" /></span>
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs opacity-70">© {new Date().getFullYear()} Modir</p>
      </div>

      {/* النموذج */}
      <div className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand text-brand-fg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">Modir</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {isSignUp ? 'إنشاء حساب جديد' : 'أهلاً بعودتك'}
          </h1>
          <p className="text-muted text-sm mb-8">
            {isSignUp ? 'أنشئ حسابك وابدأ بإدارة متجرك' : 'سجّل دخولك للمتابعة إلى لوحة التحكم'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="animate-fadeIn">
                <label className="label">الاسم الكامل / اسم المتجر</label>
                <div className="relative">
                  <User className="field-icon right-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: عبد الرحمن"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field !h-12 !pr-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="field-icon right-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field !h-12 !pr-10"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <Lock className="field-icon right-3.5" />
                <input
                  type="password"
                  required
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field !h-12 !pr-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full !mt-6">
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  إنشاء الحساب
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-8">
            {isSignUp ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-brand font-semibold hover:underline underline-offset-4">
              {isSignUp ? 'سجّل دخولك' : 'أنشئ حساباً'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
