import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const PROJECT_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#06b6d4', '#f59e0b', '#14b8a6'];
function getInitials(name) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', color: '#10b981' });
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    projectsApi.getAll()
      .then(res => setProjects(res.data.projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => { setForm({ title: '', description: '', color: '#10b981' }); setEditProject(null); setShowCreate(true); };
  const openEdit = (e, p) => { e.stopPropagation(); setEditProject(p); setForm({ title: p.title, description: p.description, color: p.color }); setShowCreate(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProject) {
        const res = await projectsApi.update(editProject._id, form);
        setProjects(ps => ps.map(p => p._id === editProject._id ? { ...p, ...res.data.project } : p));
        toast.success('Project updated!');
      } else {
        const res = await projectsApi.create(form);
        setProjects(ps => [res.data.project, ...ps]);
        toast.success('Project created!');
      }
      setShowCreate(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsApi.delete(id);
      setProjects(ps => ps.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full min-h-screen bg-slate-50/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">Projects</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {projects.length} active project{projects.length !== 1 ? 's' : ''} in your ecosystem
          </p>
        </div>
        {isAdmin && (
          <button 
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200/50 group"
            onClick={openCreate}
          >
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">add</span>
            New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="loader-spinner" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Fetching Projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm mx-auto max-w-2xl">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
            <span className="material-symbols-outlined text-4xl">folder_off</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">No active projects</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-8 font-medium leading-relaxed">Launch your first initiative to start organizing tasks and collaborating with your team.</p>
          {isAdmin && (
            <button className="bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all" onClick={openCreate}>
              Launch First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {projects.map(p => (
            <div 
              key={p._id} 
              className="group bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-emerald-200 transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden min-h-[320px]"
              onClick={() => navigate(`/projects/${p._id}`)}
            >
              <div className="absolute top-0 left-0 w-full h-2 group-hover:h-3 transition-all duration-500" style={{ backgroundColor: p.color }} />
              
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-6 transition-transform" 
                  style={{ backgroundColor: `${p.color}15`, color: p.color }}
                >
                  <span className="material-symbols-outlined font-black">folder_open</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" onClick={e => e.stopPropagation()}>
                    <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all shadow-sm bg-white" onClick={(e) => openEdit(e, p)}>
                      <span className="material-symbols-outlined text-[18px]">edit_square</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm bg-white" onClick={(e) => handleDelete(e, p._id)}>
                      <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-slate-900 mb-1.5 tracking-tight line-clamp-1" title={p.title}>{p.title}</h3>
                <p className="text-[13px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                  {p.description || 'Seamlessly collaborate on initiatives and track team milestones.'}
                </p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {p.completedCount}/{p.taskCount} Milestones
                  </div>
                  <div className="flex -space-x-2.5">
                    {p.members?.slice(0, 3).map(m => (
                      <div 
                        key={m._id} 
                        className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm bg-slate-900 group-hover:scale-110 transition-transform"
                        title={m.name}
                      >
                        {getInitials(m.name)}
                      </div>
                    ))}
                    {p.members?.length > 3 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 shadow-sm">
                        +{p.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
                
                {p.taskCount > 0 && (
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.round((p.completedCount / p.taskCount) * 100)}%`, backgroundColor: p.color }} 
                    />
                  </div>
                )}
              </div>

              <div className="absolute -right-12 -bottom-12 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                 <span className="material-symbols-outlined text-[160px] font-thin text-emerald-500">folder</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={editProject ? 'Edit Project' : 'Create New Project'}>
        <div className="flex flex-col gap-8">
          {/* Live Preview Card */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 group-hover:text-primary group-hover:scale-110 transition-all duration-700 ease-out">
              <span className="material-symbols-outlined text-6xl">rocket_launch</span>
            </div>
            <div className="flex items-center gap-3">
              <div 
                className="w-5 h-5 rounded-full shadow-sm transition-colors duration-300" 
                style={{ background: form.color }} 
              />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Project Preview</span>
            </div>
            <h3 className="text-2xl font-extrabold text-on-surface leading-tight min-h-[2rem]">
              {form.title || 'Project Name'}
            </h3>
            <p className="text-sm text-on-surface-variant line-clamp-2 min-h-[2.5rem]">
              {form.description || 'Give your project a short description to help your team understand its goals.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {[1, 2].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                    {getInitials('User')}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-medium text-on-surface-variant">Active Project</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Project Title <span className="text-tertiary">*</span>
              </label>
              <input 
                className="w-full px-4 py-3.5 bg-surface-container-high border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-on-surface placeholder:text-on-surface-variant/40"
                type="text" placeholder="e.g. Q4 Marketing Strategy" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">description</span>
                Description
              </label>
              <textarea 
                className="w-full px-4 py-3.5 bg-surface-container-high border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-on-surface placeholder:text-on-surface-variant/40 min-h-[100px] resize-none"
                placeholder="Briefly describe the objectives..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} 
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">palette</span>
                Brand Identity
              </label>
              <div className="flex flex-wrap gap-4">
                {PROJECT_COLORS.map(c => (
                  <button 
                    key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-10 h-10 rounded-full transition-all flex items-center justify-center relative ${form.color === c ? 'ring-4 ring-primary/30 scale-110 shadow-lg' : 'hover:scale-110 hover:shadow-md'}`}
                    style={{ background: c }}
                  >
                    {form.color === c && (
                      <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-6 border-t border-outline-variant/30">
              <button 
                type="button" 
                className="px-6 py-2.5 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all" 
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-10 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 group" 
                disabled={saving}
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{editProject ? 'Save Changes' : 'Create Project'}</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
