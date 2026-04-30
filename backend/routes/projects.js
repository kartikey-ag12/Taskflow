const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// All project routes require auth
router.use(protect);

// @route  GET /api/projects
// @desc   Get all projects for current user
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role')
      .sort({ createdAt: -1 });

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (project) => {
      const taskCount = await Task.countDocuments({ project: project._id });
      const completedCount = await Task.countDocuments({ project: project._id, status: 'done' });
      return {
        ...project.toJSON(),
        taskCount,
        completedCount
      };
    }));

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/projects
// @desc   Create a new project (Admin only)
router.post('/', adminOnly, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, color } = req.body;
    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      members: [req.user._id],
      color: color || '#6366F1'
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar role');

    res.status(201).json({ message: 'Project created!', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/projects/:id
// @desc   Get a single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Check access
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  PUT /api/projects/:id
// @desc   Update project (Admin only)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can edit' });
    }

    const { title, description, status, color } = req.body;
    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (color) project.color = color;

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar role');

    res.json({ message: 'Project updated!', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/projects/:id
// @desc   Delete project (Admin/owner only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/projects/:id/members
// @desc   Add member to project (Admin only)
router.post('/:id/members', adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('members', 'name email avatar role');

    res.json({ message: 'Member added!', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/projects/:id/members/:userId
// @desc   Remove member from project (Admin only)
router.delete('/:id/members/:userId', adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();
    await project.populate('members', 'name email avatar role');

    res.json({ message: 'Member removed', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
