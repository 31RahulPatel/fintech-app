const logger = require('../utils/logger');

// Calculator metadata
const calculators = [
  { id: 'sip', name: 'SIP Calculator', description: 'Calculate Systematic Investment Plan returns', free: true },
  { id: 'compound-interest', name: 'Compound Interest', description: 'Calculate compound interest on investments', free: true },
  { id: 'lumpsum', name: 'Lumpsum Calculator', description: 'Calculate returns on one-time investment', free: true },
  { id: 'emi', name: 'EMI Calculator', description: 'Calculate Equated Monthly Installment', free: false },
  { id: 'fd', name: 'FD Calculator', description: 'Calculate Fixed Deposit maturity amount', free: false },
  { id: 'rd', name: 'RD Calculator', description: 'Calculate Recurring Deposit maturity', free: false },
  { id: 'ppf', name: 'PPF Calculator', description: 'Calculate Public Provident Fund returns', free: false },
  { id: 'nps', name: 'NPS Calculator', description: 'National Pension Scheme calculator', free: false },
  { id: 'epf', name: 'EPF Calculator', description: 'Employee Provident Fund calculator', free: false },
  { id: 'gratuity', name: 'Gratuity Calculator', description: 'Calculate gratuity amount', free: false },
  { id: 'inflation', name: 'Inflation Calculator', description: 'Calculate inflation adjusted values', free: false },
  { id: 'retirement', name: 'Retirement Calculator', description: 'Plan your retirement corpus', free: false },
  { id: 'home-loan', name: 'Home Loan Calculator', description: 'Calculate home loan EMI and schedule', free: false },
  { id: 'car-loan', name: 'Car Loan Calculator', description: 'Calculate car loan EMI', free: false },
  { id: 'personal-loan', name: 'Personal Loan Calculator', description: 'Calculate personal loan EMI', free: false },
  { id: 'education-loan', name: 'Education Loan Calculator', description: 'Calculate education loan EMI', free: false },
  { id: 'swp', name: 'SWP Calculator', description: 'Systematic Withdrawal Plan calculator', free: false },
  { id: 'goal-planning', name: 'Goal Planning', description: 'Plan investments for financial goals', free: false },
  { id: 'cagr', name: 'CAGR Calculator', description: 'Calculate Compound Annual Growth Rate', free: false },
  { id: 'tax', name: 'Tax Calculator', description: 'Calculate income tax liability', free: false }
];

// List all calculators
exports.listCalculators = (req, res) => {
  res.json({ calculators });
};

