import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import './CalculatorDetail.css';

const CalculatorDetail = () => {
  const { type } = useParams();
  const { theme } = useTheme();

  const calculatorConfig = {
    sip: {
      name: 'SIP Calculator',
      description: 'Calculate returns on your Systematic Investment Plan',
      inputs: [
        { name: 'monthlyInvestment', label: 'Monthly Investment (₹)', type: 'number', min: 500, max: 10000000, default: 10000 },
        { name: 'expectedReturn', label: 'Expected Return Rate (%)', type: 'number', min: 1, max: 30, default: 12 },
        { name: 'timePeriod', label: 'Time Period (Years)', type: 'number', min: 1, max: 40, default: 10 }
      ]
    },
    'compound-interest': {
      name: 'Compound Interest Calculator',
      description: 'Calculate compound interest on your investments',
      inputs: [
        { name: 'principal', label: 'Principal Amount (₹)', type: 'number', min: 1000, max: 100000000, default: 100000 },
        { name: 'rate', label: 'Interest Rate (%)', type: 'number', min: 1, max: 30, default: 10 },
        { name: 'time', label: 'Time Period (Years)', type: 'number', min: 1, max: 50, default: 5 },
        { name: 'compounding', label: 'Compounding Frequency', type: 'select', options: [
          { value: 1, label: 'Annually' },
          { value: 2, label: 'Semi-Annually' },
          { value: 4, label: 'Quarterly' },
          { value: 12, label: 'Monthly' }
        ], default: 12 }
      ]
    },
    lumpsum: {
      name: 'Lumpsum Calculator',
      description: 'Calculate returns on one-time investments',
      inputs: [
        { name: 'amount', label: 'Investment Amount (₹)', type: 'number', min: 1000, max: 100000000, default: 100000 },
        { name: 'expectedReturn', label: 'Expected Return Rate (%)', type: 'number', min: 1, max: 30, default: 12 },
        { name: 'timePeriod', label: 'Time Period (Years)', type: 'number', min: 1, max: 40, default: 10 }
      ]
    }
  };

  const config = calculatorConfig[type] || calculatorConfig.sip;

  const [inputs, setInputs] = useState(() => {
    const initial = {};
    config.inputs.forEach(input => {
      initial[input.name] = input.default;
    });
    return initial;
  });

  const handleInputChange = (name, value) => {
    setInputs(prev => ({ ...prev, [name]: Number(value) }));
  };

  const resetInputs = () => {
    const initial = {};
    config.inputs.forEach(input => {
      initial[input.name] = input.default;
    });
    setInputs(initial);
  };

  const results = useMemo(() => {
    if (type === 'sip') {
      const P = inputs.monthlyInvestment;
      const r = inputs.expectedReturn / 100 / 12;
      const n = inputs.timePeriod * 12;
      const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const totalInvestment = P * n;
      const returns = futureValue - totalInvestment;
      
      const chartData = [];
      for (let year = 1; year <= inputs.timePeriod; year++) {
        const months = year * 12;
        const fv = P * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
        const invested = P * months;
        chartData.push({
          year: `Year ${year}`,
          invested: Math.round(invested),
          value: Math.round(fv)
        });
      }

      return {
        futureValue: Math.round(futureValue),
        totalInvestment: Math.round(totalInvestment),
        returns: Math.round(returns),
        chartData
      };
    } else if (type === 'compound-interest') {
      const P = inputs.principal;
      const r = inputs.rate / 100;
      const n = inputs.compounding;
      const t = inputs.time;
      const amount = P * Math.pow((1 + r / n), n * t);
      const interest = amount - P;

      const chartData = [];
      for (let year = 1; year <= t; year++) {
        const amt = P * Math.pow((1 + r / n), n * year);
        chartData.push({
          year: `Year ${year}`,
          principal: P,
          value: Math.round(amt)
        });
      }

      return {
        maturityAmount: Math.round(amount),
        totalInterest: Math.round(interest),
        principal: P,
        chartData
      };
    } else if (type === 'lumpsum') {
      const P = inputs.amount;
      const r = inputs.expectedReturn / 100;
      const t = inputs.timePeriod;
      const futureValue = P * Math.pow((1 + r), t);
      const returns = futureValue - P;

      const chartData = [];
      for (let year = 1; year <= t; year++) {
        const fv = P * Math.pow((1 + r), year);
        chartData.push({
          year: `Year ${year}`,
          invested: P,
          value: Math.round(fv)
        });
      }

      return {
        futureValue: Math.round(futureValue),
        totalInvestment: P,
        returns: Math.round(returns),
        chartData
      };
    }
    return {};
  }, [type, inputs]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className={`calculator-detail ${theme === 'dark' ? 'calculator-detail-dark' : ''}`}>
      <div className="calculator-detail-container">
        <div className="calculator-header">
          <Link to="/calculators" className="back-link">
            <FiArrowLeft /> Back to Calculators
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>{config.name}</h1>
            <p>{config.description}</p>
          </motion.div>
        </div>

        <div className="calculator-content">
          <motion.div 
            className="calculator-inputs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inputs-header">
              <h2>Enter Details</h2>
              <button className="reset-btn" onClick={resetInputs}>
                <FiRefreshCw /> Reset
              </button>
            </div>

            {config.inputs.map(input => (
              <div key={input.name} className="input-group">
                <label>{input.label}</label>
                {input.type === 'select' ? (
                  <select
                    value={inputs[input.name]}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                  >
                    {input.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      type="range"
                      min={input.min}
                      max={input.max}
                      value={inputs[input.name]}
                      onChange={(e) => handleInputChange(input.name, e.target.value)}
                    />
                    <div className="input-value">
                      <input
                        type="number"
                        value={inputs[input.name]}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        min={input.min}
                        max={input.max}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </motion.div>

          <motion.div 
            className="calculator-results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="results-summary">
              <div className="result-card primary">
                <span className="result-label">
                  {type === 'compound-interest' ? 'Maturity Amount' : 'Future Value'}
                </span>
                <span className="result-value">
                  {formatCurrency(results.futureValue || results.maturityAmount)}
                </span>
              </div>
              <div className="result-card">
                <span className="result-label">
                  {type === 'compound-interest' ? 'Principal' : 'Total Investment'}
                </span>
                <span className="result-value">
                  {formatCurrency(results.totalInvestment || results.principal)}
                </span>
              </div>
              <div className="result-card">
                <span className="result-label">
                  {type === 'compound-interest' ? 'Total Interest' : 'Est. Returns'}
                </span>
                <span className="result-value success">
                  {formatCurrency(results.returns || results.totalInterest)}
                </span>
              </div>
            </div>

            <div className="results-chart">
              <h3>Growth Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="year" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: theme === 'dark' ? '#1f2937' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Line type="monotone" dataKey="invested" stroke="#6b7280" strokeWidth={2} name="Invested" dot={false} />
                  <Line type="monotone" dataKey="value" stroke="#fb8500" strokeWidth={3} name="Value" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="disclaimer">
              <FiInfo />
              <p>This calculator provides estimates based on the inputs provided. Actual returns may vary based on market conditions and other factors.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorDetail;
