import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

function getInitials(name) { return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const priorityColors = {
    low: 'bg-emerald-500 text-emerald-500',
    medium: 'bg-amber-500 text-amber-500',
    high: 'bg-rose-500 text-rose-500'
  };

  const TaskCard = ({ task }) => {
    const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
    return (
      <div 
        onClick={() => navigate(`/projects/${task.project?._id || task.project}`)} 
        className={`group relative bg-white border rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${overdue ? 'border-rose-100' : 'border-slate-100 hover:border-emerald-200'} ${task.status === 'done' ? 'grayscale-[0.5] opacity-80' : ''}`}
      >
        <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:w-1.5 ${task.status === 'done' ? 'bg-emerald-500' : task.status === 'in-progress' ? 'bg-blue-500' : 'bg-emerald-50 group-hover:bg-emerald-500'} ${overdue ? 'bg-rose-500' : ''}`} />

        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border ${overdue ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                {overdue ? 'Overdue' : task.priority}
              </span>
              {task.status === 'done' && (
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] font-black">check</span> Done
                </span>
              )}
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 shadow-[0_0_8px_rgba(0,0,0,0.1)] ${priorityColors[task.priority]?.split(' ')[0] || 'bg-slate-400'}`} />
          </div>

          <h3 className={`text-sm font-bold leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2 ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {task.title}
          </h3>

          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${overdue ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {overdue ? 'history_toggle_off' : task.status === 'done' ? 'task_alt' : 'event'}
              </span>
              {formatDate(task.dueDate)}
            </div>
            
            {task.assignee && (
              <div className="relative">
                <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-[10px] font-bold text-white shadow-sm bg-slate-900 border-2 border-white group-hover:scale-110 transition-transform">
                  {getInitials(task.assignee.name)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    dashboardApi.get()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="loader-spinner" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Workspace...</p>
    </div>
  );

  const stats = data?.stats || {};
  const recentTasks = data?.recentTasks || [];
  
  const todoTasks = recentTasks.filter(t => t.status === 'todo');
  const inProgressTasks = recentTasks.filter(t => t.status === 'in-progress');
  const doneTasks = recentTasks.filter(t => t.status === 'done');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-manrope antialiased text-slate-900 pb-10">
      {/* TopAppBar */}
      <header className="bg-white border-b border-slate-200 shadow-sm flex justify-between items-center w-full px-8 py-5 sticky top-0 z-30">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
            {isAdmin ? 'Team Commander' : 'My Workspace'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{isAdmin ? 'Global Administrator' : 'Productivity Mode'}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
             <span className="text-sm font-bold text-slate-900">{user?.name}</span>
             <span className="text-[10px] text-slate-400 font-medium">{user?.email}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10 border-2 border-white bg-gradient-to-br from-primary to-emerald-600 text-white transform hover:rotate-6 transition-transform cursor-pointer">
            <span className="font-black text-lg">{getInitials(user?.name)}</span>
          </div>
        </div>
      </header>

      {/* Dashboard Canvas */}
      <div className="p-8 space-y-10 max-w-[1600px] mx-auto">
        
        {/* Welcome Section */}
        <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-200/50 group">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.2),transparent)] opacity-60 group-hover:scale-110 transition-transform duration-1000" />
           <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute top-10 right-10 opacity-20 group-hover:rotate-12 transition-transform duration-700">
              <span className="material-symbols-outlined text-[120px] font-thin">auto_awesome</span>
           </div>
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="space-y-5">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Ecosystem
                 </div>
                 <h2 className="text-4xl font-extrabold tracking-tighter leading-tight">
                    Welcome back, <br />
                    <span className="text-emerald-300 drop-shadow-sm">{user?.name?.split(' ')[0]}</span>
                 </h2>
                 <p className="text-emerald-50/80 font-medium max-w-xl text-base leading-relaxed">
                    {isAdmin 
                      ? "The workspace is humming. Your team has hit 92% of this week's targets. Ready to deploy the next phase?"
                      : "Your productivity is peaking. You've cleared 4 tickets in the last sprint. Let's maintain this momentum."}
                 </p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => navigate('/projects')}
                  className="bg-white text-emerald-900 px-8 py-4 rounded-[20px] font-bold uppercase tracking-widest text-[11px] shadow-2xl hover:shadow-emerald-500/20 transition-all flex items-center gap-3 active:scale-95 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                    Deploy Project
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </span>
                </button>
              )}
           </div>
        </section>

        {/* Stats Grid */}
        <motion.section 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* Total Tasks */}
          <motion.div variants={itemVariants} className="group bg-white rounded-[32px] p-7 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-emerald-200 transition-all duration-500 cursor-pointer relative flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:rotate-6 transition-transform shadow-inner">
                 <span className="material-symbols-outlined text-xl">assignment</span>
               </div>
               <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50/50 px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
            </div>
            <div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
                  {isAdmin ? 'Total Pipeline' : 'My Workload'}
               </div>
               <div className="text-4xl font-extrabold text-slate-900 tracking-tighter flex items-end gap-1.5">
                  {stats.totalTasks ?? 0}
                  <span className="text-[10px] font-bold text-slate-300 mb-1.5 uppercase">Items</span>
               </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
          </motion.div>

          {/* Completed */}
          <motion.div variants={itemVariants} className="group bg-white rounded-[32px] p-7 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-teal-200 transition-all duration-500 cursor-pointer relative flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:rotate-6 transition-transform shadow-inner">
                 <span className="material-symbols-outlined text-xl">verified</span>
               </div>
               <span className="text-[9px] font-bold text-teal-500 bg-teal-50/50 px-3 py-1 rounded-full uppercase tracking-widest">Verified</span>
            </div>
            <div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
                  {isAdmin ? 'Team Success' : 'Personal Wins'}
               </div>
               <div className="text-4xl font-extrabold text-slate-900 tracking-tighter flex items-end gap-1.5">
                  {stats.completedTasks ?? 0}
                  <span className="text-[10px] font-bold text-slate-300 mb-1.5 uppercase">Closed</span>
               </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors" />
          </motion.div>

          {/* Overdue */}
          <motion.div variants={itemVariants} className="group bg-white rounded-[32px] p-7 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-green-200 transition-all duration-500 cursor-pointer relative flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:rotate-6 transition-transform shadow-inner">
                 <span className="material-symbols-outlined text-xl">alarm_on</span>
               </div>
               <span className="text-[9px] font-bold text-green-500 bg-green-50/50 px-3 py-1 rounded-full uppercase tracking-widest">Urgent</span>
            </div>
            <div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
                  {isAdmin ? 'System Delays' : 'Attention Reqd'}
               </div>
               <div className="text-4xl font-extrabold text-slate-900 tracking-tighter flex items-end gap-1.5">
                  {stats.overdueTasks ?? 0}
                  <span className="text-[10px] font-bold text-slate-300 mb-1.5 uppercase">Late</span>
               </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors" />
          </motion.div>

          {/* Efficiency */}
          <motion.div variants={itemVariants} className="group bg-white rounded-[32px] p-7 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-primary-200 transition-all duration-500 cursor-pointer relative flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center group-hover:rotate-6 transition-transform shadow-inner">
                 <span className="material-symbols-outlined text-xl">bolt</span>
               </div>
               <div className="relative w-10 h-10">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-100" cx="20" cy="20" fill="transparent" r="17" stroke="currentColor" strokeWidth="3"></circle>
                    <circle className="text-emerald-500 transition-all duration-1000 ease-out" cx="20" cy="20" fill="transparent" r="17" stroke="currentColor" strokeDasharray="106.8" strokeDashoffset={106.8 - (106.8 * (stats.completionRate ?? 0)) / 100} strokeWidth="3" strokeLinecap="round"></circle>
                  </svg>
               </div>
            </div>
            <div>
               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
                  {isAdmin ? 'Team Velocity' : 'Flow Score'}
               </div>
               <div className="text-4xl font-extrabold text-slate-900 tracking-tighter">
                  {stats.completionRate ?? 0}%
               </div>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-900/5 rounded-full blur-3xl group-hover:bg-emerald-900/10 transition-colors" />
          </motion.div>
        </motion.section>

        {/* Kanban Board Area */}
        <div className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-emerald-700 rounded-full" />
                 {isAdmin ? 'Project Pipeline' : 'Personal Priority Queue'}
              </h3>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200" /> Todo</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> In Progress</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Done</span>
              </div>
           </div>

           <motion.section 
             variants={containerVariants}
             initial="hidden"
             animate="show"
             className="grid grid-cols-1 lg:grid-cols-3 gap-8"
           >
             {/* Columns */}
             {[
               { key: 'todo', label: 'Backlog', icon: 'assignment', list: todoTasks, color: 'slate' },
               { key: 'in-progress', label: 'Active Flow', icon: 'pending_actions', list: inProgressTasks, color: 'blue' },
               { key: 'done', label: 'Completed', icon: 'task_alt', list: doneTasks, color: 'emerald' }
             ].map(col => (
               <motion.div key={col.key} variants={itemVariants} className="flex flex-col gap-4">
                 <div className="flex items-center justify-between px-4 py-2">
                   <div className="flex items-center gap-3">
                     <span className={`material-symbols-outlined text-lg font-black text-${col.color}-500`}>{col.icon}</span>
                     <span className="text-sm font-black uppercase tracking-[0.1em] text-slate-900">{col.label}</span>
                   </div>
                   <span className="text-[10px] font-black px-2 py-1 bg-white border border-slate-100 rounded-lg text-slate-400 shadow-sm">{col.list.length}</span>
                 </div>
                 
                 <div className="flex-1 bg-slate-100/50 rounded-[32px] p-4 space-y-4 min-h-[500px] border border-slate-200/50 shadow-inner relative overflow-y-auto max-h-[700px] custom-scrollbar">
                   {col.list.length === 0 ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 text-center p-6 grayscale opacity-40">
                       <span className="material-symbols-outlined text-6xl mb-4">{col.icon}</span>
                       <p className="text-xs font-black uppercase tracking-widest">Pipeline Empty</p>
                     </div>
                   ) : (
                     col.list.map(task => (
                       <TaskCard key={task._id} task={task} />
                     ))
                   )}
                 </div>
               </motion.div>
             ))}
           </motion.section>
        </div>
      </div>
    </div>
  );
}