// SIP Calculator (FREE)
exports.sipCalculator = (req, res) => {
  try {
    const { monthlyInvestment, expectedReturn, timePeriod } = req.body;
    
    const monthlyRate = expectedReturn / 100 / 12;
    const months = timePeriod * 12;
    
    const futureValue = monthlyInvestment * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    const totalInvestment = monthlyInvestment * months;
    const totalReturns = futureValue - totalInvestment;
    
    logger.info('SIP calculation performed');
    
    res.json({
      calculator: 'SIP',
      input: { monthlyInvestment, expectedReturn, timePeriod },
      result: {
        futureValue: Math.round(futureValue),
        totalInvestment: Math.round(totalInvestment),
        totalReturns: Math.round(totalReturns),
        absoluteReturns: ((totalReturns / totalInvestment) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    logger.error(`SIP calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Compound Interest Calculator (FREE)
exports.compoundInterestCalculator = (req, res) => {
  try {
    const { principal, rate, time, compoundingFrequency = 12 } = req.body;
    
    const amount = principal * Math.pow((1 + rate / 100 / compoundingFrequency), compoundingFrequency * time);
    const interest = amount - principal;
    
    logger.info('Compound Interest calculation performed');
    
    res.json({
      calculator: 'Compound Interest',
      input: { principal, rate, time, compoundingFrequency },
      result: {
        maturityAmount: Math.round(amount),
        totalInterest: Math.round(interest),
        effectiveRate: (((amount / principal) - 1) / time * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    logger.error(`Compound Interest calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Lumpsum Calculator (FREE)
exports.lumpsumCalculator = (req, res) => {
  try {
    const { investment, expectedReturn, timePeriod } = req.body;
    
    const futureValue = investment * Math.pow((1 + expectedReturn / 100), timePeriod);
    const totalReturns = futureValue - investment;
    
    logger.info('Lumpsum calculation performed');
    
    res.json({
      calculator: 'Lumpsum',
      input: { investment, expectedReturn, timePeriod },
      result: {
        futureValue: Math.round(futureValue),
        totalReturns: Math.round(totalReturns),
        absoluteReturns: ((totalReturns / investment) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    logger.error(`Lumpsum calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// EMI Calculator (PREMIUM)
exports.emiCalculator = (req, res) => {
  try {
    const { principal, rate, tenure } = req.body;
    
    const monthlyRate = rate / 100 / 12;
    const months = tenure * 12;
    
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;
    
    // Generate amortization schedule
    const schedule = [];
    let balance = principal;
    for (let i = 1; i <= Math.min(months, 12); i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;
      schedule.push({
        month: i,
        emi: Math.round(emi),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(Math.max(0, balance))
      });
    }
    
    logger.info('EMI calculation performed');
    
    res.json({
      calculator: 'EMI',
      input: { principal, rate, tenure },
      result: {
        monthlyEmi: Math.round(emi),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest),
        schedule
      }
    });
  } catch (error) {
    logger.error(`EMI calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// FD Calculator (PREMIUM)
exports.fdCalculator = (req, res) => {
  try {
    const { principal, rate, tenure, compoundingFrequency = 4 } = req.body;
    
    const maturityAmount = principal * Math.pow((1 + rate / 100 / compoundingFrequency), compoundingFrequency * tenure);
    const totalInterest = maturityAmount - principal;
    
    logger.info('FD calculation performed');
    
    res.json({
      calculator: 'FD',
      input: { principal, rate, tenure, compoundingFrequency },
      result: {
        maturityAmount: Math.round(maturityAmount),
        totalInterest: Math.round(totalInterest),
        effectiveYield: ((maturityAmount / principal - 1) / tenure * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    logger.error(`FD calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// RD Calculator (PREMIUM)
exports.rdCalculator = (req, res) => {
  try {
    const { monthlyDeposit, rate, tenure } = req.body;
    
    const quarterlyRate = rate / 100 / 4;
    const quarters = tenure * 4;
    
    let maturityAmount = 0;
    for (let i = 0; i < quarters; i++) {
      maturityAmount += monthlyDeposit * 3 * Math.pow(1 + quarterlyRate, quarters - i);
    }
    
    const totalDeposit = monthlyDeposit * tenure * 12;
    const totalInterest = maturityAmount - totalDeposit;
    
    logger.info('RD calculation performed');
    
    res.json({
      calculator: 'RD',
      input: { monthlyDeposit, rate, tenure },
      result: {
        maturityAmount: Math.round(maturityAmount),
        totalDeposit: Math.round(totalDeposit),
        totalInterest: Math.round(totalInterest)
      }
    });
  } catch (error) {
    logger.error(`RD calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// PPF Calculator (PREMIUM)
exports.ppfCalculator = (req, res) => {
  try {
    const { yearlyDeposit, tenure = 15 } = req.body;
    const rate = 7.1; // Current PPF rate
    
    let balance = 0;
    const yearWise = [];
    
    for (let year = 1; year <= tenure; year++) {
      balance = (balance + yearlyDeposit) * (1 + rate / 100);
      yearWise.push({
        year,
        deposit: yearlyDeposit,
        interest: Math.round(balance - (yearlyDeposit * year)),
        balance: Math.round(balance)
      });
    }
    
    const totalDeposit = yearlyDeposit * tenure;
    const totalInterest = balance - totalDeposit;
    
    logger.info('PPF calculation performed');
    
    res.json({
      calculator: 'PPF',
      input: { yearlyDeposit, tenure, rate },
      result: {
        maturityAmount: Math.round(balance),
        totalDeposit,
        totalInterest: Math.round(totalInterest),
        yearWise: yearWise.slice(0, 5)
      }
    });
  } catch (error) {
    logger.error(`PPF calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// NPS Calculator (PREMIUM)
exports.npsCalculator = (req, res) => {
  try {
    const { monthlyContribution, currentAge, retirementAge, expectedReturn } = req.body;
    
    const years = retirementAge - currentAge;
    const months = years * 12;
    const monthlyRate = expectedReturn / 100 / 12;
    
    const totalCorpus = monthlyContribution * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    const totalContribution = monthlyContribution * months;
    const totalReturns = totalCorpus - totalContribution;
    
    // 60% can be withdrawn, 40% for annuity
    const lumpsum = totalCorpus * 0.6;
    const annuityCorpus = totalCorpus * 0.4;
    
    logger.info('NPS calculation performed');
    
    res.json({
      calculator: 'NPS',
      input: { monthlyContribution, currentAge, retirementAge, expectedReturn },
      result: {
        totalCorpus: Math.round(totalCorpus),
        totalContribution: Math.round(totalContribution),
        totalReturns: Math.round(totalReturns),
        lumpsumWithdrawal: Math.round(lumpsum),
        annuityCorpus: Math.round(annuityCorpus)
      }
    });
  } catch (error) {
    logger.error(`NPS calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// EPF Calculator (PREMIUM)
exports.epfCalculator = (req, res) => {
  try {
    const { basicSalary, currentAge, retirementAge, currentEPFBalance = 0, annualIncrement = 5 } = req.body;
    const epfRate = 8.15; // Current EPF rate
    
    const years = retirementAge - currentAge;
    let balance = currentEPFBalance;
    let salary = basicSalary;
    
    for (let year = 1; year <= years; year++) {
      const employeeContribution = salary * 0.12 * 12;
      const employerContribution = salary * 0.0367 * 12; // 3.67% goes to EPF
      const yearlyContribution = employeeContribution + employerContribution;
      
      balance = (balance + yearlyContribution) * (1 + epfRate / 100);
      salary = salary * (1 + annualIncrement / 100);
    }
    
    logger.info('EPF calculation performed');
    
    res.json({
      calculator: 'EPF',
      input: { basicSalary, currentAge, retirementAge, currentEPFBalance, annualIncrement },
      result: {
        maturityAmount: Math.round(balance),
        interestRate: epfRate + '%'
      }
    });
  } catch (error) {
    logger.error(`EPF calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Gratuity Calculator (PREMIUM)
exports.gratuityCalculator = (req, res) => {
  try {
    const { lastDrawnSalary, yearsOfService } = req.body;
    
    // Gratuity = (15 * Last Salary * Years) / 26
    const gratuity = (15 * lastDrawnSalary * yearsOfService) / 26;
    const maxGratuity = 2000000; // Max limit is 20 lakhs
    
    logger.info('Gratuity calculation performed');
    
    res.json({
      calculator: 'Gratuity',
      input: { lastDrawnSalary, yearsOfService },
      result: {
        gratuityAmount: Math.round(Math.min(gratuity, maxGratuity)),
        calculatedAmount: Math.round(gratuity),
        maxLimit: maxGratuity,
        capped: gratuity > maxGratuity
      }
    });
  } catch (error) {
    logger.error(`Gratuity calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Inflation Calculator (PREMIUM)
exports.inflationCalculator = (req, res) => {
  try {
    const { currentValue, inflationRate, years } = req.body;
    
    const futureValue = currentValue * Math.pow((1 + inflationRate / 100), years);
    const purchasingPower = currentValue / Math.pow((1 + inflationRate / 100), years);
    
    logger.info('Inflation calculation performed');
    
    res.json({
      calculator: 'Inflation',
      input: { currentValue, inflationRate, years },
      result: {
        futureValue: Math.round(futureValue),
        purchasingPowerLoss: Math.round(currentValue - purchasingPower),
        effectiveValue: Math.round(purchasingPower)
      }
    });
  } catch (error) {
    logger.error(`Inflation calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Retirement Calculator (PREMIUM)
exports.retirementCalculator = (req, res) => {
  try {
    const { currentAge, retirementAge, lifeExpectancy, monthlyExpenses, inflationRate, expectedReturn } = req.body;
    
    const yearsToRetirement = retirementAge - currentAge;
    const retirementYears = lifeExpectancy - retirementAge;
    
    // Calculate future monthly expenses
    const futureMonthlyExpenses = monthlyExpenses * Math.pow((1 + inflationRate / 100), yearsToRetirement);
    
    // Calculate corpus needed
    const realReturn = ((1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1);
    const corpusNeeded = futureMonthlyExpenses * 12 * ((1 - Math.pow(1 + realReturn, -retirementYears)) / realReturn);
    
    // Monthly investment needed
    const monthlyRate = expectedReturn / 100 / 12;
    const months = yearsToRetirement * 12;
    const monthlyInvestment = corpusNeeded / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    
    logger.info('Retirement calculation performed');
    
    res.json({
      calculator: 'Retirement',
      input: { currentAge, retirementAge, lifeExpectancy, monthlyExpenses, inflationRate, expectedReturn },
      result: {
        corpusNeeded: Math.round(corpusNeeded),
        monthlyInvestmentNeeded: Math.round(monthlyInvestment),
        futureMonthlyExpenses: Math.round(futureMonthlyExpenses),
        retirementYears
      }
    });
  } catch (error) {
    logger.error(`Retirement calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Home Loan Calculator (PREMIUM)
exports.homeLoanCalculator = (req, res) => {
  try {
    const { propertyValue, downPayment, rate, tenure } = req.body;
    
    const loanAmount = propertyValue - downPayment;
    const monthlyRate = rate / 100 / 12;
    const months = tenure * 12;
    
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanAmount;
    
    logger.info('Home Loan calculation performed');
    
    res.json({
      calculator: 'Home Loan',
      input: { propertyValue, downPayment, rate, tenure },
      result: {
        loanAmount,
        monthlyEmi: Math.round(emi),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest),
        downPaymentPercent: ((downPayment / propertyValue) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    logger.error(`Home Loan calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Car Loan Calculator (PREMIUM)
exports.carLoanCalculator = (req, res) => {
  try {
    const { carPrice, downPayment, rate, tenure } = req.body;
    
    const loanAmount = carPrice - downPayment;
    const monthlyRate = rate / 100 / 12;
    const months = tenure * 12;
    
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanAmount;
    
    logger.info('Car Loan calculation performed');
    
    res.json({
      calculator: 'Car Loan',
      input: { carPrice, downPayment, rate, tenure },
      result: {
        loanAmount,
        monthlyEmi: Math.round(emi),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest)
      }
    });
  } catch (error) {
    logger.error(`Car Loan calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Personal Loan Calculator (PREMIUM)
exports.personalLoanCalculator = (req, res) => {
  try {
    const { loanAmount, rate, tenure } = req.body;
    
    const monthlyRate = rate / 100 / 12;
    const months = tenure * 12;
    
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanAmount;
    
    logger.info('Personal Loan calculation performed');
    
    res.json({
      calculator: 'Personal Loan',
      input: { loanAmount, rate, tenure },
      result: {
        monthlyEmi: Math.round(emi),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest)
      }
    });
  } catch (error) {
    logger.error(`Personal Loan calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Education Loan Calculator (PREMIUM)
exports.educationLoanCalculator = (req, res) => {
  try {
    const { loanAmount, rate, tenure, moratoriumPeriod = 1 } = req.body;
    
    const monthlyRate = rate / 100 / 12;
    const months = tenure * 12;
    
    // Interest during moratorium
    const moratoriumInterest = loanAmount * (rate / 100) * moratoriumPeriod;
    const totalLoan = loanAmount + moratoriumInterest;
    
    const emi = totalLoan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanAmount;
    
    logger.info('Education Loan calculation performed');
    
    res.json({
      calculator: 'Education Loan',
      input: { loanAmount, rate, tenure, moratoriumPeriod },
      result: {
        moratoriumInterest: Math.round(moratoriumInterest),
        effectiveLoan: Math.round(totalLoan),
        monthlyEmi: Math.round(emi),
        totalPayment: Math.round(totalPayment),
        totalInterest: Math.round(totalInterest)
      }
    });
  } catch (error) {
    logger.error(`Education Loan calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// SWP Calculator (PREMIUM)
exports.swpCalculator = (req, res) => {
  try {
    const { investment, monthlyWithdrawal, expectedReturn, tenure } = req.body;
    
    const monthlyRate = expectedReturn / 100 / 12;
    const months = tenure * 12;
    
    let balance = investment;
    let totalWithdrawn = 0;
    
    for (let i = 0; i < months && balance > 0; i++) {
      balance = balance * (1 + monthlyRate) - monthlyWithdrawal;
      totalWithdrawn += Math.min(monthlyWithdrawal, balance + monthlyWithdrawal);
    }
    
    const finalBalance = Math.max(0, balance);
    
    logger.info('SWP calculation performed');
    
    res.json({
      calculator: 'SWP',
      input: { investment, monthlyWithdrawal, expectedReturn, tenure },
      result: {
        finalBalance: Math.round(finalBalance),
        totalWithdrawn: Math.round(totalWithdrawn),
        sustainabilityYears: balance > 0 ? tenure : (totalWithdrawn / monthlyWithdrawal / 12).toFixed(1)
      }
    });
  } catch (error) {
    logger.error(`SWP calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Goal Planning Calculator (PREMIUM)
exports.goalPlanningCalculator = (req, res) => {
  try {
    const { goalAmount, currentSavings, years, expectedReturn, inflationRate = 6 } = req.body;
    
    // Adjust goal for inflation
    const adjustedGoal = goalAmount * Math.pow((1 + inflationRate / 100), years);
    
    // Current savings future value
    const savingsFutureValue = currentSavings * Math.pow((1 + expectedReturn / 100), years);
    
    // Amount needed from new investments
    const amountNeeded = adjustedGoal - savingsFutureValue;
    
    // Monthly SIP required
    const monthlyRate = expectedReturn / 100 / 12;
    const months = years * 12;
    const monthlySip = amountNeeded / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    
    logger.info('Goal Planning calculation performed');
    
    res.json({
      calculator: 'Goal Planning',
      input: { goalAmount, currentSavings, years, expectedReturn, inflationRate },
      result: {
        adjustedGoal: Math.round(adjustedGoal),
        savingsFutureValue: Math.round(savingsFutureValue),
        additionalAmountNeeded: Math.round(Math.max(0, amountNeeded)),
        monthlySipRequired: Math.round(Math.max(0, monthlySip))
      }
    });
  } catch (error) {
    logger.error(`Goal Planning calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// CAGR Calculator (PREMIUM)
exports.cagrCalculator = (req, res) => {
  try {
    const { initialValue, finalValue, years } = req.body;
    
    const cagr = (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
    const absoluteReturn = ((finalValue - initialValue) / initialValue) * 100;
    
    logger.info('CAGR calculation performed');
    
    res.json({
      calculator: 'CAGR',
      input: { initialValue, finalValue, years },
      result: {
        cagr: cagr.toFixed(2) + '%',
        absoluteReturn: absoluteReturn.toFixed(2) + '%',
        totalGain: finalValue - initialValue
      }
    });
  } catch (error) {
    logger.error(`CAGR calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};

// Tax Calculator (PREMIUM)
exports.taxCalculator = (req, res) => {
  try {
    const { grossIncome, deductions80C = 0, deductions80D = 0, otherDeductions = 0, regime = 'old' } = req.body;
    
    let taxableIncome = grossIncome;
    let tax = 0;
    
    if (regime === 'old') {
      // Old regime with deductions
      const standardDeduction = 50000;
      taxableIncome = grossIncome - standardDeduction - Math.min(deductions80C, 150000) - Math.min(deductions80D, 100000) - otherDeductions;
      taxableIncome = Math.max(0, taxableIncome);
      
      // Old regime slabs
      if (taxableIncome > 1000000) {
        tax = 12500 + 100000 + (taxableIncome - 1000000) * 0.30;
      } else if (taxableIncome > 500000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
      } else if (taxableIncome > 250000) {
        tax = (taxableIncome - 250000) * 0.05;
      }
    } else {
      // New regime
      const standardDeduction = 75000;
      taxableIncome = grossIncome - standardDeduction;
      
      // New regime slabs (FY 2024-25)
      if (taxableIncome > 1500000) {
        tax = 15000 + 20000 + 30000 + 60000 + (taxableIncome - 1500000) * 0.30;
      } else if (taxableIncome > 1200000) {
        tax = 15000 + 20000 + 30000 + (taxableIncome - 1200000) * 0.20;
      } else if (taxableIncome > 900000) {
        tax = 15000 + 20000 + (taxableIncome - 900000) * 0.15;
      } else if (taxableIncome > 600000) {
        tax = 15000 + (taxableIncome - 600000) * 0.10;
      } else if (taxableIncome > 300000) {
        tax = (taxableIncome - 300000) * 0.05;
      }
    }
    
    // Add cess
    const cess = tax * 0.04;
    const totalTax = tax + cess;
    
    logger.info('Tax calculation performed');
    
    res.json({
      calculator: 'Tax',
      input: { grossIncome, deductions80C, deductions80D, otherDeductions, regime },
      result: {
        taxableIncome: Math.round(taxableIncome),
        incomeTax: Math.round(tax),
        cess: Math.round(cess),
        totalTax: Math.round(totalTax),
        effectiveTaxRate: ((totalTax / grossIncome) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    logger.error(`Tax calculation error: ${error.message}`);
    res.status(400).json({ error: 'Invalid input parameters' });
  }
};
