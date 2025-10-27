// backend/models/Resume.js
const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a resume title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
    default: 'Untitled Resume',
  },
  resumeData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Please provide resume data'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Create a compound index for efficient querying by user and date
ResumeSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Resume', ResumeSchema);