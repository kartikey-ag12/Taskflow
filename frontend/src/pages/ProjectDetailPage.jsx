import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, tasksApi, authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

function getInitials(n) { return n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null; }
function isOverdue(task) { return task.dueDate && task.status !== 'done' && new Date() > new Date(task.dueDate); }

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'text-slate-400' },
  { key: 'in-progress', label: 'In Progress', color: 'text-blue-500' },
  { key: 'done', label: 'Done', color: 'text-emerald-500' },
];

const priorityColors = { 
  high: 'bg-rose-500 text-rose-500', 
  medium: 'bg-amber-500 text-amber-500', 
  low: 'bg-emerald-500 text-emerald-500' 
};

const emptyTask = { title: '', description: '', priority: 'medium', dueDate: '', assignee: '' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [saving, setSaving] = useState(false);
  const [viewTask, setViewTask] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsApi.getOne(id),
        tasksApi.getByProject(id)
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAll();
    authApi.getUsers().then(r => setAllUsers(r.data.users));
  }, [id, fetchAll]);

  const openCreateTask = () => { setEditTask(null); setTaskForm(emptyTask); setShowTaskModal(true); };
  const openEditTask = (task) => { setEditTask(task); setTaskForm({ title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '', assignee: task.assignee?._id || '' }); setShowTaskModal(true); setViewTask(null); };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...taskForm, assignee: taskForm.assignee || null, dueDate: taskForm.dueDate || null };
      if (editTask) {
        const res = await tasksApi.update(editTask._id, payload);
        setTasks(ts => ts.map(t => t._id === editTask._id ? res.data.task : t));
        toast.success('Task updated!');
      } else {
        const res = await tasksApi.create(id, payload);
        setTasks(ts => [res.data.task, ...ts]);
        toast.success('Task created!');
      }
      setShowTaskModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await tasksApi.update(taskId, { status: newStatus });
      setTasks(ts => ts.map(t => t._id === taskId ? res.data.task : t));
      if (viewTask?._id === taskId) setViewTask(res.data.task);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      setTasks(ts => ts.filter(t => t._id !== taskId));
      setViewTask(null);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await projectsApi.addMember(id, userId);
      setProject(res.data.project);
      toast.success('Member added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await projectsApi.removeMember(id, userId);
      setProject(res.data.project);
      toast.success('Member removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const nonMembers = allUsers.filter(u => !project?.members?.some(m => m._id === u._id));

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="loader-spinner" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Project Data...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/30">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-12 pb-8 border-b border-slate-100">
        <div className="flex items-start gap-5">
          <button 
            className="mt-1 w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all" 
            onClick={() => navigate('/projects')}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full shadow-lg shadow-emerald-200" style={{ background: project?.color || '#10b981' }} />
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter leading-none">{project?.title}</h1>
            </div>
            {project?.description && <p className="text-sm font-medium text-slate-400 mt-4 max-w-2xl leading-relaxed">{project.description}</p>}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            className="px-6 py-2.5 bg-white border border-slate-100 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm" 
            onClick={() => setShowMembersModal(true)}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Team ({project?.members?.length})
          </button>
          {isAdmin && (
            <button 
              className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 shadow-xl shadow-slate-200 transition-all group" 
              onClick={openCreateTask}
            >
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-180 transition-transform">add</span>
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col h-full min-h-[600px] shadow-xl shadow-slate-200/30 relative group/col">
              <div className="flex justify-between items-center mb-8 px-2">
                <div className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 ${col.color}`}>
                  <div className="relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
                    <span className="absolute w-3 h-3 rounded-full bg-current opacity-20 animate-ping" />
                  </div>
                  {col.label}
                </div>
                <div className="bg-slate-50 px-3 py-0.5 rounded-full text-[9px] font-bold text-slate-500 shadow-inner border border-slate-100">
                  {colTasks.length}
                </div>
              </div>

              {colTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center flex-col text-slate-300 text-center p-10 border-2 border-dashed border-slate-50 rounded-[28px] m-2 bg-slate-50/50">
                  <span className="material-symbols-outlined text-5xl mb-4 opacity-20">
                    {col.key === 'done' ? 'task_alt' : col.key === 'in-progress' ? 'pending_actions' : 'assignment'}
                  </span>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">No {col.label} Tasks</p>
                </div>
              )}

              <div className="space-y-4">
                {colTasks.map(task => {
                  const overdue = isOverdue(task);
                  return (
                    <div 
                      key={task._id} 
                      className={`group relative bg-white border rounded-[28px] p-5 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-200/40 hover:-translate-y-1 overflow-hidden ${overdue ? 'border-rose-100' : 'border-slate-50 hover:border-emerald-200'}`} 
                      onClick={() => setViewTask(task)}
                    >
                      <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-[15px] font-extrabold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors tracking-tight">
                            {task.title}
                          </h3>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(0,0,0,0.1)] ${priorityColors[task.priority].split(' ')[0]}`} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border shadow-sm transition-all ${priorityColors[task.priority].split(' ')[1].replace('text-', 'border-').replace('500', '200/50')} ${priorityColors[task.priority].split(' ')[1].replace('text-', 'bg-').replace('500', '50')} ${priorityColors[task.priority].split(' ')[1]}`}>
                              {task.priority}
                            </span>
                            
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${overdue ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                <span className="material-symbols-outlined text-[12px]">
                                  {overdue ? 'history_toggle_off' : 'calendar_today'}
                                </span>
                                {formatDate(task.dueDate)}
                              </div>
                            )}
                          </div>
                          
                          {task.assignee && (
                            <div className="relative group-hover:scale-110 transition-transform duration-500">
                              <div className="w-8 h-8 rounded-xl flex flex-shrink-0 items-center justify-center text-[8px] font-bold text-white shadow-lg bg-slate-900 border-2 border-white" title={task.assignee.name}>
                                {getInitials(task.assignee.name)}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center border border-slate-50 shadow-sm">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Decorative Element */}
                      <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Task Modal */}
      {viewTask && (
        <Modal isOpen={!!viewTask} onClose={() => setViewTask(null)} title="Task Overview">
          <div className="flex flex-col gap-8">
            {/* Task Header Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 group-hover:text-emerald-600 transition-all duration-500">
                <span className="material-symbols-outlined text-6xl">
                  {viewTask.status === 'done' ? 'task_alt' : viewTask.status === 'in-progress' ? 'pending_actions' : 'assignment'}
                </span>
              </div>
              <div className="flex justify-between items-center z-10">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border ${priorityColors[viewTask.priority].split(' ')[1].replace('text-', 'border-').replace('500', '200')} ${priorityColors[viewTask.priority].split(' ')[1].replace('text-', 'bg-').replace('500', '50')} ${priorityColors[viewTask.priority].split(' ')[1]}`}>
                  {viewTask.priority}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${viewTask.status === 'done' ? 'bg-emerald-500' : viewTask.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewTask.status.replace('-', ' ')}</span>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 leading-tight z-10">
                {viewTask.title}
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">subject</span>
                  Description
                </label>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed min-h-[60px] font-medium">
                  {viewTask.description || <span className="italic opacity-50">No description provided for this task.</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">person</span>
                    Assignee
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm border-2 border-white">
                      {getInitials(viewTask.assignee?.name || 'U')}
                    </div>
                    <span className="text-sm font-bold text-slate-900">{viewTask.assignee?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Due Date
                  </label>
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOverdue(viewTask) ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                    <span className="material-symbols-outlined text-sm">{isOverdue(viewTask) ? 'history_toggle_off' : 'event'}</span>
                    <span className="text-sm font-bold">{formatDate(viewTask.dueDate) || 'No deadline'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">move_item</span>
                  Transition Status
                </label>
                <div className="flex gap-2">
                  {COLUMNS.map(col => {
                    const isCurrentStatus = viewTask.status === col.key;
                    const canTransition = isAdmin || project?.members?.some(m => m._id === user?._id);
                    
                    return (
                      <button 
                        key={col.key} 
                        className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${isCurrentStatus ? 'bg-emerald-500 text-white shadow-lg border-emerald-500 ring-4 ring-emerald-500/10 scale-[1.02]' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 hover:border-emerald-200'} disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
                        onClick={() => handleStatusChange(viewTask._id, col.key)}
                        disabled={isCurrentStatus || !canTransition}
                      >
                        {col.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-3 pt-6 border-t border-slate-50">
                  <button className="flex-1 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-2" onClick={() => openEditTask(viewTask)}>
                    <span className="material-symbols-outlined text-sm">edit</span> Edit Task
                  </button>
                  <button className="flex-1 py-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2" onClick={() => handleDeleteTask(viewTask._id)}>
                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={editTask ? 'Edit Task' : 'Create New Task'}>
        <div className="flex flex-col gap-8">
          {/* Task Preview Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${priorityColors[taskForm.priority].split(' ')[1].replace('text-', 'border-').replace('500', '200')} ${priorityColors[taskForm.priority].split(' ')[1].replace('text-', 'bg-').replace('500', '50')} ${priorityColors[taskForm.priority].split(' ')[1]}`}>
                {taskForm.priority}
              </span>
              <span className="material-symbols-outlined text-emerald-500/30 text-sm">assignment</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight min-h-[1.5rem] tracking-tight">
              {taskForm.title || 'Task Title'}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                <span className="text-[11px] font-bold uppercase tracking-wider">{taskForm.dueDate ? formatDate(taskForm.dueDate) : 'No due date'}</span>
              </div>
              {taskForm.assignee ? (
                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-sm border border-white">
                  {getInitials(project?.members?.find(m => m._id === taskForm.assignee)?.name || 'U')}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-[12px]">person</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleTaskSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input 
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 placeholder:text-slate-300 font-medium"
                type="text" placeholder="e.g. Design landing page hero" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">description</span>
                Description
              </label>
              <textarea 
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 placeholder:text-slate-300 min-h-[100px] resize-none font-medium"
                placeholder="Details about this task..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">priority_high</span>
                  Priority
                </label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 appearance-none cursor-pointer font-bold uppercase tracking-widest text-[10px]"
                    value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  Due Date
                </label>
                <input 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 font-bold uppercase tracking-widest text-[10px]"
                  type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">person_add</span>
                Assignee
              </label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-900 appearance-none cursor-pointer font-bold uppercase tracking-widest text-[10px]"
                  value={taskForm.assignee} onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {project?.members?.filter(m => m.role === 'member').map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-6 border-t border-slate-50">
              <button type="button" className="px-6 py-3 font-bold text-slate-400 hover:text-slate-900 rounded-2xl transition-all uppercase tracking-widest text-[10px]" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button type="submit" className="px-10 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-200 transition-all flex items-center gap-2 group uppercase tracking-widest text-[10px]" disabled={saving}>
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{editTask ? 'Save Changes' : 'Create Task'}</span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Members Modal */}
      <Modal isOpen={showMembersModal} onClose={() => setShowMembersModal(false)} title="Project Collaboration">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-50">
              <span className="material-symbols-outlined text-emerald-500">group</span>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Contributors</h4>
            </div>
            <div className="space-y-3">
              {project?.members?.map(m => (
                <div key={m._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm bg-slate-900 group-hover:scale-110 transition-transform border-2 border-white">
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{m.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">{m.role}</span>
                    {isAdmin && m._id !== project?.owner?._id && (
                      <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all" onClick={() => handleRemoveMember(m._id)} title="Remove">
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isAdmin && nonMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-50">
                <span className="material-symbols-outlined text-emerald-500">person_add</span>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invite Team Members</h4>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {nonMembers.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm bg-slate-200 group-hover:bg-slate-900 transition-all border-2 border-white">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.email}</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-sm" onClick={() => handleAddMember(u._id)}>
                      <span className="material-symbols-outlined text-[14px]">add</span> Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
