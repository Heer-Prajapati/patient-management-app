const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

// Load environment variables
dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());

// ==========================================
// 1. MONGODB CONNECTION
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/patientDB';

mongoose
  .connect(MONGO_URI)
  .then((conn) => console.log(`MongoDB Connected: ${conn.connection.host}`))
  .catch((err) => {
    console.error(`Database Connection Error: ${err.message}`);
    process.exit(1);
  });

// ==========================================
// 2. MONGOOSE SCHEMA & AUTO-INCREMENT LOGIC
// ==========================================

// Counter schema to keep track of auto-incrementing numeric IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 100 },
});

const Counter = mongoose.model('Counter', counterSchema);

const patientSchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook using async/await without `next`
patientSchema.pre('save', async function () {
  if (this.isNew && !this._id) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'patientId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this._id = counter.seq;
  }
});

const Patient = mongoose.model('Patient', patientSchema);

// ==========================================
// 3. INPUT VALIDATION MIDDLEWARE
// ==========================================
const patientValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isString()
    .withMessage('Name must be a string'),
  body('age')
    .notEmpty()
    .withMessage('Age is required')
    .isInt({ min: 0, max: 120 })
    .withMessage('Age must be a valid integer between 0 and 120'),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('contactNumber')
    .notEmpty()
    .withMessage('Contact number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Contact number must be a valid 10-digit number'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({ [err.path]: err.msg }));

  return res.status(400).json({
    success: false,
    errors: extractedErrors,
  });
};

// ==========================================
// 4. RESTful API ROUTES (CRUD)
// ==========================================

// Create Patient
app.post('/api/patients', patientValidationRules, validate, async (req, res, next) => {
  try {
    const { id, name, age, gender, contactNumber } = req.body;
    
    const patientData = { name, age, gender, contactNumber };
    if (id) {
      patientData._id = Number(id);
    }

    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

// Get All Patients
app.get('/api/patients', async (req, res, next) => {
  try {
    const patients = await Patient.find();
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
});

// Get Single Patient by ID
app.get('/api/patients/:id', async (req, res, next) => {
  try {
    const patientId = Number(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid Resource ID format' });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
});

// Update Patient
app.put('/api/patients/:id', patientValidationRules, validate, async (req, res, next) => {
  try {
    const patientId = Number(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid Resource ID format' });
    }

    const patient = await Patient.findByIdAndUpdate(patientId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
});

// Delete Patient
app.delete('/api/patients/:id', async (req, res, next) => {
  try {
    const patientId = Number(req.params.id);
    if (isNaN(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid Resource ID format' });
    }

    const patient = await Patient.findByIdAndDelete(patientId);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Patient record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 5. GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'A record with this ID already exists',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid Resource ID format',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

// ==========================================
// 6. START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});