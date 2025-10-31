// backend/routes/resumes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Resume = require('../models/Resume');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: 'No token provided, authorization denied.' });
  }

  console.log("hiiiiiii");
  

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userName = decoded.name;
    req.userEmail = decoded.email;
    console.log('Decoded JWT:', decoded);
    console.log('User ID from token:', req.userId);
    console.log('User Name from token:', req.userName);
    console.log('User Email from token:', req.userEmail);
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Invalid or expired token.' });
  }
};

// GET all resumes for the logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ msg: 'Error fetching resumes.' });
  }
});

// GET a specific resume by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });

    if (!resume) {
      return res.status(404).json({ msg: 'Resume not found.' });
    }

    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ msg: 'Error fetching resume.' });
  }
});

// POST - Create a new resume
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, resumeData } = req.body;

    if (!title || !resumeData) {
      return res.status(400).json({ msg: 'Please provide title and resumeData.' });
    }

    const newResume = new Resume({
      userId: req.userId,
      title: title.trim(),
      resumeData,
    });

    const savedResume = await newResume.save();
    res.status(201).json(savedResume);
  } catch (error) {
    console.error('Error creating resume:', error);
    res.status(500).json({ msg: 'Error creating resume.' });
  }
});

// PUT - Update an existing resume
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, resumeData } = req.body;

    // Find the resume and verify ownership
    let resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });

    if (!resume) {
      return res.status(404).json({ msg: 'Resume not found or you do not have permission to update it.' });
    }

    // Update fields
    if (title) resume.title = title.trim();
    if (resumeData) resume.resumeData = resumeData;
    resume.updatedAt = new Date();

    const updatedResume = await resume.save();
    res.json(updatedResume);
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ msg: 'Error updating resume.' });
  }
});

// DELETE - Delete a resume
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!resume) {
      return res.status(404).json({ msg: 'Resume not found or you do not have permission to delete it.' });
    }

    res.json({ msg: 'Resume deleted successfully.' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ msg: 'Error deleting resume.' });
  }
});

module.exports = router;