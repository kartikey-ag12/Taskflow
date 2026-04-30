import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: 'grid_view', label: 'Dashboard', exact: true },
  { to: '/projects', icon: 'folder', label: 'Projects' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 relative z-20">
      {/* Logo */}
      <div className="px-8 pb-10 pt-12">
        <div className="flex items-center group cursor-pointer">
          <div className="flex flex-col">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tighter flex items-center gap-0.5">
              Task<span className="text-emerald-500">flow</span>
              <div className="w-1 h-1 rounded-full bg-emerald-500 mt-2.5 ml-0.5" />
            </div>
            <div className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5 opacity-60">
              Enterprise OS
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
        <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
            `}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold shadow-sm border border-white">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 truncate">{user?.name}</div>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
              {user?.role}
            </span>
          </div>
        </div>
        <button 
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all"
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
