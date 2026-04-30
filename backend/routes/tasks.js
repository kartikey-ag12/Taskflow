const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// Helper: check project access
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const isMember = project.members.some(m => m.toString() === userId.toString());
  if (!isMember) return { error: 'Access denied', status: 403 };
  return { project };
};

// @route  GET /api/tasks/project/:projectId
// @desc   Get all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { project, error, status } = await checkProjectAccess(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const { status: taskStatus, priority, assignee } = req.query;
    const filter = { project: req.params.projectId };
    if (taskStatus) filter.status = taskStatus;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/tasks/project/:projectId
// @desc   Create task in project (Admin only)
router.post('/project/:projectId', adminOnly, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { project, error, status } = await checkProjectAccess(req.params.projectId, req.user._id);
    if (error) return res.status(status).json({ message: error });

    const { title, description, priority, dueDate, assignee } = req.body;

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignee: assignee || null,
      project: req.params.projectId,
      createdBy: req.user._id
    });

    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ message: 'Task created!', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  PUT /api/tasks/:id
// @desc   Update task (Admin: all fields, Member: status only for assigned tasks)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check project access
    const isMember = task.project.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    }

    if (isAdmin) {
      // Admin can update all fields
      const { title, description, status, priority, dueDate, assignee } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (assignee !== undefined) task.assignee = assignee || null;
    } else {
      // Member can only update status
      if (req.body.status) task.status = req.body.status;
    }

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');

    res.json({ message: 'Task updated!', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/tasks/:id
// @desc   Delete task (Admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
