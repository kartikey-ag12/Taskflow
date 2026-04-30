import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authApi.login({ email: form.email, password: form.password });
        // Verify role match before completing login
        if (res.data.user.role !== form.role) {
          toast.error(`This account does not have ${form.role} privileges.`);
          return;
        }
        login(res.data.token, res.data.user);
        toast.success(res.data.message);
        navigate('/');
      } else {
        await authApi.signup(form);
        toast.success('Account created successfully! Please sign in with your credentials.');
        setIsLogin(true);
        setForm({ ...form, password: '' }); // Clear password for security
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 lg:p-8 relative overflow-hidden font-manrope antialiased">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10 min-h-[700px]">
        {/* Left Side: Branding & SaaS Identity */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#10b981_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-20 group cursor-pointer">
               <div className="text-3xl font-extrabold text-white tracking-tighter flex items-center gap-0.5">
                  Task<span className="text-emerald-400">flow</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-3 ml-1" />
               </div>
            </div>
            
            <h2 className="text-5xl font-extrabold leading-[1.1] mb-8 tracking-tighter">
              The only OS your <br />
              <span className="text-emerald-400 relative">
                team
                <svg className="absolute -bottom-2 left-0 w-full h-2 text-emerald-400/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              </span> will ever need.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md font-medium">
              Streamline collaboration, automate complex tasks, and hit your product milestones 2x faster.
            </p>
          </div>

          <div className="relative z-10 mt-12 p-8 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="flex gap-1 text-amber-400 mb-4">
              {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-[16px] fill-1">star</span>)}
            </div>
            <p className="text-base italic text-slate-200 mb-6 font-medium leading-relaxed">
              &quot;Taskflow has completely transformed how our engineering team operates. It&apos;s the most intuitive enterprise platform we&apos;ve ever scaled with.&quot;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-emerald-500/20 text-white">JD</div>
              <div>
                <div className="text-sm font-bold text-white">John Doe</div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">CTO at TechGlobal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="p-8 lg:p-20 flex flex-col justify-center">
          <div className="mb-10 lg:hidden text-center">
             <div className="text-3xl font-extrabold text-slate-900 tracking-tighter flex items-center justify-center gap-0.5 mb-2">
                Task<span className="text-emerald-500">flow</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-3 ml-1" />
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Enterprise OS</p>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {isLogin ? "Access your workspace and continue the flow." : "Join 10,000+ teams scaling their vision today."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Identity Access</label>
              <div className="grid grid-cols-2 gap-4">
                {['member', 'admin'].map(r => (
                  <button 
                    key={r} type="button" onClick={() => setForm({...form, role: r})}
                    className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${form.role === r ? 'border-primary bg-primary/5 text-primary shadow-inner shadow-primary/5' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{r === 'admin' ? 'shield' : 'person_pin'}</span>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                  <span className="material-symbols-outlined text-[14px]">person</span> Full Name
                </label>
                <input 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 font-bold placeholder:text-slate-300 shadow-sm"
                  type="text" placeholder="e.g. Alex Rivera" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                <span className="material-symbols-outlined text-[14px]">alternate_email</span> Email Address
              </label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 font-bold placeholder:text-slate-300 shadow-sm"
                type="email" placeholder="name@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">lock</span> Password
                </label>
                {isLogin && <button type="button" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Forgot?</button>}
              </div>
              <input 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 font-bold placeholder:text-slate-300 shadow-sm"
                type="password" placeholder="••••••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3 group mt-6"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <>
                  <span>{isLogin ? 'Sign in to Dashboard' : 'Create Workspace'}</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-500 mt-10 font-medium">
              {isLogin ? "Don't have an account?" : "Already scaling?"}{' '}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="font-black text-primary hover:underline transition-all underline-offset-4">
                {isLogin ? 'Start for free' : 'Sign in here'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
