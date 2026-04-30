const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route  GET /api/dashboard
// @desc   Get dashboard stats for current user
router.get('/', async (req, res) => {
  try {
    // Get all projects user belongs to
    const projects = await Project.find({ members: req.user._id });
    const projectIds = projects.map(p => p._id);

    const now = new Date();

    // Total tasks in user's projects
    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
    
    // Completed tasks
    const completedTasks = await Task.countDocuments({ 
      project: { $in: projectIds }, 
      status: 'done' 
    });
    
    // In-progress tasks
    const inProgressTasks = await Task.countDocuments({ 
      project: { $in: projectIds }, 
      status: 'in-progress' 
    });
    
    // Todo tasks
    const todoTasks = await Task.countDocuments({ 
      project: { $in: projectIds }, 
      status: 'todo' 
    });

    // Overdue tasks (past due date, not done)
    const overdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      status: { $ne: 'done' },
      dueDate: { $lt: now, $ne: null }
    });

    // Tasks assigned to me
    const myTasks = await Task.countDocuments({ assignee: req.user._id });

    // Recent tasks (last 5)
    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'title color')
      .populate('assignee', 'name avatar')
      .sort({ updatedAt: -1 })
      .limit(8);

    // Overdue task list (limit 5)
    const overdueList = await Task.find({
      project: { $in: projectIds },
      status: { $ne: 'done' },
      dueDate: { $lt: now, $ne: null }
    })
      .populate('project', 'title color')
      .populate('assignee', 'name avatar')
      .sort({ dueDate: 1 })
      .limit(5);

    // Tasks by priority
    const highPriority = await Task.countDocuments({ project: { $in: projectIds }, priority: 'high', status: { $ne: 'done' } });
    const mediumPriority = await Task.countDocuments({ project: { $in: projectIds }, priority: 'medium', status: { $ne: 'done' } });
    const lowPriority = await Task.countDocuments({ project: { $in: projectIds }, priority: 'low', status: { $ne: 'done' } });

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        myTasks,
        totalProjects: projects.length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      priority: { high: highPriority, medium: mediumPriority, low: lowPriority },
      recentTasks,
      overdueList,
      projects: projects.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
