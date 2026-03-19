const mongoose = require('mongoose');

const calculatorUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  calculatorType: {
    type: String,
    required: true,
    enum: [
      'SIP', 'CompoundInterest', 'Lumpsum',
      'EMI', 'FD', 'RD', 'PPF', 'NPS', 'EPF', 'Gratuity',
      'Inflation', 'Retirement', 'HomeLoan', 'CarLoan',
      'PersonalLoan', 'EducationLoan', 'SWP', 'GoalPlanning', 'CAGR', 'Tax'
    ]
  },
  inputs: { type: mongoose.Schema.Types.Mixed },
  result: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

calculatorUsageSchema.index({ createdAt: -1 });
calculatorUsageSchema.index({ calculatorType: 1 });
calculatorUsageSchema.index({ userId: 1 });

module.exports = mongoose.model('CalculatorUsage', calculatorUsageSchema);
