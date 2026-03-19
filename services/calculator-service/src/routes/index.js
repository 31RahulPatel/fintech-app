const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');

// List all calculators
router.get('/', calculatorController.listCalculators);

// Free calculators (no auth required)
router.post('/sip', calculatorController.sipCalculator);
router.post('/compound-interest', calculatorController.compoundInterestCalculator);
router.post('/lumpsum', calculatorController.lumpsumCalculator);

// Premium calculators (auth required)
router.post('/emi', calculatorController.emiCalculator);
router.post('/fd', calculatorController.fdCalculator);
router.post('/rd', calculatorController.rdCalculator);
router.post('/ppf', calculatorController.ppfCalculator);
router.post('/nps', calculatorController.npsCalculator);
router.post('/epf', calculatorController.epfCalculator);
router.post('/gratuity', calculatorController.gratuityCalculator);
router.post('/inflation', calculatorController.inflationCalculator);
router.post('/retirement', calculatorController.retirementCalculator);
router.post('/home-loan', calculatorController.homeLoanCalculator);
router.post('/car-loan', calculatorController.carLoanCalculator);
router.post('/personal-loan', calculatorController.personalLoanCalculator);
router.post('/education-loan', calculatorController.educationLoanCalculator);
router.post('/swp', calculatorController.swpCalculator);
router.post('/goal-planning', calculatorController.goalPlanningCalculator);
router.post('/cagr', calculatorController.cagrCalculator);
router.post('/tax', calculatorController.taxCalculator);

module.exports = router;
