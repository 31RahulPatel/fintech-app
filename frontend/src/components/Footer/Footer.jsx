import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiTwitter, FiLinkedin, FiFacebook, FiInstagram,
  FiMail, FiPhone, FiMapPin, FiArrowRight, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './Footer.css';

const Footer = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(null); // 'loading' | 'success' | 'error' | 'exists'
  const [subscribeMsg, setSubscribeMsg] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubscribeStatus('error');
      setSubscribeMsg('Please enter a valid email address.');
      return;
    }

    setSubscribeStatus('loading');
    setSubscribeMsg('');

    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          preferences: { marketUpdates: true, newsletter: true, productUpdates: true }
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSubscribeStatus('success');
        setSubscribeMsg(data.message || 'You\'re subscribed! Check your inbox.');
        setEmail('');
        setTimeout(() => setSubscribeStatus(null), 5000);
      } else if (res.status === 409 || (data.error && data.error.toLowerCase().includes('already'))) {
        setSubscribeStatus('exists');
        setSubscribeMsg('This email is already subscribed.');
        setTimeout(() => setSubscribeStatus(null), 4000);
      } else {
        setSubscribeStatus('error');
        setSubscribeMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setSubscribeStatus('error');
      setSubscribeMsg('Network error. Please try again later.');
    }
  };

  const footerLinks = {
    products: [
      { label: 'Financial Calculators', path: '/calculators' },
      { label: 'Market Data', path: '/market' },
      { label: 'News & Insights', path: '/news' },
      { label: 'Blog', path: '/blog' },
      { label: 'Bazar.ai Chatbot', path: '/chatbot' }
    ],
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
      { label: 'Contact', path: '/contact' }
    ],
    resources: [
      { label: 'Help Center', path: '/help' },
      { label: 'API Documentation', path: '/api-docs' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'Status', path: '/status' }
    ],
    legal: [
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Disclaimer', path: '/disclaimer' }
    ]
  };

  const socialLinks = [
    { icon: <FiTwitter />, url: 'https://twitter.com/fintechops', label: 'Twitter' },
    { icon: <FiLinkedin />, url: 'https://linkedin.com/company/fintechops', label: 'LinkedIn' },
    { icon: <FiFacebook />, url: 'https://facebook.com/fintechops', label: 'Facebook' },
    { icon: <FiInstagram />, url: 'https://instagram.com/fintechops', label: 'Instagram' }
  ];

  return (
    <footer className={`footer ${theme === 'dark' ? 'footer-dark' : ''}`}>
      <div className="footer-newsletter">
        <div className="footer-container">
          <div className="newsletter-content">
            <h3>Stay Updated with FintechOps</h3>
            <p>Get the latest financial news, market updates, and exclusive insights delivered to your inbox.</p>
          </div>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <div className="newsletter-input-wrapper">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="newsletter-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribeStatus === 'loading'}
                required
              />
              <button 
                type="submit" 
                className={`newsletter-btn ${subscribeStatus === 'success' ? 'newsletter-btn-success' : ''}`}
                disabled={subscribeStatus === 'loading' || subscribeStatus === 'success'}
              >
                {subscribeStatus === 'loading' ? 'Subscribing...' : 
                 subscribeStatus === 'success' ? <><FiCheck /> Subscribed</> : 
                 <>Subscribe <FiArrowRight /></>}
              </button>
            </div>
            {subscribeStatus && subscribeStatus !== 'loading' && (
              <p className={`newsletter-feedback ${
                subscribeStatus === 'success' ? 'feedback-success' : 
                subscribeStatus === 'exists' ? 'feedback-info' : 'feedback-error'
              }`}>
                {subscribeStatus === 'success' ? <FiCheck /> : 
                 subscribeStatus === 'error' ? <FiAlertCircle /> : <FiMail />}
                {subscribeMsg}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <span className="logo-icon">₹</span>
                <span className="logo-text">FintechOps</span>
              </Link>
              <p className="footer-tagline">
                Your trusted financial companion. Making finance accessible, understandable, and actionable for everyone.
              </p>
              <div className="footer-contact">
                <div className="contact-item">
                  <FiMail />
                  <span>support@fintechops.com</span>
                </div>
                <div className="contact-item">
                  <FiPhone />
                  <span>+91 1800-XXX-XXXX</span>
                </div>
                <div className="contact-item">
                  <FiMapPin />
                  <span>Mumbai, India</span>
                </div>
              </div>
              <div className="footer-social">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-links-section">
              <h4>Products</h4>
              <ul>
                {footerLinks.products.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-section">
              <h4>Company</h4>
              <ul>
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-section">
              <h4>Resources</h4>
              <ul>
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links-section">
              <h4>Legal</h4>
              <ul>
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <p className="copyright">
            © {currentYear} FintechOps. All rights reserved.
          </p>
          <p className="disclaimer">
            Investments are subject to market risks. Please read all scheme related documents carefully before investing.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
