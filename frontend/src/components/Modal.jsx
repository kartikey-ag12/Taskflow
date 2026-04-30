import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '520px' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-slate-200/50 w-full max-h-[90vh] flex flex-col animate-slide-up overflow-hidden"
        style={{ maxWidth }}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-50">
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h3>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
