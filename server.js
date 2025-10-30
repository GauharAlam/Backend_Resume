const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Backend deployed successfully!");
});


app.use(cors({
  origin: "*", // Allow all domains
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.get("/", (req, res) => {
  res.send("✅ Backend deployed successfully and CORS open for all!");
});
// --- END OF UPDATE ---

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-resume-builder';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumes');

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running successfully!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    msg: err.message || 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});