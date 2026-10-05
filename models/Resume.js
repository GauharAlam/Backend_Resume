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
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  shareId: {
    type: String,
    unique: true,
    sparse: true, // Only index if present
    index: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true,
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
// Non-deleted listing index
ResumeSchema.index({ userId: 1, isDeleted: 1, updatedAt: -1 });
// Auto-purge soft-deleted resumes after 30 days
ResumeSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, sparse: true });

module.exports = mongoose.model('Resume', ResumeSchema);