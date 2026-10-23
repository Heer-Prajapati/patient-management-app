const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { patientValidationRules, validate } = require('../middleware/validatePatient');

// @route   POST /api/patients
// @desc    Add a new patient
router.post('/', patientValidationRules(), validate, async (req, res, next) => {
  try {
    const { name, age, gender, contactNumber } = req.body;
    const patient = new Patient({ name, age, gender, contactNumber });
    await patient.save();

    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/patients
// @desc    Get all patients
router.get('/', async (req, res, next) => {
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

// @route   GET /api/patients/:id
// @desc    Get single patient by ID
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/patients/:id
// @desc    Update a patient record
router.put('/:id', patientValidationRules(), validate, async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
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

// @route   DELETE /api/patients/:id
// @desc    Delete a patient record
router.delete('/:id', async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

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

module.exports = router;