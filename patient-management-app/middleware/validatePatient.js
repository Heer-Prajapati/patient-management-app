const { body, validationResult } = require('express-validator');

const patientValidationRules = () => {
  return [
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
};

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

module.exports = {
  patientValidationRules,
  validate,
};