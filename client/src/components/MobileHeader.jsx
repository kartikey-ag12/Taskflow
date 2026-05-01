import { useAuth } from '../context/AuthContext';

export default function MobileHeader({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        <div className="text-xl font-extrabold text-slate-900 tracking-tighter flex items-center gap-0.5">
          Task<span className="text-emerald-500">flow</span>
        </div>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold shadow-sm border border-white">
        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
    </header>
  );
}
