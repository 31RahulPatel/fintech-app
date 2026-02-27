import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiStar, FiZap, FiShield, FiHeadphones, FiTrendingUp } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Pricing.css';

const Pricing = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started',
      features: [
        '3 Basic Calculators',
        'Market Data (Delayed)',
        'Limited News Access',
        'Basic Blog Access',
        'Community Support'
      ],
      notIncluded: [
        'Premium Calculators',
        'AI Chatbot (Bazar.ai)',
        'Real-time Market Data',
        'Portfolio Tracking',
        'Priority Support'
      ],
      cta: 'Current Plan',
      popular: false,
      current: !user?.isPremium
    },
    {
      name: 'Premium',
      price: { monthly: 999, yearly: 9999 },
      description: 'For serious investors',
      features: [
        'All 20+ Calculators',
        'Real-time Market Data',
        'Full News & Analysis',
        'AI Chatbot (Bazar.ai)',
        'Scheduled Prompts',
        'Portfolio Dashboard',
        'Premium Blog Content',
        'Email Alerts',
        'Priority Support',
        'No Ads'
      ],
      notIncluded: [],
      cta: user?.isPremium ? 'Current Plan' : 'Upgrade Now',
      popular: true,
      current: user?.isPremium
    },
    {
      name: 'Enterprise',
      price: { monthly: 'Custom', yearly: 'Custom' },
      description: 'For teams & businesses',
      features: [
        'Everything in Premium',
        'Custom Integrations',
        'API Access',
        'Dedicated Account Manager',
        'Custom Reports',
        'Team Management',
        'White-label Options',
        'SLA Guarantee',
        'On-premise Deployment'
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      popular: false,
      current: false
    }
  ];

  const features = [
    { icon: <FiZap />, title: 'Lightning Fast', desc: 'Real-time calculations and market data' },
    { icon: <FiShield />, title: 'Bank-grade Security', desc: 'Your data is encrypted and secure' },
    { icon: <FiTrendingUp />, title: 'AI-Powered Insights', desc: 'Smart recommendations just for you' },
    { icon: <FiHeadphones />, title: '24/7 Support', desc: 'Help whenever you need it' }
  ];

  const faqs = [
    { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.' },
    { q: 'Is my payment information secure?', a: 'Absolutely. We use industry-standard encryption and never store your payment details on our servers.' },
    { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.' },
    { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.' }
  ];

  return (
    <div className={`pricing-page ${theme === 'dark' ? 'pricing-dark' : ''}`}>
      <div className="pricing-header">
        <div className="pricing-header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Simple, Transparent Pricing</h1>
            <p>Choose the plan that works best for you</p>
          </motion.div>

          <motion.div 
            className="billing-toggle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button 
              className={billingCycle === 'monthly' ? 'active' : ''}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button 
              className={billingCycle === 'yearly' ? 'active' : ''}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly <span className="save-badge">Save 17%</span>
            </button>
          </motion.div>
        </div>
      </div>

      <div className="pricing-container">
        {/* Pricing Cards */}
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`pricing-card ${plan.popular ? 'popular' : ''} ${plan.current ? 'current' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>

              <div className="plan-price">
                {typeof plan.price[billingCycle] === 'number' ? (
                  <>
                    <span className="currency">₹</span>
                    <span className="amount">{plan.price[billingCycle]}</span>
                    {plan.price[billingCycle] > 0 && (
                      <span className="period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    )}
                  </>
                ) : (
                  <span className="custom-price">{plan.price[billingCycle]}</span>
                )}
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i} className="included">
                    <FiCheck /> {feature}
                  </li>
                ))}
                {plan.notIncluded.map((feature, i) => (
                  <li key={i} className="not-included">
                    <FiCheck /> {feature}
                  </li>
                ))}
              </ul>

              <button 
                className={`plan-cta ${plan.current ? 'current' : ''}`}
                disabled={plan.current}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <section className="features-section">
          <h2>Why Choose FintechOps?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="faq-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Pricing;
