const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const patientRoutes = require('./routes/patientRoutes');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body Parser Middleware (allows receiving JSON in req.body)
app.use(express.json());

// API Routes
app.use('/api/patients', patientRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle Invalid MongoDB ObjectId (CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid Resource ID format',
    });
  }

  // Handle duplicate key errors (e.g., unique constraints)
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});